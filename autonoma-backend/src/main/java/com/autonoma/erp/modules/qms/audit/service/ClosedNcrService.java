package com.autonoma.erp.modules.qms.audit.service;

import com.autonoma.erp.modules.qms.audit.entity.AuditObservation;
import com.autonoma.erp.modules.qms.audit.entity.AuditObservationDetail;
import com.autonoma.erp.modules.qms.audit.entity.AuditSchedule;
import com.autonoma.erp.modules.qms.audit.entity.NcrReworkLog;
import com.autonoma.erp.modules.qms.audit.repository.AuditObservationRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository;
import com.autonoma.erp.modules.qms.audit.repository.NcrReworkLogRepository;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service responsible for keeping {@code QMS_NCR_REWORK_LOG} in sync with
 * {@code QMS_AUDIT_OBSERVATION_DETAIL} entries.
 *
 * <p>
 * Business rules:
 * <ul>
 * <li>Observation status {@code NC} or {@code OFI} → create/update one log
 * entry per detail row.</li>
 * <li>Observation status {@code COMPLIANCE} (or any other) → remove any
 * existing log entry.</li>
 * <li>Duplicate prevention: keyed by {@code OBSERVATION_DETAIL_ID}; never
 * insert twice.</li>
 * <li>Initial workflow values (only set on first insert, never overwritten):
 * {@code WORKFLOW_STATUS=Pending}, {@code APPROVAL_STATUS=Open},
 * {@code REWORK_STATUS=Pending},
 * {@code ASSIGNED_USER=null}, {@code COMPLETED_DATE=null},
 * {@code CLOSED_DATE=null}.</li>
 * <li>Content fields (clause, criteria, status, remarks, attachment) are
 * updated on every save
 * so the log stays current with the observation.</li>
 * </ul>
 */
@Service
public class ClosedNcrService {

    @Autowired
    private NcrReworkLogRepository ncrReworkLogRepository;

    @Autowired
    private AuditObservationRepository auditObservationRepository;

    @Autowired
    private AuditScheduleRepository auditScheduleRepository;

    @Autowired
    private com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository appNotificationRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditObservationDetailRepository auditObservationDetailRepository;


    private void sendNcrNotification(String recipientInput, String title, String message, String linkUrl) {
        if (recipientInput == null || recipientInput.trim().isEmpty())
            return;

        String lookupKey = recipientInput;
        if (recipientInput.contains(" - ")) {
            lookupKey = recipientInput.split(" - ")[1].trim();
        }

        employeeMasterRepository.findByEmpCodeOrName(lookupKey).ifPresent(emp -> {
            com.autonoma.erp.modules.platform.notification.entity.AppNotification notification = new com.autonoma.erp.modules.platform.notification.entity.AppNotification();
            notification.setRecipientEmpId(emp.getId());
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setLinkUrl(linkUrl);
            notification.setIsRead(false);
            appNotificationRepository.save(notification);
        });
    }

    // ── Public API ────────────────────────────────────────────────────────────


    /**
     * Updates NCR details and workflow statuses in a single transaction.
     */
    @Transactional
    public void updateWorkflowStatusAfterSave(
            Long detailId,
            String rootCause,
            String correctiveAction,
            String preventiveAction,
            java.util.Date targetDate,
            String remarks,
            String attachmentPath) {

        // 1. Fetch the observation detail
        AuditObservationDetail detail = auditObservationDetailRepository.findById(detailId)
                .orElseThrow(() -> new RuntimeException("Observation detail record not found"));

        // Mandatory fields check
        if (rootCause == null || rootCause.trim().isEmpty() ||
                correctiveAction == null || correctiveAction.trim().isEmpty() ||
                preventiveAction == null || preventiveAction.trim().isEmpty()) {
            throw new IllegalArgumentException("Mandatory NCR/Rework details are missing");
        }

        // Save NCR Details in AuditObservationDetail
        detail.setRootCause(rootCause);
        detail.setCorrectiveAction(correctiveAction);
        detail.setPreventiveAction(preventiveAction);
        detail.setTargetDate(targetDate);
        detail.setComments(remarks);
        detail.setApprovalStatus("PENDING FOR VERIFY");
        detail.setNcrStatus("COMPLETED");
        detail.setUpdatedAt(new java.util.Date());
        detail.setUpdatedBy(SecurityUtils.getCurrentUserId());
        auditObservationDetailRepository.save(detail);

        // 2. Resolve the latest rework log entry
        Optional<NcrReworkLog> latestLogOpt = ncrReworkLogRepository.findTopByObservationDetailIdOrderByReworkNoDesc(detailId);
        
        NcrReworkLog log;
        boolean isReworkCycle = false;
        
        if (latestLogOpt.isPresent()) {
            NcrReworkLog prevLog = latestLogOpt.get();
            // If the latest log entry was rejected or unresolved, this is a new rework submission cycle
            if ("REJECTED".equalsIgnoreCase(prevLog.getVerifyStatus()) || "UNRESOLVED".equalsIgnoreCase(prevLog.getNcrStatus())) {
                isReworkCycle = true;
                log = new NcrReworkLog();
                log.setObservationDetailId(detailId);
                log.setReworkNo(prevLog.getReworkNo() + 1);
                
                // Copy metadata from previous log
                log.setObservationId(prevLog.getObservationId());
                log.setAuditScheduleId(prevLog.getAuditScheduleId());
                log.setAuditId(prevLog.getAuditId());
                log.setClause(prevLog.getClause());
                log.setCriteria(prevLog.getCriteria());
                log.setStatus(prevLog.getStatus());
                log.setDepartmentId(prevLog.getDepartmentId());
                
                log.setCreatedBy(SecurityUtils.getCurrentUserId());
                log.setCreatedDate(LocalDateTime.now());
            } else {
                // If it is still pending verify (pre-review edit), update it in place
                log = prevLog;
            }
        } else {
            // First time submission
            log = new NcrReworkLog();
            log.setObservationDetailId(detailId);
            if (detail.getAuditObservation() != null) {
                log.setObservationId(detail.getAuditObservation().getId());
                log.setAuditId(detail.getAuditObservation().getAuditScheduleNo());
                log.setDepartmentId(detail.getAuditObservation().getDepartmentId());
            }
            log.setClause(detail.getClause());
            log.setCriteria(detail.getCriteriaDetails());
            log.setStatus(detail.getObservationStatus());
            log.setReworkNo(1);
            log.setCreatedBy(SecurityUtils.getCurrentUserId());
            log.setCreatedDate(LocalDateTime.now());
        }

        // Save new CAPA content and remarks
        log.setNcrNo(detail.getNcrNo());
        log.setRootCause(rootCause);
        log.setCorrectiveAction(correctiveAction);
        log.setPreventiveAction(preventiveAction);
        log.setRemarks(remarks);
        if (attachmentPath != null) {
            log.setAttachment(attachmentPath);
        } else if (detail.getAttachmentPath() != null) {
            log.setAttachment(detail.getAttachmentPath());
        }

        // Reset all workflow and verification statuses for verification
        log.setNcrStatus("COMPLETED");
        log.setVerifyStatus("PENDING FOR VERIFY");
        log.setWorkflowStatus("PENDING");
        log.setApprovalStatus("PENDING");
        log.setReworkStatus("PENDING");
        log.setUpdatedDate(LocalDateTime.now());
        log.setUpdatedBy(SecurityUtils.getCurrentUserId());

        ncrReworkLogRepository.save(log);

        // 3. Send Notification to Verifier / Approver (NCR Approver or Auditor)
        if (detail.getAuditObservation() != null) {
            String scheduleNo = detail.getAuditObservation().getAuditScheduleNo();
            if (scheduleNo != null) {
                auditScheduleRepository.findByScheduleNoIgnoreCase(scheduleNo.trim()).ifPresent(schedule -> {
                    Long verifierEmpId = schedule.getNcrApprovedById() != null ? schedule.getNcrApprovedById() : schedule.getAuditorId();
                    if (verifierEmpId != null) {
                        employeeMasterRepository.findById(verifierEmpId).ifPresent(emp -> {
                            com.autonoma.erp.modules.platform.notification.entity.AppNotification notification = new com.autonoma.erp.modules.platform.notification.entity.AppNotification();
                            notification.setRecipientEmpId(emp.getId());
                            notification.setTitle("NCR Closure Submitted: " + detail.getNcrNo());
                            notification.setMessage(String.format("Auditee %s has submitted CAPA details for NCR %s. Please review and verify.",
                                    detail.getAuditee(), detail.getNcrNo()));
                            notification.setLinkUrl("/qms/audit/ncr/approval");
                            notification.setIsRead(false);
                            appNotificationRepository.save(notification);
                        });
                    }
                });
            }
        }
    }


    /**
     * Called after every successful Audit Observation save (POST and PUT).
     * Runs in the same transaction — any failure here rolls back the whole
     * observation save.
     *
     * @param observation the freshly-saved observation (with populated {@code id}
     *                    and {@code details})
     */
    @Transactional
    public void syncClosedNcr(AuditObservation observation) {
        if (observation == null || observation.getDetails() == null) {
            return;
        }

        String currentUserId = SecurityUtils.getCurrentUserId();

        // Resolve the AuditSchedule entity ID once per observation (for
        // AUDIT_SCHEDULE_ID FK)
        Long resolvedScheduleId = resolveScheduleId(observation.getAuditScheduleNo());

        for (AuditObservationDetail detail : observation.getDetails()) {
            String status = detail.getObservationStatus();

            if (isNcrOrOfiStatus(status)) {
                createOrUpdateReworkLog(observation, detail, resolvedScheduleId, currentUserId);
            } else {
                removeReworkLogIfExists(detail);
            }
        }
    }

    /**
     * Deletes all rework log entries linked to the details of the given
     * observation.
     * Used when an observation is deleted.
     *
     * @param observationId the ID of the observation being deleted
     */
    @Transactional
    public void deleteClosedNcrForObservation(Long observationId) {
        if (observationId == null) {
            return;
        }
        auditObservationRepository.findById(observationId).ifPresent(obs -> {
            if (obs.getDetails() != null) {
                for (AuditObservationDetail detail : obs.getDetails()) {
                    ncrReworkLogRepository.deleteByObservationDetailId(detail.getId());
                }
            }
        });
        System.out.println(
                "[ClosedNcrService] Cleaned up QMS_NCR_REWORK_LOG records for observation ID: " + observationId);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Returns {@code true} when the status requires an NCR/Rework log entry.
     * Matches: NC, NCR (legacy alias), OFI — case-insensitive.
     */
    private boolean isNcrOrOfiStatus(String status) {
        return "NC".equalsIgnoreCase(status)
                || "NCR".equalsIgnoreCase(status)
                || "OFI".equalsIgnoreCase(status);
    }

    /**
     * Resolves the numeric {@code QMS_AUDIT_SCHEDULE.ID} from a schedule number
     * string.
     * Returns {@code null} if the schedule number is blank or not found.
     */
    private Long resolveScheduleId(String scheduleNo) {
        if (scheduleNo == null || scheduleNo.trim().isEmpty()) {
            return null;
        }
        return auditScheduleRepository.findByScheduleNoIgnoreCase(scheduleNo.trim())
                .map(AuditSchedule::getId)
                .orElse(null);
    }

    /**
     * Creates a new {@code NcrReworkLog} if one does not exist for the given
     * detail,
     * or updates the mutable content fields of the existing log.
     *
     * <p>
     * Workflow/state fields ({@code workflowStatus}, {@code approvalStatus},
     * {@code reworkStatus},
     * {@code assignedUser}, {@code completedDate}, {@code closedDate}) are set only
     * on <em>first insert</em>
     * to preserve any workflow progress made after initial creation.
     */
    private void createOrUpdateReworkLog(
            AuditObservation observation,
            AuditObservationDetail detail,
            Long resolvedScheduleId,
            String currentUserId) {

        Optional<NcrReworkLog> existingOpt = ncrReworkLogRepository.findByObservationDetailId(detail.getId());
        boolean isNew = existingOpt.isEmpty();
        NcrReworkLog log = existingOpt.orElse(new NcrReworkLog());

        // ── Fields always kept up-to-date (content from the observation/detail) ──
        log.setObservationDetailId(detail.getId());
        log.setNcrNo(detail.getNcrNo());
        log.setObservationId(observation.getId());
        log.setAuditScheduleId(resolvedScheduleId);
        log.setAuditId(observation.getAuditScheduleNo()); // denormalised string key
        // checklistId — no scalar checklist ID on the detail entity; leave null
        log.setClause(detail.getClause());
        log.setCriteria(detail.getCriteriaDetails());
        log.setStatus(detail.getObservationStatus());
        log.setRemarks(detail.getComments());
        log.setAttachment(detail.getAttachmentPath());
        log.setDepartmentId(observation.getDepartmentId());
        // companyId / branchId — not tracked on observation yet; remain null

        // ── Legacy rework fields (keep existing behaviour) ────────────────────────
        if (log.getReworkNo() == null) {
            log.setReworkNo(1);
        }
        log.setSubmittedBy(currentUserId);
        log.setSubmittedAt(LocalDateTime.now());
        log.setRootCause(detail.getRootCause());
        log.setCorrectiveAction(detail.getCorrectiveAction());
        log.setPreventiveAction(detail.getPreventiveAction());

        if (isNew) {
            log.setNcrStatus("PENDING");
            log.setVerifyStatus("PENDING");

            // ── Initial workflow values — set only on first insert ────────────────
            log.setWorkflowStatus("PENDING");
            log.setApprovalStatus("PENDING");
            log.setReworkStatus("PENDING");
            log.setAssignedUser(null);
            log.setCompletedDate(null);
            log.setClosedDate(null);

            // Audit fields
            log.setCreatedBy(currentUserId);
            log.setCreatedDate(LocalDateTime.now());
            log.setUpdatedBy(currentUserId);
            log.setUpdatedDate(LocalDateTime.now());

            System.out.println("[ClosedNcrService] Creating new NCR Rework Log for observation "
                    + observation.getId() + ", detail " + detail.getId()
                    + ", status=" + detail.getObservationStatus());

            // Send notification to Auditee
            sendNcrNotification(
                    observation.getAuditee(),
                    "New " + detail.getObservationStatus() + " Finding Assigned",
                    String.format("You have received a new %s finding for Schedule %s (Clause %s). Please submit corrective action.",
                            detail.getObservationStatus(), observation.getAuditScheduleNo(), detail.getClause()),
                    "/qms/audit/ncr/close");
        } else {
            // Keep existing status if set, otherwise fallback to PENDING
            if (log.getNcrStatus() == null) {
                log.setNcrStatus("PENDING");
            }
            if (log.getVerifyStatus() == null) {
                log.setVerifyStatus("PENDING");
            }

            // ── On update: refresh audit trail only ───────────────────────────────
            log.setUpdatedBy(currentUserId);
            log.setUpdatedDate(LocalDateTime.now());

            System.out.println("[ClosedNcrService] Updating NCR Rework Log (id=" + log.getId()
                    + ") for observation " + observation.getId()
                    + ", detail " + detail.getId()
                    + ", status=" + detail.getObservationStatus());
        }

        ncrReworkLogRepository.save(log);
    }

    /**
     * Removes the rework log entry for the given detail if one exists
     * (called when the detail status changes to COMPLIANCE or another non-NCR/OFI
     * value).
     */
    private void removeReworkLogIfExists(AuditObservationDetail detail) {
        ncrReworkLogRepository.findByObservationDetailId(detail.getId()).ifPresent(existing -> {
            ncrReworkLogRepository.delete(existing);
            System.out.println("[ClosedNcrService] Removed NCR Rework Log (id=" + existing.getId()
                    + ") for detail " + detail.getId()
                    + " due to status change to " + detail.getObservationStatus());
        });
    }
}

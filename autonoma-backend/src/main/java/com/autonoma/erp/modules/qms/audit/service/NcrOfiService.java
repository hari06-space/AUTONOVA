package com.autonoma.erp.modules.qms.audit.service;

import com.autonoma.erp.model.admin.PrefixCredential;
import com.autonoma.erp.repository.admin.PrefixCredentialRepository;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.platform.notification.entity.AppNotification;
import com.autonoma.erp.modules.qms.audit.entity.AuditObservation;
import com.autonoma.erp.modules.qms.audit.entity.AuditObservationDetail;
import com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditObservationDetailRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditObservationRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.qms.audit.repository.NcrOfiAttachmentRepository;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;
import com.autonoma.erp.modules.platform.files.service.FileService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NcrOfiService {

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.NcrOfiAttachmentRepository attachmentRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.NcrOfiApprovalRepository ncrOfiApprovalRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditObservationDetailRepository observationDetailRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditObservationRepository auditObservationRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.NcrOfiMasterRepository ncrOfiMasterRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.PrefixCredentialRepository prefixCredentialRepository;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository appNotificationRepository;

    @Autowired
    private com.autonoma.erp.modules.platform.notification.service.NotificationService notificationService;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private NcrOfiService self;

    @Autowired
    private ClosedNcrService closedNcrService;

    @Autowired
    private FileService fileService;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository auditScheduleRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository;

    public NcrOfiService() {
    }

    @Transactional
    public void processNcrClosureWithFiles(java.util.Map<String, Object> payload, List<MultipartFile> files) {
        // 1. Process Metadata first (same as processNcrClosure but we'll use the file
        // names later)
        processNcrClosure(payload);

        // 2. Find the saved detail ID
        Number detailId = (Number) payload.get("observationDetailId");

        // 3. Save files to disk and create attachment records
        if (files != null && !files.isEmpty()) {
            List<java.util.Map<String, String>> categories = (List<java.util.Map<String, String>>) payload
                    .get("fileCategories");

            for (int i = 0; i < files.size(); i++) {
                MultipartFile file = files.get(i);
                try {
                    String originalName = file.getOriginalFilename();
                    String category = "GENERAL";
                    if (categories != null && i < categories.size()) {
                        category = categories.get(i).get("docDetails");
                    } else if (categories != null) {
                        final String finalName = originalName;
                        category = categories.stream()
                                .filter(c -> c.get("fileName").equals(finalName))
                                .map(c -> c.get("docDetails"))
                                .findFirst()
                                .orElse("GENERAL");
                    }

                    String relativePath = fileService.saveFile(file, "QMS_NCR");
                    saveAttachment(detailId.intValue(), relativePath, category);
                } catch (IOException e) {
                    throw new RuntimeException("File save failed: " + e.getMessage());
                }
            }
        }

        // 3b. Save attachments that were already uploaded (e.g. via BOSFileUpload)
        List<java.util.Map<String, String>> categories = (List<java.util.Map<String, String>>) payload
                .get("fileCategories");
        if (categories != null) {
            for (java.util.Map<String, String> cat : categories) {
                String serverPath = cat.get("serverFileName");
                if (serverPath == null) {
                    serverPath = cat.get("filePath");
                }
                if (serverPath == null) {
                    serverPath = cat.get("path");
                }
                if (serverPath != null && !serverPath.isEmpty()) {
                    String docType = cat.get("docDetails");
                    if (docType == null) {
                        docType = cat.get("fileType");
                    }
                    if (docType == null) {
                        docType = "GENERAL";
                    }
                    saveAttachment(detailId.intValue(), serverPath, docType);
                }
            }
        }
    }

    @Transactional
    public void processNcrClosure(java.util.Map<String, Object> payload) {
        Number observationDetailId = (Number) payload.get("observationDetailId");
        String type = (String) payload.get("type");
        String rootCause = (String) payload.get("rootCause");
        String correctiveAction = (String) payload.get("correctiveAction");
        String preventiveAction = (String) payload.get("preventiveAction");
        String targetDateStr = (String) payload.get("targetDate");
        String attachmentPath = (String) payload.get("attachmentPath");
        String ncrOfiNo = (String) payload.get("ncrOfiNo");

        // 1. Get AuditObservationDetail record
        AuditObservationDetail detail = observationDetailRepository.findById(observationDetailId.longValue())
                .orElseThrow(() -> new RuntimeException("Observation detail record not found"));

        // Verify that the logged-in user is the assigned Auditee or has QMS Admin permissions
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        boolean isAuthorized = false;
        if (currentUserId != null) {
            // Check dynamic QMS Admin authorization (QM1240 - Close NC/OFI Findings page)
            com.autonoma.erp.model.admin.BosPage page = bosPageRepository.findByPageCode("QM1240").orElse(null);
            if (page != null) {
                com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                        .findByUserIdAndPageId(currentUserId, page.getPageId());
                if (auth != null && Integer.valueOf(1).equals(auth.getAdditional1())) {
                    isAuthorized = true;
                }
            }
            // Check if logged-in user is the assigned Auditee
            if (!isAuthorized) {
                com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(currentUserId).orElse(null);
                if (credential != null && credential.getEmpId() != null) {
                    Long loggedInEmpId = credential.getEmpId();
                    if (detail.getAuditObservation() != null) {
                        String schNo = detail.getAuditObservation().getAuditScheduleNo();
                        if (schNo != null) {
                            java.util.Optional<com.autonoma.erp.modules.qms.audit.entity.AuditSchedule> scheduleOpt = auditScheduleRepository.findByScheduleNoIgnoreCase(schNo.trim());
                            if (scheduleOpt.isPresent() && loggedInEmpId.equals(scheduleOpt.get().getAuditeeId())) {
                                isAuthorized = true;
                            }
                        }
                    }
                }
            }
        }
        if (!isAuthorized) {
            throw new RuntimeException("Unauthorized: Only the assigned Auditee of this finding can submit CAPA details.");
        }

        String remarks = (String) payload.get("remarks");
        if (remarks == null) {
            remarks = (String) payload.get("comments");
        }

        java.util.Date targetDate = null;
        if (targetDateStr != null && targetDateStr.length() >= 10) {
            try {
                targetDate = java.sql.Date.valueOf(LocalDate.parse(targetDateStr.substring(0, 10)));
            } catch (Exception e) {
                targetDate = java.sql.Date.valueOf(LocalDate.now().plusDays(30));
            }
        } else {
            targetDate = java.sql.Date.valueOf(LocalDate.now().plusDays(30));
        }

        // Use provided No or generate if not already set
        if (detail.getNcrNo() == null || detail.getNcrNo().isEmpty()) {
            if (ncrOfiNo != null && !ncrOfiNo.isEmpty() && !ncrOfiNo.equals("N/A")) {
                detail.setNcrNo(ncrOfiNo);
            } else {
                detail.setNcrNo(generateNcrOfiNo(type));
            }
            observationDetailRepository.save(detail);
        }

        // Delegate save details and statuses update to ClosedNcrService in a single
        // transaction
        closedNcrService.updateWorkflowStatusAfterSave(
                observationDetailId.longValue(),
                rootCause,
                correctiveAction,
                preventiveAction,
                targetDate,
                remarks,
                attachmentPath);



        // 2. Legacy single-string attachment path can be kept for backward
        // compatibility if needed
        if (attachmentPath != null && !attachmentPath.isEmpty()) {
            saveAttachment(observationDetailId.intValue(), attachmentPath, "GENERAL");
        }
    }

    public List<com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment> getAttachmentsByDetailId(Integer detailId) {
        return attachmentRepository.findByPageCodeAndRefId("QMS_NCR_OFI", String.valueOf(detailId));
    }

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.NcrReworkLogRepository ncrReworkLogRepository;

    @Transactional
    public void approveNcr(Number observationDetailId, String remarks) {
        observationDetailRepository.findById(observationDetailId.longValue()).ifPresent(detail -> {
            detail.setApprovalStatus("VERIFIED");
            detail.setNcrStatus("COMPLETED");

            // Get current user ID safely
            String userIdStr = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            Integer approverId = null;
            if (userIdStr != null) {
                try {
                    approverId = Integer.parseInt(userIdStr.trim());
                } catch (Exception e) {
                    approverId = 1;
                }
            } else {
                approverId = 1;
            }

            // Save to QMS_NCR_OFI_APPROVAL table
            com.autonoma.erp.modules.qms.audit.entity.NcrOfiApproval approval = new com.autonoma.erp.modules.qms.audit.entity.NcrOfiApproval();
            approval.setNcrOfiId(detail.getId().intValue());
            approval.setApproverId(approverId);
            approval.setApprovalRole("QMS_REVIEWER");
            approval.setStatus("APPROVED");
            approval.setComments(remarks);
            approval.setApprovalDate(java.time.LocalDateTime.now());
            approval.setIsActive(true);
            ncrOfiApprovalRepository.save(approval);

            // Build / append approval history JSON in CANCEL_REMARKS
            java.util.List<java.util.Map<String, Object>> history = new java.util.ArrayList<>();
            String existing = detail.getCancelRemarks();
            if (existing != null && !existing.isBlank()) {
                try {
                    @SuppressWarnings("unchecked")
                    java.util.List<java.util.Map<String, Object>> parsed = objectMapper.readValue(existing,
                            objectMapper.getTypeFactory().constructCollectionType(java.util.List.class,
                                    java.util.Map.class));
                    history.addAll(parsed);
                } catch (Exception e) {
                    // ignore
                }
            }
            int nextRevNo = (detail.getRevNo() != null ? detail.getRevNo() : 0) + 1;
            java.util.Map<String, Object> entry = new java.util.LinkedHashMap<>();
            entry.put("revNo", nextRevNo);
            entry.put("remarks", remarks != null ? remarks.toUpperCase() : "");
            entry.put("approvalComment", "");
            entry.put("rejectedBy", userIdStr);
            entry.put("rejectedAt", java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            entry.put("status", "APPROVED");
            history.add(entry);
            try {
                detail.setCancelRemarks(objectMapper.writeValueAsString(history));
            } catch (Exception e) {
                detail.setCancelRemarks(remarks);
            }
            detail.setRevNo(nextRevNo);

            detail.setUpdatedAt(new java.util.Date());
            detail.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            observationDetailRepository.save(detail);

            // Update corresponding QMS_NCR_REWORK_LOG status
            ncrReworkLogRepository.findByObservationDetailId(detail.getId()).ifPresent(log -> {
                log.setNcrStatus("COMPLETED");
                log.setVerifyStatus("VERIFIED");
                log.setClosedDate(java.time.LocalDateTime.now());
                log.setUpdatedDate(java.time.LocalDateTime.now());
                ncrReworkLogRepository.save(log);
            });

            // Recalculate parent score and check if parent needs closure
            if (detail.getAuditObservation() != null) {
                recalculateParentScore(detail.getAuditObservation());
                checkAndCloseParentObservation(detail.getAuditObservation());
            }
        });
    }

    private void recalculateParentScore(com.autonoma.erp.modules.qms.audit.entity.AuditObservation observation) {
        if (observation == null || observation.getDetails() == null)
            return;

        int compliance = 0;
        int ofi = 0;
        int ncCount = 0;

        for (com.autonoma.erp.modules.qms.audit.entity.AuditObservationDetail detail : observation.getDetails()) {
            String obsStatus = detail.getObservationStatus();
            if ("COMPLIANCE".equalsIgnoreCase(obsStatus)) {
                compliance++;
            } else if ("OFI".equalsIgnoreCase(obsStatus)) {
                ofi++;
            } else if ("NC".equalsIgnoreCase(obsStatus) || "NCR".equalsIgnoreCase(obsStatus)) {
                ncCount++;
            }
        }

        java.util.Date obsDate = observation.getObservationDate();
        long diffDays = 0;
        if (obsDate != null) {
            java.util.Calendar calObs = java.util.Calendar.getInstance();
            calObs.setTime(obsDate);
            calObs.set(java.util.Calendar.HOUR_OF_DAY, 0);
            calObs.set(java.util.Calendar.MINUTE, 0);
            calObs.set(java.util.Calendar.SECOND, 0);
            calObs.set(java.util.Calendar.MILLISECOND, 0);

            java.util.Calendar calToday = java.util.Calendar.getInstance();
            calToday.set(java.util.Calendar.HOUR_OF_DAY, 0);
            calToday.set(java.util.Calendar.MINUTE, 0);
            calToday.set(java.util.Calendar.SECOND, 0);
            calToday.set(java.util.Calendar.MILLISECOND, 0);

            long diffMs = calToday.getTimeInMillis() - calObs.getTimeInMillis();
            diffDays = diffMs / (1000 * 60 * 60 * 24);
            if (diffDays < 0) {
                diffDays = 0;
            }
        }

        int score = 0;
        for (com.autonoma.erp.modules.qms.audit.entity.AuditObservationDetail detail : observation.getDetails()) {
            String obsStatus = detail.getObservationStatus();
            String appStatus = detail.getApprovalStatus();

            if ("COMPLIANCE".equalsIgnoreCase(obsStatus)) {
                score += 1;
            } else if ("OFI".equalsIgnoreCase(obsStatus)) {
                score += 0;
            } else if ("NC".equalsIgnoreCase(obsStatus) || "NCR".equalsIgnoreCase(obsStatus)) {
                if ("CLOSED".equalsIgnoreCase(appStatus)) {
                    score += 0;
                } else {
                    if (diffDays <= 3) {
                        score += -1;
                    } else if (diffDays <= 5) {
                        score += -3;
                    } else if (diffDays <= 8) {
                        score += -5;
                    } else {
                        score += -8;
                    }
                }
            }
        }

        observation.setComplianceCount(compliance);
        observation.setOfiCount(ofi);
        observation.setNcrCount(ncCount);
        int totalDetails = observation.getDetails() != null ? observation.getDetails().size() : 0;
        double percentageScore = totalDetails > 0 ? ((double) compliance * 100.0) / totalDetails : 0.0;
        percentageScore = Math.round(percentageScore * 100.0) / 100.0;
        observation.setAuditScore(percentageScore);

        auditObservationRepository.save(observation);
    }

    private void checkAndCloseParentObservation(
            com.autonoma.erp.modules.qms.audit.entity.AuditObservation observation) {
        if (observation == null || observation.getDetails() == null || observation.getDetails().isEmpty())
            return;

        boolean allResolved = observation.getDetails().stream().allMatch(d -> {
            String obsStatus = d.getObservationStatus();
            String ncrSt = d.getNcrStatus();
            if ("COMPLIANCE".equalsIgnoreCase(obsStatus) ||
                    "PENDING".equalsIgnoreCase(obsStatus) ||
                    "NOT APPLICABLE".equalsIgnoreCase(obsStatus) ||
                    "NOT_APPLICABLE".equalsIgnoreCase(obsStatus) ||
                    "NO ENTRY".equalsIgnoreCase(obsStatus) ||
                    "NO_ENTRY".equalsIgnoreCase(obsStatus))
                return true;
            return "CLOSED".equalsIgnoreCase(ncrSt) || 
                   "COMPLETED".equalsIgnoreCase(ncrSt) || 
                   "VERIFIED".equalsIgnoreCase(d.getApprovalStatus());
        });

        if (allResolved && !"CLOSED".equalsIgnoreCase(observation.getStatus())) {
            observation.setStatus("CLOSED");
            auditObservationRepository.save(observation);
            System.out.println("[NcrOfiService] Observation " + observation.getObservationNo()
                    + " auto-closed — all findings resolved.");
        }
    }

    private void validateVerifierPermission(Long detailId) {
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        boolean isAuthorized = false;
        
        if (currentUserId != null) {
            // Check dynamic QMS Admin authorization (QM1250 - Close NCR Verification page)
            com.autonoma.erp.model.admin.BosPage page = bosPageRepository.findByPageCode("QM1250").orElse(null);
            if (page != null) {
                com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                        .findByUserIdAndPageId(currentUserId, page.getPageId());
                if (auth != null && Integer.valueOf(1).equals(auth.getAdditional1())) {
                    isAuthorized = true;
                }
            }
            if (!isAuthorized) {
                com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(currentUserId).orElse(null);
                if (credential != null && credential.getEmpId() != null) {
                    Long loggedInEmpId = credential.getEmpId();
                    AuditObservationDetail detail = observationDetailRepository.findById(detailId).orElse(null);
                    if (detail != null && detail.getAuditObservation() != null) {
                        String schNo = detail.getAuditObservation().getAuditScheduleNo();
                        if (schNo != null) {
                            java.util.Optional<com.autonoma.erp.modules.qms.audit.entity.AuditSchedule> scheduleOpt = auditScheduleRepository.findByScheduleNoIgnoreCase(schNo.trim());
                            if (scheduleOpt.isPresent()) {
                                com.autonoma.erp.modules.qms.audit.entity.AuditSchedule schedule = scheduleOpt.get();
                                // Authorized if logged-in user is NCR Approver or Auditor on schedule
                                if (loggedInEmpId.equals(schedule.getNcrApprovedById()) || loggedInEmpId.equals(schedule.getAuditorId())) {
                                    isAuthorized = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (!isAuthorized) {
            throw new RuntimeException("Unauthorized: Only the assigned NCR Approver or Auditor of this schedule can verify/reject findings.");
        }
    }

    @Transactional
    public void rejectNcr(Number observationDetailId, String approvalComment, String rejectionComment) {
        validateVerifierPermission(observationDetailId.longValue());
        observationDetailRepository.findById(observationDetailId.longValue()).ifPresent(detail -> {
            detail.setApprovalStatus("REJECTED");
            detail.setNcrStatus("UNRESOLVED");

            // Get current user ID safely
            String userIdStr = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            Integer approverId = null;
            if (userIdStr != null) {
                try {
                    approverId = Integer.parseInt(userIdStr.trim());
                } catch (Exception e) {
                    approverId = 1;
                }
            } else {
                approverId = 1;
            }

            // Save to QMS_NCR_OFI_APPROVAL table
            com.autonoma.erp.modules.qms.audit.entity.NcrOfiApproval approval = new com.autonoma.erp.modules.qms.audit.entity.NcrOfiApproval();
            approval.setNcrOfiId(detail.getId().intValue());
            approval.setApproverId(approverId);
            approval.setApprovalRole("QMS_REVIEWER");
            approval.setStatus("REJECTED");
            approval.setComments(rejectionComment);
            approval.setApprovalDate(java.time.LocalDateTime.now());
            approval.setIsActive(true);
            ncrOfiApprovalRepository.save(approval);

            // Build / append rejection history JSON in CANCEL_REMARKS
            List<java.util.Map<String, Object>> history = new java.util.ArrayList<>();
            String existing = detail.getCancelRemarks();
            if (existing != null && !existing.isBlank()) {
                try {
                    @SuppressWarnings("unchecked")
                    List<java.util.Map<String, Object>> parsed = objectMapper.readValue(existing,
                            objectMapper.getTypeFactory().constructCollectionType(List.class, java.util.Map.class));
                    history.addAll(parsed);
                } catch (Exception e) {
                    java.util.Map<String, Object> legacy = new java.util.LinkedHashMap<>();
                    legacy.put("revNo", 0);
                    legacy.put("remarks", existing);
                    legacy.put("approvalComment", "");
                    legacy.put("rejectedBy", "system");
                    legacy.put("rejectedAt", "-");
                    history.add(legacy);
                }
            }

            int nextRevNo = (detail.getRevNo() != null ? detail.getRevNo() : 0) + 1;

            java.util.Map<String, Object> entry = new java.util.LinkedHashMap<>();
            entry.put("revNo", nextRevNo);
            entry.put("remarks", rejectionComment != null ? rejectionComment.toUpperCase() : "");
            entry.put("approvalComment", approvalComment != null ? approvalComment.toUpperCase() : "");
            entry.put("rejectedBy", userIdStr);
            entry.put("rejectedAt", java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            entry.put("status", "REJECTED");
            history.add(entry);

            try {
                detail.setCancelRemarks(objectMapper.writeValueAsString(history));
            } catch (Exception e) {
                detail.setCancelRemarks(rejectionComment);
            }
            detail.setRevNo(nextRevNo);
            detail.setUpdatedAt(new java.util.Date());
            detail.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            observationDetailRepository.save(detail);

            sendNcrNotification(
                    detail.getAuditee(),
                    "NC/OFI Rejected: " + detail.getNcrNo(),
                    String.format("NC/OFI %s has been rejected by %s. Reason: %s", detail.getNcrNo(),
                            detail.getNcrApprovedBy(), rejectionComment),
                    "/qms/audit/ncr/close");
        });
    }

    /**
     * Verify an NCR from the Close NCR Verification page (QM1250).
     * Sets VERIFY_STATUS = 'VERIFIED' in QMS_NCR_REWORK_LOG and
     * syncs the observation detail approval status to CLOSED.
     */
    @Transactional
    public void verifyNcr(Integer logId, String remarks) {
        String userIdStr = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();

        // 1. Direct JDBC update as primary path — always reliable regardless of entity type
        int updated = jdbcTemplate.update(
            "UPDATE QMS_NCR_REWORK_LOG SET VERIFY_STATUS = 'VERIFIED', NCR_STATUS = 'COMPLETED', " +
            "VERIFIED_BY = ?, VERIFY_DATE = GETDATE(), CLOSED_DATE = GETDATE(), " +
            "UPDATED_BY = ?, UPDATED_DATE = GETDATE() WHERE ID = ?",
            userIdStr, userIdStr, logId);

        if (updated == 0) {
            throw new RuntimeException("NCR Rework Log not found for ID: " + logId + ". Cannot verify.");
        }

        // 2. Get the observation detail ID from rework log for downstream sync
        Long detailId = null;
        try {
            detailId = jdbcTemplate.queryForObject(
                "SELECT OBSERVATION_DETAIL_ID FROM QMS_NCR_REWORK_LOG WHERE ID = ?",
                Long.class, logId);
        } catch (Exception e) {
            System.err.println("[NcrOfiService] Could not fetch detail ID for log " + logId + ": " + e.getMessage());
        }

        if (detailId == null) {
            System.err.println("[NcrOfiService] verifyNcr: No observation detail linked to log " + logId);
            return;
        }

        validateVerifierPermission(detailId);

        // 3. Sync observation detail
        final Long finalDetailId = detailId;
        observationDetailRepository.findById(finalDetailId).ifPresent(detail -> {
            detail.setApprovalStatus("VERIFIED");
            detail.setNcrStatus("COMPLETED");
            detail.setUpdatedAt(new java.util.Date());
            detail.setUpdatedBy(userIdStr);

            // Build / append approval history JSON in CANCEL_REMARKS
            java.util.List<java.util.Map<String, Object>> history = new java.util.ArrayList<>();
            String existing = detail.getCancelRemarks();
            if (existing != null && !existing.isBlank()) {
                try {
                    history.addAll(objectMapper.readValue(existing,
                            objectMapper.getTypeFactory().constructCollectionType(java.util.List.class,
                                    java.util.Map.class)));
                } catch (Exception e) {
                    // ignore malformed JSON
                }
            }
            int nextRevNo = (detail.getRevNo() != null ? detail.getRevNo() : 0) + 1;
            java.util.Map<String, Object> entry = new java.util.LinkedHashMap<>();
            entry.put("revNo", nextRevNo);
            entry.put("remarks", remarks != null ? remarks.toUpperCase() : "");
            entry.put("approvalComment", "");
            entry.put("verifiedBy", userIdStr);
            entry.put("verifiedAt", java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            entry.put("status", "VERIFIED");
            history.add(entry);
            try {
                detail.setCancelRemarks(objectMapper.writeValueAsString(history));
            } catch (Exception e) {
                detail.setCancelRemarks(remarks);
            }
            detail.setRevNo(nextRevNo);
            observationDetailRepository.save(detail);

            // Recalculate parent observation
            if (detail.getAuditObservation() != null) {
                recalculateParentScore(detail.getAuditObservation());
                checkAndCloseParentObservation(detail.getAuditObservation());
            }
        });

        // 4. Record approval entry
        Integer approverId = null;
        if (userIdStr != null) {
            try { approverId = Integer.parseInt(userIdStr.trim()); } catch (Exception e) { approverId = 1; }
        } else { approverId = 1; }

        final Integer finalApproverId = approverId;
        ncrOfiMasterRepository.findByObservationDetailId(finalDetailId.intValue()).ifPresent(master -> {
            com.autonoma.erp.modules.qms.audit.entity.NcrOfiApproval approval = new com.autonoma.erp.modules.qms.audit.entity.NcrOfiApproval();
            approval.setNcrOfiId(master.getId());
            approval.setApproverId(finalApproverId);
            approval.setApprovalRole("QMS_VERIFIER");
            approval.setStatus("VERIFIED");
            approval.setComments(remarks);
            approval.setApprovalDate(java.time.LocalDateTime.now());
            approval.setIsActive(true);
            ncrOfiApprovalRepository.save(approval);
        });

        System.out.println("[NcrOfiService] NCR Rework Log ID " + logId + " VERIFIED by " + userIdStr);
    }

    /**
     * Reject an NCR from the Close NCR Verification page (QM1250).
     * Sets VERIFY_STATUS = 'REJECTED' in QMS_NCR_REWORK_LOG and
     * resets the observation detail status to UNRESOLVED so the auditee must re-submit.
     */
    @Transactional
    public void verifyRejectNcr(Integer logId, String verificationComment, String rejectionReason) {
        String userIdStr = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();

        // 1. Direct JDBC update as primary path
        int updated = jdbcTemplate.update(
            "UPDATE QMS_NCR_REWORK_LOG SET VERIFY_STATUS = 'REJECTED', NCR_STATUS = 'UNRESOLVED', " +
            "VERIFIED_BY = ?, VERIFY_DATE = GETDATE(), " +
            "UPDATED_BY = ?, UPDATED_DATE = GETDATE() WHERE ID = ?",
            userIdStr, userIdStr, logId);

        if (updated == 0) {
            throw new RuntimeException("NCR Rework Log not found for ID: " + logId + ". Cannot reject.");
        }

        // 2. Get observation detail ID
        Long detailId = null;
        try {
            detailId = jdbcTemplate.queryForObject(
                "SELECT OBSERVATION_DETAIL_ID FROM QMS_NCR_REWORK_LOG WHERE ID = ?",
                Long.class, logId);
        } catch (Exception e) {
            System.err.println("[NcrOfiService] Could not fetch detail ID for log " + logId + ": " + e.getMessage());
        }

        if (detailId == null) {
            System.err.println("[NcrOfiService] verifyRejectNcr: No observation detail linked to log " + logId);
            return;
        }

        validateVerifierPermission(detailId);

        final Long finalDetailId = detailId;
        // 3. Sync observation detail back to UNRESOLVED
        observationDetailRepository.findById(finalDetailId).ifPresent(detail -> {
            detail.setApprovalStatus("REJECTED");
            detail.setNcrStatus("UNRESOLVED");
            detail.setUpdatedAt(new java.util.Date());
            detail.setUpdatedBy(userIdStr);

            // Build / append rejection history JSON in CANCEL_REMARKS
            java.util.List<java.util.Map<String, Object>> history = new java.util.ArrayList<>();
            String existing = detail.getCancelRemarks();
            if (existing != null && !existing.isBlank()) {
                try {
                    history.addAll(objectMapper.readValue(existing,
                            objectMapper.getTypeFactory().constructCollectionType(java.util.List.class,
                                    java.util.Map.class)));
                } catch (Exception e) {
                    // ignore
                }
            }
            int nextRevNo = (detail.getRevNo() != null ? detail.getRevNo() : 0) + 1;
            java.util.Map<String, Object> entry = new java.util.LinkedHashMap<>();
            entry.put("revNo", nextRevNo);
            entry.put("remarks", rejectionReason != null ? rejectionReason.toUpperCase() : "");
            entry.put("approvalComment", verificationComment != null ? verificationComment.toUpperCase() : "");
            entry.put("rejectedBy", userIdStr);
            entry.put("rejectedAt", java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            entry.put("status", "REJECTED");
            history.add(entry);
            try {
                detail.setCancelRemarks(objectMapper.writeValueAsString(history));
            } catch (Exception e) {
                detail.setCancelRemarks(rejectionReason);
            }
            detail.setRevNo(nextRevNo);
            observationDetailRepository.save(detail);

            // Notify auditee about rejection
            sendNcrNotification(
                    detail.getAuditee(),
                    "NCR Verification Rejected: " + detail.getNcrNo(),
                    String.format("NCR %s has been rejected during verification by %s. Reason: %s",
                            detail.getNcrNo(), userIdStr, rejectionReason),
                    "/qms/audit/ncr/close");

            // 3. Record approval entry
            Integer approverId = null;
            if (userIdStr != null) {
                try { approverId = Integer.parseInt(userIdStr.trim()); } catch (Exception e) { approverId = 1; }
            } else { approverId = 1; }
            
            final Integer finalApproverId = approverId;
            if (finalDetailId != null) {
                ncrOfiMasterRepository.findByObservationDetailId(finalDetailId.intValue()).ifPresent(master -> {
                    com.autonoma.erp.modules.qms.audit.entity.NcrOfiApproval approval = new com.autonoma.erp.modules.qms.audit.entity.NcrOfiApproval();
                    approval.setNcrOfiId(master.getId());
                    approval.setApproverId(finalApproverId);
                    approval.setApprovalRole("QMS_VERIFIER");
                    approval.setStatus("REJECTED");
                    approval.setComments(rejectionReason);
                    approval.setApprovalDate(java.time.LocalDateTime.now());
                    approval.setIsActive(true);
                    ncrOfiApprovalRepository.save(approval);
                });
            }

            System.out.println("[NcrOfiService] NCR Rework Log ID " + logId + " REJECTED by " + userIdStr);
        });
    }

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
            appNotificationRepository.save(notification);

//            notificationService.sendMeetingNotification(emp.getEmployeeName(), emp.getOfficeMail(), title, message);
        });
    }

    @Transactional
    public void reworkNcr(Number observationDetailId, String remarks) {
        observationDetailRepository.findById(observationDetailId.longValue()).ifPresent(detail -> {
            detail.setApprovalStatus("REWORK");
            detail.setNcrStatus("REWORK");

            // Get current user ID safely
            String userIdStr = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            Integer approverId = null;
            if (userIdStr != null) {
                try {
                    approverId = Integer.parseInt(userIdStr.trim());
                } catch (Exception e) {
                    approverId = 1;
                }
            } else {
                approverId = 1;
            }

            // Save to QMS_NCR_OFI_APPROVAL table
            com.autonoma.erp.modules.qms.audit.entity.NcrOfiApproval approval = new com.autonoma.erp.modules.qms.audit.entity.NcrOfiApproval();
            approval.setNcrOfiId(detail.getId().intValue());
            approval.setApproverId(approverId);
            approval.setApprovalRole("QMS_REVIEWER");
            approval.setStatus("REWORK");
            approval.setComments(remarks);
            approval.setApprovalDate(java.time.LocalDateTime.now());
            approval.setIsActive(true);
            ncrOfiApprovalRepository.save(approval);

            // Build / append rework history JSON in CANCEL_REMARKS
            java.util.List<java.util.Map<String, Object>> history = new java.util.ArrayList<>();
            String existing = detail.getCancelRemarks();
            if (existing != null && !existing.isBlank()) {
                try {
                    @SuppressWarnings("unchecked")
                    java.util.List<java.util.Map<String, Object>> parsed = objectMapper.readValue(existing,
                            objectMapper.getTypeFactory().constructCollectionType(java.util.List.class,
                                    java.util.Map.class));
                    history.addAll(parsed);
                } catch (Exception e) {
                    // ignore
                }
            }
            int nextRevNo = (detail.getRevNo() != null ? detail.getRevNo() : 0) + 1;
            java.util.Map<String, Object> entry = new java.util.LinkedHashMap<>();
            entry.put("revNo", nextRevNo);
            entry.put("remarks", remarks != null ? remarks.toUpperCase() : "");
            entry.put("approvalComment", "");
            entry.put("rejectedBy", userIdStr);
            entry.put("rejectedAt", java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            entry.put("status", "REWORK");
            history.add(entry);
            try {
                detail.setCancelRemarks(objectMapper.writeValueAsString(history));
            } catch (Exception e) {
                detail.setCancelRemarks(remarks);
            }
            detail.setRevNo(nextRevNo);

            detail.setUpdatedAt(new java.util.Date());
            detail.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            observationDetailRepository.save(detail);

            // Notify auditee about rework request
            sendNcrNotification(
                    detail.getAuditee(),
                    "NCR Rework Requested: " + detail.getNcrNo(),
                    String.format("NCR %s has been sent back for rework. Reason/Remarks: %s", detail.getNcrNo(), remarks),
                    "/qms/audit/ncr/close");
        });
    }

    private void saveAttachment(Integer detailId, String filePath, String category) {
        if (filePath == null || filePath.isEmpty())
            return;
        com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment attachment = new com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment();

        attachment.setPageCode("QMS_NCR_OFI");
        attachment.setRefId(String.valueOf(detailId));
        attachment.setPath(filePath);
        attachment.setFileName(new java.io.File(filePath).getName());
        attachment.setDocType(category);

        attachmentRepository.save(attachment);
    }

    public String generateNextNo(String type) {
        return generateNcrOfiNo(type);
    }

    private String generateNcrOfiNo(String type) {
        String yearStr = String.valueOf(LocalDate.now().getYear());
        String shortYear = yearStr.substring(2);
        String currentAccountYear = yearStr + "-" + (LocalDate.now().getYear() + 1);

        String configuredPrefix = null;
        String configuredSuffix = null;
        int digits = 4;
        try {
            java.util.List<com.autonoma.erp.model.admin.PrefixCredential> allCreds = prefixCredentialRepository
                    .findAll();
            com.autonoma.erp.model.admin.PrefixCredential cred = allCreds.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                    .filter(c -> currentAccountYear.equals(c.getAccountYear()))
                    .findFirst()
                    .orElse(allCreds.stream()
                            .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                            .findFirst().orElse(null));

            if (cred != null) {
                boolean isNc = "NC".equalsIgnoreCase(type) || "NCR".equalsIgnoreCase(type);
                boolean isOfi = "OFI".equalsIgnoreCase(type);
                if (isNc) {
                    if (cred.getNcrPrefix() != null && !cred.getNcrPrefix().trim().isEmpty()) {
                        configuredPrefix = cred.getNcrPrefix().trim();
                    }
                    if (cred.getNcrSuffix() != null && !cred.getNcrSuffix().trim().isEmpty()) {
                        configuredSuffix = cred.getNcrSuffix().trim();
                    }
                    digits = cred.getNcrDigit() != null ? cred.getNcrDigit() : 4;
                } else if (isOfi) {
                    if (cred.getOfiPrefix() != null && !cred.getOfiPrefix().trim().isEmpty()) {
                        configuredPrefix = cred.getOfiPrefix().trim();
                    }
                    if (cred.getOfiSuffix() != null && !cred.getOfiSuffix().trim().isEmpty()) {
                        configuredSuffix = cred.getOfiSuffix().trim();
                    }
                    digits = cred.getOfiDigit() != null ? cred.getOfiDigit() : 4;
                }
            }
        } catch (Exception ex) {
            System.err.println("[NcrOfiService] Could not read prefix/suffix from AD_PREFIX_CREDENTIALS: " + ex.getMessage());
        }

        // Auto-fetch from existing database records if no configured prefix exists
        if (configuredPrefix == null || configuredPrefix.isEmpty()) {
            String existingLastNo = null;
            try {
                existingLastNo = jdbcTemplate.queryForObject(
                        "SELECT TOP 1 ncrNo FROM (" +
                        "  SELECT NCR_NO AS ncrNo, ID FROM QMS_AUDIT_OBSERVATION_DETAIL WHERE NCR_NO IS NOT NULL AND NCR_NO != '' AND NCR_NO != 'N/A' " +
                        "  UNION ALL " +
                        "  SELECT NCR_NO AS ncrNo, ID FROM QMS_NCR_REWORK_LOG WHERE NCR_NO IS NOT NULL AND NCR_NO != '' AND NCR_NO != 'N/A' " +
                        ") t ORDER BY ID DESC",
                        String.class);
            } catch (Exception e) {}

            if (existingLastNo != null && !existingLastNo.isEmpty()) {
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("^(.*?)([0-9]{3,6})([^0-9]*)$").matcher(existingLastNo);
                if (m.find()) {
                    String extractedPrefix = m.group(1).replaceAll("-[/]+", "-").replaceAll("[/]+-", "-");
                    String numStr = m.group(2);
                    String extractedSuffix = m.group(3);
                    int extractedDigits = numStr.length();
                    long nextNum = Long.parseLong(numStr) + 1;
                    return extractedPrefix + String.format("%0" + extractedDigits + "d", nextNum) + extractedSuffix;
                }
            }
        }

        String finalPrefix;
        if (configuredPrefix != null && !configuredPrefix.isEmpty()) {
            finalPrefix = configuredPrefix;
            if (!finalPrefix.endsWith("-") && !finalPrefix.endsWith("/") && !finalPrefix.endsWith(".")) {
                finalPrefix = finalPrefix + "-";
            }
        } else {
            finalPrefix = (type != null ? type.toUpperCase() : "NCR") + "-" + shortYear + "-";
        }

        String finalSuffix = configuredSuffix != null ? configuredSuffix : "";

        String searchPattern = finalPrefix + "%" + finalSuffix;
        
        String lastNo = null;
        try {
            lastNo = jdbcTemplate.queryForObject(
                    "SELECT TOP 1 ncrNo FROM (" +
                    "  SELECT NCR_NO AS ncrNo, ID FROM QMS_AUDIT_OBSERVATION_DETAIL WHERE NCR_NO LIKE ? " +
                    "  UNION ALL " +
                    "  SELECT NCR_NO AS ncrNo, ID FROM QMS_NCR_REWORK_LOG WHERE NCR_NO LIKE ? " +
                    ") t ORDER BY ID DESC", 
                    String.class, searchPattern, searchPattern);
        } catch (Exception e) {}
        
        long nextNum = 1;
        if (lastNo != null) {
            try {
                String numStr = lastNo;
                if (!finalPrefix.isEmpty() && numStr.startsWith(finalPrefix)) {
                    numStr = numStr.substring(finalPrefix.length());
                }
                if (!finalSuffix.isEmpty() && numStr.endsWith(finalSuffix)) {
                    numStr = numStr.substring(0, numStr.length() - finalSuffix.length());
                }
                nextNum = Long.parseLong(numStr) + 1;
            } catch(Exception e) {}
        }
        return finalPrefix + String.format("%0" + digits + "d", nextNum) + finalSuffix;
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void saveReworkLogRequiresNew(Long detailId, String submittedBy, String rootCause, String correctiveAction,
            String preventiveAction) {
        Integer prevCount = observationDetailRepository.countReworksByObservationDetailId(detailId);
        int reworkNo = (prevCount == null ? 0 : prevCount) + 1;
        observationDetailRepository.insertReworkLog(
                detailId,
                reworkNo,
                submittedBy,
                rootCause,
                correctiveAction,
                preventiveAction);
    }
}

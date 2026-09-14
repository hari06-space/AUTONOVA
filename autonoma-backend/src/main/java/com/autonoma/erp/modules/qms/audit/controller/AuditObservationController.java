package com.autonoma.erp.modules.qms.audit.controller;

import com.autonoma.erp.model.admin.AppPreference;
import com.autonoma.erp.repository.admin.AppPreferenceRepository;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.qms.audit.repository.AuditObservationDetailRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.qms.audit.service.NcrOfiService;

import com.autonoma.erp.modules.qms.audit.entity.AuditObservation;
import com.autonoma.erp.modules.qms.audit.entity.AuditObservationDetail;
import com.autonoma.erp.modules.qms.audit.repository.AuditObservationRepository;
import com.autonoma.erp.dto.NcrOfiDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.ArrayList;
import java.util.Optional;
import java.util.stream.Collectors;
import com.autonoma.erp.modules.qms.audit.entity.AuditScheduleCriteria;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpStatus;
import java.io.ByteArrayOutputStream;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository;
import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import com.autonoma.erp.modules.qms.audit.entity.AuditSchedule;
import com.autonoma.erp.modules.qms.audit.entity.AuditAttendance;
import com.autonoma.erp.modules.qms.audit.repository.AuditAttendanceRepository;

@RestController
@RequestMapping("/api/qms/audit/observation")
@CrossOrigin(origins = "*")
@Tag(name = "QMS - Audit Observation", description = "Endpoints for recording audit findings and scoring")
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class AuditObservationController {

    @Autowired
    private AuditObservationRepository auditObservationRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.PrefixCredentialRepository prefixCredentialRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditObservationDetailRepository auditObservationDetailRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.service.NcrOfiService ncrOfiService;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository auditScheduleRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.AppPreferenceRepository appPreferenceRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository departmentRepository;

    @Autowired
    private com.autonoma.erp.service.admin.CompanyCredentialService companyCredentialService;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private DesignationLevelRepository designationLevelRepository;

    @Autowired
    private AuditAttendanceRepository auditAttendanceRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.NcrOfiAttachmentRepository ncrOfiAttachmentRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.service.ClosedNcrService closedNcrService;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.NcrReworkLogRepository ncrReworkLogRepository;

    private void syncDetailAttachments(List<AuditObservationDetail> details) {
        if (details == null)
            return;
        for (AuditObservationDetail detail : details) {
            if (detail.getId() != null) {
                // Fetch existing attachments
                List<com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment> existingAttachments = 
                        ncrOfiAttachmentRepository.findByPageCodeAndRefId("QM1230", String.valueOf(detail.getId()));
                if (existingAttachments.isEmpty()) {
                    existingAttachments = ncrOfiAttachmentRepository.findByPageCodeAndRefId("QMS_NCR_OFI",
                            String.valueOf(detail.getId()));
                }

                java.util.Set<String> existingPaths = existingAttachments.stream()
                        .map(com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment::getPath)
                        .collect(java.util.stream.Collectors.toSet());

                java.util.Set<String> incomingPaths = new java.util.HashSet<>();
                if (detail.getAttachmentPath() != null && !detail.getAttachmentPath().trim().isEmpty()) {
                    String[] paths = detail.getAttachmentPath().split(",");
                    for (String path : paths) {
                        String trimmed = path.trim();
                        if (!trimmed.isEmpty()) {
                            incomingPaths.add(trimmed);
                        }
                    }
                }

                // Delete removed attachments
                for (com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment existing : existingAttachments) {
                    if (!incomingPaths.contains(existing.getPath())) {
                        ncrOfiAttachmentRepository.delete(existing);
                    }
                }

                // Add new attachments
                for (String incoming : incomingPaths) {
                    if (!existingPaths.contains(incoming)) {
                        com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment attachment = 
                                new com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment();
                        attachment.setPageCode("QM1230");
                        attachment.setRefId(String.valueOf(detail.getId()));
                        attachment.setPath(incoming);
                        attachment.setFileName(new java.io.File(incoming).getName());
                        attachment.setDocType("EVIDENCE");
                        ncrOfiAttachmentRepository.save(attachment);
                    }
                }
            }
        }
    }

    private void populateDetailAttachmentPaths(List<AuditObservationDetail> details) {
        if (details == null || details.isEmpty())
            return;

        List<String> refIds = new ArrayList<>();
        for (AuditObservationDetail detail : details) {
            if (detail.getId() != null) {
                refIds.add(String.valueOf(detail.getId()));
            }
        }

        if (refIds.isEmpty())
            return;

        // Fetch all attachments for these refIds and the two pageCodes QM1230 and QMS_NCR_OFI in bulk with batching to avoid SQL Server 2100 param limit
        List<com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment> allAttachments = new ArrayList<>();
        int batchSize = 1000;
        for (int i = 0; i < refIds.size(); i += batchSize) {
            List<String> batch = refIds.subList(i, Math.min(i + batchSize, refIds.size()));
            allAttachments.addAll(ncrOfiAttachmentRepository.findByPageCodesAndRefIds(
                    java.util.Arrays.asList("QM1230", "QMS_NCR_OFI"),
                    batch
            ));
        }

        // Group by refId and pageCode
        // Note: For a given refId, QM1230 attachments take precedence over QMS_NCR_OFI attachments.
        java.util.Map<String, List<com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment>> qm1230Map = new java.util.HashMap<>();
        java.util.Map<String, List<com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment>> qmsNcrOfiMap = new java.util.HashMap<>();

        for (com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment att : allAttachments) {
            if ("QM1230".equals(att.getPageCode())) {
                qm1230Map.computeIfAbsent(att.getRefId(), k -> new ArrayList<>()).add(att);
            } else if ("QMS_NCR_OFI".equals(att.getPageCode())) {
                qmsNcrOfiMap.computeIfAbsent(att.getRefId(), k -> new ArrayList<>()).add(att);
            }
        }

        for (AuditObservationDetail detail : details) {
            if (detail.getId() != null) {
                String refIdStr = String.valueOf(detail.getId());
                List<com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment> attachments = qm1230Map.get(refIdStr);
                if (attachments == null || attachments.isEmpty()) {
                    attachments = qmsNcrOfiMap.get(refIdStr);
                }
                if (attachments != null && !attachments.isEmpty()) {
                    String joined = attachments.stream()
                            .map(com.autonoma.erp.modules.qms.audit.entity.NcrOfiAttachment::getPath)
                            .collect(java.util.stream.Collectors.joining(","));
                    detail.setAttachmentPath(joined);
                }
            }
        }
    }

    private void closeAuditSchedule(Long observationId, String scheduleNo) {
        System.out.println("[AuditObservationController] closeAuditSchedule called for Observation ID: " + observationId + ", Schedule No: " + scheduleNo);
        if (scheduleNo != null && !scheduleNo.trim().isEmpty()) {
            String trimmed = scheduleNo.trim();
            Optional<AuditSchedule> scheduleOpt = auditScheduleRepository.findByScheduleNoIgnoreCase(trimmed);
            if (scheduleOpt.isPresent()) {
                AuditSchedule schedule = scheduleOpt.get();
                System.out.println("[AuditObservationController] Found Audit Schedule ID: " + schedule.getId() + " for Schedule No: " + trimmed);
                
                // 5. If it is already CLOSED, do not perform another update.
                if ("CLOSED".equalsIgnoreCase(schedule.getStatus())) {
                    System.out.println("[AuditObservationController] Audit Schedule ID: " + schedule.getId() + " is already CLOSED. Skipping update.");
                    return;
                }
                
                // 2. Update status and audit fields
                schedule.setStatus("CLOSED");
                schedule.setUpdatedUser(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                schedule.setUpdatedDate(new java.util.Date());
                
                auditScheduleRepository.saveAndFlush(schedule);
                
                // 6. Logging success
                System.out.println("[AuditObservationController] Successfully closed Audit Schedule ID: " + schedule.getId() + " for Observation ID: " + observationId);
            } else {
                System.out.println("[AuditObservationController] WARNING: Audit Schedule not found for Schedule No: " + trimmed + " (Observation ID: " + observationId + ")");
            }
        } else {
            System.out.println("[AuditObservationController] WARNING: Schedule No is null or empty for Observation ID: " + observationId);
        }
    }

    @PostMapping("/ncr/submit")
    @RequirePagePermission(pageCode = "QM1240", action = "write")
    @Operation(summary = "Submit NCR Closure", description = "Saves corrective actions and updates finding status")
    public ResponseEntity<?> submitNcrClosure(@RequestBody java.util.Map<String, Object> payload) {
        try {
            ncrOfiService.processNcrClosure(payload);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/ncr/findings")
    @Operation(summary = "Get Pending NCR Findings", description = "Fetches all NCR/OFI observations that are not yet closed")
    public List<NcrOfiDto> getPendingNcrFindings(
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false, defaultValue = "No") String considerDate,
            @RequestParam(required = false) String taskType,
            @RequestParam(required = false) String observationStatus,
            @RequestParam(required = false) String ncrStatus,
            @RequestParam(required = false) String ncrApprovedBy,
            @RequestParam(required = false) String query) {

        java.util.Date parsedFromDate = null;
        java.util.Date parsedToDate = null;
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        try {
            if (fromDate != null && !fromDate.trim().isEmpty()) {
                parsedFromDate = sdf.parse(fromDate);
            }
        } catch (Exception e) {
            // ignore
        }
        try {
            if (toDate != null && !toDate.trim().isEmpty()) {
                parsedToDate = sdf.parse(toDate);
            }
        } catch (Exception e) {
            // ignore
        }

        List<AuditObservationDetail> details = auditObservationDetailRepository.findPendingNcrFindingsFiltered(
                parsedFromDate, parsedToDate, considerDate, observationStatus, ncrStatus, ncrApprovedBy, query);
        populateDetailAttachmentPaths(details);
        return details.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    /**
     * GET /api/qms/audit/observation/ncr/rework-findings
     *
     * Reads NCR/OFI findings from QMS_NCR_REWORK_LOG (not from the detail table directly).
     * The Auditee is resolved from the linked QMS_AUDIT_SCHEDULE so that Mine/Team/Company
     * scope filtering on the frontend (using auditeeId) works correctly.
     */
    @GetMapping("/ncr/rework-findings")
    @Operation(summary = "Get NCR/OFI Rework Findings",
               description = "Fetches NC/OFI findings from QMS_NCR_REWORK_LOG with auditee resolved from the audit schedule. Supports Mine/Team/Company scope filtering.")
    public List<NcrOfiDto> getReworkFindings(
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false, defaultValue = "No") String considerDate,
            @RequestParam(required = false) String observationStatus,
            @RequestParam(required = false) String workflowStatus,
            @RequestParam(required = false) String dashboardFilter,
            @RequestParam(required = false) String query) {

        java.util.Date parsedFromDate = null;
        java.util.Date parsedToDate  = null;
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        try { if (fromDate != null && !fromDate.trim().isEmpty()) parsedFromDate = sdf.parse(fromDate); } catch (Exception ignored) {}
        try { if (toDate   != null && !toDate.trim().isEmpty())   parsedToDate   = sdf.parse(toDate);   } catch (Exception ignored) {}

        String effectiveWorkflowStatus = (workflowStatus == null || workflowStatus.trim().isEmpty() || "All".equalsIgnoreCase(workflowStatus)) ? null : workflowStatus;
        String effectiveObsStatus      = (observationStatus == null || observationStatus.trim().isEmpty() || "All".equalsIgnoreCase(observationStatus)) ? null : observationStatus;
        String effectiveQuery          = (query == null || query.trim().isEmpty()) ? null : query.trim();
        String effectiveDashboardFilter= (dashboardFilter == null || dashboardFilter.trim().isEmpty()) ? null : dashboardFilter.trim();

        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        Long loggedInEmployeeId = null;
        if (userId != null) {
            loggedInEmployeeId = userRepository.findByUserId(userId)
                    .map(com.autonoma.erp.model.admin.UserCredential::getEmpId)
                    .orElse(null);
        }

        List<Object[]> rows = ncrReworkLogRepository.findReworkLogFindings(
                loggedInEmployeeId,
                effectiveObsStatus, effectiveWorkflowStatus, considerDate,
                parsedFromDate, parsedToDate, effectiveQuery, effectiveDashboardFilter);

        return rows.stream().map(this::mapReworkRowToDto).collect(Collectors.toList());
    }

    /**
     * Maps a raw Object[] row from {@link com.autonoma.erp.modules.qms.audit.repository.NcrReworkLogRepository#findReworkLogFindings}
     * to a {@link NcrOfiDto} that is compatible with the existing frontend "Close NC/OFI" page.
     *
     * Column order MUST match the SELECT list in the native query.
     */
    private NcrOfiDto mapReworkRowToDto(Object[] row) {
        int i = 0;
        NcrOfiDto dto = new NcrOfiDto();

        // ── From QMS_NCR_REWORK_LOG ──────────────────────────────────────────
        dto.setId(toLong(row[i++]));                           // logId
        Long detailId = toLong(row[i++]);                      // observationDetailId
        dto.setObservationDetailId(detailId);
        dto.setObservationId(toInt(row[i++]));                 // observationId
        dto.setAuditScheduleNo(toStr(row[i++]));               // auditScheduleNo (AUDIT_ID)
        i++;                                                   // auditScheduleDbId (skip)
        dto.setClause(toStr(row[i++]));                        // clause
        dto.setCriteriaId(toLong(row[i++]));                   // criteriaId
        dto.setCriteriaDetails(toStr(row[i++]));               // criteriaDetails
        dto.setObservationStatus(toStr(row[i++]));             // observationStatus (from log STATUS)
        dto.setRemarks(toStr(row[i++]));                       // remarks
        dto.setAttachmentPath(toStr(row[i++]));                // attachmentPath
        dto.setNcrStatus(toStr(row[i++]));                     // workflowStatus → used as ncrStatus for display
        dto.setApprovalStatus(toStr(row[i++]));                // approvalStatus
        dto.setNcrStatusName(toStr(row[i++]));                 // reworkStatus → displayed as ncrStatusName
        i++;                                                   // departmentId (scalar, skip)
        dto.setCreatedDate(toDate(row[i++]));                  // createdDate

        // ── From QMS_AUDIT_OBSERVATION_DETAIL ────────────────────────────────
        dto.setNcrNo(toStr(row[i++]));                         // ncrNo
        dto.setSeqNo(toStr(row[i++]));                         // seqNo
        String detailStatus = toStr(row[i++]);                 // detailObservationStatus
        if (dto.getObservationStatus() == null) dto.setObservationStatus(detailStatus);
        dto.setAttachmentReq(Boolean.TRUE.equals(row[i]) || "1".equals(String.valueOf(row[i])) ? "YES" : "NO"); i++; // attachmentReq
        dto.setRootCause(toStr(row[i++]));                     // rootCause
        dto.setCorrectiveAction(toStr(row[i++]));              // correctiveAction
        dto.setPreventiveAction(toStr(row[i++]));              // preventiveAction
        dto.setTargetDate(toDate(row[i++]));                   // targetDate
        dto.setClosedDate(toDate(row[i++]));                   // closedDate
        dto.setCancelRemarks(toStr(row[i++]));                 // cancelRemarks
        dto.setRevNo(toInt(row[i++]));                         // revNo

        // ── From QMS_AUDIT_OBSERVATION ───────────────────────────────────────
        dto.setObservationNo(toStr(row[i++]));                 // observationNo
        dto.setObservationDate(toDate(row[i++]));              // observationDate
        i++;                                                   // obsAuditScheduleNo (duplicate, skip)
        i++;                                                   // obsDepartmentId (scalar, skip)
        dto.setAuditorId(toLong(row[i++]));                    // auditorId
        dto.setNcrApprovedById(toLong(row[i++]));              // ncrApprovedById

        // ── Auditee resolved from QMS_AUDIT_SCHEDULE ─────────────────────────
        dto.setAuditeeId(toLong(row[i++]));                    // auditeeId (schedule takes priority)
        String auditeeName = toStr(row[i++]);                  // auditeeName
        String auditeeCode = toStr(row[i++]);                  // auditeeCode
        dto.setAuditee(buildNameCode(auditeeName, auditeeCode));

        String auditorName = toStr(row[i++]);                  // auditorName
        String auditorCode = toStr(row[i++]);                  // auditorCode
        String fullAuditor = buildNameCode(auditorName, auditorCode);

        String ncrName = toStr(row[i++]);                      // ncrApprovedByName
        String ncrCode = toStr(row[i++]);                      // ncrApprovedByCode
        dto.setNcrApprovedBy(buildNameCode(ncrName, ncrCode));

        dto.setDepartmentName(toStr(row[i++]));                // departmentName
        String auditType = toStr(row[i]);                      // auditType
        dto.setAuditType(auditType);

        // Check if External Audit via Schedule No -> Show External Name and Image from Schedule
        if (dto.getAuditScheduleNo() != null && !dto.getAuditScheduleNo().trim().isEmpty()) {
            AuditSchedule sch = auditScheduleRepository.findByScheduleNoIgnoreCase(dto.getAuditScheduleNo().trim()).orElse(null);
            if (sch != null) {
                String type = sch.getAuditType() != null ? sch.getAuditType().trim().toUpperCase() : (auditType != null ? auditType.trim().toUpperCase() : "");
                boolean isExternal = sch.getAuditorId() == null || type.contains("CUSTOMER") || type.contains("SUPPLIER") || type.contains("EXTERNAL");
                if (isExternal) {
                    String extName = sch.getExternalName() != null && !sch.getExternalName().trim().isEmpty() ? sch.getExternalName().trim() : sch.getContactName();
                    if (extName != null && !extName.trim().isEmpty()) {
                        dto.setAuditor(extName);
                    }
                    if (sch.getExternalAuditorImage() != null && !sch.getExternalAuditorImage().trim().isEmpty()) {
                        dto.setExternalAuditorImage(sch.getExternalAuditorImage().trim());
                    }
                } else {
                    dto.setAuditor(fullAuditor);
                }
            } else {
                dto.setAuditor(fullAuditor);
            }
        } else {
            dto.setAuditor(fullAuditor);
        }

        return dto;
    }

    private String resolveExternalAuditorName(String scheduleNo, String fallbackAuditType) {
        if (scheduleNo == null || scheduleNo.trim().isEmpty()) {
            return null;
        }
        AuditSchedule sch = auditScheduleRepository.findByScheduleNoIgnoreCase(scheduleNo.trim()).orElse(null);
        if (sch == null) {
            return null;
        }

        // 1. Fetch Audit Type from Schedule
        String auditType = sch.getAuditType() != null ? sch.getAuditType().trim().toUpperCase() : (fallbackAuditType != null ? fallbackAuditType.trim().toUpperCase() : "");

        // 2. Check if External Audit (CUSTOMER AUDIT / SUPPLIER AUDIT / EXTERNAL or auditorId is null)
        boolean isExternal = sch.getAuditorId() == null || auditType.contains("CUSTOMER") || auditType.contains("SUPPLIER") || auditType.contains("EXTERNAL");

        // 3. If External Audit -> Return the External Name input given in Schedule
        if (isExternal) {
            if (sch.getExternalName() != null && !sch.getExternalName().trim().isEmpty()) {
                return sch.getExternalName().trim();
            }
            if (sch.getContactName() != null && !sch.getContactName().trim().isEmpty()) {
                return sch.getContactName().trim();
            }
        }

        return null;
    }

    // ── Type-conversion helpers ───────────────────────────────────────────────

    private Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Long)    return (Long) o;
        if (o instanceof Integer) return ((Integer) o).longValue();
        if (o instanceof Number)  return ((Number) o).longValue();
        try { return Long.parseLong(String.valueOf(o)); } catch (Exception e) { return null; }
    }

    private Integer toInt(Object o) {
        if (o == null) return null;
        if (o instanceof Integer) return (Integer) o;
        if (o instanceof Long)    return ((Long) o).intValue();
        if (o instanceof Number)  return ((Number) o).intValue();
        try { return Integer.parseInt(String.valueOf(o)); } catch (Exception e) { return null; }
    }

    private String toStr(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }

    private java.util.Date toDate(Object o) {
        if (o == null) return null;
        if (o instanceof java.util.Date) return (java.util.Date) o;
        if (o instanceof java.sql.Timestamp) return new java.util.Date(((java.sql.Timestamp) o).getTime());
        return null;
    }

    private String buildNameCode(String name, String code) {
        if (name == null && code == null) return null;
        if (name == null) return code;
        if (code == null) return name;
        return name.trim() + " - " + code.trim();
    }

    private NcrOfiDto convertToDto(AuditObservationDetail detail) {
        NcrOfiDto dto = new NcrOfiDto();
        dto.setId(detail.getId());
        dto.setObservationDetailId(detail.getId());
        dto.setObservationId(
                detail.getAuditObservation() != null ? detail.getAuditObservation().getId().intValue() : null);
        dto.setObservationNo(
                detail.getAuditObservation() != null ? detail.getAuditObservation().getObservationNo() : null);
        dto.setObservationDate(
                detail.getAuditObservation() != null ? detail.getAuditObservation().getObservationDate() : null);
        dto.setCreatedDate(detail.getAuditObservation() != null ? detail.getAuditObservation().getCreatedDate() : null);
        dto.setAuditScheduleNo(
                detail.getAuditObservation() != null ? detail.getAuditObservation().getAuditScheduleNo() : null);
        dto.setAuditType(detail.getAuditObservation() != null ? detail.getAuditObservation().getAuditType() : null);
        dto.setDepartmentName(
                detail.getAuditObservation() != null ? detail.getAuditObservation().getDepartmentName() : null);
        dto.setAuditArea(detail.getAuditObservation() != null ? detail.getAuditObservation().getAuditArea() : null);
        dto.setAuditAreaDetail(
                detail.getAuditObservation() != null ? detail.getAuditObservation().getAuditArea() : null);
        dto.setAuditee(detail.getAuditObservation() != null ? detail.getAuditObservation().getAuditee() : null);
        dto.setAuditor(detail.getAuditObservation() != null ? detail.getAuditObservation().getAuditor() : null);
        dto.setNcrApprovedBy(
                detail.getAuditObservation() != null ? detail.getAuditObservation().getNcrApprovedBy() : null);
        dto.setAuditeeId(detail.getAuditObservation() != null ? detail.getAuditObservation().getAuditeeId() : null);
        dto.setAuditorId(detail.getAuditObservation() != null ? detail.getAuditObservation().getAuditorId() : null);
        dto.setNcrApprovedById(detail.getAuditObservation() != null ? detail.getAuditObservation().getNcrApprovedById() : null);

        dto.setSeqNo(detail.getSeqNo());
        dto.setClause(detail.getClause());
        dto.setCriteriaDetails(detail.getCriteriaDetails());
        dto.setAttachmentReq(detail.getAttachmentReq() != null && detail.getAttachmentReq() ? "YES" : "NO");
        dto.setObservationStatus(detail.getObservationStatus());
        // ncrStatus from entity = StatusMaster name (NCR STATUS column)
        dto.setNcrStatusName(detail.getNcrStatus()); // StatusMaster name
        // approvalStatus = workflow verify status (OPEN, PENDING FOR VERIFY, CLOSED, etc.)
        dto.setNcrStatus(detail.getApprovalStatus() != null ? detail.getApprovalStatus() : detail.getNcrStatus());
        dto.setNcrNo(detail.getNcrNo()); // Fix: map ncrNo so it shows in the approval table
        dto.setRootCause(detail.getRootCause());
        dto.setCorrectiveAction(detail.getCorrectiveAction());
        dto.setPreventiveAction(detail.getPreventiveAction());
        dto.setTargetDate(detail.getTargetDate());
        dto.setClosedDate(detail.getClosedDate());
        dto.setRemarks(detail.getComments());
        dto.setCancelRemarks(detail.getCancelRemarks());
        dto.setRevNo(detail.getRevNo());
        dto.setAttachmentPath(detail.getAttachmentPath());

        return dto;
    }

    @GetMapping("/open-schedules")
    public List<AuditSchedule> getOpenSchedules(@RequestParam("currentUser") String currentUser) {
        System.out.println("[DEBUG][getOpenSchedules] currentUser: '" + currentUser + "', Tenant: " + com.autonoma.erp.config.TenantContextHolder.getTenantId() + ", Division: " + com.autonoma.erp.config.DivisionContextHolder.getDivisionId());
        Long userEmpId = null;
        String employeeName = "";
        String employeeCode = "";

        if (currentUser != null && !currentUser.trim().isEmpty()) {
            com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(currentUser)
                    .orElse(null);
            if (credential != null) {
                userEmpId = credential.getEmpId();
            }
            if (userEmpId == null) {
                EmployeeMaster empFallback = employeeMasterRepository.findByEmpCodeOrName(currentUser).orElse(null);
                if (empFallback != null) {
                    userEmpId = empFallback.getId();
                }
            }
            if (userEmpId != null) {
                EmployeeMaster emp = employeeMasterRepository.findById(userEmpId).orElse(null);
                if (emp != null) {
                    employeeName = emp.getEmployeeName();
                    employeeCode = emp.getEmpCode();
                }
            }
        }

        // Scope is determined purely from BOS_USER_PAGE_AUTH for page QM1230:
        // additional1=1 → Company, manager=1 → Team, else → Mine
        String maxAllowedScope = "Mine";
        if (currentUser != null && !currentUser.trim().isEmpty()) {
            com.autonoma.erp.model.admin.BosPage page = bosPageRepository.findByPageCode("QM1230").orElse(null);
            if (page != null) {
                com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                        .findByUserIdAndPageId(currentUser, page.getPageId());
                if (auth != null) {
                    if (Integer.valueOf(1).equals(auth.getAdditional1())) {
                        maxAllowedScope = "Company";
                    } else if (Integer.valueOf(1).equals(auth.getManager())) {
                        maxAllowedScope = "Team";
                    }
                }
            }
        }

        System.out.println("[DEBUG][getOpenSchedules] maxAllowedScope: " + maxAllowedScope + ", userEmpId: " + userEmpId);

        // Regardless of scope, the dropdown for Audit Observation should only show:
        //   1. OPEN schedules where the logged-in user IS THE AUDITOR
        //   2. AND the user has already marked attendance (checked in) for that schedule
        if (userEmpId != null) {
            List<AuditSchedule> res = auditScheduleRepository.findOpenAuditorSchedulesWithAttendance(userEmpId);
            System.out.println("[DEBUG][getOpenSchedules] Auditor+Attendance filter res size: " + res.size() + " for empId: " + userEmpId);
            return res;
        }

        return java.util.Collections.emptyList();
    }


    @GetMapping("/schedule-details/{scheduleNo}")
    public ResponseEntity<?> getScheduleDetails(@PathVariable String scheduleNo) {
        System.out.println("[AuditObservationController] Loading details for schedule: " + scheduleNo);
        
        Optional<AuditSchedule> scheduleOpt = auditScheduleRepository.findByScheduleNoIgnoreCase(scheduleNo.trim());
        if (scheduleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        AuditSchedule schedule = scheduleOpt.get();

        // 1. Fetch criteria/checklist
        List<AuditScheduleCriteria> criteriaList = schedule.getCriteriaList();
        // Trigger initialization
        if (criteriaList != null) {
            criteriaList.size();
        }

        // 2. Fetch attendance
        List<AuditAttendance> attendanceList = auditAttendanceRepository.findByAuditScheduleNo(schedule.getScheduleNo());

        // 3. Fetch existing observation if any
        Optional<AuditObservation> existingObs = auditObservationRepository.findByAuditScheduleNoIgnoreCase(schedule.getScheduleNo());
        if (existingObs.isPresent()) {
            populateDetailAttachmentPaths(existingObs.get().getDetails());
        }

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("schedule", schedule);
        response.put("criteria", criteriaList);
        response.put("attendance", attendanceList);
        response.put("existingObservation", existingObs.orElse(null));

        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Get All Observations", description = "Fetches a list of all audit observations")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<AuditObservation> getAll(
            @RequestParam(value = "taskScope", required = false) String taskScope,
            @RequestParam(value = "currentUser", required = false) String currentUser,
            @RequestParam(value = "memberId", required = false) Long memberId,
            @RequestParam(value = "fromDate", required = false) String fromDate,
            @RequestParam(value = "toDate", required = false) String toDate,
            @RequestParam(value = "considerDate", required = false) String considerDate) {

        if (currentUser == null || currentUser.trim().isEmpty()) {
            currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        }

        Long userEmpId = null;
        Long userDeptId = null;

        String employeeName = null;
        if (currentUser != null && !currentUser.trim().isEmpty()) {
            com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(currentUser)
                    .orElse(null);
            if (credential != null) {
                userEmpId = credential.getEmpId();
            }
            if (userEmpId == null) {
                EmployeeMaster empFallback = employeeMasterRepository.findByEmpCodeOrName(currentUser).orElse(null);
                if (empFallback != null) {
                    userEmpId = empFallback.getId();
                }
            }
            if (userEmpId != null) {
                EmployeeMaster emp = employeeMasterRepository.findById(userEmpId).orElse(null);
                if (emp != null) {
                    employeeName = emp.getEmployeeName();
                    if (emp.getOrganization() != null) {
                        userDeptId = emp.getOrganization().getDepartmentId();
                    }
                }
            }
        }

        // Determine effective scope based on page permissions (QM1230 / QM1260)
        String effectiveScope = (taskScope != null && !taskScope.trim().isEmpty()) ? taskScope : "Company";

        String maxAllowedScope = "Mine";
        if (currentUser != null && !currentUser.trim().isEmpty()) {
            // 1. Check Super Admin / Admin / SUPER BOSS role or userLevel
            com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(currentUser).orElse(null);
            if (credential != null) {
                String uId = String.valueOf(credential.getUserId() != null ? credential.getUserId() : "").toUpperCase();
                if ((credential.getUserLevel() != null && credential.getUserLevel() >= 80) || 
                    uId.contains("ADMIN") || uId.contains("SUPER BOSS") || uId.contains("SUPER") || "SUPERBOSS".equals(uId)) {
                    maxAllowedScope = "Company";
                }
            }

            // 2. Check page permissions across QM1260, QM1230, etc.
            if (!"Company".equalsIgnoreCase(maxAllowedScope)) {
                List<String> pageCodesToCheck = java.util.Arrays.asList("QM1260", "QM1230", "QM1210", "QM1240", "QM1250");
                for (String code : pageCodesToCheck) {
                    com.autonoma.erp.model.admin.BosPage page = bosPageRepository.findByPageCode(code).orElse(null);
                    if (page != null) {
                        com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                                .findByUserIdAndPageId(currentUser, page.getPageId());
                        if (auth != null) {
                            if (Integer.valueOf(1).equals(auth.getAdditional1())) {
                                maxAllowedScope = "Company";
                                break;
                            } else if (Integer.valueOf(1).equals(auth.getManager())) {
                                if (!"Company".equalsIgnoreCase(maxAllowedScope)) {
                                    maxAllowedScope = "Team";
                                }
                            } else if (Integer.valueOf(1).equals(auth.getReadAcs())) {
                                if (!"Company".equalsIgnoreCase(maxAllowedScope) && !"Team".equalsIgnoreCase(maxAllowedScope)) {
                                    maxAllowedScope = "Mine";
                                }
                            }
                        }
                    }
                }
            }
        }

        // Downgrade scope if it exceeds the maximum permitted scope
        if ("Company".equalsIgnoreCase(effectiveScope)) {
            if (!"Company".equalsIgnoreCase(maxAllowedScope)) {
                if ("Team".equalsIgnoreCase(maxAllowedScope)) {
                    effectiveScope = "Team";
                } else {
                    effectiveScope = "Mine";
                }
            }
        } else if ("Team".equalsIgnoreCase(effectiveScope)) {
            if (!"Company".equalsIgnoreCase(maxAllowedScope) && !"Team".equalsIgnoreCase(maxAllowedScope)) {
                effectiveScope = "Mine";
            }
        }

        List<Long> reporteeEmpIds = new ArrayList<>();
        if (employeeName != null && !employeeName.trim().isEmpty()) {
            List<EmployeeMaster> activeReports = employeeMasterRepository
                    .findActiveReportsByVerticalHeadName(employeeName.trim());
            if (activeReports != null) {
                for (EmployeeMaster reportee : activeReports) {
                    reporteeEmpIds.add(reportee.getId());
                }
            }
        }

        java.util.Date parsedFromDate = null;
        java.util.Date parsedToDate = null;
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        boolean checkDate = "Yes".equalsIgnoreCase(considerDate) || "true".equalsIgnoreCase(considerDate);
        if (checkDate) {
            try {
                if (fromDate != null && !fromDate.trim().isEmpty()) {
                    java.util.Date temp = sdf.parse(fromDate);
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.setTime(temp);
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
                    cal.set(java.util.Calendar.MINUTE, 0);
                    cal.set(java.util.Calendar.SECOND, 0);
                    cal.set(java.util.Calendar.MILLISECOND, 0);
                    parsedFromDate = cal.getTime();
                } else {
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.set(1970, 0, 1, 0, 0, 0);
                    parsedFromDate = cal.getTime();
                }
            } catch (Exception e) {
            }
            try {
                if (toDate != null && !toDate.trim().isEmpty()) {
                    java.util.Date temp = sdf.parse(toDate);
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.setTime(temp);
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
                    cal.set(java.util.Calendar.MINUTE, 59);
                    cal.set(java.util.Calendar.SECOND, 59);
                    cal.set(java.util.Calendar.MILLISECOND, 999);
                    parsedToDate = cal.getTime();
                } else {
                    java.util.Calendar cal = java.util.Calendar
                            .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    cal.set(2099, 11, 31, 23, 59, 59);
                    parsedToDate = cal.getTime();
                }
            } catch (Exception e) {
            }
        }

        List<AuditObservation> list = auditObservationRepository.findAllByOrderByIdDesc();
        List<AuditObservation> filtered = new java.util.ArrayList<>();

        for (AuditObservation obs : list) {
            boolean include = false;
            if (memberId != null) {
                include = memberId.equals(obs.getAuditorId());
            } else if ("Company".equalsIgnoreCase(effectiveScope)) {
                include = true;
            } else if ("Team".equalsIgnoreCase(effectiveScope)) {
                include = (obs.getAuditorId() != null && reporteeEmpIds.contains(obs.getAuditorId())) ||
                        (userEmpId != null && userEmpId.equals(obs.getAuditorId())) ||
                        (userEmpId == null);
            } else { // Mine
                include = (userEmpId == null) || (userEmpId != null && userEmpId.equals(obs.getAuditorId()));
            }

            if (include && checkDate) {
                // Use observationDate for filtering; fall back to createdDate if observationDate is null
                java.util.Date dateToCheck = obs.getObservationDate() != null ? obs.getObservationDate() : obs.getCreatedDate();
                if (dateToCheck != null) {
                    if (parsedFromDate != null && dateToCheck.before(parsedFromDate)) {
                        include = false;
                    }
                    if (parsedToDate != null && dateToCheck.after(parsedToDate)) {
                        include = false;
                    }
                }
                // If both dates are null, include the record (no date to filter by)
            }

            if (include) {
                filtered.add(obs);
            }
        }

        // Map external auditor names for observations where auditorId is null (e.g. External Audits)
        for (AuditObservation obs : filtered) {
            if (obs.getAuditorId() == null || obs.getAuditor() == null || obs.getAuditor().trim().isEmpty() || "-".equals(obs.getAuditor().trim())) {
                String aud = resolveExternalAuditorName(obs.getAuditScheduleNo(), obs.getAuditType());
                if (aud != null) {
                    obs.setAuditor(aud);
                }
            }
        }

        return filtered;
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditObservation> getById(@PathVariable Long id) {
        return auditObservationRepository.findById(id)
                .map(obs -> {
                    if (obs.getAuditorId() == null || obs.getAuditor() == null || obs.getAuditor().trim().isEmpty() || "-".equals(obs.getAuditor().trim())) {
                        String aud = resolveExternalAuditorName(obs.getAuditScheduleNo(), obs.getAuditType());
                        if (aud != null) {
                            obs.setAuditor(aud);
                        }
                    }
                    if (obs.getDetails() != null) {
                        populateDetailAttachmentPaths(obs.getDetails());
                    }
                    return ResponseEntity.ok(obs);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void validateAttendanceAndSetScores(AuditObservation observation) {
        if (observation.getAuditScheduleNo() != null) {
            String schNo = observation.getAuditScheduleNo().trim();
            List<AuditAttendance> attendanceList = auditAttendanceRepository.findByAuditScheduleNo(schNo);
            if (attendanceList == null || attendanceList.isEmpty()) {
                throw new RuntimeException("Validation Error: No attendance sheet recorded for this schedule. Please record participant attendance before saving observations.");
            }

            AuditSchedule schedule = auditScheduleRepository.findByScheduleNoIgnoreCase(schNo).orElse(null);
            String defaultOutTime = java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.ENGLISH));

            for (AuditAttendance att : attendanceList) {
                if ("PRESENT".equalsIgnoreCase(att.getAttendanceStatus())) {
                    if (att.getOutTime() == null || att.getOutTime().trim().isEmpty() 
                        || "null".equalsIgnoreCase(att.getOutTime().trim()) 
                        || "undefined".equalsIgnoreCase(att.getOutTime().trim())) {
                        att.setOutTime(defaultOutTime);
                        auditAttendanceRepository.save(att);
                    }
                }
            }
        }
        int compliance = 0;
        int ofi = 0;
        int nc = 0;
        java.util.Date obsDate = observation.getObservationDate() != null ? observation.getObservationDate() : new java.util.Date();
        if (observation.getDetails() != null) {
            for (AuditObservationDetail detail : observation.getDetails()) {
                String status = detail.getObservationStatus();
                if ("COMPLIANCE".equalsIgnoreCase(status)) {
                    compliance++;
                } else if ("OFI".equalsIgnoreCase(status)) {
                    ofi++;
                } else if ("NC".equalsIgnoreCase(status) || "NCR".equalsIgnoreCase(status)) {
                    nc++;
                }
                
                // Validate Target Date is not earlier than Observation Date
                if (detail.getTargetDate() != null && obsDate != null) {
                    // Truncate times for pure date comparison
                    java.util.Calendar calObs = java.util.Calendar.getInstance();
                    calObs.setTime(obsDate);
                    calObs.set(java.util.Calendar.HOUR_OF_DAY, 0);
                    calObs.set(java.util.Calendar.MINUTE, 0);
                    calObs.set(java.util.Calendar.SECOND, 0);
                    calObs.set(java.util.Calendar.MILLISECOND, 0);
                    
                    java.util.Calendar calTarget = java.util.Calendar.getInstance();
                    calTarget.setTime(detail.getTargetDate());
                    calTarget.set(java.util.Calendar.HOUR_OF_DAY, 0);
                    calTarget.set(java.util.Calendar.MINUTE, 0);
                    calTarget.set(java.util.Calendar.SECOND, 0);
                    calTarget.set(java.util.Calendar.MILLISECOND, 0);
                    
                    if (calTarget.before(calObs)) {
                        throw new RuntimeException("Validation Error: Target Date for finding cannot be in the past relative to the Observation Date.");
                    }
                }
            }
        }
        observation.setComplianceCount(compliance);
        observation.setOfiCount(ofi);
        observation.setNcrCount(nc);
        int totalDetails = observation.getDetails() != null ? observation.getDetails().size() : 0;
        double percentageScore = totalDetails > 0 ? ((double) compliance * 100.0) / totalDetails : 0.0;
        percentageScore = Math.round(percentageScore * 100.0) / 100.0;
        observation.setAuditScore(percentageScore);
    }

    @PostMapping
    @RequirePagePermission(pageCode = "QM1230", action = "write")
    @Operation(summary = "Create Observation", description = "Saves a new audit observation with findings details")
    @org.springframework.transaction.annotation.Transactional
    public AuditObservation create(@jakarta.validation.Valid @RequestBody AuditObservation observation) {
        validateAttendanceAndSetScores(observation);

        if (observation.getCreatedBy() == null)
            observation.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());

        // Fix: If observationDate is null but createdDate is available, use today's date
        if (observation.getObservationDate() == null) {
            observation.setObservationDate(new java.util.Date());
        }

        if (observation.getAuditScheduleNo() != null) {
            auditScheduleRepository.findByScheduleNoIgnoreCase(observation.getAuditScheduleNo().trim())
                    .ifPresent(schedule -> {
                        if (!"OPEN".equalsIgnoreCase(schedule.getStatus()) && !"RESCHEDULE".equalsIgnoreCase(schedule.getStatus())) {
                            throw new RuntimeException(
                                    "Audit operations are only allowed for schedules with an Open or Reschedule status.");
                        }
                        
                        // Ensure assigned Auditor, Auditee, NCR Approver, Co-ordinator, QMS Admin, or External Audit can record observations
                        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                        boolean isAuthorized = "SUPER BOSS".equalsIgnoreCase(currentUserId);
                        if (!isAuthorized && currentUserId != null) {
                            com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(currentUserId).orElse(null);
                            if (credential != null && credential.getUserLevel() != null && credential.getUserLevel() >= 5) {
                                isAuthorized = true;
                            }
                            if (!isAuthorized && credential != null && credential.getEmpId() != null) {
                                if (credential.getEmpId().equals(schedule.getAuditorId())
                                        || credential.getEmpId().equals(schedule.getAuditeeId())
                                        || credential.getEmpId().equals(schedule.getNcrApprovedById())
                                        || credential.getEmpId().equals(schedule.getCoOrdinatorId())) {
                                    isAuthorized = true;
                                }
                            }
                            if (!isAuthorized && (schedule.getAuditorId() == null || (schedule.getExternalName() != null && !schedule.getExternalName().trim().isEmpty()))) {
                                isAuthorized = true;
                            }
                        }
                        if (!isAuthorized) {
                            throw new RuntimeException("Unauthorized: Only the assigned Auditor of this schedule or QMS Administrators can record observations.");
                        }

                        // Fix: Copy auditorId/auditeeId/ncrApprovedById directly from schedule if not set
                        if (observation.getAuditorId() == null && schedule.getAuditorId() != null) {
                            observation.setAuditorId(schedule.getAuditorId());
                        }
                        if (observation.getAuditeeId() == null && schedule.getAuditeeId() != null) {
                            observation.setAuditeeId(schedule.getAuditeeId());
                        }
                    });
        }

        if (observation.getDepartmentId() == null && observation.getDepartmentName() != null) {
            departmentRepository.findByDepartmentName(observation.getDepartmentName())
                    .ifPresent(d -> observation.setDepartmentId(d.getId()));
        }

        // Fix: Explicitly set IDs from payload in case string-based setters in entity fail to resolve
        // (This ensures IDs are persisted even when the string-to-ID resolution fails)
        if (observation.getAuditorId() == null && observation.getAuditorId() == null) {
            // already set in schedule fallback above if available
        }

        // Sync bi-directional relationship
        if (observation.getDetails() != null) {
            for (AuditObservationDetail detail : observation.getDetails()) {
                detail.setAuditObservation(observation);
                if ("COMPLIANCE".equalsIgnoreCase(detail.getObservationStatus())
                        || "PENDING".equalsIgnoreCase(detail.getObservationStatus())
                        || "NOT APPLICABLE".equalsIgnoreCase(detail.getObservationStatus())
                        || "NOT_APPLICABLE".equalsIgnoreCase(detail.getObservationStatus())
                        || "NO ENTRY".equalsIgnoreCase(detail.getObservationStatus())
                        || "NO_ENTRY".equalsIgnoreCase(detail.getObservationStatus())) {
                    detail.setApprovalStatus("APPROVED");
                    detail.setNcrStatus(null);
                } else {
                    if (detail.getNcrStatus() == null && ("NC".equalsIgnoreCase(detail.getObservationStatus())
                            || "NCR".equalsIgnoreCase(detail.getObservationStatus())
                            || "OFI".equalsIgnoreCase(detail.getObservationStatus()))) {
                        detail.setNcrStatus("PENDING");
                    }
                    if (detail.getApprovalStatus() == null || "APPROVED".equalsIgnoreCase(detail.getApprovalStatus())) {
                        detail.setApprovalStatus("PENDING");
                    }
                }
            }
        }

        AuditObservation saved = auditObservationRepository.save(observation);
        syncDetailAttachments(saved.getDetails());
        populateDetailAttachmentPaths(saved.getDetails());
        closedNcrService.syncClosedNcr(saved);
        closeAuditSchedule(saved.getId(), saved.getAuditScheduleNo() != null ? saved.getAuditScheduleNo() : observation.getAuditScheduleNo());
        return saved;
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1230", action = "write")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<AuditObservation> update(@PathVariable Long id,
            @jakarta.validation.Valid @RequestBody AuditObservation details) {
        validateAttendanceAndSetScores(details);

        if (details.getAuditScheduleNo() != null) {
            auditScheduleRepository.findByScheduleNoIgnoreCase(details.getAuditScheduleNo().trim())
                    .ifPresent(schedule -> {
                        if ("CANCEL".equalsIgnoreCase(schedule.getStatus())
                                || "CANCELLED".equalsIgnoreCase(schedule.getStatus())
                                || "AUTO CLOSED".equalsIgnoreCase(schedule.getStatus())) {
                            throw new RuntimeException("Cannot perform audit operations on a cancelled or auto closed schedule.");
                        }

                        // Ensure assigned Auditor, Auditee, NCR Approver, Co-ordinator, QMS Admin, or External Audit can modify observations
                        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                        boolean isAuthorized = "SUPER BOSS".equalsIgnoreCase(currentUserId);
                        if (!isAuthorized && currentUserId != null) {
                            com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(currentUserId).orElse(null);
                            if (credential != null && credential.getUserLevel() != null && credential.getUserLevel() >= 5) {
                                isAuthorized = true;
                            }
                            if (!isAuthorized && credential != null && credential.getEmpId() != null) {
                                if (credential.getEmpId().equals(schedule.getAuditorId())
                                        || credential.getEmpId().equals(schedule.getAuditeeId())
                                        || credential.getEmpId().equals(schedule.getNcrApprovedById())
                                        || credential.getEmpId().equals(schedule.getCoOrdinatorId())) {
                                    isAuthorized = true;
                                }
                            }
                            if (!isAuthorized && (schedule.getAuditorId() == null || (schedule.getExternalName() != null && !schedule.getExternalName().trim().isEmpty()))) {
                                isAuthorized = true;
                            }
                        }
                        if (!isAuthorized) {
                            throw new RuntimeException("Unauthorized: Only the assigned Auditor of this schedule or QMS Administrators can modify observations.");
                        }
                    });
        }
        return auditObservationRepository.findById(id)
                .map(observation -> {
                    observation.setObservationNo(details.getObservationNo());
                    // Fix: Ensure observationDate is always set, fall back to today if null
                    if (details.getObservationDate() != null) {
                        observation.setObservationDate(details.getObservationDate());
                    } else if (observation.getObservationDate() == null) {
                        observation.setObservationDate(new java.util.Date());
                    }
                    observation.setAuditScheduleNo(details.getAuditScheduleNo());
                    observation.setAuditType(details.getAuditType());
                    observation.setAuditArea(details.getAuditArea());
                    observation.setDepartmentName(details.getDepartmentName());
                    if (details.getDepartmentName() != null) {
                        departmentRepository.findByDepartmentName(details.getDepartmentName())
                                .ifPresent(d -> observation.setDepartmentId(d.getId()));
                    } else {
                        observation.setDepartmentId(details.getDepartmentId());
                    }
                    observation.setAuditee(details.getAuditee());
                    observation.setAuditor(details.getAuditor());
                    observation.setNcrApprovedBy(details.getNcrApprovedBy());
                    // Fix: Explicitly set IDs from payload in case string-based setters fail to resolve
                    if (details.getAuditorId() != null) observation.setAuditorId(details.getAuditorId());
                    if (details.getAuditeeId() != null) observation.setAuditeeId(details.getAuditeeId());
                    if (details.getNcrApprovedById() != null) observation.setNcrApprovedById(details.getNcrApprovedById());
                    if (details.getDepartmentId() != null && observation.getDepartmentId() == null) observation.setDepartmentId(details.getDepartmentId());
                    observation.setStatus(details.getStatus());
                    observation.setAuditScore(details.getAuditScore());
                    observation.setOfiCount(details.getOfiCount());
                    observation.setComplianceCount(details.getComplianceCount());
                    observation.setNcrCount(details.getNcrCount());
                    observation.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());

                    // Handle details update using Hibernate-friendly merge/sync
                    java.util.Set<Long> incomingIds = new java.util.HashSet<>();
                    if (details.getDetails() != null) {
                        for (AuditObservationDetail d : details.getDetails()) {
                            if (d.getId() != null) {
                                incomingIds.add(d.getId());
                            }
                        }
                    }
                    observation.getDetails().removeIf(d -> d.getId() != null && !incomingIds.contains(d.getId()));

                    if (details.getDetails() != null) {
                        for (AuditObservationDetail incomingDetail : details.getDetails()) {
                            if (incomingDetail.getId() != null) {
                                // Find and update existing
                                for (AuditObservationDetail existingDetail : observation.getDetails()) {
                                    if (existingDetail.getId().equals(incomingDetail.getId())) {
                                        existingDetail.setSeqNo(incomingDetail.getSeqNo());
                                        existingDetail.setClause(incomingDetail.getClause());
                                        existingDetail.setCriteriaDetails(incomingDetail.getCriteriaDetails());
                                        existingDetail.setAttachmentReq(incomingDetail.getAttachmentReq());
                                        existingDetail.setAttachmentPath(incomingDetail.getAttachmentPath());
                                        existingDetail.setObservationStatus(incomingDetail.getObservationStatus());
                                        existingDetail.setComments(incomingDetail.getComments());

                                        if ("COMPLIANCE".equalsIgnoreCase(incomingDetail.getObservationStatus())
                                                || "PENDING".equalsIgnoreCase(incomingDetail.getObservationStatus())
                                                || "NOT APPLICABLE"
                                                        .equalsIgnoreCase(incomingDetail.getObservationStatus())
                                                || "NOT_APPLICABLE"
                                                        .equalsIgnoreCase(incomingDetail.getObservationStatus())
                                                || "NO ENTRY".equalsIgnoreCase(incomingDetail.getObservationStatus())
                                                || "NO_ENTRY".equalsIgnoreCase(incomingDetail.getObservationStatus())) {
                                            existingDetail.setApprovalStatus("APPROVED");
                                            existingDetail.setNcrStatus(null);
                                        } else {
                                            if (incomingDetail.getNcrStatus() != null) {
                                                existingDetail.setNcrStatus(incomingDetail.getNcrStatus());
                                            } else if (existingDetail.getNcrStatus() == null && ("NC"
                                                    .equalsIgnoreCase(incomingDetail.getObservationStatus())
                                                    || "NCR".equalsIgnoreCase(incomingDetail.getObservationStatus())
                                                    || "OFI".equalsIgnoreCase(incomingDetail.getObservationStatus()))) {
                                                existingDetail.setNcrStatus("PENDING");
                                            }
                                            if (incomingDetail.getApprovalStatus() != null) {
                                                if ("APPROVED".equalsIgnoreCase(incomingDetail.getApprovalStatus())) {
                                                    existingDetail.setApprovalStatus("PENDING");
                                                } else {
                                                    existingDetail
                                                            .setApprovalStatus(incomingDetail.getApprovalStatus());
                                                }
                                            } else {
                                                if (existingDetail.getApprovalStatus() == null || "APPROVED"
                                                        .equalsIgnoreCase(existingDetail.getApprovalStatus())) {
                                                    existingDetail.setApprovalStatus("PENDING");
                                                }
                                            }
                                        }
                                        if (incomingDetail.getRootCause() != null) {
                                            existingDetail.setRootCause(incomingDetail.getRootCause());
                                        }
                                        if (incomingDetail.getCorrectiveAction() != null) {
                                            existingDetail.setCorrectiveAction(incomingDetail.getCorrectiveAction());
                                        }
                                        if (incomingDetail.getPreventiveAction() != null) {
                                            existingDetail.setPreventiveAction(incomingDetail.getPreventiveAction());
                                        }
                                        if (incomingDetail.getTargetDate() != null) {
                                            existingDetail.setTargetDate(incomingDetail.getTargetDate());
                                        }
                                        if (incomingDetail.getNcrNo() != null) {
                                            existingDetail.setNcrNo(incomingDetail.getNcrNo());
                                        }
                                        break;
                                    }
                                }
                            } else {
                                // Add new detail
                                incomingDetail.setAuditObservation(observation);
                                if ("COMPLIANCE".equalsIgnoreCase(incomingDetail.getObservationStatus())
                                        || "PENDING".equalsIgnoreCase(incomingDetail.getObservationStatus())
                                        || "NOT APPLICABLE".equalsIgnoreCase(incomingDetail.getObservationStatus())
                                        || "NOT_APPLICABLE".equalsIgnoreCase(incomingDetail.getObservationStatus())
                                        || "NO ENTRY".equalsIgnoreCase(incomingDetail.getObservationStatus())
                                        || "NO_ENTRY".equalsIgnoreCase(incomingDetail.getObservationStatus())) {
                                    incomingDetail.setApprovalStatus("APPROVED");
                                    incomingDetail.setNcrStatus(null);
                                } else {
                                    if (incomingDetail.getNcrStatus() == null
                                            && ("NC".equalsIgnoreCase(incomingDetail.getObservationStatus())
                                                    || "NCR".equalsIgnoreCase(incomingDetail.getObservationStatus())
                                                    || "OFI".equalsIgnoreCase(incomingDetail.getObservationStatus()))) {
                                        incomingDetail.setNcrStatus("PENDING");
                                    }
                                    if (incomingDetail.getApprovalStatus() == null
                                            || "APPROVED".equalsIgnoreCase(incomingDetail.getApprovalStatus())) {
                                        incomingDetail.setApprovalStatus("PENDING");
                                    }
                                }
                                observation.getDetails().add(incomingDetail);
                            }
                        }
                    }

                    validateAttendanceAndSetScores(observation);
                    AuditObservation saved = auditObservationRepository.save(observation);
                    syncDetailAttachments(saved.getDetails());
                    populateDetailAttachmentPaths(saved.getDetails());
                    closedNcrService.syncClosedNcr(saved);
                    closeAuditSchedule(saved.getId(), saved.getAuditScheduleNo() != null ? saved.getAuditScheduleNo() : details.getAuditScheduleNo());
                    return ResponseEntity.ok(saved);
                }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/ncr/approve/{detailId}")
    @RequirePagePermission(pageCode = "QM1250", action = "approval")
    @Operation(summary = "Approve NCR Closure", description = "Approves the corrective action and closes the finding")
    public ResponseEntity<?> approveNcr(@PathVariable Integer detailId,
            @RequestParam(required = false) String remarks) {
        try {
            ncrOfiService.approveNcr(detailId, remarks);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PutMapping("/ncr/reject/{detailId}")
    @RequirePagePermission(pageCode = "QM1250", action = "approval")
    @Operation(summary = "Reject NCR Closure", description = "Rejects the closure and sends back to owner")
    public ResponseEntity<?> rejectNcr(
            @PathVariable Integer detailId,
            @RequestParam String approvalComment,
            @RequestParam String rejectionComment) {
        try {
            ncrOfiService.rejectNcr(detailId, approvalComment, rejectionComment);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PutMapping("/ncr/rework/{detailId}")
    @RequirePagePermission(pageCode = "QM1250", action = "approval")
    @Operation(summary = "Request Rework", description = "Sends finding back for corrective action rework")
    public ResponseEntity<?> reworkNcr(@PathVariable Integer detailId, @RequestParam(required = false) String remarks) {
        try {
            ncrOfiService.reworkNcr(detailId, remarks);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // ── Close NCR Verification page (QM1250) ────────────────────────────────

    /**
     * GET /api/qms/audit/observation/ncr/verify-findings
     *
     * Reads NCR/OFI findings from QMS_NCR_REWORK_LOG filtered by VERIFY_STATUS.
     * Used exclusively by the "Close NCR Verification" page (QM1250).
     * Reuses the same mapReworkRowToDto projection as rework-findings.
     */
    @GetMapping("/ncr/verify-findings")
    @RequirePagePermission(pageCode = "QM1250", action = "read")
    @Operation(summary = "Get NCR Verify Findings",
               description = "Fetches NC/OFI findings from QMS_NCR_REWORK_LOG filtered by VERIFY_STATUS for the Verification page.")
    public List<NcrOfiDto> getVerifyFindings(
            @RequestParam(required = false, defaultValue = "Pending For Verify") String verifyStatus,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false, defaultValue = "No") String considerDate,
            @RequestParam(required = false) String observationStatus,
            @RequestParam(required = false) String query) {

        java.util.Date parsedFromDate = null;
        java.util.Date parsedToDate  = null;
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        try { if (fromDate != null && !fromDate.trim().isEmpty()) parsedFromDate = sdf.parse(fromDate); } catch (Exception ignored) {}
        try { if (toDate   != null && !toDate.trim().isEmpty())   parsedToDate   = sdf.parse(toDate);   } catch (Exception ignored) {}

        String effectiveVerifyStatus   = (verifyStatus == null || verifyStatus.trim().isEmpty()) ? "Pending For Verify" : verifyStatus.trim();
        String effectiveObsStatus      = (observationStatus == null || observationStatus.trim().isEmpty() || "All".equalsIgnoreCase(observationStatus)) ? null : observationStatus;
        String effectiveQuery          = (query == null || query.trim().isEmpty()) ? null : query.trim();

        List<Object[]> rows = ncrReworkLogRepository.findVerifyFindings(
                effectiveVerifyStatus,
                effectiveObsStatus,
                considerDate,
                parsedFromDate,
                parsedToDate,
                effectiveQuery);

        return rows.stream().map(this::mapReworkRowToDto).collect(Collectors.toList());
    }

    /**
     * PUT /api/qms/audit/observation/ncr/verify/{logId}
     * Verifies an NCR finding from the Verification page (QM1250).
     */
    @PutMapping("/ncr/verify/{logId}")
    @RequirePagePermission(pageCode = "QM1250", action = "write")
    @Operation(summary = "Verify NCR", description = "Marks an NCR finding as VERIFIED from the Verification page")
    public ResponseEntity<?> verifyNcr(@PathVariable Integer logId,
            @RequestParam(required = false) String remarks) {
        try {
            ncrOfiService.verifyNcr(logId, remarks);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * PUT /api/qms/audit/observation/ncr/verify-reject/{logId}
     * Rejects an NCR finding from the Verification page (QM1250), sending it back to UNRESOLVED.
     */
    @PutMapping("/ncr/verify-reject/{logId}")
    @RequirePagePermission(pageCode = "QM1250", action = "write")
    @Operation(summary = "Reject NCR Verification", description = "Rejects an NCR finding during verification, resetting it to UNRESOLVED")
    public ResponseEntity<?> verifyRejectNcr(@PathVariable Integer logId,
            @RequestParam(required = false) String verificationComment,
            @RequestParam String rejectionReason) {
        try {
            ncrOfiService.verifyRejectNcr(logId, verificationComment, rejectionReason);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1230", action = "delete")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            return auditObservationRepository.findById(id)
                    .map(observation -> {
                        // Check if any details have NCR/OFI connected
                        boolean hasNcr = observation.getDetails().stream()
                                .anyMatch(d -> d.getNcrNo() != null && !d.getNcrNo().trim().isEmpty());
                        if (hasNcr) {
                            throw new RuntimeException(
                                    "Cannot delete this audit observation because an NCR has already been recorded for it.");
                        }
                        closedNcrService.deleteClosedNcrForObservation(observation.getId());
                        auditObservationRepository.delete(observation);
                        return ResponseEntity.ok().build();
                    }).orElse(ResponseEntity.notFound().build());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/next-no")
    @Operation(summary = "Get Next Observation Number", description = "Generates the next available sequence from Prefix Credentials")
    public String getNextNo() {
        java.time.LocalDate now = java.time.LocalDate.now();
        String currentYearShort = String.valueOf(now.getYear() % 100);
        String prefix = "OB-" + currentYearShort + "-";
        int digits = 3;
        try {
            java.util.List<com.autonoma.erp.model.admin.PrefixCredential> allCreds = prefixCredentialRepository.findAll();
            String currentAccountYear = now.getYear() + "-" + (now.getYear() + 1);
            com.autonoma.erp.model.admin.PrefixCredential cred = allCreds.stream()
                    .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                    .filter(c -> currentAccountYear.equals(c.getAccountYear()))
                    .findFirst()
                    .orElse(allCreds.stream()
                            .filter(c -> c.getStatus() != null && c.getStatus() == 1)
                            .findFirst().orElse(null));

            if (cred != null && cred.getObservationPrefix() != null && !cred.getObservationPrefix().trim().isEmpty()) {
                String configuredPrefix = cred.getObservationPrefix().trim();
                if (!configuredPrefix.contains("-") && !configuredPrefix.contains("/")) {
                    configuredPrefix = configuredPrefix + "-" + currentYearShort + "-";
                }
                prefix = configuredPrefix;
                digits = cred.getObservationDigit() != null ? cred.getObservationDigit() : 3;
            }
        } catch (Exception e) {
            // Fallback to standard prefix if error occurs
        }

        String searchPattern = prefix + "%";
        String lastNo = null;
        try {
            lastNo = jdbcTemplate.queryForObject(
                    "SELECT TOP 1 OBSERVATION_NO FROM QMS_AUDIT_OBSERVATION WHERE OBSERVATION_NO LIKE ? ORDER BY ID DESC", 
                    String.class, searchPattern);
        } catch (Exception e) {}
        
        long nextNum = 1;
        if (lastNo != null) {
            try {
                String numStr = lastNo;
                if (!prefix.isEmpty() && numStr.startsWith(prefix)) {
                    numStr = numStr.substring(prefix.length());
                }
                nextNum = Long.parseLong(numStr) + 1;
            } catch (Exception e) {}
        }
        return prefix + String.format("%0" + digits + "d", nextNum);
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Generate Audit Observation PDF Report")
    public ResponseEntity<byte[]> getPdfReport(@PathVariable Long id) {
        try {
            AuditObservation obs = auditObservationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Audit Observation not found with ID: " + id));
            populateDetailAttachmentPaths(obs.getDetails());

            // Find associated schedule & attendance
            AuditSchedule schedule = null;
            List<AuditAttendance> attendanceList = new java.util.ArrayList<>();
            if (obs.getAuditScheduleNo() != null) {
                schedule = auditScheduleRepository.findByScheduleNoIgnoreCase(obs.getAuditScheduleNo().trim())
                        .orElse(null);
                attendanceList = auditAttendanceRepository.findByAuditScheduleNo(obs.getAuditScheduleNo().trim());
            }

            // Find company credentials
            CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);

            // Find auditee employee details to extract Designation Level
            String auditeeName = "";
            String auditeeCode = "";
            String auditeeDept = "";
            String auditeeLevel = "-";
            if (obs.getAuditee() != null) {
                String auditeeStr = obs.getAuditee();
                if (auditeeStr.contains(" - ")) {
                    String[] parts = auditeeStr.split(" - ");
                    auditeeName = parts[0].trim();
                    auditeeCode = parts[1].trim();
                } else {
                    auditeeName = auditeeStr.trim();
                }
            }
            if (obs.getDepartmentName() != null) {
                auditeeDept = obs.getDepartmentName();
            }

            if (!auditeeCode.isEmpty()) {
                java.util.Optional<EmployeeMaster> empOpt = employeeMasterRepository.findByEmpCode(auditeeCode);
                if (empOpt.isPresent()) {
                    EmployeeMaster emp = empOpt.get();
                    if (emp.getEmployeeName() != null) {
                        auditeeName = emp.getEmployeeName();
                    }
                    if (emp.getDepartment() != null) {
                        auditeeDept = emp.getDepartment().getDepartmentName();
                    }
                    if (emp.getEmpLevelId() != null) {
                        java.util.Optional<DesignationLevel> lvlOpt = designationLevelRepository
                                .findById(emp.getEmpLevelId());
                        if (lvlOpt.isPresent()) {
                            auditeeLevel = lvlOpt.get().getLevel();
                        }
                    }
                }
            }

            // Create Document in Landscape with margins: L:36, R:36, T:130, B:40
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 130, 40);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = PdfWriter.getInstance(document, out);

            // Load logo image
            Image logoImg = null;
            try {
                java.net.URL logoUrl = getClass().getResource("/static/logo.png");
                if (logoUrl != null) {
                    logoImg = Image.getInstance(logoUrl);
                }
            } catch (Exception ex) {
                System.err.println("[AuditObservationController] Error loading logo: " + ex.getMessage());
            }

            // Set Header and Footer event helper
            PageHeaderFooter eventHelper = new PageHeaderFooter(company, logoImg);
            writer.setPageEvent(eventHelper);

            document.open();

            // Fonts
            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA, 14, Font.BOLD, BaseColor.BLACK);
            Font fontHeaderBg = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.BOLD, BaseColor.WHITE);
            Font fontCellBold = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.BOLD, BaseColor.BLACK);
            Font fontCellNormal = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, BaseColor.BLACK);
            Font fontBigScore = FontFactory.getFont(FontFactory.HELVETICA, 14, Font.BOLD, BaseColor.BLACK);
            BaseColor tableBorderColor = new BaseColor(200, 200, 200);
            BaseColor headerBgColor = new BaseColor(26, 34, 63); // Navy background matching theme

            // Title Table (Only Page 1)
            PdfPTable titleTable = new PdfPTable(1);
            titleTable.setWidthPercentage(100);
            titleTable.setSpacingAfter(8f);
            PdfPCell titleCell = new PdfPCell(new Phrase("AUDIT REPORT", fontTitle));
            titleCell.setBackgroundColor(new BaseColor(230, 230, 230));
            titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            titleCell.setPadding(6f);
            titleCell.setBorderColor(tableBorderColor);
            titleTable.addCell(titleCell);
            document.add(titleTable);

            // Metadata Table (Only Page 1)
            float[] metaWidths = { 18f, 32f, 18f, 32f };
            PdfPTable metaTable = new PdfPTable(metaWidths);
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingAfter(12f);

            // Row 1
            metaTable.addCell(createCell("Observation No:", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(obs.getObservationNo() != null ? obs.getObservationNo() : "-", fontCellNormal,
                    Element.ALIGN_LEFT, tableBorderColor));

            PdfPCell auditeeHeaderCell = createCell("AUDITEE DETAILS", fontCellBold, Element.ALIGN_CENTER,
                    tableBorderColor);
            auditeeHeaderCell.setBackgroundColor(new BaseColor(240, 240, 240));
            auditeeHeaderCell.setColspan(2);
            metaTable.addCell(auditeeHeaderCell);

            // Row 2
            metaTable.addCell(createCell("Observation Date:", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(formatDate(obs.getObservationDate()), fontCellNormal, Element.ALIGN_LEFT,
                    tableBorderColor));
            metaTable.addCell(createCell("Name", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(auditeeName.isEmpty() ? "-" : auditeeName, fontCellNormal, Element.ALIGN_LEFT,
                    tableBorderColor));

            // Row 3
            metaTable.addCell(createCell("Schedule No:", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(obs.getAuditScheduleNo() != null ? obs.getAuditScheduleNo() : "-",
                    fontCellNormal, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell("Code", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(auditeeCode.isEmpty() ? "-" : auditeeCode, fontCellNormal, Element.ALIGN_LEFT,
                    tableBorderColor));

            // Row 4
            metaTable.addCell(createCell("Schedule Date:", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(schedule != null ? formatDate(schedule.getScheduleDate()) : "-",
                    fontCellNormal, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell("Department Name:", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(auditeeDept.isEmpty() ? "-" : auditeeDept, fontCellNormal, Element.ALIGN_LEFT,
                    tableBorderColor));

            // Row 5
            metaTable.addCell(createCell("Audit Type:", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(obs.getAuditType() != null ? obs.getAuditType() : "-", fontCellNormal,
                    Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell("Level", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(auditeeLevel, fontCellNormal, Element.ALIGN_LEFT, tableBorderColor));

            // Row 6
            metaTable.addCell(createCell("Audit Actual Date:", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(schedule != null ? formatDate(schedule.getAuditDate()) : "-", fontCellNormal,
                    Element.ALIGN_LEFT, tableBorderColor));

            metaTable.addCell(createCell("AVERAGE", fontCellBold, Element.ALIGN_CENTER, tableBorderColor));
            PdfPCell scoreValCell = createCell(obs.getAuditScore() != null ? String.valueOf(obs.getAuditScore()) : "0",
                    fontBigScore, Element.ALIGN_CENTER, tableBorderColor);
            scoreValCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            metaTable.addCell(scoreValCell);

            // Row 7
            metaTable.addCell(createCell("Department Name:", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(obs.getDepartmentName() != null ? obs.getDepartmentName() : "-",
                    fontCellNormal, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell("", fontCellNormal, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell("", fontCellNormal, Element.ALIGN_LEFT, tableBorderColor));

            // Row 8
            metaTable.addCell(createCell("Status:", fontCellBold, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell(obs.getStatus() != null ? obs.getStatus() : "-", fontCellNormal,
                    Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell("", fontCellNormal, Element.ALIGN_LEFT, tableBorderColor));
            metaTable.addCell(createCell("", fontCellNormal, Element.ALIGN_LEFT, tableBorderColor));

            document.add(metaTable);

            // Audit Attendance Header
            PdfPTable attendanceHeaderTable = new PdfPTable(1);
            attendanceHeaderTable.setWidthPercentage(100);
            PdfPCell attHeaderCell = new PdfPCell(new Phrase("Audit Attendance", fontCellBold));
            attHeaderCell.setBackgroundColor(new BaseColor(240, 240, 240));
            attHeaderCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            attHeaderCell.setPadding(4f);
            attHeaderCell.setBorderColor(tableBorderColor);
            attendanceHeaderTable.addCell(attHeaderCell);
            document.add(attendanceHeaderTable);

            // Audit Attendance Table
            float[] attColWidths = { 8f, 42f, 15f, 15f, 20f };
            PdfPTable attendanceTable = new PdfPTable(attColWidths);
            attendanceTable.setWidthPercentage(100);
            attendanceTable.setSpacingAfter(12f);
            attendanceTable.setHeaderRows(1);

            String[] attHeaders = { "S.No", "Employee Name", "In Time", "Out Time", "Status" };
            for (String header : attHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(header, fontHeaderBg));
                cell.setBackgroundColor(headerBgColor);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                cell.setPadding(5f);
                cell.setBorderColor(tableBorderColor);
                attendanceTable.addCell(cell);
            }

            int attSNo = 1;
            if (attendanceList != null && !attendanceList.isEmpty()) {
                for (AuditAttendance att : attendanceList) {
                    attendanceTable.addCell(createCell(String.valueOf(attSNo++), fontCellNormal, Element.ALIGN_CENTER,
                            tableBorderColor));
                    attendanceTable.addCell(createCell(att.getName() != null ? att.getName() : "-", fontCellNormal,
                            Element.ALIGN_LEFT, tableBorderColor));
                    attendanceTable.addCell(createCell(att.getInTime() != null ? att.getInTime() : "-", fontCellNormal,
                            Element.ALIGN_CENTER, tableBorderColor));
                    attendanceTable.addCell(createCell(att.getOutTime() != null ? att.getOutTime() : "-",
                            fontCellNormal, Element.ALIGN_CENTER, tableBorderColor));
                    attendanceTable
                            .addCell(createCell(att.getAttendanceStatus() != null ? att.getAttendanceStatus() : "-",
                                    fontCellNormal, Element.ALIGN_CENTER, tableBorderColor));
                }
            } else {
                PdfPCell emptyCell = createCell("No attendance records found", fontCellNormal, Element.ALIGN_CENTER,
                        tableBorderColor);
                emptyCell.setColspan(5);
                attendanceTable.addCell(emptyCell);
            }
            document.add(attendanceTable);

            // Audit Findings Checklist Header
            PdfPTable detailsHeaderTable = new PdfPTable(1);
            detailsHeaderTable.setWidthPercentage(100);
            PdfPCell dHeaderCell = new PdfPCell(new Phrase("Audit Findings Checklist", fontCellBold));
            dHeaderCell.setBackgroundColor(new BaseColor(240, 240, 240));
            dHeaderCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            dHeaderCell.setPadding(4f);
            dHeaderCell.setBorderColor(tableBorderColor);
            detailsHeaderTable.addCell(dHeaderCell);
            document.add(detailsHeaderTable);

            // Criteria Details Table
            float[] colWidths = { 5f, 8f, 15f, 35f, 7f, 10f, 10f, 10f };
            PdfPTable detailsTable = new PdfPTable(colWidths);
            detailsTable.setWidthPercentage(100);
            detailsTable.setHeaderRows(1);

            // Table Headers
            String[] headers = { "S.No", "Seq.No", "Clause", "Criteria", "Attachment", "Observation Status",
                    "Approval Status", "Comments" };
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, fontHeaderBg));
                cell.setBackgroundColor(headerBgColor);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                cell.setPadding(5f);
                cell.setBorderColor(tableBorderColor);
                detailsTable.addCell(cell);
            }

            // Populate Table Rows
            int sNo = 1;
            List<AuditObservationDetail> detailsList = obs.getDetails();
            if (detailsList != null) {
                for (AuditObservationDetail d : detailsList) {
                    detailsTable.addCell(
                            createCell(String.valueOf(sNo++), fontCellNormal, Element.ALIGN_CENTER, tableBorderColor));
                    detailsTable.addCell(createCell(d.getSeqNo() != null ? d.getSeqNo() : "-", fontCellNormal,
                            Element.ALIGN_CENTER, tableBorderColor));
                    detailsTable.addCell(createCell(d.getClause() != null ? d.getClause() : "-", fontCellNormal,
                            Element.ALIGN_LEFT, tableBorderColor));
                    detailsTable.addCell(createCell(d.getCriteriaDetails() != null ? d.getCriteriaDetails() : "-",
                            fontCellNormal, Element.ALIGN_LEFT, tableBorderColor));
                    detailsTable.addCell(createCell(Boolean.TRUE.equals(d.getAttachmentReq()) ? "YES" : "NO",
                            fontCellNormal, Element.ALIGN_CENTER, tableBorderColor));
                    detailsTable.addCell(createCell(d.getObservationStatus() != null ? d.getObservationStatus() : "-",
                            fontCellNormal, Element.ALIGN_CENTER, tableBorderColor));
                    detailsTable.addCell(createCell(d.getApprovalStatus() != null ? d.getApprovalStatus() : "-",
                            fontCellNormal, Element.ALIGN_CENTER, tableBorderColor));
                    detailsTable.addCell(createCell(d.getComments() != null ? d.getComments() : "-", fontCellNormal,
                            Element.ALIGN_LEFT, tableBorderColor));
                }
            }

            document.add(detailsTable);
            document.close();

            byte[] pdfBytes = out.toByteArray();
            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.APPLICATION_PDF);
            responseHeaders.setContentDisposition(ContentDisposition.builder("attachment")
                    .filename("Audit_Report_" + obs.getObservationNo() + ".pdf")
                    .build());
            return new ResponseEntity<>(pdfBytes, responseHeaders, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private static PdfPCell createCell(String text, Font font, int alignment, BaseColor borderColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4f);
        cell.setBorderColor(borderColor);
        return cell;
    }

    private static String formatDate(java.util.Date date) {
        if (date == null)
            return "-";
        return new java.text.SimpleDateFormat("dd-MM-yyyy").format(date);
    }

    private static class PageHeaderFooter extends PdfPageEventHelper {
        private final CompanyCredential company;
        private final Image logoImg;
        private PdfTemplate totalPages;

        PageHeaderFooter(CompanyCredential company, Image logoImg) {
            this.company = company;
            this.logoImg = logoImg;
        }

        @Override
        public void onOpenDocument(PdfWriter writer, Document document) {
            totalPages = writer.getDirectContent().createTemplate(30, 16);
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            float pageHeight = document.getPageSize().getHeight();
            float pageWidth = document.getPageSize().getWidth();

            // Draw Repeating Company Header Table at top
            try {
                float[] headerWidths = { 15f, 85f };
                PdfPTable headerTable = new PdfPTable(headerWidths);
                headerTable.setTotalWidth(pageWidth - 72f); // margin left 36 + margin right 36 = 72

                // Logo cell
                PdfPCell logoCell = new PdfPCell();
                logoCell.setBorder(Rectangle.BOX);
                logoCell.setPadding(4f);
                logoCell.setBorderColor(new BaseColor(200, 200, 200));
                logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                if (logoImg != null) {
                    logoImg.scaleToFit(70f, 45f);
                    logoCell.addElement(logoImg);
                } else {
                    logoCell.addElement(
                            new Paragraph("NUTECH", FontFactory.getFont(FontFactory.HELVETICA, 10, Font.BOLD)));
                }
                headerTable.addCell(logoCell);

                // Address/Info cell
                PdfPCell textCell = new PdfPCell();
                textCell.setBorder(Rectangle.BOX);
                textCell.setPadding(4f);
                textCell.setBorderColor(new BaseColor(200, 200, 200));
                textCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                textCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

                String companyName = company != null && company.getCompanyName() != null ? company.getCompanyName()
                        : "NUTECH WIND PARTS PVT, LTD";
                Paragraph pName = new Paragraph(companyName, FontFactory.getFont(FontFactory.HELVETICA, 11, Font.BOLD));
                pName.setAlignment(Element.ALIGN_CENTER);
                textCell.addElement(pName);

                String addressStr = company != null && company.getAddress() != null ? company.getAddress()
                        : "ANPPA, Baba Jagajeevan Ram Street,\nGanapathypuram, Chennai-600113";
                String cityState = company != null ? ((company.getCity() != null ? company.getCity() + ", " : "") +
                        (company.getState() != null ? company.getState() + ", " : "") +
                        (company.getCountry() != null ? company.getCountry() + "." : "")) : "TAMIL NADU, INDIA.";
                Paragraph pAddr = new Paragraph(addressStr.replace("\n", " ") + " " + cityState,
                        FontFactory.getFont(FontFactory.HELVETICA, 7.5f, Font.NORMAL));
                pAddr.setAlignment(Element.ALIGN_CENTER);
                textCell.addElement(pAddr);

                String phone = company != null && company.getPhoneNo() != null ? company.getPhoneNo()
                        : "+91-9840488424, 9840488950";
                String gst = company != null && company.getGstIn() != null ? company.getGstIn() : "33AAECA8870K1Z9";
                Paragraph pContact = new Paragraph("Phone: " + phone + "   GST IN: " + gst,
                        FontFactory.getFont(FontFactory.HELVETICA, 7.5f, Font.NORMAL));
                pContact.setAlignment(Element.ALIGN_CENTER);
                textCell.addElement(pContact);

                String email = company != null && company.getEmailId() != null ? company.getEmailId()
                        : "admin@nutechwindparts.com";
                String website = company != null && company.getWebsite() != null ? company.getWebsite()
                        : "www.nutechwindparts.com";
                Paragraph pEmail = new Paragraph("Email: " + email + "   Web Site: " + website,
                        FontFactory.getFont(FontFactory.HELVETICA, 7.5f, Font.NORMAL));
                pEmail.setAlignment(Element.ALIGN_CENTER);
                textCell.addElement(pEmail);

                headerTable.addCell(textCell);

                // write header table
                headerTable.writeSelectedRows(0, -1, 36f, pageHeight - 20f, cb);
            } catch (Exception e) {
                System.err.println("[PageHeaderFooter] Error drawing header: " + e.getMessage());
            }

            // Draw Page Number Footer
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, BaseColor.GRAY);
            String pageText = "Page " + writer.getPageNumber() + " of ";
            float len = footerFont.getCalculatedBaseFont(false).getWidthPoint(pageText, 8);
            cb.beginText();
            cb.setFontAndSize(footerFont.getCalculatedBaseFont(false), 8);
            cb.setColorFill(BaseColor.GRAY);
            cb.setTextMatrix(pageWidth - 36f - len - 15f, 20f);
            cb.showText(pageText);
            cb.endText();
            cb.addTemplate(totalPages, pageWidth - 36f - 15f, 20f);
        }

        @Override
        public void onCloseDocument(PdfWriter writer, Document document) {
            totalPages.beginText();
            totalPages.setFontAndSize(FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, BaseColor.GRAY)
                    .getCalculatedBaseFont(false), 8);
            totalPages.setColorFill(BaseColor.GRAY);
            totalPages.showText(String.valueOf(writer.getPageNumber()));
            totalPages.endText();
        }
    }
}

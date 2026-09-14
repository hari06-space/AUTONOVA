package com.autonoma.erp.modules.qms.meeting.service;

import com.autonoma.erp.dto.MomActionSummaryDTO;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingUserAttendance;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMomAttendance;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMomMaster;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingUserAttendanceRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMomDetailsRepository;

import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMomMasterRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsPointTypeMasterRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsProcessTypeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.autonoma.erp.modules.qms.meeting.entity.QmsCloseMomAndVerify;
import com.autonoma.erp.modules.qms.meeting.repository.QmsCloseMomAndVerifyRepository;
import com.autonoma.erp.modules.qms.meeting.validator.ActionItemWorkflowValidator;

import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;

@Service
public class QmsMomMasterService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(QmsMomMasterService.class);
    private final QmsMomMasterRepository repository;
    private final EmployeeMasterRepository employeeRepository;
    private final UserRepository userRepository;
    private final com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository;
    private final com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository;
    private final NotificationService notificationService;
    private final com.autonoma.erp.modules.qms.meeting.repository.QmsMomDetailsRepository detailRepository;
    private final com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingUserAttendanceRepository meetingUserAttendanceRepository;
    private final com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository scheduleRepo;
    private final StatusMasterRepository statusRepo;
    private final QmsPointTypeMasterRepository pointTypeRepo;
    private final QmsProcessTypeMasterRepository processTypeRepo;
    private final ObjectMapper objectMapper;
    private final QmsCloseMomAndVerifyRepository closeMomAndVerifyRepository;
    private final ActionItemWorkflowValidator workflowValidator;
    private final com.autonoma.erp.modules.qms.meeting.service.QmsMomReportService reportService;
    private final com.autonoma.erp.modules.qms.meeting.repository.QmsAttachmentPathRepository attachmentRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private MeetingSchedulerService meetingSchedulerService;

    @org.springframework.beans.factory.annotation.Autowired
    public QmsMomMasterService(
            QmsMomMasterRepository repository,
            EmployeeMasterRepository employeeRepository,
            UserRepository userRepository,
            com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository,
            com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository,
            NotificationService notificationService,
            com.autonoma.erp.modules.qms.meeting.repository.QmsMomDetailsRepository detailRepository,
            com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingUserAttendanceRepository meetingUserAttendanceRepository,
            com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository scheduleRepo,
            StatusMasterRepository statusRepo,
            QmsPointTypeMasterRepository pointTypeRepo,
            QmsProcessTypeMasterRepository processTypeRepo,
            ObjectMapper objectMapper,
            QmsCloseMomAndVerifyRepository closeMomAndVerifyRepository,
            ActionItemWorkflowValidator workflowValidator,
            com.autonoma.erp.modules.qms.meeting.service.QmsMomReportService reportService,
            com.autonoma.erp.modules.qms.meeting.repository.QmsAttachmentPathRepository attachmentRepository,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.bosUserPageAuthRepository = bosUserPageAuthRepository;
        this.bosPageRepository = bosPageRepository;
        this.notificationService = notificationService;
        this.detailRepository = detailRepository;
        this.meetingUserAttendanceRepository = meetingUserAttendanceRepository;
        this.scheduleRepo = scheduleRepo;
        this.statusRepo = statusRepo;
        this.pointTypeRepo = pointTypeRepo;
        this.processTypeRepo = processTypeRepo;
        this.objectMapper = objectMapper;
        this.closeMomAndVerifyRepository = closeMomAndVerifyRepository;
        this.workflowValidator = workflowValidator;
        this.reportService = reportService;
        this.attachmentRepository = attachmentRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @jakarta.annotation.PostConstruct
    public void initMinNoColumn() {
        try {
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[QMS_MOM_DETAILS]') AND name = N'MIN_NO') " +
                "BEGIN ALTER TABLE QMS_MOM_DETAILS ADD MIN_NO NVARCHAR(100) NULL; END"
            );
            jdbcTemplate.execute(
                "WITH OrderedDetails AS (" +
                "    SELECT d.ID, m.MOM_NO, ROW_NUMBER() OVER (PARTITION BY d.MOM_ID ORDER BY d.ID ASC) AS SeqNum " +
                "    FROM QMS_MOM_DETAILS d JOIN QMS_MOM_MASTER m ON m.ID = d.MOM_ID " +
                "    WHERE d.MIN_NO IS NULL OR d.MIN_NO = ''" +
                ") " +
                "UPDATE d SET d.MIN_NO = od.MOM_NO + '/' + RIGHT('000' + CAST(od.SeqNum AS VARCHAR(10)), 3) " +
                "FROM QMS_MOM_DETAILS d JOIN OrderedDetails od ON od.ID = d.ID"
            );
        } catch (Exception e) {
            log.warn("Auto-migration for QMS_MOM_DETAILS.MIN_NO skipped or failed: {}", e.getMessage());
        }
    }

    @jakarta.annotation.PostConstruct
    public void migrateAssignedToAndByForCloseMom() {
        try {
            List<QmsCloseMomAndVerify> records = closeMomAndVerifyRepository.findAll();
            boolean updated = false;
            for (QmsCloseMomAndVerify rec : records) {
                if (rec.getAssignedToId() == null || rec.getAssignedById() == null) {
                    if (rec.getActionItemId() != null) {
                        QmsMomDetails det = detailRepository.findById(rec.getActionItemId()).orElse(null);
                        if (det != null) {
                            if (rec.getAssignedToId() == null) {
                                if ("INFO".equalsIgnoreCase(det.getProcessType()) && rec.getResponsibility() != null) {
                                    EmployeeMaster emp = employeeRepository
                                            .findByEmpCodeOrName(rec.getResponsibility().trim()).orElse(null);
                                    if (emp != null) {
                                        rec.setAssignedToId(emp.getId());
                                        updated = true;
                                    }
                                } else if (det.getAssignedTo() != null) {
                                    rec.setAssignedToId(det.getAssignedTo().getId());
                                    updated = true;
                                }
                            }
                            if (rec.getAssignedById() == null) {
                                if (det.getAssignedBy() != null) {
                                    rec.setAssignedById(det.getAssignedBy().getId());
                                    updated = true;
                                } else if (det.getMom() != null && det.getMom().getChairedBy() != null) {
                                    rec.setAssignedById(det.getMom().getChairedBy().getId());
                                    updated = true;
                                }
                            }
                        }
                    }
                }
            }
            if (updated) {
                closeMomAndVerifyRepository.saveAll(records);
                log.info(
                        "[Migration] Successfully updated ASSIGNED_TO_ID and ASSIGNED_BY_ID for existing Close MOM records.");
            }
        } catch (Exception e) {
            log.warn("[Migration] Failed to update ASSIGNED_TO_ID/ASSIGNED_BY_ID: {}", e.getMessage());
        }
    }

    public List<QmsMomMaster> getAllMoms(String role) {
        return getAllMoms(role, null, null, null);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<QmsMomMaster> getAllMoms(String role, String taskScope, String currentUser, Long memberId) {
        List<QmsMomMaster> allMoms = repository.findAllWithDetails();
        // Pre-fetch schedules and participants to populate Hibernate Session cache
        List<Long> scheduleIds = allMoms.stream()
                .map(m -> m.getSchedule() != null ? m.getSchedule().getId() : null)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());
        if (!scheduleIds.isEmpty()) {
            int partitionSize = 1000;
            for (int i = 0; i < scheduleIds.size(); i += partitionSize) {
                java.util.List<Long> chunk = scheduleIds.subList(i, Math.min(i + partitionSize, scheduleIds.size()));
                scheduleRepo.findActiveSchedulesWithParticipantsByIds(chunk);
            }
        }
        for (QmsMomMaster m : allMoms) {
            populateAttachments(m);
        }
        return allMoms;
    }

    /**
     * Lightweight paginated list endpoint for the MOM list page.
     * All filtering is applied server-side via a native SQL query using WITH
     * (NOLOCK).
     * Returns only the columns required for list display — never loads child
     * collections.
     */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public org.springframework.data.domain.Page<com.autonoma.erp.modules.qms.meeting.dto.QmsMomListItemDTO> getMomList(
            int page, int size,
            String momNo, String startDate, String endDate, String status) {

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);

        String momNoParam = (momNo != null && !momNo.trim().isEmpty()) ? momNo.trim() : null;
        String startDateParam = (startDate != null && !startDate.trim().isEmpty()) ? startDate.trim() : null;
        String endDateParam = (endDate != null && !endDate.trim().isEmpty()) ? endDate.trim() : null;
        String statusParam = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("All"))
                ? status.trim()
                : null;

        org.springframework.data.domain.Page<java.util.Map<String, Object>> raw = repository
                .findMomListPaged(momNoParam, startDateParam, endDateParam, statusParam, pageable);

        return raw.map(row -> {
            com.autonoma.erp.modules.qms.meeting.dto.QmsMomListItemDTO dto = new com.autonoma.erp.modules.qms.meeting.dto.QmsMomListItemDTO();
            dto.setId(toLong(row.get("id")));
            dto.setMomNo(toStr(row.get("momNo")));
            dto.setMomDate(toStr(row.get("momDate")));
            dto.setScheduleNo(toStr(row.get("scheduleNo")));
            dto.setMeetingTypeName(toStr(row.get("meetingTypeName")));
            dto.setStatus(toStr(row.get("status")));
            dto.setCreatedUser(toStr(row.get("createdUser")));
            dto.setCreatedAt(toDate(row.get("createdAt")));
            dto.setUpdatedUser(toStr(row.get("updatedUser")));
            dto.setUpdatedAt(toDate(row.get("updatedAt")));
            dto.setTotalDetails(toInt(row.get("totalDetails")));
            dto.setOpenCount(toInt(row.get("openCount")));
            dto.setClosedCount(toInt(row.get("closedCount")));
            dto.setPendingCount(toInt(row.get("pendingCount")));
            dto.setCancelledCount(toInt(row.get("cancelledCount")));
            return dto;
        });
    }

    private Long toLong(Object val) {
        if (val == null)
            return null;
        if (val instanceof Long)
            return (Long) val;
        if (val instanceof Number)
            return ((Number) val).longValue();
        try {
            return Long.parseLong(val.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private String toStr(Object val) {
        return val == null ? null : val.toString();
    }

    private int toInt(Object val) {
        if (val == null)
            return 0;
        if (val instanceof Number)
            return ((Number) val).intValue();
        try {
            return Integer.parseInt(val.toString());
        } catch (Exception e) {
            return 0;
        }
    }

    private java.util.Date toDate(Object val) {
        if (val == null)
            return null;
        if (val instanceof java.util.Date)
            return (java.util.Date) val;
        if (val instanceof java.sql.Timestamp)
            return new java.util.Date(((java.sql.Timestamp) val).getTime());
        return null;
    }

    private void ensureDetailsMinNo(QmsMomMaster mom) {
        if (mom != null && mom.getDetails() != null && !mom.getDetails().isEmpty()) {
            int seq = 1;
            boolean needSave = false;
            for (QmsMomDetails det : mom.getDetails()) {
                if (det.getMinNo() == null || det.getMinNo().trim().isEmpty()) {
                    det.setMinNo(mom.getMomNo() + "/" + String.format("%03d", seq));
                    needSave = true;
                }
                seq++;
            }
            if (needSave) {
                try {
                    repository.saveAndFlush(mom);
                } catch (Exception e) {
                    log.warn("Failed to auto-save missing minNo: {}", e.getMessage());
                }
            }
        }
    }

    public QmsMomMaster getMomById(Long id) {
        QmsMomMaster mom = repository.findById(id).orElseThrow(() -> new RuntimeException("MOM not found"));
        ensureDetailsMinNo(mom);
        populateAttachments(mom);
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new RuntimeException("Access Denied: You must be logged in to view MOM records.");
        }
        UserCredential user = userRepository.findByUserId(currentUserId).orElse(null);
        if (user == null) {
            throw new RuntimeException("Access Denied: User not found.");
        }
        return mom;
    }

    public List<com.autonoma.erp.dto.MomActionSummaryDTO> getAllActions() {
        List<QmsMomDetails> details = detailRepository.findAllActions();
        List<Long> actionItemIds = details.stream().map(QmsMomDetails::getId).toList();

        List<EmployeeMaster> allEmps = employeeRepository.findAll();
        java.util.Map<Long, EmployeeMaster> empByIdMap = allEmps.stream()
                .collect(java.util.stream.Collectors.toMap(EmployeeMaster::getId, e -> e, (e1, e2) -> e1));
        java.util.Map<String, EmployeeMaster> empByNameMap = allEmps.stream()
                .filter(e -> e.getEmployeeName() != null)
                .collect(java.util.stream.Collectors.toMap(e -> e.getEmployeeName().toUpperCase(), e -> e,
                        (e1, e2) -> e1));

        java.util.Map<Long, List<QmsCloseMomAndVerify>> logsGrouped = new java.util.HashMap<>();
        if (!actionItemIds.isEmpty()) {
            List<QmsCloseMomAndVerify> allLogs = new java.util.ArrayList<>();
            int chunkSize = 1000;
            for (int i = 0; i < actionItemIds.size(); i += chunkSize) {
                List<Long> chunk = actionItemIds.subList(i, Math.min(i + chunkSize, actionItemIds.size()));
                List<QmsCloseMomAndVerify> chunkLogs = closeMomAndVerifyRepository.findByActionItemIdIn(chunk);
                if (chunkLogs != null) {
                    allLogs.addAll(chunkLogs);
                }
            }
            logsGrouped = allLogs.stream()
                    .filter(l -> l.getActionItemId() != null)
                    .collect(java.util.stream.Collectors.groupingBy(QmsCloseMomAndVerify::getActionItemId));
        }

        final java.util.Map<Long, List<QmsCloseMomAndVerify>> finalLogsGrouped = logsGrouped;

        List<com.autonoma.erp.dto.MomActionSummaryDTO> allActions = new java.util.ArrayList<>();
        for (QmsMomDetails d : details) {
            if ("INFO".equalsIgnoreCase(d.getProcessType())) {
                List<QmsCloseMomAndVerify> logs = finalLogsGrouped.get(d.getId());
                if (logs != null && !logs.isEmpty()) {
                    java.util.Map<String, List<QmsCloseMomAndVerify>> participantLogsMap = logs.stream()
                            .filter(l -> l.getResponsibility() != null && !l.getResponsibility().isBlank())
                            .collect(java.util.stream.Collectors.groupingBy(l -> l.getResponsibility().toUpperCase()));

                    for (java.util.Map.Entry<String, List<QmsCloseMomAndVerify>> entry : participantLogsMap
                            .entrySet()) {
                        com.autonoma.erp.dto.MomActionSummaryDTO dto = mapDetailToDto(d);
                        String respName = entry.getValue().get(0).getResponsibility();
                        dto.setAssignedTo(respName);
                        if (entry.getValue().get(0).getAssignedToId() != null) {
                            dto.setAssignedToId(entry.getValue().get(0).getAssignedToId());
                        } else if (respName != null) {
                            EmployeeMaster emp = empByNameMap.get(respName.toUpperCase());
                            if (emp != null)
                                dto.setAssignedToId(emp.getId());
                        }
                        if (entry.getValue().get(0).getAssignedById() != null) {
                            dto.setAssignedById(entry.getValue().get(0).getAssignedById());
                            EmployeeMaster byEmp = empByIdMap.get(entry.getValue().get(0).getAssignedById());
                            if (byEmp != null)
                                dto.setAssignedBy(byEmp.getEmployeeName());
                        }

                        QmsCloseMomAndVerify latestUserLog = entry.getValue().stream()
                                .max(java.util.Comparator.comparing(QmsCloseMomAndVerify::getId))
                                .orElse(entry.getValue().get(0));

                        dto.setStatus(latestUserLog.getNewStatus() != null ? latestUserLog.getNewStatus() : "OPEN");
                        dto.setActionTaken(latestUserLog.getActionTaken());
                        dto.setActionObservation(latestUserLog.getActionObservation());
                        allActions.add(dto);
                    }
                }
            } else {
                com.autonoma.erp.dto.MomActionSummaryDTO dto = mapDetailToDto(d);
                List<QmsCloseMomAndVerify> logs = finalLogsGrouped.get(d.getId());
                QmsCloseMomAndVerify latestLog = null;
                if (logs != null && !logs.isEmpty()) {
                    latestLog = logs.stream()
                            .max(java.util.Comparator.comparing(QmsCloseMomAndVerify::getId))
                            .orElse(null);
                    dto.setStatus(latestLog != null ? latestLog.getNewStatus() : d.getStatus());
                } else {
                    dto.setStatus(d.getStatus());
                }
                if (latestLog != null) {
                    if (latestLog.getAssignedToId() != null)
                        dto.setAssignedToId(latestLog.getAssignedToId());
                    if (latestLog.getAssignedById() != null)
                        dto.setAssignedById(latestLog.getAssignedById());
                    if (latestLog.getResponsibility() != null)
                        dto.setAssignedTo(latestLog.getResponsibility());
                    if (latestLog.getAssignedById() != null) {
                        EmployeeMaster byEmp = empByIdMap.get(latestLog.getAssignedById());
                        if (byEmp != null)
                            dto.setAssignedBy(byEmp.getEmployeeName());
                    }
                    dto.setActionTaken(
                            latestLog.getActionTaken() != null ? latestLog.getActionTaken() : d.getActionTaken());
                    dto.setActionObservation(latestLog.getActionObservation() != null ? latestLog.getActionObservation()
                            : d.getActionObservation());
                    dto.setCancelRemarks(latestLog.getRejectionRemarks() != null ? latestLog.getRejectionRemarks()
                            : d.getCancelRemarks());
                    dto.setAttachmentInfo(latestLog.getAttachmentInfo() != null ? latestLog.getAttachmentInfo()
                            : d.getAttachmentInfo());
                } else {
                    dto.setActionTaken(d.getActionTaken());
                    dto.setActionObservation(d.getActionObservation());
                    dto.setCancelRemarks(d.getCancelRemarks());
                    dto.setAttachmentInfo(d.getAttachmentInfo());
                }
                allActions.add(dto);
            }
        }

        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return new ArrayList<>();
        }
        UserCredential user = userRepository.findByUserId(currentUserId).orElse(null);
        if (user == null) {
            return new ArrayList<>();
        }
        if (isAdmin(user)) {
            return allActions;
        }

        Long empId = user.getEmpId();

        return allActions.stream()
                .filter(dto -> empId != null
                        && (empId.equals(dto.getAssignedToId()) || empId.equals(dto.getAssignedById())))
                .toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public org.springframework.data.domain.Page<com.autonoma.erp.dto.MomActionSummaryDTO> getActionsPaged(
            int page, int size, String scope, Long memberId, String status, String searchBy, String searchText,
            String startDate, String endDate, String considerDate, String dashboardFilter, String currentUser,
            String pageCode) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        UserCredential userCred = currentUserId != null ? userRepository.findByUserId(currentUserId).orElse(null)
                : null;
        Long empId = userCred != null ? userCred.getEmpId() : null;

        // If currentUser is provided from the dashboard, act as that user
        if (currentUser != null && !currentUser.trim().isEmpty()) {
            UserCredential effectiveUser = userRepository.findByUserId(currentUser.trim()).orElse(null);
            if (effectiveUser != null) {
                empId = effectiveUser.getEmpId();
            }
        }

        String activeScope = (scope != null && !scope.trim().isEmpty()) ? scope.trim() : "Mine";
        int isCompanyVal = "Company".equalsIgnoreCase(activeScope) ? 1 : 0;
        boolean isConsiderDate = "true".equalsIgnoreCase(considerDate) || "yes".equalsIgnoreCase(considerDate)
                || "1".equals(considerDate);
        int considerDateVal = isConsiderDate ? 1 : 0;
        Long selectedMemberId = (memberId != null && memberId > 0) ? memberId : null;

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<java.util.Map<String, Object>> pagedMaps = detailRepository
                .findActionSummaryPaged(
                        pageCode != null ? pageCode.trim() : "",
                        activeScope,
                        isCompanyVal,
                        empId != null ? empId : -1L,
                        selectedMemberId,
                        status != null ? status.trim() : "",
                        searchText != null ? searchText.trim() : "",
                        searchBy != null ? searchBy.trim() : "discussedPoint",
                        considerDateVal,
                        startDate != null ? startDate.trim() : "",
                        endDate != null ? endDate.trim() : "",
                        dashboardFilter != null ? dashboardFilter.trim() : "",
                        pageable);

        List<com.autonoma.erp.dto.MomActionSummaryDTO> dtoList = pagedMaps.getContent().stream().map(m -> {
            com.autonoma.erp.dto.MomActionSummaryDTO dto = new com.autonoma.erp.dto.MomActionSummaryDTO();
            Object idVal = getMapVal(m, "id");
            if (idVal instanceof Number n)
                dto.setId(n.longValue());
            Object momIdVal = getMapVal(m, "momId");
            if (momIdVal instanceof Number n)
                dto.setMomId(n.longValue());
            String momNoStr = asString(getMapVal(m, "momNo"));
            String minNoStr = asString(getMapVal(m, "minNo"));
            String meetNoStr = asString(getMapVal(m, "meetNo"));
            String amendMeetNoStr = asString(getMapVal(m, "amendMeetNo"));
            dto.setMomNo(momNoStr);
            dto.setMinNo(minNoStr);
            if (minNoStr != null && !minNoStr.isEmpty()) {
                dto.setMeetNo(minNoStr);
            } else if (meetNoStr != null && !meetNoStr.isEmpty()) {
                dto.setMeetNo(meetNoStr);
            } else if (momNoStr != null && !momNoStr.isEmpty() && idVal instanceof Number n) {
                dto.setMeetNo(momNoStr + "/" + String.format("%03d", n.longValue()));
            }
            if (amendMeetNoStr != null && !amendMeetNoStr.isEmpty()) {
                dto.setAmendMeetNo(amendMeetNoStr);
            } else if (dto.getMeetNo() != null) {
                dto.setAmendMeetNo(dto.getMeetNo());
            }
            dto.setMomDate(parseLocalDate(getMapVal(m, "momDate")));
            dto.setScheduleNo(asString(getMapVal(m, "scheduleNo")));
            dto.setDiscussedPoint(asString(getMapVal(m, "discussedPoint")));
            dto.setPointType(asString(getMapVal(m, "pointType")));
            dto.setMaterialList(asString(getMapVal(m, "materialList")));
            dto.setProcessType(asString(getMapVal(m, "processType")));
            dto.setAssignedBy(asString(getMapVal(m, "assignedBy")));
            dto.setAssignedTo(asString(getMapVal(m, "assignedTo")));
            Object atId = getMapVal(m, "assignedToId");
            if (atId instanceof Number n)
                dto.setAssignedToId(n.longValue());
            Object abId = getMapVal(m, "assignedById");
            if (abId instanceof Number n)
                dto.setAssignedById(n.longValue());
            dto.setTargetDate(parseLocalDate(getMapVal(m, "targetDate")));
            dto.setReviewDate(parseLocalDate(getMapVal(m, "reviewDate")));
            dto.setAttachmentRequired(asString(getMapVal(m, "attachmentRequired")));
            dto.setStatus(asString(getMapVal(m, "status")));
            dto.setActionTaken(asString(getMapVal(m, "actionTaken")));
            dto.setActionObservation(asString(getMapVal(m, "actionObservation")));
            dto.setCancelRemarks(asString(getMapVal(m, "cancelRemarks")));
            dto.setAttachmentInfo(asString(getMapVal(m, "attachmentInfo")));
            dto.setCreatedAt(parseLocalDateTime(getMapVal(m, "createdAt")));
            dto.setCreatedBy(asString(getMapVal(m, "createdBy")));
            dto.setActionStatus(asString(getMapVal(m, "actionStatus")));
            dto.setSubmittedBy(asString(getMapVal(m, "submittedBy")));
            dto.setSubmittedDate(parseLocalDateTime(getMapVal(m, "submittedDate")));
            dto.setVerifiedBy(asString(getMapVal(m, "verifiedBy")));
            dto.setVerifiedDate(parseLocalDateTime(getMapVal(m, "verifiedDate")));
            dto.setRejectedBy(asString(getMapVal(m, "rejectedBy")));
            dto.setRejectedDate(parseLocalDateTime(getMapVal(m, "rejectedDate")));
            dto.setRejectionRemarks(asString(getMapVal(m, "rejectionRemarks")));
            dto.setLastResubmittedDate(parseLocalDateTime(getMapVal(m, "lastResubmittedDate")));
            Object revNoVal = getMapVal(m, "revNo");
            if (revNoVal instanceof Number n)
                dto.setRevNo(n.intValue());
            Object rejCntVal = getMapVal(m, "rejectedCount");
            if (rejCntVal instanceof Number n)
                dto.setRejectedCount(n.intValue());
            return dto;
        }).toList();

        return new org.springframework.data.domain.PageImpl<>(dtoList, pageable, pagedMaps.getTotalElements());
    }

    private static Object getMapVal(java.util.Map<String, Object> m, String key) {
        if (m == null || key == null)
            return null;
        if (m.containsKey(key))
            return m.get(key);
        if (m.containsKey(key.toUpperCase()))
            return m.get(key.toUpperCase());
        if (m.containsKey(key.toLowerCase()))
            return m.get(key.toLowerCase());
        for (java.util.Map.Entry<String, Object> entry : m.entrySet()) {
            String k = entry.getKey();
            if (k.equalsIgnoreCase(key) || k.replace("_", "").equalsIgnoreCase(key.replace("_", ""))) {
                return entry.getValue();
            }
        }
        return null;
    }

    private static String asString(Object val) {
        if (val == null)
            return null;
        return val.toString();
    }

    private static java.time.LocalDate parseLocalDate(Object val) {
        if (val == null)
            return null;
        if (val instanceof java.time.LocalDate ld)
            return ld;
        if (val instanceof java.sql.Date sd)
            return sd.toLocalDate();
        String s = val.toString().trim();
        if (s.isEmpty())
            return null;
        if (s.contains("T"))
            s = s.split("T")[0];
        try {
            return java.time.LocalDate.parse(s.substring(0, 10));
        } catch (Exception e) {
            return null;
        }
    }

    private static java.time.LocalDateTime parseLocalDateTime(Object val) {
        if (val == null)
            return null;
        if (val instanceof java.time.LocalDateTime ldt)
            return ldt;
        if (val instanceof java.sql.Timestamp ts)
            return ts.toLocalDateTime();
        if (val instanceof java.util.Date d)
            return d.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
        String s = val.toString().trim();
        if (s.isEmpty())
            return null;
        try {
            if (s.length() == 10)
                return java.time.LocalDate.parse(s).atStartOfDay();
            return java.time.LocalDateTime.parse(s.replace(" ", "T").substring(0, 19));
        } catch (Exception e) {
            return null;
        }
    }

    private com.autonoma.erp.dto.MomActionSummaryDTO mapDetailToDto(QmsMomDetails d) {
        com.autonoma.erp.dto.MomActionSummaryDTO dto = new com.autonoma.erp.dto.MomActionSummaryDTO();
        dto.setId(d.getId());
        dto.setMomId(d.getMom().getId());
        dto.setMomNo(d.getMom() != null ? d.getMom().getMomNo() : null);
        dto.setMinNo(d.getMinNo());
        if (d.getMinNo() != null && !d.getMinNo().isEmpty()) {
            dto.setMeetNo(d.getMinNo());
            if (d.getRevNo() != null && d.getRevNo() > 0) {
                dto.setAmendMeetNo(d.getMinNo() + "/A" + String.format("%02d", d.getRevNo()));
            } else {
                dto.setAmendMeetNo(d.getMinNo());
            }
        } else if (d.getMom() != null && d.getMom().getMomNo() != null && d.getId() != null) {
            String computedMeetNo = d.getMom().getMomNo() + "/" + String.format("%03d", d.getId());
            dto.setMeetNo(computedMeetNo);
            if (d.getRevNo() != null && d.getRevNo() > 0) {
                dto.setAmendMeetNo(computedMeetNo + "/A" + String.format("%02d", d.getRevNo()));
            } else {
                dto.setAmendMeetNo(computedMeetNo);
            }
        }
        dto.setMomDate(d.getMom() != null ? d.getMom().getMomDate() : null);
        if (d.getMom().getSchedule() != null) {
            dto.setScheduleNo(d.getMom().getSchedule().getScheduleNo());
        }
        dto.setDiscussedPoint(d.getDiscussedPoint());
        dto.setPointType(d.getPointType());
        dto.setMaterialList(d.getMaterialList());
        dto.setProcessType(d.getProcessType());
        dto.setAssignedBy(d.getAssignedBy() != null ? d.getAssignedBy().getEmployeeName() : null);
        dto.setAssignedTo(d.getAssignedTo() != null ? d.getAssignedTo().getEmployeeName() : null);
        dto.setAssignedToId(d.getAssignedTo() != null ? d.getAssignedTo().getId() : null);
        dto.setAssignedById(d.getAssignedBy() != null ? d.getAssignedBy().getId() : null);
        dto.setTargetDate(d.getTargetDate());
        dto.setReviewDate(d.getReviewDate());
        dto.setAttachmentRequired(d.getAttachmentRequired());
        dto.setCreatedAt(
                d.getCreatedAt() != null
                        ? java.time.Instant.ofEpochMilli(d.getCreatedAt().getTime())
                                .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime()
                        : null);
        dto.setCreatedBy(d.getCreatedBy());
        dto.setActionStatus(d.getActionStatus());
        dto.setRejectedCount(d.getRejectedCount());
        dto.setSubmittedBy(d.getSubmittedBy());
        dto.setSubmittedDate(d.getSubmittedDate());
        dto.setVerifiedBy(d.getVerifiedBy());
        dto.setVerifiedDate(d.getVerifiedDate());
        dto.setRejectedBy(d.getRejectedBy());
        dto.setRejectedDate(d.getRejectedDate());
        dto.setRejectionRemarks(d.getRejectionRemarks());
        dto.setLastResubmittedDate(d.getLastResubmittedDate());
        dto.setRevNo(d.getRevNo());
        return dto;
    }

    private QmsMomMaster cloneMomWithFilteredDetails(QmsMomMaster mom, List<QmsMomDetails> filteredDetails) {
        QmsMomMaster copy = new QmsMomMaster();
        copy.setId(mom.getId());
        copy.setMomNo(mom.getMomNo());
        copy.setMomDate(mom.getMomDate());
        copy.setSchedule(mom.getSchedule());
        copy.setAgenda(mom.getAgenda());
        copy.setChairedBy(mom.getChairedBy());
        copy.setStartTime(mom.getStartTime());
        copy.setEndTime(mom.getEndTime());
        copy.setStatusObj(mom.getStatusObj());
        copy.setStatus(mom.getStatus());
        copy.setIsActive(mom.getIsActive());
        copy.setAttendanceList(mom.getAttendanceList());
        copy.setCreatedUser(mom.getCreatedUser());
        copy.setCreatedDate(mom.getCreatedDate());
        copy.setUpdatedUser(mom.getUpdatedUser());
        copy.setUpdatedDate(mom.getUpdatedDate());
        copy.setDetails(filteredDetails);
        copy.setAttachments(mom.getAttachments());
        return copy;
    }

    private boolean isAdmin(UserCredential user) {
        if (user == null)
            return false;
        String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            // Check Minutes of Meeting (QM1330)
            com.autonoma.erp.model.admin.BosPage page30 = bosPageRepository.findByPageCode("QM1330").orElse(null);
            if (page30 != null) {
                com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                        .findByUserIdAndPageId(user.getUserId(), page30.getPageId());
                if (auth != null && Integer.valueOf(1).equals(auth.getAdditional1())) {
                    return true;
                }
            }
            // Check Close MOM (QM1340)
            com.autonoma.erp.model.admin.BosPage page40 = bosPageRepository.findByPageCode("QM1340").orElse(null);
            if (page40 != null) {
                com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                        .findByUserIdAndPageId(user.getUserId(), page40.getPageId());
                if (auth != null && Integer.valueOf(1).equals(auth.getAdditional1())) {
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("Failed to check company page permission in QmsMomMasterService", e);
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
        }
        return false;
    }

    private void recalculateAttendanceStatuses(QmsMomMaster mom) {
        if (mom.getAttendanceList() != null && mom.getSchedule() != null) {
            java.time.LocalTime startTime = mom.getSchedule().getStartTime();
            for (QmsMomAttendance att : mom.getAttendanceList()) {
                if ("ABSENT".equals(att.getAttendanceStatus()) || "EXCUSED".equals(att.getAttendanceStatus())) {
                    continue; // Respect manual overrides from UI if any
                }
                if (att.getInTime() != null) {
                    if (startTime != null && att.getInTime().isAfter(startTime)) {
                        att.setAttendanceStatus("LATE");
                    } else {
                        att.setAttendanceStatus("PRESENT");
                    }
                } else {
                    att.setAttendanceStatus("ABSENT");
                }
            }
        }
    }

    private void validateMomDetailsTargetDates(QmsMomMaster mom) {
        if (mom.getDetails() != null) {
            java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
            java.time.LocalDate meetingDate = (mom.getSchedule() != null && mom.getSchedule().getMeetingDate() != null)
                    ? mom.getSchedule().getMeetingDate()
                    : today;
            java.time.LocalDate minAllowed = meetingDate.isBefore(today) ? meetingDate : today;

            for (QmsMomDetails detail : mom.getDetails()) {
                if ("ACTION".equalsIgnoreCase(detail.getProcessType())) {
                    if (detail.getTargetDate() == null) {
                        throw new IllegalArgumentException(
                                "Target Date is required for Action item: \"" + detail.getDiscussedPoint() + "\"");
                    }
                    if (detail.getTargetDate().isBefore(minAllowed)) {
                        throw new IllegalArgumentException("Target Date (" + detail.getTargetDate()
                                + ") for Action item \"" + detail.getDiscussedPoint() + "\" cannot be in the past.");
                    }
                }
            }
        }
    }

    @Transactional
    public QmsMomMaster saveMom(QmsMomMaster mom) {
        if (mom.getSchedule() != null && mom.getSchedule().getId() != null) {
            if (repository.existsByScheduleIdAndIdNot(mom.getSchedule().getId(), mom.getId())) {
                throw new RuntimeException("Minutes of Meeting has already been created for this Meeting Schedule.");
            }
            com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule schedule = scheduleRepo
                    .findById(mom.getSchedule().getId()).orElse(null);
            if (schedule != null) {
                mom.setSchedule(schedule);
                com.autonoma.erp.modules.platform.common.entity.StatusMaster closedStatus = statusRepo
                        .findByNameIgnoreCase("CLOSED")
                        .orElseGet(() -> {
                            com.autonoma.erp.modules.platform.common.entity.StatusMaster s = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                            s.setName("CLOSED");
                            return statusRepo.save(s);
                        });
                schedule.setStatus("CLOSED");
                schedule.setStatusObj(closedStatus);
                scheduleRepo.save(schedule);
                if (schedule.getFrequency() != null && !"NONE".equalsIgnoreCase(schedule.getFrequency()) && meetingSchedulerService != null) {
                    try {
                        meetingSchedulerService.generateRecurringMeetings(false, java.time.LocalDate.now());
                    } catch (Exception ex) {
                        log.warn("[QmsMomMasterService] Failed to auto-generate next recurrence on MOM close: {}", ex.getMessage());
                    }
                }
            }
        }

        resolveDetailsPointAndProcessTypes(mom);
        validateMomDetailsTargetDates(mom);

        if (mom.getId() == null) {
            mom.setMomNo(generateMomNo(mom));
            mom.setStatus("OPEN");
            if (mom.getDetails() != null) {
                int totalDetails = mom.getDetails().size();
                for (int i = 0; i < totalDetails; i++) {
                    QmsMomDetails detail = mom.getDetails().get(i);
                    detail.setId(null);
                    detail.setMom(mom);
                    if (detail.getMinNo() == null || detail.getMinNo().trim().isEmpty()) {
                        int seq = i + 1;
                        detail.setMinNo(mom.getMomNo() + "/" + String.format("%03d", seq));
                    }
                    if ("INFO".equalsIgnoreCase(detail.getProcessType())) {
                        detail.setStatus("Closed");
                    } else if ("ACTION".equalsIgnoreCase(detail.getProcessType())) {
                        if (detail.getStatus() == null || detail.getStatus().trim().isEmpty()) {
                            detail.setStatus("OPEN");
                        }
                    }
                }
            }
            if (mom.getAttendanceList() != null) {
                mom.getAttendanceList().forEach(att -> {
                    att.setId(null);
                    att.setMom(mom);
                });
            }
            recalculateAttendanceStatuses(mom);
            recalculateMeetingStatus(mom);
            assignStatuses(mom);
            QmsMomMaster saved = repository.saveAndFlush(mom);
            syncCloseMemosForActions(saved);
            recalculateMeetingStatus(saved);
            assignStatuses(saved);
            saved = repository.saveAndFlush(saved);
            syncToMeetingUserAttendance(saved);
            populateAttachments(saved);

            // Notify assignees and participants on new MOM creation
            if (saved.getDetails() != null) {
                for (QmsMomDetails detail : saved.getDetails()) {
                    if ("ACTION".equalsIgnoreCase(detail.getProcessType()) && detail.getAssignedTo() != null) {
                        try {
                            EmployeeMaster recipient = employeeRepository.findById(detail.getAssignedTo().getId())
                                    .orElse(detail.getAssignedTo());
                            notificationService.notifyUserAboutMomAssignment(recipient, saved, detail);
                        } catch (Exception ex) {
                            log.warn("[Notification] Failed to notify assignee for point {}: {}",
                                    detail.getDiscussedPoint(), ex.getMessage());
                        }
                    } else if ("INFO".equalsIgnoreCase(detail.getProcessType())) {
                        java.util.Set<EmployeeMaster> participants = new java.util.HashSet<>();
                        if (saved.getAttendanceList() != null) {
                            for (QmsMomAttendance att : saved.getAttendanceList()) {
                                if (att.getEmployee() != null) {
                                    participants.add(att.getEmployee());
                                }
                            }
                        }
                        if (saved.getSchedule() != null && saved.getSchedule().getParticipants() != null) {
                            for (var p : saved.getSchedule().getParticipants()) {
                                if (p.getEmployee() != null) {
                                    participants.add(p.getEmployee());
                                }
                            }
                        }
                        for (EmployeeMaster p : participants) {
                            try {
                                notificationService.notifyUserAboutMomAssignment(p, saved, detail);
                            } catch (Exception ex) {
                                log.warn("[Notification] Failed to notify participant {} for INFO point {}: {}",
                                        p.getEmployeeName(), detail.getDiscussedPoint(), ex.getMessage());
                            }
                        }
                    }
                }
            }
            return saved;
        } else {
            QmsMomMaster existing = repository.findById(mom.getId())
                    .orElseThrow(() -> new RuntimeException("MOM not found"));

            if ("CLOSED".equalsIgnoreCase(existing.getStatus())) {
                throw new RuntimeException("Closed MOM cannot be modified.");
            }

            existing.setMomNo(mom.getMomNo());
            existing.setMomDate(mom.getMomDate());
            existing.setSchedule(mom.getSchedule());
            existing.setChairedBy(mom.getChairedBy());
            existing.setStartTime(mom.getStartTime());
            existing.setEndTime(mom.getEndTime());
            existing.setStatus("OPEN");
            existing.setUpdatedUser(mom.getUpdatedUser());
            existing.setUpdatedDate(mom.getUpdatedDate());

            // Update Details list safely to prevent detached entity exceptions
            if (mom.getDetails() != null) {
                resolveDetailsPointAndProcessTypes(mom);
                java.util.List<QmsMomDetails> toRemove = new java.util.ArrayList<>();
                for (QmsMomDetails existingDet : existing.getDetails()) {
                    boolean found = mom.getDetails().stream()
                            .anyMatch(d -> d.getId() != null && d.getId().equals(existingDet.getId()));
                    if (!found) {
                        toRemove.add(existingDet);
                    }
                }
                existing.getDetails().removeAll(toRemove);

                int updateSeq = 1;
                for (QmsMomDetails incomingDet : mom.getDetails()) {
                    // String prefix = "[" + existing.getMomNo() + "] ";
                    // if (incomingDet.getDiscussedPoint() != null &&
                    // !incomingDet.getDiscussedPoint().startsWith("[")) {
                    // incomingDet.setDiscussedPoint(prefix + incomingDet.getDiscussedPoint());
                    // }
                    if ("INFO".equalsIgnoreCase(incomingDet.getProcessType())) {
                        incomingDet.setStatus("Closed");
                    } else if ("ACTION".equalsIgnoreCase(incomingDet.getProcessType())) {
                        if (incomingDet.getStatus() == null || "CLOSED".equalsIgnoreCase(incomingDet.getStatus())) {
                            incomingDet.setStatus("OPEN");
                        }
                    }

                    boolean isNewAssignment = false;
                    boolean isReassignment = false;

                    if (incomingDet.getId() != null) {
                        QmsMomDetails existingDet = existing.getDetails().stream()
                                .filter(d -> incomingDet.getId().equals(d.getId()))
                                .findFirst().orElse(null);
                        if (existingDet != null) {
                            if (existingDet.getAssignedTo() != null && incomingDet.getAssignedTo() != null
                                    && !existingDet.getAssignedTo().getId()
                                            .equals(incomingDet.getAssignedTo().getId())) {
                                isReassignment = true;
                            }

                            if (incomingDet.getMinNo() != null && !incomingDet.getMinNo().trim().isEmpty()) {
                                existingDet.setMinNo(incomingDet.getMinNo());
                            } else if (existingDet.getMinNo() == null || existingDet.getMinNo().trim().isEmpty()) {
                                existingDet.setMinNo(existing.getMomNo() + "/" + String.format("%03d", updateSeq));
                            }
                            existingDet.setDiscussedPoint(incomingDet.getDiscussedPoint());
                            existingDet.setPointType(incomingDet.getPointType());
                            existingDet.setPointTypeObj(incomingDet.getPointTypeObj());
                            existingDet.setMaterialList(incomingDet.getMaterialList());
                            existingDet.setProcessType(incomingDet.getProcessType());
                            existingDet.setProcessTypeObj(incomingDet.getProcessTypeObj());
                            existingDet.setAssignedBy(incomingDet.getAssignedBy());
                            existingDet.setAssignedTo(incomingDet.getAssignedTo());
                            existingDet.setTargetDate(incomingDet.getTargetDate());
                            existingDet.setReviewDate(incomingDet.getReviewDate());
                            existingDet.setAttachmentRequired(incomingDet.getAttachmentRequired());
                            existingDet.setStatus(incomingDet.getStatus());
                            existingDet.setStatusObj(incomingDet.getStatusObj());
                            existingDet.setActionTaken(incomingDet.getActionTaken());
                            existingDet.setActionObservation(incomingDet.getActionObservation());
                            existingDet.setCancelRemarks(incomingDet.getCancelRemarks());
                            existingDet.setRevNo(incomingDet.getRevNo());
                            existingDet.setAmendmentComments(incomingDet.getAmendmentComments());
                            existingDet.setActionStatus(incomingDet.getActionStatus());
                            existingDet.setSubmittedBy(incomingDet.getSubmittedBy());
                            existingDet.setSubmittedDate(incomingDet.getSubmittedDate());
                            existingDet.setUpdatedUser(mom.getUpdatedUser());
                            existingDet.setUpdatedDate(mom.getUpdatedDate());
                        } else {
                            incomingDet.setId((Long) null);
                            incomingDet.setMom(existing);
                            if (incomingDet.getMinNo() == null || incomingDet.getMinNo().trim().isEmpty()) {
                                incomingDet.setMinNo(existing.getMomNo() + "/" + String.format("%03d", updateSeq));
                            }
                            existing.getDetails().add(incomingDet);
                            isNewAssignment = true;
                        }
                    } else {
                        incomingDet.setMom(existing);
                        if (incomingDet.getMinNo() == null || incomingDet.getMinNo().trim().isEmpty()) {
                            incomingDet.setMinNo(existing.getMomNo() + "/" + String.format("%03d", updateSeq));
                        }
                        existing.getDetails().add(incomingDet);
                        isNewAssignment = true;
                    }
                    updateSeq++;

                    if ("ACTION".equalsIgnoreCase(incomingDet.getProcessType()) && (isNewAssignment || isReassignment)
                            && incomingDet.getAssignedTo() != null) {
                        try {
                            EmployeeMaster recipient = employeeRepository.findById(incomingDet.getAssignedTo().getId())
                                    .orElse(incomingDet.getAssignedTo());
                            notificationService.notifyUserAboutMomAssignment(recipient, existing, incomingDet);
                        } catch (Exception ex) {
                            log.warn("[Notification] Failed to notify assignee for point {}: {}",
                                    incomingDet.getDiscussedPoint(), ex.getMessage());
                        }
                    } else if ("INFO".equalsIgnoreCase(incomingDet.getProcessType()) && isNewAssignment) {
                        java.util.Set<EmployeeMaster> participants = new java.util.HashSet<>();
                        if (existing.getAttendanceList() != null) {
                            for (QmsMomAttendance att : existing.getAttendanceList()) {
                                if (att.getEmployee() != null) {
                                    participants.add(att.getEmployee());
                                }
                            }
                        }
                        if (existing.getSchedule() != null && existing.getSchedule().getParticipants() != null) {
                            for (var p : existing.getSchedule().getParticipants()) {
                                if (p.getEmployee() != null) {
                                    participants.add(p.getEmployee());
                                }
                            }
                        }
                        for (EmployeeMaster p : participants) {
                            try {
                                notificationService.notifyUserAboutMomAssignment(p, existing, incomingDet);
                            } catch (Exception ex) {
                                log.warn("[Notification] Failed to notify participant {} for INFO point {}: {}",
                                        p.getEmployeeName(), incomingDet.getDiscussedPoint(), ex.getMessage());
                            }
                        }
                    }
                }
            } else {
                existing.getDetails().clear();
            }

            // Update Attendance list safely to prevent detached entity exceptions
            if (mom.getAttendanceList() != null) {
                java.util.List<QmsMomAttendance> toRemove = new java.util.ArrayList<>();
                for (QmsMomAttendance existingAtt : existing.getAttendanceList()) {
                    boolean found = mom.getAttendanceList().stream()
                            .anyMatch(a -> a.getId() != null && a.getId().equals(existingAtt.getId()));
                    if (!found) {
                        toRemove.add(existingAtt);
                    }
                }
                existing.getAttendanceList().removeAll(toRemove);

                for (QmsMomAttendance incomingAtt : mom.getAttendanceList()) {
                    if (incomingAtt.getId() != null) {
                        QmsMomAttendance existingAtt = existing.getAttendanceList().stream()
                                .filter(a -> incomingAtt.getId().equals(a.getId()))
                                .findFirst().orElse(null);
                        if (existingAtt != null) {
                            existingAtt.setEmployee(incomingAtt.getEmployee());
                            existingAtt.setInTime(incomingAtt.getInTime());
                            existingAtt.setOutTime(incomingAtt.getOutTime());
                            existingAtt.setAttendanceStatus(incomingAtt.getAttendanceStatus());
                            existingAtt.setStatusObj(incomingAtt.getStatusObj());
                            existingAtt.setUpdatedUser(mom.getUpdatedUser());
                            existingAtt.setUpdatedDate(incomingAtt.getUpdatedDate());
                        } else {
                            incomingAtt.setId(null);
                            incomingAtt.setMom(existing);
                            existing.getAttendanceList().add(incomingAtt);
                        }
                    } else {
                        incomingAtt.setMom(existing);
                        existing.getAttendanceList().add(incomingAtt);
                    }
                }
            } else {
                existing.getAttendanceList().clear();
            }

            recalculateAttendanceStatuses(existing);
            recalculateMeetingStatus(existing);
            assignStatuses(existing);
            QmsMomMaster saved = repository.saveAndFlush(existing);
            syncCloseMemosForActions(saved);
            recalculateMeetingStatus(saved);
            assignStatuses(saved);
            saved = repository.saveAndFlush(saved);
            syncToMeetingUserAttendance(saved);
            populateAttachments(saved);
            return saved;
        }
    }

    private void populateAttachments(QmsMomMaster mom) {
        if (mom != null && mom.getId() != null) {
            List<com.autonoma.erp.modules.qms.meeting.entity.QmsAttachmentPath> paths = attachmentRepository
                    .findByPageCodeAndRefId("QM1330", Long.valueOf(mom.getId()));
            if (paths.isEmpty()) {
                paths = attachmentRepository.findByPageCodeAndRefId("QM1320", Long.valueOf(mom.getId()));
            }
            mom.setAttachments(paths);
        }
    }

    @Transactional
    public void updateAttendanceOutTimes(Long momId, List<Map<String, Object>> outTimes) {
        QmsMomMaster mom = getMomById(momId);
        if (mom.getAttendanceList() != null) {
            for (Map<String, Object> entry : outTimes) {
                Long empId = null;
                if (entry.get("employeeId") != null) {
                    empId = Long.parseLong(entry.get("employeeId").toString());
                }
                Long attId = null;
                if (entry.get("attendanceId") != null) {
                    attId = Long.parseLong(entry.get("attendanceId").toString());
                }
                String outTimeStr = (String) entry.get("outTime");

                for (QmsMomAttendance att : mom.getAttendanceList()) {
                    boolean matches = false;
                    if (attId != null && attId.equals(att.getId())) {
                        matches = true;
                    } else if (empId != null && att.getEmployee() != null && empId.equals(att.getEmployee().getId())) {
                        matches = true;
                    }

                    if (matches) {
                        if (outTimeStr == null || outTimeStr.trim().isEmpty()) {
                            att.setOutTime(null);
                        } else {
                            att.setOutTime(java.time.LocalTime.parse(outTimeStr));
                        }
                    }
                }
            }
        }
        recalculateAttendanceStatuses(mom);
        assignStatuses(mom);
        QmsMomMaster saved = repository.saveAndFlush(mom);
        syncToMeetingUserAttendance(saved);
    }

    private void syncToMeetingUserAttendance(QmsMomMaster mom) {
        if (mom == null || mom.getSchedule() == null || mom.getAttendanceList() == null)
            return;

        Long scheduleId = mom.getSchedule().getId();
        List<QmsMomAttendance> attendanceCopy = new java.util.ArrayList<>(mom.getAttendanceList());
        for (QmsMomAttendance momAtt : attendanceCopy) {
            if (momAtt.getEmployee() != null) {
                Long empId = momAtt.getEmployee().getId();
                java.util.List<QmsMeetingUserAttendance> userAttList = meetingUserAttendanceRepository
                        .findByScheduleIdAndEmployeeId(scheduleId, empId);

                String calculatedStatus = momAtt.getAttendanceStatus() != null
                        ? momAtt.getAttendanceStatus().toUpperCase()
                        : "PRESENT";

                if (!userAttList.isEmpty()) {
                    QmsMeetingUserAttendance userAtt = userAttList.get(0);
                    userAtt.setInTime(momAtt.getInTime());
                    userAtt.setOutTime(momAtt.getOutTime());
                    userAtt.setStatus(calculatedStatus);
                    userAtt.setStatusObj(statusRepo.findByName(calculatedStatus).orElse(null));
                    meetingUserAttendanceRepository.save(userAtt);
                    try {
                        notificationService.markMeetingNotificationAsRead(empId, mom.getSchedule().getScheduleNo());
                    } catch (Exception e) {
                        log.warn("[Notification] Failed to mark meeting notification as read: {}", e.getMessage());
                    }

                    // Delete any duplicate rows if they exist in database
                    if (userAttList.size() > 1) {
                        for (int i = 1; i < userAttList.size(); i++) {
                            meetingUserAttendanceRepository.delete(userAttList.get(i));
                        }
                    }
                } else if (momAtt.getInTime() != null) {
                    QmsMeetingUserAttendance userAtt = new QmsMeetingUserAttendance();
                    userAtt.setSchedule(mom.getSchedule());
                    userAtt.setEmployee(momAtt.getEmployee());
                    userAtt.setInTime(momAtt.getInTime());
                    userAtt.setOutTime(momAtt.getOutTime());
                    userAtt.setStatus(calculatedStatus);
                    userAtt.setStatusObj(statusRepo.findByName(calculatedStatus).orElse(null));
                    meetingUserAttendanceRepository.save(userAtt);
                    try {
                        notificationService.markMeetingNotificationAsRead(empId, mom.getSchedule().getScheduleNo());
                    } catch (Exception e) {
                        log.warn("[Notification] Failed to mark meeting notification as read: {}", e.getMessage());
                    }
                }
            }
        }
    }

    @Transactional
    public void deleteMom(Long id) {
        QmsMomMaster mom = getMomById(id);
        if ("CLOSED".equalsIgnoreCase(mom.getStatus())) {
            throw new RuntimeException("Closed MOM cannot be deleted");
        }
        repository.deleteById(id);
    }

    /**
     * Reassign selected detail items to new employee with new target date.
     */
    @Transactional
    public void reassignDetails(Map<String, Object> data) {
        @SuppressWarnings("unchecked")
        List<Number> detailIds = (List<Number>) data.get("detailIds");
        if (detailIds == null || detailIds.isEmpty()) {
            throw new RuntimeException("Please select at least one item to reassign");
        }

        Long assignById = null;
        if (data.get("assignById") != null && !data.get("assignById").toString().isBlank()) {
            try {
                assignById = Long.parseLong(data.get("assignById").toString());
            } catch (Exception ex) {
                // Ignore non-numeric ID strings
            }
        }
        Long assignToId = null;
        if (data.get("assignToId") != null && !data.get("assignToId").toString().isBlank()) {
            try {
                assignToId = Long.parseLong(data.get("assignToId").toString());
            } catch (Exception ex) {
                // Ignore
            }
        }
        String targetDateStr = data.get("targetDate") != null ? data.get("targetDate").toString().trim() : null;
        String passedAssignByName = data.get("assignByName") != null ? data.get("assignByName").toString() : null;
        String reason = data.get("reason") != null ? data.get("reason").toString() : (data.get("reassignReason") != null ? data.get("reassignReason").toString() : (data.get("reassignComments") != null ? data.get("reassignComments").toString() : null));

        EmployeeMaster assignBy = null;
        if (assignById != null) {
            assignBy = employeeRepository.findById(assignById).orElse(null);
            if (assignBy == null) {
                assignBy = employeeRepository.findByEmpCode(String.valueOf(assignById)).orElse(null);
            }
        }

        EmployeeMaster assignTo = null;
        if (assignToId != null) {
            assignTo = employeeRepository.findById(assignToId).orElse(null);
            if (assignTo == null) {
                assignTo = employeeRepository.findByEmpCode(String.valueOf(assignToId)).orElse(null);
            }
        }

        if (assignBy == null && assignTo == null) {
            throw new RuntimeException("Please select Assign By or Assign To to update");
        }

        if (assignTo != null && (targetDateStr == null || targetDateStr.isBlank())) {
            throw new RuntimeException("Target Date is required when Assign To is selected");
        }

        List<Long> ids = detailIds.stream().map(Number::longValue).toList();
        List<QmsMomDetails> detailsList = detailRepository.findAllById(ids);

        String currentDateTime = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        for (QmsMomDetails detail : detailsList) {
            EmployeeMaster prevAssignedTo = detail.getAssignedTo();
            EmployeeMaster prevAssignedBy = detail.getAssignedBy();
            EmployeeMaster effectiveAssignBy = assignBy != null ? assignBy : detail.getAssignedBy();
            String assignByNameStr = passedAssignByName != null && !passedAssignByName.isBlank() 
                    ? passedAssignByName 
                    : (effectiveAssignBy != null ? effectiveAssignBy.getEmployeeName() : "System");
            String prevAssignedToName = prevAssignedTo != null ? prevAssignedTo.getEmployeeName() : "-";
            String prevAssignedByName = prevAssignedBy != null ? prevAssignedBy.getEmployeeName() : "-";
            String effectiveAssignedToName = assignTo != null ? assignTo.getEmployeeName() : prevAssignedToName;

            if (assignBy != null) {
                detail.setAssignedBy(assignBy);
            }
            if (assignTo != null) {
                detail.setAssignedTo(assignTo);
            }
            if (targetDateStr != null && !targetDateStr.isBlank()) {
                detail.setTargetDate(LocalDate.parse(targetDateStr));
            }
            if (reason != null && !reason.isBlank()) {
                detail.setReassignComments(reason);
            }

            List<Map<String, Object>> historyList = new ArrayList<>();
            String existingJson = detail.getReassignHistory();
            if (existingJson != null && !existingJson.isBlank()) {
                try {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> parsed = objectMapper.readValue(existingJson,
                            objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                    historyList.addAll(parsed);
                } catch (Exception ex) {
                    // Ignore parsing error for legacy plain string
                }
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("assignedBy", assignByNameStr);
            entry.put("prevAssignedBy", prevAssignedByName);
            entry.put("assignedTo", effectiveAssignedToName);
            entry.put("prevAssignedTo", prevAssignedToName);
            entry.put("targetDate", targetDateStr != null && !targetDateStr.isBlank() ? targetDateStr : (detail.getTargetDate() != null ? detail.getTargetDate().toString() : "-"));
            entry.put("reason", reason);
            entry.put("dateTime", currentDateTime);

            historyList.add(entry);

            try {
                detail.setReassignHistory(objectMapper.writeValueAsString(historyList));
            } catch (Exception ex) {
                log.error("Failed to write reassignHistory JSON", ex);
            }

            // Send notification if assignTo is updated
            if (assignTo != null) {
                try {
                    notificationService.notifyUserAboutMomReassignment(assignTo, effectiveAssignBy, detail.getMom(), detail, reason);
                } catch (Exception ex) {
                    log.error("Failed to send notification to new assignee: {}", ex.getMessage());
                }

                // Send notification to the previous assignee (if exists and different from new assignee)
                if (prevAssignedTo != null && !prevAssignedTo.getId().equals(assignTo.getId())) {
                    try {
                        notificationService.notifyUserAboutMomReassignedFrom(prevAssignedTo, assignTo, detail.getMom(), detail);
                    } catch (Exception ex) {
                        log.error("Failed to send notification to previous assignee: {}", ex.getMessage());
                    }
                }
            }
        }

        detailRepository.saveAll(detailsList);
    }

    @Transactional
    public void cancelDetails(Map<String, Object> data) {
        @SuppressWarnings("unchecked")
        List<Number> detailIds = (List<Number>) data.get("detailIds");
        String cancelRemarks = (String) data.get("cancelRemarks");

        if (detailIds == null || detailIds.isEmpty()) {
            throw new RuntimeException("No action items selected for cancellation");
        }
        if (cancelRemarks == null || cancelRemarks.trim().isEmpty()) {
            throw new RuntimeException("Cancel remarks are required");
        }

        List<Long> ids = detailIds.stream().map(Number::longValue).toList();
        List<QmsMomDetails> detailsList = detailRepository.findAllById(ids);

        com.autonoma.erp.modules.platform.common.entity.StatusMaster cancelledStatusObj = statusRepo
                .findByNameIgnoreCase("Cancelled")
                .orElseGet(() -> statusRepo.findByNameIgnoreCase("CANCELLED")
                .orElseGet(() -> statusRepo.findByNameIgnoreCase("Cancel")
                .orElseGet(() -> statusRepo.findByNameIgnoreCase("CANCEL")
                .orElseGet(() -> statusRepo.findAll().stream()
                        .filter(s -> s.getName() != null && (s.getName().trim().equalsIgnoreCase("cancelled") || s.getName().trim().equalsIgnoreCase("cancel")))
                        .findFirst()
                        .orElse(null)))));

        if (cancelledStatusObj == null) {
            try {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster s = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                s.setName("Cancelled");
                cancelledStatusObj = statusRepo.save(s);
            } catch (Exception e) {
                cancelledStatusObj = statusRepo.findAll().stream().findFirst().orElse(null);
            }
        }

        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();

        for (QmsMomDetails detail : detailsList) {
            detail.setStatus("Cancelled");
            if (cancelledStatusObj != null) {
                detail.setStatusObj(cancelledStatusObj);
            }
            detail.setCancelRemarks(cancelRemarks.trim());
            detail.setUpdatedUser(currentUserId);
            detail.setUpdatedDate(new java.util.Date());
        }
        detailRepository.saveAll(detailsList);
    }

    private void appendAuditTrail(QmsMomDetails detail, String action, String performedBy, String role, String comments,
            String prevStatus, String newStatus, Integer revNo) {
        List<Map<String, Object>> history = new ArrayList<>();
        String existing = detail.getCancelRemarks();
        if (existing != null && !existing.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> parsed = objectMapper.readValue(existing,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                history.addAll(parsed);
            } catch (Exception e) {
                Map<String, Object> legacy = new LinkedHashMap<>();
                legacy.put("revNo", 0);
                legacy.put("remarks", existing);
                legacy.put("action", "Rejection");
                legacy.put("performedBy", "system");
                legacy.put("role", "Manager");
                legacy.put("dateTime", "-");
                legacy.put("previousStatus", "PENDING FOR APPROVAL");
                legacy.put("newStatus", "REJECTED");
                history.add(legacy);
            }
        }

        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("action", action);
        entry.put("performedBy", performedBy != null ? performedBy : "unknown");
        entry.put("role", role);
        entry.put("dateTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        entry.put("comments", comments != null ? comments.toUpperCase() : "");
        entry.put("remarks", comments != null ? comments.toUpperCase() : "");
        entry.put("previousStatus", prevStatus);
        entry.put("newStatus", newStatus);
        if (revNo != null) {
            entry.put("revNo", revNo);
        } else {
            entry.put("revNo", detail.getRevNo() != null ? detail.getRevNo() : 0);
        }
        history.add(entry);

        try {
            detail.setCancelRemarks(objectMapper.writeValueAsString(history));
        } catch (Exception e) {
            detail.setCancelRemarks(comments);
        }
    }

    private void saveCloseMomAndVerifyRecord(
            QmsMomDetails detail, String prevStatus, String newStatus, String action, String performedBy,
            String comments, String actionObservation, String attachmentInfo, String actionTaken,
            String verifiedBy, LocalDateTime verifiedDate, String rejectedBy, LocalDateTime rejectedDate,
            String rejectionRemarks) {
        QmsCloseMomAndVerify record = new QmsCloseMomAndVerify();
        record.setActionItemId(detail.getId());

        if (detail.getMom() != null) {
            record.setMomNo(detail.getMom().getMomNo());
            record.setMeetingDate(detail.getMom().getMomDate());
        }
        record.setDiscussedPoint(detail.getDiscussedPoint());
        if (detail.getAssignedTo() != null) {
            record.setResponsibility(detail.getAssignedTo().getEmployeeName());
            record.setAssignedToId(detail.getAssignedTo().getId());
        }
        if (detail.getAssignedBy() != null) {
            record.setAssignedById(detail.getAssignedBy().getId());
        } else if (detail.getMom() != null && detail.getMom().getChairedBy() != null) {
            record.setAssignedById(detail.getMom().getChairedBy().getId());
        }
        record.setTargetDate(detail.getTargetDate());

        record.setPreviousStatus(prevStatus);
        record.setNewStatus(newStatus);
        record.setAction(action);
        record.setPerformedBy(performedBy);
        record.setPerformedDate(LocalDateTime.now());
        record.setComments(comments);
        record.setActionObservation(actionObservation);
        record.setAttachmentInfo(attachmentInfo);
        record.setActionTaken(actionTaken);
        record.setVerifiedBy(verifiedBy);
        record.setVerifiedDate(verifiedDate);
        record.setRejectedBy(rejectedBy);
        record.setRejectedDate(rejectedDate);
        record.setRejectionRemarks(rejectionRemarks);
        closeMomAndVerifyRepository.save(record);
    }

    /**
     * Close a MOM detail (submit for approval).
     */
    @Transactional
    public void closeDetail(Long momId, Long detailId, Map<String, Object> data, String submittedUserId,
            com.autonoma.erp.model.admin.UserCredential userCred) {
        QmsMomMaster mom = getMomById(momId);
        QmsMomDetails detail = mom.getDetails().stream()
                .filter(d -> d.getId() != null && d.getId().longValue() == detailId.longValue())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Detail not found"));

        if ("INFO".equalsIgnoreCase(detail.getProcessType())) {
            UserCredential currentUser = userRepository.findByUserId(submittedUserId).orElse(userCred);
            String empName = null;
            Long currentEmpId = null;
            if (currentUser != null && currentUser.getEmpId() != null) {
                EmployeeMaster emp = employeeRepository.findById(currentUser.getEmpId()).orElse(null);
                if (emp != null) {
                    empName = emp.getEmployeeName();
                    currentEmpId = emp.getId();
                }
            }

            final String participantName = empName;
            List<QmsCloseMomAndVerify> existingLogs = closeMomAndVerifyRepository.findByActionItemId(detail.getId());
            QmsCloseMomAndVerify participantLog = existingLogs.stream()
                    .filter(l -> participantName != null && participantName.equalsIgnoreCase(l.getResponsibility()))
                    .findFirst()
                    .orElse(null);

            if (participantLog == null) {
                participantLog = new QmsCloseMomAndVerify();
                participantLog.setActionItemId(detail.getId());
                if (detail.getMom() != null) {
                    participantLog.setMomNo(detail.getMom().getMomNo());
                    participantLog.setMeetingDate(detail.getMom().getMomDate());
                }
                participantLog.setDiscussedPoint(detail.getDiscussedPoint());
                participantLog.setResponsibility(participantName);
                participantLog.setAssignedToId(currentEmpId);
                if (detail.getAssignedBy() != null) {
                    participantLog.setAssignedById(detail.getAssignedBy().getId());
                } else if (mom.getChairedBy() != null) {
                    participantLog.setAssignedById(mom.getChairedBy().getId());
                }
                participantLog.setPreviousStatus("OPEN");
            } else {
                participantLog.setPreviousStatus(participantLog.getNewStatus());
                if (participantLog.getAssignedToId() == null)
                    participantLog.setAssignedToId(currentEmpId);
            }

            participantLog.setNewStatus("Closed");
            participantLog.setAction("Acknowledge");
            participantLog.setPerformedBy(submittedUserId != null ? submittedUserId : "SYSTEM");
            participantLog.setPerformedDate(LocalDateTime.now());
            participantLog.setActionTaken("ACKNOWLEDGED");
            participantLog.setActionObservation("ACKNOWLEDGED");
            closeMomAndVerifyRepository.save(participantLog);

            // Check if ALL participants for this INFO detail have closed their records
            List<QmsCloseMomAndVerify> updatedLogs = closeMomAndVerifyRepository.findByActionItemId(detail.getId());
            boolean allClosed = !updatedLogs.isEmpty() && updatedLogs.stream()
                    .allMatch(l -> "Closed".equalsIgnoreCase(l.getNewStatus())
                            || "CLOSED".equalsIgnoreCase(l.getNewStatus()));

            if (allClosed) {
                detail.setStatus("Closed");
                detail.setActionStatus("Closed");
                detailRepository.save(detail);
                recalculateMeetingStatus(mom);
                assignStatuses(mom);
                repository.save(mom);
            }
            return;
        }

        int attachmentCount = 0;
        String attachmentInfo = (data.get("attachmentInfo") != null) ? String.valueOf(data.get("attachmentInfo")) : "";
        if (!attachmentInfo.trim().isEmpty() && !"[]".equals(attachmentInfo.trim())) {
            try {
                List<?> list = objectMapper.readValue(attachmentInfo, List.class);
                attachmentCount = list.size();
            } catch (Exception e) {
                attachmentCount = 0;
            }
        }

        workflowValidator.validateSubmit(detail, userCred, attachmentCount);

        String prevStatus = detail.getStatus() != null ? detail.getStatus() : "Open";
        String prevStatusUpper = prevStatus.toUpperCase().replace(" ", "").replace("_", "");
        if ("CREATED".equals(prevStatusUpper) || "UNRESOLVED".equals(prevStatusUpper)
                || "PENDING".equals(prevStatusUpper)) {
            prevStatusUpper = "OPEN";
        }

        if (!"OPEN".equals(prevStatusUpper) && !"REJECTED".equals(prevStatusUpper)) {
            throw new RuntimeException("Task is already submitted or closed.");
        }

        // Use exact DB name: 'Pending for Verify'
        detail.setStatus("Pending for Verify");
        detail.setActionStatus("Pending for Verify");
        detail.setSubmittedBy(submittedUserId);
        detail.setSubmittedDate(LocalDateTime.now());

        if ("REJECTED".equals(prevStatusUpper)) {
            detail.setLastResubmittedDate(LocalDateTime.now());
        }

        if (data.containsKey("actionTaken") && data.get("actionTaken") != null) {
            detail.setActionTaken(String.valueOf(data.get("actionTaken")));
        }
        if (data.containsKey("actionObservation") && data.get("actionObservation") != null) {
            detail.setActionObservation(String.valueOf(data.get("actionObservation")));
        }
        if (data.containsKey("attachmentInfo") && data.get("attachmentInfo") != null) {
            detail.setAttachmentInfo(String.valueOf(data.get("attachmentInfo")));
        }

        String actionName = "REJECTED".equals(prevStatusUpper) ? "Resubmit" : "Submit";
        saveCloseMomAndVerifyRecord(
                detail, prevStatus, "Pending for Verify", actionName, submittedUserId,
                null, detail.getActionObservation(), detail.getAttachmentInfo(), detail.getActionTaken(),
                null, null, null, null, null);
        appendAuditTrail(detail, actionName, submittedUserId, "Worker", detail.getActionTaken(), prevStatus,
                "Pending for Verify", null);

        detailRepository.save(detail);
        recalculateMeetingStatus(mom);
        assignStatuses(mom);
        repository.save(mom);

        if (detail.getAssignedTo() != null) {
            try {
                notificationService.markMomAssignmentNotificationAsRead(detail.getAssignedTo().getId(), mom.getMomNo());
            } catch (Exception e) {
                log.warn("[Notification] Failed to mark assignment notification as read: {}", e.getMessage());
            }
        }

        if (detail.getAssignedBy() != null) {
            EmployeeMaster submittedByEmp = null;
            if (submittedUserId != null) {
                UserCredential uCred = userRepository.findByUserId(submittedUserId).orElse(null);
                if (uCred != null && uCred.getEmpId() != null) {
                    submittedByEmp = employeeRepository.findById(uCred.getEmpId()).orElse(null);
                }
            }
            try {
                notificationService.notifyUserAboutMomClosureSubmission(detail.getAssignedBy(), submittedByEmp, mom,
                        detail);
            } catch (Exception ex) {
                log.warn("[Notification] Failed to notify assigner for point {}: {}", detail.getDiscussedPoint(),
                        ex.getMessage());
            }
        }
    }

    /**
     * Approve a MOM detail.
     */
    @Transactional
    public void approveDetail(Long momId, Long detailId, String approvedUserId,
            com.autonoma.erp.model.admin.UserCredential userCred) {
        QmsMomMaster mom = getMomById(momId);
        QmsMomDetails detail = mom.getDetails().stream()
                .filter(d -> d.getId() != null && d.getId().longValue() == detailId.longValue())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Detail not found"));

        workflowValidator.validateApprove(detail, userCred);

        String prevStatus = detail.getStatus() != null ? detail.getStatus() : "Open";

        // Use exact DB name: 'VERIFIED'
        detail.setStatus("VERIFIED");
        detail.setActionStatus("VERIFIED");
        detail.setVerifiedBy(approvedUserId);
        detail.setVerifiedDate(LocalDateTime.now());

        saveCloseMomAndVerifyRecord(
                detail, prevStatus, "VERIFIED", "Verify", approvedUserId,
                "Verified and Completed", null, null, null,
                approvedUserId, LocalDateTime.now(), null, null, null);
        appendAuditTrail(detail, "Verification", approvedUserId, "Manager", "Verified and Completed", prevStatus,
                "VERIFIED", null);

        if (detail.getAssignedBy() != null) {
            try {
                notificationService.markMomClosureNotificationAsRead(detail.getAssignedBy().getId(), mom.getMomNo());
            } catch (Exception e) {
                log.warn("[Notification] Failed to mark closure notification as read: {}", e.getMessage());
            }
        }

        if (detail.getAssignedTo() != null) {
            try {
                EmployeeMaster verifiedByEmp = null;
                if (approvedUserId != null) {
                    UserCredential uCred = userRepository.findByUserId(approvedUserId).orElse(null);
                    if (uCred != null && uCred.getEmpId() != null) {
                        verifiedByEmp = employeeRepository.findById(uCred.getEmpId()).orElse(null);
                    }
                }
                notificationService.notifyUserAboutMomVerification(detail.getAssignedTo(), verifiedByEmp, mom, detail);
            } catch (Exception ex) {
                log.warn("[Notification] Failed to notify assignee about verification: {}", ex.getMessage());
            }
        }

        boolean previouslyClosed = "CLOSED".equalsIgnoreCase(mom.getStatus());
        recalculateMeetingStatus(mom);
        if ("CLOSED".equalsIgnoreCase(mom.getStatus()) && !previouslyClosed) {
            generateReport(mom, approvedUserId);
        }
        assignStatuses(mom);
        repository.save(mom);
    }

    private void generateReport(QmsMomMaster mom, String approvedUserId) {
        com.autonoma.erp.modules.qms.meeting.entity.QmsMomReportHd reportHd = new com.autonoma.erp.modules.qms.meeting.entity.QmsMomReportHd();
        reportHd.setMeetingType(mom.getSchedule() != null && mom.getSchedule().getMeetingType() != null
                ? mom.getSchedule().getMeetingType().getMeetingName()
                : null);
        reportHd.setScheduleNo(mom.getSchedule() != null ? mom.getSchedule().getScheduleNo() : null);
        reportHd.setMeetingDate(mom.getMomDate());
        reportHd.setApprovedBy(approvedUserId);
        reportHd.setApprovalDate(LocalDateTime.now());
        reportHd.setCreatedBy(approvedUserId);

        List<com.autonoma.erp.modules.qms.meeting.entity.QmsMomReportDt> reportDetails = new ArrayList<>();
        for (QmsMomDetails detail : mom.getDetails()) {
            com.autonoma.erp.modules.qms.meeting.entity.QmsMomReportDt rdt = new com.autonoma.erp.modules.qms.meeting.entity.QmsMomReportDt();
            rdt.setReportHd(reportHd);
            rdt.setMinutesNo(String.valueOf(detail.getId()));
            rdt.setDiscussedPoints(detail.getDiscussedPoint());
            rdt.setAssignedBy(detail.getAssignedBy() != null ? detail.getAssignedBy().getEmployeeName() : null);
            rdt.setAssignedTo(detail.getAssignedTo() != null ? detail.getAssignedTo().getEmployeeName() : null);
            rdt.setStatus(detail.getStatus());
            rdt.setActionStatus(detail.getActionStatus());
            rdt.setProcessType(detail.getProcessType());
            rdt.setCreatedBy(approvedUserId);
            reportDetails.add(rdt);
        }
        reportHd.setDetails(reportDetails);
        reportService.saveReport(reportHd);
    }

    /**
     * Reject a MOM detail.
     */
    @Transactional
    public void rejectDetail(Long momId, Long detailId, String comments, String rejectedUserId,
            com.autonoma.erp.model.admin.UserCredential userCred) {
        QmsMomMaster mom = getMomById(momId);
        QmsMomDetails detail = mom.getDetails().stream()
                .filter(d -> d.getId() != null && d.getId().longValue() == detailId.longValue())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Detail not found"));

        workflowValidator.validateReject(detail, userCred, comments);

        String prevStatus = detail.getStatus() != null ? detail.getStatus() : "Open";

        int nextRevNo = (detail.getRevNo() != null ? detail.getRevNo() : 0) + 1;
        detail.setRevNo(nextRevNo);
        // Use exact DB names: 'UNRESOLVED' for display, 'Open' allows re-submission
        detail.setStatus("UNRESOLVED");
        detail.setActionStatus("UNRESOLVED");
        detail.setRejectedBy(rejectedUserId);
        detail.setRejectedDate(LocalDateTime.now());
        detail.setRejectionRemarks(comments);
        // Resolve rejector's display name from employee repository
        String rejectedByName = rejectedUserId; // fallback
        if (userCred != null && userCred.getEmpId() != null) {
            try {
                EmployeeMaster emp = employeeRepository.findById(userCred.getEmpId()).orElse(null);
                if (emp != null && emp.getEmployeeName() != null) {
                    rejectedByName = emp.getEmployeeName();
                }
            } catch (Exception ignored) {
            }
        }
        final String resolvedRejectorName = rejectedByName;

        detail.setRejectedCount((detail.getRejectedCount() != null ? detail.getRejectedCount() : 0) + 1);
        detail.setCancelRemarks(comments);

        if (detail.getAssignedBy() != null) {
            try {
                notificationService.markMomClosureNotificationAsRead(detail.getAssignedBy().getId(), mom.getMomNo());
            } catch (Exception e) {
                log.warn("[Notification] Failed to mark closure notification as read: {}", e.getMessage());
            }
        }

        if (detail.getAssignedTo() != null) {
            try {
                EmployeeMaster rejectedByEmp = null;
                if (rejectedUserId != null) {
                    UserCredential uCred = userRepository.findByUserId(rejectedUserId).orElse(null);
                    if (uCred != null && uCred.getEmpId() != null) {
                        rejectedByEmp = employeeRepository.findById(uCred.getEmpId()).orElse(null);
                    }
                }
                notificationService.notifyUserAboutMomRejection(detail.getAssignedTo(), rejectedByEmp, mom, detail,
                        comments);
            } catch (Exception ex) {
                log.warn("[Notification] Failed to notify assignee about rejection: {}", ex.getMessage());
            }
        }

        saveCloseMomAndVerifyRecord(
                detail, prevStatus, "UNRESOLVED", "Reject", rejectedUserId,
                comments, null, null, null,
                null, null, rejectedUserId, LocalDateTime.now(), comments);
        appendAuditTrail(detail, "Rejection", rejectedUserId, "Manager", comments, prevStatus, "UNRESOLVED", nextRevNo);

        recalculateMeetingStatus(mom);
        assignStatuses(mom);
        repository.save(mom);
    }

    private String generateMomNo(QmsMomMaster mom) {
        String typePrefix = "MEET";
        if (mom.getSchedule() != null && mom.getSchedule().getMeetingType() != null) {
            typePrefix = mom.getSchedule().getMeetingType().getMeetingPrefix();
        }
        int year = LocalDate.now().getYear();
        String yearRange = year + "-" + (year + 1);
        Long nextId = repository.findMaxIdWithLock().orElse(0L) + 1;
        return String.format("MM/%s/%s/%03d", typePrefix, yearRange, nextId);
    }

    private void assignStatuses(QmsMomMaster mom) {
        if (mom.getStatus() != null) {
            mom.setStatusObj(statusRepo.findByNameIgnoreCase(mom.getStatus()).orElse(null));
        }
        if (mom.getDetails() != null) {
            mom.getDetails().forEach(d -> {
                if (d.getStatus() != null) {
                    d.setStatusObj(statusRepo.findByNameIgnoreCase(d.getStatus()).orElse(null));
                }
            });
        }
        if (mom.getAttendanceList() != null) {
            mom.getAttendanceList().forEach(att -> {
                if (att.getAttendanceStatus() != null) {
                    att.setStatusObj(statusRepo.findByNameIgnoreCase(att.getAttendanceStatus()).orElse(null));
                }
            });
        }
    }

    private void resolveDetailsPointAndProcessTypes(QmsMomMaster mom) {
        if (mom.getDetails() != null) {
            mom.getDetails().forEach(d -> {
                if (d.getPointType() != null) {
                    d.setPointTypeObj(pointTypeRepo.findByCodeIgnoreCase(d.getPointType()).orElse(null));
                }
                if (d.getProcessType() != null) {
                    d.setProcessTypeObj(processTypeRepo.findByCodeIgnoreCase(d.getProcessType()).orElse(null));
                }
            });
        }
    }

    public QmsMomDetails getDetailById(Long id) {
        return detailRepository.findById(id).orElse(null);
    }

    public void recalculateMeetingStatus(QmsMomMaster mom) {
        if (mom == null)
            return;
        List<QmsMomDetails> details = mom.getDetails();
        if (details == null || details.isEmpty()) {
            mom.setStatus("OPEN");
            return;
        }

        boolean allDetailsCompleted = details.stream().allMatch(d -> {
            String processType = d.getProcessType();
            String effectiveStatus = d.getStatus();
            if (d.getId() != null) {
                List<QmsCloseMomAndVerify> logs = closeMomAndVerifyRepository.findByActionItemId(d.getId());
                if (logs != null && !logs.isEmpty()) {
                    QmsCloseMomAndVerify latestLog = logs.stream()
                            .max(java.util.Comparator.comparing(QmsCloseMomAndVerify::getId))
                            .orElse(null);
                    if (latestLog != null && latestLog.getNewStatus() != null && !latestLog.getNewStatus().isBlank()) {
                        effectiveStatus = latestLog.getNewStatus();
                    }
                }
            }

            if ("INFO".equalsIgnoreCase(processType)) {
                if (effectiveStatus == null || effectiveStatus.isBlank()) {
                    return true;
                }
                String s = effectiveStatus.toUpperCase();
                return "CLOSED".equals(s) || "VERIFIED".equals(s) || "ACCEPTED".equals(s) || "APPROVED".equals(s);
            } else {
                if (effectiveStatus == null) return false;
                String s = effectiveStatus.toUpperCase();
                return "VERIFIED".equals(s) || "CLOSED".equals(s) || "ACCEPTED".equals(s) || "APPROVED".equals(s);
            }
        });

        if (allDetailsCompleted) {
            mom.setStatus("CLOSED");
        } else {
            mom.setStatus("OPEN");
        }
    }

    private void syncCloseMemosForActions(QmsMomMaster mom) {
        if (mom == null || mom.getDetails() == null)
            return;
        for (QmsMomDetails detail : mom.getDetails()) {
            if ("ACTION".equalsIgnoreCase(detail.getProcessType())) {
                if (detail.getId() != null) {
                    List<QmsCloseMomAndVerify> existingRecords = closeMomAndVerifyRepository
                            .findByActionItemId(detail.getId());
                    if (existingRecords.isEmpty()) {
                        QmsCloseMomAndVerify record = new QmsCloseMomAndVerify();
                        record.setActionItemId(detail.getId());
                        record.setMomNo(mom.getMomNo());
                        record.setMeetingDate(mom.getMomDate());
                        record.setDiscussedPoint(detail.getDiscussedPoint());
                        if (detail.getAssignedTo() != null) {
                            record.setResponsibility(detail.getAssignedTo().getEmployeeName());
                        }
                        record.setTargetDate(detail.getTargetDate());
                        record.setPreviousStatus("OPEN");
                        record.setNewStatus("OPEN");
                        record.setAction("Create");
                        record.setAssignedById(detail.getAssignedBy().getId());
                        record.setAssignedToId(detail.getAssignedTo().getId());
                        record.setPerformedBy(mom.getCreatedUser() != null ? mom.getCreatedUser() : "SYSTEM");
                        record.setPerformedDate(LocalDateTime.now());
                        record.setComments(detail.getCancelRemarks());
                        closeMomAndVerifyRepository.save(record);
                    }
                }
            } else if ("INFO".equalsIgnoreCase(detail.getProcessType())) {
                if (detail.getId() != null) {
                    List<QmsCloseMomAndVerify> existingRecords = closeMomAndVerifyRepository
                            .findByActionItemId(detail.getId());

                    Long chairedById = mom.getChairedBy() != null ? mom.getChairedBy().getId() : null;

                    java.util.Set<EmployeeMaster> participants = new java.util.HashSet<>();
                    if (mom.getAttendanceList() != null) {
                        for (QmsMomAttendance att : mom.getAttendanceList()) {
                            EmployeeMaster emp = att.getEmployee();
                            if (emp != null) {
                                Long empId = emp.getId();
                                if (emp.getEmployeeName() == null && empId != null) {
                                    emp = employeeRepository.findById(empId).orElse(emp);
                                }
                                if (emp != null && emp.getEmployeeName() != null && empId != null) {
                                    String attStatus = att.getAttendanceStatus();
                                    if ((attStatus == null || attStatus.isBlank()) && att.getStatusObj() != null) {
                                        attStatus = att.getStatusObj().getName();
                                    }
                                    boolean isPresent = attStatus == null || attStatus.isBlank()
                                            || !"ABSENT".equalsIgnoreCase(attStatus);
                                    if (isPresent) {
                                        if ((chairedById == null || !chairedById.equals(empId))) {
                                            participants.add(emp);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    for (EmployeeMaster emp : participants) {
                        String empName = emp.getEmployeeName();
                        boolean existsForParticipant = existingRecords.stream()
                                .anyMatch(r -> empName.equalsIgnoreCase(r.getResponsibility()));
                        if (!existsForParticipant) {
                            QmsCloseMomAndVerify record = new QmsCloseMomAndVerify();
                            record.setActionItemId(detail.getId());
                            record.setMomNo(mom.getMomNo());
                            record.setMeetingDate(mom.getMomDate());
                            record.setDiscussedPoint(detail.getDiscussedPoint());
                            record.setResponsibility(empName);
                            record.setAssignedToId(emp.getId());
                            record.setTargetDate(detail.getTargetDate());
                            record.setPreviousStatus("OPEN");
                            record.setNewStatus("OPEN");
                            record.setAction("INFO");
                            record.setPerformedBy(mom.getCreatedUser() != null ? mom.getCreatedUser() : "SUPER BOSS");
                            record.setPerformedDate(LocalDateTime.now());
                            record.setComments(detail.getCancelRemarks());
                            closeMomAndVerifyRepository.save(record);
                        }
                    }
                }
            }
        }
    }
}
//
//
//
//
//

//
//
//
//

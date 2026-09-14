package com.autonoma.erp.modules.qms.meeting.service;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingDepartmentMapping;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingEmployeeMapping;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingUserAttendance;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingMaster;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;

import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingMasterRepository;
import com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleMeetingConfig;
import com.autonoma.erp.modules.qms.meeting.dto.PendingMeetingReminderDto;
import com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleReminderAckLog;
import com.autonoma.erp.modules.qms.meeting.repository.QmsScheduleReminderAckLogRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsScheduleMeetingConfigRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.PageImpl;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Map;

@Slf4j
@Service
public class QmsMeetingScheduleService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(QmsMeetingScheduleService.class);
    private final QmsMeetingScheduleRepository repository;
    private final QmsMeetingMasterRepository qmsMeetingMasterRepository;
    private final NotificationService notificationService;
    private final MeetingSchedulerService meetingSchedulerService;
    private final StatusMasterRepository statusRepo;
    private final com.autonoma.erp.service.DatabaseFeatureService databaseFeatureService;
    private final com.autonoma.erp.repository.admin.UserRepository userRepository;
    private final com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository;
    private final com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository;
    private final com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository;
    private final QmsScheduleMeetingConfigRepository qmsScheduleMeetingConfigRepository;
    private final QmsScheduleReminderAckLogRepository reminderAckLogRepository;
    private final com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository employeeManagerMappingRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final jakarta.persistence.EntityManager entityManager;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository leaveEntryRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingUserAttendanceRepository meetingUserAttendanceRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.autonoma.erp.modules.hr.attendance.repository.HrDailyAttendanceRepository hrDailyAttendanceRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.autonoma.erp.modules.hr.attendance.repository.HrAttendanceDailyLogRepository hrAttendanceDailyLogRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public QmsMeetingScheduleService(
            QmsMeetingScheduleRepository repository,
            QmsMeetingMasterRepository qmsMeetingMasterRepository,
            NotificationService notificationService,
            MeetingSchedulerService meetingSchedulerService,
            StatusMasterRepository statusRepo,
            com.autonoma.erp.service.DatabaseFeatureService databaseFeatureService,
            com.autonoma.erp.repository.admin.UserRepository userRepository,
            com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository,
            com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository employeeManagerMappingRepository,
            com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository,
            com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository,
            QmsScheduleMeetingConfigRepository qmsScheduleMeetingConfigRepository,
            QmsScheduleReminderAckLogRepository reminderAckLogRepository,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate,
            jakarta.persistence.EntityManager entityManager) {
        this.repository = repository;
        this.qmsMeetingMasterRepository = qmsMeetingMasterRepository;
        this.notificationService = notificationService;
        this.meetingSchedulerService = meetingSchedulerService;
        this.statusRepo = statusRepo;
        this.databaseFeatureService = databaseFeatureService;
        this.userRepository = userRepository;
        this.employeeMasterRepository = employeeMasterRepository;
        this.employeeManagerMappingRepository = employeeManagerMappingRepository;
        this.bosUserPageAuthRepository = bosUserPageAuthRepository;
        this.bosPageRepository = bosPageRepository;
        this.qmsScheduleMeetingConfigRepository = qmsScheduleMeetingConfigRepository;
        this.reminderAckLogRepository = reminderAckLogRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.entityManager = entityManager;
    }

    @Transactional
    public void migratePreviousSchedules() {
        String query = "SELECT " +
                "REV_SOURCE_SCHEDULE_NO, REV_NO, MEETING_TYPE_ID, START_TIME, END_TIME, INTERVAL_TIME, FREQUENCY, CHAIRED_BY_ID, HOST_BY_ID, CANCEL_REASON, RESCHEDULE_REASON, COMMENTS, UPDATED_BY, IS_ACTIVE, SUBJECT, STATUS, WEEKDAYS, SEARCH_TEXT, AUTO_SCHEDULE, PARENT_SCHEDULE_ID, MEETING_STATUS, ATTENDANCE_STATUS, MOM_STATUS, CONFIG_ID, MIN(ID) AS MIN_ID, COUNT(*) AS RECORD_COUNT "
                +
                "FROM QMS_MEETING_SCHEDULE " +
                "WHERE ISNULL(UPPER(FREQUENCY), '') <> 'NONE' " +
                "  AND STATUS NOT IN (5, 13, 14) " +
                "GROUP BY " +
                "REV_SOURCE_SCHEDULE_NO, REV_NO, MEETING_TYPE_ID, START_TIME, END_TIME, INTERVAL_TIME, FREQUENCY, CHAIRED_BY_ID, HOST_BY_ID, CANCEL_REASON, RESCHEDULE_REASON, COMMENTS, UPDATED_BY, IS_ACTIVE, SUBJECT, STATUS, WEEKDAYS, SEARCH_TEXT, AUTO_SCHEDULE, PARENT_SCHEDULE_ID, MEETING_STATUS, ATTENDANCE_STATUS, MOM_STATUS, CONFIG_ID "
                +
                "HAVING COUNT(*) > 1 " +
                "ORDER BY RECORD_COUNT DESC";

        List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(query);
        for (java.util.Map<String, Object> row : rows) {
            Long meetingTypeId = ((Number) row.get("MEETING_TYPE_ID")).longValue();
            Long minId = ((Number) row.get("MIN_ID")).longValue();
            String frequency = (String) row.get("FREQUENCY");
            String weekdays = (String) row.get("WEEKDAYS");

            if (weekdays == null || weekdays.trim().isEmpty()) {
                String wdQuery = "SELECT WEEKDAY_ID FROM QMS_MEETING_SCHEDULE_WEEKDAY_MAPPING WHERE SCHEDULE_ID = ?";
                List<String> wds = jdbcTemplate.queryForList(wdQuery, String.class, minId);
                if (wds != null && !wds.isEmpty()) {
                    weekdays = String.join(",", wds);
                }
            }

            java.sql.Time startTimeSql = (java.sql.Time) row.get("START_TIME");
            java.sql.Time endTimeSql = (java.sql.Time) row.get("END_TIME");
            java.sql.Time intervalTimeSql = (java.sql.Time) row.get("INTERVAL_TIME");

            java.time.LocalTime startTime = startTimeSql != null ? startTimeSql.toLocalTime() : null;
            java.time.LocalTime endTime = endTimeSql != null ? endTimeSql.toLocalTime() : null;
            java.time.LocalTime intervalTime = intervalTimeSql != null ? intervalTimeSql.toLocalTime() : null;

            QmsScheduleMeetingConfig config = qmsScheduleMeetingConfigRepository.findByMeetingId(minId).orElse(null);

            if (config == null) {
                config = new QmsScheduleMeetingConfig();
                config.setMeetingId(minId);
                config.setMeetingTypeId(meetingTypeId);
                QmsMeetingSchedule minSchedule = repository.findById(minId).orElse(null);
                if (minSchedule != null) {
                    config.setMeetingStartDate(minSchedule.getMeetingDate());
                } else {
                    config.setMeetingStartDate(java.time.LocalDate.now());
                }
                config.setStartTime(startTime != null ? startTime : java.time.LocalTime.of(0, 0));
                config.setEndTime(endTime != null ? endTime : java.time.LocalTime.of(1, 0));
                config.setIntervalTime(intervalTime != null ? intervalTime : java.time.LocalTime.of(0, 30));
                config.setFrequency(frequency);
                config.setWeekdays(weekdays);
                config.setStatus(true);

                String currentUser = null;
                try {
                    currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                } catch (Exception e) {
                }
                config.setCreatedBy(currentUser != null ? currentUser : "SYSTEM");
                config.setCreatedDate(java.time.LocalDateTime.now());

                config = qmsScheduleMeetingConfigRepository.save(config);
            } else {
                // Update weekdays if missing
                if ((config.getWeekdays() == null || config.getWeekdays().trim().isEmpty()) && weekdays != null
                        && !weekdays.trim().isEmpty()) {
                    config.setWeekdays(weekdays);
                    config = qmsScheduleMeetingConfigRepository.save(config);
                }
            }

            // Update all matching records
            String updateSql = "UPDATE QMS_MEETING_SCHEDULE " +
                    "SET CONFIG_ID = ? " +
                    "WHERE ISNULL(UPPER(FREQUENCY), '') = UPPER(?) " +
                    "  AND MEETING_TYPE_ID = ? " +
                    "  AND (START_TIME = ? OR (START_TIME IS NULL AND ? IS NULL)) " +
                    "  AND CONFIG_ID IS NULL " +
                    "  AND ID IN (SELECT ID FROM ( " +
                    "    SELECT ID " +
                    "    FROM QMS_MEETING_SCHEDULE " +
                    "    WHERE ISNULL(UPPER(FREQUENCY), '') = UPPER(?) " +
                    "      AND MEETING_TYPE_ID = ? " +
                    "      AND (START_TIME = ? OR (START_TIME IS NULL AND ? IS NULL)) " +
                    "  ) AS tmp)";

            String startTimeStr = startTimeSql != null ? startTimeSql.toString() : null;
            jdbcTemplate.update(updateSql, config.getId(), frequency, meetingTypeId, startTimeStr, startTimeStr,
                    frequency, meetingTypeId, startTimeStr, startTimeStr);
        }
    }

    @Transactional
    public void deleteAllMeetingConfigs() {
        // Set CONFIG_ID to null for all meeting schedules to remove foreign key mapping
        // temporarily
        String updateSql = "UPDATE QMS_MEETING_SCHEDULE SET CONFIG_ID = NULL";
        jdbcTemplate.update(updateSql);

        // Delete all configs
        qmsScheduleMeetingConfigRepository.deleteAll();
    }

    @Transactional
    public List<QmsMeetingSchedule> getAllSchedules(Integer maxResult) {
        return getAllSchedules(maxResult, null, null, null);
    }

    @Transactional
    public List<QmsMeetingSchedule> getAllSchedules(Integer maxResult, String taskScope, String currentUser,
            Long memberId) {
        List<QmsMeetingSchedule> rawSchedules;
        if (maxResult != null && maxResult > 0) {
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                    0, maxResult,
                    org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
            rawSchedules = repository.findAll(pageable).getContent();
        } else {
            rawSchedules = repository.findAll(
                    org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
        }
        return filterSchedulesByScope(rawSchedules, taskScope, currentUser, memberId);
    }

    private boolean isEmployeeAttendedOrPresent(Long empId, Long scheduleId, java.time.LocalDate meetingDate) {
        if (empId == null || scheduleId == null)
            return false;

        // Check QmsMeetingUserAttendance for this specific meeting schedule
        if (meetingUserAttendanceRepository != null) {
            try {
                java.util.List<com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingUserAttendance> attList = meetingUserAttendanceRepository
                        .findByScheduleIdAndEmployeeId(scheduleId, empId);
                if (attList != null && !attList.isEmpty()) {
                    for (com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingUserAttendance att : attList) {
                        if (att != null) {
                            String st = att.getStatus();
                            if (att.getInTime() != null && (st == null || !st.equalsIgnoreCase("ABSENT"))) {
                                return true;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("[isEmployeeAttendedOrPresent] Exception via JPA repo for empId={}, scheduleId={}: {}", empId,
                        scheduleId, e.getMessage());
            }
        }

        // Direct JDBC fallback check
        try {
            if (jdbcTemplate != null) {
                Integer count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(1) FROM QMS_MEETING_USER_ATTENDANCE a " +
                                "LEFT JOIN AD_STATUS_MASTER st ON a.STATUS = st.ID " +
                                "WHERE a.SCHEDULE_ID = ? AND a.EMPLOYEE_ID = ? AND a.IN_TIME IS NOT NULL " +
                                "AND (a.STATUS IS NULL OR st.NAME IS NULL OR UPPER(st.NAME) <> 'ABSENT')",
                        Integer.class,
                        scheduleId, empId);
                if (count != null && count > 0) {
                    return true;
                }
            }
        } catch (Exception e) {
            log.warn("[isEmployeeAttendedOrPresent] JDBC fallback check error: {}", e.getMessage());
        }

        return false;
    }

    public Long resolveLoggedInEmpId(String currentUserId) {
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            return com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
        }

        // 0. Direct SecurityUtils check
        try {
            Long empId = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
            if (empId != null)
                return empId;
        } catch (Exception ignored) {
        }

        // 1. Direct EmployeeMaster lookup by unique code
        try {
            var emp = employeeMasterRepository.findByEmpCode(currentUserId)
                    .or(() -> employeeMasterRepository.findByEmpCodeIgnoreCase(currentUserId))
                    .or(() -> employeeMasterRepository.findByOldEmpCode(currentUserId))
                    .orElse(null);
            if (emp != null)
                return emp.getId();
        } catch (Exception ignored) {
        }

        // 2. Direct JDBC lookup in AD_USER_CREDENTIAL
        try {
            if (jdbcTemplate != null) {
                java.util.List<Long> empIds = jdbcTemplate.queryForList(
                        "SELECT EMP_ID FROM AD_USER_CREDENTIAL WHERE UPPER(USER_ID) = UPPER(?) AND EMP_ID IS NOT NULL",
                        Long.class,
                        currentUserId.trim());
                if (empIds != null && !empIds.isEmpty() && empIds.get(0) != null) {
                    return empIds.get(0);
                }
            }
        } catch (Exception ignored) {
        }

        // 3. UserCredential in current tenant schema
        try {
            var userOpt = userRepository.findByUserId(currentUserId)
                    .or(() -> userRepository.findByUserIdIgnoreCase(currentUserId));
            if (userOpt.isPresent() && userOpt.get().getEmpId() != null) {
                return userOpt.get().getEmpId();
            }
        } catch (Exception ignored) {
        }

        // 4. Fallback name prefix matching (e.g. "AKASH" matches "AKASH N")
        try {
            var emps = employeeMasterRepository.findAll();
            String p = currentUserId.trim().toLowerCase();
            for (var e : emps) {
                if (e != null && e.getEmployeeName() != null) {
                    String name = e.getEmployeeName().trim().toLowerCase();
                    if (name.equals(p) || name.startsWith(p + " ") || name.startsWith(p + ".")
                            || p.startsWith(name + " ")) {
                        return e.getId();
                    }
                }
            }
        } catch (Exception ignored) {
        }

        return null;
    }

    @Transactional
    public List<QmsMeetingSchedule> getActiveSchedules() {
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        Long loggedInEmpId = resolveLoggedInEmpId(currentUserId);

        log.info("[getActiveSchedules] currentUserId: {}, resolved loggedInEmpId: {}", currentUserId, loggedInEmpId);

        if (loggedInEmpId == null) {
            return new java.util.ArrayList<>();
        }

        java.time.LocalDate targetDate = java.time.LocalDate.now();
        List<QmsMeetingSchedule> list = repository.findEligibleSchedulesForMOM(
                loggedInEmpId,
                targetDate);
        log.info("[getActiveSchedules] findEligibleSchedulesForMOM returned {} items for empId {}",
                list != null ? list.size() : 0, loggedInEmpId);

        if (list == null || list.isEmpty())
            return new java.util.ArrayList<>();

        java.util.Map<Long, QmsMeetingSchedule> eligibleSchedules = new java.util.LinkedHashMap<>();
        for (QmsMeetingSchedule s : list) {
            if (s == null || s.getId() == null)
                continue;

            Long primaryHostId = s.getHostBy() != null ? s.getHostBy().getId() : null;
            Long secondaryHostId = s.getSecondaryHost() != null ? s.getSecondaryHost().getId() : null;
            Long tertiaryHostId = s.getTertiaryHost() != null ? s.getTertiaryHost().getId() : null;

            boolean isPrimary = Objects.equals(primaryHostId, loggedInEmpId);
            boolean isSecondary = Objects.equals(secondaryHostId, loggedInEmpId);
            boolean isTertiary = Objects.equals(tertiaryHostId, loggedInEmpId);

            // Check if Primary Host entered/checked into THIS specific meeting attendance
            boolean primaryAttended = isEmployeeAttendedOrPresent(primaryHostId, s.getId(), s.getMeetingDate());

            // 1. If Primary Host has marked Meeting User Attendance:
            // ONLY Primary Host gets the schedule!
            if (primaryAttended) {
                if (isPrimary) {
                    eligibleSchedules.put(s.getId(), s);
                }
                continue;
            }

            // 2. If Primary Host has NOT marked attendance, check Secondary Host:
            boolean secondaryAttended = isEmployeeAttendedOrPresent(secondaryHostId, s.getId(), s.getMeetingDate());

            // If Secondary Host has marked Meeting User Attendance:
            // ONLY Secondary Host gets the schedule!
            if (secondaryAttended) {
                if (isSecondary) {
                    eligibleSchedules.put(s.getId(), s);
                }
                continue;
            }

            // 3. If neither Primary nor Secondary Host marked attendance, check Tertiary
            // Host:
            boolean tertiaryAttended = isEmployeeAttendedOrPresent(tertiaryHostId, s.getId(), s.getMeetingDate());

            // If Tertiary Host has marked Meeting User Attendance:
            // ONLY Tertiary Host gets the schedule!
            if (tertiaryAttended) {
                if (isTertiary) {
                    eligibleSchedules.put(s.getId(), s);
                }
                continue;
            }

            // 4. If none of the hosts have marked attendance yet:
            // Schedule is NOT shown to anyone until attendance is marked!
        }
        log.info("[getActiveSchedules] Returning {} eligible schedules to user {}", eligibleSchedules.size(),
                currentUserId);
        return new java.util.ArrayList<>(eligibleSchedules.values());
    }

    private void validateMeetingTypeAccess(QmsMeetingSchedule schedule) {
        return;
    }

    @Transactional
    public QmsMeetingSchedule getScheduleById(Long id) {
        QmsMeetingSchedule schedule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        validateMeetingTypeAccess(schedule);

        // Programmatically initialize lazy-loaded proxies to prevent lazy
        // initialization exceptions
        if (schedule.getDepartments() != null) {
            schedule.getDepartments().forEach(d -> {
                if (d.getDepartment() != null) {
                    org.hibernate.Hibernate.initialize(d.getDepartment());
                }
            });
        }
        if (schedule.getParticipants() != null) {
            schedule.getParticipants().forEach(p -> {
                if (p.getEmployee() != null) {
                    org.hibernate.Hibernate.initialize(p.getEmployee().getOrganization());
                    if (p.getEmployee().getOrganization() != null
                            && p.getEmployee().getOrganization().getDepartment() != null) {
                        org.hibernate.Hibernate.initialize(p.getEmployee().getOrganization().getDepartment());
                    }
                }
            });
        }
        if (schedule.getChairedBy() != null) {
            org.hibernate.Hibernate.initialize(schedule.getChairedBy().getOrganization());
        }
        if (schedule.getHostBy() != null) {
            org.hibernate.Hibernate.initialize(schedule.getHostBy().getOrganization());
        }

        return schedule;
    }

    @Transactional
    public QmsMeetingSchedule saveSchedule(QmsMeetingSchedule schedule) {
        validateMeetingTypeAccess(schedule);
        com.autonoma.erp.util.HolidayValidator.validateDate(schedule.getMeetingDate());
        boolean isNew = schedule.getId() == null;
        boolean shouldUpdateConfig = Boolean.TRUE.equals(schedule.getUpdateConfig());
        QmsMeetingSchedule oldSchedule = null;

        if (!isNew) {
            oldSchedule = repository.findById(schedule.getId()).orElse(null);
            if (oldSchedule != null) {
                if (schedule.getConfigId() == null && oldSchedule.getConfigId() != null) {
                    schedule.setConfigId(oldSchedule.getConfigId());
                }
                if (schedule.getParentScheduleId() == null && oldSchedule.getParentScheduleId() != null) {
                    schedule.setParentScheduleId(oldSchedule.getParentScheduleId());
                }
                if (schedule.getAutoSchedule() == null && oldSchedule.getAutoSchedule() != null) {
                    schedule.setAutoSchedule(oldSchedule.getAutoSchedule());
                }

                String oldStatus = oldSchedule.getStatusObj() != null ? oldSchedule.getStatusObj().getName()
                        : oldSchedule.getStatus();
                if ("OPEN".equalsIgnoreCase(oldStatus)) {
                    boolean schedulingFieldsChanged = false;
                    if (!Objects.equals(schedule.getMeetingDate(), oldSchedule.getMeetingDate())) {
                        schedulingFieldsChanged = true;
                    }
                    if (!Objects.equals(schedule.getStartTime(), oldSchedule.getStartTime())) {
                        schedulingFieldsChanged = true;
                    }
                    if (!Objects.equals(schedule.getEndTime(), oldSchedule.getEndTime())) {
                        schedulingFieldsChanged = true;
                    }
                    if (!Objects.equals(schedule.getIntervalTime(), oldSchedule.getIntervalTime())) {
                        schedulingFieldsChanged = true;
                    }
                    if (schedule.getMeetingType() != null && oldSchedule.getMeetingType() != null) {
                        if (!Objects.equals(schedule.getMeetingType().getId(), oldSchedule.getMeetingType().getId())) {
                            schedulingFieldsChanged = true;
                        }
                    } else if (schedule.getMeetingType() != oldSchedule.getMeetingType()) {
                        schedulingFieldsChanged = true;
                    }
                    if (!Objects.equals(schedule.getSubject(), oldSchedule.getSubject())) {
                        schedulingFieldsChanged = true;
                    }
                    if (!Objects.equals(schedule.getFrequency(), oldSchedule.getFrequency())) {
                        schedulingFieldsChanged = true;
                    }
                    if (!Objects.equals(schedule.getWeekdays(), oldSchedule.getWeekdays())) {
                        schedulingFieldsChanged = true;
                    }

                    if (schedulingFieldsChanged) {
                        schedule.setStatus("RESCHEDULE");
                        statusRepo.findByNameIgnoreCase("RESCHEDULE").ifPresent(schedule::setStatusObj);
                    }
                }
            }
        } else {
            QmsMeetingSchedule originalSchedule = null;
            if (schedule.getRevSourceScheduleNo() != null) {
                originalSchedule = repository.findByScheduleNo(schedule.getRevSourceScheduleNo()).orElse(null);
            }
            if (originalSchedule != null) {
                String origStatus = originalSchedule.getStatusObj() != null ? originalSchedule.getStatusObj().getName()
                        : originalSchedule.getStatus();

                if (origStatus != null && "CLOSED".equalsIgnoreCase(origStatus.trim())) {
                    throw new RuntimeException("Manually closed meeting schedules cannot be amended.");
                }

                originalSchedule.setStatus("AMENDED");
                statusRepo.findByNameIgnoreCase("AMENDED").ifPresent(originalSchedule::setStatusObj);
                repository.save(originalSchedule);

                if (schedule.getConfigId() == null && originalSchedule.getConfigId() != null) {
                    schedule.setConfigId(originalSchedule.getConfigId());
                }

                Long rootParentId = originalSchedule.getParentScheduleId() != null
                        ? originalSchedule.getParentScheduleId()
                        : originalSchedule.getId();
                schedule.setParentScheduleId(rootParentId);

                String rootScheduleNo;
                if (originalSchedule.getParentScheduleId() != null) {
                    QmsMeetingSchedule rootParent = repository.findById(originalSchedule.getParentScheduleId())
                            .orElse(originalSchedule);
                    rootScheduleNo = rootParent.getScheduleNo();
                } else {
                    rootScheduleNo = originalSchedule.getScheduleNo();
                }

                List<String> existingAmendments = repository
                        .findScheduleNosStartingWith(rootScheduleNo + "-");
                int maxSuffix = 0;
                for (String sNo : existingAmendments) {
                    if (sNo != null && sNo.startsWith(rootScheduleNo + "-")) {
                        try {
                            String suffixStr = sNo.substring(rootScheduleNo.length() + 1);
                            int suffix = Integer.parseInt(suffixStr);
                            if (suffix > maxSuffix) {
                                maxSuffix = suffix;
                            }
                        } catch (NumberFormatException e) {
                            // Ignore
                        }
                    }
                }
                int nextSuffix = maxSuffix + 1;
                schedule.setScheduleNo(rootScheduleNo + "-" + nextSuffix);
                schedule.setRevNo((originalSchedule.getRevNo() != null ? originalSchedule.getRevNo() : 0) + 1);
                schedule.setStatus("OPEN"); // Force status of new amendment revision to OPEN
            } else {
                schedule.setScheduleNo(generateScheduleNo(schedule));
            }
        }

        if (schedule.getIsActive() == null) {
            schedule.setIsActive(true);
        }

        if (schedule.getStatus() != null) {
            schedule.setStatusObj(statusRepo.findByNameIgnoreCase(schedule.getStatus()).orElse(null));
        } else {
            schedule.setStatusObj(statusRepo.findByNameIgnoreCase("OPEN").orElse(null));
        }

        // Ensure bidirectional links are set for participants and departments
        if (schedule.getDepartments() != null) {
            schedule.getDepartments().forEach(d -> d.setSchedule(schedule));
        }
        if (schedule.getParticipants() != null) {
            schedule.getParticipants().forEach(p -> p.setSchedule(schedule));
        }

        updateMeetingSearchText(schedule);
        QmsMeetingSchedule saved = repository.save(schedule);

        // Sync configuration for recurring schedules when updated
        boolean isAmendment = (isNew && saved.getRevSourceScheduleNo() != null);

        log.info(
                "[QmsMeetingScheduleService] saveSchedule: scheduleId={}, scheduleNo={}, configId={}, parentScheduleId={}, updateConfig={}",
                saved.getId(), saved.getScheduleNo(), saved.getConfigId(), saved.getParentScheduleId(),
                saved.getUpdateConfig());

        // Ensure saved schedule has configId linked if parent schedule has one
        if (saved.getConfigId() == null && saved.getParentScheduleId() != null) {
            QmsMeetingSchedule parentSched = repository.findById(saved.getParentScheduleId()).orElse(null);
            if (parentSched != null) {
                Long pConfigId = parentSched.getConfigId();
                if (pConfigId == null) {
                    QmsScheduleMeetingConfig pConfig = qmsScheduleMeetingConfigRepository
                            .findByMeetingId(parentSched.getId()).orElse(null);
                    if (pConfig != null)
                        pConfigId = pConfig.getId();
                }
                if (pConfigId != null) {
                    saved.setConfigId(pConfigId);
                    saved = repository.save(saved);
                }
            }
        }

        if (shouldUpdateConfig) {
            QmsScheduleMeetingConfig existingConfig = null;

            // 1. Fetch directly by configId
            if (saved.getConfigId() != null) {
                existingConfig = qmsScheduleMeetingConfigRepository.findById(saved.getConfigId()).orElse(null);
            }
            // 2. Fetch directly by meetingId (saved.getId())
            if (existingConfig == null && saved.getId() != null) {
                existingConfig = qmsScheduleMeetingConfigRepository.findByMeetingId(saved.getId()).orElse(null);
            }
            // 3. Fetch directly by meetingTypeId (e.g. DRM, DDRM)
            if (existingConfig == null && saved.getMeetingType() != null && saved.getMeetingType().getId() != null) {
                List<QmsScheduleMeetingConfig> configsByType = qmsScheduleMeetingConfigRepository
                        .findByMeetingTypeIdOrderByIdDesc(Long.valueOf(saved.getMeetingType().getId()));
                if (configsByType != null && !configsByType.isEmpty()) {
                    existingConfig = configsByType.get(0);
                }
            }

            if (existingConfig == null && saved.getFrequency() != null
                    && !"NONE".equalsIgnoreCase(saved.getFrequency())) {
                existingConfig = new QmsScheduleMeetingConfig();
                existingConfig.setCreatedBy(saved.getUpdatedBy() != null ? saved.getUpdatedBy()
                        : (saved.getCreatedBy() != null ? saved.getCreatedBy() : "SYSTEM"));
                existingConfig.setCreatedDate(java.time.LocalDateTime.now());
                existingConfig.setStatus(true);
            }

            if (existingConfig != null) {
                log.info("[QmsMeetingScheduleService] Updating Config ID {} MEETING_ID to {}", existingConfig.getId(),
                        saved.getId());
                // Update MEETING_ID in Config to point to the currently saved schedule ID
                existingConfig.setMeetingId(saved.getId());

                if (saved.getMeetingType() != null)
                    existingConfig.setMeetingTypeId(Long.valueOf(saved.getMeetingType().getId()));
                if (saved.getMeetingDate() != null)
                    existingConfig.setMeetingStartDate(saved.getMeetingDate());
                if (saved.getFrequency() != null)
                    existingConfig.setFrequency(saved.getFrequency());
                if (saved.getStartTime() != null)
                    existingConfig.setStartTime(saved.getStartTime());
                if (saved.getEndTime() != null)
                    existingConfig.setEndTime(saved.getEndTime());
                if (saved.getIntervalTime() != null)
                    existingConfig.setIntervalTime(saved.getIntervalTime());
                if (saved.getWeekdays() != null)
                    existingConfig.setWeekdays(saved.getWeekdays());

                existingConfig.setUpdatedBy(saved.getUpdatedBy() != null ? saved.getUpdatedBy() : saved.getCreatedBy());
                existingConfig.setUpdatedDate(java.time.LocalDateTime.now());
                existingConfig = qmsScheduleMeetingConfigRepository.save(existingConfig);

                if (saved.getConfigId() == null || !saved.getConfigId().equals(existingConfig.getId())) {
                    saved.setConfigId(existingConfig.getId());
                    saved = repository.save(saved);
                }
            }
        } else if (isNew && !isAmendment && saved.getFrequency() != null
                && !"NONE".equalsIgnoreCase(saved.getFrequency())) {
            QmsScheduleMeetingConfig config = new QmsScheduleMeetingConfig();
            config.setMeetingId(saved.getId());
            config.setMeetingTypeId(saved.getMeetingType() != null ? Long.valueOf(saved.getMeetingType().getId()) : 0L);
            config.setMeetingStartDate(saved.getMeetingDate());
            config.setStartTime(saved.getStartTime());
            config.setEndTime(saved.getEndTime() != null ? saved.getEndTime() : saved.getStartTime().plusMinutes(30));
            config.setIntervalTime(
                    saved.getIntervalTime() != null ? saved.getIntervalTime() : saved.getStartTime().plusMinutes(10));
            config.setFrequency(saved.getFrequency());
            config.setWeekdays(saved.getWeekdays());
            config.setStatus(true);

            String currentUser = saved.getCreatedBy();
            if (currentUser == null) {
                try {
                    currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                } catch (Exception e) {
                }
            }
            config.setCreatedBy(currentUser != null ? currentUser : "SYSTEM");
            config.setCreatedDate(java.time.LocalDateTime.now());

            config = qmsScheduleMeetingConfigRepository.save(config);

            saved.setConfigId(config.getId());
            saved = repository.save(saved);
        }

        if (saved.getFrequency() != null && !"NONE".equalsIgnoreCase(saved.getFrequency())
                && meetingSchedulerService != null) {
            try {
                meetingSchedulerService.generateRecurringMeetings(false, java.time.LocalDate.now());
            } catch (Exception ex) {
                log.warn("[QmsMeetingScheduleService] Failed to auto-generate draft recurrence on saveSchedule: {}",
                        ex.getMessage());
            }
        }

        // Determine Action Type
        boolean timeChanged = false;
        if (!isNew && oldSchedule != null) {
            boolean dateChanged = (saved.getMeetingDate() != null
                    && !saved.getMeetingDate().equals(oldSchedule.getMeetingDate()));
            boolean startChanged = (saved.getStartTime() != null
                    && !saved.getStartTime().equals(oldSchedule.getStartTime()));
            timeChanged = dateChanged || startChanged;
        }
        String actionType = isNew ? "NEW" : (timeChanged ? "UPDATE_TIME" : "UPDATE_MEMBERS");

        // Asynchronously notify Host and Participants to avoid blocking the HTTP
        // response thread
        final QmsMeetingSchedule finalSaved = saved;
        final QmsMeetingSchedule finalOldSchedule = oldSchedule;
        final boolean finalIsNew = isNew;
        final boolean finalTimeChanged = timeChanged;
        final String finalActionType = actionType;
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                if (finalIsNew || finalTimeChanged
                        || (!finalIsNew && finalOldSchedule != null && finalOldSchedule.getHostBy() != null
                                && finalSaved.getHostBy() != null
                                && !finalOldSchedule.getHostBy().getId().equals(finalSaved.getHostBy().getId()))) {
                    if (finalSaved.getHostBy() != null) {
                        notificationService.notifyUserAboutMeeting(finalSaved.getHostBy(), finalSaved, finalActionType);
                    }
                }
            } catch (Exception ex) {
                log.warn("[Notification] Failed to notify host for schedule {}: {}", finalSaved.getScheduleNo(),
                        ex.getMessage());
            }

            if (finalSaved.getParticipants() != null) {
                List<Long> oldParticipantIds = java.util.Collections.emptyList();
                if (!finalIsNew && finalOldSchedule != null && finalOldSchedule.getParticipants() != null) {
                    oldParticipantIds = finalOldSchedule.getParticipants().stream()
                            .filter(p -> p.getEmployee() != null)
                            .map(p -> p.getEmployee().getId())
                            .collect(Collectors.toList());
                }

                for (QmsMeetingParticipantMapping participant : finalSaved.getParticipants()) {
                    if (participant.getEmployee() != null) {
                        Long empId = participant.getEmployee().getId();
                        if (finalIsNew || finalTimeChanged || !oldParticipantIds.contains(empId)) {
                            try {
                                notificationService.notifyUserAboutMeeting(participant.getEmployee(), finalSaved,
                                        finalActionType);
                            } catch (Exception ex) {
                                log.warn("[Notification] Failed to notify participant {} for schedule {}: {}",
                                        empId, finalSaved.getScheduleNo(), ex.getMessage());
                            }
                        }
                    }
                }
            }
        });

        return saved;
    }

    @Transactional
    public void deleteSchedule(Long id) {
        repository.deleteById(id);
    }

    private synchronized String generateScheduleNo(QmsMeetingSchedule schedule) {
        String prefix = "MEET";
        if (schedule.getMeetingType() != null) {
            Integer mtId = schedule.getMeetingType().getId();
            if (mtId != null) {
                QmsMeetingMaster fullType = qmsMeetingMasterRepository.findById(mtId).orElse(null);
                if (fullType != null) {
                    schedule.setMeetingType(fullType);
                    if (fullType.getMeetingPrefix() != null && !fullType.getMeetingPrefix().trim().isEmpty()) {
                        prefix = fullType.getMeetingPrefix().trim();
                    } else if (fullType.getMeetingName() != null && !fullType.getMeetingName().trim().isEmpty()) {
                        String name = fullType.getMeetingName().trim();
                        StringBuilder sb = new StringBuilder();
                        for (String word : name.split("\\s+")) {
                            if (!word.isEmpty()) {
                                sb.append(Character.toUpperCase(word.charAt(0)));
                            }
                        }
                        prefix = sb.toString();
                        if (prefix.isEmpty()) {
                            prefix = name.substring(0, Math.min(name.length(), 4)).toUpperCase();
                        }
                    }
                }
            }
        }
        LocalDate meetingDate = schedule.getMeetingDate() != null ? schedule.getMeetingDate() : LocalDate.now();
        int year = meetingDate.getYear();
        int month = meetingDate.getMonthValue();
        int startYear = (month >= 4) ? year : (year - 1);
        int endYear = startYear + 1;
        String yearRange = startYear + "-" + endYear;
        String prefixPath = prefix + "/" + yearRange + "/";

        List<String> existing = repository.findScheduleNosStartingWith(prefixPath);
        long maxSeq = 0L;
        for (String sNo : existing) {
            if (sNo != null) {
                try {
                    String[] parts = sNo.split("/");
                    long seq = Long.parseLong(parts[parts.length - 1]);
                    if (seq > maxSeq) {
                        maxSeq = seq;
                    }
                } catch (Exception e) {
                    // Ignore parse errors
                }
            }
        }

        long nextSeq = maxSeq + 1;
        return prefixPath + nextSeq;
    }

    private void updateMeetingSearchText(QmsMeetingSchedule schedule) {
        List<String> parts = new ArrayList<>();
        if (schedule.getScheduleNo() != null) {
            parts.add(schedule.getScheduleNo());
        }
        if (schedule.getMeetingType() != null && schedule.getMeetingType().getMeetingName() != null) {
            parts.add(schedule.getMeetingType().getMeetingName());
        }
        if (schedule.getChairedBy() != null && schedule.getChairedBy().getEmployeeName() != null) {
            parts.add(schedule.getChairedBy().getEmployeeName());
        }
        if (schedule.getHostBy() != null && schedule.getHostBy().getEmployeeName() != null) {
            parts.add(schedule.getHostBy().getEmployeeName());
        }
        if (schedule.getStatus() != null) {
            parts.add(schedule.getStatus());
        }
        if (schedule.getDepartments() != null) {
            for (com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingDepartmentMapping d : schedule
                    .getDepartments()) {
                if (d.getDepartment() != null && d.getDepartment().getDepartmentName() != null) {
                    parts.add(d.getDepartment().getDepartmentName());
                }
            }
        }
        if (schedule.getParticipants() != null) {
            for (com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping p : schedule
                    .getParticipants()) {
                if (p.getEmployee() != null && p.getEmployee().getEmployeeName() != null) {
                    parts.add(p.getEmployee().getEmployeeName());
                }
            }
        }
        schedule.setSearchText(String.join(" ", parts).toLowerCase());
    }

    @Transactional
    public QmsMeetingSchedule closeScheduleByNo(String scheduleNo) {
        if (scheduleNo == null || scheduleNo.trim().isEmpty()) {
            throw new RuntimeException("Schedule number is required.");
        }
        QmsMeetingSchedule schedule = repository.findByScheduleNo(scheduleNo.trim())
                .orElseThrow(() -> new RuntimeException("Schedule not found with number: " + scheduleNo));

        StatusMaster closedStatus = statusRepo.findByNameIgnoreCase("CLOSED")
                .orElseGet(() -> {
                    StatusMaster s = new StatusMaster();
                    s.setName("CLOSED");
                    return statusRepo.save(s);
                });
        schedule.setStatusObj(closedStatus);
        schedule.setStatus("CLOSED");
        QmsMeetingSchedule saved = repository.save(schedule);
        if (saved.getFrequency() != null && !"NONE".equalsIgnoreCase(saved.getFrequency())
                && meetingSchedulerService != null) {
            try {
                meetingSchedulerService.generateRecurringMeetings(false, LocalDate.now());
            } catch (Exception ex) {
                log.warn("[QmsMeetingScheduleService] Failed to auto-generate next recurrence on schedule close: {}",
                        ex.getMessage());
            }
        }
        return saved;
    }

    @Transactional
    public QmsMeetingSchedule closeScheduleById(Long id) {
        if (id == null) {
            throw new RuntimeException("Schedule ID is required.");
        }
        QmsMeetingSchedule schedule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found with ID: " + id));

        StatusMaster closedStatus = statusRepo.findByNameIgnoreCase("CLOSED")
                .orElseGet(() -> {
                    StatusMaster s = new StatusMaster();
                    s.setName("CLOSED");
                    return statusRepo.save(s);
                });
        schedule.setStatusObj(closedStatus);
        schedule.setStatus("CLOSED");
        QmsMeetingSchedule saved = repository.save(schedule);
        if (saved.getFrequency() != null && !"NONE".equalsIgnoreCase(saved.getFrequency())
                && meetingSchedulerService != null) {
            try {
                meetingSchedulerService.generateRecurringMeetings(false, LocalDate.now());
            } catch (Exception ex) {
                log.warn("[QmsMeetingScheduleService] Failed to auto-generate next recurrence on schedule close: {}",
                        ex.getMessage());
            }
        }
        return saved;
    }

    private String cleanFilterVal(String val) {
        if (val == null)
            return null;
        String trimmed = val.trim();
        if (trimmed.isEmpty() || "ALL".equalsIgnoreCase(trimmed)) {
            return null;
        }
        return trimmed;
    }

    @Transactional
    public Page<QmsMeetingSchedule> searchMeetingSchedules(String status, String searchValue, String searchBy,
            String scheduleNo, Long meetingTypeId, String meetingType, String createdAtFrom, String createdAtTo,
            String considerDate,
            String meetingDateFrom, String meetingDateTo, String meetingDateConsider, Pageable pageable,
            String taskScope, String currentUser, Long memberId) {
        return searchMeetingSchedules(status, searchValue, searchBy, scheduleNo, meetingTypeId, meetingType,
                createdAtFrom, createdAtTo, considerDate, meetingDateFrom, meetingDateTo, meetingDateConsider,
                false, pageable, taskScope, currentUser, memberId);
    }

    @Transactional
    public Page<QmsMeetingSchedule> searchMeetingSchedules(String status, String searchValue, String searchBy,
            String scheduleNo, Long meetingTypeId, String meetingType, String createdAtFrom, String createdAtTo,
            String considerDate,
            String meetingDateFrom, String meetingDateTo, String meetingDateConsider, Boolean includeDraft,
            Pageable pageable, String taskScope, String currentUser, Long memberId) {

        String cleanStatus = cleanFilterVal(status);
        if ("ALL".equalsIgnoreCase(cleanStatus)) {
            cleanStatus = null;
        }
        String cleanScheduleNo = cleanFilterVal(scheduleNo);
        String cleanMeetingType = cleanFilterVal(meetingType);
        String cleanSearch = cleanFilterVal(searchValue);

        log.info(
                "Received Filter Values - Status: {}, ScheduleNo: {}, MeetingTypeId: {}, MeetingType: {}, CreatedAtFrom: {}, CreatedAtTo: {}, ConsiderDate: {}, SearchValue: {}",
                status, scheduleNo, meetingTypeId, meetingType, createdAtFrom, createdAtTo, considerDate, searchValue);

        StringBuilder jpql = new StringBuilder("SELECT s FROM QmsMeetingSchedule s");
        StringBuilder countJpql = new StringBuilder("SELECT COUNT(s) FROM QmsMeetingSchedule s");
        List<String> predicates = new ArrayList<>();
        java.util.Map<String, Object> params = new java.util.HashMap<>();

        if (cleanStatus != null) {
            if (cleanStatus.contains(",")) {
                List<String> statusList = java.util.Arrays.stream(cleanStatus.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(String::toUpperCase)
                        .collect(Collectors.toList());
                predicates.add("UPPER(s.statusObj.name) IN :statusList");
                params.put("statusList", statusList);
            } else {
                predicates.add("UPPER(s.statusObj.name) = :status");
                params.put("status", cleanStatus.toUpperCase());
            }
        } else if (!Boolean.TRUE.equals(includeDraft)) {
            predicates.add("(s.statusObj IS NULL OR UPPER(s.statusObj.name) <> 'DRAFT')");
        }

        if (cleanMeetingType != null) {
            try {
                int idVal = Integer.parseInt(cleanMeetingType);
                predicates.add("s.meetingType.id = :meetingTypeIdFromStr");
                params.put("meetingTypeIdFromStr", idVal);
            } catch (NumberFormatException e) {
                predicates.add("UPPER(s.meetingType.meetingName) = :meetingType");
                params.put("meetingType", cleanMeetingType.toUpperCase());
            }
        }

        if (meetingTypeId != null) {
            predicates.add("s.meetingType.id = :meetingTypeId");
            params.put("meetingTypeId", meetingTypeId.intValue());
        }

        if (cleanScheduleNo != null) {
            predicates.add("LOWER(s.scheduleNo) LIKE :scheduleNo");
            params.put("scheduleNo", "%" + cleanScheduleNo.toLowerCase() + "%");
        }

        boolean isConsiderDate = "Yes".equalsIgnoreCase(considerDate) || "true".equalsIgnoreCase(considerDate);
        if (isConsiderDate) {
            if (createdAtFrom != null && !createdAtFrom.trim().isEmpty()) {
                try {
                    java.util.Date parsedFromDate = new java.text.SimpleDateFormat("yyyy-MM-dd")
                            .parse(createdAtFrom.trim());
                    java.util.Calendar cal = java.util.Calendar.getInstance();
                    cal.setTime(parsedFromDate);
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
                    cal.set(java.util.Calendar.MINUTE, 0);
                    cal.set(java.util.Calendar.SECOND, 0);
                    cal.set(java.util.Calendar.MILLISECOND, 0);
                    predicates.add("s.createdDate >= :parsedFromDate");
                    params.put("parsedFromDate", cal.getTime());
                } catch (Exception e) {
                    log.error("Failed to parse createdAtFrom: {}", createdAtFrom, e);
                }
            }
            if (createdAtTo != null && !createdAtTo.trim().isEmpty()) {
                try {
                    java.util.Date parsedToDate = new java.text.SimpleDateFormat("yyyy-MM-dd")
                            .parse(createdAtTo.trim());
                    java.util.Calendar cal = java.util.Calendar.getInstance();
                    cal.setTime(parsedToDate);
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
                    cal.set(java.util.Calendar.MINUTE, 59);
                    cal.set(java.util.Calendar.SECOND, 59);
                    cal.set(java.util.Calendar.MILLISECOND, 999);
                    predicates.add("s.createdDate <= :parsedToDate");
                    params.put("parsedToDate", cal.getTime());
                } catch (Exception e) {
                    log.error("Failed to parse createdAtTo: {}", createdAtTo, e);
                }
            }
        }

        if (cleanSearch != null) {
            predicates.add(
                    "(LOWER(s.scheduleNo) LIKE :cleanSearch OR LOWER(s.comments) LIKE :cleanSearch OR LOWER(s.subject) LIKE :cleanSearch OR LOWER(s.meetingType.meetingName) LIKE :cleanSearch OR LOWER(s.frequency) LIKE :cleanSearch OR LOWER(s.chairedBy.employeeName) LIKE :cleanSearch OR LOWER(s.hostBy.employeeName) LIKE :cleanSearch)");
            params.put("cleanSearch", "%" + cleanSearch.toLowerCase() + "%");
        }

        if (!predicates.isEmpty()) {
            String whereClause = " WHERE " + String.join(" AND ", predicates);
            jpql.append(whereClause);
            countJpql.append(whereClause);
        }

        jpql.append(" ORDER BY s.createdDate DESC");

        log.info("Generated JPQL: {}", jpql.toString());
        System.out.println("Generated JPQL: " + jpql.toString());

        // Execute count query
        jakarta.persistence.TypedQuery<Long> countQuery = entityManager.createQuery(countJpql.toString(), Long.class);
        for (java.util.Map.Entry<String, Object> entry : params.entrySet()) {
            countQuery.setParameter(entry.getKey(), entry.getValue());
        }
        Long totalCount = countQuery.getSingleResult();

        if (totalCount == 0) {
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        // Execute select query
        jakarta.persistence.TypedQuery<QmsMeetingSchedule> query = entityManager.createQuery(jpql.toString(),
                QmsMeetingSchedule.class);
        for (java.util.Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }

        if (pageable != null) {
            query.setFirstResult((int) pageable.getOffset());
            query.setMaxResults(pageable.getPageSize());
        }

        List<QmsMeetingSchedule> content = query.getResultList();
        List<QmsMeetingSchedule> scopedList = filterSchedulesByScope(content, taskScope, currentUser, memberId);
        return new PageImpl<>(scopedList, pageable, totalCount);
    }

    @Transactional
    public List<QmsMeetingSchedule> searchMeetingSchedulesList(String status, String searchValue, String searchBy,
            String scheduleNo, Long meetingTypeId, String meetingType, String createdAtFrom, String createdAtTo,
            String considerDate,
            String meetingDateFrom, String meetingDateTo, String meetingDateConsider, Integer maxResult,
            String taskScope, String currentUser, Long memberId) {
        return searchMeetingSchedulesList(status, searchValue, searchBy, scheduleNo, meetingTypeId, meetingType,
                createdAtFrom, createdAtTo, considerDate, meetingDateFrom, meetingDateTo, meetingDateConsider,
                false, maxResult, taskScope, currentUser, memberId);
    }

    @Transactional
    public List<QmsMeetingSchedule> searchMeetingSchedulesList(String status, String searchValue, String searchBy,
            String scheduleNo, Long meetingTypeId, String meetingType, String createdAtFrom, String createdAtTo,
            String considerDate,
            String meetingDateFrom, String meetingDateTo, String meetingDateConsider, Boolean includeDraft,
            Integer maxResult, String taskScope, String currentUser, Long memberId) {

        String cleanStatus = cleanFilterVal(status);
        if ("ALL".equalsIgnoreCase(cleanStatus)) {
            cleanStatus = null;
        }
        String cleanScheduleNo = cleanFilterVal(scheduleNo);
        String cleanMeetingType = cleanFilterVal(meetingType);
        String cleanSearch = cleanFilterVal(searchValue);

        log.info(
                "Received Filter Values (List) - Status: {}, ScheduleNo: {}, MeetingTypeId: {}, MeetingType: {}, CreatedAtFrom: {}, CreatedAtTo: {}, ConsiderDate: {}, SearchValue: {}",
                status, scheduleNo, meetingTypeId, meetingType, createdAtFrom, createdAtTo, considerDate, searchValue);

        StringBuilder jpql = new StringBuilder("SELECT s FROM QmsMeetingSchedule s");
        List<String> predicates = new ArrayList<>();
        java.util.Map<String, Object> params = new java.util.HashMap<>();

        if (cleanStatus != null) {
            if (cleanStatus.contains(",")) {
                List<String> statusList = java.util.Arrays.stream(cleanStatus.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(String::toUpperCase)
                        .collect(Collectors.toList());
                predicates.add("UPPER(s.statusObj.name) IN :statusList");
                params.put("statusList", statusList);
            } else {
                predicates.add("UPPER(s.statusObj.name) = :status");
                params.put("status", cleanStatus.toUpperCase());
            }
        } else if (!Boolean.TRUE.equals(includeDraft)) {
            predicates.add("(s.statusObj IS NULL OR UPPER(s.statusObj.name) <> 'DRAFT')");
        }

        if (cleanMeetingType != null) {
            try {
                int idVal = Integer.parseInt(cleanMeetingType);
                predicates.add("s.meetingType.id = :meetingTypeIdFromStr");
                params.put("meetingTypeIdFromStr", idVal);
            } catch (NumberFormatException e) {
                predicates.add("UPPER(s.meetingType.meetingName) = :meetingType");
                params.put("meetingType", cleanMeetingType.toUpperCase());
            }
        }

        if (meetingTypeId != null) {
            predicates.add("s.meetingType.id = :meetingTypeId");
            params.put("meetingTypeId", meetingTypeId.intValue());
        }

        if (cleanScheduleNo != null) {
            predicates.add("LOWER(s.scheduleNo) LIKE :scheduleNo");
            params.put("scheduleNo", "%" + cleanScheduleNo.toLowerCase() + "%");
        }

        boolean isConsiderDate = "Yes".equalsIgnoreCase(considerDate) || "true".equalsIgnoreCase(considerDate);
        if (isConsiderDate) {
            if (createdAtFrom != null && !createdAtFrom.trim().isEmpty()) {
                try {
                    java.util.Date parsedFromDate = new java.text.SimpleDateFormat("yyyy-MM-dd")
                            .parse(createdAtFrom.trim());
                    java.util.Calendar cal = java.util.Calendar.getInstance();
                    cal.setTime(parsedFromDate);
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
                    cal.set(java.util.Calendar.MINUTE, 0);
                    cal.set(java.util.Calendar.SECOND, 0);
                    cal.set(java.util.Calendar.MILLISECOND, 0);
                    predicates.add("s.createdDate >= :parsedFromDate");
                    params.put("parsedFromDate", cal.getTime());
                } catch (Exception e) {
                    log.error("Failed to parse createdAtFrom: {}", createdAtFrom, e);
                }
            }
            if (createdAtTo != null && !createdAtTo.trim().isEmpty()) {
                try {
                    java.util.Date parsedToDate = new java.text.SimpleDateFormat("yyyy-MM-dd")
                            .parse(createdAtTo.trim());
                    java.util.Calendar cal = java.util.Calendar.getInstance();
                    cal.setTime(parsedToDate);
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
                    cal.set(java.util.Calendar.MINUTE, 59);
                    cal.set(java.util.Calendar.SECOND, 59);
                    cal.set(java.util.Calendar.MILLISECOND, 999);
                    predicates.add("s.createdDate <= :parsedToDate");
                    params.put("parsedToDate", cal.getTime());
                } catch (Exception e) {
                    log.error("Failed to parse createdAtTo: {}", createdAtTo, e);
                }
            }
        }

        boolean isConsiderMeetingDate = "Yes".equalsIgnoreCase(meetingDateConsider)
                || "true".equalsIgnoreCase(meetingDateConsider);
        if (isConsiderMeetingDate) {
            if (meetingDateFrom != null && !meetingDateFrom.trim().isEmpty()) {
                try {
                    java.time.LocalDate fromD = java.time.LocalDate.parse(meetingDateFrom.trim());
                    predicates.add("s.meetingDate >= :meetingDateFrom");
                    params.put("meetingDateFrom", fromD);
                } catch (Exception e) {
                    log.error("Failed to parse meetingDateFrom: {}", meetingDateFrom, e);
                }
            }
            if (meetingDateTo != null && !meetingDateTo.trim().isEmpty()) {
                try {
                    java.time.LocalDate toD = java.time.LocalDate.parse(meetingDateTo.trim());
                    predicates.add("s.meetingDate <= :meetingDateTo");
                    params.put("meetingDateTo", toD);
                } catch (Exception e) {
                    log.error("Failed to parse meetingDateTo: {}", meetingDateTo, e);
                }
            }
        }

        if (cleanSearch != null) {
            predicates.add(
                    "(LOWER(s.scheduleNo) LIKE :cleanSearch OR LOWER(s.comments) LIKE :cleanSearch OR LOWER(s.subject) LIKE :cleanSearch OR LOWER(s.meetingType.meetingName) LIKE :cleanSearch OR LOWER(s.frequency) LIKE :cleanSearch OR LOWER(s.chairedBy.employeeName) LIKE :cleanSearch OR LOWER(s.hostBy.employeeName) LIKE :cleanSearch)");
            params.put("cleanSearch", "%" + cleanSearch.toLowerCase() + "%");
        }

        if (!predicates.isEmpty()) {
            jpql.append(" WHERE ").append(String.join(" AND ", predicates));
        }

        jpql.append(" ORDER BY s.createdDate DESC");

        log.info("Generated JPQL: {}", jpql.toString());
        System.out.println("Generated JPQL: " + jpql.toString());

        jakarta.persistence.TypedQuery<QmsMeetingSchedule> query = entityManager.createQuery(jpql.toString(),
                QmsMeetingSchedule.class);
        for (java.util.Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }

        int limit = (maxResult != null && maxResult > 0) ? maxResult : 500;
        query.setMaxResults(limit);

        List<QmsMeetingSchedule> content = query.getResultList();
        return filterSchedulesByScope(content, taskScope, currentUser, memberId);
    }

    private boolean isAdmin(com.autonoma.erp.model.admin.UserCredential user) {
        if (user == null)
            return false;
        String origTenant = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(AppUtil.AppConstants.DEFAULT_DB_SOURCE_NAME);
            com.autonoma.erp.model.admin.BosPage page = bosPageRepository.findByPageCode("QM1310").orElse(null);
            if (page != null) {
                com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                        .findByUserIdAndPageId(user.getUserId(), page.getPageId());
                if (auth != null && Integer.valueOf(1).equals(auth.getAdditional1())) {
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("Failed to check company page permission in QmsMeetingScheduleService", e);
        } finally {
            com.autonoma.erp.config.TenantContextHolder.setTenantId(origTenant);
        }
        return false;
    }

    private boolean isEmployeeInMeetingSchedule(QmsMeetingSchedule s, java.util.Set<Long> empIds,
            String usernameClean) {
        if (s == null)
            return false;
        if (empIds != null && !empIds.isEmpty()) {
            if (s.getChairedBy() != null && empIds.contains(s.getChairedBy().getId()))
                return true;
            if (s.getHostBy() != null && empIds.contains(s.getHostBy().getId()))
                return true;
            if (s.getSecondaryHost() != null && empIds.contains(s.getSecondaryHost().getId()))
                return true;
            if (s.getTertiaryHost() != null && empIds.contains(s.getTertiaryHost().getId()))
                return true;
            if (s.getParticipants() != null && s.getParticipants().stream()
                    .anyMatch(p -> p.getEmployee() != null && empIds.contains(p.getEmployee().getId())))
                return true;
        }
        if (usernameClean != null && !usernameClean.isEmpty()) {
            String created = s.getCreatedUser() != null ? s.getCreatedUser().toLowerCase().trim() : "";
            if (!created.isEmpty() && created.equals(usernameClean))
                return true;
        }
        return false;
    }

    private List<QmsMeetingSchedule> filterSchedulesByScope(List<QmsMeetingSchedule> list, String taskScope,
            String currentUser, Long memberId) {
        if (list == null || list.isEmpty()) {
            return new ArrayList<>();
        }

        if (memberId != null) {
            java.util.Set<Long> memberSet = java.util.Collections.singleton(memberId);
            return list.stream()
                    .filter(s -> isEmployeeInMeetingSchedule(s, memberSet, null))
                    .collect(Collectors.toList());
        }

        String scope = (taskScope != null && !taskScope.trim().isEmpty()) ? taskScope.trim() : "Mine";
        if ("Company".equalsIgnoreCase(scope)) {
            return list;
        }

        Long userEmpId = null;
        String cleanUser = currentUser != null ? currentUser.toLowerCase().trim() : null;
        if (currentUser != null && !currentUser.trim().isEmpty()) {
            com.autonoma.erp.model.admin.UserCredential userCred = userRepository.findByUserId(currentUser)
                    .orElse(null);
            if (userCred != null && userCred.getEmpId() != null) {
                userEmpId = userCred.getEmpId();
            }
        }

        if ("Mine".equalsIgnoreCase(scope)) {
            java.util.Set<Long> userEmpSet = userEmpId != null ? java.util.Collections.singleton(userEmpId)
                    : java.util.Collections.emptySet();
            final String finalCleanUser = cleanUser;
            return list.stream()
                    .filter(s -> isEmployeeInMeetingSchedule(s, userEmpSet, finalCleanUser))
                    .collect(Collectors.toList());
        } else if ("Team".equalsIgnoreCase(scope)) {
            java.util.Set<Long> teamEmpIds = new java.util.HashSet<>();
            if (userEmpId != null) {
                teamEmpIds.add(userEmpId);
                try {
                    List<Long> reportees = employeeManagerMappingRepository.findReporteeEmpIdsByManagerId(userEmpId);
                    if (reportees != null) {
                        teamEmpIds.addAll(reportees);
                    }
                } catch (Exception e) {
                    log.warn("Error resolving team members for scope filter: {}", e.getMessage());
                }
            }
            final java.util.Set<Long> finalTeamSet = teamEmpIds;
            final String finalCleanUser = cleanUser;
            return list.stream()
                    .filter(s -> isEmployeeInMeetingSchedule(s, finalTeamSet, finalCleanUser))
                    .collect(Collectors.toList());
        }

        return list;
    }

    @Transactional(readOnly = true)
    public List<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> getEligibleEmployees(Integer meetingTypeId,
            String role, List<Long> departmentIds) {
        com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingMaster meeting = qmsMeetingMasterRepository
                .findById(meetingTypeId).orElse(null);
        if (meeting == null) {
            return new ArrayList<>();
        }
        String meetingName = meeting.getMeetingName() != null ? meeting.getMeetingName().trim() : "";
        String meetingPrefix = meeting.getMeetingPrefix() != null ? meeting.getMeetingPrefix().trim() : "";

        boolean hasDepts = (departmentIds != null && !departmentIds.isEmpty());
        List<Long> depts = hasDepts ? departmentIds : new ArrayList<>();

        if ("CHAIRED".equalsIgnoreCase(role)) {
            return employeeMasterRepository.findEligibleChairpersons(meetingName, meetingPrefix);
        } else if ("HOST".equalsIgnoreCase(role)) {
            if (!hasDepts) {
                return new ArrayList<>();
            }
            return employeeMasterRepository.findEligibleHosts(meetingName, meetingPrefix, depts);
        } else if ("PARTICIPANT".equalsIgnoreCase(role)) {
            return employeeMasterRepository.findEligibleParticipants(meetingName, meetingPrefix, depts, hasDepts);
        }

        return employeeMasterRepository.findEligibleEmployeesForMeeting(meetingPrefix, depts, hasDepts);
    }

    private volatile List<Map<String, Object>> unallocatedResourcesCache = null;
    private volatile long unallocatedResourcesCacheTime = 0L;
    private static final long UNALLOCATED_CACHE_TTL_MS = 20_000L;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUnallocatedResources() {
        long now = System.currentTimeMillis();
        if (unallocatedResourcesCache != null && (now - unallocatedResourcesCacheTime) < UNALLOCATED_CACHE_TTL_MS) {
            return unallocatedResourcesCache;
        }

        String query = """
                WITH AllocatedMeetings AS (
                    SELECT DISTINCT TRY_CAST(CHAIRED_BY_ID AS BIGINT) AS EMP_ID FROM QMS_MEETING_SCHEDULE WITH (NOLOCK) WHERE IS_ACTIVE = 1 AND CHAIRED_BY_ID IS NOT NULL
                    UNION
                    SELECT DISTINCT TRY_CAST(HOST_BY_ID AS BIGINT) FROM QMS_MEETING_SCHEDULE WITH (NOLOCK) WHERE IS_ACTIVE = 1 AND HOST_BY_ID IS NOT NULL
                    UNION
                    SELECT DISTINCT TRY_CAST(SECONDARY_HOST_ID AS BIGINT) FROM QMS_MEETING_SCHEDULE WITH (NOLOCK) WHERE IS_ACTIVE = 1 AND SECONDARY_HOST_ID IS NOT NULL
                    UNION
                    SELECT DISTINCT TRY_CAST(TERTIARY_HOST_ID AS BIGINT) FROM QMS_MEETING_SCHEDULE WITH (NOLOCK) WHERE IS_ACTIVE = 1 AND TERTIARY_HOST_ID IS NOT NULL
                    UNION
                    SELECT DISTINCT TRY_CAST(EMPLOYEE_ID AS BIGINT) FROM QMS_MEETING_USER_ATTENDANCE WITH (NOLOCK) WHERE IS_ACTIVE = 1 AND SCHEDULE_ID IN (
                        SELECT ID FROM QMS_MEETING_SCHEDULE WITH (NOLOCK) WHERE IS_ACTIVE = 1
                    )
                ),
                AllocatedAudits AS (
                    SELECT DISTINCT TRY_CAST(AUDITOR_ID AS BIGINT) AS EMP_ID FROM QMS_AUDIT_SCHEDULE WITH (NOLOCK) WHERE IS_ACTIVE = 1 AND AUDITOR_ID IS NOT NULL
                    UNION
                    SELECT DISTINCT TRY_CAST(AUDITEE_ID AS BIGINT) FROM QMS_AUDIT_SCHEDULE WITH (NOLOCK) WHERE IS_ACTIVE = 1 AND AUDITEE_ID IS NOT NULL
                    UNION
                    SELECT DISTINCT TRY_CAST(NCR_APPROVED_BY_ID AS BIGINT) FROM QMS_AUDIT_SCHEDULE WITH (NOLOCK) WHERE IS_ACTIVE = 1 AND NCR_APPROVED_BY_ID IS NOT NULL
                ),
                AllocatedChecklists AS (
                    SELECT DISTINCT TRY_CAST(ASSIGNED_TO AS BIGINT) AS EMP_ID FROM QMS_CHECKLIST_ASSIGNMENT WITH (NOLOCK) WHERE ASSIGNED_TO IS NOT NULL
                    UNION
                    SELECT DISTINCT TRY_CAST(ASSIGN_TO AS BIGINT) FROM QMS_CHECKLIST_MASTER WITH (NOLOCK) WHERE ASSIGN_TO IS NOT NULL
                    UNION
                    SELECT DISTINCT TRY_CAST(ASSIGNED_TO AS BIGINT) FROM QMS_CHECKLIST_CLOSED WITH (NOLOCK) WHERE ASSIGNED_TO IS NOT NULL
                ),
                AllocatedUsers AS (
                    SELECT DISTINCT TRY_CAST(EMP_ID AS BIGINT) AS EMP_ID FROM AD_USER_CREDENTIAL WITH (NOLOCK) WHERE EMP_ID IS NOT NULL
                )
                SELECT
                    e.ID as id,
                    COALESCE(NULLIF(e.OLD_EMP_CODE, ''), e.EMP_CODE) as empCode,
                    e.EMPLOYEE_NAME as employeeName,
                    d.DEPARTMENT_NAME as departmentName,
                    e.PROFILE_UPLOAD as image,
                    ds.DESIGNATION_NAME as designationName,
                    c.CATEGORY_NAME as categoryName,
                    s.DATE_OF_JOINING as dateOfJoining,
                    vh.EMPLOYEE_NAME as verticalHead,
                    CONCAT_WS(', ',
                        CASE WHEN am.EMP_ID IS NULL THEN 'Meeting' END,
                        CASE WHEN aa.EMP_ID IS NULL THEN 'Audit' END,
                        CASE WHEN ac.EMP_ID IS NULL THEN 'CheckList' END,
                        CASE WHEN au.EMP_ID IS NULL THEN 'User Access' END
                    ) AS awaitingAssignment
                FROM HR_EMPLOYEE e WITH (NOLOCK)
                LEFT JOIN HR_EMPLOYEE_ORGANIZATION o WITH (NOLOCK) ON e.ID = o.EMPLOYEE_ID
                LEFT JOIN HR_DEPARTMENT d WITH (NOLOCK) ON o.DEPARTMENT_ID = d.ID
                LEFT JOIN HR_DESIGNATION ds WITH (NOLOCK) ON o.DESIGNATION_ID = ds.ID
                LEFT JOIN HR_CATEGORY_MASTER c WITH (NOLOCK) ON o.CATEGORY_ID = c.ID
                LEFT JOIN HR_EMPLOYEE_SCHEDULING s WITH (NOLOCK) ON e.ID = s.EMPLOYEE_ID
                LEFT JOIN HR_EMPLOYEE vh WITH (NOLOCK) ON TRY_CAST(o.VERTICAL_HEAD AS BIGINT) = vh.ID
                LEFT JOIN AllocatedMeetings am ON e.ID = am.EMP_ID
                LEFT JOIN AllocatedAudits aa ON e.ID = aa.EMP_ID
                LEFT JOIN AllocatedChecklists ac ON e.ID = ac.EMP_ID
                LEFT JOIN AllocatedUsers au ON e.ID = au.EMP_ID
                WHERE e.STATUS = (SELECT ID FROM AD_STATUS_MASTER WITH (NOLOCK) WHERE UPPER(TRIM(NAME)) = 'ACTIVE')
                  AND (UPPER(TRIM(ISNULL(e.FROMWHERE, ''))) = 'EMPLOYEE' OR (e.EMP_CODE IS NOT NULL AND LTRIM(RTRIM(e.EMP_CODE)) != ''))
                  AND (am.EMP_ID IS NULL OR aa.EMP_ID IS NULL OR ac.EMP_ID IS NULL OR au.EMP_ID IS NULL)
                ORDER BY e.EMPLOYEE_NAME ASC
                """;
        List<Map<String, Object>> result = jdbcTemplate.queryForList(query);
        unallocatedResourcesCache = result;
        unallocatedResourcesCacheTime = now;
        return result;
    }

    @Transactional
    public QmsMeetingSchedule cancelSchedule(Long id, String reason) {
        QmsMeetingSchedule schedule = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting Schedule not found with id: " + id));
        String currentStatus = schedule.getStatus() != null ? schedule.getStatus().toUpperCase() : "";
        if (!"OPEN".equalsIgnoreCase(currentStatus) && !"AMENDED".equalsIgnoreCase(currentStatus)
                && !"RESCHEDULE".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Only schedules with status OPEN, AMENDED, or RESCHEDULE can be cancelled.");
        }
        schedule.setStatus("CANCELLED");
        statusRepo.findByNameIgnoreCase("CANCELLED").ifPresent(schedule::setStatusObj);
        if (reason != null && !reason.trim().isEmpty()) {
            schedule.setCancelReason(reason.trim());
        }
        QmsMeetingSchedule saved = repository.save(schedule);

        if (saved.getFrequency() != null && !"NONE".equalsIgnoreCase(saved.getFrequency())
                && meetingSchedulerService != null) {
            try {
                meetingSchedulerService.generateRecurringMeetings(false, java.time.LocalDate.now());
            } catch (Exception ex) {
                log.warn("[QmsMeetingScheduleService] Failed to auto-generate next recurrence on cancelSchedule: {}",
                        ex.getMessage());
            }
        }

        return saved;
    }

    @Transactional
    public void cancelSchedules(List<Long> ids, String reason) {
        if (ids != null && !ids.isEmpty()) {
            for (Long id : ids) {
                try {
                    cancelSchedule(id, reason);
                } catch (Exception e) {
                    log.warn("Failed to cancel schedule ID {}: {}", id, e.getMessage());
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<PendingMeetingReminderDto> getPendingRemindersForEmployee(Long empId) {
        LocalDate today = LocalDate.now();
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        String currentEmpName = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmployeeName();

        List<Long> employeesOnLeave = java.util.Collections.emptyList();
        if (leaveEntryRepository != null) {
            try {
                employeesOnLeave = leaveEntryRepository.findEmployeeIdsOnLeaveOnDate(java.sql.Date.valueOf(today));
                if (employeesOnLeave == null) {
                    employeesOnLeave = java.util.Collections.emptyList();
                }
            } catch (Exception ex) {
                log.warn("[QmsMeetingScheduleService] Failed to fetch leave entries for {}: {}", today,
                        ex.getMessage());
            }
        }

        List<QmsMeetingSchedule> activeSchedules;
        try {
            activeSchedules = repository.findUpcomingSchedulesForReminders(today);
        } catch (Exception e) {
            activeSchedules = repository.findAll().stream()
                    .filter(s -> s != null && (s.getIsActive() == null || Boolean.TRUE.equals(s.getIsActive()))
                            && s.getMeetingDate() != null && !s.getMeetingDate().isBefore(today))
                    .collect(Collectors.toList());
        }
        List<PendingMeetingReminderDto> result = new ArrayList<>();

        Long empDeptId = null;
        if (empId != null && employeeMasterRepository != null) {
            try {
                Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(empId);
                if (empOpt.isPresent() && empOpt.get().getDepartment() != null) {
                    empDeptId = empOpt.get().getDepartment().getId();
                }
            } catch (Exception e) {
                log.warn("Failed to fetch employee department for empId {}: {}", empId, e.getMessage());
            }
        }
        for (QmsMeetingSchedule schedule : activeSchedules) {
            if (schedule == null || schedule.getMeetingDate() == null) {
                continue;
            }

            QmsMeetingMaster meetingMaster = schedule.getMeetingType();
            if (meetingMaster == null) {
                continue;
            }

            Integer masterReminderDays = meetingMaster.getReminderDays();
            if (masterReminderDays == null || masterReminderDays <= 0) {
                masterReminderDays = meetingMaster.getRemainderDays();
            }
            if (masterReminderDays == null || masterReminderDays <= 0) {
                continue;
            }
            int reminderDays = masterReminderDays;

            // Exclude non-active schedules
            String status = schedule.getStatus() != null ? schedule.getStatus().toUpperCase() : "";
            String meetingStatus = schedule.getMeetingStatus() != null ? schedule.getMeetingStatus().toUpperCase() : "";
            if ("CANCELLED".equals(status) || "COMPLETED".equals(meetingStatus) || "CLOSED".equals(status)
                    || "CANCELLED".equals(meetingStatus) || "CLOSED".equals(meetingStatus)) {
                continue;
            }

            LocalDate meetingDate = schedule.getMeetingDate();
            LocalDate reminderStartDate = meetingDate.minusDays(reminderDays);

            // Only show Present and Future meetings (skip past meetings)
            if (meetingDate.isBefore(today)) {
                continue;
            }

            if (today.isBefore(reminderStartDate)) {
                continue;
            }

            boolean isHost = false;
            boolean isChaired = false;
            boolean isParticipant = false;

            Long primaryHostId = schedule.getHostBy() != null ? schedule.getHostBy().getId() : null;
            Long secondaryHostId = schedule.getSecondaryHost() != null ? schedule.getSecondaryHost().getId() : null;
            Long tertiaryHostId = schedule.getTertiaryHost() != null ? schedule.getTertiaryHost().getId() : null;

            Long activeHostId = null;
            if (primaryHostId != null && !employeesOnLeave.contains(primaryHostId)) {
                activeHostId = primaryHostId;
            } else if (secondaryHostId != null && !employeesOnLeave.contains(secondaryHostId)) {
                activeHostId = secondaryHostId;
            } else if (tertiaryHostId != null && !employeesOnLeave.contains(tertiaryHostId)) {
                activeHostId = tertiaryHostId;
            } else {
                activeHostId = primaryHostId;
            }

            // Chaired Person check - Chaired person should NEVER receive meeting alarms / reminders
            if (schedule.getChairedBy() != null) {
                Long chairedId = schedule.getChairedBy().getId();
                if (empId != null && Objects.equals(chairedId, empId)) {
                    continue;
                }
                final String uid = currentUserId != null ? currentUserId.trim().toLowerCase() : "";
                final String uname = currentEmpName != null ? currentEmpName.trim().toLowerCase() : "";
                if (!uid.isEmpty() || !uname.isEmpty()) {
                    String cCode = schedule.getChairedBy().getEmpCode() != null
                            ? schedule.getChairedBy().getEmpCode().toLowerCase().trim()
                            : "";
                    String cName = schedule.getChairedBy().getEmployeeName() != null
                            ? schedule.getChairedBy().getEmployeeName().toLowerCase().trim()
                            : "";
                    if ((!uid.isEmpty() && cCode.equals(uid)) || (!uname.isEmpty() && cName.equals(uname))) {
                        continue;
                    }
                }
            }

            if (empId != null || (currentUserId != null && !currentUserId.trim().isEmpty())) {
                if (empId != null) {
                    isHost = (activeHostId != null && Objects.equals(activeHostId, empId));

                    if (schedule.getParticipants() != null) {
                        for (QmsMeetingParticipantMapping p : schedule.getParticipants()) {
                            if (p == null)
                                continue;
                            Long pPrimaryId = p.getEmployee() != null ? p.getEmployee().getId() : null;
                            Long pSecondaryId = p.getSecondaryEmployee() != null ? p.getSecondaryEmployee().getId()
                                    : null;
                            Long pTertiaryId = p.getTertiaryEmployee() != null ? p.getTertiaryEmployee().getId() : null;

                            Long pActiveId = null;
                            if (pPrimaryId != null && !employeesOnLeave.contains(pPrimaryId)) {
                                pActiveId = pPrimaryId;
                            } else if (pSecondaryId != null && !employeesOnLeave.contains(pSecondaryId)) {
                                pActiveId = pSecondaryId;
                            } else if (pTertiaryId != null && !employeesOnLeave.contains(pTertiaryId)) {
                                pActiveId = pTertiaryId;
                            } else {
                                pActiveId = pPrimaryId;
                            }

                            if (pActiveId != null && Objects.equals(pActiveId, empId)) {
                                isParticipant = true;
                                break;
                            }
                        }
                    }
                }

                // Exact Name / Username / EmpCode fallback matching on assigned schedule roles
                if (!isHost && !isParticipant) {
                    final String uid = currentUserId != null ? currentUserId.trim().toLowerCase() : "";
                    final String uname = currentEmpName != null ? currentEmpName.trim().toLowerCase() : "";

                    if (!uid.isEmpty() || !uname.isEmpty()) {
                        if (activeHostId != null) {
                            EmployeeMaster activeHost = null;
                            if (schedule.getHostBy() != null
                                    && Objects.equals(schedule.getHostBy().getId(), activeHostId))
                                activeHost = schedule.getHostBy();
                            else if (schedule.getSecondaryHost() != null
                                    && Objects.equals(schedule.getSecondaryHost().getId(), activeHostId))
                                activeHost = schedule.getSecondaryHost();
                            else if (schedule.getTertiaryHost() != null
                                    && Objects.equals(schedule.getTertiaryHost().getId(), activeHostId))
                                activeHost = schedule.getTertiaryHost();

                            if (activeHost != null) {
                                String hCode = activeHost.getEmpCode() != null
                                        ? activeHost.getEmpCode().toLowerCase().trim()
                                        : "";
                                String hName = activeHost.getEmployeeName() != null
                                        ? activeHost.getEmployeeName().toLowerCase().trim()
                                        : "";
                                isHost = (!uid.isEmpty() && hCode.equals(uid))
                                        || (!uname.isEmpty() && hName.equals(uname));
                            }
                        }

                        if (schedule.getParticipants() != null) {
                            for (QmsMeetingParticipantMapping p : schedule.getParticipants()) {
                                if (p == null)
                                    continue;
                                Long pPrimaryId = p.getEmployee() != null ? p.getEmployee().getId() : null;
                                Long pSecondaryId = p.getSecondaryEmployee() != null ? p.getSecondaryEmployee().getId()
                                        : null;
                                Long pTertiaryId = p.getTertiaryEmployee() != null ? p.getTertiaryEmployee().getId()
                                        : null;

                                EmployeeMaster activeP = null;
                                if (pPrimaryId != null && !employeesOnLeave.contains(pPrimaryId))
                                    activeP = p.getEmployee();
                                else if (pSecondaryId != null && !employeesOnLeave.contains(pSecondaryId))
                                    activeP = p.getSecondaryEmployee();
                                else if (pTertiaryId != null && !employeesOnLeave.contains(pTertiaryId))
                                    activeP = p.getTertiaryEmployee();
                                else
                                    activeP = p.getEmployee();

                                if (activeP != null) {
                                    String pCode = activeP.getEmpCode() != null
                                            ? activeP.getEmpCode().toLowerCase().trim()
                                            : "";
                                    String pName = activeP.getEmployeeName() != null
                                            ? activeP.getEmployeeName().toLowerCase().trim()
                                            : "";
                                    if ((!uid.isEmpty() && pCode.equals(uid))
                                            || (!uname.isEmpty() && pName.equals(uname))) {
                                        isParticipant = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }

                if (!isHost && !isParticipant) {
                    continue;
                }
            } else {
                continue;
            }

            // Daily Acknowledgement check
            boolean acknowledgedToday = false;
            if (reminderAckLogRepository != null) {
                acknowledgedToday = reminderAckLogRepository
                        .isAcknowledgedToday(schedule.getId(), empId, currentUserId, today);
            }

            if (acknowledgedToday) {
                continue;
            }

            String hostName = null;
            if (activeHostId != null) {
                if (schedule.getHostBy() != null && Objects.equals(schedule.getHostBy().getId(), activeHostId)) {
                    hostName = schedule.getHostBy().getEmployeeName();
                } else if (schedule.getSecondaryHost() != null
                        && Objects.equals(schedule.getSecondaryHost().getId(), activeHostId)) {
                    hostName = schedule.getSecondaryHost().getEmployeeName() + " (Secondary Host)";
                } else if (schedule.getTertiaryHost() != null
                        && Objects.equals(schedule.getTertiaryHost().getId(), activeHostId)) {
                    hostName = schedule.getTertiaryHost().getEmployeeName() + " (Tertiary Host)";
                }
            }
            if (hostName == null && schedule.getHostBy() != null) {
                hostName = schedule.getHostBy().getEmployeeName();
            }

            String userRole = "PARTICIPANT";
            if (isChaired) {
                userRole = "CHAIRED";
            } else if (isHost) {
                userRole = "HOST";
            }

            result.add(PendingMeetingReminderDto.builder()
                    .scheduleId(schedule.getId())
                    .scheduleNo(schedule.getScheduleNo())
                    .meetingTypeId(meetingMaster.getId())
                    .meetingName(meetingMaster.getMeetingName())
                    .meetingPrefix(meetingMaster.getMeetingPrefix())
                    .meetingDescription(meetingMaster.getMeetingDescription())
                    .subject(schedule.getSubject())
                    .meetingAgenda(meetingMaster.getMeetingAgenda())
                    .meetingDate(schedule.getMeetingDate())
                    .startTime(schedule.getStartTime())
                    .endTime(schedule.getEndTime())
                    .reminderDays(reminderDays)
                    .hostName(hostName)
                    .userRole(userRole)
                    .build());
        }

        result.sort((a, b) -> {
            if (a.getMeetingDate() == null && b.getMeetingDate() == null)
                return 0;
            if (a.getMeetingDate() == null)
                return 1;
            if (b.getMeetingDate() == null)
                return -1;
            int dateCmp = a.getMeetingDate().compareTo(b.getMeetingDate());
            if (dateCmp != 0)
                return dateCmp;
            if (a.getStartTime() != null && b.getStartTime() != null) {
                return a.getStartTime().compareTo(b.getStartTime());
            }
            return 0;
        });

        return result;
    }

    @Transactional
    public boolean acknowledgeReminder(Long scheduleId, Long empId) {
        return acknowledgeReminder(scheduleId, empId, com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
    }

    @Transactional
    public boolean acknowledgeReminder(Long scheduleId, Long empId, String userId) {
        if (scheduleId == null) {
            return false;
        }
        if (empId != null && empId <= 0) {
            empId = null;
        }

        LocalDate today = LocalDate.now();
        if (reminderAckLogRepository != null
                && !reminderAckLogRepository.isAcknowledgedToday(scheduleId, empId, userId, today)) {
            QmsScheduleReminderAckLog ackLog = new QmsScheduleReminderAckLog();
            ackLog.setScheduleId(scheduleId);
            ackLog.setEmployeeId(empId);
            ackLog.setUserId(userId);
            ackLog.setReminderDate(today);
            ackLog.setAcknowledgedAt(java.time.LocalDateTime.now());
            if (statusRepo != null) {
                StatusMaster ackStatus = statusRepo.findByNameIgnoreCase("ACKNOWLEDGED")
                        .orElseGet(() -> {
                            StatusMaster s = new StatusMaster();
                            s.setName("ACKNOWLEDGED");
                            return statusRepo.save(s);
                        });
                ackLog.setStatusObj(ackStatus);
            }
            reminderAckLogRepository.save(ackLog);
        }
        return true;
    }

    public List<PendingMeetingReminderDto> getTodayUpcomingAlarmsForEmployee(Long empId) {
        LocalDate today = LocalDate.now();
        List<Long> employeesOnLeave = java.util.Collections.emptyList();
        if (leaveEntryRepository != null) {
            try {
                employeesOnLeave = leaveEntryRepository.findEmployeeIdsOnLeaveOnDate(java.sql.Date.valueOf(today));
                if (employeesOnLeave == null) {
                    employeesOnLeave = java.util.Collections.emptyList();
                }
            } catch (Exception ex) {
                log.warn("[QmsMeetingScheduleService] Failed to fetch leave entries for {}: {}", today,
                        ex.getMessage());
            }
        }

        List<QmsMeetingSchedule> activeSchedules = repository.findByMeetingDate(today).stream()
                .filter(s -> s != null && (s.getIsActive() == null || Boolean.TRUE.equals(s.getIsActive())))
                .collect(Collectors.toList());

        List<PendingMeetingReminderDto> result = new ArrayList<>();

        if (empId == null) {
            empId = SecurityUtils.getCurrentUserEmpId();
            if (empId == null) {
                String uid = SecurityUtils.getCurrentUserId();
                if (uid != null && !uid.trim().isEmpty() && employeeMasterRepository != null) {
                    try {
                        Optional<EmployeeMaster> empOpt = employeeMasterRepository.findByEmpCodeIgnoreCase(uid.trim());
                        if (empOpt.isPresent()) {
                            empId = empOpt.get().getId();
                        } else {
                            empOpt = employeeMasterRepository.findByEmpCodeOrName(uid.trim());
                            if (empOpt.isPresent()) {
                                empId = empOpt.get().getId();
                            }
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        String currentUserId = SecurityUtils.getCurrentUserId();
        String currentEmpName = SecurityUtils.getCurrentUserEmployeeName();

        Long empDeptId = null;
        if (empId != null && employeeMasterRepository != null) {
            try {
                Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(empId);
                if (empOpt.isPresent()) {
                    if (currentEmpName == null || currentEmpName.isEmpty()) {
                        currentEmpName = empOpt.get().getEmployeeName();
                    }
                    if (empOpt.get().getDepartment() != null) {
                        empDeptId = empOpt.get().getDepartment().getId();
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch employee department for empId {}: {}", empId, e.getMessage());
            }
        }

        final String uid = currentUserId != null ? currentUserId.trim().toLowerCase() : "";
        final String uname = currentEmpName != null ? currentEmpName.trim().toLowerCase() : "";

        for (QmsMeetingSchedule schedule : activeSchedules) {
            if (schedule == null || schedule.getStartTime() == null) {
                continue;
            }

            String status = schedule.getStatus() != null ? schedule.getStatus().toUpperCase() : "";
            String meetingStatus = schedule.getMeetingStatus() != null ? schedule.getMeetingStatus().toUpperCase() : "";
            if ("CANCELLED".equals(status) || "COMPLETED".equals(meetingStatus) || "CLOSED".equals(status)
                    || "CANCELLED".equals(meetingStatus) || "CLOSED".equals(meetingStatus)) {
                continue;
            }

            // Check if attendance is already recorded for this user
            if (empId != null && meetingUserAttendanceRepository != null) {
                List<QmsMeetingUserAttendance> attList = meetingUserAttendanceRepository
                        .findByScheduleIdAndEmployeeId(schedule.getId(), empId);
                if (attList != null && !attList.isEmpty()) {
                    boolean alreadyPresent = attList.stream().anyMatch(a -> a != null && a.getInTime() != null);
                    if (alreadyPresent) {
                        continue;
                    }
                }
            }

            // Chaired Person check - Chaired person should NEVER receive meeting alarms
            if (schedule.getChairedBy() != null) {
                Long chairedId = schedule.getChairedBy().getId();
                if (empId != null && Objects.equals(chairedId, empId)) {
                    continue;
                }
                if (!uid.isEmpty() || !uname.isEmpty()) {
                    String cCode = schedule.getChairedBy().getEmpCode() != null
                            ? schedule.getChairedBy().getEmpCode().toLowerCase().trim()
                            : "";
                    String cName = schedule.getChairedBy().getEmployeeName() != null
                            ? schedule.getChairedBy().getEmployeeName().toLowerCase().trim()
                            : "";
                    if ((!uid.isEmpty() && (cCode.equals(uid) || cName.equals(uid)))
                            || (!uname.isEmpty() && (cCode.equals(uname) || cName.equals(uname)))) {
                        continue;
                    }
                }
            }

            boolean isHost = false;
            boolean isParticipant = false;

            Long primaryHostId = schedule.getHostBy() != null ? schedule.getHostBy().getId() : null;
            Long secondaryHostId = schedule.getSecondaryHost() != null ? schedule.getSecondaryHost().getId() : null;
            Long tertiaryHostId = schedule.getTertiaryHost() != null ? schedule.getTertiaryHost().getId() : null;

            Long activeHostId = null;
            if (primaryHostId != null && !employeesOnLeave.contains(primaryHostId)) {
                activeHostId = primaryHostId;
            } else if (secondaryHostId != null && !employeesOnLeave.contains(secondaryHostId)) {
                activeHostId = secondaryHostId;
            } else if (tertiaryHostId != null && !employeesOnLeave.contains(tertiaryHostId)) {
                activeHostId = tertiaryHostId;
            } else {
                activeHostId = primaryHostId;
            }

            // Host check
            if (empId != null) {
                isHost = (activeHostId != null && Objects.equals(activeHostId, empId))
                        || (primaryHostId != null && Objects.equals(primaryHostId, empId))
                        || (secondaryHostId != null && Objects.equals(secondaryHostId, empId))
                        || (tertiaryHostId != null && Objects.equals(tertiaryHostId, empId));
            }

            // Participant check across all mapped participants (Primary, Secondary,
            // Tertiary)
            if (schedule.getParticipants() != null) {
                for (QmsMeetingParticipantMapping p : schedule.getParticipants()) {
                    if (p == null)
                        continue;
                    Long pPrimaryId = p.getEmployee() != null ? p.getEmployee().getId() : null;
                    Long pSecondaryId = p.getSecondaryEmployee() != null ? p.getSecondaryEmployee().getId() : null;
                    Long pTertiaryId = p.getTertiaryEmployee() != null ? p.getTertiaryEmployee().getId() : null;

                    if (empId != null) {
                        if (Objects.equals(pPrimaryId, empId) || Objects.equals(pSecondaryId, empId)
                                || Objects.equals(pTertiaryId, empId)) {
                            isParticipant = true;
                            break;
                        }
                    }

                    // Fallback to empCode or employeeName
                    if (!uid.isEmpty() || !uname.isEmpty()) {
                        if (p.getEmployee() != null) {
                            String c = p.getEmployee().getEmpCode() != null
                                    ? p.getEmployee().getEmpCode().toLowerCase().trim()
                                    : "";
                            String n = p.getEmployee().getEmployeeName() != null
                                    ? p.getEmployee().getEmployeeName().toLowerCase().trim()
                                    : "";
                            if ((!uid.isEmpty() && (c.equals(uid) || n.equals(uid)))
                                    || (!uname.isEmpty() && (c.equals(uname) || n.equals(uname)))) {
                                isParticipant = true;
                                break;
                            }
                        }
                        if (p.getSecondaryEmployee() != null) {
                            String c = p.getSecondaryEmployee().getEmpCode() != null
                                    ? p.getSecondaryEmployee().getEmpCode().toLowerCase().trim()
                                    : "";
                            String n = p.getSecondaryEmployee().getEmployeeName() != null
                                    ? p.getSecondaryEmployee().getEmployeeName().toLowerCase().trim()
                                    : "";
                            if ((!uid.isEmpty() && (c.equals(uid) || n.equals(uid)))
                                    || (!uname.isEmpty() && (c.equals(uname) || n.equals(uname)))) {
                                isParticipant = true;
                                break;
                            }
                        }
                        if (p.getTertiaryEmployee() != null) {
                            String c = p.getTertiaryEmployee().getEmpCode() != null
                                    ? p.getTertiaryEmployee().getEmpCode().toLowerCase().trim()
                                    : "";
                            String n = p.getTertiaryEmployee().getEmployeeName() != null
                                    ? p.getTertiaryEmployee().getEmployeeName().toLowerCase().trim()
                                    : "";
                            if ((!uid.isEmpty() && (c.equals(uid) || n.equals(uid)))
                                    || (!uname.isEmpty() && (c.equals(uname) || n.equals(uname)))) {
                                isParticipant = true;
                                break;
                            }
                        }
                    }
                }
            }

            // Department Mapping Check
            if (!isHost && !isParticipant && empDeptId != null && schedule.getDepartments() != null) {
                for (QmsMeetingDepartmentMapping d : schedule.getDepartments()) {
                    if (d != null && d.getDepartment() != null
                            && Objects.equals(d.getDepartment().getId(), empDeptId)) {
                        isParticipant = true;
                        break;
                    }
                }
            }

            // Meeting Master Employee Mapping Check
            if (!isHost && !isParticipant && schedule.getMeetingType() != null) {
                QmsMeetingMaster master = schedule.getMeetingType();
                if (master.getEmployeeMappings() != null && empId != null) {
                    for (QmsMeetingEmployeeMapping em : master.getEmployeeMappings()) {
                        if (em != null && em.getEmployee() != null && Objects.equals(em.getEmployee().getId(), empId)) {
                            isParticipant = true;
                            break;
                        }
                    }
                }
                if (!isParticipant && master.getEmployeeId() != null && empId != null) {
                    String[] idArr = master.getEmployeeId().split(",");
                    for (String partId : idArr) {
                        if (partId != null && partId.trim().equals(String.valueOf(empId))) {
                            isParticipant = true;
                            break;
                        }
                    }
                }
            }

            if (!isHost && !isParticipant) {
                continue;
            }

            String userRole = isHost ? "HOST" : "PARTICIPANT";
            String hostName = "Organizer";
            if (activeHostId != null) {
                if (schedule.getHostBy() != null && Objects.equals(schedule.getHostBy().getId(), activeHostId)) {
                    hostName = schedule.getHostBy().getEmployeeName();
                } else if (schedule.getSecondaryHost() != null
                        && Objects.equals(schedule.getSecondaryHost().getId(), activeHostId)) {
                    hostName = schedule.getSecondaryHost().getEmployeeName();
                } else if (schedule.getTertiaryHost() != null
                        && Objects.equals(schedule.getTertiaryHost().getId(), activeHostId)) {
                    hostName = schedule.getTertiaryHost().getEmployeeName();
                }
            } else if (schedule.getHostBy() != null) {
                hostName = schedule.getHostBy().getEmployeeName();
            }

            QmsMeetingMaster meetingMaster = schedule.getMeetingType();
            result.add(PendingMeetingReminderDto.builder()
                    .scheduleId(schedule.getId())
                    .scheduleNo(schedule.getScheduleNo())
                    .meetingTypeId(
                            meetingMaster != null && meetingMaster.getId() != null ? meetingMaster.getId().intValue()
                                    : null)
                    .meetingName(meetingMaster != null ? meetingMaster.getMeetingName() : "Scheduled Meeting")
                    .meetingPrefix(meetingMaster != null ? meetingMaster.getMeetingPrefix() : "MTG")
                    .meetingDescription(schedule.getComments() != null ? schedule.getComments()
                            : (meetingMaster != null ? meetingMaster.getMeetingDescription() : ""))
                    .subject(schedule.getSubject())
                    .meetingAgenda(meetingMaster != null ? meetingMaster.getMeetingAgenda() : "")
                    .meetingDate(schedule.getMeetingDate())
                    .startTime(schedule.getStartTime())
                    .endTime(schedule.getEndTime())
                    .reminderDays(1)
                    .hostName(hostName)
                    .userRole(userRole)
                    .build());
        }

        result.sort((a, b) -> {
            if (a.getStartTime() != null && b.getStartTime() != null) {
                return a.getStartTime().compareTo(b.getStartTime());
            }
            return 0;
        });

        return result;
    }
}

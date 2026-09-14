package com.autonoma.erp.modules.qms.audit.service;

import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.qms.audit.entity.AuditAttendance;
import com.autonoma.erp.modules.qms.audit.entity.AuditSchedule;
import com.autonoma.erp.modules.qms.audit.repository.AuditAttendanceRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.List;

import com.autonoma.erp.util.LogHelper;
import java.util.Map;
import java.util.HashMap;

import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.platform.notification.entity.AppNotification;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

@Service
public class AuditAttendanceService {

    @Autowired
    private AuditAttendanceRepository attendanceRepository;

    @Autowired
    private AuditScheduleRepository scheduleRepository;

    @Autowired
    private AppNotificationRepository appNotificationRepository;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    public List<AuditSchedule> getTodayOpenSchedules(String currentUser) {
        Long userEmpId = resolveUserEmpId(currentUser);
        return getOpenSchedulesForAttendance(userEmpId);
    }

    public List<AuditSchedule> getEligibleSchedulesForAttendance(String currentUser) {
        Long userEmpId = resolveUserEmpId(currentUser);
        if (userEmpId == null) {
            return new java.util.ArrayList<>();
        }
        return scheduleRepository.findEligibleSchedulesForAttendance(userEmpId);
    }

    public List<AuditSchedule> getOpenSchedulesForAttendance(Long userId) {
        if (userId == null) {
            return new java.util.ArrayList<>();
        }
        java.time.ZonedDateTime nowLocal = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
        return scheduleRepository.findOpenSchedulesForAttendanceNative(
                userId,
                nowLocal.toLocalDate(),
                nowLocal.toLocalDateTime());
    }

    private Long resolveUserEmpId(String currentUser) {
        Long userEmpId = null;
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
        }
        return userEmpId;
    }

    public AuditAttendance saveAttendance(AuditAttendance attendance) {
        if (attendance.getEmployeeId() == null && attendance.getEmployeeCode() != null
                && !attendance.getEmployeeCode().trim().isEmpty()) {
            employeeMasterRepository.findByEmpCodeOrName(attendance.getEmployeeCode().trim())
                    .ifPresent(emp -> attendance.setEmployeeId(emp.getId()));
        }
        if (attendance.getAuditSchId() == null && attendance.getAuditScheduleNo() != null
                && !attendance.getAuditScheduleNo().trim().isEmpty()) {
            scheduleRepository.findByScheduleNoIgnoreCase(attendance.getAuditScheduleNo().trim())
                    .ifPresent(sch -> attendance.setAuditSchId(sch.getId()));
        }

        if (attendance.getOutTime() != null && !attendance.getOutTime().trim().isEmpty()
                && !"null".equalsIgnoreCase(attendance.getOutTime().trim())
                && !"undefined".equalsIgnoreCase(attendance.getOutTime().trim())) {
            Optional<AuditSchedule> schedOpt = scheduleRepository.findByScheduleNo(attendance.getAuditScheduleNo());
            if (schedOpt.isPresent()) {
                AuditSchedule schedule = schedOpt.get();
                LocalDateTime outDateTime = convertToDateTime(schedule.getAuditDate(), attendance.getOutTime());
                LocalDateTime now = LocalDateTime.now();
                if (outDateTime.isAfter(now)) {
                    throw new RuntimeException("Out Time cannot be a future time.");
                }
                if (attendance.getInTime() != null && !attendance.getInTime().trim().isEmpty()) {
                    LocalDateTime inDateTime = convertToDateTime(schedule.getAuditDate(), attendance.getInTime());
                    if (outDateTime.isBefore(inDateTime)) {
                        throw new RuntimeException("Out Time cannot be earlier than In Time.");
                    }
                }
            }
        }

        Optional<AuditSchedule> scheduleOpt = scheduleRepository.findByScheduleNoIgnoreCase(
                attendance.getAuditScheduleNo() != null ? attendance.getAuditScheduleNo().trim() : "");
        if (scheduleOpt.isPresent()) {
            AuditSchedule schedule = scheduleOpt.get();

            // Prevent marking or modifying attendance for closed, auto closed, or cancelled schedules
            if ("CLOSED".equalsIgnoreCase(schedule.getStatus()) || "CANCEL".equalsIgnoreCase(schedule.getStatus())
                    || "CANCELLED".equalsIgnoreCase(schedule.getStatus())
                    || "AUTO CLOSED".equalsIgnoreCase(schedule.getStatus())) {
                throw new RuntimeException(
                        "Cannot mark or modify attendance for a closed or cancelled Audit Schedule.");
            }

            // Allow Auditee, Auditor, Admin, and authenticated users to record attendance
            String currentUserId = SecurityUtils.getCurrentUserId();
            boolean isAuthorized = currentUserId != null;
            if (!isAuthorized) {
                throw new RuntimeException("Unauthorized: User must be logged in to record attendance.");
            }

            // Check timing for new attendance marking
            if (attendance.getId() == null) {
                LocalDateTime startDateTime = convertToDateTime(schedule.getAuditDate(), schedule.getStartTime());
                LocalDateTime now = LocalDateTime.now();
                if (startDateTime != null && now.isBefore(startDateTime.minusMinutes(10))) {
                    throw new RuntimeException(
                            "Cannot mark attendance yet. Attendance is only allowed starting 10 minutes before the scheduled time ("
                                    + schedule.getStartTime() + ").");
                }

                if (startDateTime != null) {
                    LocalDateTime inDateTime = convertToDateTime(schedule.getAuditDate(), attendance.getInTime());
                    if (inDateTime == null) inDateTime = now;

                    if (!"ABSENT".equalsIgnoreCase(attendance.getAttendanceStatus())
                            && !"EXCUSED".equalsIgnoreCase(attendance.getAttendanceStatus())) {
                        if (inDateTime.isAfter(startDateTime.plusMinutes(10))) {
                            attendance.setAttendanceStatus("LATE");
                        } else {
                            attendance.setAttendanceStatus("PRESENT");
                        }
                    }
                }
            }
        }

        // Duplicate Check: Prevent multiple records for same employee in same audit
        Optional<AuditAttendance> existing = Optional.empty();
        if (attendance.getAuditSchId() != null && attendance.getEmployeeId() != null) {
            existing = attendanceRepository.findByAuditSchIdAndEmployeeId(
                    attendance.getAuditSchId(),
                    attendance.getEmployeeId());
        }
        if (!existing.isPresent() && attendance.getAuditScheduleNo() != null && attendance.getEmployeeCode() != null) {
            existing = attendanceRepository.findByAuditScheduleNoAndEmployeeCode(
                    attendance.getAuditScheduleNo(),
                    attendance.getEmployeeCode());
        }

        if (existing.isPresent()
                && (attendance.getId() == null || !existing.get().getId().equals(attendance.getId()))) {
            throw new RuntimeException("Duplicate Entry! Attendance for " + attendance.getName() +
                    " (" + attendance.getEmployeeCode() + ") has already been marked for schedule " +
                    attendance.getAuditScheduleNo() + ".");
        }

        if (attendance.getCreatedBy() == null)
            attendance.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("name", attendance.getName());
        metadata.put("scheduleNo", attendance.getAuditScheduleNo());
        LogHelper.info(org.slf4j.LoggerFactory.getLogger(AuditAttendanceService.class), "AuditAttendanceService",
                "saveAttendance", "Attempting save for employee", metadata);

        try {
            AuditAttendance saved = attendanceRepository.save(attendance);
            try {
                Optional<EmployeeMaster> empOpt = employeeMasterRepository
                        .findByEmpCodeOrName(attendance.getEmployeeCode());
                if (empOpt.isPresent()) {
                    Long empId = empOpt.get().getId();
                    List<AppNotification> notifications = appNotificationRepository
                            .findByRecipientEmpIdAndIsReadFalseOrderByCreatedAtDesc(empId);
                    for (AppNotification notif : notifications) {
                        String title = notif.getTitle();
                        String message = notif.getMessage();
                        String schNo = attendance.getAuditScheduleNo();
                        if (schNo != null && ((title != null && title.toLowerCase().contains(schNo.toLowerCase())) ||
                                (message != null && message.toLowerCase().contains(schNo.toLowerCase())))) {
                            notif.setIsRead(true);
                            appNotificationRepository.save(notif);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to auto-read notifications on attendance save: " + e.getMessage());
            }
            return saved;
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            Map<String, Object> errMeta = new HashMap<>();
            errMeta.put("error", e.getMessage());
            LogHelper.error(org.slf4j.LoggerFactory.getLogger(AuditAttendanceService.class), "AuditAttendanceService",
                    "saveAttendance", "Duplicate entry detected via DB constraint", errMeta);
            throw new RuntimeException("Duplicate Entry! This person is already marked for this audit schedule.");
        } catch (Exception e) {
            Map<String, Object> errMeta = new HashMap<>();
            errMeta.put("error", e.getMessage());
            LogHelper.error(org.slf4j.LoggerFactory.getLogger(AuditAttendanceService.class), "AuditAttendanceService",
                    "saveAttendance", "Database error during save", errMeta);
            throw e;
        }
    }

    private LocalDateTime convertToDateTime(java.util.Date date, String timeStr) {
        if (date == null || timeStr == null || timeStr.isEmpty()) {
            return LocalDateTime.now().plusDays(1);
        }

        try {
            // Support both 24h (HH:mm) and 12h (hh:mm a) formats
            java.time.format.DateTimeFormatter formatter;
            if (timeStr.contains("AM") || timeStr.contains("PM")) {
                formatter = java.time.format.DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.ENGLISH);
            } else {
                formatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
            }

            LocalTime time = LocalTime.parse(timeStr.toUpperCase(), formatter);
            java.util.Calendar cal = java.util.Calendar.getInstance();
            cal.setTime(date);
            return LocalDateTime.of(
                    cal.get(java.util.Calendar.YEAR),
                    cal.get(java.util.Calendar.MONTH) + 1,
                    cal.get(java.util.Calendar.DAY_OF_MONTH),
                    time.getHour(),
                    time.getMinute(),
                    0,
                    0);
        } catch (Exception e) {
            Map<String, Object> errMeta = new HashMap<>();
            errMeta.put("timeStr", timeStr);
            errMeta.put("error", e.getMessage());
            LogHelper.warn(org.slf4j.LoggerFactory.getLogger(AuditAttendanceService.class), "AuditAttendanceService",
                    "convertToDateTime", "Failed to parse time string, defaulting to next day", errMeta);
            return LocalDateTime.now().plusDays(1);
        }
    }

    private java.util.Set<EmployeeMaster> getAuditParticipants(AuditSchedule s) {
        java.util.Set<EmployeeMaster> participants = new java.util.LinkedHashSet<>();

        if (s.getAuditorEntity() != null) {
            participants.add(s.getAuditorEntity());
        } else if (s.getAuditorId() != null) {
            employeeMasterRepository.findById(s.getAuditorId()).ifPresent(participants::add);
        }

        if (s.getAuditeeEntity() != null) {
            participants.add(s.getAuditeeEntity());
        } else if (s.getAuditeeId() != null) {
            employeeMasterRepository.findById(s.getAuditeeId()).ifPresent(participants::add);
        }

        parseAndAddEmployees(participants, s.getAuditor());
        parseAndAddEmployees(participants, s.getAuditee());

        return participants;
    }

    private void parseAndAddEmployees(java.util.Set<EmployeeMaster> set, String field) {
        if (field == null || field.trim().isEmpty()) {
            return;
        }
        java.util.Arrays.stream(field.split(","))
                .map(String::trim)
                .filter(n -> !n.isEmpty())
                .forEach(n -> {
                    String code = null;
                    if (n.contains(" - ")) {
                        code = n.split(" - ")[1].trim();
                    } else if (n.startsWith("EMP-")) {
                        code = n.trim();
                    }
                    if (code != null) {
                        employeeMasterRepository.findByEmpCodeOrName(code)
                                .ifPresent(set::add);
                    } else {
                        employeeMasterRepository.findByEmpCodeOrName(n)
                                .ifPresent(set::add);
                    }
                });
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<AuditAttendance> getAttendanceList(
            String effectiveScope,
            Long userEmpId,
            List<Long> reporteeEmpIds,
            Long memberId,
            java.util.Date fromDate,
            java.util.Date toDate,
            String considerDate) {

        java.util.Set<Long> allowedEmpIds = null;
        if (memberId != null) {
            allowedEmpIds = new java.util.HashSet<>();
            allowedEmpIds.add(memberId);
        } else if (!"Company".equalsIgnoreCase(effectiveScope)) {
            allowedEmpIds = new java.util.HashSet<>();
            if (userEmpId != null) {
                allowedEmpIds.add(userEmpId);
            }
            if ("Team".equalsIgnoreCase(effectiveScope) && reporteeEmpIds != null) {
                allowedEmpIds.addAll(reporteeEmpIds);
            }
        }

        // 1. Load existing attendance records
        List<AuditAttendance> existingAttendance = attendanceRepository.findAll();

        java.util.Map<String, AuditAttendance> existingMap = new java.util.HashMap<>();
        java.util.Set<Long> processedExistingIds = new java.util.HashSet<>();

        for (AuditAttendance att : existingAttendance) {
            Long empId = att.getEmployeeId();
            if (empId == null && att.getEmployee() != null) {
                empId = att.getEmployee().getId();
            }

            Long schId = att.getAuditSchId();
            if (schId == null && att.getAuditSchedule() != null) {
                schId = att.getAuditSchedule().getId();
            }

            String schNo = att.getAuditScheduleNo();
            if (schNo == null && att.getAuditSchedule() != null) {
                schNo = att.getAuditSchedule().getScheduleNo();
            }

            if (schId != null && empId != null) {
                existingMap.put(schId + "_" + empId, att);
            }
            if (schNo != null && empId != null) {
                existingMap.put(schNo.trim().toUpperCase() + "_" + empId, att);
            }
        }

        // 2. Load active schedules
        List<AuditSchedule> schedules = scheduleRepository.findAll().stream()
                .filter(s -> s.getIsActive() == null || s.getIsActive())
                .toList();

        if ("Yes".equalsIgnoreCase(considerDate) && fromDate != null && toDate != null) {
            schedules = schedules.stream()
                    .filter(s -> isDateWithinRange(s.getAuditDate(), fromDate, toDate))
                    .toList();
        }

        List<AuditAttendance> result = new java.util.ArrayList<>();
        long virtualIdCounter = -1L;

        for (AuditSchedule schedule : schedules) {
            java.util.Set<EmployeeMaster> participants = getAuditParticipants(schedule);

            for (EmployeeMaster employee : participants) {
                if (allowedEmpIds != null && !allowedEmpIds.contains(employee.getId())) {
                    continue;
                }

                AuditAttendance existingAtt = existingMap.get(schedule.getId() + "_" + employee.getId());
                if (existingAtt == null && schedule.getScheduleNo() != null) {
                    existingAtt = existingMap
                            .get(schedule.getScheduleNo().trim().toUpperCase() + "_" + employee.getId());
                }

                if (existingAtt != null) {
                    if (existingAtt.getId() != null && !processedExistingIds.contains(existingAtt.getId())) {
                        processedExistingIds.add(existingAtt.getId());
                        result.add(existingAtt);
                    }
                } else {
                    AuditAttendance virtual = new AuditAttendance();
                    virtual.setId(virtualIdCounter--);
                    virtual.setAuditSchedule(schedule);
                    virtual.setAuditSchId(schedule.getId());
                    virtual.setEmployee(employee);
                    virtual.setEmployeeId(employee.getId());
                    virtual.setAttendanceStatus("PENDING");
                    virtual.setIsActive(true);
                    result.add(virtual);
                }
            }
        }

        // 3. Add any existing attendance records that weren't matched in schedule loops
        for (AuditAttendance att : existingAttendance) {
            if (att.getId() != null && att.getId() > 0 && !processedExistingIds.contains(att.getId())) {
                Long empId = att.getEmployeeId();
                if (empId == null && att.getEmployee() != null)
                    empId = att.getEmployee().getId();

                if (allowedEmpIds != null && (empId == null || !allowedEmpIds.contains(empId))) {
                    continue;
                }

                java.util.Date auditDate = att.getAuditSchedule() != null ? att.getAuditSchedule().getAuditDate()
                        : att.getCreatedDate();
                if ("Yes".equalsIgnoreCase(considerDate) && fromDate != null && toDate != null) {
                    if (auditDate != null && !isDateWithinRange(auditDate, fromDate, toDate)) {
                        continue;
                    }
                }

                processedExistingIds.add(att.getId());
                result.add(att);
            }
        }

        result.sort((a, b) -> {
            java.util.Date dateA = a.getAuditSchedule() != null ? a.getAuditSchedule().getAuditDate() : null;
            java.util.Date dateB = b.getAuditSchedule() != null ? b.getAuditSchedule().getAuditDate() : null;
            if (dateA != null && dateB != null) {
                int comp = dateB.compareTo(dateA);
                if (comp != 0)
                    return comp;
            }
            return Long.compare(b.getId(), a.getId());
        });

        return result;
    }

    private boolean isDateWithinRange(java.util.Date targetDate, java.util.Date fromDate, java.util.Date toDate) {
        if (targetDate == null)
            return false;
        java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
        cal.setTime(targetDate);
        cal.set(java.util.Calendar.HOUR_OF_DAY, 12);
        cal.set(java.util.Calendar.MINUTE, 0);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        java.util.Date norm = cal.getTime();

        if (fromDate != null && norm.before(fromDate))
            return false;
        if (toDate != null && norm.after(toDate))
            return false;
        return true;
    }
}

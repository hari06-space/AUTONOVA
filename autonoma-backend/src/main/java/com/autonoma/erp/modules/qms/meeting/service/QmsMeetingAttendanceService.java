package com.autonoma.erp.modules.qms.meeting.service;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingUserAttendance;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingUserAttendanceRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class QmsMeetingAttendanceService {
    private final QmsMeetingUserAttendanceRepository attendanceRepo;
    private final QmsMeetingScheduleRepository scheduleRepo;
    private final EmployeeMasterRepository employeeRepo;
    private final com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusRepo;
    private final AppNotificationRepository notificationRepo;

    @org.springframework.beans.factory.annotation.Autowired
    public QmsMeetingAttendanceService(
            QmsMeetingUserAttendanceRepository attendanceRepo,
            QmsMeetingScheduleRepository scheduleRepo,
            EmployeeMasterRepository employeeRepo,
            com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusRepo,
            AppNotificationRepository notificationRepo) {
        this.attendanceRepo = attendanceRepo;
        this.scheduleRepo = scheduleRepo;
        this.employeeRepo = employeeRepo;
        this.statusRepo = statusRepo;
        this.notificationRepo = notificationRepo;
    }

    public List<QmsMeetingUserAttendance> getAll() {
        return attendanceRepo.findAll();
    }

    /**
     * Returns attendance records filtered by the schedule's meeting date.
     * When fromDate / toDate are both null, falls back to returning all records.
     */
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_UNCOMMITTED)
    public List<QmsMeetingUserAttendance> getByDateRange(LocalDate fromDate, LocalDate toDate, java.util.Set<Long> allowedEmpIds) {
        if (allowedEmpIds != null && allowedEmpIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        
        List<QmsMeetingSchedule> schedules;
        if (fromDate != null && toDate != null) {
            if (allowedEmpIds != null) {
                schedules = scheduleRepo.findActiveSchedulesForEmpIdsInRange(fromDate, toDate, allowedEmpIds);
            } else {
                schedules = scheduleRepo.findActiveSchedulesWithParticipantsInRange(fromDate, toDate);
            }
        } else {
            if (allowedEmpIds != null) {
                schedules = scheduleRepo.findAllActiveSchedulesForEmpIds(allowedEmpIds);
            } else {
                schedules = scheduleRepo.findAllActiveSchedulesWithParticipants();
            }
        }

        List<QmsMeetingUserAttendance> existingAttendance;
        if (fromDate != null && toDate != null) {
            if (allowedEmpIds != null) {
                existingAttendance = attendanceRepo.findByDateRangeAndEmpIds(fromDate, toDate, allowedEmpIds);
            } else {
                existingAttendance = attendanceRepo.findBySchedule_MeetingDateBetweenOrderByIdDesc(fromDate, toDate);
            }
        } else {
            if (allowedEmpIds != null) {
                existingAttendance = attendanceRepo.findAllByEmpIds(allowedEmpIds);
            } else {
                existingAttendance = attendanceRepo.findAllWithFetch();
            }
        }

        java.util.Map<Long, java.util.Map<Long, QmsMeetingUserAttendance>> existingMap = new java.util.HashMap<>();
        for (QmsMeetingUserAttendance att : existingAttendance) {
            if (att.getSchedule() != null && att.getEmployee() != null) {
                existingMap.computeIfAbsent(att.getSchedule().getId(), k -> new java.util.HashMap<>())
                        .put(att.getEmployee().getId(), att);
            }
        }

        List<QmsMeetingUserAttendance> result = new java.util.ArrayList<>();
        long virtualIdCounter = -1L;

        for (QmsMeetingSchedule schedule : schedules) {
            java.util.Set<EmployeeMaster> attendees = new java.util.LinkedHashSet<>();
            if (schedule.getChairedBy() != null) {
                attendees.add(schedule.getChairedBy());
            }
            if (schedule.getHostBy() != null) {
                attendees.add(schedule.getHostBy());
            }
            if (schedule.getParticipants() != null) {
                for (com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping mapping : schedule.getParticipants()) {
                    if (mapping.getEmployee() != null) {
                        attendees.add(mapping.getEmployee());
                    }
                }
            }

            java.util.Map<Long, QmsMeetingUserAttendance> scheduleMap = existingMap.getOrDefault(schedule.getId(), java.util.Collections.emptyMap());
            for (EmployeeMaster employee : attendees) {
                if (allowedEmpIds != null && !allowedEmpIds.contains(employee.getId())) {
                    continue;
                }
                if (scheduleMap.containsKey(employee.getId())) {
                    result.add(scheduleMap.get(employee.getId()));
                } else {
                    QmsMeetingUserAttendance virtual = new QmsMeetingUserAttendance();
                    virtual.setId(virtualIdCounter--);
                    virtual.setSchedule(schedule);
                    virtual.setEmployee(employee);
                    virtual.setStatus("PENDING");
                    virtual.setIsActive(true);
                    result.add(virtual);
                }
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<QmsMeetingUserAttendance> getByScheduleId(Long scheduleId) {
        Optional<QmsMeetingSchedule> scheduleOpt = scheduleRepo.findById(scheduleId);
        if (!scheduleOpt.isPresent()) {
            return java.util.Collections.emptyList();
        }
        QmsMeetingSchedule schedule = scheduleOpt.get();
        List<QmsMeetingUserAttendance> existingAttendance = attendanceRepo.findByScheduleId(scheduleId);

        java.util.Map<Long, QmsMeetingUserAttendance> existingMap = new java.util.HashMap<>();
        for (QmsMeetingUserAttendance att : existingAttendance) {
            if (att.getEmployee() != null) {
                existingMap.put(att.getEmployee().getId(), att);
            }
        }

        List<QmsMeetingUserAttendance> result = new java.util.ArrayList<>();
        long virtualIdCounter = -1L;

        java.util.Set<EmployeeMaster> attendees = new java.util.LinkedHashSet<>();
        if (schedule.getChairedBy() != null) {
            attendees.add(schedule.getChairedBy());
        }
        if (schedule.getHostBy() != null) {
            attendees.add(schedule.getHostBy());
        }
        if (schedule.getParticipants() != null) {
            for (com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping mapping : schedule.getParticipants()) {
                if (mapping.getEmployee() != null) {
                    attendees.add(mapping.getEmployee());
                }
            }
        }

        for (EmployeeMaster employee : attendees) {
            if (existingMap.containsKey(employee.getId())) {
                result.add(existingMap.get(employee.getId()));
            } else {
                QmsMeetingUserAttendance virtual = new QmsMeetingUserAttendance();
                virtual.setId(virtualIdCounter--);
                virtual.setSchedule(schedule);
                virtual.setEmployee(employee);
                virtual.setStatus("PENDING");
                virtual.setIsActive(true);
                result.add(virtual);
            }
        }

        return result;
    }

    @Transactional
    public QmsMeetingUserAttendance markAttendance(Map<String, Object> data) {
        Long scheduleId = Long.parseLong(data.get("scheduleId").toString());
        String inTimeStr = data.get("inTime") != null ? data.get("inTime").toString() : null;
        String status = data.get("status") != null ? data.get("status").toString() : "PRESENT";

        QmsMeetingSchedule schedule = scheduleRepo.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        Long empIdStr = data.get("employeeId") != null ? Long.parseLong(data.get("employeeId").toString()) : null;

        if (empIdStr == null) {
            throw new RuntimeException("Employee ID is required to mark attendance");
        }

        EmployeeMaster employee = employeeRepo.findById(empIdStr)
                .orElseThrow(() -> new RuntimeException("Selected employee not found"));

        // Check if already marked
        java.util.List<QmsMeetingUserAttendance> existing = attendanceRepo
                .findByScheduleIdAndEmployeeId(scheduleId, employee.getId());
        if (!existing.isEmpty()) {
            throw new RuntimeException("Attendance already marked for this schedule");
        }

        QmsMeetingUserAttendance attendance = new QmsMeetingUserAttendance();
        attendance.setSchedule(schedule);
        attendance.setEmployee(employee);

        LocalTime inTime;
        if (inTimeStr != null && !inTimeStr.isEmpty()) {
            inTime = LocalTime.parse(inTimeStr);
        } else {
            inTime = LocalTime.now(java.time.ZoneId.of("Asia/Kolkata")).withNano(0);
        }

        if (!"ABSENT".equals(status) && !"EXCUSED".equals(status)) {
            if (schedule.getStartTime() != null && inTime.isAfter(schedule.getStartTime().plusMinutes(10))) {
                status = "LATE";
            } else {
                status = "PRESENT";
            }
        }

        attendance.setStatus(status);
        attendance.setStatusObj(statusRepo.findByName(status).orElse(null));
        attendance.setInTime(inTime);
        QmsMeetingUserAttendance savedAttendance = attendanceRepo.save(attendance);
        
        try {
            notificationRepo.markAsReadByUrlKeywordAndEmpId("/qms/meeting-attendance", employee.getId());
        } catch (Exception e) {
            // Ignore notification error
        }
        
        return savedAttendance;
    }

    @Transactional
    public QmsMeetingUserAttendance markOutTime(Long attendanceId) {
        QmsMeetingUserAttendance attendance = attendanceRepo.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance record not found"));
        attendance.setOutTime(LocalTime.now(java.time.ZoneId.of("Asia/Kolkata")).withNano(0));
        return attendanceRepo.save(attendance);
    }
}

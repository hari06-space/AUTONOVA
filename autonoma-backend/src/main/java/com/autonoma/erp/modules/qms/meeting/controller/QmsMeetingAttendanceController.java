package com.autonoma.erp.modules.qms.meeting.controller;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingUserAttendance;
import com.autonoma.erp.modules.qms.meeting.service.QmsMeetingAttendanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import com.autonoma.erp.security.RequirePagePermission;

@RestController
@RequestMapping("/api/qms/meeting-attendance")
public class QmsMeetingAttendanceController {
    private final QmsMeetingAttendanceService attendanceService;
    private final com.autonoma.erp.repository.admin.UserRepository userRepository;
    private final com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository;
    private final com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository;
    private final com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public QmsMeetingAttendanceController(
            QmsMeetingAttendanceService attendanceService,
            com.autonoma.erp.repository.admin.UserRepository userRepository,
            com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository,
            com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository,
            com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository) {
        this.attendanceService = attendanceService;
        this.userRepository = userRepository;
        this.bosUserPageAuthRepository = bosUserPageAuthRepository;
        this.bosPageRepository = bosPageRepository;
        this.employeeMasterRepository = employeeMasterRepository;
    }

    /**
     * GET /api/qms/meeting-attendance
     */
    @GetMapping
    public ResponseEntity<List<QmsMeetingUserAttendance>> getAll(
            @RequestParam(value = "taskScope", required = false) String taskScope,
            @RequestParam(value = "currentUser", required = false) String currentUser,
            @RequestParam(value = "memberId", required = false) Long memberId,
            @RequestParam(value = "fromDate", required = false) String fromDate,
            @RequestParam(value = "toDate", required = false) String toDate,
            @RequestParam(value = "considerDate", required = false) String considerDate) {

        Long userEmpId = null;
        String employeeName = null;

        if (currentUser != null && !currentUser.trim().isEmpty()) {
            com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(currentUser)
                    .orElse(null);
            if (credential != null) {
                userEmpId = credential.getEmpId();
            }
            if (userEmpId == null) {
                com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster empFallback = employeeMasterRepository.findByEmpCodeOrName(currentUser).orElse(null);
                if (empFallback != null) {
                    userEmpId = empFallback.getId();
                }
            }
            if (userEmpId != null) {
                com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = employeeMasterRepository.findById(userEmpId).orElse(null);
                if (emp != null) {
                    employeeName = emp.getEmployeeName();
                }
            }
        }

        // Determine effective scope based on page permissions (QM1320)
        String effectiveScope = "Mine";
        if (taskScope != null && !taskScope.trim().isEmpty()) {
            effectiveScope = taskScope;
        }

        String maxAllowedScope = "Mine";
        if ("SUPER BOSS".equalsIgnoreCase(currentUser)) {
            maxAllowedScope = "Company";
        } else if (currentUser != null && !currentUser.trim().isEmpty()) {
            com.autonoma.erp.model.admin.UserCredential credential = userRepository.findByUserId(currentUser)
                    .orElse(null);
            if (credential != null && credential.getUserLevel() != null && credential.getUserLevel() >= 5) {
                maxAllowedScope = "Company";
            } else {
                com.autonoma.erp.model.admin.BosPage page = bosPageRepository.findByPageCode("QM1320").orElse(null);
                if (page != null) {
                    com.autonoma.erp.model.admin.BosUserPageAuth auth = bosUserPageAuthRepository
                            .findByUserIdAndPageId(currentUser, page.getPageId());
                    if (auth != null) {
                        if (Integer.valueOf(1).equals(auth.getAdditional1())) {
                            maxAllowedScope = "Company";
                        } else if (Integer.valueOf(1).equals(auth.getManager())) {
                            maxAllowedScope = "Team";
                        } else if (Integer.valueOf(1).equals(auth.getReadAcs())) {
                            maxAllowedScope = "Mine";
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
            List<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> activeReports = employeeMasterRepository
                    .findActiveReportsByVerticalHeadName(employeeName.trim());
            if (activeReports != null) {
                for (com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster reportee : activeReports) {
                    reporteeEmpIds.add(reportee.getId());
                }
            }
        }

        LocalDate parsedFromDate = null;
        LocalDate parsedToDate = null;
        if ("Yes".equalsIgnoreCase(considerDate)) {
            try {
                if (fromDate != null && !fromDate.trim().isEmpty()) {
                    parsedFromDate = LocalDate.parse(fromDate);
                } else {
                    parsedFromDate = LocalDate.of(1970, 1, 1);
                }
            } catch (Exception e) {}
            try {
                if (toDate != null && !toDate.trim().isEmpty()) {
                    parsedToDate = LocalDate.parse(toDate);
                } else {
                    parsedToDate = LocalDate.of(2099, 12, 31);
                }
            } catch (Exception e) {}
        }

        java.util.Set<Long> allowedEmpIds = null;
        if (memberId != null) {
            allowedEmpIds = new java.util.HashSet<>();
            allowedEmpIds.add(memberId);
        } else if (!"Company".equalsIgnoreCase(effectiveScope)) {
            allowedEmpIds = new java.util.HashSet<>();
            if (userEmpId != null) allowedEmpIds.add(userEmpId);
            if ("Team".equalsIgnoreCase(effectiveScope) && reporteeEmpIds != null) {
                allowedEmpIds.addAll(reporteeEmpIds);
            }
        }

        // Get all meetings attendance using date range and allowed employee IDs
        List<QmsMeetingUserAttendance> list = attendanceService.getByDateRange(parsedFromDate, parsedToDate, allowedEmpIds);
        List<QmsMeetingUserAttendance> filtered = new ArrayList<>();

        for (QmsMeetingUserAttendance attendance : list) {
            boolean include = false;
            Long attendanceEmpId = attendance.getEmployee() != null ? attendance.getEmployee().getId() : null;

            if (memberId != null) {
                include = memberId.equals(attendanceEmpId);
            } else if ("Company".equalsIgnoreCase(effectiveScope)) {
                include = true;
            } else if ("Team".equalsIgnoreCase(effectiveScope)) {
                include = (attendanceEmpId != null && reporteeEmpIds.contains(attendanceEmpId)) ||
                        (userEmpId != null && userEmpId.equals(attendanceEmpId));
            } else { // Mine
                include = (userEmpId != null && userEmpId.equals(attendanceEmpId));
            }

            if (include) {
                filtered.add(attendance);
            }
        }

        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<List<QmsMeetingUserAttendance>> getBySchedule(@PathVariable Long scheduleId) {
        return ResponseEntity.ok(attendanceService.getByScheduleId(scheduleId));
    }

    @PostMapping
    @RequirePagePermission(pageCode = "QM1320", action = "write")
    public ResponseEntity<?> markAttendance(@RequestBody Map<String, Object> data) {
        try {
            QmsMeetingUserAttendance attendance = attendanceService.markAttendance(data);
            return ResponseEntity.ok(attendance);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/out")
    @RequirePagePermission(pageCode = "QM1320", action = "write")
    public ResponseEntity<?> markOutTime(@PathVariable Long id) {
        try {
            QmsMeetingUserAttendance attendance = attendanceService.markOutTime(id);
            return ResponseEntity.ok(attendance);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

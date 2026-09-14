package com.autonoma.erp.modules.qms.audit.controller;

import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository;
import com.autonoma.erp.modules.qms.audit.service.AuditAttendanceService;

import com.autonoma.erp.modules.qms.audit.entity.AuditAttendance;
import com.autonoma.erp.modules.qms.audit.repository.AuditAttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.repository.admin.BosUserPageAuthRepository;
import com.autonoma.erp.repository.admin.BosPageRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/qms/audit/attendance")
@CrossOrigin(origins = "*")
public class AuditAttendanceController {

    @Autowired
    private AuditAttendanceRepository auditAttendanceRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.service.AuditAttendanceService auditAttendanceService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BosUserPageAuthRepository bosUserPageAuthRepository;

    @Autowired
    private BosPageRepository bosPageRepository;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @GetMapping
    public List<AuditAttendance> getAll(
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
                EmployeeMaster empFallback = employeeMasterRepository.findByEmpCodeOrName(currentUser).orElse(null);
                if (empFallback != null) {
                    userEmpId = empFallback.getId();
                }
            }
            if (userEmpId != null) {
                EmployeeMaster emp = employeeMasterRepository.findById(userEmpId).orElse(null);
                if (emp != null) {
                    employeeName = emp.getEmployeeName();
                }
            }
        }

        // Determine effective scope based on page permissions (QM1220)
        String effectiveScope = "Mine";
        if (taskScope != null && !taskScope.trim().isEmpty()) {
            effectiveScope = taskScope;
        }

        String maxAllowedScope = "Mine";
        if (currentUser != null && !currentUser.trim().isEmpty()) {
            com.autonoma.erp.model.admin.BosPage page = bosPageRepository.findByPageCode("QM1220").orElse(null);
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

        java.util.Date parsedFromDate = parseDateString(fromDate, false);
        java.util.Date parsedToDate = parseDateString(toDate, true);

        return auditAttendanceService.getAttendanceList(
                effectiveScope,
                userEmpId,
                reporteeEmpIds,
                memberId,
                parsedFromDate,
                parsedToDate,
                considerDate
        );
    }

    @PostMapping
    @RequirePagePermission(pageCode = "QM1220", action = "write")
    public AuditAttendance create(@RequestBody AuditAttendance attendance) {
        return auditAttendanceService.saveAttendance(attendance);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1220", action = "write")
    public ResponseEntity<AuditAttendance> update(@PathVariable Long id, @RequestBody AuditAttendance details) {
        return auditAttendanceRepository.findById(id)
                .map(attendance -> {
                    attendance.setAuditScheduleNo(details.getAuditScheduleNo());
                    attendance.setName(details.getName());
                    attendance.setEmployeeCode(details.getEmployeeCode());
                    attendance.setInTime(details.getInTime());
                    attendance.setOutTime(details.getOutTime());
                    attendance.setAttendanceStatus(details.getAttendanceStatus());
                    attendance.setUpdatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                    return ResponseEntity.ok(auditAttendanceService.saveAttendance(attendance));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1220", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return auditAttendanceRepository.findById(id)
                .map(attendance -> {
                    auditAttendanceRepository.delete(attendance);
                    return ResponseEntity.ok().<Void>build();
                }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-schedule/{scheduleNo}")
    public List<AuditAttendance> getBySchedule(@PathVariable String scheduleNo) {
        return auditAttendanceRepository.findByAuditScheduleNo(scheduleNo);
    }

    @GetMapping("/today-schedules")
    public List<com.autonoma.erp.modules.qms.audit.entity.AuditSchedule> getTodaySchedules(
            @RequestParam("currentUser") String currentUser) {
        return auditAttendanceService.getTodayOpenSchedules(currentUser);
    }

    @GetMapping("/eligible-schedules")
    public List<com.autonoma.erp.modules.qms.audit.entity.AuditSchedule> getEligibleSchedules(
            @RequestParam("currentUser") String currentUser) {
        return auditAttendanceService.getEligibleSchedulesForAttendance(currentUser);
    }

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository scheduleRepo;

    @GetMapping("/participants/{scheduleNo}")
    public ResponseEntity<java.util.List<java.util.Map<String, String>>> getParticipants(
            @PathVariable String scheduleNo) {
        return scheduleRepo.findByScheduleNo(scheduleNo)
                .map(s -> {
                    java.util.List<java.util.Map<String, String>> participants = new java.util.ArrayList<>();

                    autoAdd(participants, s.getAuditor());
                    autoAdd(participants, s.getAuditee());

                    return ResponseEntity.ok(participants);
                }).orElse(ResponseEntity.notFound().build());
    }

    private void autoAdd(java.util.List<java.util.Map<String, String>> list, String field) {
        if (field == null)
            return;
        java.util.Arrays.stream(field.split(","))
                .map(String::trim)
                .filter(n -> !n.isEmpty())
                .forEach(n -> {
                    java.util.Map<String, String> m = new java.util.HashMap<>();
                    if (n.contains(" - ")) {
                        String[] parts = n.split(" - ");
                        m.put("name", parts[0].trim());
                        m.put("code", parts[1].trim());
                    } else {
                        m.put("name", n);
                        m.put("code", "-");
                    }
                    // Avoid exact duplicates
                    if (list.stream().noneMatch(
                            p -> p.get("name").equals(m.get("name")) && p.get("code").equals(m.get("code")))) {
                        list.add(m);
                    }
                });
    }

    private java.util.Date parseDateString(String dateStr, boolean isEnd) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            if (isEnd) {
                cal.set(2099, 11, 31, 23, 59, 59);
            } else {
                cal.set(1970, 0, 1, 0, 0, 0);
            }
            return cal.getTime();
        }
        String s = dateStr.trim();
        java.util.Date date = null;
        String[] patterns = new String[] {
            "yyyy-MM-dd",
            "dd/MM/yyyy",
            "dd-MM-yyyy",
            "yyyy/MM/dd",
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss"
        };
        for (String pattern : patterns) {
            try {
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat(pattern);
                sdf.setLenient(false);
                date = sdf.parse(s);
                if (date != null) break;
            } catch (Exception ignored) {}
        }
        if (date == null) {
            try {
                date = java.util.Date.from(java.time.Instant.parse(s));
            } catch (Exception ignored) {}
        }

        java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
        if (date != null) {
            cal.setTime(date);
        } else {
            if (isEnd) {
                cal.set(2099, 11, 31, 23, 59, 59);
            } else {
                cal.set(1970, 0, 1, 0, 0, 0);
            }
            return cal.getTime();
        }

        if (isEnd) {
            cal.set(java.util.Calendar.HOUR_OF_DAY, 23);
            cal.set(java.util.Calendar.MINUTE, 59);
            cal.set(java.util.Calendar.SECOND, 59);
            cal.set(java.util.Calendar.MILLISECOND, 999);
        } else {
            cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
            cal.set(java.util.Calendar.MINUTE, 0);
            cal.set(java.util.Calendar.SECOND, 0);
            cal.set(java.util.Calendar.MILLISECOND, 0);
        }
        return cal.getTime();
    }
}

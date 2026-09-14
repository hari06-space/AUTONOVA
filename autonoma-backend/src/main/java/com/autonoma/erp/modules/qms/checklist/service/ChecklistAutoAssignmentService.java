package com.autonoma.erp.modules.qms.checklist.service;

import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.service.admin.AuditTrailService;

import com.autonoma.erp.modules.platform.notification.entity.AppNotification;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignment;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignmentLog;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance;
import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest;
import com.autonoma.erp.modules.qms.checklist.entity.MasterChecklist;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistAssignmentLogRepository;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistAssignmentRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.attendance.repository.HrDailyAttendanceRepository;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;
import com.autonoma.erp.modules.hr.leave.repository.HrLeaveRequestRepository;
import com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository;
import com.autonoma.erp.modules.hr.leave.entity.LeaveEntry;
import com.autonoma.erp.modules.qms.checklist.repository.MasterChecklistRepository;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;

import com.autonoma.erp.repository.admin.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Slf4j
public class ChecklistAutoAssignmentService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChecklistAutoAssignmentService.class);

    @org.springframework.beans.factory.annotation.Autowired
    private EmployeeMasterRepository employeeMasterRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private EmployeeManagerMappingRepository managerMappingRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private MasterChecklistRepository masterRepo;
    @org.springframework.beans.factory.annotation.Autowired
    private ChecklistAssignmentRepository assignRepo;
    @org.springframework.beans.factory.annotation.Autowired
    private HrLeaveRequestRepository hrLeaveRequestRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private LeaveEntryRepository leaveEntryRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private HrHolidayMasterRepository hrHolidayMasterRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private HrDailyAttendanceRepository hrDailyAttendanceRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private ChecklistAssignmentLogRepository logRepo;
    @org.springframework.beans.factory.annotation.Autowired
    private StatusMasterRepository statusRepo;
    @org.springframework.beans.factory.annotation.Autowired
    private UserRepository userRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private AppNotificationRepository notificationRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private ChecklistService checklistService;
    @org.springframework.beans.factory.annotation.Autowired
    private NotificationService notificationService;
    @org.springframework.beans.factory.annotation.Autowired
    private com.autonoma.erp.modules.qms.checklist.repository.ChecklistClosedRepository closedRepo;
    @org.springframework.beans.factory.annotation.Autowired
    private com.autonoma.erp.service.admin.AuditTrailService auditTrailService;

    public static class AvailabilityResult {
        public final boolean available;
        public final String status;
        public final String reason;
        // Indicates a half-day primary leave: keep primary but flag for manager review.
        public final boolean halfDay;

        public AvailabilityResult(boolean available, String status, String reason) {
            this(available, status, reason, false);
        }

        public AvailabilityResult(boolean available, String status, String reason, boolean halfDay) {
            this.available = available;
            this.status = status;
            this.reason = reason;
            this.halfDay = halfDay;
        }
    }

    /**
     * Checks if an employee is available on a specific date. Order of checks:
     *   1. Existence + active + not resigned (exit) + already-rejoined
     *   2. Daily attendance override (HR_DAILY_ATTENDANCE: ABSENT/WFH/etc.)
     *   3. Company holiday (filtered by employee unit/department)
     *   4. Optional holiday (off only if employee opted in)
     *   5. Approved leave (MANAGER_APPROVED or HR_APPROVED), with half-day exception
     */
    public AvailabilityResult isEmployeeAvailable(Long empId, LocalDate date) {
        Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(empId);
        if (empOpt.isEmpty()) {
            return new AvailabilityResult(false, "Absent", "EMPLOYEE_NOT_FOUND");
        }

        EmployeeMaster emp = empOpt.get();
        boolean isActive = emp.getIsActive() == null || emp.getIsActive();
        if (!isActive || emp.getStatus() == null || !"Active".equalsIgnoreCase(emp.getStatus().getName())) {
            return new AvailabilityResult(false, "Absent", "EMPLOYEE_INACTIVE");
        }

        // Resigned / exited
        LocalDate exitDate = toLocalDate(emp.getExitDate());
        if (exitDate != null && !date.isBefore(exitDate)) {
            LocalDate rejoinDate = toLocalDate(emp.getRejoiningDate());
            if (rejoinDate == null || date.isBefore(rejoinDate)) {
                return new AvailabilityResult(false, "Absent", "EMPLOYEE_RESIGNED");
            }
        }

        // Not yet joined
        LocalDate doj = toLocalDate(emp.getDateOfJoining());
        if (doj != null && date.isBefore(doj)) {
            return new AvailabilityResult(false, "Absent", "EMPLOYEE_NOT_YET_JOINED");
        }

        // Daily attendance override (only when present in HR_DAILY_ATTENDANCE).
        Optional<HrDailyAttendance> attOpt = hrDailyAttendanceRepository.findByEmpIdAndAttendanceDate(empId, date);
        if (attOpt.isPresent()) {
            String s = attOpt.get().getStatus();
            if (s != null) {
                String up = s.trim().toUpperCase();
                if ("ABSENT".equals(up)) {
                    return new AvailabilityResult(false, "Absent", "EMPLOYEE_ABSENT");
                }
                // WFH and PRESENT are both considered available for checklist work.
            }
        }

        // Holidays filtered for THIS employee.
        List<HrHolidayMaster> holidays = hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(date);
        for (HrHolidayMaster holiday : holidays) {
            if (!holidayAppliesTo(holiday, emp)) continue;
            if (holiday.getIsOptional() != null && !holiday.getIsOptional()) {
                return new AvailabilityResult(false, "Holiday", "EMPLOYEE_ON_HOLIDAY");
            }
        }
        for (HrHolidayMaster holiday : holidays) {
            if (!holidayAppliesTo(holiday, emp)) continue;
            if (holiday.getIsOptional() != null && holiday.getIsOptional()) {
                List<HrLeaveRequest> approvedLeaves = hrLeaveRequestRepository.findApprovedLeavesOnDate(empId, date);
                List<LeaveEntry> leaveEntries = leaveEntryRepository.findByEmployeeIdAndDateAndIsActiveTrue(empId, java.sql.Date.valueOf(date));
                boolean optedIn = approvedLeaves.stream().anyMatch(leave ->
                    "OH".equalsIgnoreCase(leave.getLeaveTypeName()) ||
                    "Optional Holiday".equalsIgnoreCase(leave.getLeaveTypeName()) ||
                    (leave.getHolidayId() != null && leave.getHolidayId().equals(holiday.getHolidayId()))
                ) || leaveEntries.stream().anyMatch(entry ->
                    "OH".equalsIgnoreCase(entry.getLeaveType())
                );
                if (optedIn) {
                    return new AvailabilityResult(false, "Holiday", "EMPLOYEE_ON_OPTIONAL_HOLIDAY");
                }
            }
        }

        // Approved leave (full-day blocks; half-day keeps employee available).
        List<HrLeaveRequest> approvedLeaves = hrLeaveRequestRepository.findApprovedLeavesOnDate(empId, date);
        List<LeaveEntry> leaveEntries = leaveEntryRepository.findByEmployeeIdAndDateAndIsActiveTrue(empId, java.sql.Date.valueOf(date));
        
        if (!approvedLeaves.isEmpty() || !leaveEntries.isEmpty()) {
            boolean anyFullDayRequest = approvedLeaves.stream().anyMatch(l ->
                l.getNumberOfDays() == null || l.getNumberOfDays() > 0.5d);
            boolean anyFullDayEntry = leaveEntries.stream().anyMatch(e ->
                e.getNoOfDays() == null || e.getNoOfDays().doubleValue() > 0.5d);

            if (anyFullDayRequest || anyFullDayEntry) {
                return new AvailabilityResult(false, "Leave", "EMPLOYEE_ON_LEAVE");
            }
            // Half-day only: treated as unavailable so the hierarchy cascade
            // (PRIMARY → SECONDARY → TERTIARY) is triggered, matching full-day behaviour.
            // The halfDay=true flag is preserved so notifications/logs can distinguish
            // a half-day absence from a full-day leave.
            return new AvailabilityResult(false, "Half Day", "EMPLOYEE_HALF_DAY_LEAVE", true);
        }

        return new AvailabilityResult(true, "Present", "EMPLOYEE_AVAILABLE");
    }

    private LocalDate toLocalDate(Date d) {
        if (d == null) return null;
        return java.time.Instant.ofEpochMilli(d.getTime()).atZone(ZoneId.of("Asia/Kolkata")).toLocalDate();
    }

    private EmployeeMaster resolveEmployeeMaster(String assignedTo) {
        if (assignedTo == null || assignedTo.trim().isEmpty() || "0".equals(assignedTo.trim())) {
            return null;
        }
        try {
            Long empId = Long.parseLong(assignedTo.trim());
            return employeeMasterRepository.findById(empId).orElse(null);
        } catch (NumberFormatException e) {
            return employeeMasterRepository.findByEmpCodeOrName(assignedTo.trim()).orElse(null);
        }
    }

    /**
     * Holiday filtering: ALL applies to everyone; otherwise the holiday only
     * applies if the employee's unit/department/state ID is listed in APPLICABLE_REFS.
     */
    private boolean holidayAppliesTo(HrHolidayMaster holiday, EmployeeMaster emp) {
        String scope = holiday.getApplicableTo();
        if (scope == null || scope.trim().isEmpty() || "ALL".equalsIgnoreCase(scope.trim())) {
            return true;
        }
        String refs = holiday.getApplicableRefs();
        if (refs == null || refs.trim().isEmpty()) {
            // Scoped holiday with no refs configured -> treat as applying to all (safe default).
            return true;
        }
        Set<String> refSet = new HashSet<>();
        for (String r : refs.split(",")) {
            String t = r.trim();
            if (!t.isEmpty()) refSet.add(t);
        }
        String empRef = null;
        String upScope = scope.trim().toUpperCase();
        if (upScope.startsWith("UNIT")) {
            empRef = emp.getUnitId() != null ? String.valueOf(emp.getUnitId()) : null;
        } else if (upScope.startsWith("DEPT") || upScope.startsWith("DEPARTMENT")) {
            empRef = emp.getDepartmentId() != null ? String.valueOf(emp.getDepartmentId()) : null;
        } else if (upScope.startsWith("EMP")) {
            empRef = emp.getId() != null ? String.valueOf(emp.getId()) : null;
        } else {
            // Unknown scope -> conservative: assume applicable.
            return true;
        }
        return empRef != null && refSet.contains(empRef);
    }

    @Transactional
    public void processAutoAssignment(Long checklistId, Date targetDate) {
        MasterChecklist checklist = masterRepo.findById(checklistId).orElseThrow(() -> new IllegalArgumentException("Checklist not found"));
        
        java.util.Calendar cal = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
        cal.setTime(targetDate != null ? targetDate : new Date());
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
        cal.set(java.util.Calendar.MINUTE, 0);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        Date targetDateMidnight = cal.getTime();
        LocalDate localDate = java.time.Instant.ofEpochMilli(targetDateMidnight.getTime()).atZone(ZoneId.of("Asia/Kolkata")).toLocalDate();

        List<ChecklistAssignment> activeAssignments = assignRepo.findByChecklistIdAndChecklistDate(checklist.getId(), targetDateMidnight);
        if (activeAssignments == null || activeAssignments.isEmpty()) {
            activeAssignments = assignRepo.findByChecklistId(checklist.getId()).stream()
                    .filter(a -> (a.getChecklistDate() == null || 
                                  (a.getChecklistDate() != null && 
                                   java.time.Instant.ofEpochMilli(a.getChecklistDate().getTime())
                                   .atZone(ZoneId.of("Asia/Kolkata")).toLocalDate().equals(localDate)))
                            && (a.getIsActive() == null || a.getIsActive())
                            && (a.getPendingActivation() == null || !a.getPendingActivation()))
                    .collect(java.util.stream.Collectors.toList());
        }

        // Group active assignments by normalized groupName (empty/null/- maps to "-")
        java.util.Map<String, java.util.List<ChecklistAssignment>> assignmentsByGroup = activeAssignments.stream()
                .collect(java.util.stream.Collectors.groupingBy(a -> {
                    String g = a.getGroupName();
                    return (g == null || g.trim().isEmpty() || "-".equals(g.trim())) ? "-" : g.trim().toUpperCase();
                }));

        if (assignmentsByGroup.isEmpty()) {
            assignmentsByGroup.put("-", new java.util.ArrayList<>());
        }

        for (java.util.Map.Entry<String, java.util.List<ChecklistAssignment>> entry : assignmentsByGroup.entrySet()) {
            String groupKey = entry.getKey();
            java.util.List<ChecklistAssignment> groupAssignments = entry.getValue();
            String targetGroupParam = "-".equals(groupKey) ? null : groupKey;

            EmployeeMaster primary = groupAssignments.stream()
                    .filter(a -> "PRIMARY".equalsIgnoreCase(a.getAssignType()))
                    .map(a -> resolveEmployeeMaster(a.getAssignedTo()))
                    .filter(java.util.Objects::nonNull)
                    .findFirst().orElse(null);

            if (primary == null && "-".equals(groupKey)) {
                primary = checklist.getPrimaryEmployee();
            }

            EmployeeMaster secondary = groupAssignments.stream()
                    .filter(a -> "SECONDARY".equalsIgnoreCase(a.getAssignType()))
                    .map(a -> resolveEmployeeMaster(a.getAssignedTo()))
                    .filter(java.util.Objects::nonNull)
                    .findFirst().orElse(null);

            if (secondary == null && "-".equals(groupKey)) {
                secondary = checklist.getSecondaryEmployee();
            }

            EmployeeMaster tertiary = groupAssignments.stream()
                    .filter(a -> "TERTIARY".equalsIgnoreCase(a.getAssignType()))
                    .map(a -> resolveEmployeeMaster(a.getAssignedTo()))
                    .filter(java.util.Objects::nonNull)
                    .findFirst().orElse(null);

            if (tertiary == null && "-".equals(groupKey)) {
                tertiary = checklist.getTertiaryEmployee();
            }

            // Fallback: If primary/secondary/tertiary are still null for this group, extract sequentially
            List<EmployeeMaster> fallbackActiveEmployees = new java.util.ArrayList<>();
            for (ChecklistAssignment a : groupAssignments) {
                if (a.getAssignedTo() != null && !a.getAssignedTo().trim().isEmpty() && !"0".equals(a.getAssignedTo().trim())) {
                    EmployeeMaster emp = resolveEmployeeMaster(a.getAssignedTo());
                    if (emp != null && !fallbackActiveEmployees.contains(emp)) {
                        boolean isActive = emp.getIsActive() == null || emp.getIsActive();
                        boolean statusActive = emp.getStatus() == null || "Active".equalsIgnoreCase(emp.getStatus().getName());
                        if (isActive && statusActive) {
                            fallbackActiveEmployees.add(emp);
                        }
                    }
                }
            }

            if (primary == null && !fallbackActiveEmployees.isEmpty()) {
                primary = fallbackActiveEmployees.get(0);
            }
            if (secondary == null && fallbackActiveEmployees.size() > 1) {
                secondary = fallbackActiveEmployees.get(1);
            }
            if (tertiary == null && fallbackActiveEmployees.size() > 2) {
                tertiary = fallbackActiveEmployees.get(2);
            }

            EmployeeMaster resolvedAssignee = null;
            String resolvedType = null;
            String resolvedReason = null;
            boolean primaryHalfDay = false;

            AvailabilityResult primRes = null;
            AvailabilityResult secRes = null;
            AvailabilityResult tertRes = null;

            if (primary != null) {
                primRes = isEmployeeAvailable(primary.getId(), localDate);
                if (primRes.available) {
                    resolvedAssignee = primary;
                    resolvedType = "PRIMARY";
                    resolvedReason = primRes.halfDay ? "PRIMARY_HALF_DAY_REVIEW" : "PRIMARY_AVAILABLE";
                    primaryHalfDay = primRes.halfDay;
                }
            }

            if (resolvedAssignee == null && secondary != null) {
                secRes = isEmployeeAvailable(secondary.getId(), localDate);
                if (secRes.available) {
                    resolvedAssignee = secondary;
                    resolvedType = "SECONDARY";
                    resolvedReason = (primary != null && primRes != null) ? ("PRIMARY_" + primRes.reason) : "PRIMARY_NOT_CONFIGURED";
                }
            }

            if (resolvedAssignee == null && tertiary != null) {
                tertRes = isEmployeeAvailable(tertiary.getId(), localDate);
                if (tertRes.available) {
                    resolvedAssignee = tertiary;
                    resolvedType = "TERTIARY";
                    resolvedReason = ((primary != null && primRes != null) ? ("PRIMARY_" + primRes.reason) : "PRIMARY_NOT_CONFIGURED")
                            + "__SECONDARY_" + (secRes != null ? secRes.reason : "NOT_CONFIGURED");
                }
            }

            if (resolvedAssignee == null) {
                // Check N-Additional Backup Assignees sequentially
                String additionalIds = checklist.getAdditionalEmployeeIds();
                if (additionalIds != null && !additionalIds.trim().isEmpty()) {
                    String[] ids = additionalIds.split(",");
                    for (int i = 0; i < ids.length; i++) {
                        String idStr = ids[i].trim();
                        if (!idStr.isEmpty()) {
                            try {
                                Long addEmpId = Long.parseLong(idStr);
                                Optional<EmployeeMaster> addEmpOpt = employeeMasterRepository.findById(addEmpId);
                                if (addEmpOpt.isPresent()) {
                                    EmployeeMaster addEmp = addEmpOpt.get();
                                    AvailabilityResult addRes = isEmployeeAvailable(addEmpId, localDate);
                                    if (addRes.available) {
                                        resolvedAssignee = addEmp;
                                        resolvedType = "BACKUP_" + (i + 1);
                                        resolvedReason = ((primary != null && primRes != null) ? ("PRIMARY_" + primRes.reason) : "PRIMARY_NOT_CONFIGURED")
                                                + "__SECONDARY_" + (secRes != null ? secRes.reason : "NOT_CONFIGURED")
                                                + "__TERTIARY_" + (tertRes != null ? tertRes.reason : "NOT_CONFIGURED")
                                                + "__ADDITIONAL_" + (i + 1) + "_AVAILABLE";
                                        break;
                                    }
                                }
                            } catch (NumberFormatException e) {
                                log.warn("Invalid additional employee ID: {}", idStr);
                            }
                        }
                    }
                }
                if (resolvedAssignee == null) {
                    for (ChecklistAssignment a : groupAssignments) {
                        if (a.getAssignedTo() != null && !a.getAssignedTo().trim().isEmpty() && !"0".equals(a.getAssignedTo().trim())) {
                            EmployeeMaster emp = resolveEmployeeMaster(a.getAssignedTo());
                            if (emp != null) {
                                if (primary != null && emp.getId().equals(primary.getId())) continue;
                                if (secondary != null && emp.getId().equals(secondary.getId())) continue;
                                if (tertiary != null && emp.getId().equals(tertiary.getId())) continue;

                                boolean isActive = emp.getIsActive() == null || emp.getIsActive();
                                boolean statusActive = emp.getStatus() == null || "Active".equalsIgnoreCase(emp.getStatus().getName());
                                if (isActive && statusActive) {
                                    AvailabilityResult addRes = isEmployeeAvailable(emp.getId(), localDate);
                                    if (addRes.available) {
                                        resolvedAssignee = emp;
                                        resolvedType = a.getAssignType() != null && !a.getAssignType().trim().isEmpty()
                                                ? a.getAssignType().trim().toUpperCase() : "FALLBACK";
                                        resolvedReason = "FALLBACK_ASSIGNMENT_ROW_EMPLOYEE_AVAILABLE_" + resolvedType;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                if (resolvedAssignee == null) {
                    resolvedReason = "AUTO_ESCALATION__PRIMARY_" + (primRes != null ? primRes.reason : "NOT_CONFIGURED")
                            + "__SECONDARY_" + (secRes != null ? secRes.reason : "NOT_CONFIGURED")
                            + "__TERTIARY_" + (tertRes != null ? tertRes.reason : "NOT_CONFIGURED");
                }
            }

            EmployeeMaster oldAssignee = checklist.getCurrentAssignee();

            if (resolvedAssignee != null) {
                // Check if assignment already exists in QMS_CHECKLIST_CLOSED for this employee, group, and target date to prevent duplicates
                List<com.autonoma.erp.modules.qms.checklist.entity.ChecklistClosed> existingAssigneeClosed = closedRepo
                        .findByChecklistIdAndAssignedToAndGroupNameAndChecklistDate(checklistId, String.valueOf(resolvedAssignee.getId()), targetGroupParam, targetDateMidnight);
                if (existingAssigneeClosed != null && !existingAssigneeClosed.isEmpty()) {
                    log.info("Checklist {} for group {} already assigned to employee {} for date {}. Skipping duplicate.",
                            checklist.getSeqNo(), groupKey, resolvedAssignee.getEmployeeName(), localDate);
                    continue;
                }

                // Assign checklist task to resolved employee with groupName
                checklistService.assignTask(null, checklistId, String.valueOf(resolvedAssignee.getId()), "Super Boss", resolvedType, targetGroupParam, targetDateMidnight, true);

                // Update Master Checklist with current assignee details
                checklist.setCurrentAssignee(resolvedAssignee);
                checklist.setAssignmentType(resolvedType);
                checklist.setAutoAssignedFlag(true);
                checklist.setLastAssignmentDate(new Date());
                checklist.setTaskStatus("Pending");
                masterRepo.save(checklist);

                // Log Assignment History
                ChecklistAssignmentLog assignmentLog = new ChecklistAssignmentLog();
                assignmentLog.setChecklistId(checklistId);
                assignmentLog.setOldAssigneeId(oldAssignee != null ? oldAssignee.getId() : null);
                assignmentLog.setNewAssigneeId(resolvedAssignee.getId());
                assignmentLog.setAssignmentType(resolvedType);
                assignmentLog.setReason(resolvedReason);
                assignmentLog.setAssignedDate(new Date());
                assignmentLog.setAssignedBySystem(true);
                logRepo.save(assignmentLog);

                // Trigger Notifications if reassigned to backup (Secondary or Tertiary)
                if (!"PRIMARY".equals(resolvedType)) {
                    sendNotification(
                        resolvedAssignee.getId(),
                        "Checklist Auto-Assignment Backup",
                        String.format("Checklist %s (%s) has been automatically assigned to you because the primary assignee is unavailable.",
                            checklist.getSeqNo(), checklist.getCheckingPoint()),
                        "/qms/checklist/assignment"
                    );
                    Long managerId = primary != null ? resolveManagerId(primary.getId()) : null;
                    if (managerId != null) {
                        sendNotification(
                            managerId,
                            "Checklist Reassigned",
                            String.format("Checklist %s reassigned from %s to %s.",
                                checklist.getSeqNo(), primary != null ? primary.getEmployeeName() : "N/A", resolvedAssignee.getEmployeeName()),
                            "/qms/checklist/assignment"
                        );
                    }
                } else if (primaryHalfDay && primary != null) {
                    Long managerId = resolveManagerId(primary.getId());
                    if (managerId != null) {
                        sendNotification(
                            managerId,
                            "Checklist - Primary On Half Day",
                            String.format("Checklist %s (%s) remains assigned to primary %s who is on half-day leave today. Please review.",
                                checklist.getSeqNo(), checklist.getCheckingPoint(), primary.getEmployeeName()),
                            "/qms/checklist/assignment"
                        );
                    }
                }
                log.info("Checklist {} for group {} auto-assigned to {} ({}) on {} [reason={}]",
                        checklist.getSeqNo(), groupKey, resolvedAssignee.getEmployeeName(), resolvedType, localDate, resolvedReason);
            } else {
                String unassignedReason = primary != null ? ("Primary on leave (" + (primRes != null ? primRes.reason : "unspecified") + ")") : "No Primary employee configured.";
                if (secondary != null) {
                    unassignedReason += ". Secondary on leave (" + (secRes != null ? secRes.reason : "unspecified") + ")";
                } else {
                    unassignedReason += ". No Secondary employee configured.";
                }
                if (secondary != null && tertiary != null) {
                    unassignedReason += ". Tertiary on leave (" + (tertRes != null ? tertRes.reason : "unspecified") + ")";
                } else if (secondary != null) {
                    unassignedReason += ". No Tertiary employee configured.";
                }

                // Escalation Flow - mark UN ASSIGNED
                checklist.setCurrentAssignee(null);
                checklist.setAssignmentType("NONE");
                checklist.setAutoAssignedFlag(true);
                checklist.setLastAssignmentDate(new Date());
                checklist.setAssignTo(null);
                checklist.setTaskStatus("UN ASSIGNED");
                masterRepo.save(checklist);

            try {
                boolean exists = !closedRepo.findByChecklistIdAndAssignedToAndGroupNameAndChecklistDate(checklistId, "0", targetGroupParam, targetDate).isEmpty();
                if (!exists) {
                    ChecklistAssignment placeholder = new ChecklistAssignment();
                    placeholder.setChecklist(checklist);
                    placeholder.setAssignedTo("0");
                    placeholder.setAssignedBy("Super Boss");
                    placeholder.setAssignType("NONE");
                    placeholder.setGroupName(targetGroupParam);
                    placeholder.setAssignedDate(new Date());
                    placeholder.setChecklistDate(targetDate);
                    placeholder.setCarryForward(checklist.getCarryForward());
                    placeholder.setCarryForwardCount(0);
                    placeholder.setStatus(getOrCreateStatus("UN ASSIGNED"));
                    placeholder.setIsActive(true);
                    placeholder.setPendingActivation(false);
                    placeholder.setRemarks("[UN ASSIGNED by Scheduler] " + unassignedReason);
                    placeholder.setComments("Checklist automatically marked UN ASSIGNED: " + unassignedReason);
                    checklistService.saveToFrequencyTable(placeholder);
                }
            } catch (Exception e) {
                log.error("Failed to persist unassigned placeholder row for checklist {}: {}", checklist.getSeqNo(), e.getMessage());
            }

            ChecklistAssignmentLog assignmentLog = new ChecklistAssignmentLog();
            assignmentLog.setChecklistId(checklistId);
            assignmentLog.setOldAssigneeId(oldAssignee != null ? oldAssignee.getId() : null);
            assignmentLog.setNewAssigneeId(null);
            assignmentLog.setAssignmentType("NONE");
            assignmentLog.setReason("SCHEDULER_UNASSIGNED: " + unassignedReason);
            assignmentLog.setAssignedDate(new Date());
            assignmentLog.setAssignedBySystem(true);
            logRepo.save(assignmentLog);

            // Audit Trail Entry
            try {
                auditTrailService.saveAuditTrail(
                    "AUTO_UNASSIGNED",
                    "QMS_CHECKLIST",
                    String.valueOf(checklistId),
                    null,
                    null,
                    "Checklist: " + checklist.getSeqNo() + " | Reason: " + unassignedReason + " | Action: Auto-Assign marked UN ASSIGNED",
                    "SYSTEM",
                    "QMS Checklist"
                );
            } catch (Exception e) {
                log.error("Failed to save audit trail for unassigned checklist {}: {}", checklist.getSeqNo(), e.getMessage());
            }

            // Notifications
            Long ownerEmpId = null;
            if (checklist.getCreatedBy() != null) {
                try {
                    ownerEmpId = userRepository.findByUserId(checklist.getCreatedBy())
                        .map(com.autonoma.erp.model.admin.UserCredential::getEmpId)
                        .orElse(null);
                } catch (Exception e) {
                    log.error("Failed to resolve checklist owner ID: {}", e.getMessage());
                }
            }

            String notificationMsg = String.format("Checklist %s (%s) is now UN ASSIGNED because: %s",
                checklist.getSeqNo(), checklist.getCheckingPoint(), unassignedReason);

            if (ownerEmpId != null) {
                sendNotification(
                    ownerEmpId,
                    "Checklist UN ASSIGNED",
                    notificationMsg,
                    "/qms/checklist/assignment"
                );
            }

            try {
                List<Long> adminEmpIds = userRepository.findEmpIdsByUserLevelGreaterThanEqual(5);
                for (Long adminEmpId : adminEmpIds) {
                    if (!adminEmpId.equals(ownerEmpId)) {
                        sendNotification(
                            adminEmpId,
                            "Checklist UN ASSIGNED",
                            notificationMsg,
                            "/qms/checklist/assignment"
                        );
                    }
                }
            } catch (Exception e) {
                log.error("Failed to send HR/Admin notifications: {}", e.getMessage());
            }

            // Notify Vertical Heads if Carry Forward is NO
            if (!"YES".equalsIgnoreCase(checklist.getCarryForward())) {
                notifyVerticalHeadsForNonAssignment(checklist, unassignedReason);
            }
            
            log.warn("[AUTO-ASSIGN] Checklist {} marked UN ASSIGNED. Reason: {}", checklist.getSeqNo(), unassignedReason);
        }
    }
}

    @Transactional
    public void processAutoAssignmentForEmployee(Long checklistId, Long employeeId, Date targetDate) {
        MasterChecklist checklist = masterRepo.findById(checklistId)
                .orElseThrow(() -> new IllegalArgumentException("Checklist not found"));
        LocalDate localDate = java.time.Instant.ofEpochMilli(targetDate.getTime()).atZone(ZoneId.of("Asia/Kolkata")).toLocalDate();

        AvailabilityResult availRes = isEmployeeAvailable(employeeId, localDate);
        if (!availRes.available) {
            log.info("Employee {} is not available on {} due to {}. Skipping dynamic assignment for checklist {}.",
                    employeeId, localDate, availRes.reason, checklist.getSeqNo());
            return;
        }

        // Check duplicate assignment
        boolean alreadyAssigned = assignRepo.existsByChecklistIdAndAssignedToAndChecklistDate(
                checklistId, String.valueOf(employeeId), targetDate);
        if (alreadyAssigned) {
            log.info("Checklist {} has already been assigned to employee {} for date {}. Skipping.", 
                    checklist.getSeqNo(), employeeId, localDate);
            return;
        }

        EmployeeMaster employee = employeeMasterRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with id: " + employeeId));

        checklistService.assignTask(null, checklistId, String.valueOf(employeeId), "Super Boss", "DYNAMIC", targetDate, true);

        checklist.setCurrentAssignee(employee);
        checklist.setAssignmentType("DYNAMIC");
        checklist.setAutoAssignedFlag(true);
        checklist.setLastAssignmentDate(new Date());
        checklist.setTaskStatus("Pending");
        masterRepo.save(checklist);

        ChecklistAssignmentLog assignmentLog = new ChecklistAssignmentLog();
        assignmentLog.setChecklistId(checklistId);
        assignmentLog.setOldAssigneeId(null);
        assignmentLog.setNewAssigneeId(employeeId);
        assignmentLog.setAssignmentType("DYNAMIC");
        assignmentLog.setReason(availRes.halfDay ? "DYNAMIC_HALF_DAY_REVIEW" : "DYNAMIC_RULE_MATCH");
        assignmentLog.setAssignedDate(new Date());
        assignmentLog.setAssignedBySystem(true);
        logRepo.save(assignmentLog);

        sendNotification(
            employeeId,
            "Checklist Dynamic Assignment",
            String.format("Checklist %s (%s) has been dynamically assigned to you.",
                checklist.getSeqNo(), checklist.getCheckingPoint()),
            "/qms/checklist/assignment"
        );
    }

    public static class DateRange {
        public final Date startDate;
        public final Date endDate;
        public DateRange(Date startDate, Date endDate) {
            this.startDate = startDate;
            this.endDate = endDate;
        }
    }

    private DateRange getOccurrenceRange(Date targetDate, MasterChecklist checklist) {
        LocalDate date = java.time.Instant.ofEpochMilli(targetDate.getTime()).atZone(ZoneId.of("Asia/Kolkata")).toLocalDate();
        String freq = checklist.getFrequency() != null ? checklist.getFrequency().trim().toUpperCase() : "DAILY";
        
        LocalDate start;
        LocalDate end;
        
        switch (freq) {
            case "DAILY":
                start = date;
                end = date;
                break;
            case "WEEKLY":
                start = date.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                end = date.with(java.time.temporal.TemporalAdjusters.nextOrSame(java.time.DayOfWeek.SUNDAY));
                break;
            case "FORTNIGHTLY":
                start = date.minusDays(7);
                end = date.plusDays(7);
                break;
            case "MONTHLY":
                start = date.with(java.time.temporal.TemporalAdjusters.firstDayOfMonth());
                end = date.with(java.time.temporal.TemporalAdjusters.lastDayOfMonth());
                break;
            case "QUARTERLY":
                int monthQ = date.getMonthValue();
                int startMonthQ = ((monthQ - 1) / 3) * 3 + 1;
                start = LocalDate.of(date.getYear(), startMonthQ, 1);
                end = start.plusMonths(3).minusDays(1);
                break;
            case "HALF YEARLY":
                int monthH = date.getMonthValue();
                int startMonthH = ((monthH - 1) / 6) * 6 + 1;
                start = LocalDate.of(date.getYear(), startMonthH, 1);
                end = start.plusMonths(6).minusDays(1);
                break;
            case "YEARLY":
            case "ANNUALLY":
            case "ANNUAL":
                start = date.with(java.time.temporal.TemporalAdjusters.firstDayOfYear());
                end = date.with(java.time.temporal.TemporalAdjusters.lastDayOfYear());
                break;
            case "CUSTOM":
                Integer val = checklist.getRepeatEveryValue();
                String unit = checklist.getRepeatEveryUnit() != null ? checklist.getRepeatEveryUnit().trim().toUpperCase() : "";
                if (val != null && val > 0) {
                    if ("DAYS".equals(unit)) {
                        start = date.minusDays(val / 2);
                        end = date.plusDays(val / 2);
                    } else if ("WEEKS".equals(unit)) {
                        start = date.minusWeeks(val / 2);
                        end = date.plusWeeks(val / 2);
                    } else if ("MONTHS".equals(unit)) {
                        start = date.minusMonths(val / 2);
                        end = date.plusMonths(val / 2);
                    } else if ("YEARS".equals(unit)) {
                        start = date.minusYears(val / 2);
                        end = date.plusYears(val / 2);
                    } else {
                        start = date;
                        end = date;
                    }
                } else {
                    start = date;
                    end = date;
                }
                break;
            default:
                start = date;
                end = date;
                break;
        }
        
        Date startDate = Date.from(start.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant());
        Date endDate = Date.from(end.atTime(23, 59, 59, 999).atZone(ZoneId.of("Asia/Kolkata")).toInstant());
        return new DateRange(startDate, endDate);
    }

    public boolean isDuplicateDynamicAssignment(Long checklistId, Long businessRecordId, Date targetDate) {
        if (businessRecordId == null) return false;
        
        MasterChecklist checklist = masterRepo.findById(checklistId).orElse(null);
        if (checklist == null) return false;
        
        DateRange range = getOccurrenceRange(targetDate, checklist);
        
        boolean closedDuplicate = closedRepo.existsDuplicate(
                checklistId, businessRecordId, String.valueOf(businessRecordId), range.startDate, range.endDate);
        return closedDuplicate;
    }
    @Transactional
    public void runReassignmentCheckForOpenAssignments() {
        log.info("[SCHEDULER] Running auto-reassignment check for all open hierarchy checklist assignments.");

        // Get today's date (start of day, IST)
        java.time.LocalDate today = java.time.LocalDate.now(ZoneId.of("Asia/Kolkata"));
        Date todayDate = Date.from(today.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant());

        // Find all open active hierarchy assignments (PRIMARY, SECONDARY, TERTIARY)
        List<ChecklistAssignment> openActiveAssignments = assignRepo.findOpenActiveAssignments(todayDate);
        log.info("[SCHEDULER] Found {} open active hierarchy assignments to check.", openActiveAssignments.size());

        for (ChecklistAssignment assignment : openActiveAssignments) {
            try {
                processSchedulerReassignment(assignment, today);
            } catch (Exception e) {
                log.error("[SCHEDULER] Failed to process reassignment for assignment ID {}: {}",
                    assignment.getId(), e.getMessage(), e);
            }
        }
        log.info("[SCHEDULER] Auto-reassignment check completed.");
    }

    public LocalDate getChecklistPeriodEndDate(LocalDate startDate, String frequency) {
        if (frequency == null) {
            return startDate;
        }
        switch (frequency.trim().toUpperCase()) {
            case "DAILY":
                return startDate;
            case "WEEKLY":
                return startDate.plusDays(6);
            case "MONTHLY":
                return startDate.plusMonths(1).minusDays(1);
            case "QUARTERLY":
                return startDate.plusMonths(3).minusDays(1);
            case "YEARLY":
                return startDate.plusYears(1).minusDays(1);
            default:
                return startDate;
        }
    }

    public AvailabilityResult isEmployeeAvailableForPeriod(Long empId, LocalDate startDate, LocalDate endDate) {
        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            AvailabilityResult res = isEmployeeAvailable(empId, d);
            if (!res.available) {
                return res;
            }
        }
        return new AvailabilityResult(true, "Present", "EMPLOYEE_AVAILABLE");
    }

    /**
     * Public entry-point for the 4AM re-validation pass.
     *
     * Re-checks all active generated tasks for the given date.  If a task's
     * currently-assigned employee is now on leave (e.g. leave entered after
     * yesterday's scheduler pre-generated the task), the full hierarchy cascade
     * (PRIMARY → SECONDARY → TERTIARY → UNASSIGNED) is applied in-place.
     *
     * This delegates to the same {@link #processSchedulerReassignment} logic
     * used by the 10AM / 2PM / 4PM mid-day scheduler, so all notification,
     * audit-trail, and QMS_CHECKLIST_CLOSED sync behaviour is identical.
     *
     * @param todayDate the target date (typically {@code new Date()} at 4AM)
     * @return the number of assignments that were re-evaluated (may include
     *         assignments where no change was needed)
     */
    @Transactional
    public int reValidateAssignmentsForDate(Date todayDate) {
        java.time.LocalDate today = java.time.Instant.ofEpochMilli(todayDate.getTime())
                .atZone(ZoneId.of("Asia/Kolkata")).toLocalDate();

        log.info("[4AM Re-Validation] Re-validating existing assignments for date: {}", today);

        // Reuse the same query as the mid-day scheduler — all open, active,
        // hierarchy assignments whose date is on or before today.
        Date queryDate = Date.from(today.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant());
        List<ChecklistAssignment> openAssignments = assignRepo.findOpenActiveAssignments(queryDate);

        // Narrow to tasks that are exactly for TODAY (not older carry-forward rows
        // — those are handled by processUncompletedChecklists at 11:59 PM).
        java.util.List<ChecklistAssignment> todayTasks = openAssignments.stream()
                .filter(a -> {
                    if (a.getChecklistDate() == null) return false;
                    java.time.LocalDate taskDate = java.time.Instant.ofEpochMilli(a.getChecklistDate().getTime())
                            .atZone(ZoneId.of("Asia/Kolkata")).toLocalDate();
                    return taskDate.equals(today);
                })
                .collect(java.util.stream.Collectors.toList());

        log.info("[4AM Re-Validation] Found {} task(s) generated for today to re-check.", todayTasks.size());

        int processedCount = 0;
        for (ChecklistAssignment assignment : todayTasks) {
            try {
                processSchedulerReassignment(assignment, today);
                processedCount++;
            } catch (Exception e) {
                log.error("[4AM Re-Validation] Failed to re-validate assignment ID {}: {}",
                        assignment.getId(), e.getMessage(), e);
            }
        }

        log.info("[4AM Re-Validation] Complete. {} task(s) re-validated.", processedCount);
        return processedCount;
    }

    /**
     * SCHEDULER CORE LOGIC
     *
     * Called for each open assignment at 10AM, 2PM, 4PM.
     *
     * Steps:
     *  1. Resolve the currently assigned employee.
     *  2. Check if that employee is on approved leave today.
     *  3. If available  → no action needed.
     *  4. If on leave   → close their active checklist, find the next available backup in the hierarchy.
     *     - If Secondary is available: Close Primary -> Create Secondary.
     *     - If Tertiary is available: Close Current -> Create Tertiary.
     *     - If all unavailable: Close Current -> Mark UNASSIGNED.
     */
    @Transactional
    private void processSchedulerReassignment(ChecklistAssignment assignment, java.time.LocalDate today) {
        String currentAssignedTo = assignment.getAssignedTo();
        if (currentAssignedTo == null || currentAssignedTo.trim().isEmpty()) {
            return;
        }

        // Update scheduler tracking
        assignment.setLastSchedulerRun(new Date());
        assignment.setSchedulerRunCount(
            (assignment.getSchedulerRunCount() == null ? 0 : assignment.getSchedulerRunCount()) + 1
        );

        // Resolve current employee from ID stored in ASSIGNED_TO
        Optional<EmployeeMaster> currentEmpOpt = resolveEmployee(currentAssignedTo);
        if (currentEmpOpt.isEmpty()) {
            log.warn("[SCHEDULER] Cannot resolve employee '{}' for assignment ID {}. Skipping.",
                currentAssignedTo, assignment.getId());
            assignRepo.save(assignment);
            return;
        }
        EmployeeMaster currentEmp = currentEmpOpt.get();

        MasterChecklist checklist = assignment.getChecklist();
        String currentType = assignment.getAssignType() != null ? assignment.getAssignType().toUpperCase() : "PRIMARY";

        // Build entire hierarchy
        List<EmployeeMaster> hierarchy = new java.util.ArrayList<>();
        List<String> typeNames = new java.util.ArrayList<>();
        
        if (checklist.getPrimaryEmployee() != null) {
            hierarchy.add(checklist.getPrimaryEmployee());
            typeNames.add("PRIMARY");
        }
        if (checklist.getSecondaryEmployee() != null) {
            hierarchy.add(checklist.getSecondaryEmployee());
            typeNames.add("SECONDARY");
        }
        if (checklist.getTertiaryEmployee() != null) {
            hierarchy.add(checklist.getTertiaryEmployee());
            typeNames.add("TERTIARY");
        }
        
        String additionalIds = checklist.getAdditionalEmployeeIds();
        if (additionalIds != null && !additionalIds.trim().isEmpty()) {
            String[] ids = additionalIds.split(",");
            int backupIdx = 1;
            for (String idStr : ids) {
                String t = idStr.trim();
                if (!t.isEmpty()) {
                    try {
                        Long addEmpId = Long.parseLong(t);
                        Optional<EmployeeMaster> addEmpOpt = employeeMasterRepository.findById(addEmpId);
                        if (addEmpOpt.isPresent()) {
                            hierarchy.add(addEmpOpt.get());
                            typeNames.add("BACKUP_" + backupIdx);
                            backupIdx++;
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
        }

        // Find current position in hierarchy
        int currentIdx = -1;
        for (int i = 0; i < hierarchy.size(); i++) {
            if (hierarchy.get(i).getId().equals(currentEmp.getId())) {
                currentIdx = i;
                break;
            }
        }

        // 1. Reversion check: if any higher-priority assignee before currentIdx is now available, revert to them
        if (currentIdx > 0) {
            for (int i = 0; i < currentIdx; i++) {
                EmployeeMaster candidate = hierarchy.get(i);
                AvailabilityResult candAvail = isEmployeeAvailable(candidate.getId(), today);
                if (candAvail.available) {
                    String candType = typeNames.get(i);
                    log.info("[SCHEDULER] Higher-priority assignee {} ({}) has become available. Reverting from {} back.",
                        candidate.getEmployeeName(), candType, currentEmp.getEmployeeName());
                    performReassignment(assignment, currentEmp, candidate, candType,
                        candType + "_RETURNED_FROM_LEAVE", checklist);
                    return;
                }
            }
        }

        // 2. Check current assignee's availability
        AvailabilityResult currentAvail = isEmployeeAvailable(currentEmp.getId(), today);
        if (currentAvail.available) {
            log.debug("[SCHEDULER] Currently assigned employee {} is available for assignment {}. No reassignment needed.",
                currentEmp.getEmployeeName(), assignment.getId());
            if (currentAvail.halfDay) {
                notifyManagerHalfDay(assignment, currentEmp);
            }
            assignRepo.save(assignment);
            return;
        }

        log.info("[SCHEDULER] Currently assigned employee {} is unavailable (reason: {}) for assignment {}. Checking hierarchy...",
            currentEmp.getEmployeeName(), currentAvail.reason, assignment.getId());

        // 3. Search hierarchy forwards from currentIdx + 1 for next available backup
        if (currentIdx != -1) {
            for (int i = currentIdx + 1; i < hierarchy.size(); i++) {
                EmployeeMaster backupEmp = hierarchy.get(i);
                AvailabilityResult backupAvail = isEmployeeAvailable(backupEmp.getId(), today);
                if (backupAvail.available) {
                    String backupType = typeNames.get(i);
                    performReassignment(assignment, currentEmp, backupEmp, backupType,
                        currentType + "_" + currentAvail.reason, checklist);
                    return;
                }
            }
        }

        // 4. If we reached here, no one is available in the hierarchy
        StringBuilder reasonBuilder = new StringBuilder("All configured assignees unavailable. ");
        if (currentIdx != -1) {
            reasonBuilder.append(currentType).append(" on leave (").append(currentAvail.reason).append("). ");
            for (int i = currentIdx + 1; i < hierarchy.size(); i++) {
                reasonBuilder.append(typeNames.get(i)).append(" on leave. ");
            }
        }
        performUnAssigned(assignment, checklist, reasonBuilder.toString().trim());
    }

    /**
     * Resolves an EmployeeMaster from a stored ASSIGNED_TO value.
     * The value may be a numeric ID string, emp code, or emp name.
     */
    private Optional<EmployeeMaster> resolveEmployee(String assignedTo) {
        if (assignedTo == null || assignedTo.trim().isEmpty()) return Optional.empty();
        // Try as numeric ID first (most reliable)
        try {
            long id = Long.parseLong(assignedTo.trim());
            return employeeMasterRepository.findById(id);
        } catch (NumberFormatException ignored) {
            // Fall through to name/code lookup
        }
        return employeeMasterRepository.findByEmpCodeOrName(assignedTo.trim());
    }

    /**
     * Performs the actual reassignment of a PRIMARY assignment to a backup employee.
     * Updates the ASSIGNED_TO and ASSIGN_TYPE on the PRIMARY assignment row,
     * logs the event, sends notifications, and saves an audit trail entry.
     */
    private void performReassignment(ChecklistAssignment assignment, EmployeeMaster fromEmp,
                                     EmployeeMaster toEmp, String newAssignType,
                                     String reason, MasterChecklist checklist) {
        String oldAssigneeName = fromEmp.getEmployeeName();
        String newAssigneeName = toEmp.getEmployeeName();
        String oldAssignedTo = assignment.getAssignedTo();
        String oldAssignType = assignment.getAssignType();

        // 1. Overwrite/update the existing assignment row in place
        assignment.setAssignedTo(String.valueOf(toEmp.getId()));
        assignment.setAssignType(newAssignType);
        if (assignment.getReassignedFromType() == null) {
            assignment.setReassignedFromType(oldAssignType);
        }
        assignment.setIsActive(true);
        assignment.setStatus(getOrCreateStatus("Active"));
        assignment.setRemarks(
            "[Auto-Reassigned by Scheduler] Reassigned from: " + oldAssigneeName + " | Reason: " + reason
        );
        assignment.setComments(
            "Alternate checklist dynamically reassigned to backup employee: " + newAssigneeName
        );
        assignment.setUpdatedBy("System");
        assignment.setUpdatedDate(new Date());

        assignRepo.save(assignment);
        checklistService.syncAssignmentUpdate(assignment, oldAssignedTo);

        // Update the MasterChecklist details to point to the currently active assignee
        checklist.setCurrentAssignee(toEmp);
        checklist.setAssignmentType(newAssignType);
        checklist.setAutoAssignedFlag(true);
        checklist.setLastAssignmentDate(new Date());
        checklist.setTaskStatus("Pending");
        masterRepo.save(checklist);

        // Log the reassignment
        ChecklistAssignmentLog logEntry = new ChecklistAssignmentLog();
        logEntry.setChecklistId(checklist.getId());
        logEntry.setOldAssigneeId(fromEmp.getId());
        logEntry.setNewAssigneeId(toEmp.getId());
        logEntry.setAssignmentType(newAssignType);
        logEntry.setReason("SCHEDULER_REASSIGN: " + reason);
        logEntry.setAssignedDate(new Date());
        logEntry.setAssignedBySystem(true);
        logRepo.save(logEntry);

        // Notify the new assignee
        sendNotification(
            toEmp.getId(),
            "Checklist Auto-Reassigned to You",
            String.format("Checklist %s (%s) has been automatically reassigned to you because the previous assignee is on leave/unavailable today.",
                checklist.getSeqNo(), checklist.getCheckingPoint()),
            "/qms/checklist/assignment"
        );

        // Notify manager
        Long managerId = resolveManagerId(fromEmp.getId());
        if (managerId != null) {
            sendNotification(
                managerId,
                "Checklist Reassigned",
                String.format("Checklist %s reassigned from %s to %s (%s) by the scheduler.",
                    checklist.getSeqNo(), oldAssigneeName, newAssigneeName, newAssignType),
                "/qms/checklist/assignment"
            );
        }

        // Audit trail
        try {
            String auditComment = String.format(
                "Checklist: %s | Old Assignee: %s | New Assignee: %s (%s) | Reason: %s | Action: Scheduler Auto-Reassigned",
                checklist.getSeqNo(), oldAssigneeName, newAssigneeName, newAssignType, reason
            );
            auditTrailService.saveAuditTrail(
                "SCHEDULER_REASSIGNED", "QMS_CHECKLIST",
                String.valueOf(checklist.getId()), null, null,
                auditComment, "SYSTEM", "QMS Checklist"
            );
        } catch (Exception e) {
            log.error("[SCHEDULER] Failed to save audit trail for reassignment: {}", e.getMessage());
        }

        log.info("[SCHEDULER] Reassigned checklist {} from {} to {} ({}). Reason: {}",
            checklist.getSeqNo(), oldAssigneeName, newAssigneeName, newAssignType, reason);
    }

    /**
     * Marks the checklist assignment as UN ASSIGNED when:
     *   - Primary is on leave AND no Secondary employee is configured, OR
     *   - Secondary is on leave AND no Tertiary employee is configured.
     * This is distinct from Auto Closed (where all three configured employees are unavailable).
     * Runs at 10:00 AM, 2:00 PM, and 4:00 PM IST via the scheduler.
     */
    private void performUnAssigned(ChecklistAssignment assignment, MasterChecklist checklist, String reason) {
        String oldAssignedTo = assignment.getAssignedTo();

        // Update the assignment row to UN ASSIGNED
        assignment.setStatus(getOrCreateStatus("UN ASSIGNED"));
        assignment.setAssignType("NONE");
        assignment.setRemarks("[UN ASSIGNED by Scheduler] " + reason);
        assignment.setUpdatedBy("System");
        assignment.setUpdatedAt(new Date());
        assignRepo.save(assignment);

        // Sync to closed history table
        checklistService.syncAssignmentUpdate(assignment, oldAssignedTo);

        // Update master checklist task status
        checklist.setTaskStatus("UN ASSIGNED");
        checklist.setCurrentAssignee(null);
        checklist.setAssignmentType("NONE");
        masterRepo.save(checklist);

        // Log the event
        ChecklistAssignmentLog logEntry = new ChecklistAssignmentLog();
        logEntry.setChecklistId(checklist.getId());
        logEntry.setNewAssigneeId(null);
        logEntry.setAssignmentType("NONE");
        logEntry.setReason("SCHEDULER_UNASSIGNED: " + reason);
        logEntry.setAssignedDate(new Date());
        logEntry.setAssignedBySystem(true);
        logRepo.save(logEntry);

        // Notify checklist owner and admins
        Long ownerEmpId = resolveOwnerEmpId(checklist);
        String msg = String.format(
            "Checklist %s (%s) is now UN ASSIGNED because: %s",
            checklist.getSeqNo(), checklist.getCheckingPoint(), reason
        );
        if (ownerEmpId != null) sendNotification(ownerEmpId, "Checklist UN ASSIGNED", msg, "/qms/checklist/assignment");

        try {
            List<Long> adminEmpIds = userRepository.findEmpIdsByUserLevelGreaterThanEqual(5);
            for (Long adminId : adminEmpIds) {
                if (!adminId.equals(ownerEmpId)) {
                    sendNotification(adminId, "Checklist UN ASSIGNED", msg, "/qms/checklist/assignment");
                }
            }
        } catch (Exception e) {
            log.error("[SCHEDULER] Failed to notify admins of UN ASSIGNED status: {}", e.getMessage());
        }

        // Notify Vertical Heads if Carry Forward is NO
        if (!"YES".equalsIgnoreCase(checklist.getCarryForward())) {
            notifyVerticalHeadsForNonAssignment(checklist, reason);
        }

        // Audit trail
        try {
            auditTrailService.saveAuditTrail(
                "SCHEDULER_UNASSIGNED", "QMS_CHECKLIST",
                String.valueOf(checklist.getId()), null, null,
                "Checklist: " + checklist.getSeqNo() + " | Reason: " + reason + " | Action: Scheduler marked UN ASSIGNED",
                "SYSTEM", "QMS Checklist"
            );
        } catch (Exception e) {
            log.error("[SCHEDULER] Failed to save audit trail for UN ASSIGNED: {}", e.getMessage());
        }

        log.warn("[SCHEDULER] Checklist {} marked UN ASSIGNED. Reason: {}", checklist.getSeqNo(), reason);
    }

    private void notifyManagerHalfDay(ChecklistAssignment assignment, EmployeeMaster primaryEmp) {
        try {
            Long managerId = resolveManagerId(primaryEmp.getId());
            if (managerId != null) {
                MasterChecklist checklist = assignment.getChecklist();
                sendNotification(
                    managerId,
                    "Checklist - Primary On Half Day",
                    String.format("Checklist %s (%s) remains assigned to %s who is on half-day leave today. Please review.",
                        checklist.getSeqNo(), checklist.getCheckingPoint(), primaryEmp.getEmployeeName()),
                    "/qms/checklist/assignment"
                );
            }
        } catch (Exception e) {
            log.error("[SCHEDULER] Failed to send half-day notification: {}", e.getMessage());
        }
    }

    private Long resolveOwnerEmpId(MasterChecklist checklist) {
        if (checklist.getCreatedBy() == null) return null;
        try {
            return userRepository.findByUserId(checklist.getCreatedBy())
                .map(com.autonoma.erp.model.admin.UserCredential::getEmpId)
                .orElse(null);
        } catch (Exception e) {
            log.error("[SCHEDULER] Failed to resolve checklist owner: {}", e.getMessage());
            return null;
        }
    }

    // Legacy method kept for backward compatibility (called from ChecklistSchedulerService for OLD processReassignmentIfNeeded)
    @Transactional
    private void processReassignmentIfNeeded(ChecklistAssignment c) {
        // Delegate to the new table-driven scheduler logic
        if (c.getAssignType() != null && "PRIMARY".equalsIgnoreCase(c.getAssignType())) {
            java.time.LocalDate checkDate = c.getChecklistDate() != null
                ? java.time.Instant.ofEpochMilli(c.getChecklistDate().getTime()).atZone(ZoneId.of("Asia/Kolkata")).toLocalDate()
                : java.time.LocalDate.now(ZoneId.of("Asia/Kolkata"));
            processSchedulerReassignment(c, checkDate);
        }
    }

    /**
     * Resolves a manager to notify for the given employee, with fallback:
     * Home Manager -> Business Manager -> Vertical Head. Tolerates legacy rows
     * that only set isActive or only set status='Active'.
     */
    private Long resolveManagerId(Long empId) {
        String cacheKey = "mgr_" + empId;
        java.util.Map<String, Object> cache = getCache();
        if (cache != null && cache.containsKey(cacheKey)) {
            return (Long) cache.get(cacheKey);
        }
        Optional<EmployeeManagerMapping> mappingOpt = managerMappingRepository.findByEmpId(empId);
        if (mappingOpt.isEmpty()) {
            if (cache != null) cache.put(cacheKey, null);
            return null;
        }
        EmployeeManagerMapping m = mappingOpt.get();
        boolean active = (m.getIsActive() == null || Boolean.TRUE.equals(m.getIsActive()))
                && (m.getStatus() == null || "Active".equalsIgnoreCase(m.getStatus()));
        if (!active) {
            if (cache != null) cache.put(cacheKey, null);
            return null;
        }
        Long resolved = null;
        if (m.getHomeManagerId() != null) resolved = m.getHomeManagerId();
        else if (m.getBusinessManagerId() != null) resolved = m.getBusinessManagerId();
        else if (m.getVerticalHeadId() != null) resolved = m.getVerticalHeadId();

        if (cache != null) cache.put(cacheKey, resolved);
        return resolved;
    }

    private void sendNotification(Long recipientEmpId, String title, String message, String link) {
        try {
            AppNotification notification = new AppNotification();
            notification.setRecipientEmpId(recipientEmpId);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setLinkUrl(link);
            notificationRepository.save(notification);

            // Also try sending email notifications if recipient is loaded
            employeeMasterRepository.findById(recipientEmpId).ifPresent(emp -> {
                employeeJobProfileRepository.findByEmployeeId(emp.getId()).ifPresent(jp -> {
                    if (jp.getOfficeEmail() != null && !jp.getOfficeEmail().trim().isEmpty()) {
//                        notificationService.sendMeetingNotification(emp.getEmployeeName(), jp.getOfficeEmail().trim(), title, message);
                    }
                });
            });
        } catch (Exception e) {
            log.error("Failed to send auto-assignment notification for recipient {}: {}", recipientEmpId, e.getMessage());
        }
    }

    private void notifyVerticalHeadsForNonAssignment(MasterChecklist checklist, String reason) {
        Set<Long> verticalHeadIds = new HashSet<>();
        if (checklist.getPrimaryEmployee() != null) {
            Long vhId = resolveVerticalHeadId(checklist.getPrimaryEmployee().getId());
            if (vhId != null) verticalHeadIds.add(vhId);
        }
        if (checklist.getSecondaryEmployee() != null) {
            Long vhId = resolveVerticalHeadId(checklist.getSecondaryEmployee().getId());
            if (vhId != null) verticalHeadIds.add(vhId);
        }
        if (checklist.getTertiaryEmployee() != null) {
            Long vhId = resolveVerticalHeadId(checklist.getTertiaryEmployee().getId());
            if (vhId != null) verticalHeadIds.add(vhId);
        }

        String title = "Checklist Non-Assignment Alert - " + checklist.getSeqNo();
        String message = String.format("Checklist %s (%s) remains UNASSIGNED today because all configured assignees are absent or unavailable. Reason: %s",
                checklist.getSeqNo(), checklist.getCheckingPoint(), reason);

        for (Long vhId : verticalHeadIds) {
            sendNotification(vhId, title, message, "/qms/checklist/assignment");
        }
    }

    private Long resolveVerticalHeadId(Long empId) {
        Optional<EmployeeManagerMapping> mappingOpt = managerMappingRepository.findByEmpId(empId);
        if (mappingOpt.isEmpty()) return null;
        EmployeeManagerMapping m = mappingOpt.get();
        boolean active = (m.getIsActive() == null || Boolean.TRUE.equals(m.getIsActive()))
                && (m.getStatus() == null || "Active".equalsIgnoreCase(m.getStatus()));
        if (!active) return null;
        return m.getVerticalHeadId();
    }

    private StatusMaster getOrCreateStatus(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        String trimmedName = name.trim();
        return statusRepo.findByNameIgnoreCase(trimmedName).orElseGet(() -> {
            StatusMaster sm = new StatusMaster();
            sm.setName(trimmedName);
            return statusRepo.save(sm);
        });
    }

    private static final ThreadLocal<java.util.Map<String, Object>> CACHE = new ThreadLocal<>();

    public static void startCache() {
        CACHE.set(new java.util.HashMap<>());
    }

    public static java.util.Map<String, Object> getCache() {
        return CACHE.get();
    }

    public static void clearCache() {
        CACHE.remove();
    }
}


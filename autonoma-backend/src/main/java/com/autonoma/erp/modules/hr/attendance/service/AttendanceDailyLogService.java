package com.autonoma.erp.modules.hr.attendance.service;

import com.autonoma.erp.modules.hr.attendance.dto.AttendanceDailyLogDTO;
import com.autonoma.erp.modules.hr.attendance.dto.AttendanceDailyLogSaveRequest;
import com.autonoma.erp.modules.hr.attendance.entity.HrAttendanceDailyLog;
import com.autonoma.erp.modules.hr.attendance.entity.HrBiometricAttendance;
import com.autonoma.erp.modules.hr.attendance.entity.ShiftMaster;
import com.autonoma.erp.modules.hr.attendance.repository.HrAttendanceDailyLogRepository;
import com.autonoma.erp.modules.hr.attendance.repository.HrBiometricAttendanceRepository;
import com.autonoma.erp.modules.hr.attendance.repository.ShiftMasterRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import com.autonoma.erp.util.SecurityUtils;

@Service
public class AttendanceDailyLogService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceDailyLogService.class);

    @Autowired
    private HrAttendanceDailyLogRepository dailyLogRepository;

    @Autowired
    private HrBiometricAttendanceRepository biometricRepository;

    @Autowired
    private ShiftMasterRepository shiftMasterRepository;

    @Autowired
    private EmployeeMasterRepository employeeRepository;

    @Autowired(required = false)
    private com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository holidayRepository;

    @Autowired
    private OvertimeCalculationService overtimeCalculationService;

    @Autowired(required = false)
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @Autowired(required = false)
    private com.autonoma.erp.repository.OdEntryRepository odEntryRepository;

    @Autowired(required = false)
    private com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository leaveEntryRepository;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.identity.repository.PermissionEntryRepository permissionEntryRepository;

    @Autowired(required = false)
    private com.autonoma.erp.repository.admin.AppPreferenceRepository appPreferenceRepository;

    private int getLomGraceMinutes() {
        try {
            if (appPreferenceRepository != null) {
                var pref = appPreferenceRepository.findByPrefName("LOM_GRACE_MINUTES");
                if (pref.isPresent() && pref.get().getPrefValue() != null && !pref.get().getPrefValue().trim().isEmpty()) {
                    return Integer.parseInt(pref.get().getPrefValue().trim());
                }
            }
        } catch (Exception e) {}
        return 0;
    }

    private boolean isPermissionWaiveLomEnabled() {
        try {
            if (appPreferenceRepository != null) {
                var pref = appPreferenceRepository.findByPrefName("LOM_PERMISSION_WAIVE");
                if (pref.isPresent() && pref.get().getPrefValue() != null && !pref.get().getPrefValue().trim().isEmpty()) {
                    return "YES".equalsIgnoreCase(pref.get().getPrefValue().trim());
                }
            }
        } catch (Exception e) {}
        return true;
    }

    /**
     * STEPS 1-6: Load daily attendance for all active employees on a given date.
     * Aggregates from HR_BIOMETRIC_ATTENDANCE (ESSL), existing HR_ATTENDANCE_DAILY_LOG (if any),
     * and fills in employee + shift details.
     */
    public List<AttendanceDailyLogDTO> loadDailyAttendance(LocalDate date) {
        // Step 1: Date is received

        // Step 2: Load all active employees
        List<EmployeeMaster> activeEmployees = employeeRepository.findAll();
        // Filter out ATS candidates and inactive employees
        activeEmployees = activeEmployees.stream()
                .filter(emp -> emp.getEmpCode() != null)
                .filter(emp -> emp.getIsActive() == null || emp.getIsActive())
                .collect(Collectors.toList());

        // Pre-load shift masters for lookup
        List<ShiftMaster> allShifts = shiftMasterRepository.findByIsActiveTrue();
        Map<Long, ShiftMaster> shiftById = allShifts.stream()
                .collect(Collectors.toMap(ShiftMaster::getId, s -> s, (a, b) -> a));
        Map<String, ShiftMaster> shiftByName = allShifts.stream()
                .filter(s -> s.getShiftName() != null)
                .collect(Collectors.toMap(
                        s -> s.getShiftName().toUpperCase().trim(),
                        s -> s,
                        (a, b) -> a));
        Map<String, ShiftMaster> shiftByCode = allShifts.stream()
                .filter(s -> s.getShiftCode() != null)
                .collect(Collectors.toMap(
                        s -> s.getShiftCode().toUpperCase().trim(),
                        s -> s,
                        (a, b) -> a));

        // Step 5: Fetch raw biometric attendance for date
        List<HrBiometricAttendance> biometricRecords = biometricRepository
                .findByAttendanceDateBetween(date, date);
        Map<Long, HrBiometricAttendance> biometricByEmpId = biometricRecords.stream()
                .collect(Collectors.toMap(
                        HrBiometricAttendance::getEmployeeId,
                        b -> b,
                        (a, b) -> a));

        // Fetch existing daily log entries if any
        List<HrAttendanceDailyLog> existingLogs = dailyLogRepository.findByAttendanceDate(date);
        Map<Long, HrAttendanceDailyLog> existingByEmpId = existingLogs.stream()
                .collect(Collectors.toMap(
                        HrAttendanceDailyLog::getEmpId,
                        l -> l,
                        (a, b) -> a));

        // Pre-fetch OD entries for date
        Map<Long, com.autonoma.erp.model.OdEntry> odByEmpId = new HashMap<>();
        if (odEntryRepository != null && date != null) {
            try {
                java.time.LocalDateTime startLdt = date.atStartOfDay();
                java.time.LocalDateTime endLdt = date.atTime(23, 59, 59);
                java.util.Date startOfDay = java.util.Date.from(startLdt.atZone(java.time.ZoneId.systemDefault()).toInstant());
                java.util.Date endOfDay = java.util.Date.from(endLdt.atZone(java.time.ZoneId.systemDefault()).toInstant());
                List<com.autonoma.erp.model.OdEntry> ods = odEntryRepository.findByDateRange(startOfDay, endOfDay);
                for (com.autonoma.erp.model.OdEntry od : ods) {
                    if (od.getEmployeeId() != null) {
                        odByEmpId.put(od.getEmployeeId(), od);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not pre-fetch OD entries for date {}: {}", date, e.getMessage());
            }
        }

        // Pre-fetch Leave entries for date
        Map<Long, com.autonoma.erp.modules.hr.leave.entity.LeaveEntry> leaveByEmpId = new HashMap<>();
        if (leaveEntryRepository != null && date != null) {
            try {
                java.time.LocalDateTime startLdt = date.atStartOfDay();
                java.time.LocalDateTime endLdt = date.atTime(23, 59, 59);
                java.util.Date startOfDay = java.util.Date.from(startLdt.atZone(java.time.ZoneId.systemDefault()).toInstant());
                java.util.Date endOfDay = java.util.Date.from(endLdt.atZone(java.time.ZoneId.systemDefault()).toInstant());
                List<com.autonoma.erp.modules.hr.leave.entity.LeaveEntry> leaves = leaveEntryRepository.findByDateRange(startOfDay, endOfDay);
                for (com.autonoma.erp.modules.hr.leave.entity.LeaveEntry l : leaves) {
                    if (l.getEmployeeId() != null) {
                        leaveByEmpId.put(l.getEmployeeId(), l);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not pre-fetch Leave entries for date {}: {}", date, e.getMessage());
            }
        }

        // Pre-fetch Approved Permission entries for date
        Map<Long, com.autonoma.erp.modules.platform.identity.entity.PermissionEntry> permByEmpId = new HashMap<>();
        if (permissionEntryRepository != null && date != null) {
            try {
                java.util.Date targetDate = java.util.Date.from(date.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());
                List<com.autonoma.erp.modules.platform.identity.entity.PermissionEntry> perms = permissionEntryRepository.findApprovedByDate(targetDate);
                for (com.autonoma.erp.modules.platform.identity.entity.PermissionEntry p : perms) {
                    if (p.getEmployeeId() != null) {
                        permByEmpId.put(p.getEmployeeId(), p);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not pre-fetch Permission entries for date {}: {}", date, e.getMessage());
            }
        }

        List<AttendanceDailyLogDTO> result = new ArrayList<>();

        for (EmployeeMaster emp : activeEmployees) {
            AttendanceDailyLogDTO dto = new AttendanceDailyLogDTO();

            String displayEmpCode = (emp.getOldEmpCode() != null && !emp.getOldEmpCode().trim().isEmpty())
                    ? emp.getOldEmpCode().trim()
                    : emp.getEmpCode();
            dto.setEmpCode(displayEmpCode);
            dto.setEmpName(emp.getEmployeeName());
            dto.setDepartment(emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : null);
            dto.setDesignation(emp.getDesignation() != null ? emp.getDesignation().getDesignationName() : null);
            dto.setAttendanceDate(date);
            dto.setOtEligible(emp.getOtToggle() != null ? emp.getOtToggle() : "NO");

            // Step 4: Resolve shift from ShiftMaster
            ShiftMaster resolvedShift = resolveShift(emp, shiftById, shiftByName, shiftByCode);
            if (resolvedShift != null) {
                dto.setShiftId(resolvedShift.getId());
                dto.setShiftCode(resolvedShift.getShiftCode());
                dto.setShiftName(resolvedShift.getShiftName());
                dto.setShiftStartTime(resolvedShift.getStartTime());
                dto.setShiftEndTime(resolvedShift.getEndTime());
                dto.setGraceMinutes(resolvedShift.getGraceMinutes());
            }

            // Check if existing daily log record exists
            HrAttendanceDailyLog existingLog = existingByEmpId.get(emp.getId());
            com.autonoma.erp.model.OdEntry od = odByEmpId.get(emp.getId());
            com.autonoma.erp.modules.hr.leave.entity.LeaveEntry leave = leaveByEmpId.get(emp.getId());

            if (existingLog != null) {
                // If existing log was saved as Absent (or no punches), but an Approved OD or Leave exists now, auto-override it!
                boolean isAbsentLog = "Absent".equalsIgnoreCase(existingLog.getAttType()) || (existingLog.getInTime() == null && existingLog.getOutTime() == null);
                if (isAbsentLog && (od != null || leave != null)) {
                    dto.setId(existingLog.getId());
                    if (od != null) {
                        dto.setFromWhere("OD");
                        dto.setAttType("Present");
                        if (od.getOdFromDateTime() != null) {
                            dto.setInTime(java.time.LocalDateTime.ofInstant(od.getOdFromDateTime().toInstant(), java.time.ZoneId.systemDefault()).toLocalTime());
                        } else if (resolvedShift != null && resolvedShift.getStartTime() != null) {
                            dto.setInTime(java.time.LocalTime.parse(resolvedShift.getStartTime()));
                        }
                        if (od.getOdToDateTime() != null) {
                            dto.setOutTime(java.time.LocalDateTime.ofInstant(od.getOdToDateTime().toInstant(), java.time.ZoneId.systemDefault()).toLocalTime());
                        } else if (resolvedShift != null && resolvedShift.getEndTime() != null) {
                            dto.setOutTime(java.time.LocalTime.parse(resolvedShift.getEndTime()));
                        }
                        String purpose = od.getPurposeOfOd() != null && !od.getPurposeOfOd().trim().isEmpty()
                                ? od.getPurposeOfOd().trim()
                                : "Official Duty";
                        dto.setRemarks("OD: " + purpose);
                    } else {
                        dto.setFromWhere("LEAVE");
                        String lType = leave.getLeaveType() != null && !leave.getLeaveType().trim().isEmpty()
                                ? leave.getLeaveType().trim()
                                : "SL";
                        dto.setAttType(lType);
                        String reason = leave.getReason() != null && !leave.getReason().trim().isEmpty()
                                ? leave.getReason().trim()
                                : "Leave Applied";
                        dto.setRemarks("Leave: " + reason);
                    }
                    calculateMetrics(dto);
                } else {
                    // Use persisted values
                    dto.setId(existingLog.getId());
                    dto.setInTime(existingLog.getInTime());
                    dto.setOutTime(existingLog.getOutTime());
                    dto.setEarlyIn(existingLog.getEarlyIn());
                    dto.setEarlyOut(existingLog.getEarlyOut());
                    dto.setDuration(existingLog.getDuration());
                    dto.setLom(existingLog.getLom());
                    dto.setOt(existingLog.getOt());
                    dto.setAttType(existingLog.getAttType());
                    dto.setRemarks(existingLog.getRemarks());
                    dto.setFromWhere(existingLog.getFromWhere());
                    // Override shift from log if present
                    if (existingLog.getShiftId() != null) {
                        ShiftMaster logShift = shiftById.get(existingLog.getShiftId());
                        if (logShift != null) {
                            dto.setShiftId(logShift.getId());
                            dto.setShiftCode(logShift.getShiftCode());
                            dto.setShiftName(logShift.getShiftName());
                            dto.setShiftStartTime(logShift.getStartTime());
                            dto.setShiftEndTime(logShift.getEndTime());
                            dto.setGraceMinutes(logShift.getGraceMinutes());
                        }
                    }
                }
            } else {
                // Pre-populate from biometric if available
                HrBiometricAttendance bio = biometricByEmpId.get(emp.getId());

                // Biometric punches take precedence if employee came to work (even on Leave/WO/Holiday)
                if (bio != null) {
                    dto.setInTime(bio.getPunchIn());
                    dto.setOutTime(bio.getPunchOut());
                    dto.setFromWhere("ESSL");
                    // Use biometric shift if available
                    if (bio.getShiftId() != null && shiftById.containsKey(bio.getShiftId())) {
                        ShiftMaster bioShift = shiftById.get(bio.getShiftId());
                        dto.setShiftId(bioShift.getId());
                        dto.setShiftCode(bioShift.getShiftCode());
                        dto.setShiftName(bioShift.getShiftName());
                        dto.setShiftStartTime(bioShift.getStartTime());
                        dto.setShiftEndTime(bioShift.getEndTime());
                        dto.setGraceMinutes(bioShift.getGraceMinutes());
                    }
                } else if (od != null) {
                    dto.setFromWhere("OD");
                    dto.setAttType("Present");
                    if (od.getOdFromDateTime() != null) {
                        dto.setInTime(java.time.LocalDateTime.ofInstant(od.getOdFromDateTime().toInstant(), java.time.ZoneId.systemDefault()).toLocalTime());
                    } else if (resolvedShift != null && resolvedShift.getStartTime() != null) {
                        dto.setInTime(java.time.LocalTime.parse(resolvedShift.getStartTime()));
                    }
                    if (od.getOdToDateTime() != null) {
                        dto.setOutTime(java.time.LocalDateTime.ofInstant(od.getOdToDateTime().toInstant(), java.time.ZoneId.systemDefault()).toLocalTime());
                    } else if (resolvedShift != null && resolvedShift.getEndTime() != null) {
                        dto.setOutTime(java.time.LocalTime.parse(resolvedShift.getEndTime()));
                    }
                    String purpose = od.getPurposeOfOd() != null && !od.getPurposeOfOd().trim().isEmpty()
                            ? od.getPurposeOfOd().trim()
                            : "Official Duty";
                    dto.setRemarks("OD: " + purpose);
                } else if (leave != null) {
                    dto.setFromWhere("LEAVE");
                    String lType = leave.getLeaveType() != null && !leave.getLeaveType().trim().isEmpty()
                            ? leave.getLeaveType().trim()
                            : "SL";
                    dto.setAttType(lType);
                    String reason = leave.getReason() != null && !leave.getReason().trim().isEmpty()
                            ? leave.getReason().trim()
                            : "Leave Applied";
                    dto.setRemarks("Leave: " + reason);
                } else {
                    dto.setFromWhere("MANUAL");
                    // Sunday or Holiday default status when no punch logs exist
                    if (date != null && dto.getInTime() == null && dto.getOutTime() == null) {
                        if (date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                            dto.setAttType("WO");
                        } else if (holidayRepository != null) {
                            List<com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster> holList = holidayRepository.findByHolidayDateAndIsActiveTrue(date);
                            if (holList != null && !holList.isEmpty()) {
                                com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster hol = holList.get(0);
                                dto.setAttType("Holiday");
                                dto.setRemarks(hol.getHolidayName());
                            }
                        }
                    }
                }

                // Steps 8-13: Calculate metrics
                calculateMetrics(dto);
            }

            // Apply Approved Permission Waiver for LOM and Early Out if present
            com.autonoma.erp.modules.platform.identity.entity.PermissionEntry perm = permByEmpId.get(emp.getId());
            if (perm != null && isPermissionWaiveLomEnabled()) {
                int permMins = 0;
                if (perm.getConsideredDuration() != null) {
                    permMins = (int) (perm.getConsideredDuration().doubleValue() * 60);
                } else if (perm.getFromTime() != null && perm.getToTime() != null) {
                    try {
                        LocalTime pf = LocalTime.parse(perm.getFromTime().trim());
                        LocalTime pt = LocalTime.parse(perm.getToTime().trim());
                        permMins = (int) ChronoUnit.MINUTES.between(pf, pt);
                    } catch (Exception e) {}
                }
                if (permMins > 0) {
                    if (dto.getLom() != null && dto.getLom() > 0) {
                        int remainingLom = Math.max(0, dto.getLom() - permMins);
                        int waived = dto.getLom() - remainingLom;
                        dto.setLom(remainingLom);
                        permMins -= waived;
                    }
                    if (permMins > 0 && dto.getEarlyOut() != null && dto.getEarlyOut() > 0) {
                        int remainingEo = Math.max(0, dto.getEarlyOut() - permMins);
                        dto.setEarlyOut(remainingEo);
                    }
                    String currentRemarks = dto.getRemarks() != null ? dto.getRemarks() : "";
                    if (!currentRemarks.contains("Permission")) {
                        dto.setRemarks((currentRemarks + " [Permission Approved]").trim());
                    }
                }
            }

            dto.setIsModified(false);
            result.add(dto);
        }

        // Sort by emp code
        result.sort(Comparator.comparing(
                AttendanceDailyLogDTO::getEmpCode,
                Comparator.nullsLast(String::compareToIgnoreCase)));

        return result;
    }

    /**
     * Resolve shift for an employee by matching shiftName to ShiftMaster.
     * If the employee's shift is not found in any ShiftMaster, return null (don't map).
     */
    private ShiftMaster resolveShift(EmployeeMaster emp,
                                     Map<Long, ShiftMaster> shiftById,
                                     Map<String, ShiftMaster> shiftByName,
                                     Map<String, ShiftMaster> shiftByCode) {
        // Try to resolve from employee's shiftName
        String empShiftName = emp.getShiftName();
        if (empShiftName != null && !empShiftName.trim().isEmpty()) {
            String key = empShiftName.toUpperCase().trim();
            // 1. Try matching by shift name
            ShiftMaster match = shiftByName.get(key);
            if (match != null) return match;
            // 2. Try matching by shift code
            match = shiftByCode.get(key);
            if (match != null) return match;
            // 3. Shift not found in master — don't map it
            log.debug("Shift '{}' for employee {} not found in ShiftMaster; leaving unmapped.",
                    empShiftName, emp.getEmpCode());
            return null;
        }
        // No shift assigned to employee — don't map
        return null;
    }

    /**
     * STEPS 8-13: Stateless calculation engine.
     * Computes DURATION, LOM, EARLY_OUT, ATT_TYPE, OT from in/out times and shift rules.
     * All output values are INTEGER MINUTES.
     */
    public AttendanceDailyLogDTO calculateMetrics(AttendanceDailyLogDTO dto) {
        LocalTime inTime = dto.getInTime();
        LocalTime outTime = dto.getOutTime();

        // Step 11: Determine ATT_TYPE first
        if (inTime == null && outTime == null) {
            // Preserve approved OD, LEAVE, WO, or Holiday status when no punch times exist
            if ("OD".equalsIgnoreCase(dto.getFromWhere()) || "LEAVE".equalsIgnoreCase(dto.getFromWhere())
                    || "WO".equalsIgnoreCase(dto.getAttType()) || "Holiday".equalsIgnoreCase(dto.getAttType())
                    || (dto.getAttType() != null && !dto.getAttType().trim().isEmpty() && !"Absent".equalsIgnoreCase(dto.getAttType()))) {
                dto.setDuration(0);
                dto.setLom(0);
                dto.setEarlyOut(0);
                dto.setEarlyIn(0);
                dto.setOt(0);
                return dto;
            }
            dto.setAttType("Absent");
            dto.setDuration(0);
            dto.setLom(0);
            dto.setEarlyOut(0);
            dto.setEarlyIn(0);
            dto.setOt(0);
            return dto;
        }
        if (inTime != null && outTime == null) {
            dto.setAttType("SP");
            // Cannot calculate full metrics without out time
            dto.setDuration(0);
            dto.setLom(0);
            dto.setEarlyOut(0);
            dto.setEarlyIn(0);
            dto.setOt(0);
            return dto;
        }
        // Both times present
        dto.setAttType("Present");

        // Parse shift times
        LocalTime shiftStart = parseTime(dto.getShiftStartTime());
        LocalTime shiftEnd = parseTime(dto.getShiftEndTime());

        // Step 8: DURATION = absolute minutes between in and out (handling night shift crossover)
        long durationMinutes = ChronoUnit.MINUTES.between(inTime, outTime);
        if (outTime.isBefore(inTime)) {
            durationMinutes += 24 * 60; // 1440 mins midnight crossover
        }
        if (durationMinutes < 0) durationMinutes = 0; // safety
        dto.setDuration((int) durationMinutes);

        // Calculate required shift minutes to determine Half Day (HD) vs Present
        int requiredShiftMinutes = 480; // Default 8 hours
        if (shiftStart != null && shiftEnd != null) {
            long shiftMins = ChronoUnit.MINUTES.between(shiftStart, shiftEnd);
            if (shiftEnd.isBefore(shiftStart)) {
                shiftMins += 24 * 60;
            }
            if (shiftMins > 0) requiredShiftMinutes = (int) shiftMins;
        }

        // Half Day Classification Rule: Worked duration < 50% of required shift duration -> HD (Half Day)
        if (durationMinutes < (requiredShiftMinutes / 2)) {
            dto.setAttType("HD");
        } else {
            dto.setAttType("Present");
        }

        // Step 9: LOM (Loss of Minutes) = late arrival minutes
        int lom = 0;
        if (shiftStart != null && inTime.isAfter(shiftStart)) {
            int rawLom = (int) ChronoUnit.MINUTES.between(shiftStart, inTime);
            int grace = getLomGraceMinutes();
            if (rawLom > grace) {
                lom = rawLom;
            }
        }
        dto.setLom(lom);

        // Step 10: EARLY_OUT = early departure minutes
        int earlyOut = 0;
        if (shiftEnd != null && outTime.isBefore(shiftEnd)) {
            earlyOut = (int) ChronoUnit.MINUTES.between(outTime, shiftEnd);
        }
        dto.setEarlyOut(earlyOut);

        // EARLY_IN (reserved, default 0)
        dto.setEarlyIn(0);

        // Step 13: OT (Overtime) — only if employee is OT eligible and meets OT_MIN_MINUTES interval
        int ot = 0;
        if ("YES".equalsIgnoreCase(dto.getOtEligible()) && shiftEnd != null && outTime.isAfter(shiftEnd)) {
            int extraMins = (int) ChronoUnit.MINUTES.between(shiftEnd, outTime);
            int stepMins = overtimeCalculationService != null ? overtimeCalculationService.getOtMinMinutes() : 30;
            if (extraMins >= stepMins) {
                ot = (extraMins / stepMins) * stepMins;
            }
        }
        dto.setOt(ot);

        return dto;
    }

    /**
     * Parse "HH:mm" string to LocalTime, returns null on failure.
     */
    private LocalTime parseTime(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) return null;
        try {
            return LocalTime.parse(timeStr.trim());
        } catch (Exception e) {
            log.warn("Failed to parse time string: {}", timeStr);
            return null;
        }
    }

    /**
     * STEP 14: Validate entry before save.
     * If fromWhere is MANUAL, remarks are mandatory.
     * Enforces date-based user access controls (Normal user = Today, Manager = past 3 days, Add1 = Unlimited).
     */
    public void validateEntry(AttendanceDailyLogSaveRequest req) {
        if (req.getEmpId() == null) {
            throw new IllegalArgumentException("Employee ID is required.");
        }
        if (req.getAttendanceDate() == null) {
            throw new IllegalArgumentException("Attendance date is required.");
        }
        if (req.getShiftId() == null) {
            throw new IllegalArgumentException("Shift ID is required.");
        }

        // Enforce date-based access control rules
        validateSaveDatePermission(req.getAttendanceDate());

        // Mandatory remarks check for manual entries
        if ("MANUAL".equalsIgnoreCase(req.getFromWhere())) {
            if (req.getRemarks() == null || req.getRemarks().trim().isEmpty()) {
                throw new IllegalArgumentException(
                        "Remarks are mandatory for manual attendance entries. " +
                        "Please provide a reason (e.g., Forgot Punch Out, Manual Correction, Official Duty, Late Approval).");
            }
        }
        // Validate outTime is not before inTime
        if (req.getInTime() != null && req.getOutTime() != null && req.getOutTime().isBefore(req.getInTime())) {
            throw new IllegalArgumentException("Out Time cannot be before In Time.");
        }
    }

    /**
     * Validate user permissions for past date attendance entries.
     */
    public void validateSaveDatePermission(LocalDate attendanceDate) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || "SYSTEM".equalsIgnoreCase(currentUserId)) {
            return; // Internal execution context
        }

        LocalDate today = LocalDate.now();
        if (attendanceDate.isAfter(today)) {
            throw new IllegalArgumentException("Future attendance dates are not allowed.");
        }
        if (attendanceDate.equals(today)) {
            return; // Today allowed for all users
        }

        String pageCode = "HA1345";
        
        // 1. Add 1 / Admin permission (additional1) -> Any past date allowed
        if (authService != null && (authService.hasPermission(currentUserId, pageCode, "additional1")
                || authService.hasPermission(currentUserId, pageCode, "add1"))) {
            return;
        }

        // 2. Manager permission -> Up to 3 days in the past allowed
        if (authService != null && authService.hasPermission(currentUserId, pageCode, "manager")) {
            LocalDate minAllowed = today.minusDays(3);
            if (attendanceDate.isBefore(minAllowed)) {
                throw new IllegalArgumentException("Manager access permits attendance entries up to 3 days in the past only.");
            }
            return;
        }

        // 3. Normal User -> Today only (no past dates)
        throw new IllegalArgumentException("Normal user access permits attendance entries for Today only.");
    }

    /**
     * STEPS 15-16: Save a single attendance entry (upsert).
     * Runs calculation engine before persisting.
     */
    @Transactional
    public AttendanceDailyLogDTO saveEntry(AttendanceDailyLogSaveRequest req) {
        validateEntry(req);

        // Build DTO for calculation
        ShiftMaster shift = shiftMasterRepository.findById(req.getShiftId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid Shift ID: " + req.getShiftId()));

        // Resolve OT eligibility from employee
        EmployeeMaster emp = employeeRepository.findById(req.getEmpId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid Employee ID: " + req.getEmpId()));

        AttendanceDailyLogDTO calcDto = new AttendanceDailyLogDTO();
        calcDto.setInTime(req.getInTime());
        calcDto.setOutTime(req.getOutTime());
        calcDto.setShiftStartTime(shift.getStartTime());
        calcDto.setShiftEndTime(shift.getEndTime());
        calcDto.setGraceMinutes(shift.getGraceMinutes());
        calcDto.setOtEligible(emp.getOtToggle() != null ? emp.getOtToggle() : "NO");

        // Run calculation engine
        calculateMetrics(calcDto);

        // Upsert: check if record exists for (empId, date)
        Optional<HrAttendanceDailyLog> existingOpt = dailyLogRepository
                .findByEmpIdAndAttendanceDate(req.getEmpId(), req.getAttendanceDate());

        HrAttendanceDailyLog entity;
        if (existingOpt.isPresent()) {
            entity = existingOpt.get();
        } else {
            entity = new HrAttendanceDailyLog();
            entity.setEmpId(req.getEmpId());
            entity.setAttendanceDate(req.getAttendanceDate());
        }

        // Apply values
        entity.setShiftId(req.getShiftId());
        entity.setInTime(req.getInTime());
        entity.setOutTime(req.getOutTime());
        entity.setEarlyIn(calcDto.getEarlyIn() != null ? calcDto.getEarlyIn() : 0);
        entity.setEarlyOut(calcDto.getEarlyOut() != null ? calcDto.getEarlyOut() : 0);
        entity.setDuration(calcDto.getDuration() != null ? calcDto.getDuration() : 0);
        entity.setLom(calcDto.getLom() != null ? calcDto.getLom() : 0);
        entity.setOt(calcDto.getOt() != null ? calcDto.getOt() : 0);
        entity.setAttType(calcDto.getAttType() != null ? calcDto.getAttType() : req.getAttType());
        entity.setRemarks(req.getRemarks());
        entity.setFromWhere(req.getFromWhere() != null ? req.getFromWhere() : "MANUAL");
        entity.setIsActive(true);

        entity = dailyLogRepository.save(entity);

        // Build response DTO
        return buildResponseDTO(entity, emp, shift);
    }

    /**
     * Batch save all entries for a date with high-performance UPSERT.
     * Pre-fetches all employee & shift records, resolves missing IDs by empCode,
     * matches existing logs by (empId, attendanceDate) to perform UPSERT,
     * calculates all metrics (Duration, LOM, Early Out, OT),
     * and performs chunked batch inserts/updates (200 records per flush).
     */
    @Transactional
    public List<AttendanceDailyLogDTO> saveBulk(List<AttendanceDailyLogSaveRequest> entries) {
        if (entries == null || entries.isEmpty()) {
            return Collections.emptyList();
        }

        // 1. Resolve all EmployeeMaster references (by empId or empCode)
        List<EmployeeMaster> allEmployees = employeeRepository.findAll();
        Map<Long, EmployeeMaster> empByIdMap = allEmployees.stream()
                .filter(e -> e.getId() != null)
                .collect(Collectors.toMap(EmployeeMaster::getId, e -> e, (a, b) -> a));
        Map<String, EmployeeMaster> empByCodeMap = new HashMap<>();
        for (EmployeeMaster e : allEmployees) {
            if (e.getEmpCode() != null && !e.getEmpCode().trim().isEmpty()) {
                empByCodeMap.put(e.getEmpCode().trim().toUpperCase(), e);
            }
            if (e.getOldEmpCode() != null && !e.getOldEmpCode().trim().isEmpty()) {
                empByCodeMap.put(e.getOldEmpCode().trim().toUpperCase(), e);
            }
        }

        // 2. Resolve ShiftMaster references
        List<ShiftMaster> activeShifts = shiftMasterRepository.findByIsActiveTrue();
        if (activeShifts.isEmpty()) {
            activeShifts = shiftMasterRepository.findAll();
        }
        Map<Long, ShiftMaster> shiftByIdMap = activeShifts.stream()
                .filter(s -> s.getId() != null)
                .collect(Collectors.toMap(ShiftMaster::getId, s -> s, (a, b) -> a));
        ShiftMaster defaultShift = !activeShifts.isEmpty() ? activeShifts.get(0) : null;

        // 3. Find min & max attendance dates for batch querying existing logs
        LocalDate minDate = entries.stream()
                .map(AttendanceDailyLogSaveRequest::getAttendanceDate)
                .filter(Objects::nonNull)
                .min(LocalDate::compareTo)
                .orElse(LocalDate.now());
        LocalDate maxDate = entries.stream()
                .map(AttendanceDailyLogSaveRequest::getAttendanceDate)
                .filter(Objects::nonNull)
                .max(LocalDate::compareTo)
                .orElse(LocalDate.now());

        List<HrAttendanceDailyLog> existingLogs = dailyLogRepository.findByAttendanceDateBetween(minDate, maxDate);
        Map<String, HrAttendanceDailyLog> existingLogMap = existingLogs.stream()
                .collect(Collectors.toMap(l -> l.getEmpId() + "_" + l.getAttendanceDate(), l -> l, (a, b) -> a));

        List<HrAttendanceDailyLog> entitiesToSave = new ArrayList<>();
        List<AttendanceDailyLogDTO> results = new ArrayList<>();

        for (AttendanceDailyLogSaveRequest req : entries) {
            if (req.getAttendanceDate() == null) continue;

            // Resolve employee
            EmployeeMaster emp = null;
            if (req.getEmpId() != null) {
                emp = empByIdMap.get(req.getEmpId());
            }
            if (emp == null && req.getEmpCode() != null) {
                emp = empByCodeMap.get(req.getEmpCode().trim().toUpperCase());
            }
            if (emp == null) {
                log.warn("Skipping attendance bulk row: Employee not found for empId={}, empCode={}", req.getEmpId(), req.getEmpCode());
                continue;
            }

            // Resolve shift
            ShiftMaster shift = req.getShiftId() != null ? shiftByIdMap.get(req.getShiftId()) : null;
            if (shift == null) {
                shift = defaultShift;
            }

            // Prepare metrics calculation DTO
            AttendanceDailyLogDTO calcDto = new AttendanceDailyLogDTO();
            calcDto.setInTime(req.getInTime());
            calcDto.setOutTime(req.getOutTime());
            calcDto.setShiftStartTime(shift != null && shift.getStartTime() != null ? shift.getStartTime() : "09:00");
            calcDto.setShiftEndTime(shift != null && shift.getEndTime() != null ? shift.getEndTime() : "18:00");
            calcDto.setGraceMinutes(shift != null && shift.getGraceMinutes() != null ? shift.getGraceMinutes() : 15);
            calcDto.setOtEligible(emp.getOtToggle() != null ? emp.getOtToggle() : "NO");
            calcDto.setAttType(req.getAttType());

            calculateMetrics(calcDto);

            // Upsert lookup
            String key = emp.getId() + "_" + req.getAttendanceDate();
            HrAttendanceDailyLog entity = existingLogMap.get(key);
            if (entity == null) {
                entity = new HrAttendanceDailyLog();
                entity.setEmpId(emp.getId());
                entity.setAttendanceDate(req.getAttendanceDate());
            }

            entity.setShiftId(shift != null ? shift.getId() : 1L);
            entity.setInTime(req.getInTime());
            entity.setOutTime(req.getOutTime());
            entity.setEarlyIn(calcDto.getEarlyIn() != null ? calcDto.getEarlyIn() : 0);
            entity.setEarlyOut(calcDto.getEarlyOut() != null ? calcDto.getEarlyOut() : 0);
            entity.setDuration(calcDto.getDuration() != null ? calcDto.getDuration() : 0);
            entity.setLom(calcDto.getLom() != null ? calcDto.getLom() : 0);
            entity.setOt(calcDto.getOt() != null ? calcDto.getOt() : 0);
            entity.setAttType(calcDto.getAttType() != null ? calcDto.getAttType() : "Present");
            entity.setRemarks(req.getRemarks() != null ? req.getRemarks() : "Bulk Import Entry");
            entity.setFromWhere(req.getFromWhere() != null ? req.getFromWhere() : "MANUAL");
            entity.setIsActive(true);

            entitiesToSave.add(entity);
            results.add(buildResponseDTO(entity, emp, shift != null ? shift : new ShiftMaster()));
        }

        // Chunked batch save (200 records per flush)
        if (!entitiesToSave.isEmpty()) {
            int batchSize = 200;
            for (int i = 0; i < entitiesToSave.size(); i += batchSize) {
                int end = Math.min(i + batchSize, entitiesToSave.size());
                dailyLogRepository.saveAll(entitiesToSave.subList(i, end));
                dailyLogRepository.flush();
            }
        }

        log.info("Successfully executed batch save/UPSERT for {} attendance records", entitiesToSave.size());
        return results;
    }

    /**
     * Build a response DTO from entity + resolved employee and shift.
     */
    private AttendanceDailyLogDTO buildResponseDTO(HrAttendanceDailyLog entity,
                                                    EmployeeMaster emp,
                                                    ShiftMaster shift) {
        String displayCode = (emp.getOldEmpCode() != null && !emp.getOldEmpCode().trim().isEmpty())
                ? emp.getOldEmpCode().trim()
                : emp.getEmpCode();

        return AttendanceDailyLogDTO.builder()
                .id(entity.getId())
                .empId(entity.getEmpId())
                .empCode(displayCode)
                .empName(emp.getEmployeeName())
                .department(emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : null)
                .designation(emp.getDesignation() != null ? emp.getDesignation().getDesignationName() : null)
                .shiftId(shift.getId())
                .shiftCode(shift.getShiftCode())
                .shiftName(shift.getShiftName())
                .shiftStartTime(shift.getStartTime())
                .shiftEndTime(shift.getEndTime())
                .graceMinutes(shift.getGraceMinutes())
                .attendanceDate(entity.getAttendanceDate())
                .inTime(entity.getInTime())
                .outTime(entity.getOutTime())
                .earlyIn(entity.getEarlyIn())
                .earlyOut(entity.getEarlyOut())
                .duration(entity.getDuration())
                .lom(entity.getLom())
                .ot(entity.getOt())
                .attType(entity.getAttType())
                .remarks(entity.getRemarks())
                .fromWhere(entity.getFromWhere())
                .otEligible(emp.getOtToggle() != null ? emp.getOtToggle() : "NO")
                .isModified(false)
                .build();
    }

    /**
     * Batch save biometric daily logs to avoid N+1 queries.
     */
    @Transactional
    public void saveBiometricDailyLogsBatch(List<HrBiometricAttendance> biometricAttendances, Long defaultShiftId) {
        if (biometricAttendances == null || biometricAttendances.isEmpty()) return;

        // 1. Get all distinct employee IDs
        Set<Long> empIds = biometricAttendances.stream()
                .map(HrBiometricAttendance::getEmployeeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 2. Fetch all employees in one query
        List<EmployeeMaster> employees = employeeRepository.findAllById(empIds);
        Map<Long, EmployeeMaster> employeeMap = employees.stream()
                .collect(Collectors.toMap(EmployeeMaster::getId, e -> e));

        // 3. Fetch all shifts
        List<ShiftMaster> activeShifts = shiftMasterRepository.findByIsActiveTrue();
        if (activeShifts.isEmpty()) {
            activeShifts = shiftMasterRepository.findAll();
        }
        Map<Long, ShiftMaster> shiftMap = activeShifts.stream()
                .collect(Collectors.toMap(ShiftMaster::getId, s -> s, (s1, s2) -> s1));
        ShiftMaster defaultShift = defaultShiftId != null ? shiftMap.get(defaultShiftId) : (!activeShifts.isEmpty() ? activeShifts.get(0) : null);

        // 4. Find min and max dates to fetch existing daily logs in one query
        LocalDate minDate = biometricAttendances.stream()
                .map(HrBiometricAttendance::getAttendanceDate)
                .filter(Objects::nonNull)
                .min(LocalDate::compareTo)
                .orElse(null);
        LocalDate maxDate = biometricAttendances.stream()
                .map(HrBiometricAttendance::getAttendanceDate)
                .filter(Objects::nonNull)
                .max(LocalDate::compareTo)
                .orElse(null);

        Map<String, HrAttendanceDailyLog> existingLogsMap = new HashMap<>();
        if (minDate != null && maxDate != null) {
            List<HrAttendanceDailyLog> existingLogs = dailyLogRepository.findByAttendanceDateBetween(minDate, maxDate);
            for (HrAttendanceDailyLog log : existingLogs) {
                existingLogsMap.put(log.getEmpId() + "_" + log.getAttendanceDate(), log);
            }
        }

        List<HrAttendanceDailyLog> logsToSave = new ArrayList<>();

        for (HrBiometricAttendance att : biometricAttendances) {
            EmployeeMaster emp = employeeMap.get(att.getEmployeeId());
            if (emp == null) continue;

            Long shiftId = att.getShiftId() != null ? att.getShiftId() : (defaultShift != null ? defaultShift.getId() : 1L);
            ShiftMaster shift = shiftMap.get(shiftId);
            if (shift == null) shift = defaultShift;

            String startTime = (shift != null && shift.getStartTime() != null) ? shift.getStartTime() : "09:00";
            String endTime = (shift != null && shift.getEndTime() != null) ? shift.getEndTime() : "18:00";
            Integer grace = (shift != null && shift.getGraceMinutes() != null) ? shift.getGraceMinutes() : 15;

            AttendanceDailyLogDTO calcDto = new AttendanceDailyLogDTO();
            calcDto.setInTime(att.getPunchIn());
            calcDto.setOutTime(att.getPunchOut());
            calcDto.setShiftStartTime(startTime);
            calcDto.setShiftEndTime(endTime);
            calcDto.setGraceMinutes(grace);
            calcDto.setOtEligible(emp.getOtToggle() != null ? emp.getOtToggle() : "NO");

            // Calculate metrics
            calculateMetrics(calcDto);

            String key = att.getEmployeeId() + "_" + att.getAttendanceDate();
            HrAttendanceDailyLog entity = existingLogsMap.get(key);
            if (entity == null) {
                entity = new HrAttendanceDailyLog();
                entity.setEmpId(att.getEmployeeId());
                entity.setAttendanceDate(att.getAttendanceDate());
            }

            entity.setShiftId(shiftId);
            entity.setInTime(att.getPunchIn());
            entity.setOutTime(att.getPunchOut());
            entity.setEarlyIn(calcDto.getEarlyIn() != null ? calcDto.getEarlyIn() : 0);
            entity.setEarlyOut(calcDto.getEarlyOut() != null ? calcDto.getEarlyOut() : 0);
            entity.setDuration(calcDto.getDuration() != null ? calcDto.getDuration() : 0);
            entity.setLom(calcDto.getLom() != null ? calcDto.getLom() : 0);
            entity.setOt(calcDto.getOt() != null ? calcDto.getOt() : 0);
            entity.setAttType(calcDto.getAttType() != null ? calcDto.getAttType() : att.getStatus());
            entity.setRemarks("Biometric calculation");
            entity.setFromWhere("ESSL");
            entity.setIsActive(true);

            logsToSave.add(entity);
        }

        if (!logsToSave.isEmpty()) {
            int batchSize = 200;
            for (int i = 0; i < logsToSave.size(); i += batchSize) {
                int end = Math.min(i + batchSize, logsToSave.size());
                dailyLogRepository.saveAll(logsToSave.subList(i, end));
                dailyLogRepository.flush();
            }
        }
    }
}


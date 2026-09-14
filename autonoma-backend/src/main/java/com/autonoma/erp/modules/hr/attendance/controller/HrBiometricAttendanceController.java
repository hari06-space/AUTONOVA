package com.autonoma.erp.modules.hr.attendance.controller;

import com.autonoma.erp.modules.hr.attendance.entity.HrBiometricAttendance;
import com.autonoma.erp.modules.hr.attendance.repository.HrBiometricAttendanceRepository;
import com.autonoma.erp.modules.hr.attendance.service.EsslSyncService;
import com.autonoma.erp.modules.hr.attendance.service.OvertimeCalculationService;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.security.RequirePagePermission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import com.autonoma.erp.modules.hr.attendance.entity.HrAttendanceAuditLog;
import com.autonoma.erp.modules.hr.attendance.repository.HrAttendanceAuditLogRepository;
import com.autonoma.erp.modules.hr.orgstructure.entity.Designation;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.attendance.entity.HrCanteenLog;
import com.autonoma.erp.modules.hr.attendance.repository.HrCanteenLogRepository;
import com.autonoma.erp.modules.hr.attendance.entity.ClientEsslConfig;
import com.autonoma.erp.modules.hr.attendance.service.AttendanceDailyLogService;
import com.autonoma.erp.modules.hr.attendance.repository.ShiftMasterRepository;
import com.autonoma.erp.modules.hr.attendance.entity.ShiftMaster;
import com.autonoma.erp.modules.hr.attendance.dto.AttendanceDailyLogSaveRequest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/hr/biometric-attendance")
public class HrBiometricAttendanceController {

    private static final Map<String, Map<String, Object>> syncStatusMap = new ConcurrentHashMap<>();

    private static final Logger log = LoggerFactory.getLogger(HrBiometricAttendanceController.class);

    /** Default gross salary used when employee salary data is unavailable */
    private static final BigDecimal DEFAULT_GROSS_SALARY = new BigDecimal("35000.00");

    @Autowired
    private HrBiometricAttendanceRepository repository;

    @Autowired
    private EmployeeMasterRepository employeeRepository;

    @Autowired
    private HrAttendanceAuditLogRepository auditLogRepository;

    @Autowired
    private EsslSyncService esslSyncService;

    @Autowired
    private OvertimeCalculationService overtimeCalculationService;

    @Autowired
    private DesignationRepository designationRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private HrCanteenLogRepository canteenLogRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.CompanyCredentialRepository companyCredentialRepository;

    @Autowired
    private com.autonoma.erp.config.essl.EsslDataSourceService esslDataSourceService;

    @Autowired
    private com.autonoma.erp.config.essl.EsslDynamicRoutingDataSource esslRoutingDataSource;

    @Autowired
    private com.autonoma.erp.modules.hr.attendance.repository.ClientEsslConfigRepository clientEsslConfigRepository;

    @Autowired
    private AttendanceDailyLogService attendanceDailyLogService;

    @Autowired
    private ShiftMasterRepository shiftMasterRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepository;

    @GetMapping("/test-ot")
    public ResponseEntity<Map<String, Object>> runOtTestDemo() {
        Map<String, Object> result = new LinkedHashMap<>();
        int otStep = overtimeCalculationService.getOtMinMinutes();
        result.put("configured_OT_MIN_MINUTES", otStep);

        ShiftMaster dayShift = new ShiftMaster();
        dayShift.setShiftName("GENERAL");
        dayShift.setStartTime("09:00");
        dayShift.setEndTime("18:00");
        dayShift.setIsNightShift(false);

        ShiftMaster nightShift = new ShiftMaster();
        nightShift.setShiftName("NIGHT SHIFT");
        nightShift.setStartTime("22:00");
        nightShift.setEndTime("06:00");
        nightShift.setIsNightShift(true);

        List<Map<String, Object>> cases = new ArrayList<>();

        String[] testTimes = {"18:00", "18:01", "18:25", "18:29", "18:30", "18:31", "18:45", "18:59", "19:00", "19:25", "19:29", "19:30"};
        for (String t : testTimes) {
            java.time.LocalTime outTime = java.time.LocalTime.parse(t);
            int otMins = overtimeCalculationService.calculateOtMinutes(java.time.LocalTime.of(9, 0), outTime, dayShift, true, otStep);
            BigDecimal otHours = overtimeCalculationService.calculateOtHours(java.time.LocalTime.of(9, 0), outTime, dayShift, true, otStep);
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("shift", "GENERAL (09:00 - 18:00)");
            c.put("checkoutTime", t);
            c.put("otEligible", true);
            c.put("calculatedOtMinutes", otMins);
            c.put("calculatedOtHours", otHours);
            cases.add(c);
        }

        // Night shift test: checkout at 06:35 AM (35 mins after 06:00 AM shift end)
        java.time.LocalTime nightOut = java.time.LocalTime.of(6, 35);
        int nightOtMins = overtimeCalculationService.calculateOtMinutes(java.time.LocalTime.of(22, 0), nightOut, nightShift, true, otStep);
        Map<String, Object> nc = new LinkedHashMap<>();
        nc.put("shift", "NIGHT SHIFT (22:00 - 06:00)");
        nc.put("checkoutTime", "06:35");
        nc.put("otEligible", true);
        nc.put("calculatedOtMinutes", nightOtMins);
        cases.add(nc);

        // OT Ineligible test: checkout at 19:30 with otToggle = false
        int ineligOtMins = overtimeCalculationService.calculateOtMinutes(java.time.LocalTime.of(9, 0), java.time.LocalTime.of(19, 30), dayShift, false, otStep);
        Map<String, Object> ic = new LinkedHashMap<>();
        ic.put("shift", "GENERAL (09:00 - 18:00)");
        ic.put("checkoutTime", "19:30");
        ic.put("otEligible", false);
        ic.put("calculatedOtMinutes", ineligOtMins);
        cases.add(ic);

        result.put("testCases", cases);
        result.put("status", "SUCCESS");
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<HrBiometricAttendance>> getAll(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Integer year) {
        List<HrBiometricAttendance> list;
        if (month != null && year != null) {
            List<String> months = Arrays.asList(
                    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
            );
            int monthVal = months.indexOf(month.trim().toUpperCase()) + 1;
            if (monthVal > 0) {
                LocalDate startDate = LocalDate.of(year, monthVal, 1);
                LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
                list = repository.findByAttendanceDateBetween(startDate, endDate);
            } else {
                list = repository.findAllByOrderByAttendanceDateDesc();
            }
        } else {
            list = repository.findAllByOrderByAttendanceDateDesc();
        }

        if (list != null && !list.isEmpty()) {
            Set<Long> empIds = new HashSet<>();
            for (HrBiometricAttendance att : list) {
                if (att.getEmployeeId() != null) {
                    empIds.add(att.getEmployeeId());
                }
            }
            Map<Long, String> wagesTypeMap = new HashMap<>();
            if (!empIds.isEmpty()) {
                try {
                    List<com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile> jobProfiles = 
                            employeeJobProfileRepository.findByEmployeeIdIn(empIds);
                    for (com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile jp : jobProfiles) {
                        if (jp.getEmployeeId() != null && jp.getWagesType() != null) {
                            wagesTypeMap.put(jp.getEmployeeId(), jp.getWagesType().trim());
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to batch retrieve job profiles: ", e);
                }
            }
            for (HrBiometricAttendance att : list) {
                String wt = wagesTypeMap.get(att.getEmployeeId());
                att.setWagesType(wt != null && !wt.isEmpty() ? wt : "Monthly");
            }
        }

        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody HrBiometricAttendance entry) {
        String currentUserId = "admin";
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
            if (currentUserId == null || currentUserId.trim().isEmpty()) {
                currentUserId = "admin";
            }
        } catch (Exception e) {}

        // Check for existing record with same employee + date (upsert logic)
        Optional<HrBiometricAttendance> existingOpt = repository.findByEmployeeIdAndAttendanceDate(
                entry.getEmployeeId(), entry.getAttendanceDate());

        if (existingOpt.isPresent()) {
            HrBiometricAttendance existing = existingOpt.get();
            // Block edits if the log is synced from eSSL
            if (existing.getEsslInTime() != null || existing.getEsslOutTime() != null) {
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("message", "Editing or deleting eSSL synced attendance records is not permitted. Please use manual attendance requests instead.");
                return ResponseEntity.badRequest().body(err);
            }
            // If editing a different record, this is a duplicate
            if (entry.getId() != null && !existing.getId().equals(entry.getId())) {
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("message", "An attendance record already exists for this employee on the selected date.");
                return ResponseEntity.badRequest().body(err);
            }
            saveAuditLog(existing, entry, currentUserId);
            applyUpdates(existing, entry);
            HrBiometricAttendance saved = repository.save(existing);
            enrichWagesType(saved);
            return ResponseEntity.ok(saved);
        }

        // For updates by ID where no duplicate conflict exists
        if (entry.getId() != null) {
            Optional<HrBiometricAttendance> byIdOpt = repository.findById(entry.getId());
            if (byIdOpt.isPresent()) {
                HrBiometricAttendance existing = byIdOpt.get();
                // Block edits if the log is synced from eSSL
                if (existing.getEsslInTime() != null || existing.getEsslOutTime() != null) {
                    Map<String, Object> err = new HashMap<>();
                    err.put("success", false);
                    err.put("message", "Editing or deleting eSSL synced attendance records is not permitted. Please use manual attendance requests instead.");
                    return ResponseEntity.badRequest().body(err);
                }
                saveAuditLog(existing, entry, currentUserId);
                applyUpdates(existing, entry);
                HrBiometricAttendance saved = repository.save(existing);
                enrichWagesType(saved);
                return ResponseEntity.ok(saved);
            }
        }

        // New record — set audit fields and save
        try {
            if (entry.getCreatedBy() == null || entry.getCreatedBy().trim().isEmpty()) {
                entry.setCreatedBy(currentUserId);
            }
            if (entry.getCreatedDate() == null) {
                entry.setCreatedDate(new Date());
            }
            entry.setUpdatedBy(currentUserId);
            entry.setUpdatedDate(new Date());
            
            HrBiometricAttendance saved = repository.save(entry);
            enrichWagesType(saved);
            return ResponseEntity.ok(saved);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Duplicate biometric record for empId={} date={}", entry.getEmployeeId(), entry.getAttendanceDate());
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "An attendance record already exists for this employee on the selected date.");
            return ResponseEntity.badRequest().body(err);
        }
    }

    // ==================== eSSL Integration Endpoints ====================

    /**
     * Sync biometric attendance from eSSL device tables in the secondary DB.
     */
    @PostMapping("/sync-essl")
    public ResponseEntity<Map<String, Object>> syncFromEssl(
            @RequestParam String month,
            @RequestParam int year,
            @RequestParam(defaultValue = "ESSL_ATTENDANCE_LOG") String tableName,
            @RequestParam(defaultValue = "EMP_CD") String empCdColumn,
            @RequestParam(defaultValue = "ATTENDANCE_DATE") String dateColumn,
            @RequestParam(defaultValue = "IN_TIME") String inTimeColumn,
            @RequestParam(defaultValue = "OUT_TIME") String outTimeColumn) {

        String tenantId = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            tenantId = "AUTONOMA";
        }
        String normalizedTenantId = tenantId.trim().toUpperCase();

        boolean hasConfig = clientEsslConfigRepository.findByClientIdAndIsActiveTrue(normalizedTenantId).isPresent();
        if (!hasConfig) {
            List<com.autonoma.erp.model.admin.CompanyCredential> comps = companyCredentialRepository.findAll();
            for (com.autonoma.erp.model.admin.CompanyCredential comp : comps) {
                if (comp.getEsslServerIp() != null && !comp.getEsslServerIp().trim().isEmpty() &&
                    comp.getEsslDbName() != null && !comp.getEsslDbName().trim().isEmpty()) {
                    hasConfig = true;
                    break;
                }
            }
        }

        if (!hasConfig) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "eSSL Connection Configuration is missing or inactive for your company. Please save your eSSL configuration in Company Profile first.");
            return ResponseEntity.badRequest().body(err);
        }

        if (!esslRoutingDataSource.containsDataSource(normalizedTenantId)) {
            try {
                esslDataSourceService.refreshAllDataSources();
            } catch (Exception ex) {
                log.warn("Failed to refresh ESSL datasources dynamically: {}", ex.getMessage());
            }
        }

        String activeTableName = tableName;
        String activeEmpCdCol = empCdColumn;
        String activeDateCol = dateColumn;
        String activeInTimeCol = inTimeColumn;
        String activeOutTimeCol = outTimeColumn;

        Optional<ClientEsslConfig> clientConfigOpt = clientEsslConfigRepository.findByClientIdAndIsActiveTrue(normalizedTenantId);
        if (clientConfigOpt.isPresent()) {
            ClientEsslConfig clientConfig = clientConfigOpt.get();
            if (clientConfig.getEsslTableName() != null && !clientConfig.getEsslTableName().trim().isEmpty()) {
                activeTableName = clientConfig.getEsslTableName().trim();
            }
            if (clientConfig.getEmpCdColumn() != null && !clientConfig.getEmpCdColumn().trim().isEmpty()) {
                activeEmpCdCol = clientConfig.getEmpCdColumn().trim();
            }
            if (clientConfig.getDateColumn() != null && !clientConfig.getDateColumn().trim().isEmpty()) {
                activeDateCol = clientConfig.getDateColumn().trim();
            }
            if (clientConfig.getInTimeColumn() != null && !clientConfig.getInTimeColumn().trim().isEmpty()) {
                activeInTimeCol = clientConfig.getInTimeColumn().trim();
            }
            if (clientConfig.getOutTimeColumn() != null && !clientConfig.getOutTimeColumn().trim().isEmpty()) {
                activeOutTimeCol = clientConfig.getOutTimeColumn().trim();
            }
        }

        Map<String, Object> currentStatus = syncStatusMap.get(normalizedTenantId);
        if (currentStatus != null && "RUNNING".equals(currentStatus.get("status"))) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "RUNNING");
            response.put("message", "Sync is already in progress.");
            return ResponseEntity.ok(response);
        }

        try {
            log.info("Synchronous eSSL Sync Started for tenant: {}", normalizedTenantId);
            Map<String, Object> result = esslSyncService.syncFromEssl(
                    activeTableName, activeEmpCdCol, activeDateCol, activeInTimeCol, activeOutTimeCol, month, year);

            if (result != null && Boolean.TRUE.equals(result.get("success"))) {
                try {
                    calculate(month, year);
                    List<String> monthsList = Arrays.asList(
                            "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
                    );
                    int mVal = monthsList.indexOf(month.trim().toUpperCase()) + 1;
                    if (mVal > 0) {
                        LocalDate stDate = LocalDate.of(year, mVal, 1);
                        LocalDate edDate = stDate.withDayOfMonth(stDate.lengthOfMonth());
                        List<HrBiometricAttendance> currentLogs = repository.findByAttendanceDateBetween(stDate, edDate);
                        result.put("processedRecords", currentLogs.size());
                        result.put("message", "Biometric synchronization completed (" + currentLogs.size() + " records processed).");
                    }
                } catch (Exception calcEx) {
                    log.warn("Auto-calculation after sync warning: {}", calcEx.getMessage());
                }
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception ex) {
            log.error("Error in eSSL Sync: ", ex);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Internal server error: " + ex.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    @GetMapping("/sync-status")
    public ResponseEntity<Map<String, Object>> getSyncStatus() {
        String tenantId = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            tenantId = "AUTONOMA";
        }
        String normalizedTenantId = tenantId.trim().toUpperCase();

        Map<String, Object> status = syncStatusMap.get(normalizedTenantId);
        if (status == null) {
            Map<String, Object> idleStatus = new HashMap<>();
            idleStatus.put("status", "IDLE");
            idleStatus.put("message", "No sync has been performed recently.");
            return ResponseEntity.ok(idleStatus);
        }
        return ResponseEntity.ok(status);
    }

    /**
     * List all tables in the secondary database (ERPDb_NUTECH) for diagnostic purposes.
     */
    @GetMapping("/essl-tables")
    public ResponseEntity<Map<String, Object>> listEsslTables() {
        Map<String, Object> result = new HashMap<>();
        result.put("tables", esslSyncService.listSecondaryDbTables());
        return ResponseEntity.ok(result);
    }

    /**
     * Describe a specific table's columns in the secondary database.
     */
    @GetMapping("/essl-describe")
    public ResponseEntity<Map<String, Object>> describeEsslTable(@RequestParam String tableName) {
        Map<String, Object> result = new HashMap<>();
        result.put("tableName", tableName);
        result.put("columns", esslSyncService.describeSecondaryTable(tableName));
        return ResponseEntity.ok(result);
    }

    /**
     * Preview top rows from a table in the secondary database.
     */
    @GetMapping("/essl-preview")
    public ResponseEntity<Map<String, Object>> previewEsslTable(
            @RequestParam String tableName,
            @RequestParam(defaultValue = "10") int limit) {
        Map<String, Object> result = new HashMap<>();
        result.put("tableName", tableName);
        result.put("data", esslSyncService.previewSecondaryTable(tableName, limit));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/sync-canteen")
    public ResponseEntity<Map<String, Object>> syncCanteenLogs(
            @RequestParam String month,
            @RequestParam int year) {
        String tenantId = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            tenantId = "AUTONOMA";
        }
        String normalizedTenantId = tenantId.trim().toUpperCase();

        if (!esslRoutingDataSource.containsDataSource(normalizedTenantId)) {
            try {
                esslDataSourceService.refreshAllDataSources();
            } catch (Exception ex) {
                log.warn("Failed to refresh ESSL datasources dynamically: {}", ex.getMessage());
            }
        }

        try {
            com.autonoma.erp.config.essl.EsslDataSourceContextHolder.setClientId(normalizedTenantId);
            Map<String, Object> result = esslSyncService.syncCanteenLogs(month, year);
            if (Boolean.TRUE.equals(result.get("success"))) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } finally {
            com.autonoma.erp.config.essl.EsslDataSourceContextHolder.clear();
        }
    }

    @GetMapping("/canteen-logs")
    public ResponseEntity<List<HrCanteenLog>> getCanteenLogs(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String date) {
        if (employeeId != null && date != null) {
            LocalDate ld = LocalDate.parse(date);
            java.time.LocalDateTime start = ld.atStartOfDay();
            java.time.LocalDateTime end = ld.atTime(23, 59, 59);
            return ResponseEntity.ok(canteenLogRepository.findByEmployeeIdAndLogDateBetween(employeeId, start, end));
        } else if (employeeId != null) {
            return ResponseEntity.ok(canteenLogRepository.findAll().stream()
                    .filter(l -> l.getEmployeeId().equals(employeeId))
                    .collect(java.util.stream.Collectors.toList()));
        } else if (date != null) {
            LocalDate ld = LocalDate.parse(date);
            java.time.LocalDateTime start = ld.atStartOfDay();
            java.time.LocalDateTime end = ld.atTime(23, 59, 59);
            return ResponseEntity.ok(canteenLogRepository.findByLogDateBetween(start, end));
        }
        return ResponseEntity.ok(canteenLogRepository.findAllByOrderByLogDateDesc());
    }

    @GetMapping("/photo/{id}")
    public ResponseEntity<byte[]> getCheckInPhoto(@PathVariable Long id) {
        Optional<HrBiometricAttendance> attOpt = repository.findById(id);
        if (attOpt.isPresent() && attOpt.get().getDeviceImage() != null) {
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.IMAGE_JPEG)
                    .body(attOpt.get().getDeviceImage());
        }
        return ResponseEntity.notFound().build();
    }

    // ==================== Monthly Process Summary Endpoint ====================

    /**
     * Returns a monthly process summary with per-employee rows showing
     * day-wise attendance status, late minutes, total working hours, OT hours,
     * wage type, OT eligibility, salary calculations, absent count, zero-hours
     * count.
     */
    @GetMapping("/monthly-process")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyProcessSummary(
            @RequestParam String month,
            @RequestParam int year) {

        List<String> months = Arrays.asList(
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December");
        int monthVal = -1;
        for (int i = 0; i < months.size(); i++) {
            if (months.get(i).equalsIgnoreCase(month)) {
                monthVal = i + 1;
                break;
            }
        }
        if (monthVal <= 0) {
            return ResponseEntity.badRequest().body(Collections.emptyList());
        }

        LocalDate startDate = LocalDate.of(year, monthVal, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        int daysInMonth = startDate.lengthOfMonth();
        String monthAbbr = month.substring(0, 3); // e.g. "Jun"

        cleanupInvalidAttendanceRecords();

        // Fetch all attendance records for the month
        List<HrBiometricAttendance> allRecords = repository.findByAttendanceDateBetween(startDate, endDate);

        // Group by employee ID
        Map<Long, List<HrBiometricAttendance>> byEmployee = new LinkedHashMap<>();
        for (HrBiometricAttendance rec : allRecords) {
            byEmployee.computeIfAbsent(rec.getEmployeeId(), k -> new ArrayList<>()).add(rec);
        }

        // Fetch all active employees to include those with zero records too
        List<EmployeeMaster> activeEmployees = employeeRepository.findByStatus("Active");
        for (EmployeeMaster emp : activeEmployees) {
            if (emp.getEmpCode() != null) {
                byEmployee.putIfAbsent(emp.getId(), new ArrayList<>());
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        int index = 1;

        for (Map.Entry<Long, List<HrBiometricAttendance>> entry : byEmployee.entrySet()) {
            Long empId = entry.getKey();
            List<HrBiometricAttendance> empRecords = entry.getValue();

            // Get employee details
            String empCode = "N/A";
            String empName = "N/A";
            String wageType = "Monthly";
            String otEligible = "NO";
            BigDecimal grossSalary = BigDecimal.ZERO;
            String department = "N/A";
            String designation = "N/A";
            String dateOfJoining = "N/A";
            LocalDate empDoj = null;

            Optional<EmployeeMaster> empOpt = employeeRepository.findById(empId);
            if (empOpt.isPresent()) {
                EmployeeMaster emp = empOpt.get();
                empCode = emp.getEmpCode() != null ? emp.getEmpCode() : "N/A";
                empName = emp.getEmployeeName() != null ? emp.getEmployeeName() : "N/A";
                otEligible = emp.getOtToggle() != null ? emp.getOtToggle() : "NO";
                department = emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : "N/A";
                designation = emp.getDesignation() != null ? emp.getDesignation().getDesignationName() : "N/A";
                dateOfJoining = emp.getDateOfJoining() != null ? emp.getDateOfJoining().toString() : "N/A";

                // Retrieve wages type from EmployeeJobProfile mapping dynamically
                try {
                    Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile> jobProfileOpt = employeeJobProfileRepository.findByEmployeeId(empId);
                    if (jobProfileOpt.isPresent() && jobProfileOpt.get().getWagesType() != null && !jobProfileOpt.get().getWagesType().trim().isEmpty()) {
                        wageType = jobProfileOpt.get().getWagesType().trim();
                    }
                } catch (Exception e) {
                    log.warn("Failed to retrieve wages type for employee ID: {}", empId);
                }

                // Cache DOJ as LocalDate for use in the day-loop
                if (emp.getDateOfJoining() != null) {
                    Date doj = emp.getDateOfJoining();
                    if (doj instanceof java.sql.Date) {
                        empDoj = ((java.sql.Date) doj).toLocalDate();
                    } else {
                        empDoj = LocalDate.ofInstant(doj.toInstant(), java.time.ZoneId.systemDefault());
                    }
                }

                // Try to get gross salary from expected or previous
                if (emp.getQ27_expectedGrossSalary() != null && !emp.getQ27_expectedGrossSalary().trim().isEmpty()) {
                    try {
                        grossSalary = new BigDecimal(emp.getQ27_expectedGrossSalary().trim());
                    } catch (Exception e) {
                    }
                } else if (emp.getQ25_prevGrossSalary() != null && !emp.getQ25_prevGrossSalary().trim().isEmpty()) {
                    try {
                        grossSalary = new BigDecimal(emp.getQ25_prevGrossSalary().trim());
                    } catch (Exception e) {
                    }
                }

                if (grossSalary.compareTo(BigDecimal.ZERO) == 0) {
                    grossSalary = DEFAULT_GROSS_SALARY;
                }
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("index", index++);
            row.put("employeeId", empId);
            row.put("empCode", empCode);
            row.put("empName", empName);
            row.put("department", department);
            row.put("designation", designation);
            row.put("dateOfJoining", dateOfJoining);

            // Create a map from day-of-month -> record for quick lookup
            Map<Integer, HrBiometricAttendance> dayMap = new HashMap<>();
            for (HrBiometricAttendance rec : empRecords) {
                dayMap.put(rec.getAttendanceDate().getDayOfMonth(), rec);
            }

            // Day-wise columns
            int totalLateMins = 0;
            BigDecimal totalWorkHours = BigDecimal.ZERO;
            BigDecimal totalOTHours = BigDecimal.ZERO;
            int absentCount = 0;
            int zeroWoHrsCount = 0;

            for (int day = 1; day <= daysInMonth; day++) {
                String dayKey = monthAbbr + " " + day;
                HrBiometricAttendance rec = dayMap.get(day);
                if (rec != null) {
                    String statusCode = rec.getStatus();
                    if ("ABSENT".equals(statusCode)) {
                        absentCount++;
                    }
                    BigDecimal hrs = rec.getTotalHoursWorked();
                    if (hrs != null) {
                        row.put(dayKey, hrs.setScale(2, RoundingMode.HALF_UP).toString());
                    } else {
                        row.put(dayKey, "0.0");
                    }

                    // Late calculation (use isLate directly as minutes)
                    if (rec.getIsLate() != null && rec.getIsLate() > 0 && rec.getPunchIn() != null) {
                        totalLateMins += rec.getIsLate();
                    }

                    // Working hours
                    if (rec.getTotalHoursWorked() != null) {
                        totalWorkHours = totalWorkHours.add(rec.getTotalHoursWorked());
                        if (rec.getTotalHoursWorked().compareTo(BigDecimal.ZERO) == 0) {
                            zeroWoHrsCount++;
                        }
                    } else {
                        zeroWoHrsCount++;
                    }

                    // OT hours
                    if (rec.getOvertimeHours() != null && rec.getOvertimeHours().compareTo(BigDecimal.ZERO) > 0) {
                        totalOTHours = totalOTHours.add(rec.getOvertimeHours());
                    }
                } else {
                    // No record for this day
                    LocalDate dayDate = LocalDate.of(year, monthVal, day);
                    boolean joined = (empDoj == null) || !dayDate.isBefore(empDoj);

                    if (dayDate.isAfter(LocalDate.now()) || !joined) {
                        row.put(dayKey, "-");
                    } else {
                        row.put(dayKey, "0.0");
                        absentCount++;
                        zeroWoHrsCount++;
                    }
                }
            }

            row.put("lateMins", totalLateMins);
            row.put("totalWoHrs", totalWorkHours.setScale(2, RoundingMode.HALF_UP));
            row.put("otHrs", totalOTHours.setScale(2, RoundingMode.HALF_UP));
            row.put("wageType", wageType);
            row.put("otEligible", otEligible);
            row.put("grossSalary", grossSalary.setScale(2, RoundingMode.HALF_UP));

            // Calculate actual salary (proportional based on days present/worked)
            int workingDaysInMonth = 0;
            for (int day = 1; day <= daysInMonth; day++) {
                LocalDate d = LocalDate.of(year, monthVal, day);
                if (!d.isAfter(LocalDate.now())) {
                    workingDaysInMonth++;
                }
            }
            int presentDays = workingDaysInMonth - absentCount;
            BigDecimal actualSalary = workingDaysInMonth > 0
                    ? grossSalary.multiply(BigDecimal.valueOf(presentDays))
                            .divide(BigDecimal.valueOf(workingDaysInMonth), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            row.put("actualSalary", actualSalary.setScale(2, RoundingMode.HALF_UP));

            // OT Salary (OT minutes / 60 * per-hour rate based on gross salary)
            BigDecimal perHourRate = workingDaysInMonth > 0
                    ? grossSalary.divide(BigDecimal.valueOf(workingDaysInMonth * 8L), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            BigDecimal otSalary = "YES".equalsIgnoreCase(otEligible)
                    ? totalOTHours.divide(new BigDecimal("60"), 2, RoundingMode.HALF_UP).multiply(perHourRate).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            row.put("otSalary", otSalary);

            // Estimated salary = actual + OT salary
            BigDecimal estimatedSalary = actualSalary.add(otSalary).setScale(2, RoundingMode.HALF_UP);
            row.put("estimatedSalary", estimatedSalary);

            row.put("noOfAbsent", absentCount);
            row.put("zeroWoHrs", zeroWoHrsCount);

            result.add(row);
        }

        return ResponseEntity.ok(result);
    }
    // ==================== Calculate Endpoint ====================

    @Transactional
    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculate(
            @RequestParam String month,
            @RequestParam int year) {

        List<String> months = Arrays.asList(
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
        );
        int monthVal = -1;
        for (int i = 0; i < months.size(); i++) {
            if (months.get(i).equalsIgnoreCase(month)) {
                monthVal = i + 1;
                break;
            }
        }
        if (monthVal <= 0) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Invalid month name: " + month);
            return ResponseEntity.badRequest().body(err);
        }

        cleanupInvalidAttendanceRecords();
        List<EmployeeMaster> employees = employeeRepository.findByStatus("Active");
        int processedCount = 0;
        int skippedCount = 0;

        int daysInMonth = LocalDate.of(year, monthVal, 1).lengthOfMonth();
        LocalDate startDate = LocalDate.of(year, monthVal, 1);
        LocalDate endDate = startDate.withDayOfMonth(daysInMonth);

        // Fetch all existing attendance records for this month in one query to avoid N+1
        List<HrBiometricAttendance> existingRecords = repository.findByAttendanceDateBetween(startDate, endDate);
        Map<String, HrBiometricAttendance> existingMap = new HashMap<>();
        for (HrBiometricAttendance rec : existingRecords) {
            existingMap.put(rec.getEmployeeId() + "_" + rec.getAttendanceDate(), rec);
        }

        String currentUserId = "admin";
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
            if (currentUserId == null || currentUserId.trim().isEmpty()) {
                currentUserId = "admin";
            }
        } catch (Exception e) {}

        List<HrBiometricAttendance> toSave = new ArrayList<>();

        for (EmployeeMaster emp : employees) {
            if (emp.getEmpCode() == null) {
                continue;
            }

            for (int day = 1; day <= daysInMonth; day++) {
                LocalDate date = LocalDate.of(year, monthVal, day);
                if (date.isAfter(LocalDate.now())) {
                    continue;
                }

                try {
                    String key = emp.getId() + "_" + date;
                    HrBiometricAttendance att = existingMap.get(key);
                    boolean isNew = false;
                    boolean changed = false;

                    if (att == null) {
                        att = new HrBiometricAttendance();
                        att.setEmployeeId(emp.getId());
                        att.setAttendanceDate(date);
                        att.setStatus("ABSENT");
                        att.setCreatedBy(currentUserId);
                        att.setCreatedDate(new Date());
                        isNew = true;
                        changed = true;
                    }

                    // If biometric details are present, calculate status and total hours
                    if (att.getPunchIn() != null && att.getPunchOut() != null) {
                        int durationMins = (int) java.time.Duration.between(att.getPunchIn(), att.getPunchOut()).toMinutes();
                        if (durationMins < 0) {
                            durationMins += 24 * 60;
                        }
                        
                        BigDecimal newHrsMins = BigDecimal.valueOf(durationMins);
                        if (att.getTotalHoursWorked() == null || att.getTotalHoursWorked().compareTo(newHrsMins) != 0) {
                            att.setTotalHoursWorked(newHrsMins);
                            changed = true;
                        }

                        String newStatus;
                        if (durationMins >= 480) {
                            newStatus = "PRESENT";
                        } else if (durationMins >= 240) {
                            newStatus = "HALF_DAY";
                        } else {
                            newStatus = "ABSENT";
                        }
                        if (!newStatus.equals(att.getStatus())) {
                            att.setStatus(newStatus);
                            changed = true;
                        }

                        // Calculate overtime using OvertimeCalculationService
                        boolean otEligible = emp != null && "YES".equalsIgnoreCase(emp.getOtToggle());
                        BigDecimal newOt = overtimeCalculationService.calculateOtHours(att.getPunchIn(), att.getPunchOut(), att.getShift(), otEligible, null);
                        if (att.getOvertimeHours() == null || att.getOvertimeHours().compareTo(newOt) != 0) {
                            att.setOvertimeHours(newOt);
                            changed = true;
                        }
                    }

                    if (changed || isNew || att.getId() != null) {
                        att.setUpdatedBy(currentUserId);
                        att.setUpdatedDate(new Date());
                        toSave.add(att);
                    }
                    processedCount++;
                } catch (Exception ex) {
                    log.warn("Failed to process attendance for empId={} date={}: {}", emp.getId(), date, ex.getMessage());
                    skippedCount++;
                }
            }
        }

        if (!toSave.isEmpty()) {
            int batchSize = 200;
            for (int i = 0; i < toSave.size(); i += batchSize) {
                int end = Math.min(i + batchSize, toSave.size());
                repository.saveAll(toSave.subList(i, end));
                repository.flush();
            }

            List<ShiftMaster> activeShifts = shiftMasterRepository.findByIsActiveTrue();
            Long defaultShiftId = activeShifts.isEmpty() ? null : activeShifts.get(0).getId();
            attendanceDailyLogService.saveBiometricDailyLogsBatch(toSave, defaultShiftId);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Biometric attendance calculation completed successfully.");
        response.put("processedRecords", processedCount);
        if (skippedCount > 0) {
            response.put("skippedRecords", skippedCount);
        }
        return ResponseEntity.ok(response);
    }

    // ==================== Seed Historical Data Endpoint ====================

    /**
     * One-time seed: generates realistic biometric attendance records for ALL
     * active
     * employees across past months (Jan 2026 → today). Also fixes known data
     * issues:
     * - Renames "Admin istrator" → "Administrator"
     * - Removes future-dated records
     * - Removes duplicate attendance entries
     */
    @Transactional
    @PostMapping("/seed-historical")
    public ResponseEntity<Map<String, Object>> seedHistoricalData(
            @RequestParam(required = false, defaultValue = "false") boolean confirm) {
        if (!confirm) {
            Map<String, Object> warning = new LinkedHashMap<>();
            warning.put("success", false);
            warning.put("message", "WARNING: This will DELETE all existing attendance records and re-seed with generated data. Pass ?confirm=true to proceed.");
            return ResponseEntity.badRequest().body(warning);
        }
        log.warn("seed-historical endpoint invoked — this will delete ALL attendance records and regenerate.");
        Map<String, Object> result = new LinkedHashMap<>();
        int fixedNames = 0;
        int removedFuture = 0;
        int removedDuplicates = 0;
        int seededRecords = 0;

        // 1. Fix "Admin istrator" / "Administrator" → "Admin" and assign
        // departments/designations
        List<EmployeeMaster> allEmployees = employeeRepository.findAll();
        for (EmployeeMaster emp : allEmployees) {
            boolean changed = false;
            if ("Admin istrator".equals(emp.getEmployeeName()) || "Administrator".equals(emp.getEmployeeName())
                    || "Admin istrator".equalsIgnoreCase(emp.getFirstName() + " " + emp.getLastName())
                    || "Administrator".equalsIgnoreCase(emp.getFirstName())) {
                emp.setEmployeeName("Admin");
                emp.setFirstName("Admin");
                emp.setLastName("");
                fixedNames++;
                changed = true;
                log.info("Renamed employee: Administrator → Admin (id={})", emp.getId());
            }

            // Ensure basic designations exist
            Designation adminDesig = designationRepository.findAll().stream()
                    .filter(d -> "Admin".equalsIgnoreCase(d.getDesignationName()))
                    .findFirst()
                    .orElseGet(() -> {
                        Designation d = new Designation();
                        d.setDesignationCode("DES001");
                        d.setDesignationName("Admin");
                        d.setIsActive(true);
                        d.setDisplaySlNo(1);
                        return designationRepository.save(d);
                    });

            Designation trainerDesig = designationRepository.findAll().stream()
                    .filter(d -> "Trainer".equalsIgnoreCase(d.getDesignationName()))
                    .findFirst()
                    .orElseGet(() -> {
                        Designation d = new Designation();
                        d.setDesignationCode("DES002");
                        d.setDesignationName("Trainer");
                        d.setIsActive(true);
                        d.setDisplaySlNo(2);
                        return designationRepository.save(d);
                    });

            Designation engDesig = designationRepository.findAll().stream()
                    .filter(d -> "Engineer".equalsIgnoreCase(d.getDesignationName()))
                    .findFirst()
                    .orElseGet(() -> {
                        Designation d = new Designation();
                        d.setDesignationCode("DES003");
                        d.setDesignationName("Engineer");
                        d.setIsActive(true);
                        d.setDisplaySlNo(3);
                        return designationRepository.save(d);
                    });

            Designation opDesig = designationRepository.findAll().stream()
                    .filter(d -> "Operator".equalsIgnoreCase(d.getDesignationName()))
                    .findFirst()
                    .orElseGet(() -> {
                        Designation d = new Designation();
                        d.setDesignationCode("DES004");
                        d.setDesignationName("Operator");
                        d.setIsActive(true);
                        d.setDisplaySlNo(4);
                        return designationRepository.save(d);
                    });

            // Ensure basic departments exist in database
            com.autonoma.erp.modules.hr.orgstructure.entity.Department adminDept = departmentRepository
                    .findByDepartmentName("Administration").orElseGet(() -> {
                        com.autonoma.erp.modules.hr.orgstructure.entity.Department d = new com.autonoma.erp.modules.hr.orgstructure.entity.Department();
                        d.setDepartmentNo("ADMIN");
                        d.setDepartmentName("Administration");
                        d.setStatus("Active");
                        d.setIsActive(true);
                        d.setSequenceNo(1);
                        return departmentRepository.save(d);
                    });
            com.autonoma.erp.modules.hr.orgstructure.entity.Department hrDept = departmentRepository
                    .findByDepartmentName("Human Resources").orElseGet(() -> {
                        com.autonoma.erp.modules.hr.orgstructure.entity.Department d = new com.autonoma.erp.modules.hr.orgstructure.entity.Department();
                        d.setDepartmentNo("HR");
                        d.setDepartmentName("Human Resources");
                        d.setStatus("Active");
                        d.setIsActive(true);
                        d.setSequenceNo(2);
                        return departmentRepository.save(d);
                    });
            com.autonoma.erp.modules.hr.orgstructure.entity.Department itDept = departmentRepository
                    .findByDepartmentName("Information Technology").orElseGet(() -> {
                        com.autonoma.erp.modules.hr.orgstructure.entity.Department d = new com.autonoma.erp.modules.hr.orgstructure.entity.Department();
                        d.setDepartmentNo("IT");
                        d.setDepartmentName("Information Technology");
                        d.setStatus("Active");
                        d.setIsActive(true);
                        d.setSequenceNo(3);
                        return departmentRepository.save(d);
                    });
            com.autonoma.erp.modules.hr.orgstructure.entity.Department opsDept = departmentRepository
                    .findByDepartmentName("Operations").orElseGet(() -> {
                        com.autonoma.erp.modules.hr.orgstructure.entity.Department d = new com.autonoma.erp.modules.hr.orgstructure.entity.Department();
                        d.setDepartmentNo("OPS");
                        d.setDepartmentName("Operations");
                        d.setStatus("Active");
                        d.setIsActive(true);
                        d.setSequenceNo(4);
                        return departmentRepository.save(d);
                    });

            // Assign departments & designations dynamically
            String code = emp.getEmpCode() != null ? emp.getEmpCode() : "";
            if (emp.getDepartmentId() == null || !departmentRepository.existsById(emp.getDepartmentId())) {
                if ("ADMIN_EMP".equals(code) || "Admin".equalsIgnoreCase(emp.getEmployeeName())) {
                    emp.setDepartmentId(adminDept.getId());
                } else if (code.startsWith("NT03")) {
                    emp.setDepartmentId(hrDept.getId());
                } else if (code.startsWith("NT13") || code.startsWith("NT10")) {
                    emp.setDepartmentId(itDept.getId());
                } else {
                    emp.setDepartmentId(opsDept.getId());
                }
                changed = true;
            }

            if (emp.getDesignationId() == null || !designationRepository.existsById(emp.getDesignationId())) {
                if ("ADMIN_EMP".equals(code) || "Admin".equalsIgnoreCase(emp.getEmployeeName())) {
                    emp.setDesignationId(adminDesig.getId());
                } else if ("NT03L3-23155".equals(code) || "SUPER_TRAINER".equals(code)
                        || "Super Trainer".equalsIgnoreCase(emp.getEmployeeName())) {
                    emp.setDesignationId(trainerDesig.getId());
                } else if (code.startsWith("NT13") || code.startsWith("NT10")) {
                    emp.setDesignationId(engDesig.getId());
                } else {
                    emp.setDesignationId(opDesig.getId());
                }
                changed = true;
            }

            // Assign realistic and distinct Date of Joining (DOJ) values to avoid everyone
            // having the same DOJ
            // e.g. Spread them between 2024 and 2025
            if (emp.getDateOfJoining() == null || emp.getDateOfJoining().toString().contains("2025-06-11")) {
                Calendar cal = Calendar.getInstance();
                if ("ADMIN_EMP".equals(emp.getEmpCode()) || "SUPER_TRAINER".equals(emp.getEmpCode())) {
                    cal.set(2024, Calendar.JANUARY, 1); // Admin/Trainer joined earlier
                } else {
                    // Spread other employees based on their ID hash
                    int hash = Math.abs(emp.getId().hashCode());
                    int year = 2024 + (hash % 2); // 2024 or 2025
                    int month = hash % 12; // 0 to 11
                    int day = 1 + (hash % 28); // 1 to 28
                    cal.set(year, month, day);
                }
                emp.setDateOfJoining(cal.getTime());
                changed = true;
            }

            if (changed) {
                employeeRepository.save(emp);
            }
        }

        // 2. Remove future-dated records and records before Date of Joining
        LocalDate today = LocalDate.now();
        List<HrBiometricAttendance> allRecords = repository.findAllByOrderByAttendanceDateDesc();
        int removedBeforeDoj = 0;
        for (HrBiometricAttendance rec : allRecords) {
            if (rec.getAttendanceDate() != null) {
                boolean deleteRecord = false;

                // Future records
                if (rec.getAttendanceDate().isAfter(today)) {
                    deleteRecord = true;
                } else {
                    // Before DOJ records
                    Optional<EmployeeMaster> empOpt = employeeRepository.findById(rec.getEmployeeId());
                    if (empOpt.isPresent() && empOpt.get().getDateOfJoining() != null) {
                        LocalDate doj;
                        if (empOpt.get().getDateOfJoining() instanceof java.sql.Date) {
                            doj = ((java.sql.Date) empOpt.get().getDateOfJoining()).toLocalDate();
                        } else {
                            doj = LocalDate.ofInstant(empOpt.get().getDateOfJoining().toInstant(),
                                    java.time.ZoneId.systemDefault());
                        }
                        if (rec.getAttendanceDate().isBefore(doj)) {
                            deleteRecord = true;
                            removedBeforeDoj++;
                        }
                    }
                }

                if (deleteRecord) {
                    repository.delete(rec);
                    if (rec.getAttendanceDate().isAfter(today)) {
                        removedFuture++;
                    }
                }
            }
        }

        // 3. Remove duplicates (keep the one with the latest id)
        allRecords = repository.findAllByOrderByAttendanceDateDesc();
        Map<String, HrBiometricAttendance> seen = new LinkedHashMap<>();
        for (HrBiometricAttendance rec : allRecords) {
            String key = rec.getEmployeeId() + "-" + rec.getAttendanceDate();
            if (seen.containsKey(key)) {
                // Keep the one with higher ID (more recent), delete the other
                HrBiometricAttendance existing = seen.get(key);
                if (rec.getId() > existing.getId()) {
                    repository.delete(existing);
                    seen.put(key, rec);
                } else {
                    repository.delete(rec);
                }
                removedDuplicates++;
            } else {
                seen.put(key, rec);
            }
        }
        repository.flush();

        // 4. Seed historical data for ALL active employees from Jan 2026 to current
        // month
        repository.deleteAllInBatch();
        seen.clear();

        List<EmployeeMaster> activeEmployees = employeeRepository.findByStatus("Active");
        Random rng = new Random(42); // Deterministic seed for reproducibility

        // Define shift patterns for realism
        String[][] shiftPatterns = {
                { "08:30 AM", "05:30 PM" }, // General shift
                { "09:00 AM", "06:00 PM" }, // Office shift
                { "08:00 AM", "05:00 PM" }, // Early shift
                { "09:30 AM", "06:30 PM" }, // Late shift
                { "07:00 AM", "04:00 PM" }, // Morning shift
        };

        LocalDate seedStart = LocalDate.of(2024, 1, 1);
        LocalDate seedEnd = today;

        for (EmployeeMaster emp : activeEmployees) {
            if (emp.getEmpCode() == null)
                continue;

            // Assign a consistent shift pattern per employee
            int shiftIdx = Math.abs(emp.getId().hashCode()) % shiftPatterns.length;
            String baseIn = shiftPatterns[shiftIdx][0];
            String baseOut = shiftPatterns[shiftIdx][1];

            LocalDate date = seedStart;
            // If employee has a dateOfJoining, start from DOJ
            if (emp.getDateOfJoining() != null) {
                LocalDate doj;
                if (emp.getDateOfJoining() instanceof java.sql.Date) {
                    doj = ((java.sql.Date) emp.getDateOfJoining()).toLocalDate();
                } else {
                    doj = LocalDate.ofInstant(emp.getDateOfJoining().toInstant(), java.time.ZoneId.systemDefault());
                }
                date = doj;
            }

            while (!date.isAfter(seedEnd)) {
                // Check if record already exists
                String existKey = emp.getId() + "-" + date;
                if (seen.containsKey(existKey)) {
                    date = date.plusDays(1);
                    continue;
                }

                // Determine attendance pattern
                java.time.DayOfWeek dow = date.getDayOfWeek();
                boolean isSunday = dow == java.time.DayOfWeek.SUNDAY;

                // Sundays: mostly absent (90% chance)
                if (isSunday && rng.nextInt(10) < 9) {
                    HrBiometricAttendance att = new HrBiometricAttendance();
                    att.setEmployeeId(emp.getId());
                    att.setAttendanceDate(date);
                    att.setStatus("ABSENT");
                    att.setCreatedBy("SYSTEM");
                    att.setCreatedDate(new Date());
                    att.setTotalHoursWorked(BigDecimal.ZERO);
                    att.setOvertimeHours(BigDecimal.ZERO);
                    att.setIsLate(0);
                    att.setIsEarlyExit(0);
                    try {
                        repository.save(att);
                        seededRecords++;
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    date = date.plusDays(1);
                    continue;
                }

                // Random absence: ~8% chance on weekdays
                if (!isSunday && rng.nextInt(100) < 8) {
                    HrBiometricAttendance att = new HrBiometricAttendance();
                    att.setEmployeeId(emp.getId());
                    att.setAttendanceDate(date);
                    att.setStatus("ABSENT");
                    att.setCreatedBy("SYSTEM");
                    att.setCreatedDate(new Date());
                    att.setTotalHoursWorked(BigDecimal.ZERO);
                    att.setOvertimeHours(BigDecimal.ZERO);
                    att.setIsLate(0);
                    att.setIsEarlyExit(0);
                    try {
                        repository.save(att);
                        seededRecords++;
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    date = date.plusDays(1);
                    continue;
                }

                // Present — generate realistic punch times
                int baseInMins = parseTimeToMinutes(baseIn);
                int baseOutMins = parseTimeToMinutes(baseOut);

                // Add ±15 min variation to punch-in
                int inVariation = rng.nextInt(31) - 10; // -10 to +20 min
                int actualInMins = baseInMins + inVariation;

                // Add ±30 min variation to punch-out
                int outVariation = rng.nextInt(61) - 15; // -15 to +45 min (allows OT)
                int actualOutMins = baseOutMins + outVariation;

                String punchIn = formatMinutesToTime(actualInMins);
                String punchOut = formatMinutesToTime(actualOutMins);

                int durationMins = Math.max(0, actualOutMins - actualInMins);
                BigDecimal totalHours = BigDecimal.valueOf(durationMins);

                String status;
                if (durationMins >= 480) {
                    status = "PRESENT";
                } else if (durationMins >= 240) {
                    status = "HALF_DAY";
                } else {
                    status = "ABSENT";
                }

                boolean isLate = actualInMins > baseInMins + 5;
                boolean isEarlyExit = actualOutMins < baseOutMins - 10;

                boolean otEligible = emp != null && "YES".equalsIgnoreCase(emp.getOtToggle());
                ShiftMaster seedShift = new ShiftMaster();
                seedShift.setEndTime(baseOut);
                BigDecimal otHours = overtimeCalculationService.calculateOtHours(parseLocalTime(punchIn), parseLocalTime(punchOut), seedShift, otEligible, null);

                HrBiometricAttendance att = new HrBiometricAttendance();
                att.setEmployeeId(emp.getId());
                att.setAttendanceDate(date);
                att.setStatus(status);
                att.setPunchIn(parseLocalTime(punchIn));
                att.setPunchOut(parseLocalTime(punchOut));
                att.setTotalHoursWorked(totalHours);
                att.setOvertimeHours(otHours);
                att.setIsLate(isLate ? actualInMins - baseInMins : 0);
                att.setIsEarlyExit(isEarlyExit ? baseOutMins - actualOutMins : 0);
                att.setCreatedBy("SYSTEM");
                att.setCreatedDate(new Date());

                try {
                    repository.save(att);
                    seededRecords++;
                } catch (DataIntegrityViolationException e) {
                    // Skip duplicates silently
                } catch (Exception e) {
                    e.printStackTrace();
                }

                date = date.plusDays(1);
            }
        }
        repository.flush();

        result.put("success", true);
        result.put("fixedNames", fixedNames);
        result.put("removedFutureRecords", removedFuture);
        result.put("removedDuplicates", removedDuplicates);
        result.put("seededRecords", seededRecords);
        result.put("message", "Historical data seeded successfully for all active employees (Jan 2026 to today).");
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1340", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            Optional<HrBiometricAttendance> opt = repository.findById(id);
            if (opt.isPresent()) {
                HrBiometricAttendance existing = opt.get();
                if (existing.getEsslInTime() != null || existing.getEsslOutTime() != null) {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Editing or deleting eSSL synced attendance records is not permitted. Please use manual attendance requests instead."));
                }
                repository.deleteById(id);
                return ResponseEntity.ok(Map.of("success", true, "message", "Record deleted successfully."));
            } else {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Record not found."));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Failed to delete record: " + e.getMessage()));
        }
    }

    // ==================== Private Helper Methods ====================

    private void enrichWagesType(HrBiometricAttendance att) {
        if (att == null) return;
        try {
            Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile> jobProfileOpt = employeeJobProfileRepository.findByEmployeeId(att.getEmployeeId());
            if (jobProfileOpt.isPresent() && jobProfileOpt.get().getWagesType() != null && !jobProfileOpt.get().getWagesType().trim().isEmpty()) {
                att.setWagesType(jobProfileOpt.get().getWagesType().trim());
            } else {
                att.setWagesType("Monthly");
            }
        } catch (Exception e) {
            att.setWagesType("Monthly");
        }
    }

    /**
     * Logs an audit entry when an attendance record is modified.
     */
    private void saveAuditLog(HrBiometricAttendance existing, HrBiometricAttendance updated, String modifiedBy) {
        HrAttendanceAuditLog audit = new HrAttendanceAuditLog();
        audit.setEmployeeId(existing.getEmployeeId());
        audit.setAttendanceDate(java.sql.Date.valueOf(existing.getAttendanceDate()));
        audit.setOriginalValue("In: " + existing.getPunchIn() + ", Out: " + existing.getPunchOut() + ", Status: " + existing.getStatus());
        audit.setUpdatedValue("In: " + updated.getPunchIn() + ", Out: " + updated.getPunchOut() + ", Status: " + updated.getStatus());
        audit.setModifiedBy(modifiedBy != null ? modifiedBy : "admin");
        audit.setModificationDate(new Date());
        audit.setReasonForChange(updated.getRemarks() != null ? updated.getRemarks() : "Manual Override");
        auditLogRepository.save(audit);
    }

    /**
     * Applies field updates from the incoming entry to the existing record.
     */
    private void applyUpdates(HrBiometricAttendance existing, HrBiometricAttendance entry) {
        existing.setEmployeeId(entry.getEmployeeId());
        existing.setAttendanceDate(entry.getAttendanceDate());
        existing.setPunchIn(entry.getPunchIn());
        existing.setPunchOut(entry.getPunchOut());
        existing.setStatus(entry.getStatus());
        existing.setRemarks(entry.getRemarks());
        existing.setShiftId(entry.getShiftId());
        existing.setIsLate(entry.getIsLate());
        existing.setIsEarlyExit(entry.getIsEarlyExit());
        existing.setUpdatedBy("admin");
        existing.setUpdatedDate(new Date());
    }

    /**
     * Formats total minutes since midnight into 12-hour time string (e.g., "09:15
     * AM").
     */
    private String formatMinutesToTime(int totalMins) {
        int h = totalMins / 60;
        int m = totalMins % 60;
        String amPm = h >= 12 ? "PM" : "AM";
        int h12 = h % 12;
        if (h12 == 0)
            h12 = 12;
        return String.format("%02d:%02d %s", h12, m, amPm);
    }

    private int calculateMinutesDiff(String inTime, String outTime) {
        try {
            int inMins = parseTimeToMinutes(inTime);
            int outMins = parseTimeToMinutes(outTime);
            return Math.max(0, outMins - inMins);
        } catch (Exception e) {
            return 0;
        }
    }

    private int parseTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) return 0;
        String clean = timeStr.trim().toUpperCase();
        boolean isPm = clean.contains("PM");
        String timePart = clean.replace("AM", "").replace("PM", "").trim();
        String[] parts = timePart.split(":");
        int h = Integer.parseInt(parts[0]);
        int m = (parts.length > 1 && parts[1] != null && !parts[1].trim().isEmpty())
                ? Integer.parseInt(parts[1].substring(0, 2).trim()) : 0;
        if (isPm && h < 12) h += 12;
        if (!isPm && h == 12) h = 0;
        return h * 60 + m;
    }

    /**
     * Nightly cleanup at 2:00 AM — removes attendance records for inactive/ATS employees.
     * Moved from the GET handler to avoid N+1 full-table-scan on every page load.
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 2 * * *", zone = "Asia/Kolkata")
    public void cleanupInvalidAttendanceRecords() {
        try {
            repository.deleteInvalidAttendanceRecords();
            log.info("[BiometricCleanup] Removed invalid attendance records via database query.");
        } catch (Exception e) {
            log.error("Failed to perform self-healing cleanup of invalid attendance records: ", e);
        }
    }

    private static final java.time.format.DateTimeFormatter TIME_FORMATTER =
            java.time.format.DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.US);

    private java.time.LocalTime parseLocalTime(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) return null;
        try {
            return java.time.LocalTime.parse(timeStr.trim(), TIME_FORMATTER);
        } catch (Exception e) {
            return null;
        }
    }
}

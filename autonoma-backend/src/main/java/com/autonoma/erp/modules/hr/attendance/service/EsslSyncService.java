package com.autonoma.erp.modules.hr.attendance.service;

import com.autonoma.erp.modules.hr.attendance.entity.HrBiometricAttendance;
import com.autonoma.erp.modules.hr.attendance.entity.HrAttendanceDailyLog;
import com.autonoma.erp.modules.hr.attendance.entity.HrDailyAttendance;
import com.autonoma.erp.modules.hr.attendance.entity.ShiftMaster;
import com.autonoma.erp.modules.hr.attendance.repository.HrBiometricAttendanceRepository;
import com.autonoma.erp.modules.hr.attendance.repository.HrAttendanceDailyLogRepository;
import com.autonoma.erp.modules.hr.attendance.repository.HrDailyAttendanceRepository;
import com.autonoma.erp.modules.hr.attendance.repository.ShiftMasterRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.util.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.autonoma.erp.modules.hr.attendance.entity.HrCanteenLog;
import com.autonoma.erp.modules.hr.attendance.repository.HrCanteenLogRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service responsible for syncing biometric attendance data from eSSL device tables
 * in the secondary database (ERPDb_NUTECH) to the primary AUTONOMA attendance table.
 *
 * The eSSL device stores raw biometric punches with decimal time values (e.g., 5.58, 19.02).
 * This service reads those raw logs, resolves employee records via emp_cd,
 * calculates total hours worked, determines status, and upserts into HR_BIOMETRIC_ATTENDANCE.
 */
@Service
public class EsslSyncService {

    private static final Logger log = LoggerFactory.getLogger(EsslSyncService.class);
    public static final Map<String, Date> lastSyncTimeMap = new java.util.concurrent.ConcurrentHashMap<>();

    @Autowired(required = false)
    @Qualifier("esslJdbcTemplate")
    private JdbcTemplate esslJdbcTemplate;

    @Autowired
    private HrBiometricAttendanceRepository attendanceRepository;

    @Autowired
    private HrCanteenLogRepository canteenLogRepository;

    @Autowired
    private EmployeeMasterRepository employeeRepository;

    @Autowired
    private ShiftMasterRepository shiftMasterRepository;

    @Autowired
    private HrAttendanceDailyLogRepository dailyLogRepository;

    @Autowired
    private HrDailyAttendanceRepository hrDailyAttendanceRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository holidayRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.leave.repository.HrLeaveRequestRepository leaveRequestRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.AppPreferenceRepository appPreferenceRepository;

    @Autowired
    private OvertimeCalculationService overtimeCalculationService;

    /**
     * Lists all user tables from the secondary database for diagnostic purposes.
     */
    public List<String> listSecondaryDbTables() {
        if (esslJdbcTemplate == null) {
            return Collections.singletonList("Secondary database not configured.");
        }
        try {
            String sql = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME";
            return esslJdbcTemplate.queryForList(sql, String.class);
        } catch (Exception e) {
            log.error("Failed to list secondary DB tables: {}", e.getMessage());
            return Collections.singletonList("Error: " + e.getMessage());
        }
    }

    /**
     * Queries columns from a specific table in the secondary database.
     */
    public List<Map<String, Object>> describeSecondaryTable(String tableName) {
        if (esslJdbcTemplate == null) {
            return Collections.emptyList();
        }
        try {
            String sql = "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE " +
                    "FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? ORDER BY ORDINAL_POSITION";
            return esslJdbcTemplate.queryForList(sql, tableName);
        } catch (Exception e) {
            log.error("Failed to describe table {}: {}", tableName, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Previews raw data from a table in the secondary database (top N rows).
     */
    public List<Map<String, Object>> previewSecondaryTable(String tableName, int limit) {
        if (esslJdbcTemplate == null) {
            return Collections.emptyList();
        }
        try {
            String sql = "SELECT TOP " + Math.min(limit, 100) + " * FROM [" + tableName + "]";
            return esslJdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            log.error("Failed to preview table {}: {}", tableName, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Main sync method: pulls biometric log data from the secondary DB,
     * resolves employee records, calculates hours, and upserts into attendance.
     *
     * @param esslTableName The name of the eSSL log table in the secondary DB
     * @param empCdColumn   Column name for employee code (e.g., "emp_cd", "EMP_CD")
     * @param dateColumn    Column name for attendance date (e.g., "att_date", "ATTENDANCE_DATE")
     * @param inTimeColumn  Column name for in-time (e.g., "in_time", "IN_TIME")
     * @param outTimeColumn Column name for out-time (e.g., "out_time", "OUT_TIME")
     */
    public Map<String, Object> syncRecentFromEssl(
            String esslTableName,
            String empCdColumn,
            String dateColumn,
            String inTimeColumn,
            String outTimeColumn) {
        LocalDate today = LocalDate.now();
        String month = today.getMonth().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH);
        int year = today.getYear();
        return syncFromEssl(esslTableName, empCdColumn, dateColumn, inTimeColumn, outTimeColumn, month, year);
    }

    public Map<String, Object> syncFromEssl(
            String esslTableName,
            String empCdColumn,
            String dateColumn,
            String inTimeColumn,
            String outTimeColumn,
            String month,
            int year) {

        long totalStartTime = System.currentTimeMillis();

        Map<String, Object> result = new HashMap<>();
        log.info("eSSL Sync Log: Sync Started for month: {}, year: {}", month, year);

        if (esslJdbcTemplate == null) {
            log.error("eSSL Sync Log: Connection Failed (ESSL database is not configured.)");
            result.put("success", false);
            result.put("message", "ESSL database is not configured.");
            return result;
        }

        // Resolve month
        List<String> months = Arrays.asList(
                "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
        );
        int monthVal = months.indexOf(month.trim().toUpperCase()) + 1;
        if (monthVal <= 0) {
            result.put("success", false);
            result.put("message", "Invalid month: " + month);
            return result;
        }

        Set<String> existingTables = getExistingTableNames();

        // Check if eTimeTrackLite mode
        boolean isETimeTrackLite = existingTables.contains("EMPLOYEES") && existingTables.contains("ATTENDANCELOGS");

        // Build employee code -> ID map for all employees
        List<EmployeeMaster> allEmployees = employeeRepository.findAll();
        Map<String, Long> empCodeToId = new HashMap<>();
        for (EmployeeMaster e : allEmployees) {
            if (e.getEmpCode() != null && !e.getEmpCode().trim().isEmpty()) {
                String code = e.getEmpCode().trim().toUpperCase();
                empCodeToId.put(code, e.getId());
                String numSuffix = code.contains("-") ? code.substring(code.lastIndexOf("-") + 1) : code;
                try {
                    long num = Long.parseLong(numSuffix.replaceAll("[^0-9]", ""));
                    empCodeToId.put(String.valueOf(num), e.getId());
                    empCodeToId.put(String.format("%02d", num), e.getId());
                    empCodeToId.put(String.format("%03d", num), e.getId());
                    empCodeToId.put(String.format("%04d", num), e.getId());
                    empCodeToId.put(String.format("%05d", num), e.getId());
                    empCodeToId.put(String.format("%06d", num), e.getId());
                } catch (Exception ex) {}
            }
            if (e.getOldEmpCode() != null && !e.getOldEmpCode().trim().isEmpty()) {
                String oldCode = e.getOldEmpCode().trim().toUpperCase();
                empCodeToId.put(oldCode, e.getId());
                String oldNumSuffix = oldCode.contains("-") ? oldCode.substring(oldCode.lastIndexOf("-") + 1) : oldCode;
                try {
                    long oldNum = Long.parseLong(oldNumSuffix.replaceAll("[^0-9]", ""));
                    empCodeToId.put(String.valueOf(oldNum), e.getId());
                    empCodeToId.put(String.format("%02d", oldNum), e.getId());
                    empCodeToId.put(String.format("%03d", oldNum), e.getId());
                    empCodeToId.put(String.format("%04d", oldNum), e.getId());
                    empCodeToId.put(String.format("%05d", oldNum), e.getId());
                    empCodeToId.put(String.format("%06d", oldNum), e.getId());
                } catch (Exception ex) {}
            }
        }

        // Build employee -> shift maps (by shiftCode AND shiftName for robust matching)
        List<ShiftMaster> activeShifts = shiftMasterRepository.findByIsActiveTrue();
        Map<String, ShiftMaster> shiftCodeMap = activeShifts.stream()
                .filter(s -> s.getShiftCode() != null)
                .collect(Collectors.toMap(
                        s -> s.getShiftCode().trim().toUpperCase(),
                        s -> s,
                        (s1, s2) -> s1
                ));
        Map<String, ShiftMaster> shiftNameMap = activeShifts.stream()
                .filter(s -> s.getShiftName() != null)
                .collect(Collectors.toMap(
                        s -> s.getShiftName().trim().toUpperCase(),
                        s -> s,
                        (s1, s2) -> s1
                ));

        // Default shift: only used for propagation to daily logs, not for biometric records
        ShiftMaster defaultShift = shiftNameMap.getOrDefault("GENERAL",
                !activeShifts.isEmpty() ? activeShifts.get(0) : null);

        String currentUserId = "admin";
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
            if (currentUserId == null || currentUserId.trim().isEmpty()) {
                currentUserId = "admin";
            }
        } catch (Exception e) {}

        // Query eSSL data from secondary DB
        LocalDate startDate = LocalDate.of(year, monthVal, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        String clientId = com.autonoma.erp.config.essl.EsslDataSourceContextHolder.getClientId();
        if (clientId == null) {
            clientId = "DEFAULT";
        }
        
        // Incremental sync: find the latest synced attendance date in local database
        Date lastSync = lastSyncTimeMap.get(clientId);
        LocalDate filterStartDate = startDate;

        boolean isCheckInOutMode = !isETimeTrackLite && esslJdbcTemplate != null && existingTables.contains("CHECKINOUT");
        JdbcTemplate activeTemplate = esslJdbcTemplate;

        try (java.sql.Connection conn = activeTemplate.getDataSource().getConnection()) {
            log.info("eSSL database connection metadata URL: {}", conn.getMetaData().getURL());
        } catch (Exception ex) {
            log.warn("Failed to get connection metadata: {}", ex.getMessage());
        }

        log.info("eSSL Sync Info: isETimeTrackLite={}, isCheckInOutMode={}", isETimeTrackLite, isCheckInOutMode);

        long queryStartTime = System.currentTimeMillis();
        List<Map<String, Object>> esslRows = new ArrayList<>();
        int processedCount = 0;
        int skippedCount = 0;
        int unmatchedCount = 0;
        int insertedCount = 0;
        int updatedCount = 0;
        int duplicateSkippedCount = 0;
        List<String> unmatchedCodes = new ArrayList<>();

        try {
            if (isCheckInOutMode) {
                // Direct CHECKINOUT table sync
                String checkInOutSql = "SELECT USERID, CHECKTIME FROM CHECKINOUT WHERE CHECKTIME >= ? AND CHECKTIME <= ?";
                java.sql.Timestamp startTs = java.sql.Timestamp.valueOf(startDate.atStartOfDay());
                java.sql.Timestamp endTs = java.sql.Timestamp.valueOf(endDate.atTime(23, 59, 59));
                
                List<Map<String, Object>> rawPunches = activeTemplate.queryForList(checkInOutSql, startTs, endTs);
                
                // Group raw punches by USERID and date
                Map<String, Map<LocalDate, List<LocalDateTime>>> groupedPunches = new HashMap<>();
                for (Map<String, Object> punch : rawPunches) {
                    String userId = punch.get("USERID") != null ? punch.get("USERID").toString().trim() : null;
                    Object checkTimeObj = punch.get("CHECKTIME");
                    if (userId == null || checkTimeObj == null) continue;
                    
                    LocalDateTime checkTime = null;
                    if (checkTimeObj instanceof java.sql.Timestamp) {
                        checkTime = ((java.sql.Timestamp) checkTimeObj).toLocalDateTime();
                    } else if (checkTimeObj instanceof java.util.Date) {
                        checkTime = new java.sql.Timestamp(((java.util.Date) checkTimeObj).getTime()).toLocalDateTime();
                    }
                    
                    if (checkTime == null) continue;
                    
                    LocalDate dt = checkTime.toLocalDate();
                    groupedPunches.computeIfAbsent(userId, k -> new HashMap<>())
                                  .computeIfAbsent(dt, k -> new ArrayList<>())
                                  .add(checkTime);
                }
                
                // Convert grouped punches to standard log format
                for (Map.Entry<String, Map<LocalDate, List<LocalDateTime>>> userEntry : groupedPunches.entrySet()) {
                    String userId = userEntry.getKey();
                    for (Map.Entry<LocalDate, List<LocalDateTime>> dateEntry : userEntry.getValue().entrySet()) {
                        LocalDate dt = dateEntry.getKey();
                        List<LocalDateTime> times = dateEntry.getValue();
                        if (times.isEmpty()) continue;
                        
                        LocalDateTime firstPunch = Collections.min(times);
                        LocalDateTime maxPunch = Collections.max(times);
                        LocalDateTime lastPunch = !maxPunch.equals(firstPunch) ? maxPunch : null;
                        
                        long woMinutes = lastPunch != null ? java.time.Duration.between(firstPunch, lastPunch).toMinutes() : 0;
                        long otMinutes = woMinutes > 480 ? woMinutes - 480 : 0;
                        
                        String status = "A";
                        if (woMinutes >= 480) {
                            status = "P";
                        } else if (woMinutes >= 240) {
                            status = "H";
                        }
                        
                        Map<String, Object> rowMap = new HashMap<>();
                        rowMap.put("EmployeeCode", userId);
                        rowMap.put("DATE", java.sql.Date.valueOf(dt));
                        rowMap.put("IN_TIME", formatTime(firstPunch));
                        rowMap.put("OUT_TIME", lastPunch != null ? formatTime(lastPunch) : null);
                        rowMap.put("WO_Minutes", (double) woMinutes);
                        rowMap.put("OT", (double) otMinutes);
                        rowMap.put("ATTEN_STATUS", status);
                        rowMap.put("LATITUDE_IN", null);
                        rowMap.put("LONGITUDE_IN", null);
                        rowMap.put("LATITUDE_OUT", null);
                        rowMap.put("LONGITUDE_OUT", null);
                        rowMap.put("LOCATION_IN", null);
                        rowMap.put("LOCATION_OUT", null);
                        rowMap.put("DEVICE_IMAGE", null);
                        
                        esslRows.add(rowMap);
                    }
                }
            } else {
                String sql;
                Object[] params;
                if (isETimeTrackLite) {
                    String rawTableName = "DeviceLogs_" + monthVal + "_" + year;
                    boolean rawTableExists = checkTableExists(rawTableName);
                    if (!rawTableExists && checkTableExists("HR_ESSL_DEVICE_LOGS")) {
                        rawTableName = "HR_ESSL_DEVICE_LOGS";
                        rawTableExists = true;
                    } else if (!rawTableExists && checkTableExists("DeviceLogs")) {
                        rawTableName = "DeviceLogs";
                        rawTableExists = true;
                    }
                    if (rawTableExists) {
                        sql = String.format(
                            "WITH MinPunch AS ( " +
                            "    SELECT UserId, CAST(LogDate as Date) as dt, Latitude, Longitude, LocationAddress, EmployeeImage " +
                            "    FROM ( " +
                            "        SELECT UserId, LogDate, Latitude, Longitude, LocationAddress, EmployeeImage, " +
                            "               ROW_NUMBER() OVER (PARTITION BY UserId, CAST(LogDate as Date) ORDER BY LogDate ASC) as rn " +
                            "        FROM [%s] WHERE LogDate >= ? AND LogDate < ? " +
                            "    ) t WHERE rn = 1 " +
                            "), " +
                            "MaxPunch AS ( " +
                            "    SELECT UserId, CAST(LogDate as Date) as dt, Latitude, Longitude, LocationAddress " +
                            "    FROM ( " +
                            "        SELECT UserId, LogDate, Latitude, Longitude, LocationAddress, " +
                            "               ROW_NUMBER() OVER (PARTITION BY UserId, CAST(LogDate as Date) ORDER BY LogDate DESC) as rn " +
                            "        FROM [%s] WHERE LogDate >= ? AND LogDate < ? " +
                            "    ) t WHERE rn = 1 " +
                            ") " +
                            "SELECT * FROM ( " +
                            "    SELECT ROW_NUMBER() OVER (PARTITION BY ISNULL(k.EmployeeCode, CAST(k.EmployeeId AS NVARCHAR(50))), k.DATE ORDER BY k.fromWhere, k.Date ASC) AS RowNumberDuplicate, * " +
                            "    FROM ( " +
                            "        SELECT 'AttLog' AS fromWhere, " +
                            "               b.EmployeeId, " +
                            "               CAST(a.StatusCode as varchar(15)) AS ATTEN_STATUS, " +
                            "               ISNULL(ROUND(a.Duration,2),0) AS WO_Minutes, " +
                            "               CAST(a.AttendanceDate as date) AS DATE, " +
                            "               DAY(a.AttendanceDate) AS DAY, " +
                            "               ISNULL(a.LateBy,0) AS LATE_MIN, " +
                            "               ISNULL(a.EarlyBy,0) AS EARLY_MIN, " +
                            "               ISNULL(a.OverTime,0) AS OT, " +
                            "               convert(char(5), cast(a.InTime as time), 108) AS IN_TIME, " +
                            "               convert(char(5), cast(a.OutTime as time), 108) AS OUT_TIME, " +
                            "               ISNULL(b.EmployeeCode, CAST(a.EmployeeId AS NVARCHAR(50))) AS EmployeeCode, " +
                            "               ip.Latitude AS LATITUDE_IN, " +
                            "               ip.Longitude AS LONGITUDE_IN, " +
                            "               op.Latitude AS LATITUDE_OUT, " +
                            "               op.Longitude AS LONGITUDE_OUT, " +
                            "               ip.LocationAddress AS LOCATION_IN, " +
                            "               op.LocationAddress AS LOCATION_OUT, " +
                            "               ip.EmployeeImage AS DEVICE_IMAGE " +
                            "        FROM AttendanceLogs a " +
                            "        LEFT JOIN Employees b ON a.EmployeeId = b.EmployeeId " +
                            "        LEFT JOIN MinPunch ip ON ip.UserId = b.EmployeeCodeInDevice AND ip.dt = CAST(a.AttendanceDate as date) " +
                            "        LEFT JOIN MaxPunch op ON op.UserId = b.EmployeeCodeInDevice AND op.dt = CAST(a.AttendanceDate as date) " +
                            "        WHERE a.AttendanceDate >= ? AND a.AttendanceDate <= ? " +
                            " " +
                            "        UNION ALL " +
                            " " +
                            "        SELECT 'DevLog' AS fromWhere, " +
                            "               b.EmployeeId, " +
                            "               (CASE WHEN k.WO_HOURS > 0 THEN 'P' ELSE 'A' END) AS ATTEN_STATUS, " +
                            "               k.WO_HOURS AS WO_Minutes, " +
                            "               CAST(k.ATTEN_DT as date) AS DATE, " +
                            "               k.DAY, " +
                            "               0 AS LATE_MIN, " +
                            "               0 AS EARLY_MIN, " +
                            "               (CASE WHEN k.WO_HOURS > 480 THEN k.WO_HOURS - 480 ELSE 0 END) AS OT, " +
                            "               k.IN_TIME, " +
                            "               k.OUT_TIME, " +
                            "               ISNULL(b.EmployeeCode, k.UserId) AS EmployeeCode, " +
                            "               ip.Latitude AS LATITUDE_IN, " +
                            "               ip.Longitude AS LONGITUDE_IN, " +
                            "               op.Latitude AS LATITUDE_OUT, " +
                            "               op.Longitude AS LONGITUDE_OUT, " +
                            "               ip.LocationAddress AS LOCATION_IN, " +
                            "               op.LocationAddress AS LOCATION_OUT, " +
                            "               ip.EmployeeImage AS DEVICE_IMAGE " +
                            "        FROM ( " +
                            "            SELECT UserId, " +
                            "                   CONVERT(VARCHAR(10), LogDate, 120) AS ATTEN_DT, " +
                            "                   CONVERT(VARCHAR(5), min(LogDate), 108) AS IN_TIME, " +
                            "                   CONVERT(VARCHAR(5), CASE WHEN min(LogDate) != MAX(LogDate) THEN MAX(LogDate) ELSE (CASE WHEN CONVERT(VARCHAR(10), min(LogDate), 120) != CONVERT(VARCHAR(10), GETDATE(), 120) THEN min(LogDate) ELSE GETDATE() END) END, 108) AS OUT_TIME, " +
                            "                   DATEDIFF(MINUTE, min(LogDate), CASE WHEN min(LogDate) != MAX(LogDate) THEN MAX(LogDate) ELSE (CASE WHEN CONVERT(VARCHAR(10), min(LogDate), 120) != CONVERT(VARCHAR(10), GETDATE(), 120) THEN min(LogDate) ELSE GETDATE() END) END) AS WO_HOURS, " +
                            "                   DAY(min(LogDate)) AS DAY " +
                            "            FROM [%s] " +
                            "            WHERE LogDate >= ? AND LogDate < ? " +
                            "            GROUP BY CONVERT(VARCHAR(10), LogDate, 120), UserId " +
                            "        ) k " +
                            "        LEFT JOIN Employees b ON b.EmployeeCodeInDevice = k.UserId " +
                            "        LEFT JOIN MinPunch ip ON ip.UserId = b.EmployeeCodeInDevice AND ip.dt = CAST(k.ATTEN_DT as date) " +
                            "        LEFT JOIN MaxPunch op ON op.UserId = b.EmployeeCodeInDevice AND op.dt = CAST(k.ATTEN_DT as date) " +
                            "    ) k " +
                            ") z WHERE z.RowNumberDuplicate = 1",
                            rawTableName, rawTableName, rawTableName
                        );
                        params = new Object[]{
                            java.sql.Timestamp.valueOf(startDate.atStartOfDay()), java.sql.Timestamp.valueOf(endDate.plusDays(1).atStartOfDay()),
                            java.sql.Timestamp.valueOf(startDate.atStartOfDay()), java.sql.Timestamp.valueOf(endDate.plusDays(1).atStartOfDay()),
                            java.sql.Date.valueOf(startDate), java.sql.Date.valueOf(endDate),
                            java.sql.Timestamp.valueOf(startDate.atStartOfDay()), java.sql.Timestamp.valueOf(endDate.plusDays(1).atStartOfDay())
                        };
                    } else {
                        sql = "SELECT 'AttLog' AS fromWhere, " +
                            "       b.EmployeeId, " +
                            "       CAST(StatusCode as varchar(15)) AS ATTEN_STATUS, " +
                            "       ISNULL(ROUND(Duration,2),0) AS WO_Minutes, " +
                            "       CAST(AttendanceDate as date) AS DATE, " +
                            "       DAY(AttendanceDate) AS DAY, " +
                            "       ISNULL(LateBy,0) AS LATE_MIN, " +
                            "       ISNULL(EarlyBy,0) AS EARLY_MIN, " +
                            "       ISNULL(OverTime,0) AS OT, " +
                            "       convert(char(5), cast(InTime as time), 108) AS IN_TIME, " +
                            "       convert(char(5), cast(OutTime as time), 108) AS OUT_TIME, " +
                            "       ISNULL(b.EmployeeCode, CAST(a.EmployeeId AS NVARCHAR(50))) AS EmployeeCode, " +
                            "       CAST(NULL AS NVARCHAR(50)) AS LATITUDE_IN, " +
                            "       CAST(NULL AS NVARCHAR(50)) AS LONGITUDE_IN, " +
                            "       CAST(NULL AS NVARCHAR(50)) AS LATITUDE_OUT, " +
                            "       CAST(NULL AS NVARCHAR(50)) AS LONGITUDE_OUT, " +
                            "       CAST(NULL AS NVARCHAR(500)) AS LOCATION_IN, " +
                            "       CAST(NULL AS NVARCHAR(500)) AS LOCATION_OUT, " +
                            "       CAST(NULL AS VARBINARY(MAX)) AS DEVICE_IMAGE " +
                            "FROM AttendanceLogs a " +
                            "LEFT JOIN Employees b ON a.EmployeeId = b.EmployeeId " +
                            "WHERE AttendanceDate >= ? AND AttendanceDate <= ?";
                        params = new Object[]{java.sql.Date.valueOf(startDate), java.sql.Date.valueOf(endDate)};
                    }
                } else {
                    String targetTableName = esslTableName != null ? esslTableName.trim() : "HR_BIOMETRIC_ATTENDANCE";
                    String targetEmpCol = empCdColumn != null ? empCdColumn.trim() : "EMP_CODE";
                    String targetDateCol = dateColumn != null ? dateColumn.trim() : "ATTENDANCE_DATE";
                    String targetInCol = inTimeColumn != null ? inTimeColumn.trim() : "IN_TIME";
                    String targetOutCol = outTimeColumn != null ? outTimeColumn.trim() : "OUT_TIME";

                    if (!checkTableExists(targetTableName)) {
                        if (checkTableExists("HR_BIOMETRIC_ATTENDANCE")) {
                            targetTableName = "HR_BIOMETRIC_ATTENDANCE";
                            targetEmpCol = "EMP_CODE";
                            targetDateCol = "ATTENDANCE_DATE";
                            targetInCol = "IN_TIME";
                            targetOutCol = "OUT_TIME";
                        } else if (checkTableExists("HR_DAILY_ATTENDANCE_LOG")) {
                            targetTableName = "HR_DAILY_ATTENDANCE_LOG";
                            targetEmpCol = "EMP_CODE";
                            targetDateCol = "ATTENDANCE_DATE";
                            targetInCol = "ACTUAL_IN_TIME";
                            targetOutCol = "ACTUAL_OUT_TIME";
                        } else {
                            log.warn("eSSL sync: Target table '{}' not found in secondary database.", targetTableName);
                            result.put("success", true);
                            result.put("message", "Target table '" + targetTableName + "' not found in secondary database. No records synced.");
                            result.put("totalRecordsFound", 0);
                            result.put("insertedCount", 0);
                            result.put("updatedCount", 0);
                            return result;
                        }
                    }

                    sql = String.format(
                        "SELECT [%s] AS emp_cd, [%s] AS att_date, [%s] AS in_time, [%s] AS out_time FROM [%s] " +
                                "WHERE [%s] >= ? AND [%s] <= ?",
                        targetEmpCol, targetDateCol, targetInCol, targetOutCol, targetTableName,
                        targetDateCol, targetDateCol
                    );
                    params = new Object[]{java.sql.Date.valueOf(startDate), java.sql.Date.valueOf(endDate)};
                }
                esslRows = activeTemplate.queryForList(sql, params);
                log.info("eSSL sync: Found {} raw records for {}/{}", esslRows.size(), month, year);
            }

            long queryEndTime = System.currentTimeMillis();
            long queryDuration = queryEndTime - queryStartTime;
            log.info("eSSL Sync Durations: Query finished in {}ms", queryDuration);

            long preloadStartTime = System.currentTimeMillis();
            Map<Long, EmployeeMaster> employeeIdMap = allEmployees.stream().collect(Collectors.toMap(EmployeeMaster::getId, e -> e, (e1, e2) -> e1));
            List<HrBiometricAttendance> existingLogs = attendanceRepository.findByAttendanceDateBetween(startDate, endDate);
            Map<String, HrBiometricAttendance> existingLogsMap = new HashMap<>();
            for (HrBiometricAttendance logEnt : existingLogs) {
                existingLogsMap.put(logEnt.getEmployeeId() + "_" + logEnt.getAttendanceDate(), logEnt);
            }
            List<HrBiometricAttendance> logsToSave = new ArrayList<>();

            log.info("eSSL Sync: preloading holidays between {} and {}...", startDate, endDate);
            List<com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster> monthHolidays = holidayRepository.findByHolidayDateBetween(startDate, endDate);
            Map<LocalDate, com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster> holidayMap = monthHolidays.stream()
                    .filter(h -> h.getIsActive() != null && h.getIsActive())
                    .collect(Collectors.toMap(h -> h.getHolidayDate(), h -> h, (h1, h2) -> h1));

            log.info("eSSL Sync: preloading leave requests between {} and {}...", startDate, endDate);
            List<com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest> monthLeaves = leaveRequestRepository.findAllApprovedBetween(startDate, endDate);
            Map<Long, List<com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest>> employeeLeavesMap = monthLeaves.stream()
                    .filter(l -> l.getEmpId() != null)
                    .collect(Collectors.groupingBy(l -> l.getEmpId()));

            long preloadEndTime = System.currentTimeMillis();
            long preloadDuration = preloadEndTime - preloadStartTime;
            log.info("eSSL Sync Durations: Preload finished in {}ms", preloadDuration);

            long processStartTime = System.currentTimeMillis();
            for (Map<String, Object> row : esslRows) {
                try {
                    Object empCdObj = getCaseInsensitive(row, "EmployeeCode");
                    if (empCdObj == null) {
                        empCdObj = getCaseInsensitive(row, "emp_cd");
                    }
                    String empCd = empCdObj != null ? empCdObj.toString().trim().toUpperCase() : null;

                    if (empCd == null || empCd.isEmpty()) {
                        skippedCount++;
                        continue;
                    }

                    // Resolve employee ID from emp_code using a robust matching strategy
                    Long employeeId = null;
                    if (empCodeToId.containsKey(empCd)) {
                        employeeId = empCodeToId.get(empCd);
                    } else {
                        for (EmployeeMaster e : allEmployees) {
                            String oldCode = e.getOldEmpCode();
                            if (oldCode != null && !oldCode.trim().isEmpty()) {
                                String cleanOld = oldCode.trim().toUpperCase();
                                String cleanCd = empCd.trim().toUpperCase();
                                if (cleanOld.equals(cleanCd) || cleanOld.endsWith("-" + cleanCd) || cleanCd.endsWith("-" + cleanOld)) {
                                    employeeId = e.getId();
                                    break;
                                }
                                try {
                                    String oldSuffix = cleanOld.contains("-") ? cleanOld.substring(cleanOld.lastIndexOf("-") + 1) : cleanOld;
                                    String cdSuffix = cleanCd.contains("-") ? cleanCd.substring(cleanCd.lastIndexOf("-") + 1) : cleanCd;
                                    long oldNum = Long.parseLong(oldSuffix.replaceAll("[^0-9]", ""));
                                    long cdNum = Long.parseLong(cdSuffix.replaceAll("[^0-9]", ""));
                                    if (oldNum == cdNum) {
                                        employeeId = e.getId();
                                        break;
                                    }
                                } catch (Exception ex) {}
                            }
                            String normalCode = e.getEmpCode();
                            if (normalCode != null && !normalCode.trim().isEmpty()) {
                                String cleanNorm = normalCode.trim().toUpperCase();
                                String cleanCd = empCd.trim().toUpperCase();
                                if (cleanNorm.equals(cleanCd) || cleanNorm.endsWith("-" + cleanCd) || cleanCd.endsWith("-" + cleanNorm)) {
                                    employeeId = e.getId();
                                    break;
                                }
                                try {
                                    String normSuffix = cleanNorm.contains("-") ? cleanNorm.substring(cleanNorm.lastIndexOf("-") + 1) : cleanNorm;
                                    String cdSuffix = cleanCd.contains("-") ? cleanCd.substring(cleanCd.lastIndexOf("-") + 1) : cleanCd;
                                    long normNum = Long.parseLong(normSuffix.replaceAll("[^0-9]", ""));
                                    long cdNum = Long.parseLong(cdSuffix.replaceAll("[^0-9]", ""));
                                    if (normNum == cdNum) {
                                        employeeId = e.getId();
                                        break;
                                    }
                                } catch (Exception ex) {}
                            }
                        }
                        empCodeToId.put(empCd, employeeId);
                    }
                    if (employeeId == null) {
                        unmatchedCount++;
                        if (!unmatchedCodes.contains(empCd)) {
                            unmatchedCodes.add(empCd);
                        }
                        log.warn("Employee Not Mapped: eSSL Employee Code '{}' could not be mapped to any active ERP employee.", empCd);
                        continue;
                    }

                    // Bypass ID-based validation since ERP employee ID and eSSL internal employee ID are independent database sequences
                    // and only employee code (EMP_CODE) is used for mapping.

                    // Parse date
                    LocalDate attDate;
                    Object dateObj = getCaseInsensitive(row, "DATE");
                    if (dateObj == null) {
                        dateObj = getCaseInsensitive(row, "att_date");
                    }
                    if (dateObj instanceof java.sql.Date) {
                        attDate = ((java.sql.Date) dateObj).toLocalDate();
                    } else if (dateObj instanceof java.sql.Timestamp) {
                        attDate = ((java.sql.Timestamp) dateObj).toLocalDateTime().toLocalDate();
                    } else if (dateObj != null) {
                        attDate = LocalDate.parse(dateObj.toString().substring(0, 10));
                    } else {
                        skippedCount++;
                        continue;
                    }

                    if (attDate.isBefore(startDate) || attDate.isAfter(endDate)) {
                        skippedCount++;
                        continue;
                    }

                    // Parse in_time and out_time
                    Object inTimeObj = getCaseInsensitive(row, "IN_TIME");
                    if (inTimeObj == null) {
                        inTimeObj = getCaseInsensitive(row, "in_time");
                    }
                    BigDecimal inTime = parseToBigDecimal(inTimeObj);

                    Object outTimeObj = getCaseInsensitive(row, "OUT_TIME");
                    if (outTimeObj == null) {
                        outTimeObj = getCaseInsensitive(row, "out_time");
                    }
                    BigDecimal outTime = parseToBigDecimal(outTimeObj);

                    EmployeeMaster emp = employeeIdMap.get(employeeId);
                    // Resolve shift from employee's shiftName field, matching against ShiftMaster
                    ShiftMaster assignedShift = null;
                    if (emp != null && emp.getShiftName() != null && !emp.getShiftName().trim().isEmpty()) {
                        String empShiftName = emp.getShiftName().trim().toUpperCase();
                        // Try matching by shiftName first, then by shiftCode as fallback
                        assignedShift = shiftNameMap.get(empShiftName);
                        if (assignedShift == null) {
                            assignedShift = shiftCodeMap.get(empShiftName);
                        }
                        if (assignedShift == null) {
                            log.debug("Shift '{}' for employee {} not found in ShiftMaster; leaving shift unmapped.",
                                    emp.getShiftName(), empCd);
                        }
                    }

                    BigDecimal standardHours = assignedShift != null ? assignedShift.getStandardHours() : new BigDecimal("8.00");
                    int graceMinutes = assignedShift != null && assignedShift.getGraceMinutes() != null
                            ? assignedShift.getGraceMinutes() : 15;

                    // Calculate total hours worked, late arrival, and early exit in minutes
                    int totalHoursWorkedMins = 0;
                    int lateMins = 0;
                    int earlyMins = 0;
                    BigDecimal overtime = BigDecimal.ZERO;
                    String status = "PRESENT";

                    if (isETimeTrackLite) {
                        Object woMinsObj = getCaseInsensitive(row, "WO_Minutes");
                        double woMinutes = woMinsObj != null ? Double.parseDouble(woMinsObj.toString()) : 0.0;
                        totalHoursWorkedMins = (int) Math.round(woMinutes);
                        
                        Object otObj = getCaseInsensitive(row, "OT");
                        double otMinutes = otObj != null ? Double.parseDouble(otObj.toString()) : 0.0;
                        boolean otEligible = emp != null && "YES".equalsIgnoreCase(emp.getOtToggle());
                        if (otEligible) {
                            otMinutes = calculateOtMinsByMinimumOtMins(otMinutes);
                        } else {
                            otMinutes = 0.0;
                        }
                        overtime = BigDecimal.valueOf(otMinutes).setScale(2, RoundingMode.HALF_UP);

                        Object attenStatusObj = getCaseInsensitive(row, "ATTEN_STATUS");
                        String attenStatusStr = attenStatusObj != null ? attenStatusObj.toString().trim().toUpperCase() : null;
                        if (attenStatusStr != null) {
                            if (attenStatusStr.equals("A") || attenStatusStr.contains("ABSENT")) {
                                status = "ABSENT";
                            } else if (attenStatusStr.contains("½") || attenStatusStr.contains("HALF")) {
                                status = "HALF_DAY";
                            } else {
                                status = "PRESENT";
                            }
                        }

                        Object lateMinObj = getCaseInsensitive(row, "LATE_MIN");
                        lateMins = lateMinObj != null ? ((Number) lateMinObj).intValue() : 0;
                        
                        Object earlyMinObj = getCaseInsensitive(row, "EARLY_MIN");
                        earlyMins = earlyMinObj != null ? ((Number) earlyMinObj).intValue() : 0;
                    } else {
                        // Calculate total hours worked: out_time - in_time
                        if (inTime != null && outTime != null) {
                            int inMins = decimalTimeToMinutes(inTime);
                            int outMins = decimalTimeToMinutes(outTime);
                            totalHoursWorkedMins = outMins - inMins;
                            // Handle negative (night shift crossing midnight)
                            if (totalHoursWorkedMins < 0) {
                                totalHoursWorkedMins += 24 * 60;
                            }
                        }

                        // Determine status based on total hours
                        int standardMins = standardHours.multiply(new BigDecimal("60")).intValue();
                        if (totalHoursWorkedMins >= standardMins) {
                            status = "PRESENT";
                        } else if (totalHoursWorkedMins >= standardMins / 2) {
                            status = "HALF_DAY";
                        } else {
                            status = "ABSENT";
                        }

                        // Calculate overtime (> standard hours)
                        if (totalHoursWorkedMins > standardMins) {
                            double otMins = totalHoursWorkedMins - standardMins;
                            boolean otEligible = emp != null && "YES".equalsIgnoreCase(emp.getOtToggle());
                            if (otEligible) {
                                otMins = calculateOtMinsByMinimumOtMins(otMins);
                            } else {
                                otMins = 0.0;
                            }
                            overtime = BigDecimal.valueOf(otMins).setScale(2, RoundingMode.HALF_UP);
                        }

                        // Determine late arrival
                        if (inTime != null && assignedShift != null) {
                            int actualInMins = decimalTimeToMinutes(inTime);
                            int shiftStartMins = parseTimeToMinutes(assignedShift.getStartTime());
                            if (actualInMins > shiftStartMins + graceMinutes) {
                                lateMins = actualInMins - shiftStartMins;
                            }
                        }

                        // Determine early exit
                        if (outTime != null && assignedShift != null && !"ABSENT".equals(status)) {
                            int actualOutMins = decimalTimeToMinutes(outTime);
                            int shiftEndMins = parseTimeToMinutes(assignedShift.getEndTime());
                            if (actualOutMins < shiftEndMins) {
                                earlyMins = shiftEndMins - actualOutMins;
                            }
                        }
                    }

                    // Convert decimal time to readable HH:MM format for punchIn/punchOut
                    Object rowInTime = getCaseInsensitive(row, "IN_TIME");
                    Object rowOutTime = getCaseInsensitive(row, "OUT_TIME");
                    String punchInStr = isETimeTrackLite && rowInTime != null ? formatTimeString(rowInTime.toString()) : decimalToTimeString(inTime);
                    String punchOutStr = isETimeTrackLite && rowOutTime != null ? formatTimeString(rowOutTime.toString()) : decimalToTimeString(outTime);

                    // Upsert into attendance
                    String existingKey = employeeId + "_" + attDate;
                    HrBiometricAttendance att = existingLogsMap.get(existingKey);
                    boolean isUpdate = att != null;
                    
                    // Capture original values for change detection
                    java.time.LocalTime oldPunchIn = null;
                    java.time.LocalTime oldPunchOut = null;
                    BigDecimal oldEsslInTime = null;
                    BigDecimal oldEsslOutTime = null;
                    BigDecimal oldTotalHoursWorked = null;
                    BigDecimal oldOvertimeHours = null;
                    String oldStatus = null;
                    Integer oldIsLate = null;
                    Integer oldIsEarlyExit = null;
                    Long oldShiftId = null;
                    String oldRemarks = null;
                    String oldLatIn = null, oldLonIn = null, oldLatOut = null, oldLonOut = null, oldLocIn = null, oldLocOut = null;
                    
                    if (isUpdate) {
                        oldPunchIn = att.getPunchIn();
                        oldPunchOut = att.getPunchOut();
                        oldEsslInTime = att.getEsslInTime();
                        oldEsslOutTime = att.getEsslOutTime();
                        oldTotalHoursWorked = att.getTotalHoursWorked();
                        oldOvertimeHours = att.getOvertimeHours();
                        oldStatus = att.getStatus();
                        oldIsLate = att.getIsLate();
                        oldIsEarlyExit = att.getIsEarlyExit();
                        oldShiftId = att.getShiftId();
                        oldRemarks = att.getRemarks();
                        oldLatIn = att.getLatitudeIn();
                        oldLonIn = att.getLongitudeIn();
                        oldLatOut = att.getLatitudeOut();
                        oldLonOut = att.getLongitudeOut();
                        oldLocIn = att.getLocationIn();
                        oldLocOut = att.getLocationOut();
                    } else {
                        att = new HrBiometricAttendance();
                        att.setEmployeeId(employeeId);
                        att.setAttendanceDate(attDate);
                        att.setCreatedBy(currentUserId);
                        att.setCreatedDate(new Date());
                    }

                    att.setPunchIn(parseLocalTime(punchInStr));
                    att.setPunchOut(parseLocalTime(punchOutStr));
                    att.setEsslInTime(inTime);
                    att.setEsslOutTime(outTime);
                    
                    // stores integer minutes directly.
                    att.setTotalHoursWorked(BigDecimal.valueOf(totalHoursWorkedMins));
                    
                    att.setOvertimeHours(overtime);
                    att.setStatus(status);
                    att.setIsLate(lateMins);
                    att.setIsEarlyExit(earlyMins);
                    att.setShiftId(assignedShift != null ? assignedShift.getId() : null);

                    if (isETimeTrackLite) {
                        Object latInObj = getCaseInsensitive(row, "LATITUDE_IN");
                        att.setLatitudeIn(latInObj != null ? latInObj.toString() : null);
                        
                        Object lonInObj = getCaseInsensitive(row, "LONGITUDE_IN");
                        att.setLongitudeIn(lonInObj != null ? lonInObj.toString() : null);
                        
                        Object latOutObj = getCaseInsensitive(row, "LATITUDE_OUT");
                        att.setLatitudeOut(latOutObj != null ? latOutObj.toString() : null);
                        
                        Object lonOutObj = getCaseInsensitive(row, "LONGITUDE_OUT");
                        att.setLongitudeOut(lonOutObj != null ? lonOutObj.toString() : null);
                        
                        Object locInObj = getCaseInsensitive(row, "LOCATION_IN");
                        att.setLocationIn(locInObj != null ? locInObj.toString() : null);
                        
                        Object locOutObj = getCaseInsensitive(row, "LOCATION_OUT");
                        att.setLocationOut(locOutObj != null ? locOutObj.toString() : null);
                        
                        Object imgObj = getCaseInsensitive(row, "DEVICE_IMAGE");
                        if (imgObj instanceof byte[]) {
                            att.setDeviceImage((byte[]) imgObj);
                        } else if (imgObj instanceof String) {
                            try {
                                att.setDeviceImage(java.util.Base64.getDecoder().decode(((String) imgObj).trim()));
                            } catch (Exception ex) {
                                log.warn("Failed to decode base64 device image for employee code {}: {}", empCd, ex.getMessage());
                            }
                        } else {
                            att.setDeviceImage(null);
                        }
                    }



                    // Enrich status and remarks using leaves/holidays/sundays/single punches
                    enrichAttendanceStatusAndRemarks(att, holidayMap, employeeLeavesMap);

                    boolean hasChanges = !isUpdate ||
                            !Objects.equals(oldPunchIn, att.getPunchIn()) ||
                            !Objects.equals(oldPunchOut, att.getPunchOut()) ||
                            !Objects.equals(oldEsslInTime, att.getEsslInTime()) ||
                            !Objects.equals(oldEsslOutTime, att.getEsslOutTime()) ||
                            !Objects.equals(oldTotalHoursWorked, att.getTotalHoursWorked()) ||
                            !Objects.equals(oldOvertimeHours, att.getOvertimeHours()) ||
                            !Objects.equals(oldStatus, att.getStatus()) ||
                            !Objects.equals(oldIsLate, att.getIsLate()) ||
                            !Objects.equals(oldIsEarlyExit, att.getIsEarlyExit()) ||
                            !Objects.equals(oldShiftId, att.getShiftId()) ||
                            !Objects.equals(oldRemarks, att.getRemarks()) ||
                            !Objects.equals(oldLatIn, att.getLatitudeIn()) ||
                            !Objects.equals(oldLonIn, att.getLongitudeIn()) ||
                            !Objects.equals(oldLatOut, att.getLatitudeOut()) ||
                            !Objects.equals(oldLonOut, att.getLongitudeOut()) ||
                            !Objects.equals(oldLocIn, att.getLocationIn()) ||
                            !Objects.equals(oldLocOut, att.getLocationOut());

                    if (hasChanges) {
                        att.setUpdatedBy(currentUserId);
                        att.setUpdatedDate(new Date());
                        logsToSave.add(att);
                        if (isUpdate) {
                            updatedCount++;
                        } else {
                            insertedCount++;
                        }
                    } else {
                        duplicateSkippedCount++;
                    }
                    existingLogsMap.put(existingKey, att);
                    processedCount++;

                } catch (DataIntegrityViolationException ex) {
                    log.debug("Skipping duplicate eSSL record: {}", ex.getMessage());
                    skippedCount++;
                    duplicateSkippedCount++;
                } catch (Exception ex) {
                    log.warn("Failed to process eSSL row: {}", ex.getMessage());
                    skippedCount++;
                }
            }
            long saveStartTime = System.currentTimeMillis();
            if (!logsToSave.isEmpty()) {
                try {
                    attendanceRepository.saveAllAndFlush(logsToSave);
                } catch (Exception ex) {
                    log.error("ATTENDANCE SAVE FAILED: {}", ex.getMessage(), ex);
                    throw ex;
                }
                
                log.info("eSSL Sync: preloading HrAttendanceDailyLog and HrDailyAttendance between {} and {}...", startDate, endDate);
                List<HrAttendanceDailyLog> existingDailyLogs = dailyLogRepository.findByAttendanceDateBetween(startDate, endDate);
                Map<String, HrAttendanceDailyLog> dailyLogMap = existingDailyLogs.stream()
                        .collect(Collectors.toMap(d -> d.getEmpId() + "_" + d.getAttendanceDate(), d -> d, (d1, d2) -> d1));

                List<HrDailyAttendance> existingDailyAtts = hrDailyAttendanceRepository.findByAttendanceDateBetween(startDate, endDate);
                Map<String, HrDailyAttendance> dailyAttMap = existingDailyAtts.stream()
                        .collect(Collectors.toMap(da -> da.getEmpId() + "_" + da.getAttendanceDate(), da -> da, (da1, da2) -> da1));

                List<HrAttendanceDailyLog> dailyLogsToSave = new ArrayList<>();
                List<HrDailyAttendance> dailyAttsToSave = new ArrayList<>();

                // Propagate to HrAttendanceDailyLog (Attendance Master) and HrDailyAttendance (Daily Attendance)
                for (HrBiometricAttendance logEnt : logsToSave) {
                    try {
                        String key = logEnt.getEmployeeId() + "_" + logEnt.getAttendanceDate();
                        
                        // 1. Update HrAttendanceDailyLog
                        HrAttendanceDailyLog dailyLog = dailyLogMap.get(key);
                        if (dailyLog == null) {
                            dailyLog = new HrAttendanceDailyLog();
                            dailyLog.setEmpId(logEnt.getEmployeeId());
                            dailyLog.setAttendanceDate(logEnt.getAttendanceDate());
                            dailyLog.setCreatedBy("SYSTEM");
                            dailyLog.setCreatedDate(new Date());
                        }
                        dailyLog.setShiftId(logEnt.getShiftId() != null ? logEnt.getShiftId() : (defaultShift != null ? defaultShift.getId() : 1L));
                        dailyLog.setInTime(logEnt.getPunchIn());
                        dailyLog.setOutTime(logEnt.getPunchOut());
                        dailyLog.setDuration(logEnt.getTotalHoursWorked() != null ? logEnt.getTotalHoursWorked().intValue() : 0);
                        dailyLog.setLom(logEnt.getIsLate());
                        dailyLog.setOt(logEnt.getOvertimeHours() != null ? logEnt.getOvertimeHours().intValue() : 0);
                        dailyLog.setAttType(logEnt.getStatus());
                        dailyLog.setRemarks(logEnt.getRemarks());
                        dailyLog.setEarlyIn(0);
                        dailyLog.setEarlyOut(logEnt.getIsEarlyExit() != null ? logEnt.getIsEarlyExit() : 0);
                        dailyLog.setFromWhere("ESSL");
                        dailyLog.setIsActive(true);
                        dailyLog.setUpdatedBy("SYSTEM");
                        dailyLog.setUpdatedDate(new Date());
                        dailyLogsToSave.add(dailyLog);

                        // 2. Update HrDailyAttendance
                        HrDailyAttendance dailyAtt = dailyAttMap.get(key);
                        if (dailyAtt == null) {
                            dailyAtt = new HrDailyAttendance();
                            dailyAtt.setEmpId(logEnt.getEmployeeId());
                            dailyAtt.setAttendanceDate(logEnt.getAttendanceDate());
                            dailyAtt.setCreatedBy("SYSTEM");
                            dailyAtt.setCreatedDate(new Date());
                        }
                        dailyAtt.setStatus(logEnt.getStatus());
                        dailyAtt.setRemarks(logEnt.getRemarks());
                        dailyAtt.setUpdatedBy("SYSTEM");
                        dailyAtt.setUpdatedDate(new Date());
                        dailyAttsToSave.add(dailyAtt);
                    } catch (Exception ex) {
                        log.error("Failed to propagate biometric attendance to Daily Log / Daily Attendance: {}", ex.getMessage());
                    }
                }

                if (!dailyLogsToSave.isEmpty()) {
                    try {
                        dailyLogRepository.saveAllAndFlush(dailyLogsToSave);
                    } catch (Exception ex) {
                        log.warn("Failed to save daily logs batch: {}", ex.getMessage());
                    }
                }
                if (!dailyAttsToSave.isEmpty()) {
                    try {
                        hrDailyAttendanceRepository.saveAllAndFlush(dailyAttsToSave);
                    } catch (Exception ex) {
                        log.warn("Failed to save daily attendance batch: {}", ex.getMessage());
                    }
                }
            }

            long saveEndTime = System.currentTimeMillis();
            long saveDuration = saveEndTime - saveStartTime;
            log.info("eSSL Sync Durations: Save/Flush finished in {}ms", saveDuration);

            long totalEndTime = System.currentTimeMillis();
            long totalDuration = totalEndTime - totalStartTime;
            log.info("eSSL Sync Durations: Total sync process completed in {}ms", totalDuration);

            lastSyncTimeMap.put(clientId, new Date());

            log.info("eSSL Sync Log: Sync Completed successfully!");
            log.info("eSSL Sync Log: Total Records Read: {}", esslRows.size());
            log.info("eSSL Sync Log: Records Inserted: {}", insertedCount);
            log.info("eSSL Sync Log: Records Updated: {}", updatedCount);
            log.info("eSSL Sync Log: Duplicate Records Skipped: {}", duplicateSkippedCount);

            result.put("success", true);
            result.put("message", "eSSL sync completed for " + month + " " + year + ".");
            result.put("processedRecords", processedCount);
            result.put("skippedRecords", skippedCount);
            result.put("unmatchedEmployeeCodes", unmatchedCount);
            result.put("insertedRecords", insertedCount);
        result.put("updatedRecords", updatedCount);
        result.put("duplicateSkippedRecords", duplicateSkippedCount);
        result.put("totalRecordsRead", esslRows.size());
        if (!unmatchedCodes.isEmpty()) {
            result.put("unmatchedCodes", unmatchedCodes.subList(0, Math.min(20, unmatchedCodes.size())));
        }
        } catch (Exception e) {
            log.error("eSSL Sync Log: Sync Failed! Error: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "Sync failed: " + e.getMessage());
        }
        return result;
    }

    /**
     * Parses a value to BigDecimal (handles Double, Integer, String, BigDecimal).
     */
     private BigDecimal parseToBigDecimal(Object val) {
        if (val == null) return null;
        try {
            if (val instanceof BigDecimal) return (BigDecimal) val;
            if (val instanceof Double) return BigDecimal.valueOf((Double) val).setScale(2, RoundingMode.HALF_UP);
            if (val instanceof Float) return BigDecimal.valueOf((Float) val).setScale(2, RoundingMode.HALF_UP);
            if (val instanceof Integer) return BigDecimal.valueOf((Integer) val).setScale(2, RoundingMode.HALF_UP);
            if (val instanceof Long) return BigDecimal.valueOf((Long) val).setScale(2, RoundingMode.HALF_UP);
            if (val instanceof java.util.Date) {
                java.util.Calendar cal = java.util.Calendar.getInstance();
                cal.setTime((java.util.Date) val);
                int hours = cal.get(java.util.Calendar.HOUR_OF_DAY);
                int minutes = cal.get(java.util.Calendar.MINUTE);
                return BigDecimal.valueOf(hours)
                        .add(BigDecimal.valueOf(minutes).divide(new BigDecimal("60"), 2, RoundingMode.HALF_UP));
            }
            String str = val.toString().trim();
            if (str.isEmpty()) return null;
            if (str.contains(" ")) {
                String[] spaceParts = str.split(" ");
                str = spaceParts[spaceParts.length - 1];
            }
            // Handle HH:MM format
            if (str.contains(":")) {
                return parseTimeStringToDecimal(str);
            }
            return new BigDecimal(str).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            log.debug("Failed to parse value to BigDecimal: {}", val);
            return null;
        }
    }

    /**
     * Converts a time string (HH:MM or H:MM) to decimal hours.
     * E.g., "09:30" -> 9.50, "18:45" -> 18.75
     */
    private BigDecimal parseTimeStringToDecimal(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) return null;
        try {
            String clean = timeStr.trim().replace(".", ":");
            if (clean.contains(":")) {
                String[] parts = clean.split(":");
                int hours = Integer.parseInt(parts[0].trim());
                int minutes = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 0;
                return BigDecimal.valueOf(hours)
                        .add(BigDecimal.valueOf(minutes).divide(new BigDecimal("60"), 2, RoundingMode.HALF_UP));
            }
            return new BigDecimal(clean).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Converts a time string (HH:MM or H:MM) in 24-hour format to HH:MM AM/PM string.
     */
    private String formatTimeString(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty() || timeStr.trim().equals("00:00")) return "";
        try {
            String[] parts = timeStr.trim().split(":");
            int hours = Integer.parseInt(parts[0]);
            int minutes = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
            String amPm = hours >= 12 ? "PM" : "AM";
            int displayHour = hours % 12;
            if (displayHour == 0) displayHour = 12;
            return String.format("%02d:%02d %s", displayHour, minutes, amPm);
        } catch (Exception e) {
            return timeStr;
        }
    }

    /**
     * Converts a decimal time value to HH:MM AM/PM string.
     * E.g., 5.58 -> "05:58 AM", 19.02 -> "07:02 PM"
     * Treats the decimal part as minutes (5.58 = 5h 58m).
     */
    private String decimalToTimeString(BigDecimal decVal) {
        if (decVal == null) return "";
        try {
            int hours = decVal.intValue();
            int minutes = decVal.subtract(BigDecimal.valueOf(hours))
                    .multiply(new BigDecimal("100"))
                    .setScale(0, RoundingMode.HALF_UP)
                    .intValue();

            // Ensure minutes don't exceed 59
            if (minutes >= 60) {
                hours += minutes / 60;
                minutes = minutes % 60;
            }

            String amPm = hours >= 12 ? "PM" : "AM";
            int displayHour = hours % 12;
            if (displayHour == 0) displayHour = 12;
            return String.format("%02d:%02d %s", displayHour, minutes, amPm);
        } catch (Exception e) {
            return decVal.toString();
        }
    }


    public Set<String> getExistingTableNames() {
        Set<String> set = new HashSet<>();
        if (esslJdbcTemplate == null) return set;
        try {
            List<String> list = esslJdbcTemplate.queryForList(
                    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES",
                    String.class
            );
            if (list != null) {
                for (String t : list) {
                    if (t != null) set.add(t.trim().toUpperCase());
                }
            }
        } catch (Exception e) {
            log.warn("Secondary database schema query failed: {}", e.getMessage());
        }
        return set;
    }

    /**
     * Checks if a table exists in the secondary database.
     */
    public boolean checkTableExists(String tableName) {
        if (esslJdbcTemplate == null) return false;
        try {
            Integer count = esslJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE UPPER(TABLE_NAME) = UPPER(?)",
                    Integer.class, tableName
            );
            return count != null && count > 0;
        } catch (Exception e) {
            log.warn("Secondary ESSL database connection offline or table checks failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Syncs canteen logs from eTimeTrackLite DeviceLogs_<month>_<year>
     * where DeviceType = 'CANTEEN' to Autonoma's HR_CANTEEN_LOG table.
     */
    public Map<String, Object> syncCanteenLogs(String month, int year) {
        Map<String, Object> result = new HashMap<>();
        if (esslJdbcTemplate == null) {
            result.put("success", false);
            result.put("message", "Secondary database is not configured.");
            return result;
        }

        List<String> months = Arrays.asList(
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
        );
        int monthVal = months.indexOf(month) + 1;
        LocalDate startDate = LocalDate.of(year, monthVal, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        if (monthVal <= 0) {
            result.put("success", false);
            result.put("message", "Invalid month: " + month);
            return result;
        }

        String rawTableName = "DeviceLogs_" + monthVal + "_" + year;
        if (!checkTableExists("Employees") || !checkTableExists("Devices") || !checkTableExists(rawTableName)) {
            result.put("success", false);
            result.put("message", "eTimeTrackLite canteen tables or device raw logs table " + rawTableName + " do not exist.");
            return result;
        }

        // Build employee code -> local ID map
        List<EmployeeMaster> allEmployees = employeeRepository.findAll();
        Map<String, Long> empCodeToId = allEmployees.stream()
                .filter(e -> e.getEmpCode() != null && e.getIsActive() != null && e.getIsActive())
                .collect(Collectors.toMap(
                        e -> e.getEmpCode().trim().toUpperCase(),
                        EmployeeMaster::getId,
                        (e1, e2) -> e1
                ));

        String currentUserId = "admin";
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
            if (currentUserId == null || currentUserId.trim().isEmpty()) {
                currentUserId = "admin";
            }
        } catch (Exception e) {}

        String sql = String.format(
                "SELECT e.EmployeeCode, e.EmployeeName, a.LogDate, b.DeviceFName, " +
                "CAST(DATEPART(HOUR, a.LogDate) + (DATEPART(MINUTE, a.LogDate) / 100.0) AS NUMERIC(5,2)) AS LogTime " +
                "FROM [%s] a " +
                "JOIN Devices b ON a.DeviceId = b.DeviceId " +
                "JOIN Employees e ON a.UserId = e.EmployeeCodeInDevice " +
                "WHERE b.DeviceType = 'CANTEEN' " +
                "AND a.LogDate >= ? AND a.LogDate < ?",
                rawTableName
        );

        int processedCount = 0;
        int skippedCount = 0;
        int unmatchedCount = 0;

        try {
            List<Map<String, Object>> canteenRows = esslJdbcTemplate.queryForList(
                sql,
                java.sql.Timestamp.valueOf(startDate.atStartOfDay()),
                java.sql.Timestamp.valueOf(endDate.plusDays(1).atStartOfDay())
            );
            log.info("Canteen sync: Found {} raw canteen logs from {} for {}/{}", canteenRows.size(), rawTableName, month, year);

            for (Map<String, Object> row : canteenRows) {
                try {
                    String empCd = row.get("EmployeeCode") != null ? row.get("EmployeeCode").toString().trim().toUpperCase() : null;
                    if (empCd == null || empCd.isEmpty()) {
                        skippedCount++;
                        continue;
                    }

                    Long employeeId = empCodeToId.get(empCd);
                    if (employeeId == null) {
                        unmatchedCount++;
                        continue;
                    }

                    Object logDateObj = row.get("LogDate");
                    LocalDateTime logDate;
                    if (logDateObj instanceof Timestamp) {
                        logDate = ((Timestamp) logDateObj).toLocalDateTime();
                    } else if (logDateObj instanceof java.sql.Date) {
                        logDate = ((java.sql.Date) logDateObj).toLocalDate().atStartOfDay();
                    } else if (logDateObj != null) {
                        logDate = LocalDateTime.parse(logDateObj.toString().replace(" ", "T").substring(0, 19));
                    } else {
                        skippedCount++;
                        continue;
                    }

                    String deviceName = row.get("DeviceFName") != null ? row.get("DeviceFName").toString() : "Canteen Device";
                    BigDecimal logTime = parseToBigDecimal(row.get("LogTime"));

                    // Check if already exists locally
                    Optional<HrCanteenLog> existingOpt = canteenLogRepository.findByEmployeeIdAndLogDate(employeeId, logDate);
                    if (existingOpt.isPresent()) {
                        skippedCount++;
                        continue;
                    }

                    HrCanteenLog canteenLog = new HrCanteenLog();
                    canteenLog.setEmployeeId(employeeId);
                    canteenLog.setLogDate(logDate);
                    canteenLog.setDeviceName(deviceName);
                    canteenLog.setLogTime(logTime);
                    canteenLog.setIsActive(true);
                    canteenLog.setCreatedBy(currentUserId);
                    canteenLog.setCreatedDate(new Date());
                    canteenLog.setUpdatedBy(currentUserId);
                    canteenLog.setUpdatedDate(new Date());

                    canteenLogRepository.save(canteenLog);
                    processedCount++;
                } catch (Exception ex) {
                    log.warn("Failed to process canteen row: {}", ex.getMessage());
                    skippedCount++;
                }
            }
            canteenLogRepository.flush();

        } catch (Exception e) {
            log.error("Canteen sync failed: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "Canteen sync failed: " + e.getMessage());
            return result;
        }

        result.put("success", true);
        result.put("message", "Canteen sync completed. Processed: " + processedCount + ", Skipped: " + skippedCount + ", Unmatched employee codes: " + unmatchedCount);
        result.put("processedRecords", processedCount);
        result.put("skippedRecords", skippedCount);
        result.put("unmatchedRecords", unmatchedCount);
        return result;
    }

    private String formatTime(LocalDateTime dt) {
        if (dt == null) return "00:00";
        return String.format("%02d:%02d", dt.getHour(), dt.getMinute());
    }

    private java.time.LocalTime parseLocalTime(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) return null;
        try {
            String clean = timeStr.trim().toUpperCase();
            boolean isPm = clean.contains("PM");
            String timePart = clean.replace("AM", "").replace("PM", "").trim();
            String[] parts = timePart.split(":");
            int h = Integer.parseInt(parts[0]);
            int m = (parts.length > 1 && parts[1] != null && !parts[1].trim().isEmpty())
                    ? Integer.parseInt(parts[1].substring(0, 2).trim()) : 0;
            if (isPm && h < 12) h += 12;
            if (!isPm && h == 12) h = 0;
            return java.time.LocalTime.of(h, m);
        } catch (Exception e) {
            log.debug("Failed to parse LocalTime from string: {}", timeStr);
            return null;
        }
    }

    private int decimalTimeToMinutes(BigDecimal decVal) {
        if (decVal == null) return 0;
        try {
            int hours = decVal.intValue();
            int minutes = decVal.subtract(BigDecimal.valueOf(hours))
                    .multiply(new BigDecimal("100"))
                    .setScale(0, RoundingMode.HALF_UP)
                    .intValue();
            return hours * 60 + minutes;
        } catch (Exception e) {
            return 0;
        }
    }

    private int parseTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) return 0;
        try {
            String clean = timeStr.trim().replace(".", ":");
            String[] parts = clean.split(":");
            int h = Integer.parseInt(parts[0].trim());
            int m = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 0;
            return h * 60 + m;
        } catch (Exception e) {
            return 0;
        }
    }

    public double calculateOtMinsByMinimumOtMins(double totOtMins) {
        double minimumOtMins = 30.0;
        try {
            if (appPreferenceRepository != null) {
                Optional<com.autonoma.erp.model.admin.AppPreference> pref = appPreferenceRepository.findByPrefName("OT_CALCULATION_INTERVAL");
                if (pref.isPresent() && pref.get().getPrefValue() != null) {
                    minimumOtMins = Double.parseDouble(pref.get().getPrefValue().trim());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to read OT_CALCULATION_INTERVAL preference, using default 30.0. Error: {}", e.getMessage());
        }
        double otmins = 0;
        if (totOtMins < minimumOtMins) {
            otmins = 0;
        } else {
            otmins = Math.floor(totOtMins / minimumOtMins) * minimumOtMins;
        }
        return otmins;
    }

    public static double calculateTimeDiffInMinutes(java.sql.Timestamp startTime, java.sql.Timestamp endTime) {
        if (startTime == null || endTime == null) {
            return 0;
        }
        long diffInMillis = endTime.getTime() - startTime.getTime();
        long diffInMinutes = diffInMillis / (1000 * 60);
        return diffInMinutes;
    }

    public void enrichAttendanceStatusAndRemarks(
            HrBiometricAttendance att,
            Map<LocalDate, com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster> holidayMap,
            Map<Long, List<com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest>> employeeLeavesMap) {
        if (att == null) return;
        try {
            Long empId = att.getEmployeeId();
            LocalDate date = att.getAttendanceDate();
            if (empId == null || date == null) return;

            // 1. Check Holiday first
            com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster holiday = holidayMap.get(date);
            if (holiday != null) {
                att.setStatus("HL");
                att.setRemarks(holiday.getHolidayName());
                return;
            }

            // 2. Check Leaves next
            List<com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest> leaves = employeeLeavesMap.get(empId);
            if (leaves != null) {
                com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest leaveOnDate = null;
                for (com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest l : leaves) {
                    if (l.getStartDate() != null && l.getEndDate() != null &&
                            !date.isBefore(l.getStartDate()) && !date.isAfter(l.getEndDate())) {
                        leaveOnDate = l;
                        break;
                    }
                }
                if (leaveOnDate != null) {
                    String typeName = leaveOnDate.getLeaveTypeName() != null ? leaveOnDate.getLeaveTypeName() : "Leave";
                    String attenType = "A";
                    
                    String cleanTypeName = typeName.toLowerCase().trim();
                    if (cleanTypeName.contains("casual")) {
                        attenType = "CL";
                    } else if (cleanTypeName.contains("earn")) {
                        attenType = "EL";
                    } else if (cleanTypeName.contains("sick") || cleanTypeName.contains("medical")) {
                        attenType = "SL";
                    } else if (cleanTypeName.contains("compensatory")) {
                        attenType = "C_OFF";
                    } else if (cleanTypeName.contains("annual")) {
                        attenType = "AL";
                    } else if (cleanTypeName.contains("privilege")) {
                        attenType = "PL";
                    } else if (cleanTypeName.contains("loss of pay") || cleanTypeName.contains("lop")) {
                        attenType = "LOP";
                    } else {
                        attenType = "CL";
                    }
                    
                    att.setStatus(attenType);
                    if (leaveOnDate.getNumberOfDays() != null && leaveOnDate.getNumberOfDays() <= 0.5) {
                        att.setRemarks(typeName + " Half Day");
                    } else {
                        att.setRemarks(typeName + " Full Day");
                    }
                    return;
                }
            }

            // 3. Check Sunday
            boolean isSunday = date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY;
            int totalMins = att.getTotalHoursWorked() != null ? att.getTotalHoursWorked().intValue() : 0;

            if (isSunday) {
                if (totalMins > 0) {
                    att.setStatus("WO(P)");
                    att.setRemarks("Sunday Working");
                } else {
                    att.setStatus("WO");
                    att.setRemarks("Week Off");
                }
                return;
            }

            // 4. Single Punch Check
            if (att.getPunchIn() != null && att.getPunchOut() == null) {
                att.setStatus("SP");
                att.setRemarks("OutTime Not Punched");
                return;
            }
            if (att.getPunchIn() == null && att.getPunchOut() != null) {
                att.setStatus("SP");
                att.setRemarks("InTime Not Punched");
                return;
            }

            // 5. Normal Day
            if (att.getPunchIn() != null && att.getPunchOut() != null) {
                if (totalMins >= 480) {
                    att.setStatus("PRESENT");
                    att.setRemarks(null);
                } else if (totalMins >= 240) {
                    att.setStatus("HALF_DAY");
                    att.setRemarks("Half Day Working");
                } else {
                    att.setStatus("ABSENT");
                    att.setRemarks(null);
                }
            } else {
                att.setStatus("ABSENT");
                att.setRemarks(null);
            }

        } catch (Exception e) {
            log.error("Error enriching attendance status and remarks", e);
        }
    }

    private Object getCaseInsensitive(Map<String, Object> map, String key) {
        if (map == null || key == null) return null;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (key.equalsIgnoreCase(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }
}

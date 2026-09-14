package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.modules.platform.identity.entity.CliClientDatabaseConfig;
import com.autonoma.erp.modules.platform.identity.repository.CliClientDatabaseConfigRepository;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.*;

@Service
public class ClientDatabaseSyncServiceImpl implements ClientDatabaseSyncService {

    private static final Logger log = LoggerFactory.getLogger(ClientDatabaseSyncServiceImpl.class);

    @Autowired
    private CompanyCredentialRepository companyCredentialRepository;

    @Autowired(required = false)
    private CliClientDatabaseConfigRepository cliClientDatabaseConfigRepository;

    private static final Map<String, String> FIELD_TO_COLUMN_MAP = new HashMap<>();
    static {
        FIELD_TO_COLUMN_MAP.put("clientCode", "CLIENT_CODE");
        FIELD_TO_COLUMN_MAP.put("companyName", "COMPANY_NAME");
        FIELD_TO_COLUMN_MAP.put("shortName", "SHORT_NAME");
        FIELD_TO_COLUMN_MAP.put("address", "ADDRESS");
        FIELD_TO_COLUMN_MAP.put("city", "CITY");
        FIELD_TO_COLUMN_MAP.put("state", "STATE");
        FIELD_TO_COLUMN_MAP.put("stateCode", "STATE_CODE");
        FIELD_TO_COLUMN_MAP.put("country", "COUNTRY");
        FIELD_TO_COLUMN_MAP.put("pincode", "PINCODE");
        FIELD_TO_COLUMN_MAP.put("gstIn", "GST_IN");
        FIELD_TO_COLUMN_MAP.put("registrationNo", "REGISTRATION_NO");
        FIELD_TO_COLUMN_MAP.put("panNo", "PAN_NO");
        FIELD_TO_COLUMN_MAP.put("mobileNo", "MOBILE_NO");
        FIELD_TO_COLUMN_MAP.put("phoneNo", "PHONE_NO");
        FIELD_TO_COLUMN_MAP.put("emailId", "EMAIL_ID");
        FIELD_TO_COLUMN_MAP.put("website", "WEBSITE");
        FIELD_TO_COLUMN_MAP.put("supportEmail", "SUPPORT_EMAIL");
        FIELD_TO_COLUMN_MAP.put("supportPhone", "SUPPORT_PHONE");
        FIELD_TO_COLUMN_MAP.put("gmaplink", "GMAPLINK");
        FIELD_TO_COLUMN_MAP.put("decimalPlaces", "DECIMAL_PLACES");
        FIELD_TO_COLUMN_MAP.put("currencyCode", "CURRENCY_CODE");
        FIELD_TO_COLUMN_MAP.put("isActive", "IS_ACTIVE");
        FIELD_TO_COLUMN_MAP.put("inputCaseStyle", "INPUT_CASE_STYLE");
        FIELD_TO_COLUMN_MAP.put("timeFormat", "TIME_FORMAT");
        FIELD_TO_COLUMN_MAP.put("dateFormat", "DATE_FORMAT");
        FIELD_TO_COLUMN_MAP.put("weekStartsOn", "WEEK_STARTS_ON");
        FIELD_TO_COLUMN_MAP.put("appTimezone", "APP_TIMEZONE");
        FIELD_TO_COLUMN_MAP.put("defaultRowsPerPage", "DEFAULT_ROWS_PER_PAGE");
        FIELD_TO_COLUMN_MAP.put("defaultMaxRecords", "DEFAULT_MAX_RECORDS");
        FIELD_TO_COLUMN_MAP.put("autoLogoutSeconds", "AUTO_LOGOUT_SECONDS");
        FIELD_TO_COLUMN_MAP.put("allowDuplicateScreens", "ALLOW_DUPLICATE_SCREENS");
        FIELD_TO_COLUMN_MAP.put("allowRightClick", "ALLOW_RIGHT_CLICK");
        FIELD_TO_COLUMN_MAP.put("singleActiveSession", "SINGLE_ACTIVE_SESSION");
        FIELD_TO_COLUMN_MAP.put("directoryPath", "DIRECTORY_PATH");
        FIELD_TO_COLUMN_MAP.put("dbSourceName", "DB_SOURCE_NAME");
        FIELD_TO_COLUMN_MAP.put("dbName", "DB_SOURCE_NAME");
        FIELD_TO_COLUMN_MAP.put("licRenewalDate", "LIC_RENEWAL_DATE");
        FIELD_TO_COLUMN_MAP.put("licExpiryDate", "LIC_EXPIRY_DATE");
        FIELD_TO_COLUMN_MAP.put("licExpRemainderDays", "LIC_EXP_REMAINDER_DAYS");
        FIELD_TO_COLUMN_MAP.put("restoreEnableDays", "RESTORE_ENABLE_DAYS");
        FIELD_TO_COLUMN_MAP.put("esslConfigName", "ESSL_CONFIG_NAME");
        FIELD_TO_COLUMN_MAP.put("esslAttendanceSource", "ESSL_ATTENDANCE_SOURCE");
        FIELD_TO_COLUMN_MAP.put("esslConnectionType", "ESSL_CONNECTION_TYPE");
        FIELD_TO_COLUMN_MAP.put("esslDatabaseType", "ESSL_DATABASE_TYPE");
        FIELD_TO_COLUMN_MAP.put("esslServerIp", "ESSL_SERVER_IP");
        FIELD_TO_COLUMN_MAP.put("esslPort", "ESSL_PORT");
        FIELD_TO_COLUMN_MAP.put("esslDbName", "ESSL_DB_NAME");
        FIELD_TO_COLUMN_MAP.put("esslUsername", "ESSL_USERNAME");
        FIELD_TO_COLUMN_MAP.put("esslPassword", "ESSL_PASSWORD");
        FIELD_TO_COLUMN_MAP.put("esslStatus", "ESSL_STATUS");
    }

    @Override
    public ClientDbSyncResult syncToClientDatabase(Long companyId) {
        return syncToClientDatabase(companyId, null);
    }

    @Override
    public ClientDbSyncResult syncToClientDatabase(Long companyId, Set<String> modifiedFieldKeys) {
        if (companyId == null) {
            return ClientDbSyncResult.skipped("Company ID is null");
        }

        CompanyCredential company = companyCredentialRepository.findById(companyId).orElse(null);
        if (company == null) {
            return ClientDbSyncResult.failed("CompanyCredential not found for ID: " + companyId, null, null, null);
        }

        CliClientDatabaseConfig dbConfig = null;
        if (cliClientDatabaseConfigRepository != null) {
            dbConfig = cliClientDatabaseConfigRepository.findByClientId(companyId).orElse(null);
        }

        return syncToClientDatabase(company, dbConfig, modifiedFieldKeys);
    }

    @Override
    public ClientDbSyncResult syncToClientDatabase(CompanyCredential company, CliClientDatabaseConfig dbConfig) {
        return syncToClientDatabase(company, dbConfig, null);
    }

    @Override
    public ClientDbSyncResult syncToClientDatabase(CompanyCredential company, CliClientDatabaseConfig dbConfig, Set<String> modifiedFieldKeys) {
        if (company == null) {
            return ClientDbSyncResult.skipped("Company profile is null");
        }

        String clientCode = company.getClientCode() != null ? company.getClientCode().trim() : "";
        if (clientCode.isEmpty()) {
            return ClientDbSyncResult.skipped("Client code is not configured");
        }

        if (dbConfig == null || dbConfig.getDbHost() == null || dbConfig.getDbHost().trim().isEmpty()
                || dbConfig.getDbName() == null || dbConfig.getDbName().trim().isEmpty()
                || dbConfig.getDbUsername() == null || dbConfig.getDbUsername().trim().isEmpty()) {
            log.info("[ClientDbSync] Skipped client DB sync for clientCode '{}' - database configuration not set.", clientCode);
            return ClientDbSyncResult.skipped("Database configuration not provided for client: " + clientCode);
        }

        String host = dbConfig.getDbHost().trim();
        int port = dbConfig.getDbPort() != null ? dbConfig.getDbPort() : 1433;
        String dbName = dbConfig.getDbName().trim();
        String username = dbConfig.getDbUsername().trim();
        String password = dbConfig.getDbPassword() != null ? dbConfig.getDbPassword() : "";

        // Requirement 1: Database Name mapped from Primary SQL Server connection must be saved into Main dbSourceName
        if (!dbName.equalsIgnoreCase(company.getDbSourceName())) {
            company.setDbSourceName(dbName);
            companyCredentialRepository.save(company);
            log.info("[ClientDbSync] Synchronized Main company DB_SOURCE_NAME to '{}' for clientCode '{}'", dbName, clientCode);
        }

        String jdbcUrl = String.format(
                "jdbc:sqlserver://%s:%d;databaseName=%s;encrypt=false;trustServerCertificate=true;loginTimeout=15",
                host, port, dbName
        );

        DriverManager.setLoginTimeout(15);

        log.info("[ClientDbSync] Initiating client database sync for clientCode '{}' at {}:{}/{}", clientCode, host, port, dbName);

        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            conn.setAutoCommit(true);

            // 1. Check if AD_COMPANY_CREDENTIAL table exists
            if (!tableExists(conn, "AD_COMPANY_CREDENTIAL")) {
                String msg = String.format("Table AD_COMPANY_CREDENTIAL does not exist in target database '%s'", dbName);
                log.warn("[ClientDbSync] {}", msg);
                return ClientDbSyncResult.failed(msg, clientCode, dbName, host);
            }

            // 2. Discover available columns in client's AD_COMPANY_CREDENTIAL
            Set<String> existingColumns = getTableColumns(conn, "AD_COMPANY_CREDENTIAL");

            // Ensure CLIENT_CODE column exists in client DB
            if (!existingColumns.contains("CLIENT_CODE")) {
                try (Statement stmt = conn.createStatement()) {
                    stmt.executeUpdate("ALTER TABLE AD_COMPANY_CREDENTIAL ADD CLIENT_CODE NVARCHAR(50) NULL");
                    existingColumns.add("CLIENT_CODE");
                    log.info("[ClientDbSync] Dynamically added missing column CLIENT_CODE to client database AD_COMPANY_CREDENTIAL");
                } catch (Exception alterEx) {
                    log.warn("[ClientDbSync] Could not add CLIENT_CODE column: {}", alterEx.getMessage());
                }
            }

            // 3. Prepare field mapping (always ensures DB_SOURCE_NAME is dbName)
            Map<String, Object> values = buildFieldMap(company, dbName);

            // Normalize modifiedFieldKeys to SQL columns
            Set<String> normalizedModifiedCols = new HashSet<>();
            if (modifiedFieldKeys != null && !modifiedFieldKeys.isEmpty()) {
                for (String key : modifiedFieldKeys) {
                    if (key == null || key.trim().isEmpty()) continue;
                    String col = FIELD_TO_COLUMN_MAP.get(key.trim());
                    if (col != null) {
                        normalizedModifiedCols.add(col.toUpperCase());
                    } else {
                        normalizedModifiedCols.add(key.trim().toUpperCase());
                    }
                }
            }

            List<String> pushedFields = new ArrayList<>();
            List<String> pulledFields = new ArrayList<>();
            boolean reverseSyncExecuted = false;
            boolean seedRecordDetected = false;

            // 4. Three-Tier Synchronization Logic:
            // Tier 1: Check for Exact CLIENT_CODE Match
            Long exactMatchId = findRecordIdByClientCode(conn, clientCode);

            if (exactMatchId != null) {
                Map<String, Object> clientRow = fetchExistingRecord(conn, exactMatchId);
                seedRecordDetected = isRecordSeedData(clientRow);

                if (seedRecordDetected) {
                    // Seed Record Guard: Full overwrite, strictly SKIP reverse engineering
                    executeUpdate(conn, exactMatchId, values, existingColumns);
                    pushedFields.addAll(values.keySet());
                    String msg = String.format("Overwritten initial seeded company record (ID: %d) with client code '%s' in database '%s'. Seed data reverse sync bypassed.",
                            exactMatchId, clientCode, dbName);
                    log.info("[ClientDbSync] {}", msg);
                    ClientDbSyncResult res = ClientDbSyncResult.success("OVERWRITTEN_DEFAULT", msg, clientCode, dbName, host);
                    res.setPushedFields(pushedFields);
                    res.setPulledFields(pulledFields);
                    res.setSeedRecordDetected(true);
                    res.setReverseSyncExecuted(false);
                    return res;
                }

                // Genuine Client Record:
                // Step A: Forward Delta Update (Only update fields modified in Main + DB_SOURCE_NAME)
                Map<String, Object> forwardValues;
                if (!normalizedModifiedCols.isEmpty()) {
                    forwardValues = new LinkedHashMap<>();
                    for (Map.Entry<String, Object> entry : values.entrySet()) {
                        String col = entry.getKey().toUpperCase();
                        if (normalizedModifiedCols.contains(col) || "DB_SOURCE_NAME".equals(col)) {
                            forwardValues.put(entry.getKey(), entry.getValue());
                        }
                    }
                } else {
                    forwardValues = values;
                }

                executeUpdate(conn, exactMatchId, forwardValues, existingColumns);
                pushedFields.addAll(forwardValues.keySet());

                // Step B: Reverse Engineering / Reverse Sync (Pulls client updates for fields NOT modified in Main)
                boolean mainUpdated = false;
                if (!normalizedModifiedCols.isEmpty()) {
                    mainUpdated = applyReverseSyncFromClient(company, clientRow, normalizedModifiedCols, pulledFields);
                    if (mainUpdated) {
                        companyCredentialRepository.save(company);
                        reverseSyncExecuted = true;
                        log.info("[ClientDbSync] Reverse sync pulled {} fields from client DB: {}", pulledFields.size(), pulledFields);
                    }
                }

                String msg = String.format("Synchronized client code '%s' in '%s': %d fields pushed to client, %d fields updated from client DB.",
                        clientCode, dbName, pushedFields.size(), pulledFields.size());
                log.info("[ClientDbSync] {}", msg);

                ClientDbSyncResult res = ClientDbSyncResult.success("UPDATED", msg, clientCode, dbName, host);
                res.setPushedFields(pushedFields);
                res.setPulledFields(pulledFields);
                res.setReverseSyncExecuted(reverseSyncExecuted);
                res.setSeedRecordDetected(false);
                return res;
            }

            // Tier 2: Check for Default Seeded Record (clientCode = '123456' OR companyName = 'AUTONOMA' OR null)
            Long defaultRecordId = findDefaultSeededRecordId(conn);

            if (defaultRecordId != null) {
                // Tier 2: Seed Record Guard: Full overwrite, reverse sync strictly skipped
                executeUpdate(conn, defaultRecordId, values, existingColumns);
                pushedFields.addAll(values.keySet());
                String msg = String.format("Successfully overwritten default seeded company record (ID: %d) with Client Code '%s' in database '%s'. Reverse sync bypassed.",
                        defaultRecordId, clientCode, dbName);
                log.info("[ClientDbSync] {}", msg);
                ClientDbSyncResult res = ClientDbSyncResult.success("OVERWRITTEN_DEFAULT", msg, clientCode, dbName, host);
                res.setPushedFields(pushedFields);
                res.setPulledFields(pulledFields);
                res.setSeedRecordDetected(true);
                res.setReverseSyncExecuted(false);
                return res;
            }

            // Tier 3: Clean Insert
            executeInsert(conn, values, existingColumns);
            pushedFields.addAll(values.keySet());
            String msg = String.format("Successfully inserted new company profile for Client Code '%s' in database '%s'.", clientCode, dbName);
            log.info("[ClientDbSync] {}", msg);
            ClientDbSyncResult res = ClientDbSyncResult.success("INSERTED", msg, clientCode, dbName, host);
            res.setPushedFields(pushedFields);
            res.setPulledFields(pulledFields);
            res.setSeedRecordDetected(false);
            res.setReverseSyncExecuted(false);
            return res;

        } catch (SQLException e) {
            String errorMsg = String.format("SQL Error syncing to client DB %s:%d/%s: %s", host, port, dbName, e.getMessage());
            log.error("[ClientDbSync] {}", errorMsg, e);
            return ClientDbSyncResult.failed(errorMsg, clientCode, dbName, host);
        } catch (Exception e) {
            String errorMsg = String.format("Unexpected error syncing to client DB %s:%d/%s: %s", host, port, dbName, e.getMessage());
            log.error("[ClientDbSync] {}", errorMsg, e);
            return ClientDbSyncResult.failed(errorMsg, clientCode, dbName, host);
        }
    }

    private boolean tableExists(Connection conn, String tableName) throws SQLException {
        String sql = "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, tableName);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private Set<String> getTableColumns(Connection conn, String tableName) throws SQLException {
        Set<String> columns = new HashSet<>();
        String sql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, tableName);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    columns.add(rs.getString("COLUMN_NAME").toUpperCase());
                }
            }
        }
        return columns;
    }

    private Long findRecordIdByClientCode(Connection conn, String clientCode) throws SQLException {
        String sql = "SELECT TOP 1 id FROM AD_COMPANY_CREDENTIAL WHERE UPPER(LTRIM(RTRIM(CLIENT_CODE))) = UPPER(?) ORDER BY id ASC";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, clientCode.trim());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getLong("id");
                }
            }
        }
        return null;
    }

    private Long findDefaultSeededRecordId(Connection conn) throws SQLException {
        String sql = "SELECT TOP 1 id FROM AD_COMPANY_CREDENTIAL " +
                "WHERE CLIENT_CODE = '123456' " +
                "   OR UPPER(COMPANY_NAME) = 'AUTONOMA' " +
                "   OR UPPER(SHORT_NAME) = 'AUTONOMA' " +
                "   OR CLIENT_CODE IS NULL " +
                "   OR LTRIM(RTRIM(CLIENT_CODE)) = '' " +
                "ORDER BY id ASC";
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return rs.getLong("id");
            }
        }
        return null;
    }

    private Map<String, Object> buildFieldMap(CompanyCredential c, String dbName) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("CLIENT_CODE", c.getClientCode() != null ? c.getClientCode().trim() : null);
        map.put("COMPANY_NAME", c.getCompanyName());
        map.put("SHORT_NAME", c.getShortName());
        map.put("ADDRESS", c.getAddress());
        map.put("CITY", c.getCity());
        map.put("STATE", c.getState());
        map.put("STATE_CODE", c.getStateCode());
        map.put("COUNTRY", c.getCountry());
        map.put("PINCODE", c.getPincode());
        map.put("GST_IN", c.getGstIn());
        map.put("REGISTRATION_NO", c.getRegistrationNo());
        map.put("PAN_NO", c.getPanNo());
        map.put("MOBILE_NO", c.getMobileNo());
        map.put("PHONE_NO", c.getPhoneNo());
        map.put("EMAIL_ID", c.getEmailId());
        map.put("WEBSITE", c.getWebsite());
        map.put("SUPPORT_EMAIL", c.getSupportEmail());
        map.put("SUPPORT_PHONE", c.getSupportPhone());
        map.put("GMAPLINK", c.getGmaplink());
        map.put("DECIMAL_PLACES", c.getDecimalPlaces());
        map.put("CURRENCY_CODE", c.getCurrencyCode());
        map.put("IS_ACTIVE", c.getIsActive() != null ? c.getIsActive() : true);
        map.put("INPUT_CASE_STYLE", c.getInputCaseStyle());
        map.put("TIME_FORMAT", c.getTimeFormat() != null ? c.getTimeFormat() : "H24");
        map.put("DATE_FORMAT", c.getDateFormat() != null ? c.getDateFormat() : "DD/MM/YYYY");
        map.put("WEEK_STARTS_ON", c.getWeekStartsOn() != null ? c.getWeekStartsOn() : "MONDAY");
        map.put("APP_TIMEZONE", c.getAppTimezone() != null ? c.getAppTimezone() : "Asia/Kolkata");
        map.put("DEFAULT_ROWS_PER_PAGE", c.getDefaultRowsPerPage());
        map.put("DEFAULT_MAX_RECORDS", c.getDefaultMaxRecords());
        map.put("AUTO_LOGOUT_SECONDS", c.getAutoLogoutSeconds());
        map.put("ALLOW_DUPLICATE_SCREENS", c.getAllowDuplicateScreens());
        map.put("ALLOW_RIGHT_CLICK", c.getAllowRightClick());
        map.put("SINGLE_ACTIVE_SESSION", c.getSingleActiveSession());
        map.put("DIRECTORY_PATH", c.getDirectoryPath());
        map.put("DB_SOURCE_NAME", c.getDbSourceName() != null && !c.getDbSourceName().trim().isEmpty() ? c.getDbSourceName().trim() : dbName);

        if (c.getLicRenewalDate() != null) {
            map.put("LIC_RENEWAL_DATE", new Timestamp(c.getLicRenewalDate().getTime()));
        }
        if (c.getLicExpiryDate() != null) {
            map.put("LIC_EXPIRY_DATE", new Timestamp(c.getLicExpiryDate().getTime()));
        }
        if (c.getLicExpRemainderDays() != null) {
            map.put("LIC_EXP_REMAINDER_DAYS", c.getLicExpRemainderDays());
        }
        if (c.getRestoreEnableDays() != null) {
            map.put("RESTORE_ENABLE_DAYS", c.getRestoreEnableDays());
        }

        // eSSL settings if available
        if (c.getEsslConfigName() != null) map.put("ESSL_CONFIG_NAME", c.getEsslConfigName());
        if (c.getEsslAttendanceSource() != null) map.put("ESSL_ATTENDANCE_SOURCE", c.getEsslAttendanceSource());
        if (c.getEsslConnectionType() != null) map.put("ESSL_CONNECTION_TYPE", c.getEsslConnectionType());
        if (c.getEsslDatabaseType() != null) map.put("ESSL_DATABASE_TYPE", c.getEsslDatabaseType());
        if (c.getEsslServerIp() != null) map.put("ESSL_SERVER_IP", c.getEsslServerIp());
        if (c.getEsslPort() != null) map.put("ESSL_PORT", c.getEsslPort());
        if (c.getEsslDbName() != null) map.put("ESSL_DB_NAME", c.getEsslDbName());
        if (c.getEsslUsername() != null) map.put("ESSL_USERNAME", c.getEsslUsername());
        if (c.getEsslPassword() != null) map.put("ESSL_PASSWORD", c.getEsslPassword());
        if (c.getEsslStatus() != null) map.put("ESSL_STATUS", c.getEsslStatus());

        return map;
    }

    private void executeUpdate(Connection conn, Long recordId, Map<String, Object> values, Set<String> existingColumns) throws SQLException {
        StringBuilder sql = new StringBuilder("UPDATE AD_COMPANY_CREDENTIAL SET ");
        List<Object> params = new ArrayList<>();

        boolean first = true;
        for (Map.Entry<String, Object> entry : values.entrySet()) {
            String col = entry.getKey();
            if (existingColumns.contains(col.toUpperCase())) {
                if (!first) sql.append(", ");
                sql.append("[").append(col).append("] = ?");
                params.add(entry.getValue());
                first = false;
            }
        }

        sql.append(" WHERE id = ?");
        params.add(recordId);

        try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            ps.executeUpdate();
        }
    }

    private void executeInsert(Connection conn, Map<String, Object> values, Set<String> existingColumns) throws SQLException {
        StringBuilder colList = new StringBuilder();
        StringBuilder qList = new StringBuilder();
        List<Object> params = new ArrayList<>();

        boolean first = true;
        for (Map.Entry<String, Object> entry : values.entrySet()) {
            String col = entry.getKey();
            if (existingColumns.contains(col.toUpperCase())) {
                if (!first) {
                    colList.append(", ");
                    qList.append(", ");
                }
                colList.append("[").append(col).append("]");
                qList.append("?");
                params.add(entry.getValue());
                first = false;
            }
        }

        String sql = String.format("INSERT INTO AD_COMPANY_CREDENTIAL (%s) VALUES (%s)", colList, qList);

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            ps.executeUpdate();
        }
    }

    private Map<String, Object> fetchExistingRecord(Connection conn, Long recordId) throws SQLException {
        Map<String, Object> map = new HashMap<>();
        String sql = "SELECT * FROM AD_COMPANY_CREDENTIAL WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, recordId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    ResultSetMetaData meta = rs.getMetaData();
                    int colCount = meta.getColumnCount();
                    for (int i = 1; i <= colCount; i++) {
                        map.put(meta.getColumnName(i).toUpperCase(), rs.getObject(i));
                    }
                }
            }
        }
        return map;
    }

    private boolean isRecordSeedData(Map<String, Object> clientRow) {
        if (clientRow == null || clientRow.isEmpty()) return false;
        String clientCode = clientRow.get("CLIENT_CODE") != null ? clientRow.get("CLIENT_CODE").toString().trim() : "";
        String compName = clientRow.get("COMPANY_NAME") != null ? clientRow.get("COMPANY_NAME").toString().trim().toUpperCase() : "";
        String shortName = clientRow.get("SHORT_NAME") != null ? clientRow.get("SHORT_NAME").toString().trim().toUpperCase() : "";

        if (clientCode.isEmpty() || "123456".equalsIgnoreCase(clientCode)) {
            return true;
        }
        if ("AUTONOMA".equals(compName) || "AUTONOMA".equals(shortName)) {
            return true;
        }
        return false;
    }

    private boolean canReverseSync(String colName, Set<String> modifiedCols, Map<String, Object> clientRow) {
        if (modifiedCols != null && modifiedCols.contains(colName.toUpperCase())) {
            return false;
        }
        return clientRow != null && clientRow.containsKey(colName.toUpperCase()) && clientRow.get(colName.toUpperCase()) != null;
    }

    private String getString(Map<String, Object> row, String col) {
        Object o = row.get(col.toUpperCase());
        return o != null ? o.toString().trim() : null;
    }

    private Integer getInteger(Map<String, Object> row, String col) {
        Object o = row.get(col.toUpperCase());
        if (o instanceof Number) return ((Number) o).intValue();
        if (o != null) {
            try { return Integer.valueOf(o.toString().trim()); } catch (Exception ignored) {}
        }
        return null;
    }

    private Boolean getBoolean(Map<String, Object> row, String col) {
        Object o = row.get(col.toUpperCase());
        if (o instanceof Boolean) return (Boolean) o;
        if (o instanceof Number) return ((Number) o).intValue() != 0;
        if (o != null) {
            String s = o.toString().trim();
            return "true".equalsIgnoreCase(s) || "1".equals(s);
        }
        return null;
    }

    private boolean applyReverseSyncFromClient(CompanyCredential company, Map<String, Object> clientRow, Set<String> modifiedCols, List<String> pulledFields) {
        boolean changed = false;

        if (canReverseSync("COMPANY_NAME", modifiedCols, clientRow)) {
            String val = getString(clientRow, "COMPANY_NAME");
            if (val != null && !val.equals(company.getCompanyName())) {
                company.setCompanyName(val);
                pulledFields.add("companyName");
                changed = true;
            }
        }
        if (canReverseSync("SHORT_NAME", modifiedCols, clientRow)) {
            String val = getString(clientRow, "SHORT_NAME");
            if (val != null && !val.equals(company.getShortName())) {
                company.setShortName(val);
                pulledFields.add("shortName");
                changed = true;
            }
        }
        if (canReverseSync("ADDRESS", modifiedCols, clientRow)) {
            String val = getString(clientRow, "ADDRESS");
            if (val != null && !val.equals(company.getAddress())) {
                company.setAddress(val);
                pulledFields.add("address");
                changed = true;
            }
        }
        if (canReverseSync("CITY", modifiedCols, clientRow)) {
            String val = getString(clientRow, "CITY");
            if (val != null && !val.equals(company.getCity())) {
                company.setCity(val);
                pulledFields.add("city");
                changed = true;
            }
        }
        if (canReverseSync("STATE", modifiedCols, clientRow)) {
            String val = getString(clientRow, "STATE");
            if (val != null && !val.equals(company.getState())) {
                company.setState(val);
                pulledFields.add("state");
                changed = true;
            }
        }
        if (canReverseSync("STATE_CODE", modifiedCols, clientRow)) {
            Integer val = getInteger(clientRow, "STATE_CODE");
            if (val != null && !val.equals(company.getStateCode())) {
                company.setStateCode(val);
                pulledFields.add("stateCode");
                changed = true;
            }
        }
        if (canReverseSync("COUNTRY", modifiedCols, clientRow)) {
            String val = getString(clientRow, "COUNTRY");
            if (val != null && !val.equals(company.getCountry())) {
                company.setCountry(val);
                pulledFields.add("country");
                changed = true;
            }
        }
        if (canReverseSync("PINCODE", modifiedCols, clientRow)) {
            String val = getString(clientRow, "PINCODE");
            if (val != null && !val.equals(company.getPincode())) {
                company.setPincode(val);
                pulledFields.add("pincode");
                changed = true;
            }
        }
        if (canReverseSync("GST_IN", modifiedCols, clientRow)) {
            String val = getString(clientRow, "GST_IN");
            if (val != null && !val.equals(company.getGstIn())) {
                company.setGstIn(val);
                pulledFields.add("gstIn");
                changed = true;
            }
        }
        if (canReverseSync("REGISTRATION_NO", modifiedCols, clientRow)) {
            String val = getString(clientRow, "REGISTRATION_NO");
            if (val != null && !val.equals(company.getRegistrationNo())) {
                company.setRegistrationNo(val);
                pulledFields.add("registrationNo");
                changed = true;
            }
        }
        if (canReverseSync("PAN_NO", modifiedCols, clientRow)) {
            String val = getString(clientRow, "PAN_NO");
            if (val != null && !val.equals(company.getPanNo())) {
                company.setPanNo(val);
                pulledFields.add("panNo");
                changed = true;
            }
        }
        if (canReverseSync("MOBILE_NO", modifiedCols, clientRow)) {
            String val = getString(clientRow, "MOBILE_NO");
            if (val != null && !val.equals(company.getMobileNo())) {
                company.setMobileNo(val);
                pulledFields.add("mobileNo");
                changed = true;
            }
        }
        if (canReverseSync("PHONE_NO", modifiedCols, clientRow)) {
            String val = getString(clientRow, "PHONE_NO");
            if (val != null && !val.equals(company.getPhoneNo())) {
                company.setPhoneNo(val);
                pulledFields.add("phoneNo");
                changed = true;
            }
        }
        if (canReverseSync("EMAIL_ID", modifiedCols, clientRow)) {
            String val = getString(clientRow, "EMAIL_ID");
            if (val != null && !val.equals(company.getEmailId())) {
                company.setEmailId(val);
                pulledFields.add("emailId");
                changed = true;
            }
        }
        if (canReverseSync("WEBSITE", modifiedCols, clientRow)) {
            String val = getString(clientRow, "WEBSITE");
            if (val != null && !val.equals(company.getWebsite())) {
                company.setWebsite(val);
                pulledFields.add("website");
                changed = true;
            }
        }
        if (canReverseSync("SUPPORT_EMAIL", modifiedCols, clientRow)) {
            String val = getString(clientRow, "SUPPORT_EMAIL");
            if (val != null && !val.equals(company.getSupportEmail())) {
                company.setSupportEmail(val);
                pulledFields.add("supportEmail");
                changed = true;
            }
        }
        if (canReverseSync("SUPPORT_PHONE", modifiedCols, clientRow)) {
            String val = getString(clientRow, "SUPPORT_PHONE");
            if (val != null && !val.equals(company.getSupportPhone())) {
                company.setSupportPhone(val);
                pulledFields.add("supportPhone");
                changed = true;
            }
        }
        if (canReverseSync("GMAPLINK", modifiedCols, clientRow)) {
            String val = getString(clientRow, "GMAPLINK");
            if (val != null && !val.equals(company.getGmaplink())) {
                company.setGmaplink(val);
                pulledFields.add("gmaplink");
                changed = true;
            }
        }
        if (canReverseSync("DECIMAL_PLACES", modifiedCols, clientRow)) {
            Integer val = getInteger(clientRow, "DECIMAL_PLACES");
            if (val != null && !val.equals(company.getDecimalPlaces())) {
                company.setDecimalPlaces(val);
                pulledFields.add("decimalPlaces");
                changed = true;
            }
        }
        if (canReverseSync("CURRENCY_CODE", modifiedCols, clientRow)) {
            String val = getString(clientRow, "CURRENCY_CODE");
            if (val != null && !val.equals(company.getCurrencyCode())) {
                company.setCurrencyCode(val);
                pulledFields.add("currencyCode");
                changed = true;
            }
        }
        if (canReverseSync("INPUT_CASE_STYLE", modifiedCols, clientRow)) {
            String val = getString(clientRow, "INPUT_CASE_STYLE");
            if (val != null && !val.equals(company.getInputCaseStyle())) {
                company.setInputCaseStyle(val);
                pulledFields.add("inputCaseStyle");
                changed = true;
            }
        }
        if (canReverseSync("TIME_FORMAT", modifiedCols, clientRow)) {
            String val = getString(clientRow, "TIME_FORMAT");
            if (val != null && !val.equals(company.getTimeFormat())) {
                company.setTimeFormat(val);
                pulledFields.add("timeFormat");
                changed = true;
            }
        }
        if (canReverseSync("DATE_FORMAT", modifiedCols, clientRow)) {
            String val = getString(clientRow, "DATE_FORMAT");
            if (val != null && !val.equals(company.getDateFormat())) {
                company.setDateFormat(val);
                pulledFields.add("dateFormat");
                changed = true;
            }
        }
        if (canReverseSync("WEEK_STARTS_ON", modifiedCols, clientRow)) {
            String val = getString(clientRow, "WEEK_STARTS_ON");
            if (val != null && !val.equals(company.getWeekStartsOn())) {
                company.setWeekStartsOn(val);
                pulledFields.add("weekStartsOn");
                changed = true;
            }
        }
        if (canReverseSync("APP_TIMEZONE", modifiedCols, clientRow)) {
            String val = getString(clientRow, "APP_TIMEZONE");
            if (val != null && !val.equals(company.getAppTimezone())) {
                company.setAppTimezone(val);
                pulledFields.add("appTimezone");
                changed = true;
            }
        }
        if (canReverseSync("DEFAULT_ROWS_PER_PAGE", modifiedCols, clientRow)) {
            Integer val = getInteger(clientRow, "DEFAULT_ROWS_PER_PAGE");
            if (val != null && !val.equals(company.getDefaultRowsPerPage())) {
                company.setDefaultRowsPerPage(val);
                pulledFields.add("defaultRowsPerPage");
                changed = true;
            }
        }
        if (canReverseSync("DEFAULT_MAX_RECORDS", modifiedCols, clientRow)) {
            Integer val = getInteger(clientRow, "DEFAULT_MAX_RECORDS");
            if (val != null && !val.equals(company.getDefaultMaxRecords())) {
                company.setDefaultMaxRecords(val);
                pulledFields.add("defaultMaxRecords");
                changed = true;
            }
        }
        if (canReverseSync("AUTO_LOGOUT_SECONDS", modifiedCols, clientRow)) {
            Integer val = getInteger(clientRow, "AUTO_LOGOUT_SECONDS");
            if (val != null && !val.equals(company.getAutoLogoutSeconds())) {
                company.setAutoLogoutSeconds(val);
                pulledFields.add("autoLogoutSeconds");
                changed = true;
            }
        }
        if (canReverseSync("ALLOW_DUPLICATE_SCREENS", modifiedCols, clientRow)) {
            Boolean val = getBoolean(clientRow, "ALLOW_DUPLICATE_SCREENS");
            if (val != null && !val.equals(company.getAllowDuplicateScreens())) {
                company.setAllowDuplicateScreens(val);
                pulledFields.add("allowDuplicateScreens");
                changed = true;
            }
        }
        if (canReverseSync("ALLOW_RIGHT_CLICK", modifiedCols, clientRow)) {
            Boolean val = getBoolean(clientRow, "ALLOW_RIGHT_CLICK");
            if (val != null && !val.equals(company.getAllowRightClick())) {
                company.setAllowRightClick(val);
                pulledFields.add("allowRightClick");
                changed = true;
            }
        }
        if (canReverseSync("SINGLE_ACTIVE_SESSION", modifiedCols, clientRow)) {
            Boolean val = getBoolean(clientRow, "SINGLE_ACTIVE_SESSION");
            if (val != null && !val.equals(company.getSingleActiveSession())) {
                company.setSingleActiveSession(val);
                pulledFields.add("singleActiveSession");
                changed = true;
            }
        }
        if (canReverseSync("DIRECTORY_PATH", modifiedCols, clientRow)) {
            String val = getString(clientRow, "DIRECTORY_PATH");
            if (val != null && !val.equals(company.getDirectoryPath())) {
                company.setDirectoryPath(val);
                pulledFields.add("directoryPath");
                changed = true;
            }
        }

        return changed;
    }
}

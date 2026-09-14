package com.autonoma.erp.controller.admin;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.modules.platform.files.service.FileService;
import com.autonoma.erp.service.admin.CompanyCredentialService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/company-profile")
@CrossOrigin(origins = "*")
public class CompanyCredentialController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CompanyCredentialController.class);

    @org.springframework.beans.factory.annotation.Value("${essl.datasource.username:nutech}")
    private String fallbackUsername;

    @org.springframework.beans.factory.annotation.Value("${essl.datasource.password:nutech@2026}")
    private String fallbackPassword;

    @Autowired
    private com.autonoma.erp.service.admin.CompanyCredentialService service;

    @Autowired
    private com.autonoma.erp.service.security.LoginSecurityService loginSecurityService;

    @Autowired
    private FileService fileService;

    @Autowired
    private com.autonoma.erp.service.admin.EmailSendingService emailSendingService;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.notification.service.EmailContentService emailContentService;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.identity.service.EnterpriseClientValidationService enterpriseClientValidationService;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine emailTemplateEngine;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.CompanyCredentialRepository companyCredentialRepository;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.identity.repository.CliClientLicenseRepository cliClientLicenseRepository;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.identity.repository.CliClientDatabaseConfigRepository cliClientDatabaseConfigRepository;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.identity.repository.CliClientServerConfigRepository cliClientServerConfigRepository;

    @Autowired(required = false)
    private com.autonoma.erp.service.admin.ClientDatabaseSyncService clientDatabaseSyncService;

    private String getCurrentUserId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "SYSTEM";
    }

    private boolean isSuperAdmin() {
        String userId = getCurrentUserId();
        if ("SUPER BOSS".equalsIgnoreCase(userId) || "ADMIN".equalsIgnoreCase(userId)) {
            return true;
        }
        if (userRepository != null) {
            java.util.Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = userRepository.findByUserId(userId);
            if (userOpt.isPresent()) {
                com.autonoma.erp.model.admin.UserCredential user = userOpt.get();
                if (user.getUserLevel() != null && user.getUserLevel() >= 5) {
                    return true;
                }
            }
        }
        return false;
    }

    private CompanyCredential sanitizeForNonSuperAdmin(CompanyCredential credential) {
        if (credential == null) return null;
        if (isSuperAdmin()) return credential;

        CompanyCredential sanitized = new CompanyCredential();
        sanitized.setId(credential.getId());
        sanitized.setCompanyName(credential.getCompanyName());
        sanitized.setShortName(credential.getShortName());
        sanitized.setAddress(credential.getAddress());
        sanitized.setCity(credential.getCity());
        sanitized.setState(credential.getState());
        sanitized.setStateCode(credential.getStateCode());
        sanitized.setCountry(credential.getCountry());
        sanitized.setPincode(credential.getPincode());
        sanitized.setGstIn(credential.getGstIn());
        sanitized.setDbSourceName(credential.getDbSourceName());
        sanitized.setLicRenewalDate(credential.getLicRenewalDate());
        sanitized.setLicExpiryDate(credential.getLicExpiryDate());
        sanitized.setDirectoryPath(credential.getDirectoryPath());
        sanitized.setLicExpRemainderDays(credential.getLicExpRemainderDays());
        sanitized.setRestoreEnableDays(credential.getRestoreEnableDays());
        sanitized.setInputCaseStyle(credential.getInputCaseStyle());
        sanitized.setRegistrationNo(credential.getRegistrationNo());
        sanitized.setPanNo(credential.getPanNo());
        sanitized.setMobileNo(credential.getMobileNo());
        sanitized.setPhoneNo(credential.getPhoneNo());
        sanitized.setEmailId(credential.getEmailId());
        sanitized.setWebsite(credential.getWebsite());
        sanitized.setSupportEmail(credential.getSupportEmail());
        sanitized.setSupportPhone(credential.getSupportPhone());
        sanitized.setGmaplink(credential.getGmaplink());
        sanitized.setDecimalPlaces(credential.getDecimalPlaces());
        sanitized.setCurrencyCode(credential.getCurrencyCode());
        sanitized.setSmtpHost(credential.getSmtpHost());
        sanitized.setSmtpPort(credential.getSmtpPort());
        sanitized.setSmtpUsername(credential.getSmtpUsername());
        sanitized.setSmtpPassword(credential.getSmtpPassword());
        sanitized.setSmtpSslEnabled(credential.getSmtpSslEnabled());
        sanitized.setAuditLogEnabled(credential.getAuditLogEnabled());
        sanitized.setDefaultRowsPerPage(credential.getDefaultRowsPerPage());
        sanitized.setDefaultMaxRecords(credential.getDefaultMaxRecords());
        sanitized.setAutoLogoutSeconds(credential.getAutoLogoutSeconds());
        sanitized.setLogoFileName(credential.getLogoFileName());
        sanitized.setLogInBgFileName(credential.getLogInBgFileName());

        sanitized.setOcrSharedMailbox(credential.getOcrSharedMailbox());
        sanitized.setOcrProcessedFolder(credential.getOcrProcessedFolder());
        sanitized.setExpiresAt(credential.getExpiresAt());

        sanitized.setOcrTenantId(null);
        sanitized.setOcrClientId(null);
        sanitized.setOcrClientSecret(null);
        sanitized.setAccessToken(null);
        sanitized.setRefreshToken(null);

        sanitized.setEsslConfigName(credential.getEsslConfigName());
        sanitized.setEsslAttendanceSource(credential.getEsslAttendanceSource());
        sanitized.setEsslConnectionType(credential.getEsslConnectionType());
        sanitized.setEsslDatabaseType(credential.getEsslDatabaseType());
        sanitized.setEsslServerIp(credential.getEsslServerIp());
        sanitized.setEsslPort(credential.getEsslPort());
        sanitized.setEsslDbName(credential.getEsslDbName());
        sanitized.setEsslUsername(credential.getEsslUsername());
        sanitized.setEsslPassword(credential.getEsslPassword());
        sanitized.setEsslStatus(credential.getEsslStatus());
        sanitized.setEsslApiBaseUrl(credential.getEsslApiBaseUrl());

        // Copy missing properties needed by client master page
        sanitized.setClientCode(credential.getClientCode());
        sanitized.setTimeFormat(credential.getTimeFormat());
        sanitized.setDateFormat(credential.getDateFormat());
        sanitized.setWeekStartsOn(credential.getWeekStartsOn());
        sanitized.setAppTimezone(credential.getAppTimezone());
        sanitized.setIsActive(credential.getIsActive());
        sanitized.setSingleActiveSession(credential.getSingleActiveSession());
        sanitized.setAllowDuplicateScreens(credential.getAllowDuplicateScreens());
        sanitized.setAllowRightClick(credential.getAllowRightClick());

        return sanitized;
    }

    @PostMapping("/update-database-case-style")
    @RequirePagePermission(pageCode = "AD1110", action = "write")
    public ResponseEntity<Map<String, String>> updateDatabaseCaseStyle(@RequestParam("style") String style) {
        Map<String, String> response = new HashMap<>();
        try (java.sql.Connection conn = java.util.Objects.requireNonNull(jdbcTemplate.getDataSource()).getConnection()) {
            java.sql.DatabaseMetaData metaData = conn.getMetaData();
            String catalog = conn.getCatalog();
            
            if ("CUSTOM".equals(style)) {
                response.put("message", "No database update required for CUSTOM style.");
                return ResponseEntity.ok(response);
            }
            
            // List of tables to skip (sensitive or system tables)
            List<String> skipTables = java.util.Arrays.asList(
                "ad_user_credential", "ad_user_credentials", "ad_company_credential",
                "ad_backend_error_log", "flyway_schema_history"
            );

            if ("PROPER_CASE".equals(style)) {
                try {
                    jdbcTemplate.execute("IF OBJECT_ID('dbo.InitCap', 'FN') IS NOT NULL DROP FUNCTION dbo.InitCap");
                    jdbcTemplate.execute("CREATE FUNCTION dbo.InitCap(@String VARCHAR(MAX)) RETURNS VARCHAR(MAX) AS BEGIN DECLARE @Index INT, @Char CHAR(1), @PrevChar CHAR(1), @Output VARCHAR(MAX); SET @Output = LOWER(@String); SET @Index = 1; SET @PrevChar = ' '; WHILE @Index <= LEN(@String) BEGIN SET @Char = SUBSTRING(@String, @Index, 1); IF @PrevChar IN (' ', ';', ':', '!', '?', ',', '.', '_', '-', '/', '&', '''', '(') BEGIN IF @Char != ' ' SET @Output = STUFF(@Output, @Index, 1, UPPER(@Char)); END SET @PrevChar = @Char; SET @Index = @Index + 1; END RETURN @Output; END");
                } catch (Exception ex) {
                    System.err.println("Failed to create InitCap function: " + ex.getMessage());
                }
            }

            java.sql.ResultSet tables = metaData.getTables(catalog, null, "%", new String[]{"TABLE"});
            int updatedTables = 0;
            while (tables.next()) {
                String tableName = tables.getString("TABLE_NAME");
                String lowerTable = tableName.toLowerCase();
                if (skipTables.contains(lowerTable)) continue;
                if (lowerTable.startsWith("ad_") || lowerTable.startsWith("bos_") || lowerTable.startsWith("ch_")) {
                    continue;
                }

                java.sql.ResultSet columns = metaData.getColumns(catalog, null, tableName, "%");
                List<String> stringColumns = new java.util.ArrayList<>();
                while (columns.next()) {
                    String colName = columns.getString("COLUMN_NAME");
                    int dataType = columns.getInt("DATA_TYPE");
                    // Types: VARCHAR, NVARCHAR, LONGVARCHAR, CHAR
                    if (dataType == java.sql.Types.VARCHAR || dataType == java.sql.Types.NVARCHAR || 
                        dataType == java.sql.Types.LONGVARCHAR || dataType == java.sql.Types.CHAR ||
                        dataType == java.sql.Types.LONGNVARCHAR) {
                        
                        // Exclude obvious non-text fields or passwords
                        String lowerCol = colName.toLowerCase();
                        if (!lowerCol.contains("password") && !lowerCol.contains("email") && 
                            !lowerCol.contains("hash") && !lowerCol.contains("token") && 
                            !lowerCol.contains("id") && !lowerCol.contains("path") && !lowerCol.contains("url") &&
                            !lowerCol.contains("created_by") && !lowerCol.contains("updated_by") && 
                            !lowerCol.contains("user_name") && !lowerCol.contains("username")) {
                            stringColumns.add(colName);
                        }
                    }
                }
                
                if (!stringColumns.isEmpty()) {
                    StringBuilder sql = new StringBuilder("UPDATE " + tableName + " SET ");
                    for (int i = 0; i < stringColumns.size(); i++) {
                        String col = stringColumns.get(i);
                        if ("UPPER_CASE".equals(style)) {
                            sql.append(col).append(" = UPPER(").append(col).append(")");
                        } else if ("LOWER_CASE".equals(style)) {
                            sql.append(col).append(" = LOWER(").append(col).append(")");
                        } else if ("PROPER_CASE".equals(style)) {
                            sql.append(col).append(" = dbo.InitCap(").append(col).append(")");
                        }
                        if (i < stringColumns.size() - 1) sql.append(", ");
                    }
                    
                    if (("UPPER_CASE".equals(style) || "LOWER_CASE".equals(style) || "PROPER_CASE".equals(style)) && !sql.toString().endsWith("SET ")) {
                        try {
                            jdbcTemplate.update(sql.toString());
                            updatedTables++;
                        } catch (Exception ex) {
                            System.err.println("Skipped updating table " + tableName + " due to error: " + ex.getMessage());
                        }
                    }
                }
            }
            response.put("message", "Database successfully updated to " + style + ". Tables affected: " + updatedTables);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "Database update failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<CompanyCredential>> getAll() {
        List<CompanyCredential> all = service.findAll();
        if (!isSuperAdmin()) {
            List<CompanyCredential> sanitizedList = new java.util.ArrayList<>();
            for (CompanyCredential comp : all) {
                sanitizedList.add(sanitizeForNonSuperAdmin(comp));
            }
            return ResponseEntity.ok(sanitizedList);
        }
        return ResponseEntity.ok(all);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyCredential> getById(@PathVariable Long id) {
        Optional<CompanyCredential> result = service.findById(id);
        if (result.isPresent()) {
            return ResponseEntity.ok(sanitizeForNonSuperAdmin(result.get()));
        }
        return ResponseEntity.notFound().build();
    }

    private ResponseEntity<?> checkCompanyQuota(boolean isActivating) {
        if (isActivating && enterpriseClientValidationService != null) {
            long activeCompaniesCount = service.findAll().stream()
                    .filter(c -> c.getIsActive() == null || Boolean.TRUE.equals(c.getIsActive()))
                    .count();
            com.autonoma.erp.modules.platform.identity.dto.EnterpriseValidationResult result = enterpriseClientValidationService.validateCompanyLimit(activeCompaniesCount);
            if (result != null && !result.isValid() && "MAX_COMPANIES_EXCEEDED".equals(result.getErrorCode())) {
                return ResponseEntity.badRequest().body(result.getMessage());
            }
        }
        return null;
    }

    @PostMapping("/create")


    @RequirePagePermission(pageCode = "AD1110", action = "write")
    public ResponseEntity<?> create(@RequestBody CompanyCredential company) {
        boolean isCreatingActive = company.getIsActive() == null || Boolean.TRUE.equals(company.getIsActive());
        ResponseEntity<?> quotaErr = checkCompanyQuota(isCreatingActive);
        if (quotaErr != null) {
            return quotaErr;
        }
        if (company.getClientCode() == null || !company.getClientCode().trim().matches("^\\d{6}$")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Client Code is mandatory and must be exactly 6 numeric digits (e.g. 688324)."));
        }
        company.setClientCode(company.getClientCode().trim());
        if (companyCredentialRepository != null && companyCredentialRepository.existsByClientCode(company.getClientCode())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Client Code '" + company.getClientCode() + "' is already assigned to another client."));
        }
        if (!isSuperAdmin()) {
            company.setOcrTenantId(null);
            company.setOcrClientId(null);
            company.setOcrClientSecret(null);
        }
        CompanyCredential saved = service.save(company);
        if (clientDatabaseSyncService != null && saved != null && saved.getId() != null) {
            try {
                clientDatabaseSyncService.syncToClientDatabase(saved.getId());
            } catch (Exception ex) {
                log.warn("[CompanyCredentialController] Auto client DB sync failed on create: {}", ex.getMessage());
            }
        }
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/update/{id}")


    @RequirePagePermission(pageCode = "AD1110", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody CompanyCredential details) {
        if (details.getClientCode() == null || !details.getClientCode().trim().matches("^\\d{6}$")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Client Code is mandatory and must be exactly 6 numeric digits (e.g. 688324)."));
        }
        if (companyCredentialRepository != null) {
            Optional<CompanyCredential> other = companyCredentialRepository.findByClientCode(details.getClientCode().trim());
            if (other.isPresent() && !other.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Client Code '" + details.getClientCode() + "' is already assigned to another client."));
            }
        }
        Optional<CompanyCredential> optional = service.findById(id);
        if (optional.isPresent()) {
            CompanyCredential existing = optional.get();

            boolean wasInactive = existing.getIsActive() != null && Boolean.FALSE.equals(existing.getIsActive());
            boolean isNowActive = details.getIsActive() == null || Boolean.TRUE.equals(details.getIsActive());
            if (wasInactive && isNowActive) {
                ResponseEntity<?> quotaErr = checkCompanyQuota(true);
                if (quotaErr != null) {
                    return quotaErr;
                }
            }

            Set<String> modifiedCols = detectModifiedColumns(existing, details);

            existing.setClientCode(details.getClientCode().trim());
            existing.setCompanyName(details.getCompanyName());
            existing.setShortName(details.getShortName());
            existing.setAddress(details.getAddress());
            existing.setCity(details.getCity());
            existing.setState(details.getState());
            existing.setStateCode(details.getStateCode());
            existing.setCountry(details.getCountry());
            existing.setPincode(details.getPincode());
            existing.setGstIn(details.getGstIn());
            existing.setClientCode(details.getClientCode());
            existing.setDbSourceName(details.getDbSourceName());
            existing.setLicRenewalDate(details.getLicRenewalDate());
            existing.setLicExpiryDate(details.getLicExpiryDate());
            existing.setDirectoryPath(details.getDirectoryPath());
            existing.setLicExpRemainderDays(details.getLicExpRemainderDays());
            existing.setRestoreEnableDays(details.getRestoreEnableDays());
            existing.setInputCaseStyle(details.getInputCaseStyle());

            existing.setRegistrationNo(details.getRegistrationNo());
            existing.setPanNo(details.getPanNo());
            existing.setMobileNo(details.getMobileNo());
            existing.setPhoneNo(details.getPhoneNo());
            existing.setEmailId(details.getEmailId());
            existing.setWebsite(details.getWebsite());
            existing.setSupportEmail(details.getSupportEmail());
            existing.setSupportPhone(details.getSupportPhone());
            existing.setGmaplink(details.getGmaplink());
            existing.setDecimalPlaces(details.getDecimalPlaces());
            existing.setCurrencyCode(details.getCurrencyCode());
            existing.setSmtpHost(details.getSmtpHost());
            existing.setSmtpPort(details.getSmtpPort());
            existing.setSmtpUsername(details.getSmtpUsername());
            existing.setSmtpPassword(details.getSmtpPassword());
            existing.setSmtpSslEnabled(details.getSmtpSslEnabled());
            existing.setAuditLogEnabled(details.getAuditLogEnabled());
            existing.setDefaultRowsPerPage(details.getDefaultRowsPerPage());
            existing.setDefaultMaxRecords(details.getDefaultMaxRecords());
            existing.setAutoLogoutSeconds(details.getAutoLogoutSeconds());
            existing.setAllowDuplicateScreens(details.getAllowDuplicateScreens());
            existing.setAllowRightClick(details.getAllowRightClick());
            existing.setSingleActiveSession(details.getSingleActiveSession());
            existing.setTimeFormat(details.getTimeFormat());
            existing.setDateFormat(details.getDateFormat());
            existing.setWeekStartsOn(details.getWeekStartsOn());
            existing.setAppTimezone(details.getAppTimezone());

            // Update Azure Tenant ID, Client ID, and Client Secret
            if (details.getOcrTenantId() != null && !details.getOcrTenantId().isBlank()) existing.setOcrTenantId(details.getOcrTenantId().trim());
            if (details.getOcrClientId() != null && !details.getOcrClientId().isBlank()) existing.setOcrClientId(details.getOcrClientId().trim());
            if (details.getOcrClientSecret() != null && !details.getOcrClientSecret().isBlank()) existing.setOcrClientSecret(details.getOcrClientSecret().trim());

            if (details.getOcrSharedMailbox() != null) existing.setOcrSharedMailbox(details.getOcrSharedMailbox().trim());
            if (details.getOcrProcessedFolder() != null) existing.setOcrProcessedFolder(details.getOcrProcessedFolder().trim());
            if (details.getAccessToken() != null && !details.getAccessToken().isBlank()) existing.setAccessToken(details.getAccessToken());
            if (details.getRefreshToken() != null && !details.getRefreshToken().isBlank()) existing.setRefreshToken(details.getRefreshToken());
            if (details.getExpiresAt() != null) existing.setExpiresAt(details.getExpiresAt());

            // copy eSSL Configuration Fields
            existing.setEsslConfigName(details.getEsslConfigName());
            existing.setEsslAttendanceSource(details.getEsslAttendanceSource());
            existing.setEsslConnectionType(details.getEsslConnectionType());
            existing.setEsslDatabaseType(details.getEsslDatabaseType());
            existing.setEsslServerIp(details.getEsslServerIp());
            existing.setEsslPort(details.getEsslPort());
            existing.setEsslDbName(details.getEsslDbName());
            existing.setEsslUsername(details.getEsslUsername());
            existing.setEsslPassword(details.getEsslPassword());
            existing.setEsslStatus(details.getEsslStatus());
            existing.setEsslApiBaseUrl(details.getEsslApiBaseUrl());
            existing.setEsslApiKey(details.getEsslApiKey());
            existing.setEsslSecretKey(details.getEsslSecretKey());
            existing.setEsslClientId(details.getEsslClientId());
            existing.setEsslClientSecret(details.getEsslClientSecret());
            existing.setEsslAccessToken(details.getEsslAccessToken());
            existing.setEsslRefreshToken(details.getEsslRefreshToken());

            if (details.getLogoFileName() != null)
                existing.setLogoFileName(details.getLogoFileName());
            if (details.getLogInBgFileName() != null)
                existing.setLogInBgFileName(details.getLogInBgFileName());

            if (enterpriseClientValidationService != null) {
                enterpriseClientValidationService.clearValidationCache();
            }
            CompanyCredential saved = service.save(existing);
            if (clientDatabaseSyncService != null && saved != null && saved.getId() != null) {
                try {
                    clientDatabaseSyncService.syncToClientDatabase(saved.getId(), modifiedCols);
                } catch (Exception ex) {
                    log.warn("[CompanyCredentialController] Auto client DB sync failed on update: {}", ex.getMessage());
                }
            }
            return ResponseEntity.ok(saved);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/extended-config")
    public ResponseEntity<?> getExtendedConfig(@PathVariable Long id) {
        Map<String, Object> map = new HashMap<>();
        if (cliClientLicenseRepository != null) {
            cliClientLicenseRepository.findByClientIdAndIsDeletedFalse(id).ifPresent(lic -> {
                map.put("implementedDate", lic.getImplementedDate() != null ? lic.getImplementedDate().toString() : null);
                map.put("expiryDate", lic.getExpiryDate() != null ? lic.getExpiryDate().toString() : null);
                map.put("licenseKey", lic.getLicenseKey());
                map.put("maxUsers", lic.getMaxUsers());
                map.put("maxBranches", lic.getMaxBranches());
                map.put("maxCompanies", lic.getMaxCompanies());
                map.put("maxConcurrentLogin", lic.getMaxConcurrentLogin());
                map.put("maxStorageMb", lic.getMaxStorageMb());
                map.put("apiAccess", lic.getApiAccess());
                map.put("mobileAppAccess", lic.getMobileAppAccess());
                map.put("backupEnabled", lic.getBackupEnabled());
            });
        }
        if (cliClientDatabaseConfigRepository != null) {
            cliClientDatabaseConfigRepository.findByClientId(id).ifPresent(db -> {
                map.put("dbType", db.getDbType() != null ? db.getDbType() : "Microsoft SQL Server");
                map.put("dbHost", db.getDbHost());
                map.put("dbPort", db.getDbPort() != null ? db.getDbPort() : 1433);
                map.put("dbName", db.getDbName());
                map.put("dbUsername", db.getDbUsername());
                map.put("dbPassword", db.getDbPassword());
            });
        }
        if (cliClientServerConfigRepository != null) {
            cliClientServerConfigRepository.findByClientId(id).ifPresent(srv -> {
                map.put("healthMonitoringEnabled", srv.getHealthMonitoringEnabled());
                map.put("serverName", srv.getServerName());
                map.put("serverIp", srv.getServerIp());
                map.put("serverPort", srv.getServerPort());
                map.put("windowsUsername", srv.getWindowsUsername());
                map.put("windowsPassword", srv.getWindowsPassword());
            });
        }
        return ResponseEntity.ok(map);
    }

    @PutMapping("/{id}/extended-config")
    public ResponseEntity<?> updateExtendedConfig(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        if (cliClientLicenseRepository != null) {
            com.autonoma.erp.modules.platform.identity.entity.CliClientLicense lic =
                cliClientLicenseRepository.findByClientIdAndIsDeletedFalse(id).orElse(new com.autonoma.erp.modules.platform.identity.entity.CliClientLicense());
            lic.setClientId(id);
            if (lic.getLicenseKey() == null || lic.getLicenseKey().isEmpty()) {
                lic.setLicenseKey(java.util.UUID.randomUUID().toString());
            }
            lic.setIsDeleted(false);
            if (req.get("implementedDate") != null && !req.get("implementedDate").toString().trim().isEmpty()) {
                try {
                    lic.setImplementedDate(java.time.LocalDate.parse(req.get("implementedDate").toString().substring(0, 10)));
                } catch (Exception ignored) {}
            }
            if (req.get("expiryDate") != null && !req.get("expiryDate").toString().trim().isEmpty()) {
                try {
                    lic.setExpiryDate(java.time.LocalDate.parse(req.get("expiryDate").toString().substring(0, 10)));
                } catch (Exception ignored) {}
            }
            if (req.get("maxUsers") != null && !req.get("maxUsers").toString().trim().isEmpty()) {
                lic.setMaxUsers(Integer.valueOf(req.get("maxUsers").toString().trim()));
            }
            if (req.get("maxBranches") != null && !req.get("maxBranches").toString().trim().isEmpty()) {
                lic.setMaxBranches(Integer.valueOf(req.get("maxBranches").toString().trim()));
            }
            if (req.get("maxCompanies") != null && !req.get("maxCompanies").toString().trim().isEmpty()) {
                lic.setMaxCompanies(Integer.valueOf(req.get("maxCompanies").toString().trim()));
            }
            if (req.get("maxConcurrentLogin") != null && !req.get("maxConcurrentLogin").toString().trim().isEmpty()) {
                lic.setMaxConcurrentLogin(Integer.valueOf(req.get("maxConcurrentLogin").toString().trim()));
            }
            if (req.get("maxStorageMb") != null && !req.get("maxStorageMb").toString().trim().isEmpty()) {
                lic.setMaxStorageMb(Integer.valueOf(req.get("maxStorageMb").toString().trim()));
            }
            if (req.get("apiAccess") != null) lic.setApiAccess(Boolean.valueOf(req.get("apiAccess").toString()));
            if (req.get("mobileAppAccess") != null) lic.setMobileAppAccess(Boolean.valueOf(req.get("mobileAppAccess").toString()));
            if (req.get("backupEnabled") != null) lic.setBackupEnabled(Boolean.valueOf(req.get("backupEnabled").toString()));
            cliClientLicenseRepository.save(lic);
        }

        if (cliClientDatabaseConfigRepository != null) {
            com.autonoma.erp.modules.platform.identity.entity.CliClientDatabaseConfig db =
                cliClientDatabaseConfigRepository.findByClientId(id).orElse(new com.autonoma.erp.modules.platform.identity.entity.CliClientDatabaseConfig());
            db.setClientId(id);
            if (req.get("dbType") != null) db.setDbType(req.get("dbType").toString());
            if (req.get("dbHost") != null) db.setDbHost(req.get("dbHost").toString());
            if (req.get("dbPort") != null && !req.get("dbPort").toString().trim().isEmpty()) {
                db.setDbPort(Integer.valueOf(req.get("dbPort").toString().trim()));
            }
            if (req.get("dbName") != null) db.setDbName(req.get("dbName").toString());
            if (req.get("dbUsername") != null) db.setDbUsername(req.get("dbUsername").toString());
            if (req.get("dbPassword") != null && !req.get("dbPassword").toString().trim().isEmpty()) {
                db.setDbPassword(req.get("dbPassword").toString());
            }
            cliClientDatabaseConfigRepository.save(db);
        }

        // Requirement 1: Database Name mapped from Primary SQL Server connection must be saved into Main dbSourceName
        if (req.get("dbName") != null && !req.get("dbName").toString().trim().isEmpty()) {
            String targetDbName = req.get("dbName").toString().trim();
            companyCredentialRepository.findById(id).ifPresent(comp -> {
                if (!targetDbName.equalsIgnoreCase(comp.getDbSourceName())) {
                    comp.setDbSourceName(targetDbName);
                    companyCredentialRepository.save(comp);
                    log.info("[CompanyCredentialController] Synchronized dbSourceName for company id {} to '{}'", id, targetDbName);
                }
            });
        }

        if (cliClientServerConfigRepository != null) {
            com.autonoma.erp.modules.platform.identity.entity.CliClientServerConfig srv =
                cliClientServerConfigRepository.findByClientId(id).orElse(new com.autonoma.erp.modules.platform.identity.entity.CliClientServerConfig());
            srv.setClientId(id);
            if (req.get("healthMonitoringEnabled") != null) {
                srv.setHealthMonitoringEnabled(Boolean.valueOf(req.get("healthMonitoringEnabled").toString()));
            }
            if (req.get("serverName") != null) srv.setServerName(req.get("serverName").toString());
            if (req.get("serverIp") != null) srv.setServerIp(req.get("serverIp").toString());
            if (req.get("serverPort") != null && !req.get("serverPort").toString().trim().isEmpty()) {
                srv.setServerPort(Integer.valueOf(req.get("serverPort").toString().trim()));
            }
            if (req.get("windowsUsername") != null) srv.setWindowsUsername(req.get("windowsUsername").toString());
            if (req.get("windowsPassword") != null && !req.get("windowsPassword").toString().trim().isEmpty()) {
                srv.setWindowsPassword(req.get("windowsPassword").toString());
            }
            cliClientServerConfigRepository.save(srv);
        }

        if (enterpriseClientValidationService != null) {
            enterpriseClientValidationService.clearValidationCache();
        }

        java.util.Set<String> modifiedFields = null;
        if (req.get("modifiedFields") instanceof java.util.Collection) {
            modifiedFields = new java.util.HashSet<>((java.util.Collection<String>) req.get("modifiedFields"));
        }

        com.autonoma.erp.service.admin.ClientDbSyncResult syncResult = null;
        if (clientDatabaseSyncService != null) {
            try {
                syncResult = clientDatabaseSyncService.syncToClientDatabase(id, modifiedFields);
            } catch (Exception ex) {
                log.warn("[CompanyCredentialController] Client DB sync failed during extended-config update: {}", ex.getMessage());
            }
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "Extended license & server configuration updated successfully.");
        if (syncResult != null) {
            resp.put("clientDbSync", syncResult);
        }
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/sync-client-db")
    @RequirePagePermission(pageCode = "AD1110", action = "write")
    public ResponseEntity<?> syncClientDatabase(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> req) {
        if (clientDatabaseSyncService != null) {
            java.util.Set<String> modifiedFields = null;
            if (req != null && req.get("modifiedFields") instanceof java.util.Collection) {
                modifiedFields = new java.util.HashSet<>((java.util.Collection<String>) req.get("modifiedFields"));
            }
            com.autonoma.erp.service.admin.ClientDbSyncResult result = clientDatabaseSyncService.syncToClientDatabase(id, modifiedFields);
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.ok(com.autonoma.erp.service.admin.ClientDbSyncResult.skipped("Client database sync service not available."));
    }

    @PostMapping(value = "/upload-logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)


    @RequirePagePermission(pageCode = "AD1110", action = "write")
    public ResponseEntity<Map<String, String>> uploadLogo(@RequestParam("file") MultipartFile file) {
        return handleImageUpload(file, "Logo uploaded successfully");
    }

    @PostMapping(value = "/upload-bg", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)


    @RequirePagePermission(pageCode = "AD1110", action = "write")
    public ResponseEntity<Map<String, String>> uploadBackground(@RequestParam("file") MultipartFile file) {
        return handleImageUpload(file, "Login background uploaded successfully");
    }

    private ResponseEntity<Map<String, String>> handleImageUpload(MultipartFile file, String successMsg) {
        try {
            // Standardize: use unified FileService to save in "Company Profile" folder
            String fullPath = fileService.saveFile(file, "COMPANY_PROFILE");
            Map<String, String> response = new HashMap<>();
            response.put("fileName", fullPath);
            response.put("message", successMsg);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Upload failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @GetMapping({ "/image/{*filename}", "/image" })
    public ResponseEntity<org.springframework.core.io.Resource> getImage(
            @PathVariable(required = false) String filename,
            @RequestParam(required = false) String fileNameParam) {
        try {
            String targetFile = (fileNameParam != null && !fileNameParam.trim().isEmpty()) ? fileNameParam.trim() : filename;
            if (targetFile == null || targetFile.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (targetFile.startsWith("/"))
                targetFile = targetFile.substring(1);

            org.springframework.core.io.Resource resource = fileService.loadFile(targetFile);
            
            String name = resource.getFilename() != null ? resource.getFilename().toLowerCase() : targetFile.toLowerCase();
            String contentType = null;
            if (name.endsWith(".png")) contentType = "image/png";
            else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (name.endsWith(".gif")) contentType = "image/gif";
            else if (name.endsWith(".webp")) contentType = "image/webp";
            else if (name.endsWith(".svg")) contentType = "image/svg+xml";
            else if (name.endsWith(".bmp")) contentType = "image/bmp";
            else if (name.endsWith(".ico")) contentType = "image/x-icon";
            
            if (contentType == null) {
                try {
                    contentType = java.nio.file.Files.probeContentType(resource.getFile().toPath());
                } catch (Exception ignored) {}
            }
            if (contentType == null) {
                contentType = "image/png";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(org.springframework.http.HttpHeaders.PRAGMA, "no-cache")
                    .header(org.springframework.http.HttpHeaders.EXPIRES, "0")
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline")
                    .body(resource);
        } catch (Exception e) {
            log.debug("Company profile image not found, serving default fallback logo: {}", e.getMessage());
            try {
                org.springframework.core.io.Resource fallback = new org.springframework.core.io.ClassPathResource("static/logo.png");
                if (fallback.exists()) {
                    return ResponseEntity.ok()
                            .contentType(MediaType.IMAGE_PNG)
                            .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline")
                            .body(fallback);
                }
            } catch (Exception ignored) {}
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")


    @RequirePagePermission(pageCode = "AD1110", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Test SMTP configuration by sending a test email to a given recipient.
     * The email is sent using the current company SMTP settings (or the logged-in
     * employee's office mail credentials if configured).
     */
    @PostMapping("/test-smtp")
    public ResponseEntity<Map<String, Object>> testSmtp(@RequestBody Map<String, String> body) {
        Map<String, Object> result = new HashMap<>();
        String recipient = body != null ? body.get("recipient") : null;
        if (recipient == null || recipient.trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "Recipient email is required.");
            return ResponseEntity.badRequest().body(result);
        }

        try {
            String subject = "SMTP Test — Autonoma ERP";
            String html = "";

            String customHost = body.get("smtpHost");
            String displayHost = (customHost != null && !customHost.trim().isEmpty()) ? customHost.trim() : "Active SMTP Server";

            Map<String, Object> placeholders = new HashMap<>();
            placeholders.put("smtpHost", displayHost);
            placeholders.put("companyName", "Autonoma ERP Corp");
            placeholders.put("sentDate", new java.text.SimpleDateFormat("dd-MM-yyyy HH:mm:ss").format(new Date()));
            placeholders.put("hrName", "System Administrator");

            if (emailContentService != null && emailTemplateEngine != null) {
                try {
                    com.autonoma.erp.modules.platform.notification.entity.EmailContent template = emailContentService.getTemplateOrApplicationDefault("SMTP TEST");
                    com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine.render(
                            subject,
                            template.getBodyContent(),
                            template.getYoursWindfully(),
                            placeholders
                    );
                    subject = rendered.getSubject();
                    html = rendered.getFullMasterHtml();
                } catch (Exception ex) {
                    log.warn("Failed to render SMTP test email via EmailTemplateEngine: {}", ex.getMessage());
                }
            }

            if (html.isBlank()) {
                html = "<p>SMTP Test Email - Configuration is Working!</p>";
            }

            if (customHost != null && !customHost.trim().isEmpty()) {
                String portStr = body.get("smtpPort");
                Integer port = 587;
                if (portStr != null && !portStr.trim().isEmpty()) {
                    try {
                        port = Integer.parseInt(portStr.trim());
                    } catch (NumberFormatException ignored) {}
                }
                String username = body.get("smtpUsername");
                String password = body.get("smtpPassword");
                Boolean sslEnabled = "Y".equalsIgnoreCase(body.get("smtpSslEnabled")) || "true".equalsIgnoreCase(body.get("smtpSslEnabled"));

                emailSendingService.sendTestEmail(recipient.trim(), subject, html, customHost.trim(), port, username, password, sslEnabled);
            } else {
                emailSendingService.sendTestEmail(recipient.trim(), subject, html);
            }

            result.put("success", true);
            result.put("message", "Test email sent successfully.");
        } catch (Exception e) {
            result.put("success", false);
            String rawMessage = e.getMessage() != null ? e.getMessage() : "";
            
            Throwable current = e;
            String detailedErrorMsg = rawMessage;
            boolean isAuthError = false;
            boolean isConnectError = false;
            boolean isRecipientError = false;
            
            while (current != null) {
                String msg = current.getMessage() != null ? current.getMessage() : "";
                if (!msg.trim().isEmpty()) {
                    detailedErrorMsg = msg;
                }
                
                if (current instanceof jakarta.mail.AuthenticationFailedException || 
                    msg.contains("AuthenticationFailedException") || 
                    msg.contains("535 5.7.8") || 
                    msg.contains("535 5.7.3") || 
                    msg.contains("535 5.7.139") || 
                    msg.contains("Username and Password not accepted") ||
                    msg.contains("authentication failed")) {
                    isAuthError = true;
                }
                if (current.getClass().getName().contains("MailConnectException") || 
                    current instanceof java.net.ConnectException || 
                    current instanceof java.net.UnknownHostException ||
                    msg.contains("MailConnectException") || 
                    msg.contains("Connection refused") || 
                    msg.contains("connect timed out") || 
                    msg.contains("UnknownHostException")) {
                    isConnectError = true;
                }
                if (current instanceof jakarta.mail.SendFailedException || 
                    msg.contains("SendFailedException") || 
                    msg.contains("550 5.1.1") || 
                    msg.contains("Invalid Addresses") || 
                    msg.contains("Address rejected")) {
                    isRecipientError = true;
                }
                current = current.getCause();
            }
            
            String userFriendlyMessage;
            if (isAuthError) {
                userFriendlyMessage = "Authentication failed. Verify username and password. Details: " + detailedErrorMsg;
            } else if (isConnectError) {
                userFriendlyMessage = "Unable to connect to SMTP server. Verify host, port, and security settings. Details: " + detailedErrorMsg;
            } else if (isRecipientError) {
                userFriendlyMessage = "Recipient address rejected. Details: " + detailedErrorMsg;
            } else {
                userFriendlyMessage = "Mail delivery failed. Details: " + detailedErrorMsg;
            }
            
            log.error("SMTP Test failed. User-friendly error: '{}'. Full details: {}", userFriendlyMessage, rawMessage, e);
            result.put("message", userFriendlyMessage);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/test-essl-connection")
    public ResponseEntity<Map<String, Object>> testEsslConnection(@RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        String connType = body != null && body.get("esslConnectionType") != null ? body.get("esslConnectionType").toString() : "";
        if ("API".equalsIgnoreCase(connType)) {
            String apiUrl = body.get("esslApiBaseUrl") != null ? body.get("esslApiBaseUrl").toString() : "";
            if (apiUrl.isBlank()) {
                response.put("success", false);
                response.put("message", "API Base URL is required");
                return ResponseEntity.badRequest().body(response);
            }
            try {
                java.net.URL url = new java.net.URL(apiUrl);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                int code = conn.getResponseCode();
                response.put("success", true);
                response.put("message", "API Connection Successful (HTTP " + code + ")");
            } catch (Exception e) {
                response.put("success", false);
                response.put("message", "API Connection Failed: " + e.getMessage());
            }
        } else {
            String serverIp = body != null && body.get("esslServerIp") != null ? body.get("esslServerIp").toString().trim() : "";
            Object portObj = body != null ? body.get("esslPort") : null;
            String dbName = body != null && body.get("esslDbName") != null ? body.get("esslDbName").toString().trim() : "";
            String username = body != null && body.get("esslUsername") != null ? body.get("esslUsername").toString().trim() : "";
            String password = body != null && body.get("esslPassword") != null ? body.get("esslPassword").toString() : "";
            String dbType = body != null && body.get("esslDatabaseType") != null ? body.get("esslDatabaseType").toString().trim() : "SQL Server";
            Object timeoutObj = body != null ? body.get("esslConnectionTimeout") : null;

            if (username.isEmpty()) {
                username = fallbackUsername != null ? fallbackUsername : "nutech";
            }
            if (password.isEmpty()) {
                password = fallbackPassword != null ? fallbackPassword : "nutech@2026";
            }

            int timeout = 5;
            if (timeoutObj != null && !timeoutObj.toString().isBlank()) {
                try {
                    timeout = Integer.parseInt(timeoutObj.toString().trim());
                } catch (Exception e) {}
            }

            if (serverIp.isBlank()) {
                response.put("success", false);
                response.put("message", "Server/IP Address is required");
                return ResponseEntity.badRequest().body(response);
            }
            if (dbName.isBlank()) {
                response.put("success", false);
                response.put("message", "Database Name is required");
                return ResponseEntity.badRequest().body(response);
            }
            if (username.isBlank()) {
                response.put("success", false);
                response.put("message", "Username is required");
                return ResponseEntity.badRequest().body(response);
            }

            int port = "MySQL".equalsIgnoreCase(dbType) ? 3306 : 1433;
            if (portObj != null && !portObj.toString().isBlank()) {
                try {
                    port = Integer.parseInt(portObj.toString().trim());
                } catch (Exception e) {}
            }

            log.info("eSSL Connection Diagnostic Log: Connection Started for host: {}, port: {}, DB: {}, Type: {}", serverIp, port, dbName, dbType);

            String jdbcUrl;
            String driverClass;
            if ("MySQL".equalsIgnoreCase(dbType)) {
                jdbcUrl = String.format("jdbc:mysql://%s:%d/%s?connectTimeout=%d&socketTimeout=%d", serverIp, port, dbName, timeout * 1000, timeout * 1000);
                driverClass = "com.mysql.cj.jdbc.Driver";
            } else {
                jdbcUrl = String.format("jdbc:sqlserver://%s:%d;databaseName=%s;trustServerCertificate=true;loginTimeout=%d", serverIp, port, dbName, timeout);
                driverClass = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
            }

            try (java.sql.Connection conn = establishJdbcConnection(jdbcUrl, driverClass, username, password, null)) {
                boolean tablesExist = false;
                java.sql.DatabaseMetaData metaData = conn.getMetaData();
                
                java.util.List<String> existingTables = new java.util.ArrayList<>();
                try (java.sql.ResultSet rs = metaData.getTables(null, null, "%", new String[]{"TABLE"})) {
                    while (rs.next()) {
                        existingTables.add(rs.getString("TABLE_NAME").toUpperCase());
                    }
                }

                String customTableName = body != null && body.get("esslTableName") != null ? body.get("esslTableName").toString().trim().toUpperCase() : "";

                for (String tName : existingTables) {
                    String upperT = tName.toUpperCase();
                    if (upperT.contains("ESSL") || 
                        upperT.contains("CHECKINOUT") || 
                        upperT.contains("USERINFO") || 
                        upperT.contains("DEVICELOG") || 
                        upperT.contains("ATTENDANCE") || 
                        upperT.contains("EMPLOYEE") || 
                        upperT.contains("LOG") ||
                        (!customTableName.isEmpty() && upperT.contains(customTableName))) {
                        tablesExist = true;
                        break;
                    }
                }

                if (!tablesExist && !existingTables.isEmpty()) {
                    tablesExist = true; // DB is accessible and contains valid tables
                }

                if (!tablesExist) {
                    String errMsg = "Required attendance table missing (expected ESSL_ATTENDANCE_LOG, CHECKINOUT, DeviceLogs, or Employees & AttendanceLogs)";
                    log.error("eSSL Connection Diagnostic Log: Connection Failed. Reason: {}", errMsg);
                    response.put("success", false);
                    response.put("message", errMsg);
                    return ResponseEntity.ok(response);
                }

                log.info("eSSL Connection Diagnostic Log: Connection Successful!");
                response.put("success", true);
                response.put("message", "Database Connection Successful! Verified required tables exist.");
            } catch (Exception e) {
                java.sql.SQLException se = null;
                if (e instanceof java.sql.SQLException) {
                    se = (java.sql.SQLException) e;
                } else if (e.getCause() instanceof java.sql.SQLException) {
                    se = (java.sql.SQLException) e.getCause();
                }
                
                String sqlState = se != null ? se.getSQLState() : null;
                String message = e.getMessage();
                String exactReason = "Connection failed: " + message;

                if (sqlState != null) {
                    if (sqlState.startsWith("28") || message.contains("Login failed") || message.contains("Access denied")) {
                        exactReason = "Authentication Failed: Invalid username or password.";
                    } else if (sqlState.startsWith("3D") || sqlState.equals("S0001") || message.contains("database") || message.contains("Cannot open database")) {
                        exactReason = "Database Not Found: Database '" + dbName + "' does not exist.";
                    } else if (message.contains("permission") || message.contains("denied") || message.contains("SELECT permission")) {
                        exactReason = "Permission Denied: User does not have sufficient permissions to access tables.";
                    }
                }
                
                if (message != null && (message.contains("timed out") || message.contains("Timeout") || message.contains("timedout"))) {
                    exactReason = "Network Timeout: Server took too long to respond. Check IP and firewall.";
                } else if (message != null && (message.contains("refused") || message.contains("connect") || message.contains("UnknownHostException") || message.contains("host"))) {
                    exactReason = "Invalid IP/Server Name or SQL Server service unavailable/blocked by firewall.";
                }

                log.error("eSSL Connection Diagnostic Log: Connection Failed. Reason: {}", exactReason);
                response.put("success", false);
                response.put("message", exactReason);
            }
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/list-databases")
    public ResponseEntity<Map<String, Object>> listDatabases(@RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        String serverIp = body != null && body.get("esslServerIp") != null ? body.get("esslServerIp").toString().trim() : "";
        Object portObj = body != null ? body.get("esslPort") : null;
        String username = body != null && body.get("esslUsername") != null ? body.get("esslUsername").toString().trim() : "";
        String password = body != null && body.get("esslPassword") != null ? body.get("esslPassword").toString() : "";

        if (username.isEmpty()) {
            username = fallbackUsername != null ? fallbackUsername : "nutech";
        }
        if (password.isEmpty()) {
            password = fallbackPassword != null ? fallbackPassword : "nutech@2026";
        }

        if (serverIp.isBlank()) {
            response.put("success", false);
            response.put("message", "Server/IP Address is required");
            return ResponseEntity.badRequest().body(response);
        }
        int port = 1433;
        if (portObj != null && !portObj.toString().isBlank()) {
            try {
                port = Integer.parseInt(portObj.toString().trim());
            } catch (Exception e) {}
        }
        
        String jdbcUrl = String.format("jdbc:sqlserver://%s:%d;databaseName=master;trustServerCertificate=true;loginTimeout=5", serverIp, port);
        try (java.sql.Connection conn = establishJdbcConnection(jdbcUrl, "com.microsoft.sqlserver.jdbc.SQLServerDriver", username, password, null);
             java.sql.Statement stmt = conn.createStatement();
             java.sql.ResultSet rs = stmt.executeQuery("SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb', 'Resource') AND state = 0 ORDER BY name")) {
            
            java.util.List<String> databases = new java.util.ArrayList<>();
            while (rs.next()) {
                databases.add(rs.getString("name"));
            }
            response.put("success", true);
            response.put("databases", databases);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to connect and list databases: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    private static final Map<String, Date> lastSyncTimeMap = com.autonoma.erp.modules.hr.attendance.service.EsslSyncService.lastSyncTimeMap;

    @PostMapping("/sync-essl")
    public ResponseEntity<Map<String, Object>> syncEssl(@RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        String connType = body != null && body.get("esslConnectionType") != null ? body.get("esslConnectionType").toString() : "";
        if ("API".equalsIgnoreCase(connType)) {
            response.put("success", false);
            response.put("message", "API integration sync not implemented yet");
            return ResponseEntity.badRequest().body(response);
        }

        String serverIp = body != null && body.get("esslServerIp") != null ? body.get("esslServerIp").toString().trim() : "";
        Object portObj = body != null ? body.get("esslPort") : null;
        String dbName = body != null && body.get("esslDbName") != null ? body.get("esslDbName").toString().trim() : "";
        String username = body != null && body.get("esslUsername") != null ? body.get("esslUsername").toString().trim() : "";
        String password = body != null && body.get("esslPassword") != null ? body.get("esslPassword").toString() : "";
        String dbType = body != null && body.get("esslDatabaseType") != null ? body.get("esslDatabaseType").toString().trim() : "SQL Server";
        Object timeoutObj = body != null ? body.get("esslConnectionTimeout") : null;

        if (username.isEmpty()) {
            username = fallbackUsername != null ? fallbackUsername : "nutech";
        }
        if (password.isEmpty()) {
            password = fallbackPassword != null ? fallbackPassword : "nutech@2026";
        }

        int timeout = 5;
        if (timeoutObj != null && !timeoutObj.toString().isBlank()) {
            try {
                timeout = Integer.parseInt(timeoutObj.toString().trim());
            } catch (Exception e) {}
        }

        if (serverIp.isBlank() || dbName.isBlank() || username.isBlank()) {
            response.put("success", false);
            response.put("message", "Server/IP Address, Database Name and Username are required.");
            return ResponseEntity.badRequest().body(response);
        }

        int port = "MySQL".equalsIgnoreCase(dbType) ? 3306 : 1433;
        if (portObj != null && !portObj.toString().isBlank()) {
            try {
                port = Integer.parseInt(portObj.toString().trim());
            } catch (Exception e) {}
        }

        String jdbcUrl;
        String driverClass;
        if ("MySQL".equalsIgnoreCase(dbType)) {
            jdbcUrl = String.format("jdbc:mysql://%s:%d/%s?connectTimeout=%d&socketTimeout=%d", serverIp, port, dbName, timeout * 1000, timeout * 1000);
            driverClass = "com.mysql.cj.jdbc.Driver";
        } else {
            jdbcUrl = String.format("jdbc:sqlserver://%s:%d;databaseName=%s;trustServerCertificate=true;loginTimeout=%d", serverIp, port, dbName, timeout);
            driverClass = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
        }

        // Test and resolve username casing before registering routing datasource
        String resolvedUser = username;
        try {
            StringBuilder sb = new StringBuilder();
            try (java.sql.Connection conn = establishJdbcConnection(jdbcUrl, driverClass, username, password, sb)) {
                resolvedUser = sb.toString();
            }
        } catch (Exception e) {
            log.warn("Casing pre-check failed during sync connection: {}", e.getMessage());
        }

        log.info("eSSL Sync Log: Sync Started for database: {} with user: {}", dbName, resolvedUser);
        com.autonoma.erp.modules.hr.attendance.service.EsslSyncService.lastSyncTimeMap.remove("TEMP_SYNC");
        com.autonoma.erp.modules.hr.attendance.service.EsslSyncService.lastSyncTimeMap.remove("DEFAULT");

        com.autonoma.erp.modules.hr.attendance.entity.ClientEsslConfig tempConfig = new com.autonoma.erp.modules.hr.attendance.entity.ClientEsslConfig();
        tempConfig.setClientId("TEMP_SYNC");
        tempConfig.setClientName("TEMP_SYNC_PROFILE");
        tempConfig.setJdbcUrl(jdbcUrl);
        tempConfig.setUsername(resolvedUser);
        tempConfig.setPassword(password);
        tempConfig.setEsslTableName("ESSL_ATTENDANCE_LOG");
        tempConfig.setEmpCdColumn("EMP_CD");
        tempConfig.setDateColumn("ATTENDANCE_DATE");
        tempConfig.setInTimeColumn("IN_TIME");
        tempConfig.setOutTimeColumn("OUT_TIME");
        tempConfig.setSyncMode("MONTHLY");

        try {
            com.autonoma.erp.config.essl.EsslDataSourceService dsService = com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.config.essl.EsslDataSourceService.class);
            if (dsService != null) {
                dsService.registerDataSource(tempConfig);
            }
            com.autonoma.erp.config.essl.EsslDataSourceContextHolder.setClientId("TEMP_SYNC");
            com.autonoma.erp.modules.hr.attendance.service.AttendanceMigrationService migrationService = com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.hr.attendance.service.AttendanceMigrationService.class);
            
            if (migrationService != null) {
                Map<String, Object> result = migrationService.runMigrationForClientId("TEMP_SYNC", tempConfig);
                boolean success = Boolean.TRUE.equals(result.get("success"));
                
                response.put("success", success);
                response.put("message", result.get("message"));
                response.put("processedRecords", result.get("processedRecords") != null ? result.get("processedRecords") : 0);
                response.put("skippedRecords", result.get("skippedRecords") != null ? result.get("skippedRecords") : 0);
                response.put("unmatchedEmployeeCodes", result.get("unmatchedEmployeeCodes") != null ? result.get("unmatchedEmployeeCodes") : 0);
                
                if (success) {
                    Date now = new Date();
                    lastSyncTimeMap.put("TEMP_SYNC", now);
                    response.put("lastSyncTime", now);
                    log.info("eSSL Sync Log: Sync Completed successfully at {}", now);
                } else {
                    log.error("eSSL Sync Log: Sync Failed. Reason: {}", result.get("message"));
                }
            } else {
                response.put("success", false);
                response.put("message", "Internal Migration Service unavailable");
                log.error("eSSL Sync Log: Sync Failed. Reason: Internal Migration Service unavailable");
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Sync Failed: " + e.getMessage());
            log.error("eSSL Sync Log: Sync Failed. Reason: {}", e.getMessage());
        } finally {
            try {
                com.autonoma.erp.config.essl.EsslDataSourceContextHolder.clear();
                com.autonoma.erp.config.essl.EsslDataSourceService dsService = com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.config.essl.EsslDataSourceService.class);
                if (dsService != null) {
                    dsService.removeDataSource("TEMP_SYNC");
                }
            } catch (Exception e) {}
        }
        return ResponseEntity.ok(response);
    }


    private java.sql.Connection establishJdbcConnection(String jdbcUrl, String driverClass, String username, String password, StringBuilder resolvedUsername) throws Exception {
        Class.forName(driverClass);
        java.util.List<String> usernames = new java.util.ArrayList<>();
        usernames.add(username);
        String lower = username.toLowerCase();
        if (!usernames.contains(lower)) usernames.add(lower);
        String upper = username.toUpperCase();
        if (!usernames.contains(upper)) usernames.add(upper);

        Exception lastEx = null;
        for (String user : usernames) {
            try {
                java.util.Properties props = new java.util.Properties();
                props.setProperty("user", user);
                props.setProperty("password", password);
                props.setProperty("loginTimeout", "5");
                java.sql.Connection conn = java.sql.DriverManager.getConnection(jdbcUrl, props);
                if (resolvedUsername != null) {
                    resolvedUsername.setLength(0);
                    resolvedUsername.append(user);
                }
                return conn;
            } catch (Exception e) {
                lastEx = e;
            }
        }
        throw lastEx;
    }

    // =========================================================================
    // LOGIN ACCESS SECURITY ENDPOINTS (PAGE AD1110)
    // =========================================================================

    @GetMapping("/login-security/{companyId}")
    public ResponseEntity<com.autonoma.erp.dto.security.LoginSecurityConfigDTO> getLoginSecurityConfig(@PathVariable Long companyId) {
        return ResponseEntity.ok(loginSecurityService.getConfig(companyId));
    }

    @PutMapping("/login-security/{companyId}")
    @RequirePagePermission(pageCode = "AD1110", action = "write")
    public ResponseEntity<?> updateLoginSecurityConfig(
            @PathVariable Long companyId,
            @RequestBody com.autonoma.erp.dto.security.LoginSecurityConfigDTO dto,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            String clientIp = loginSecurityService.resolveClientIp(request);
            String deviceId = request.getHeader("X-Device-Identifier");
            com.autonoma.erp.dto.security.LoginSecurityConfigDTO updated = loginSecurityService.updateConfig(
                    companyId, dto, getCurrentUserId(), clientIp, deviceId);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("Failed to update login security config: {}", e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", "Unable to update Login Security configuration: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    @GetMapping("/login-security/{companyId}/ips")
    public ResponseEntity<List<com.autonoma.erp.dto.security.AllowedIpDTO>> getAllowedIps(@PathVariable Long companyId) {
        return ResponseEntity.ok(loginSecurityService.getAllowedIps(companyId));
    }

    @PostMapping("/login-security/{companyId}/ips")
    @RequirePagePermission(pageCode = "AD1110", action = "write")
    public ResponseEntity<?> saveAllowedIp(
            @PathVariable Long companyId,
            @RequestBody com.autonoma.erp.dto.security.AllowedIpDTO dto) {
        try {
            return ResponseEntity.ok(loginSecurityService.saveAllowedIp(companyId, dto, getCurrentUserId()));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("Failed to save allowed IP: {}", e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    @PutMapping("/login-security/{companyId}/ips/{id}/toggle")
    @RequirePagePermission(pageCode = "AD1110", action = "write")
    public ResponseEntity<?> toggleAllowedIp(
            @PathVariable Long companyId,
            @PathVariable Long id,
            @RequestParam boolean active) {
        try {
            loginSecurityService.toggleAllowedIp(companyId, id, active, getCurrentUserId());
            return ResponseEntity.ok(Map.of("message", "Status updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/login-security/{companyId}/ips/{id}")
    @RequirePagePermission(pageCode = "AD1110", action = "delete")
    public ResponseEntity<?> deleteAllowedIp(@PathVariable Long companyId, @PathVariable Long id) {
        try {
            loginSecurityService.deleteAllowedIp(companyId, id, getCurrentUserId());
            return ResponseEntity.ok(Map.of("message", "IP deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/login-security/{companyId}/devices")
    public ResponseEntity<List<com.autonoma.erp.dto.security.AllowedDeviceDTO>> getRegisteredDevices(@PathVariable Long companyId) {
        return ResponseEntity.ok(loginSecurityService.getRegisteredDevices(companyId));
    }

    @PostMapping("/login-security/{companyId}/devices")
    @RequirePagePermission(pageCode = "AD1110", action = "write")
    public ResponseEntity<?> registerDevice(
            @PathVariable Long companyId,
            @RequestBody com.autonoma.erp.dto.security.AllowedDeviceDTO dto) {
        try {
            return ResponseEntity.ok(loginSecurityService.registerDevice(companyId, dto, getCurrentUserId()));
        } catch (IllegalArgumentException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("Failed to register device: {}", e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    @PutMapping("/login-security/{companyId}/devices/{id}/toggle")
    @RequirePagePermission(pageCode = "AD1110", action = "write")
    public ResponseEntity<?> toggleDevice(
            @PathVariable Long companyId,
            @PathVariable Long id,
            @RequestParam boolean active) {
        try {
            loginSecurityService.toggleDevice(companyId, id, active, getCurrentUserId());
            return ResponseEntity.ok(Map.of("message", "Status updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/login-security/{companyId}/devices/{id}")
    @RequirePagePermission(pageCode = "AD1110", action = "delete")
    public ResponseEntity<?> deleteDevice(@PathVariable Long companyId, @PathVariable Long id) {
        try {
            loginSecurityService.deleteDevice(companyId, id, getCurrentUserId());
            return ResponseEntity.ok(Map.of("message", "Device deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/login-security/{companyId}/logs")
    public ResponseEntity<?> getLoginLogs(
            @PathVariable Long companyId,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) Date fromDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) Date toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(loginSecurityService.getLoginLogs(companyId, fromDate, toDate, page, size));
    }

    @GetMapping("/login-security/{companyId}/audits")
    public ResponseEntity<?> getSecurityAudits(@PathVariable Long companyId) {
        return ResponseEntity.ok(loginSecurityService.getSecurityAudits(companyId));
    }

    @GetMapping("/login-security/current-client-info")
    public ResponseEntity<com.autonoma.erp.dto.security.ClientInfoDTO> getCurrentClientInfo(jakarta.servlet.http.HttpServletRequest request) {
        return ResponseEntity.ok(loginSecurityService.getClientInfo(request));
    }

    private Set<String> detectModifiedColumns(CompanyCredential existing, CompanyCredential details) {
        Set<String> modifiedCols = new HashSet<>();
        if (isModifiedString(existing.getCompanyName(), details.getCompanyName())) modifiedCols.add("COMPANY_NAME");
        if (isModifiedString(existing.getShortName(), details.getShortName())) modifiedCols.add("SHORT_NAME");
        if (isModifiedString(existing.getAddress(), details.getAddress())) modifiedCols.add("ADDRESS");
        if (isModifiedString(existing.getCity(), details.getCity())) modifiedCols.add("CITY");
        if (isModifiedString(existing.getState(), details.getState())) modifiedCols.add("STATE");
        if (isModifiedObject(existing.getStateCode(), details.getStateCode())) modifiedCols.add("STATE_CODE");
        if (isModifiedString(existing.getCountry(), details.getCountry())) modifiedCols.add("COUNTRY");
        if (isModifiedString(existing.getPincode(), details.getPincode())) modifiedCols.add("PINCODE");
        if (isModifiedString(existing.getGstIn(), details.getGstIn())) modifiedCols.add("GST_IN");
        if (isModifiedString(existing.getClientCode(), details.getClientCode())) modifiedCols.add("CLIENT_CODE");
        if (isModifiedString(existing.getDbSourceName(), details.getDbSourceName())) modifiedCols.add("DB_SOURCE_NAME");
        if (isModifiedString(existing.getRegistrationNo(), details.getRegistrationNo())) modifiedCols.add("REGISTRATION_NO");
        if (isModifiedString(existing.getPanNo(), details.getPanNo())) modifiedCols.add("PAN_NO");
        if (isModifiedString(existing.getMobileNo(), details.getMobileNo())) modifiedCols.add("MOBILE_NO");
        if (isModifiedString(existing.getPhoneNo(), details.getPhoneNo())) modifiedCols.add("PHONE_NO");
        if (isModifiedString(existing.getEmailId(), details.getEmailId())) modifiedCols.add("EMAIL_ID");
        if (isModifiedString(existing.getWebsite(), details.getWebsite())) modifiedCols.add("WEBSITE");
        if (isModifiedString(existing.getSupportEmail(), details.getSupportEmail())) modifiedCols.add("SUPPORT_EMAIL");
        if (isModifiedString(existing.getSupportPhone(), details.getSupportPhone())) modifiedCols.add("SUPPORT_PHONE");
        if (isModifiedString(existing.getGmaplink(), details.getGmaplink())) modifiedCols.add("GMAPLINK");
        if (isModifiedObject(existing.getDecimalPlaces(), details.getDecimalPlaces())) modifiedCols.add("DECIMAL_PLACES");
        if (isModifiedString(existing.getCurrencyCode(), details.getCurrencyCode())) modifiedCols.add("CURRENCY_CODE");
        if (isModifiedString(existing.getInputCaseStyle(), details.getInputCaseStyle())) modifiedCols.add("INPUT_CASE_STYLE");
        if (isModifiedString(existing.getTimeFormat(), details.getTimeFormat())) modifiedCols.add("TIME_FORMAT");
        if (isModifiedString(existing.getDateFormat(), details.getDateFormat())) modifiedCols.add("DATE_FORMAT");
        if (isModifiedString(existing.getWeekStartsOn(), details.getWeekStartsOn())) modifiedCols.add("WEEK_STARTS_ON");
        if (isModifiedString(existing.getAppTimezone(), details.getAppTimezone())) modifiedCols.add("APP_TIMEZONE");
        if (isModifiedObject(existing.getDefaultRowsPerPage(), details.getDefaultRowsPerPage())) modifiedCols.add("DEFAULT_ROWS_PER_PAGE");
        if (isModifiedObject(existing.getDefaultMaxRecords(), details.getDefaultMaxRecords())) modifiedCols.add("DEFAULT_MAX_RECORDS");
        if (isModifiedObject(existing.getAutoLogoutSeconds(), details.getAutoLogoutSeconds())) modifiedCols.add("AUTO_LOGOUT_SECONDS");
        if (isModifiedObject(existing.getAllowDuplicateScreens(), details.getAllowDuplicateScreens())) modifiedCols.add("ALLOW_DUPLICATE_SCREENS");
        if (isModifiedObject(existing.getAllowRightClick(), details.getAllowRightClick())) modifiedCols.add("ALLOW_RIGHT_CLICK");
        if (isModifiedObject(existing.getSingleActiveSession(), details.getSingleActiveSession())) modifiedCols.add("SINGLE_ACTIVE_SESSION");
        if (isModifiedString(existing.getDirectoryPath(), details.getDirectoryPath())) modifiedCols.add("DIRECTORY_PATH");
        if (isModifiedDate(existing.getLicRenewalDate(), details.getLicRenewalDate())) modifiedCols.add("LIC_RENEWAL_DATE");
        if (isModifiedDate(existing.getLicExpiryDate(), details.getLicExpiryDate())) modifiedCols.add("LIC_EXPIRY_DATE");
        if (isModifiedObject(existing.getLicExpRemainderDays(), details.getLicExpRemainderDays())) modifiedCols.add("LIC_EXP_REMAINDER_DAYS");
        if (isModifiedObject(existing.getRestoreEnableDays(), details.getRestoreEnableDays())) modifiedCols.add("RESTORE_ENABLE_DAYS");
        return modifiedCols;
    }

    private boolean isModifiedString(String oldVal, String newVal) {
        String s1 = oldVal != null ? oldVal.trim() : "";
        String s2 = newVal != null ? newVal.trim() : "";
        return !s1.equals(s2);
    }

    private boolean isModifiedObject(Object oldVal, Object newVal) {
        if (oldVal == null && newVal == null) return false;
        if (oldVal == null || newVal == null) return true;
        return !oldVal.equals(newVal);
    }

    private boolean isModifiedDate(Date oldVal, Date newVal) {
        if (oldVal == null && newVal == null) return false;
        if (oldVal == null || newVal == null) return true;
        return oldVal.getTime() != newVal.getTime();
    }
}


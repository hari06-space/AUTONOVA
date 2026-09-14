package com.autonoma.erp.modules.platform.datamigration.service;

import com.autonoma.erp.modules.master.finance.ledgergroup.entity.LedgerGroup;
import com.autonoma.erp.modules.master.finance.ledgergroup.repository.LedgerGroupRepository;
import com.autonoma.erp.modules.qms.checklist.service.MasterChecklistMigrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AccountsMigrationService {

    private static final Logger log = LoggerFactory.getLogger(AccountsMigrationService.class);

    @Autowired
    @Qualifier("secondaryJdbcTemplate")
    private JdbcTemplate secondaryJdbcTemplate;

    @Autowired
    private JdbcTemplate primaryJdbcTemplate;

    @Autowired
    private LedgerGroupRepository ledgerGroupRepository;

    @Transactional
    public String migrateLedgerGroups() {
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user.";
        }

        if (secondaryJdbcTemplate == null) {
            return "Legacy database connection not configured.";
        }

        int count = 0;
        int errorCount = 0;

        try {
            // Check if table exists
            Integer tableExists = secondaryJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.tables WHERE name = 'accountgroups'", Integer.class);

            if (tableExists == null || tableExists == 0) {
                return "Legacy table 'accountgroups' not found in database.";
            }

            // Fetch legacy data
            String query = "SELECT * FROM accountgroups";
            List<Map<String, Object>> rows = secondaryJdbcTemplate.queryForList(query);

            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start("ledgerGroup", rows.size());

            // Sort in memory by level so parents are migrated first
            rows.sort((r1, r2) -> {
                Number l1 = (Number) (r1.get("group_level") != null ? r1.get("group_level") : r1.get("group_level"));
                Number l2 = (Number) (r2.get("group_level") != null ? r2.get("group_level") : r2.get("group_level"));
                long level1 = l1 != null ? l1.longValue() : 0L;
                long level2 = l2 != null ? l2.longValue() : 0L;

                if (level1 != level2) {
                    return Long.compare(level1, level2);
                }

                Number id1 = (Number) r1.get("id");
                Number id2 = (Number) r2.get("id");
                long i1 = id1 != null ? id1.longValue() : 0L;
                long i2 = id2 != null ? id2.longValue() : 0L;

                return Long.compare(i1, i2);
            });

            // Clear existing data
            ledgerGroupRepository.deleteAllInBatch();

            // Map old ID to new ID
            Map<Long, Long> idMap = new HashMap<>();

            for (Map<String, Object> row : rows) {
                if (MasterChecklistMigrationService.stopFlag.get()) {
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("ledgerGroup", "Migration stopped by user. Migrated: " + count);
                    return "Migration stopped by user. Migrated: " + count;
                }

                try {
                    Long oldId = getLongValue(row.get("id"));
                    if (oldId == null)
                        continue;

                    LedgerGroup lg = new LedgerGroup();

                    lg.setGroupName((String) row.get("group_name"));
                    lg.setDescription((String) row.get("group_description"));

                    if (row.get("group_level") != null) {
                        lg.setLevel(getLongValue(row.get("group_level")));
                    } else if (row.get("group_leve") != null) {
                        lg.setLevel(getLongValue(row.get("group_leve")));
                    }

                    lg.setParentName((String) row.get("parent_name"));

                    Long oldParentId = getLongValue(row.get("parent_id"));
                    if (oldParentId != null && oldParentId > 0) {
                        Long newParentId = idMap.get(oldParentId);
                        if (newParentId != null) {
                            lg.setParentId(newParentId);
                        } else {
                            log.warn("Parent ID {} not found for Ledger Group {}", oldParentId, oldId);
                        }
                    }

                    Boolean isActive = true;
                    if (row.get("active") != null) {
                        Object activeObj = row.get("active");
                        if (activeObj instanceof Boolean) {
                            isActive = (Boolean) activeObj;
                        } else if (activeObj instanceof Number) {
                            isActive = ((Number) activeObj).intValue() == 1;
                        } else if (activeObj instanceof String) {
                            isActive = "1".equals(activeObj) || "true".equalsIgnoreCase((String) activeObj)
                                    || "Y".equalsIgnoreCase((String) activeObj);
                        }
                    }

                    String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                    if (currentUser == null) currentUser = "System";

                    primaryJdbcTemplate.execute("SET IDENTITY_INSERT FA_LEDGER_GROUP ON");
                    try {
                        String insertSql = "INSERT INTO FA_LEDGER_GROUP (ID, GROUP_NAME, DESCRIPTION, LEVEL, PARENT_ID, PARENT_NAME, IS_ACTIVE, CREATED_BY, CREATED_DATE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                        primaryJdbcTemplate.update(insertSql,
                                oldId,
                                lg.getGroupName(),
                                lg.getDescription(),
                                lg.getLevel(),
                                lg.getParentId(),
                                lg.getParentName(),
                                isActive,
                                currentUser,
                                new java.sql.Timestamp(System.currentTimeMillis()));
                    } finally {
                        primaryJdbcTemplate.execute("SET IDENTITY_INSERT FA_LEDGER_GROUP OFF");
                    }

                    idMap.put(oldId, oldId);
                    count++;
                    if (count % 10 == 0 || count == rows.size()) {
                        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update("ledgerGroup", count, errorCount);
                    }

                } catch (Exception e) {
                    log.error("Error migrating ledger group row: " + row, e);
                    errorCount++;
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update("ledgerGroup", count, errorCount);
                }
            }

            String msg = String.format("Ledger Groups migrated successfully. Total records migrated: %d. Errors: %d", count, errorCount);
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("ledgerGroup", count, errorCount, msg);
            return msg;
        } catch (Exception e) {
            log.error("Failed to migrate ledger groups", e);
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("ledgerGroup", e.getMessage());
            throw new RuntimeException("Migration failed: " + e.getMessage(), e);
        }
    }
    
    public String clearLedgerGroups() {
        try {
            long count = ledgerGroupRepository.count();
            ledgerGroupRepository.deleteAllInBatch();
            return "Cleared " + count + " Ledger Groups.";
        } catch (Exception e) {
            log.error("Failed to clear ledger groups", e);
            throw new RuntimeException("Failed to clear ledger groups: " + e.getMessage(), e);
        }
    }

    public String clearCustomerLedgers() {
        return clearAccountLedgersByScreenNo(161, "Customer Account Ledgers");
    }

    public String clearSupplierLedgers() {
        return clearAccountLedgersByScreenNo(162, "Supplier Account Ledgers");
    }

    public String clearFinanceLedgers() {
        return clearAccountLedgersByScreenNo(164, "Finance Account Ledgers");
    }

    public String clearTaxLedgers() {
        return clearAccountLedgersByScreenNo(163, "Tax Account Ledgers");
    }

    private String clearAccountLedgersByScreenNo(int screenNo, String label) {
        try {
            String condition;
            if (screenNo == 161) condition = "IS_CUSTOMER = 1";
            else if (screenNo == 162) condition = "IS_SUPPLIER = 1";
            else if (screenNo == 164) condition = "IS_FINANCE = 1 AND IS_CUSTOMER = 0 AND IS_SUPPLIER = 0";
            else if (screenNo == 163) condition = "IS_FINANCE = 1 AND IS_CUSTOMER = 0 AND IS_SUPPLIER = 0";
            else condition = "1 = 0";

            String query = "DELETE FROM FA_ACCOUNT_LEDGER WHERE " + condition;
            int rowsAffected = primaryJdbcTemplate.update(query);
            
            // If SET NOCOUNT ON causes -1, let's just say "Successfully cleared" instead of "-1"
            if (rowsAffected < 0) {
                return "Successfully cleared " + label + ".";
            }
            return "Cleared " + rowsAffected + " " + label + ".";
        } catch (Exception e) {
            log.error("Failed to clear " + label, e);
            throw new RuntimeException("Failed to clear " + label + ": " + e.getMessage(), e);
        }
    }

    @Transactional
    public String migrateAccountLedgers(int screenNo, String ledgerType, String title) {
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user.";
        }

        if (secondaryJdbcTemplate == null) {
            return "Legacy database connection not configured.";
        }

        int count = 0;
        int errorCount = 0;

        try {
            Integer tableExists = secondaryJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.tables WHERE name = 'accounts'", Integer.class);

            if (tableExists == null || tableExists == 0) {
                return "Legacy table 'accounts' not found in database.";
            }

            String query = "SELECT * FROM accounts WHERE screen_no = ?";
            List<Map<String, Object>> rows = secondaryJdbcTemplate.queryForList(query, screenNo);

            String stepId = "customerAccount";
            if (screenNo == 162) stepId = "supplierAccount";
            else if (screenNo == 163) stepId = "taxAccount";
            else if (screenNo == 164) stepId = "financeAccount";

            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start(stepId, rows.size());

            for (Map<String, Object> row : rows) {
                if (MasterChecklistMigrationService.stopFlag.get()) {
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail(stepId, "Migration stopped by user. Migrated: " + count);
                    return "Migration stopped by user. Migrated: " + count;
                }
                
                try {
                    Long oldId = getLongValue(row.get("id"));
                    if (oldId == null) continue;

                    String accountType = row.get("account_type") != null ? row.get("account_type").toString() : ledgerType;
                    
                    String accountName = row.get("account_name") != null ? row.get("account_name").toString() : null;
                    if (accountName == null && row.get("name") != null) accountName = row.get("name").toString();
                    if (accountName == null || accountName.trim().isEmpty()) accountName = "Account_" + oldId;

                    if ("TAX".equals(ledgerType)) {
                        String upperName = accountName.toUpperCase();
                        if (upperName.contains("GST")) {
                            accountType = "GST";
                        } else if (upperName.contains("TDS")) {
                            accountType = "TDS";
                        } else if (upperName.contains("TCS")) {
                            accountType = "TCS";
                        }
                    } else if ("FINANCE".equals(ledgerType)) {
                        String upperName = accountName.toUpperCase();
                        if (upperName.contains("PURCHASE")) {
                            accountType = "purchase";
                        } else if (upperName.contains("SERVICE")) {
                            accountType = "service";
                        } else {
                            accountType = "others";
                        }
                    }

                    accountType = truncate(accountType, 25);
                    
                    String taxType = row.get("tax_type") != null ? row.get("tax_type").toString() : null;
                    if (taxType == null && "TAX".equals(ledgerType)) {
                        String upperName = accountName.toUpperCase();
                        if (upperName.contains("CGST")) taxType = "CGST";
                        else if (upperName.contains("SGST")) taxType = "SGST";
                        else if (upperName.contains("IGST")) taxType = "IGST";
                        else if (upperName.contains("TDS")) taxType = "TDS";
                        else if (upperName.contains("TCS")) taxType = "TCS";
                    }
                    taxType = truncate(taxType, 50);

                    Double taxPercentage = null;
                    if (row.get("tax_percentage") != null && !row.get("tax_percentage").toString().trim().isEmpty()) {
                        try {
                            taxPercentage = Double.parseDouble(row.get("tax_percentage").toString());
                        } catch (NumberFormatException e) {
                        }
                    }
                    
                    String code = row.get("acc_code") != null ? row.get("acc_code").toString() : null;
                    if (code == null && row.get("account_code") != null) code = row.get("account_code").toString();
                    if (code == null && row.get("code") != null) code = row.get("code").toString();
                    if (code == null || code.trim().isEmpty()) {
                        code = "ACT_" + oldId;
                    }
                    code = truncate(code, 20);

                    accountName = truncate(accountName, 100);

                    String shortName = accountName;
                    if (shortName.length() > 14) {
                        shortName = shortName.substring(0, 14) + "_" + oldId;
                    }
                    if (shortName == null || shortName.trim().isEmpty()) shortName = "SN_" + oldId;
                    shortName = truncate(shortName, 20);

                    String printName = truncate(row.get("account_printname") != null ? row.get("account_printname").toString() : null, 150);
                    String description = truncate(row.get("description") != null ? row.get("description").toString() : null, 200);
                    String address = truncate(row.get("billing_street") != null ? row.get("billing_street").toString() : null, 300);
                    String city = truncate(row.get("billing_city") != null ? row.get("billing_city").toString() : null, 50);
                    String state = truncate(row.get("billing_state") != null ? row.get("billing_state").toString() : null, 50);
                    String country = truncate(row.get("billing_country") != null ? row.get("billing_country").toString() : null, 50);
                    String pinCode = truncate(row.get("billing_zip") != null ? row.get("billing_zip").toString() : null, 20);
                    Integer distance = null;
                    if (row.get("distance") != null && !row.get("distance").toString().trim().isEmpty()) {
                        Object dObj = row.get("distance");
                        if (dObj instanceof Number) {
                            distance = ((Number) dObj).intValue();
                        } else {
                            try {
                                distance = (int) Double.parseDouble(dObj.toString());
                            } catch (NumberFormatException e) {
                                distance = null;
                            }
                        }
                    }
                    String longitude = truncate(row.get("accounts_longitude") != null ? row.get("accounts_longitude").toString() : null, 25);
                    String latitude = truncate(row.get("accounts_latitude") != null ? row.get("accounts_latitude").toString() : null, 25);
                    String mobileNo = truncate(row.get("mobile_no") != null ? row.get("mobile_no").toString() : null, 15);
                    String mailId = truncate(row.get("email_id") != null ? row.get("email_id").toString() : null, 50);
                    String gstin = truncate(row.get("gstin") != null ? row.get("gstin").toString() : null, 20);
                    String panNo = truncate(row.get("pan_it_no") != null ? row.get("pan_it_no").toString() : null, 20);
                    String cinNo = truncate(row.get("cin_no") != null ? row.get("cin_no").toString() : null, 20);
                    String registerNo = truncate(row.get("ecc_code") != null ? row.get("ecc_code").toString() : null, 20);
                    String isoNumber = truncate(row.get("cst_no") != null ? row.get("cst_no").toString() : null, 20);
                    Boolean msmeReq = getBooleanValue(row.get("msme_req"));
                    String msmeNo = truncate(row.get("msme_no") != null ? row.get("msme_no").toString() : null, 20);
                    String industryType = truncate(row.get("industry_type") != null ? row.get("industry_type").toString() : null, 20);
                    String vendorCode = truncate(row.get("vendor_code") != null ? row.get("vendor_code").toString() : null, 20);

                    Long groupId = getLongValue(row.get("group_id"));
                    Boolean isCustomer = screenNo == 161;
                    Boolean isSupplier = screenNo == 162;
                    Boolean isServiceLedger = screenNo == 162;
                    Boolean isFinance = (screenNo != 161 && screenNo != 162);
                    
                    Long salesLedgerId = getLongValue(row.get("sales_ledger_id"));
                    Long purchaseLedgerId = getLongValue(row.get("purchase_ledger_id"));
                    Long serviceLedgerId = getLongValue(row.get("labour_purchase_ledger_id"));
                    Long labourSalesId = getLongValue(row.get("labour_sales_ledger_id"));
                    Boolean tcsApplicable = getBooleanValue(row.get("tcsmandatory"));

                    String bankAcNo = truncate(row.get("bank_ac_no") != null ? row.get("bank_ac_no").toString() : null, 50);
                    String bankAcName = truncate(row.get("bank_ac_name") != null ? row.get("bank_ac_name").toString() : null, 50);
                    String bankName = truncate(row.get("bank_name") != null ? row.get("bank_name").toString() : null, 50);
                    String branchName = truncate(row.get("branch_name") != null ? row.get("branch_name").toString() : null, 50);
                    String ifscCode = truncate(row.get("ifsc_code") != null ? row.get("ifsc_code").toString() : null, 50);
                    String officeNo = truncate(row.get("office_no") != null ? row.get("office_no").toString() : null, 50);
                    String faxNo = truncate(row.get("fax_no") != null ? row.get("fax_no").toString() : null, 50);
                    String paymentTerms = truncate(row.get("creditdays") != null ? row.get("creditdays").toString() : null, 50);

                    Boolean isActive = true;
                    if (row.get("active") != null) {
                        isActive = getBooleanValue(row.get("active"));
                    }

                    String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                    if (currentUser == null) currentUser = "System";

                    primaryJdbcTemplate.execute("SET IDENTITY_INSERT FA_ACCOUNT_LEDGER ON");
                    try {
                        String insertSql = "INSERT INTO FA_ACCOUNT_LEDGER (ID, CATEGORY, LEDGER_TYPE, CODE, LEDGER_NAME, SHORT_NAME, PRINT_NAME, DESCRIPTION, ADDRESS, CITY, STATE, COUNTRY, PIN_CODE, DISTANCE, LONGITUDE, LATITUDE, MOBILE_NO, MAIL_ID, GSTIN, PAN_NO, CIN_NO, REGISTER_NO, ISO_NUMBER, MSME_REQ, MSME_NO, INDUSTRY_TYPE, VENDOR_CODE, GROUP_ID, IS_CUSTOMER, IS_SUPPLIER, IS_SERVICE_LEDGER, IS_FINANCE, SALES_LEDGER_ID, PURCHASE_LEDGER_ID, SERVICE_LEDGER_ID, LABOUR_SALES_ID, TCS_APPLICABLE, BANK_AC_NO, BANK_AC_NAME, BANK_NAME, BRANCH_NAME, IFSC_CODE, OFFICE_NO, FAX_NO, PAYMENT_TERMS, TAX_TYPE, TAX_PERCENTAGE, IS_ACTIVE, CREATED_BY, CREATED_DATE) " +
                                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                        try {
                            primaryJdbcTemplate.update(insertSql,
                                    oldId, accountType, ledgerType, code, accountName, shortName, printName, description, address, city, state, country, pinCode, distance, longitude, latitude, mobileNo, mailId, gstin, panNo, cinNo, registerNo, isoNumber, msmeReq, msmeNo, industryType, vendorCode, groupId, isCustomer, isSupplier, isServiceLedger, isFinance, salesLedgerId, purchaseLedgerId, serviceLedgerId, labourSalesId, tcsApplicable, bankAcNo, bankAcName, bankName, branchName, ifscCode, officeNo, faxNo, paymentTerms, taxType, taxPercentage, isActive, currentUser, new java.sql.Timestamp(System.currentTimeMillis()));
                        } catch (org.springframework.dao.DataIntegrityViolationException dex) {
                            // If UNIQUE constraint fails or truncation happens, modify the unique fields and retry
                            code = truncate(code, 8) + "_" + oldId;
                            accountName = truncate(accountName, 85) + "_" + oldId;
                            shortName = truncate(shortName, 8) + "_" + oldId;
                            
                            primaryJdbcTemplate.update(insertSql,
                                    oldId, accountType, ledgerType, code, accountName, shortName, printName, description, address, city, state, country, pinCode, distance, longitude, latitude, mobileNo, mailId, gstin, panNo, cinNo, registerNo, isoNumber, msmeReq, msmeNo, industryType, vendorCode, groupId, isCustomer, isSupplier, isServiceLedger, isFinance, salesLedgerId, purchaseLedgerId, serviceLedgerId, labourSalesId, tcsApplicable, bankAcNo, bankAcName, bankName, branchName, ifscCode, officeNo, faxNo, paymentTerms, taxType, taxPercentage, isActive, currentUser, new java.sql.Timestamp(System.currentTimeMillis()));
                        }
                    } finally {
                        primaryJdbcTemplate.execute("SET IDENTITY_INSERT FA_ACCOUNT_LEDGER OFF");
                    }
                    count++;
                    if (count % 10 == 0 || count == rows.size()) {
                        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update(stepId, count, errorCount);
                    }
                } catch (Exception e) {
                    log.error("Error migrating " + title + " row: " + row, e);
                    errorCount++;
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update(stepId, count, errorCount);
                }
            }

            String msg = String.format("%s migrated successfully. Total records migrated: %d. Errors: %d", title, count, errorCount);
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete(stepId, count, errorCount, msg);
            return msg;
        } catch (Exception e) {
            log.error("Failed to migrate " + title, e);
            String stepId = "customerAccount";
            if (screenNo == 162) stepId = "supplierAccount";
            else if (screenNo == 163) stepId = "taxAccount";
            else if (screenNo == 164) stepId = "financeAccount";
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail(stepId, e.getMessage());
            throw new RuntimeException("Migration failed: " + e.getMessage(), e);
        }
    }

    public String migrateCustomerLedgers() {
        return migrateAccountLedgers(161, "CUSTOMER", "Customer Ledgers");
    }

    public String migrateSupplierLedgers() {
        return migrateAccountLedgers(162, "SUPPLIER", "Supplier Ledgers");
    }

    public String migrateTaxLedgers() {
        return migrateAccountLedgers(163, "TAX", "Tax Ledgers");
    }

    public String migrateFinanceLedgers() {
        return migrateAccountLedgers(164, "FINANCE", "Finance Ledgers");
    }

    @Transactional
    public String migrateTermsMaster() {
        if (MasterChecklistMigrationService.stopFlag.get()) {
            return "Migration stopped by user.";
        }

        if (secondaryJdbcTemplate == null) {
            return "Legacy database connection not configured.";
        }

        int count = 0;
        int errorCount = 0;

        try {
            Integer tableExists = secondaryJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM sys.tables WHERE name = 'termmasters'", Integer.class);

            if (tableExists == null || tableExists == 0) {
                return "Legacy table 'termmasters' not found in database.";
            }

            String query = "SELECT * FROM termmasters";
            List<Map<String, Object>> rows = secondaryJdbcTemplate.queryForList(query);

            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start("termsMaster", rows.size());

            String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            if (currentUser == null || currentUser.trim().isEmpty()) {
                currentUser = "Admin";
            }
            Long divisionId = com.autonoma.erp.util.SecurityUtils.getCurrentDivisionId();

            String insertSql = "INSERT INTO MST_TERMS_MASTER (CODE, TYPE, DESCRIPTION, STATUS, DIVISION, CREATED_BY, CREATED_DATE) " +
                    "VALUES (?, ?, ?, 1, ?, ?, ?)";

            // Track seen (TYPE + DESCRIPTION) pairs to ensure strictly distinct terms
            java.util.Set<String> seenKeys = new java.util.HashSet<>();

            // Load any existing keys in MST_TERMS_MASTER to avoid duplicate inserts
            try {
                List<Map<String, Object>> existingRecords = primaryJdbcTemplate.queryForList("SELECT TYPE, DESCRIPTION FROM MST_TERMS_MASTER");
                for (Map<String, Object> ex : existingRecords) {
                    String exType = ex.get("TYPE") != null ? ex.get("TYPE").toString().trim().toUpperCase() : "";
                    String exDesc = ex.get("DESCRIPTION") != null ? ex.get("DESCRIPTION").toString().trim().toUpperCase() : "";
                    if (!exDesc.isEmpty()) {
                        seenKeys.add(exType + "||" + exDesc);
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not query existing MST_TERMS_MASTER records: {}", ex.getMessage());
            }

            for (Map<String, Object> row : rows) {
                if (MasterChecklistMigrationService.stopFlag.get()) {
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("termsMaster", "Migration stopped by user. Migrated: " + count);
                    return "Migration stopped by user. Migrated: " + count;
                }

                try {
                    String termSno = row.get("term_sno") != null ? row.get("term_sno").toString().trim() : null;
                    String rawTermName = row.get("term_name") != null ? row.get("term_name").toString().trim() : "GENERAL";
                    if (rawTermName.equalsIgnoreCase("wewe")) {
                        continue;
                    }
                    String termName = normalizeTermType(rawTermName);
                    String termValue = row.get("term_value") != null ? row.get("term_value").toString() : "";

                    if (termValue.trim().isEmpty()) {
                        // Check if any other column has a description/value
                        String desc = "";
                        for (String key : row.keySet()) {
                            if (!key.equalsIgnoreCase("term_sno") && !key.equalsIgnoreCase("term_name") && !key.equalsIgnoreCase("id") && row.get(key) != null) {
                                String val = row.get(key).toString().trim();
                                if (!val.isEmpty()) {
                                    desc = val;
                                    break;
                                }
                            }
                        }
                        if (desc.isEmpty()) {
                            desc = "-";
                        }
                        termValue = desc;
                    }

                    // Split values by newline or #br#
                    String[] parts = termValue.split("(\r?\n|#br#|<br>|<br/>)");
                    for (String part : parts) {
                        String desc = part.trim();
                        if (!desc.isEmpty()) {
                            String uniqueKey = termName + "||" + desc.toUpperCase();
                            if (seenKeys.contains(uniqueKey)) {
                                continue; // Skip duplicate term
                            }
                            seenKeys.add(uniqueKey);

                            primaryJdbcTemplate.update(insertSql,
                                    termSno,
                                    termName,
                                    desc,
                                    divisionId,
                                    currentUser,
                                    new java.sql.Timestamp(System.currentTimeMillis()));
                            count++;
                            if (count % 10 == 0 || count == rows.size()) {
                                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update("termsMaster", count, errorCount);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Error migrating termmasters row: " + row, e);
                    errorCount++;
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update("termsMaster", count, errorCount);
                }
            }

            String msg = String.format("Terms Master migrated successfully. Total records migrated: %d. Errors: %d", count, errorCount);
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("termsMaster", count, errorCount, msg);
            return msg;
        } catch (Exception e) {
            log.error("Failed to migrate Terms Master", e);
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("termsMaster", e.getMessage());
            throw new RuntimeException("Migration failed: " + e.getMessage(), e);
        }
    }

    private String normalizeTermType(String rawType) {
        if (rawType == null || rawType.trim().isEmpty()) {
            return "GENERAL";
        }
        String clean = rawType.trim().toUpperCase();

        switch (clean) {
            case "APPLICABLE PREFERENTIAL AGREEMENT I.E.(PTA/FTA)":
            case "APPLICABLE PREFERENTIAL AGREEMENT (PTA/FTA)":
            case "APPLICABLE PREFERENTIAL AGREEMENT":
                return "APPLICABLE PREFERENTIAL AGREEMENT (PTA/FTA)";
            case "INCO-TERMS OF DELIVERY":
            case "INCOTERMS OF DELIVERY":
                return "INCOTERMS OF DELIVERY";
            case "INCO-TERMS OF DELIVERY ( PLACE OF DELIVERY )":
            case "INCOTERMS OF DELIVERY (PLACE OF DELIVERY)":
            case "INCOTERMS OF DELIVERY ( PLACE OF DELIVERY )":
            case "INCO-TERMS OF DELIVERY (PLACE OF DELIVERY)":
                return "INCOTERMS OF DELIVERY (PLACE OF DELIVERY)";
            case "LOADIND AND UNLOADING":
            case "LOADING AND UNLOADING":
                return "LOADING AND UNLOADING";
            case "MODE OF DEAPATCH":
            case "MODE OF DESPATCH":
            case "MODE OF DISPATCH":
                return "MODE OF DESPATCH";
            case "STANDARD QUANTITY CODE AND UNIT I.E.(SQC)":
            case "STANDARD QUANTITY CODE AND UNIT (SQC)":
            case "STANDARD QUANTITY CODE AND UNIT":
                return "STANDARD QUANTITY CODE AND UNIT (SQC)";
            default:
                return clean;
        }
    }

    public String clearTermsMaster() {
        try {
            int rowsAffected = primaryJdbcTemplate.update("DELETE FROM MST_TERMS_MASTER");
            try {
                primaryJdbcTemplate.execute("DBCC CHECKIDENT ('MST_TERMS_MASTER', RESEED, 0);");
            } catch (Exception ignored) {}
            return "Cleared " + (rowsAffected >= 0 ? rowsAffected : 0) + " Terms Master records.";
        } catch (Exception e) {
            log.error("Failed to clear Terms Master", e);
            throw new RuntimeException("Failed to clear Terms Master: " + e.getMessage(), e);
        }
    }

    private Long getLongValue(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).longValue();
        String str = obj.toString().trim();
        if (str.isEmpty()) return null;
        try {
            return (long) Double.parseDouble(str);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Boolean getBooleanValue(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Boolean) return (Boolean) obj;
        if (obj instanceof Number) return ((Number) obj).intValue() == 1;
        if (obj instanceof String) {
            String str = (String) obj;
            return "1".equals(str) || "true".equalsIgnoreCase(str) || "Y".equalsIgnoreCase(str);
        }
        return false;
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        if (value.length() > maxLength) {
            return value.substring(0, maxLength);
        }
        return value;
    }
}

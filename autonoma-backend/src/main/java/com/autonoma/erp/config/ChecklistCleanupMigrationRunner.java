package com.autonoma.erp.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(2)
@Slf4j
public class ChecklistCleanupMigrationRunner implements CommandLineRunner {

        private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChecklistCleanupMigrationRunner.class);

        @org.springframework.beans.factory.annotation.Autowired
        private JdbcTemplate jdbcTemplate;

        private static final String MIGRATION_KEY = "Java_Checklist_Cleanup_V440_V441";

        private Long getOrCreateStatusId(String name) {
                try {
                        java.util.List<Long> ids = jdbcTemplate.queryForList(
                                        "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = ?",
                                        Long.class,
                                        name.toUpperCase().trim());
                        if (!ids.isEmpty()) {
                                return ids.get(0);
                        }
                        jdbcTemplate.update("INSERT INTO AD_STATUS_MASTER (NAME) VALUES (?)", name.trim());
                        return jdbcTemplate.queryForObject(
                                        "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = ?",
                                        Long.class,
                                        name.toUpperCase().trim());
                } catch (Exception e) {
                        log.error("Failed to get/create status: " + name, e);
                        throw e;
                }
        }

        @Override
        public void run(String... args) throws Exception {
                System.out.println("[JavaMigration] Checking checklist cleanup migration state...");
                try {
                        // Check if already executed
                        Integer count = jdbcTemplate.queryForObject(
                                        "SELECT COUNT(*) FROM ERP_EXECUTED_SCRIPTS WHERE SCRIPT_NAME = ?",
                                        Integer.class,
                                        MIGRATION_KEY);

                        if (count != null && count > 0) {
                                System.out.println(
                                                "[JavaMigration] Checklist cleanup migration already executed. Skipping.");
                                return;
                        }

                        // Resolve status IDs dynamically
                        Long pendingId = getOrCreateStatusId("Pending");
                        Long missed = getOrCreateStatusId("Missed");

                        System.out.println("[JavaMigration] Executing checklist cleanup migration on database...");

                        // 1. Fix NULL STATUS_ID in QMS_CHECKLIST_ASSIGNMENT -> Pending
                        int fixedAssignmentNulls = jdbcTemplate.update(
                                        "UPDATE QMS_CHECKLIST_ASSIGNMENT " +
                                                        "SET STATUS_ID = ?, UPDATED_BY = 'SUPER BOSS', UPDATED_DATE = GETDATE() "
                                                        +
                                                        "WHERE STATUS_ID IS NULL",
                                        pendingId);
                        System.out.println("[JavaMigration] Fixed " + fixedAssignmentNulls
                                        + " NULL STATUS_ID rows in QMS_CHECKLIST_ASSIGNMENT.");

                        // 2. EOD for QMS_CHECKLIST_ASSIGNMENT (CarryForward = No -> Unresolved)
                        int assignmentUnresolved = jdbcTemplate.update(
                                        "UPDATE a " +
                                                        "SET a.STATUS_ID = ?, a.UPDATED_BY = 'SUPER BOSS', a.UPDATED_DATE = GETDATE() "
                                                        +
                                                        "FROM QMS_CHECKLIST_ASSIGNMENT a " +
                                                        "INNER JOIN AD_STATUS_MASTER s ON a.STATUS_ID = s.ID " +
                                                        "INNER JOIN QMS_CHECKLIST_MASTER m ON a.CHECKLIST_ID = m.ID " +
                                                        "WHERE s.NAME = 'Pending' " +
                                                        "  AND a.CHECKLIST_DATE IS NOT NULL " +
                                                        "  AND CONVERT(DATE, a.CHECKLIST_DATE) < CONVERT(DATE, GETDATE()) "
                                                        +
                                                        "  AND UPPER(ISNULL(m.CARRY_FORWARD, 'NO')) = 'NO'",
                                        missed);
                        System.out.println("[JavaMigration] Marked " + assignmentUnresolved
                                        + " old Pending (CarryForward=No) assignments as Unresolved.");

                        // 3. EOD for QMS_CHECKLIST_ASSIGNMENT (CarryForward = Yes -> keep Pending,
                        // increment count)
                        int assignmentCarriedForward = jdbcTemplate.update(
                                        "UPDATE a " +
                                                        "SET a.CARRY_FORWARD_COUNT = ISNULL(a.CARRY_FORWARD_COUNT, 0) + 1, "
                                                        +
                                                        "    a.UPDATED_BY = 'SUPER BOSS', a.UPDATED_DATE = GETDATE() " +
                                                        "FROM QMS_CHECKLIST_ASSIGNMENT a " +
                                                        "INNER JOIN AD_STATUS_MASTER s ON a.STATUS_ID = s.ID " +
                                                        "INNER JOIN QMS_CHECKLIST_MASTER m ON a.CHECKLIST_ID = m.ID " +
                                                        "WHERE s.NAME = 'Pending' " +
                                                        "  AND a.CHECKLIST_DATE IS NOT NULL " +
                                                        "  AND CONVERT(DATE, a.CHECKLIST_DATE) < CONVERT(DATE, GETDATE()) "
                                                        +
                                                        "  AND UPPER(ISNULL(m.CARRY_FORWARD, 'NO')) = 'YES'");
                        System.out.println("[JavaMigration] Carried forward " + assignmentCarriedForward
                                        + " Pending (CarryForward=Yes) assignments.");

                        // 4. Fix NULL STATUS_ID in QMS_CHECKLIST_CLOSED -> Unresolved
                        int fixedClosedNulls = jdbcTemplate.update(
                                        "UPDATE QMS_CHECKLIST_CLOSED " +
                                                        "SET STATUS_ID = ?, UPDATED_BY = 'SUPER BOSS', UPDATED_DATE = GETDATE() "
                                                        +
                                                        "WHERE STATUS_ID IS NULL",
                                        missed);
                        System.out.println("[JavaMigration] Fixed " + fixedClosedNulls
                                        + " NULL STATUS_ID rows in QMS_CHECKLIST_CLOSED.");

                        // 5. EOD for QMS_CHECKLIST_CLOSED (CarryForward = No -> Unresolved)
                        int closedUnresolved = jdbcTemplate.update(
                                        "UPDATE c " +
                                                        "SET c.STATUS_ID = ?, c.UPDATED_BY = 'SUPER BOSS', c.UPDATED_DATE = GETDATE() "
                                                        +
                                                        "FROM QMS_CHECKLIST_CLOSED c " +
                                                        "LEFT JOIN QMS_CHECKLIST_MASTER m ON c.CHECKLIST_ID = m.ID " +
                                                        "WHERE c.STATUS_ID = ? " +
                                                        "  AND c.CHECKLIST_DATE IS NOT NULL " +
                                                        "  AND CONVERT(DATE, c.CHECKLIST_DATE) < CONVERT(DATE, GETDATE()) "
                                                        +
                                                        "  AND UPPER(ISNULL(m.CARRY_FORWARD, 'NO')) = 'NO'",
                                        missed, pendingId);
                        System.out.println("[JavaMigration] Marked " + closedUnresolved
                                        + " old Pending (CarryForward=No) closed records as Unresolved.");

                        // 6. EOD for QMS_CHECKLIST_CLOSED (CarryForward = Yes -> keep Pending,
                        // increment count)
                        int closedCarriedForward = jdbcTemplate.update(
                                        "UPDATE c " +
                                                        "SET c.CARRY_FORWARD_COUNT = ISNULL(c.CARRY_FORWARD_COUNT, 0) + 1, "
                                                        +
                                                        "    c.UPDATED_BY = 'SUPER BOSS', c.UPDATED_DATE = GETDATE() " +
                                                        "FROM QMS_CHECKLIST_CLOSED c " +
                                                        "LEFT JOIN QMS_CHECKLIST_MASTER m ON c.CHECKLIST_ID = m.ID " +
                                                        "WHERE c.STATUS_ID = ? " +
                                                        "  AND c.CHECKLIST_DATE IS NOT NULL " +
                                                        "  AND CONVERT(DATE, c.CHECKLIST_DATE) < CONVERT(DATE, GETDATE()) "
                                                        +
                                                        "  AND UPPER(ISNULL(m.CARRY_FORWARD, 'NO')) = 'YES'",
                                        pendingId);
                        System.out.println("[JavaMigration] Carried forward " + closedCarriedForward
                                        + " Pending (CarryForward=Yes) closed records.");

                        // Mark migration as executed
                        jdbcTemplate.update(
                                        "INSERT INTO ERP_EXECUTED_SCRIPTS (SCRIPT_NAME, EXECUTED_AT) VALUES (?, GETDATE())",
                                        MIGRATION_KEY);

                        System.out.println("[JavaMigration] Checklist cleanup migration completed successfully.");

                } catch (Exception e) {
                        System.err.println("[JavaMigration] Checklist cleanup migration failed: " + e.getMessage());
                        e.printStackTrace();
                }

                // Self-healing check for QM1150 (Checklist Acknowledgement) registration
                try {
                        Integer pageCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM BOS_PAGES WHERE PAGE_CODE = 'QM1150'", Integer.class);
                        if (pageCount == null || pageCount == 0) {
                                System.out.println("[JavaMigration] Registering QM1150 (Checklist Acknowledgement) in BOS_PAGES...");
                                Integer qmsModId = jdbcTemplate.queryForObject(
                                                "SELECT TOP 1 MOD_ID FROM BOS_MODULES WHERE UPPER(TRIM(MOD_NAME)) LIKE '%QMS%' OR MOD_CODE = 'M110'", Integer.class);
                                Integer subModId = jdbcTemplate.queryForObject(
                                                "SELECT TOP 1 SUB_MOD_ID FROM BOS_SUB_MODULES WHERE UPPER(TRIM(SUB_MOD_NAME)) LIKE '%CHECKLIST%' OR SUB_MOD_CODE = 'SM111'", Integer.class);

                                if (qmsModId != null) {
                                        jdbcTemplate.update(
                                                        "INSERT INTO BOS_PAGES (mod_id, sub_mod_id, page_code, page_name, enabled, page_url, icon) VALUES (?, ?, 'QM1150', 'Checklist Acknowledgement', 1, '/qms/checklist/acknowledgement', 'IconUserCheck')",
                                                        qmsModId, subModId);

                                        Integer pageId = jdbcTemplate.queryForObject("SELECT page_id FROM BOS_PAGES WHERE PAGE_CODE = 'QM1150'", Integer.class);
                                        if (pageId != null) {
                                                jdbcTemplate.update(
                                                                "INSERT INTO BOS_USER_PAGE_AUTH (user_id, page_id, mod_id, sub_mod_id, enable, read_acs, write, delete_acs, export, approval, manager, additional1, additional2, add_task_enable, created_by, created_date) " +
                                                                "SELECT DISTINCT user_id, ?, 11, 111, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'SYSTEM', GETDATE() FROM AD_USER_CREDENTIAL " +
                                                                "WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM BOS_USER_PAGE_AUTH WHERE page_id = ? AND user_id = AD_USER_CREDENTIAL.user_id)",
                                                                pageId, pageId);
                                                System.out.println("[JavaMigration] QM1150 page access granted to all users in BOS_USER_PAGE_AUTH.");
                                        }
                                }
                        }
                } catch (Exception e) {
                        System.err.println("[JavaMigration] QM1150 registration check warning: " + e.getMessage());
                }

                // Self-healing check for HR_EMPLOYEE ATS statuses
                // ATS Valid Flow: PENDING -> SENT -> TO BE VERIFY -> VERIFIED -> REJECTED
                // Remap any legacy/invalid status text values to the nearest valid flow status.
                // NEVER create new status entries - only use what already exists in AD_STATUS_MASTER.
                try {
                        // Ensure required ATS flow statuses exist (only valid flow statuses)
                        ensureStatusExists("Pending");
                        ensureStatusExists("SENT");
                        ensureStatusExists("TO BE VERIFY");
                        ensureStatusExists("Verified");
                        ensureStatusExists("Rejected");

                        // Mapping: legacy text -> valid ATS flow status name
                        // SUBMITTED -> TO BE VERIFY (submitted = awaiting verification)
                        // DRAFT / IN_PROGRESS -> PENDING (not yet processed)
                        // APPROVED / CONFIRM -> VERIFIED
                        // CANCELLED / EXPIRED -> REJECTED
                        // TO BE VERIFIED -> TO BE VERIFY (canonical)
                        String remapSql =
                            "UPDATE e SET e.{col} = (" +
                            "  SELECT TOP 1 s2.ID FROM AD_STATUS_MASTER s2 WHERE s2.NAME = " +
                            "  CASE UPPER(TRIM(CAST(e.{col} AS VARCHAR(100)))) " +
                            "    WHEN 'SUBMITTED'    THEN 'TO BE VERIFY' " +
                            "    WHEN 'DRAFT'        THEN 'Pending' " +
                            "    WHEN 'IN_PROGRESS'  THEN 'Pending' " +
                            "    WHEN 'APPROVED'     THEN 'Verified' " +
                            "    WHEN 'CONFIRM'      THEN 'TO BE VERIFY' " +
                            "    WHEN 'TO BE VERIFIED' THEN 'TO BE VERIFY' " +
                            "    WHEN 'CANCELLED'    THEN 'Rejected' " +
                            "    WHEN 'EXPIRED'      THEN 'Rejected' " +
                            "    ELSE UPPER(TRIM(CAST(e.{col} AS VARCHAR(100)))) " +
                            "  END" +
                            ") " +
                            "FROM HR_EMPLOYEE e " +
                            "WHERE TRY_CAST(e.{col} AS BIGINT) IS NULL AND e.{col} IS NOT NULL";

                        String[] statusCols = new String[]{
                                "STATUS", "CALL_STATUS", "INTERVIEW_STATUS", "OFFER_STATUS",
                                "VERIFICATION_STATUS", "BACKGROUND_VERIFICATION_STATUS", "ATS_OVERALL_STATUS",
                                "PHOTO_VERIFIED_STATUS", "RESUME_VERIFIED_STATUS", "PAYSLIP_VERIFIED_STATUS",
                                "AADHAR_VERIFIED_STATUS"
                        };

                        for (String col : statusCols) {
                                try {
                                        jdbcTemplate.update(remapSql.replace("{col}", col));
                                } catch (Exception ex) {
                                        log.warn("[JavaMigration] Could not remap column {} in HR_EMPLOYEE: {}", col, ex.getMessage());
                                }
                        }

                        // Also remap rows that are numeric IDs pointing to invalid statuses
                        // (SUBMITTED=48, DRAFT=68, IN_PROGRESS=83, CANCELLED=5, APPROVED=36, CONFIRM=37, EXPIRED=72, TO BE VERIFIED=17)
                        // Map them to valid ATS flow IDs
                        String idRemapSql =
                            "UPDATE HR_EMPLOYEE SET {col} = CASE {col} " +
                            "  WHEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE UPPER(NAME)='SUBMITTED') THEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE NAME='TO BE VERIFY') " +
                            "  WHEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE UPPER(NAME)='DRAFT') THEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE NAME='Pending') " +
                            "  WHEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE UPPER(NAME)='IN_PROGRESS') THEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE NAME='Pending') " +
                            "  WHEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE UPPER(NAME)='APPROVED') THEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE NAME='Verified') " +
                            "  WHEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE UPPER(NAME)='CONFIRM') THEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE NAME='TO BE VERIFY') " +
                            "  WHEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE NAME='TO BE VERIFIED') THEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE NAME='TO BE VERIFY') " +
                            "  WHEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE UPPER(NAME)='CANCELLED') THEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE NAME='Rejected') " +
                            "  WHEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE UPPER(NAME)='EXPIRED') THEN (SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE NAME='Rejected') " +
                            "  ELSE {col} END " +
                            "WHERE {col} IS NOT NULL AND {col} NOT IN (" +
                            "  SELECT ID FROM AD_STATUS_MASTER WHERE NAME IN ('Pending','SENT','TO BE VERIFY','Verified','Rejected')" +
                            ")";

                        for (String col : statusCols) {
                                try {
                                        jdbcTemplate.update(idRemapSql.replace("{col}", col));
                                } catch (Exception ex) {
                                        log.warn("[JavaMigration] Could not ID-remap column {} in HR_EMPLOYEE: {}", col, ex.getMessage());
                                }
                        }

                        System.out.println("[JavaMigration] HR_EMPLOYEE ATS status columns normalized to valid flow statuses.");
                } catch (Exception e) {
                        System.err.println("[JavaMigration] ATS status normalization warning: " + e.getMessage());
                }
        }

        /**
         * Ensures a status with the given name exists in AD_STATUS_MASTER.
         * Only creates it if it doesn't already exist.
         * For ATS migration, only call this for valid ATS flow statuses:
         * Pending, SENT, TO BE VERIFY, Verified, Rejected.
         */
        private void ensureStatusExists(String name) {
                try {
                        java.util.List<Long> ids = jdbcTemplate.queryForList(
                                        "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = ?",
                                        Long.class,
                                        name.toUpperCase().trim());
                        if (ids.isEmpty()) {
                                jdbcTemplate.update("INSERT INTO AD_STATUS_MASTER (NAME) VALUES (?)", name.trim());
                                log.info("[JavaMigration] Created ATS flow status: {}", name);
                        }
                } catch (Exception e) {
                        log.warn("[JavaMigration] Failed to ensure status exists: {} - {}", name, e.getMessage());
                }
        }
}

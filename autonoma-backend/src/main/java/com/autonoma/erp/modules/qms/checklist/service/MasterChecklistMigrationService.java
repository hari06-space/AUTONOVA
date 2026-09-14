package com.autonoma.erp.modules.qms.checklist.service;

import com.autonoma.erp.modules.qms.audit.entity.AuditArea;
import com.autonoma.erp.modules.qms.audit.entity.AuditType;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.qms.audit.repository.AuditAreaRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditTypeRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;

import com.autonoma.erp.modules.qms.audit.entity.AuditCriteria;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignment;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistDepartment;
import com.autonoma.erp.modules.qms.checklist.entity.MasterChecklist;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistVerification;
import com.autonoma.erp.modules.qms.audit.repository.AuditCriteriaRepository;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistAssignmentRepository;
import com.autonoma.erp.modules.qms.checklist.repository.MasterChecklistRepository;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistVerificationRepository;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistClosed;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistClosedRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.ConcurrentHashMap;
import com.autonoma.erp.config.TenantContextHolder;
import AppUtil.BosDocConstants;

@Service
public class MasterChecklistMigrationService {

    private static final ConcurrentHashMap<String, AtomicBoolean> tenantStopFlags = new ConcurrentHashMap<>();

    private static AtomicBoolean getStopFlagForCurrentTenant() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            tenantId = "DEFAULT_TENANT";
        }
        return tenantStopFlags.computeIfAbsent(tenantId, k -> new AtomicBoolean(false));
    }

    public static class TenantStopFlag {
        public boolean get() {
            return getStopFlagForCurrentTenant().get();
        }

        public void set(boolean newValue) {
            getStopFlagForCurrentTenant().set(newValue);
        }
    }

    public static final TenantStopFlag stopFlag = new TenantStopFlag();

    public static void requestStop() {
        stopFlag.set(true);
    }

    public static void resetStop() {
        stopFlag.set(false);
    }

    @Transactional
    public String clearChecklists() {
        try {
            clearChecklistMasterDocuments();
        } catch (Exception ignore) {
        }
        checklistAssignmentRepository.deleteAllInBatch();
        masterChecklistRepository.deleteAllInBatch();
        return "Cleared all checklist master and assignment records.";
    }

    @Transactional
    public String clearChecklistAssignments() {
        checklistAssignmentRepository.deleteAllInBatch();
        return "Cleared all checklist assignment records.";
    }

    @Transactional
    public String clearDepartments() {
        departmentRepository.deleteAllInBatch();
        return "Cleared all department records.";
    }

    @Transactional
    public String clearAuditAreas() {
        auditAreaRepository.deleteAllInBatch();
        return "Cleared all audit area records.";
    }

    @Transactional
    public String clearAuditTypes() {
        auditTypeRepository.deleteAllInBatch();
        return "Cleared all audit type records.";
    }

    @Transactional
    public String clearAuditCriteria() {
        try {
            // 1. Fetch paths of attachments mapped to Audit Criteria (PAGE_CODE = 'M1130')
            @SuppressWarnings("unchecked")
            java.util.List<String> paths = entityManager
                    .createNativeQuery("SELECT PATH FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'M1130'")
                    .getResultList();

            // 2. Delete physical files from disk
            for (String p : paths) {
                if (p != null && !p.trim().isEmpty()) {
                    String physicalPath = p.trim();
                    if (physicalPath.startsWith("MASTER_QMS_AUDIT_AUDIT_CRITERIA/")) {
                        String fileName = physicalPath.substring("MASTER_QMS_AUDIT_AUDIT_CRITERIA/".length());
                        physicalPath = AppUtil.BosDocConstants.MASTER_QMS_AUDIT_AUDIT_CRITERIA_PATH + "/" + fileName;
                    }
                    // fileService deletes from the correct root directory
                    boolean deleted = fileService.deleteFile(physicalPath);
                    if (deleted) {
                        System.out.println("[ATTACHMENT CLEAR] Deleted physical file: " + physicalPath);
                    } else {
                        // Could not delete or file did not exist
                        System.err.println("[ATTACHMENT CLEAR] Failed to delete physical file: " + physicalPath);
                    }
                }
            }

            // 3. Delete dependent records from QMS_ATTACHMENT_PATH
            int deletedRecords = entityManager
                    .createNativeQuery("DELETE FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'M1130'").executeUpdate();
            System.out.println("[ATTACHMENT CLEAR] Deleted " + deletedRecords + " records from QMS_ATTACHMENT_PATH");

        } catch (Exception e) {
            System.err.println("[ATTACHMENT CLEAR] Error clearing Audit Criteria attachments: " + e.getMessage());
        }

        auditDepartmentRepository.deleteAllInBatch();
        entityManager.createNativeQuery("DELETE FROM QMS_AUDIT_CRITERIA_TYPE").executeUpdate();
        auditCriteriaRepository.deleteAllInBatch();

        try {
            entityManager.createNativeQuery("DBCC CHECKIDENT ('QMS_AUDIT_DEPARTMENT', RESEED, 0)").executeUpdate();
            entityManager.createNativeQuery("DBCC CHECKIDENT ('QMS_AUDIT_CRITERIA', RESEED, 0)").executeUpdate();
            System.out
                    .println("[ATTACHMENT CLEAR] Reseeded QMS_AUDIT_CRITERIA and QMS_AUDIT_DEPARTMENT identities to 0");
        } catch (Exception e) {
            System.err.println("[ATTACHMENT CLEAR] Failed to reseed identity: " + e.getMessage());
        }

        return "Cleared all audit criteria records and their physical attachments.";
    }

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired(required = false)
    @Qualifier("secondaryJdbcTemplate")
    private JdbcTemplate jdbcTemplate;

    @Autowired
    @Qualifier("jdbcTemplate")
    private JdbcTemplate primaryJdbcTemplate;

    private static final ThreadLocal<String> threadLocalDbName = new ThreadLocal<>();
    private static final ThreadLocal<String> threadLocalAttachmentPath = new ThreadLocal<>();
    private static volatile String lastConfiguredAttachmentPath = null;

    public static void setMigrationContext(String dbName, String attachmentPath) {
        threadLocalDbName.set(dbName);
        threadLocalAttachmentPath.set(attachmentPath);
        if (attachmentPath != null && !attachmentPath.trim().isEmpty()) {
            lastConfiguredAttachmentPath = attachmentPath.trim();
        }
    }

    public static void clearMigrationContext() {
        threadLocalDbName.remove();
        threadLocalAttachmentPath.remove();
    }

    public static String getSecondaryDbName() {
        return threadLocalDbName.get();
    }

    public static String getSecondaryAttachmentPath() {
        String path = threadLocalAttachmentPath.get();
        if (path != null && !path.trim().isEmpty()) {
            return path;
        }
        return lastConfiguredAttachmentPath;
    }

    private java.util.Set<String> validUserIdsCache = null;

    private synchronized String resolveUser(Object userObj) {
        if (userObj == null) {
            return "SUPER BOSS";
        }
        String userStr = String.valueOf(userObj).trim();
        if (userStr.isEmpty()) {
            return "SUPER BOSS";
        }
        if (validUserIdsCache == null) {
            try {
                List<String> ids = primaryJdbcTemplate.queryForList("SELECT USER_ID FROM AD_USER_CREDENTIAL",
                        String.class);
                validUserIdsCache = ids.stream()
                        .filter(java.util.Objects::nonNull)
                        .map(String::toLowerCase)
                        .collect(Collectors.toSet());
            } catch (Exception e) {
                validUserIdsCache = new java.util.HashSet<>();
            }
        }
        if (validUserIdsCache.contains(userStr.toLowerCase())) {
            return userStr;
        }
        return "SUPER BOSS";
    }

    private String getSecondaryProcessImgLocation() {
        String customPath = threadLocalAttachmentPath.get();
        if (customPath != null && !customPath.trim().isEmpty()) {
            String base = customPath.trim();
            if (!base.toLowerCase().endsWith("erpimage") && !base.toLowerCase().endsWith("erpimage\\")) {
                base = base + "\\erpimage";
            }
            return base;
        }
        try {
            if (jdbcTemplate != null) {
                String sql = "SELECT VALUE FROM PREFERENCE_TABLE WHERE COL_NAME = 'PROCESS_IMG_LOCATION'";
                String val = jdbcTemplate.queryForObject(sql, String.class);
                if (val != null && !val.trim().isEmpty()) {
                    return val.trim();
                }
            }
        } catch (Exception e) {
            System.err.println("[MIGRATION WARNING] Failed to get PROCESS_IMG_LOCATION: " + e.getMessage());
        }
        return "D:\\ERPCommon-NuTech\\erpimage";
    }

    @Autowired
    private MasterChecklistRepository masterChecklistRepository;

    @Autowired
    private ChecklistAssignmentRepository checklistAssignmentRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository departmentRepository;

    @Autowired
    private StatusMasterRepository statusRepo;

    @Autowired
    private ChecklistVerificationRepository checklistVerificationRepository;

    @Autowired
    private ChecklistClosedRepository checklistClosedRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditAreaRepository auditAreaRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditTypeRepository auditTypeRepository;

    @Autowired
    private AuditCriteriaRepository auditCriteriaRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditDepartmentRepository auditDepartmentRepository;

    @Autowired
    private com.autonoma.erp.modules.platform.files.service.FileService fileService;

    @Autowired
    private com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingMasterRepository qmsMeetingMasterRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository qmsMeetingScheduleRepository;

    // ─── STATUS int mapping ─────────────────────────────────────────────────────
    // STATUS: 0=INACTIVE/DRAFT, 1=ACTIVE, 2=EXPIRED, 3=PENDING, 4=CANCELLED
    // TASK_STATUS: 0=PENDING, 1=IN_PROGRESS, 2=COMPLETED, 3=OVERDUE, 4=CANCELLED
    // VERIFY_STATUS: 0=PENDING, 1=APPROVED, 2=REJECTED, 3=HOLD
    // ASSIGN STATUS: 0=INACTIVE, 1=ACTIVE
    // ────────────────────────────────────────────────────────────────────────────

    // Helper method to safely extract and trim strings from JDBC ResultSet
    private String getTrimmedString(java.sql.ResultSet rs, String columnName) throws java.sql.SQLException {
        String val = rs.getString(columnName);
        return val != null ? val.trim() : null;
    }

    private void turnOffAllIdentityInserts(java.sql.Connection conn) {
        String[] tables = {
                "QMS_ATTACHMENT_PATH",
                "QMS_CHECKLIST_MASTER",
                "QMS_CHECKLIST_ASSIGNMENT",
                "QMS_CLOSE_MOM_AND_VERIFY"
        };
        try (java.sql.Statement stmt = conn.createStatement()) {
            for (String table : tables) {
                try {
                    stmt.execute("SET IDENTITY_INSERT " + table + " OFF");
                } catch (Exception ignore) {
                }
            }
        } catch (Exception ignore) {
        }
    }

    private void ensureAttachmentPathTableHasIdentity() {
        try {
            String checkSql = "SELECT COLUMNPROPERTY(OBJECT_ID('QMS_ATTACHMENT_PATH'), 'ID', 'IsIdentity')";
            Integer isIdentity = primaryJdbcTemplate.queryForObject(checkSql, Integer.class);
            if (isIdentity != null && isIdentity == 0) {
                System.out.println(
                        "[REPAIR] QMS_ATTACHMENT_PATH ID column is not an IDENTITY. Re-creating table with IDENTITY...");
                primaryJdbcTemplate.execute("EXEC sp_rename 'QMS_ATTACHMENT_PATH', 'QMS_ATTACHMENT_PATH_OLD'");

                String createSql = "CREATE TABLE [dbo].[QMS_ATTACHMENT_PATH] (\n" +
                        "    [ID] BIGINT IDENTITY(1,1) NOT NULL,\n" +
                        "    [PAGE_CODE] NVARCHAR(100) NOT NULL,\n" +
                        "    [REF_ID] BIGINT NOT NULL,\n" +
                        "    [DOC_TYPE] NVARCHAR(100) NOT NULL,\n" +
                        "    [PATH] NVARCHAR(1000) NOT NULL,\n" +
                        "    [FILE_NAME] NVARCHAR(255) NOT NULL,\n" +
                        "    [CREATED_BY] NVARCHAR(50) NOT NULL,\n" +
                        "    [CREATED_DATE] DATETIME NOT NULL DEFAULT (getdate()),\n" +
                        "    [UPDATED_BY] NVARCHAR(50) NOT NULL,\n" +
                        "    [UPDATED_DATE] DATETIME NOT NULL,\n" +
                        "    [UPDATED_USER] NVARCHAR(100) NULL,\n" +
                        "    CONSTRAINT [PK_QMS_ATTACHMENT_PATH] PRIMARY KEY CLUSTERED ([ID])\n" +
                        ")";
                primaryJdbcTemplate.execute(createSql);

                try {
                    primaryJdbcTemplate.execute("SET IDENTITY_INSERT QMS_ATTACHMENT_PATH ON");
                    String insertSql = "INSERT INTO QMS_ATTACHMENT_PATH (ID, PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, UPDATED_USER)\n"
                            +
                            "SELECT ID, PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, UPDATED_USER\n"
                            +
                            "FROM QMS_ATTACHMENT_PATH_OLD";
                    primaryJdbcTemplate.execute(insertSql);
                } finally {
                    try {
                        primaryJdbcTemplate.execute("SET IDENTITY_INSERT QMS_ATTACHMENT_PATH OFF");
                    } catch (Exception ignore) {
                    }
                }

                primaryJdbcTemplate.execute("DROP TABLE QMS_ATTACHMENT_PATH_OLD");
                System.out.println("[REPAIR] Successfully recreated QMS_ATTACHMENT_PATH with IDENTITY.");
            }
        } catch (Exception e) {
            System.err.println("[REPAIR WARNING] Failed to ensure QMS_ATTACHMENT_PATH identity: " + e.getMessage());
            try {
                primaryJdbcTemplate.execute("SET IDENTITY_INSERT QMS_ATTACHMENT_PATH OFF");
            } catch (Exception ignore) {
            }
        }
    }

    // ─── MASTER CHECKLIST MIGRATION ─────────────────────────────────────────────

    @Transactional
    public String migrateOldChecklists() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }
        ensureAttachmentPathTableHasIdentity();
        try {
            primaryJdbcTemplate.execute(
                    "IF OBJECT_ID('TEMP_MIGRATION_CHECKLIST_MAP', 'U') IS NOT NULL DROP TABLE TEMP_MIGRATION_CHECKLIST_MAP");
            primaryJdbcTemplate
                    .execute("CREATE TABLE TEMP_MIGRATION_CHECKLIST_MAP (legacy_row_id INT PRIMARY KEY, new_id INT)");
        } catch (Exception e) {
            System.err
                    .println("[MIGRATION WARNING] Failed to recreate TEMP_MIGRATION_CHECKLIST_MAP: " + e.getMessage());
        }

        String sql = "SELECT * FROM HRMS_MASTER_CHECKLIST";

        List<com.autonoma.erp.modules.hr.orgstructure.entity.Department> allDepts = departmentRepository.findAll();
        Map<String, String> deptNoToNameMap = allDepts.stream()
                .filter(d -> d.getDepartmentNo() != null && !d.getDepartmentNo().trim().isEmpty())
                .collect(Collectors.toMap(
                        d -> d.getDepartmentNo().trim(),
                        d -> d.getDepartmentName(),
                        (a, b) -> a));

        List<MasterChecklist> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            MasterChecklist checklist = new MasterChecklist();

            int legacyRowId = rs.getInt("row_id");
            checklist.setUploadedFiles(String.valueOf(legacyRowId)); // Store legacy row_id temporarily in transient
                                                                     // uploadedFiles
            checklist.setSeqNo(getTrimmedString(rs, "DISPLAY_SEQ_NO"));

            // Map simple string fields and trim whitespaces
            checklist.setCheckingPoint(getTrimmedString(rs, "CHECKING_POINT"));
            checklist.setStockLink(getTrimmedString(rs, "STOCK_LINK"));
            checklist.setDescription(getTrimmedString(rs, "COMMENTS"));
            checklist.setCategory(getTrimmedString(rs, "CUST_CATEGORY"));
            checklist.setPhotoRequired(getTrimmedString(rs, "PHOTO_REQUIRED"));
            String verificationRequired = getTrimmedString(rs, "VERIFICATION_REQUIRED");
            String mappedVal = "Yes".equalsIgnoreCase(verificationRequired) ? "1" : "0";
            checklist.setVerificationRequired(verificationRequired);
            checklist.setDualCheck(mappedVal);
            checklist.setFrequency(getTrimmedString(rs, "FREQUENCY_LEVEL"));
            checklist.setAssignTo(getTrimmedString(rs, "ASSIGN_TO"));
            checklist.setCarryForward(getTrimmedString(rs, "CARRY_FORWARD"));
            checklist.setRejReason(getTrimmedString(rs, "REJECT_REASON"));
            checklist.setAmendmentReason(getTrimmedString(rs, "AMENDMENT_REASON"));

            // Map status fields as INT (converted from legacy string values)
            checklist.setStatus(getTrimmedString(rs, "STATUS"));
            checklist.setTaskStatus(getTrimmedString(rs, "TASK_STATUS"));
            checklist.setVerifyStatus(getTrimmedString(rs, "APPROVAL_STATUS"));

            // Map user and audit fields
            checklist.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
            checklist.setCreatedAt(rs.getTimestamp("CREAT_DT"));

            checklist.setVerifiedBy(getTrimmedString(rs, "APPROVED_BY"));
            checklist.setVerifiedDate(rs.getTimestamp("APPROVED_DATE"));

            // Map dates
            checklist.setEffectiveFrom(rs.getDate("START_DATE"));
            checklist.setExpiryDate(rs.getDate("RENEWAL_EXPIRY_DATE"));
            checklist.setReminderDate(rs.getDate("REMINDER_DATE"));

            // Map primitives
            checklist.setReminderDays(rs.getObject("REMINDER_DAYS") != null ? rs.getLong("REMINDER_DAYS") : null);

            // Handle level list
            checklist.setLevelIds(getTrimmedString(rs, "LEVEL"));

            // Handle Departments mapping
            String deptNo = getTrimmedString(rs, "DEPT_NO");
            if (deptNo != null && !deptNo.isEmpty()) {
                List<ChecklistDepartment> deptList = new ArrayList<>();
                for (String dept : deptNo.split(",")) {
                    String cleanDept = dept.trim();
                    if (!cleanDept.isEmpty()) {
                        ChecklistDepartment checklistDept = new ChecklistDepartment();
                        checklistDept
                                .setCreatedBy(
                                        checklist.getCreatedBy() != null ? checklist.getCreatedBy() : "SUPER BOSS");
                        checklistDept.setCreatedDate(
                                checklist.getCreatedDate() != null ? checklist.getCreatedDate() : new java.util.Date());
                        com.autonoma.erp.modules.hr.orgstructure.entity.Department resolvedDept = departmentRepository
                                .findByDepartmentNo(cleanDept).orElse(null);
                        if (resolvedDept != null) {
                            checklistDept.setDepartment(resolvedDept);
                            checklistDept.setChecklist(checklist);
                            deptList.add(checklistDept);
                        }
                    }
                }
                checklist.setDepartments(deptList);
            }

            if (stopFlag.get())
                return null;
            return checklist;
        });

        // Filter out nulls from stopping
        final List<MasterChecklist> finalMigratedList = migratedList.stream().filter(c -> c != null)
                .collect(Collectors.toList());

        if (stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 records.";
        }

        if (!finalMigratedList.isEmpty()) {
            primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
                String insertChecklistSql = "INSERT INTO QMS_CHECKLIST_MASTER (id, seq_no, checking_point, description, category, frequency, week_days, repeat_every_value, repeat_every_unit, effective_from, expiry_date, reminder_days, reminder_date, stock_link, photo_required, verification_required, next_due_date, dual_check, carry_forward, amendment_reason, status, task_status, verify_status, verified_by, verified_date, rej_reason, assign_to, item_code, qty, assignment_type, active, created_by, created_date, updated_by, updated_date, search_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                String insertDeptSql = "INSERT INTO QMS_CHECKLIST_DEPARTMENT (CHECKLIST_ID, DEPARTMENT_ID, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, ?, ?, ?, ?)";
                String insertMapSql = "INSERT INTO TEMP_MIGRATION_CHECKLIST_MAP (legacy_row_id, new_id) VALUES (?, ?)";

                turnOffAllIdentityInserts(conn);
                try (java.sql.Statement stmt = conn.createStatement()) {
                    stmt.execute("SET IDENTITY_INSERT QMS_CHECKLIST_MASTER ON");
                }

                try (java.sql.PreparedStatement psChecklist = conn.prepareStatement(insertChecklistSql);
                        java.sql.PreparedStatement psDept = conn.prepareStatement(insertDeptSql);
                        java.sql.PreparedStatement psMap = conn.prepareStatement(insertMapSql)) {

                    for (MasterChecklist checklist : finalMigratedList) {
                        int legacyRowId = Integer.parseInt(checklist.getUploadedFiles());
                        psChecklist.setLong(1, legacyRowId);
                        psChecklist.setString(2, checklist.getSeqNo());
                        psChecklist.setString(3, checklist.getCheckingPoint());
                        psChecklist.setString(4, checklist.getDescription());
                        psChecklist.setString(5, checklist.getCategory());
                        psChecklist.setString(6, checklist.getFrequency());
                        psChecklist.setString(7, checklist.getWeekDays());

                        if (checklist.getRepeatEveryValue() != null) {
                            psChecklist.setInt(8, checklist.getRepeatEveryValue());
                        } else {
                            psChecklist.setNull(8, java.sql.Types.INTEGER);
                        }

                        psChecklist.setString(9, checklist.getRepeatEveryUnit());
                        psChecklist.setDate(10,
                                checklist.getEffectiveFrom() != null
                                        ? new java.sql.Date(checklist.getEffectiveFrom().getTime())
                                        : null);
                        psChecklist.setDate(11,
                                checklist.getExpiryDate() != null
                                        ? new java.sql.Date(checklist.getExpiryDate().getTime())
                                        : null);

                        if (checklist.getReminderDays() != null) {
                            psChecklist.setLong(12, checklist.getReminderDays());
                        } else {
                            psChecklist.setNull(12, java.sql.Types.BIGINT);
                        }

                        psChecklist.setDate(13,
                                checklist.getReminderDate() != null
                                        ? new java.sql.Date(checklist.getReminderDate().getTime())
                                        : null);
                        psChecklist.setString(14, checklist.getStockLink());
                        psChecklist.setString(15, checklist.getPhotoRequired());
                        psChecklist.setString(16, checklist.getVerificationRequired());
                        psChecklist.setDate(17,
                                checklist.getNextDueDate() != null
                                        ? new java.sql.Date(checklist.getNextDueDate().getTime())
                                        : null);
                        psChecklist.setString(18, checklist.getDualCheck());
                        psChecklist.setString(19, checklist.getCarryForward());
                        psChecklist.setString(20, checklist.getAmendmentReason());
                        Long statusVal = getStatusIdByName(checklist.getStatus());
                        Long taskStatusVal = getStatusIdByName(checklist.getTaskStatus());
                        Long verifyStatusVal = getStatusIdByName(checklist.getVerifyStatus());

                        if (statusVal != null) {
                            psChecklist.setLong(21, statusVal);
                        } else {
                            psChecklist.setNull(21, java.sql.Types.BIGINT);
                        }
                        if (taskStatusVal != null) {
                            psChecklist.setLong(22, taskStatusVal);
                        } else {
                            psChecklist.setNull(22, java.sql.Types.BIGINT);
                        }
                        if (verifyStatusVal != null) {
                            psChecklist.setLong(23, verifyStatusVal);
                        } else {
                            psChecklist.setNull(23, java.sql.Types.BIGINT);
                        }
                        psChecklist.setString(24, checklist.getVerifiedBy());
                        psChecklist.setTimestamp(25,
                                checklist.getVerifiedDate() != null
                                        ? new java.sql.Timestamp(checklist.getVerifiedDate().getTime())
                                        : null);
                        psChecklist.setString(26, checklist.getRejReason());
                        psChecklist.setString(27, checklist.getAssignTo());
                        psChecklist.setString(28, checklist.getItemCode());
                        psChecklist.setString(29, checklist.getQty());
                        psChecklist.setString(30, checklist.getAssignmentType());
                        psChecklist.setBoolean(31, checklist.getIsActive() != null ? checklist.getIsActive() : true);
                        psChecklist.setString(32, checklist.getCreatedBy());
                        psChecklist.setTimestamp(33,
                                checklist.getCreatedAt() != null
                                        ? new java.sql.Timestamp(checklist.getCreatedAt().getTime())
                                        : null);
                        psChecklist.setString(34, checklist.getUpdatedBy());
                        psChecklist.setTimestamp(35,
                                checklist.getUpdatedAt() != null
                                        ? new java.sql.Timestamp(checklist.getUpdatedAt().getTime())
                                        : null);

                        StringBuilder sbSearch = new StringBuilder();
                        if (checklist.getSeqNo() != null)
                            sbSearch.append(checklist.getSeqNo()).append(" ");
                        if (checklist.getCheckingPoint() != null)
                            sbSearch.append(checklist.getCheckingPoint()).append(" ");
                        if (checklist.getCategory() != null)
                            sbSearch.append(checklist.getCategory()).append(" ");
                        if (checklist.getFrequency() != null)
                            sbSearch.append(checklist.getFrequency()).append(" ");
                        if (checklist.getDepartments() != null) {
                            for (ChecklistDepartment dept : checklist.getDepartments()) {
                                if (dept.getDepartment() != null && dept.getDepartment().getDepartmentName() != null) {
                                    sbSearch.append(dept.getDepartment().getDepartmentName()).append(" ");
                                }
                            }
                        }
                        psChecklist.setString(36, sbSearch.toString().trim().toLowerCase());

                        psChecklist.executeUpdate();

                        long generatedId = legacyRowId;

                        // Store mapping in TEMP_MIGRATION_CHECKLIST_MAP
                        psMap.setInt(1, legacyRowId);
                        psMap.setLong(2, generatedId);
                        psMap.executeUpdate();

                        if (checklist.getDepartments() != null) {
                            for (ChecklistDepartment dept : checklist.getDepartments()) {
                                psDept.setLong(1, generatedId);
                                psDept.setLong(2, dept.getDepartment().getId());
                                psDept.setString(3, dept.getCreatedBy());
                                psDept.setTimestamp(4,
                                        dept.getCreatedDate() != null
                                                ? new java.sql.Timestamp(dept.getCreatedDate().getTime())
                                                : null);
                                psDept.setString(5, dept.getUpdatedBy());
                                psDept.setTimestamp(6,
                                        dept.getUpdatedDate() != null
                                                ? new java.sql.Timestamp(dept.getUpdatedDate().getTime())
                                                : null);
                                psDept.executeUpdate();
                            }
                        }
                    }
                } finally {
                    try (java.sql.Statement stmt = conn.createStatement()) {
                        stmt.execute("SET IDENTITY_INSERT QMS_CHECKLIST_MASTER OFF");
                    } catch (java.sql.SQLException e) {
                        System.err.println("[MIGRATION ERROR] Failed to set IDENTITY_INSERT OFF: " + e.getMessage());
                    }
                }
                return null;
            });
        }

        try {
            migrateChecklistMasterDocuments();
        } catch (Exception e) {
            System.err.println(
                    "[MIGRATION WARNING] Failed to auto-migrate checklist master documents: " + e.getMessage());
        }

        return "Successfully migrated " + finalMigratedList.size()
                + " checklist records from HRMS_MASTER_CHECKLIST to qms_checklist_master.";
    }

    // ─── CHECKLIST ASSIGNMENT MIGRATION ─────────────────────────────────────────

    @Transactional
    public String migrateChecklistAssignments() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }
        ensureAttachmentPathTableHasIdentity();
        // Build a lookup: legacy row_id -> new MasterChecklist entity using
        // TEMP_MIGRATION_CHECKLIST_MAP
        List<MasterChecklist> allChecklists = masterChecklistRepository.findAll();
        Map<Long, MasterChecklist> checklistById = allChecklists.stream()
                .collect(Collectors.toMap(MasterChecklist::getId, c -> c));

        Map<String, MasterChecklist> checklistByLegacyId = new java.util.HashMap<>();
        try {
            primaryJdbcTemplate.query("SELECT legacy_row_id, new_id FROM TEMP_MIGRATION_CHECKLIST_MAP", (rs) -> {
                long legacyId = rs.getLong("legacy_row_id");
                long newId = rs.getLong("new_id");
                MasterChecklist checklist = checklistById.get(newId);
                if (checklist != null) {
                    checklistByLegacyId.put(String.valueOf(legacyId), checklist);
                }
            });
        } catch (Exception e) {
            System.err.println("[MIGRATION ERROR] Failed to query TEMP_MIGRATION_CHECKLIST_MAP: " + e.getMessage());
        }

        // Fetch all statuses to map status text to StatusMaster entity
        List<StatusMaster> allStatuses = statusRepo.findAll();
        Map<String, StatusMaster> statusMap = allStatuses.stream()
                .collect(Collectors.toMap(
                        s -> s.getName().toUpperCase(),
                        s -> s,
                        (a, b) -> a));

        Map<String, Long> empCodeToIdMap = new java.util.HashMap<>();
        try {
            primaryJdbcTemplate.query("SELECT EMP_CODE, OLD_EMP_CODE, ID FROM HR_EMPLOYEE", (rsRow) -> {
                long id = rsRow.getLong("ID");
                empCodeToIdMap.put(String.valueOf(id), id);
                String code = rsRow.getString("EMP_CODE");
                if (code != null && !code.trim().isEmpty()) {
                    String cleanCode = code.trim();
                    empCodeToIdMap.put(cleanCode, id);
                    empCodeToIdMap.put(cleanCode.replaceAll("^0+", ""), id);
                    try {
                        double dVal = Double.parseDouble(cleanCode);
                        empCodeToIdMap.put(String.valueOf((long) dVal), id);
                    } catch (Exception ignore) {
                    }
                }
                String oldCode = rsRow.getString("OLD_EMP_CODE");
                if (oldCode != null && !oldCode.trim().isEmpty()) {
                    String cleanOldCode = oldCode.trim();
                    empCodeToIdMap.put(cleanOldCode, id);
                    empCodeToIdMap.put(cleanOldCode.replaceAll("^0+", ""), id);
                    try {
                        double dVal = Double.parseDouble(cleanOldCode);
                        empCodeToIdMap.put(String.valueOf((long) dVal), id);
                    } catch (Exception ignore) {
                    }
                }
            });
        } catch (Exception e) {
            System.err.println("[MIGRATION ERROR] Failed to load empCodeToIdMap: " + e.getMessage());
        }

        if (checklistByLegacyId.isEmpty()) {
            return "No migrated checklists found with legacy row IDs. Please run master checklist migration first.";
        }

        // Read all assignment records from the secondary (legacy) DB
        String sql = "SELECT * FROM QMS_ASSIGN_CHECKLIST";
        List<ChecklistAssignment> assignments = jdbcTemplate.query(sql, (rs, rowNum) -> {
            String legacyCheckId = String.valueOf(rs.getInt("check_row_id"));
            MasterChecklist parentChecklist = checklistByLegacyId.get(legacyCheckId);

            // Skip if no matching checklist found in main DB
            if (parentChecklist == null)
                return null;

            ChecklistAssignment assignment = new ChecklistAssignment();
            assignment.setChecklist(parentChecklist);

            // emp_code is the assigned employee (stored as string ID)
            String empCodeVal = getTrimmedString(rs, "emp_code");
            Long resolvedEmpId = null;
            if (empCodeVal != null && !empCodeVal.isEmpty()) {
                resolvedEmpId = empCodeToIdMap.get(empCodeVal);
                if (resolvedEmpId == null) {
                    resolvedEmpId = empCodeToIdMap.get(empCodeVal.replaceAll("^0+", ""));
                }
                if (resolvedEmpId == null) {
                    try {
                        double dVal = Double.parseDouble(empCodeVal);
                        resolvedEmpId = empCodeToIdMap.get(String.valueOf((long) dVal));
                    } catch (Exception ignore) {
                    }
                }
            }
            if (resolvedEmpId != null) {
                assignment.setAssignedTo(String.valueOf(resolvedEmpId));
            } else {
                System.err.println("[MIGRATION WARNING] Unresolved employee code in QMS_ASSIGN_CHECKLIST: '" + empCodeVal + "'");
                assignment.setAssignedTo(null);
            }

            // creat_user_id_cd is who assigned
            assignment.setAssignedBy(getTrimmedString(rs, "creat_user_id_cd"));
            assignment.setAssignedDate(rs.getTimestamp("creat_dt"));

            // reassign_empcd - if reassigned, record as updatedBy
            int reassignEmpCode = rs.getInt("reassign_empcd");

            // assign_type
            assignment.setAssignType(getTrimmedString(rs, "assign_type"));

            // Carry forward count from most frequent email tracking
            int weekCount = rs.getInt("week_count");
            int monthCount = rs.getInt("month_count");
            int customCount = rs.getInt("custom_count");
            int quarterCount = rs.getInt("quarterly_count");
            int annualCount = rs.getInt("annual_count");
            int maxCount = Math.max(weekCount, Math.max(monthCount,
                    Math.max(customCount, Math.max(quarterCount, annualCount))));
            assignment.setCarryForwardCount(maxCount);

            // Map status using statusMap
            String legacyStatus = getTrimmedString(rs, "status");
            if (legacyStatus != null) {
                String lookupName;
                if ("ACTIVE".equalsIgnoreCase(legacyStatus)) {
                    lookupName = "Active";
                } else if ("INACTIVE".equalsIgnoreCase(legacyStatus)) {
                    lookupName = "Inactive";
                } else {
                    lookupName = "Not Completed";
                }
                StatusMaster resolvedStatus = statusMap.get(lookupName.toUpperCase());
                if (resolvedStatus == null) {
                    Optional<StatusMaster> dbFound = statusRepo.findByName(lookupName);
                    if (dbFound.isPresent()) {
                        resolvedStatus = dbFound.get();
                    } else {
                        StatusMaster newStatus = new StatusMaster();
                        newStatus.setName(lookupName);
                        resolvedStatus = statusRepo.save(newStatus);
                        System.out.println("[MIGRATION] Created missing StatusMaster: '" + lookupName + "' (id="
                                + resolvedStatus.getId() + ")");
                    }
                    statusMap.put(lookupName.toUpperCase(), resolvedStatus);
                }
                assignment.setStatus(resolvedStatus);
            }

            if (stopFlag.get())
                return null;
            return assignment;
        });

        assignments = assignments.stream().filter(a -> a != null).collect(Collectors.toList());

        if (stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 assignments.";
        }

        // Filter out nulls (unmatched checklist references)
        List<ChecklistAssignment> validAssignments = assignments.stream()
                .filter(a -> a != null)
                .collect(Collectors.toList());

        List<ChecklistAssignment> assignmentsToSave = new java.util.ArrayList<>();
        int duplicateCount = 0;
        int existingCount = 0;

        if (!validAssignments.isEmpty()) {
            // 1. Deduplicate internally in the batch
            java.util.Map<String, ChecklistAssignment> uniqueMap = new java.util.LinkedHashMap<>();
            for (ChecklistAssignment a : validAssignments) {
                String checklistIdStr = (a.getChecklist() != null && a.getChecklist().getId() != null)
                        ? String.valueOf(a.getChecklist().getId())
                        : "null";
                String assignedTo = (a.getAssignedTo() != null && !a.getAssignedTo().trim().isEmpty())
                        ? a.getAssignedTo().trim()
                        : "null";
                String assignType = (a.getAssignType() != null && !a.getAssignType().trim().isEmpty())
                        ? a.getAssignType().trim()
                        : "null";
                String key = checklistIdStr + "|" + assignedTo + "|" + assignType;

                if (!uniqueMap.containsKey(key)) {
                    uniqueMap.put(key, a);
                } else {
                    duplicateCount++;
                    ChecklistAssignment existing = uniqueMap.get(key);
                    java.util.Date existingDate = existing.getAssignedDate();
                    java.util.Date newDate = a.getAssignedDate();
                    if (newDate != null && (existingDate == null || newDate.after(existingDate))) {
                        uniqueMap.put(key, a);
                    }
                }
            }

            // 2. Fetch existing active templates from the DB to avoid inserting duplicates
            // of existing records
            List<ChecklistAssignment> existingActiveTemplates = checklistAssignmentRepository.findActiveTemplates();
            java.util.Set<String> existingKeys = new java.util.HashSet<>();
            for (ChecklistAssignment c : existingActiveTemplates) {
                String checklistIdStr = (c.getChecklist() != null && c.getChecklist().getId() != null)
                        ? String.valueOf(c.getChecklist().getId())
                        : "null";
                String assignedTo = (c.getAssignedTo() != null && !c.getAssignedTo().trim().isEmpty())
                        ? c.getAssignedTo().trim()
                        : "null";
                String assignType = (c.getAssignType() != null && !c.getAssignType().trim().isEmpty())
                        ? c.getAssignType().trim()
                        : "null";
                existingKeys.add(checklistIdStr + "|" + assignedTo + "|" + assignType);
            }

            for (ChecklistAssignment a : uniqueMap.values()) {
                String checklistIdStr = (a.getChecklist() != null && a.getChecklist().getId() != null)
                        ? String.valueOf(a.getChecklist().getId())
                        : "null";
                String assignedTo = (a.getAssignedTo() != null && !a.getAssignedTo().trim().isEmpty())
                        ? a.getAssignedTo().trim()
                        : "null";
                String assignType = (a.getAssignType() != null && !a.getAssignType().trim().isEmpty())
                        ? a.getAssignType().trim()
                        : "null";
                String key = checklistIdStr + "|" + assignedTo + "|" + assignType;

                if (!existingKeys.contains(key)) {
                    assignmentsToSave.add(a);
                } else {
                    existingCount++;
                }
            }

            if (!assignmentsToSave.isEmpty()) {
                checklistAssignmentRepository.saveAll(assignmentsToSave);
            }
        }

        int skipped = assignments.size() - validAssignments.size();
        return "Successfully migrated " + assignmentsToSave.size()
                + " assignment records (deduplicated internally: " + duplicateCount
                + ", skipped existing active templates: " + existingCount
                + ") from QMS_ASSIGN_CHECKLIST to qms_checklist_assignment."
                + (skipped > 0 ? " (Skipped " + skipped + " records with no matching checklist.)" : "");
    }

    // ─── DEPARTMENT MIGRATION ───────────────────────────────────────────────────
    private String resolveDeptTableName(JdbcTemplate template) {
        if (template == null) {
            return "DEPT";
        }
        String[] potentialTables = { "DEPT", "HRMS_DEPT", "HRMS_DEPT_MASTER", "HRMS_DEPARTMENT_MASTER",
                "HRMS_DEPARTMENT", "HR_DEPARTMENT" };
        for (String tableName : potentialTables) {
            try {
                template.execute("SELECT TOP 1 1 FROM " + tableName);
                return tableName;
            } catch (Exception ignored) {
            }
        }
        try {
            List<String> tables = template.query(
                    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%DEPT%' OR TABLE_NAME LIKE '%DEPARTMENT%'",
                    (rs, rowNum) -> rs.getString("TABLE_NAME"));
            if (!tables.isEmpty()) {
                return tables.get(0);
            }
        } catch (Exception ignored) {
        }
        return "DEPT";
    }

    private String resolveColumnName(JdbcTemplate template, String tableName, String[] potentialColumns,
            String defaultColumn) {
        if (template == null) {
            return defaultColumn;
        }
        for (String col : potentialColumns) {
            try {
                template.execute("SELECT TOP 1 " + col + " FROM " + tableName);
                return col;
            } catch (Exception ignored) {
            }
        }
        return defaultColumn;
    }

    @Transactional
    public String migrateDepartments() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        String resolvedTable = resolveDeptTableName(jdbcTemplate);
        String colDeptNo = resolveColumnName(jdbcTemplate, resolvedTable,
                new String[] { "DEPT_NO", "DEPT_CODE", "DEPARTMENT_NO", "ID" }, "DEPT_NO");
        String colDeptName = resolveColumnName(jdbcTemplate, resolvedTable,
                new String[] { "DEPT_NAME", "DEPARTMENT_NAME", "NAME" }, "DEPT_NAME");
        String colNda = resolveColumnName(jdbcTemplate, resolvedTable, new String[] { "NDA_CERTIFICATE", "NDA" },
                "NDA_CERTIFICATE");
        String colSeq = resolveColumnName(jdbcTemplate, resolvedTable,
                new String[] { "SEQ_NO", "SEQUENCE_NO", "DISPLAY_SEQ_NO" }, "SEQ_NO");

        String sql = "SELECT * FROM " + resolvedTable;

        List<com.autonoma.erp.modules.hr.orgstructure.entity.Department> migratedList = jdbcTemplate.query(sql,
                (rs, rowNum) -> {
                    com.autonoma.erp.modules.hr.orgstructure.entity.Department dept = new com.autonoma.erp.modules.hr.orgstructure.entity.Department();

                    String legacyDeptNo = null;
                    try {
                        legacyDeptNo = rs.getString(colDeptNo);
                    } catch (Exception ignored) {
                    }
                    dept.setDepartmentNo(legacyDeptNo != null ? legacyDeptNo.trim() : "");

                    String legacyDeptName = null;
                    try {
                        legacyDeptName = rs.getString(colDeptName);
                    } catch (Exception ignored) {
                    }
                    dept.setDepartmentName(legacyDeptName != null ? legacyDeptName.trim() : "");

                    String nda = null;
                    try {
                        nda = rs.getString(colNda);
                    } catch (Exception ignored) {
                    }
                    dept.setNdaCertificate(nda != null ? nda.trim() : "No");

                    int seq = 0;
                    try {
                        seq = rs.getInt(colSeq);
                    } catch (Exception ignored) {
                    }
                    dept.setSequenceNo(seq);

                    dept.setStatus("Active");
                    dept.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                    dept.setCreatedAt(new java.util.Date());
                    dept.setCategoryId(1);

                    return dept;
                });

        int migratedCount = 0;
        if (!migratedList.isEmpty()) {
            for (com.autonoma.erp.modules.hr.orgstructure.entity.Department d : migratedList) {
                if (!departmentRepository.findByDepartmentNo(d.getDepartmentNo()).isPresent()) {
                    departmentRepository.save(d);
                    migratedCount++;
                }
            }
        }

        return "Successfully migrated " + migratedCount + " department records from " + resolvedTable
                + " to hrm_department_master.";
    }

    // ─── CLOSE CHECKLIST MIGRATION (HRMS_CHECKLIST_PENDING_MASTER) ───────────────
    @Transactional
    public String migrateCloseChecklists() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }
        // Build a lookup: legacy row_id -> new MasterChecklist entity
        List<MasterChecklist> allChecklists = masterChecklistRepository.findAll();
        Map<Long, MasterChecklist> checklistById = allChecklists.stream()
                .collect(Collectors.toMap(MasterChecklist::getId, c -> c));

        if (checklistById.isEmpty()) {
            return "No migrated checklists found. Please run checklists migration first.";
        }

        // Fetch all statuses to map status text to StatusMaster entity
        List<StatusMaster> allStatuses = statusRepo.findAll();
        Map<String, StatusMaster> statusMap = allStatuses.stream()
                .collect(Collectors.toMap(
                        s -> s.getName().toUpperCase(),
                        s -> s,
                        (a, b) -> a));

        Map<String, Long> empCodeToIdMap = new java.util.HashMap<>();
        try {
            primaryJdbcTemplate.query("SELECT EMP_CODE, OLD_EMP_CODE, ID FROM HR_EMPLOYEE", (rsRow) -> {
                long id = rsRow.getLong("ID");
                String code = rsRow.getString("EMP_CODE");
                if (code != null && !code.trim().isEmpty()) {
                    empCodeToIdMap.put(code.trim(), id);
                }
                String oldCode = rsRow.getString("OLD_EMP_CODE");
                if (oldCode != null && !oldCode.trim().isEmpty()) {
                    empCodeToIdMap.put(oldCode.trim(), id);
                }
            });
        } catch (Exception e) {
            System.err.println("[MIGRATION ERROR] Failed to load empCodeToIdMap: " + e.getMessage());
        }

        int totalMigrated = 0;
        int totalSkipped = 0;
        int batchSize = 1000;
        int offset = 0;
        boolean hasMore = true;

        // Local helper class to capture intermediate variables mapping legacy rows
        class TempPendingMaster {
            int legacyRowId;
            ChecklistAssignment assignment;
            String verificationStatus;
            java.sql.Timestamp verificationDate;
            String rejectionComments;
            String lstUpdateUserIdCd;
        }

        while (hasMore) {

            String sql = "SELECT * FROM HRMS_CHECKLIST_PENDING_MASTER ORDER BY ROW_ID OFFSET " + offset
                    + " ROWS FETCH NEXT " + batchSize + " ROWS ONLY";

            List<TempPendingMaster> batchTemps = jdbcTemplate.query(sql, (rs, rowNum) -> {
                long legacyCheckId = rs.getLong("CHECK_ROW_ID");
                MasterChecklist parentChecklist = checklistById.get(legacyCheckId);

                if (parentChecklist == null) {
                    return null;
                }

                ChecklistAssignment assignment = new ChecklistAssignment();
                assignment.setChecklist(parentChecklist);

                String empCdVal = getTrimmedString(rs, "EMP_CODE");
                Long resolvedEmpId = null;
                if (empCdVal != null && !empCdVal.isEmpty()) {
                    resolvedEmpId = empCodeToIdMap.get(empCdVal);
                    if (resolvedEmpId == null) {
                        try {
                            double dVal = Double.parseDouble(empCdVal);
                            resolvedEmpId = empCodeToIdMap.get(String.valueOf((int) dVal));
                        } catch (Exception ignore) {
                        }
                    }
                }
                assignment.setAssignedTo(resolvedEmpId != null ? String.valueOf(resolvedEmpId)
                        : (empCdVal != null && !empCdVal.isEmpty() ? empCdVal : null));

                String assignedByVal = getTrimmedString(rs, "ASSIGNED_BY");
                Long resolvedAssignedBy = null;
                if (assignedByVal != null && !assignedByVal.isEmpty()) {
                    resolvedAssignedBy = empCodeToIdMap.get(assignedByVal);
                    if (resolvedAssignedBy == null) {
                        try {
                            double dVal = Double.parseDouble(assignedByVal);
                            resolvedAssignedBy = empCodeToIdMap.get(String.valueOf((int) dVal));
                        } catch (Exception ignore) {
                        }
                    }
                }
                assignment.setAssignedBy(resolvedAssignedBy != null ? String.valueOf(resolvedAssignedBy)
                        : (assignedByVal != null && !assignedByVal.isEmpty() ? assignedByVal
                                : getTrimmedString(rs, "CREAT_USER_ID_CD")));
                assignment.setAssignedDate(rs.getTimestamp("CREAT_DT"));

                assignment.setRemarks(getTrimmedString(rs, "COMMENTS"));
                assignment.setChecklistDate(rs.getDate("CHECKLIST_DATE"));
                assignment.setCarryForwardCount(rs.getInt("CARRY_FORWARD_COUNT"));

                // Map status
                String legacyStatus = getTrimmedString(rs, "STATUS");
                if (legacyStatus != null) {
                    StatusMaster resolvedStatus = statusMap.get(legacyStatus.toUpperCase());
                    assignment.setStatus(resolvedStatus);
                }

                TempPendingMaster temp = new TempPendingMaster();
                temp.legacyRowId = rs.getInt("ROW_ID");
                temp.assignment = assignment;
                temp.verificationStatus = getTrimmedString(rs, "VERIFICATION_STATUS");
                temp.verificationDate = rs.getTimestamp("VERIFICATION_DATE");
                temp.rejectionComments = getTrimmedString(rs, "REJECTION_COMMENTS");
                temp.lstUpdateUserIdCd = getTrimmedString(rs, "LST_UPDT_USER_ID_CD");
                return temp;
            });

            // Filter out nulls
            List<TempPendingMaster> validTemps = batchTemps.stream()
                    .filter(t -> t != null)
                    .collect(Collectors.toList());

            if (validTemps.isEmpty()) {
                if (batchTemps.isEmpty() || (offset + batchTemps.size()) >= 1000) {
                    hasMore = false;
                } else {
                    totalSkipped += batchTemps.size();
                    offset += batchSize;
                }
                continue;
            }

            // Map files for this batch in a single query
            List<Integer> legacyRowIds = validTemps.stream()
                    .map(t -> t.legacyRowId)
                    .collect(Collectors.toList());

            String idsString = legacyRowIds.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));

            Map<Integer, List<String>> filesByLegacyRowId = new java.util.HashMap<>();
            if (!idsString.isEmpty()) {
                String fileSql = "SELECT ref_row_id, file_name FROM FILE_UPLOAD_TRANS WHERE from_where = 'CLOSE CHECKLIST' AND ref_row_id IN ("
                        + idsString + ")";
                jdbcTemplate.query(fileSql, (rsFile) -> {
                    int refRowId = rsFile.getInt("ref_row_id");
                    String fileName = rsFile.getString("file_name");
                    if (fileName != null && !fileName.trim().isEmpty()) {
                        filesByLegacyRowId.computeIfAbsent(refRowId, k -> new ArrayList<>()).add(fileName.trim());
                    }
                });
            }

            // Set files and IDs on assignments, and migrate files/attachments
            for (TempPendingMaster temp : validTemps) {
                temp.assignment.setId((long) temp.legacyRowId);
                List<String> files = filesByLegacyRowId.get(temp.legacyRowId);
                if (files != null) {
                    temp.assignment.setActualFiles(files);
                }
            }

            // Save assignments in batch using primaryJdbcTemplate to control identity
            // insert
            primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
                String insertAssignSql = "INSERT INTO QMS_CHECKLIST_ASSIGNMENT (id, checklist_id, assigned_to, assigned_by, assigned_date, status_id, remarks, checklist_date, carry_forward, carry_forward_count, assign_type, verified_by, active, created_by, created_date, updated_by, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                String checkAttSql = "SELECT 1 FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE='QM1120' AND REF_ID=? AND FILE_NAME=?";
                String insertAttSql = "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES ('QM1120', ?, 'CLOSE CHECKLIST', ?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)";

                turnOffAllIdentityInserts(conn);
                try (java.sql.Statement stmt = conn.createStatement()) {
                    stmt.execute("SET IDENTITY_INSERT QMS_CHECKLIST_ASSIGNMENT ON");
                } catch (java.sql.SQLException e) {
                    System.err
                            .println("[MIGRATION ERROR] Failed to set IDENTITY_INSERT ON for QMS_CHECKLIST_ASSIGNMENT: "
                                    + e.getMessage());
                }

                try (java.sql.PreparedStatement psAssign = conn.prepareStatement(insertAssignSql);
                        java.sql.PreparedStatement psCheckAtt = conn.prepareStatement(checkAttSql);
                        java.sql.PreparedStatement psInsertAtt = conn.prepareStatement(insertAttSql)) {

                    for (TempPendingMaster temp : validTemps) {
                        ChecklistAssignment assignment = temp.assignment;
                        long assignmentId = temp.legacyRowId;

                        psAssign.setLong(1, assignmentId);
                        psAssign.setObject(2,
                                assignment.getChecklist() != null ? assignment.getChecklist().getId() : null,
                                java.sql.Types.BIGINT);
                        psAssign.setString(3, assignment.getAssignedTo());
                        psAssign.setString(4, assignment.getAssignedBy());
                        psAssign.setTimestamp(5,
                                assignment.getAssignedDate() != null
                                        ? new java.sql.Timestamp(assignment.getAssignedDate().getTime())
                                        : null);
                        psAssign.setObject(6, assignment.getStatus() != null ? assignment.getStatus().getId() : null,
                                java.sql.Types.BIGINT);
                        psAssign.setString(7, assignment.getRemarks());
                        psAssign.setDate(8,
                                assignment.getChecklistDate() != null
                                        ? new java.sql.Date(assignment.getChecklistDate().getTime())
                                        : null);
                        psAssign.setString(9, assignment.getCarryForward());
                        psAssign.setObject(10, assignment.getCarryForwardCount(), java.sql.Types.INTEGER);
                        psAssign.setString(11, assignment.getAssignType());
                        psAssign.setString(12, assignment.getVerifiedBy());
                        psAssign.setBoolean(13, assignment.getIsActive() != null ? assignment.getIsActive() : true);

                        String createdBy = assignment.getCreatedBy() != null ? assignment.getCreatedBy() : "SUPER BOSS";
                        java.sql.Timestamp createdDate = assignment.getCreatedDate() != null
                                ? new java.sql.Timestamp(assignment.getCreatedDate().getTime())
                                : new java.sql.Timestamp(System.currentTimeMillis());

                        psAssign.setString(14, createdBy);
                        psAssign.setTimestamp(15, createdDate);
                        psAssign.setString(16, assignment.getUpdatedBy());
                        psAssign.setTimestamp(17,
                                assignment.getUpdatedAt() != null
                                        ? new java.sql.Timestamp(assignment.getUpdatedAt().getTime())
                                        : null);
                        psAssign.executeUpdate();

                        // Migrate physical files and insert into QMS_ATTACHMENT_PATH
                        if (assignment.getActualFiles() != null) {
                            for (String fileName : assignment.getActualFiles()) {
                                // 1. Physical copy
                                try {
                                    java.io.File sourceFile = new java.io.File(
                                            getSecondaryProcessImgLocation() + "\\HRMS",
                                            fileName);
                                    if (sourceFile.exists()) {
                                        java.nio.file.Path rootPath = fileService.getRootPath();
                                        java.io.File targetDir = rootPath
                                                .resolve(
                                                        AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CLOSE_CHECKLIST_RENEWAL_PATH)
                                                .toFile();
                                        if (!targetDir.exists()) {
                                            targetDir.mkdirs();
                                        }
                                        java.io.File targetFile = new java.io.File(targetDir, fileName);
                                        java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                                                java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                                        System.out.println("[CLOSE CHECKLIST DOC MIGRATION] SUCCESS: Copied "
                                                + sourceFile.getAbsolutePath()
                                                + " to " + targetFile.getAbsolutePath());
                                    } else {
                                        System.err.println(
                                                "[CLOSE CHECKLIST DOC MIGRATION] FAILED: Source file does not exist on disk: "
                                                        + sourceFile.getAbsolutePath());
                                    }
                                } catch (Exception e) {
                                    System.err.println("[CLOSE CHECKLIST DOC MIGRATION] File copy exception for "
                                            + fileName + ": " + e.getMessage());
                                }

                                // 2. DB insertion into QMS_ATTACHMENT_PATH
                                try {
                                    psCheckAtt.setLong(1, assignmentId);
                                    psCheckAtt.setString(2, fileName);
                                    boolean exists = false;
                                    try (java.sql.ResultSet rs = psCheckAtt.executeQuery()) {
                                        if (rs.next()) {
                                            exists = true;
                                        }
                                    }
                                    if (!exists) {
                                        String logicalPath = AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CLOSE_CHECKLIST_RENEWAL_PATH
                                                + "/"
                                                + fileName;
                                        psInsertAtt.setLong(1, assignmentId);
                                        psInsertAtt.setString(2, logicalPath);
                                        psInsertAtt.setString(3, fileName);
                                        psInsertAtt.executeUpdate();
                                    }
                                } catch (Exception e) {
                                    System.err.println("[CLOSE CHECKLIST DOC MIGRATION] DB insert failed for "
                                            + fileName + ": " + e.getMessage());
                                }

                            }
                        }
                    }
                } finally {
                    try (java.sql.Statement stmt = conn.createStatement()) {
                        stmt.execute("SET IDENTITY_INSERT QMS_CHECKLIST_ASSIGNMENT OFF");
                    } catch (java.sql.SQLException e) {
                        System.err.println(
                                "[MIGRATION ERROR] Failed to set IDENTITY_INSERT OFF for QMS_CHECKLIST_ASSIGNMENT: "
                                        + e.getMessage());
                    }
                }
                return null;
            });

            // Now create and save verifications for assignments that have verification
            // status
            List<ChecklistVerification> verificationsToSave = new ArrayList<>();
            for (TempPendingMaster temp : validTemps) {
                if (temp.verificationStatus != null && !temp.verificationStatus.isEmpty()) {
                    StatusMaster resolvedVerStatus = statusMap.get(temp.verificationStatus.toUpperCase());
                    ChecklistVerification verification = new ChecklistVerification();
                    verification.setAssignment(temp.assignment);
                    verification.setVerifiedBy(temp.lstUpdateUserIdCd);
                    verification.setVerifiedDate(
                            temp.verificationDate != null ? temp.verificationDate : temp.assignment.getUpdatedAt());
                    verification.setStatus(resolvedVerStatus);
                    verification.setRemarks(temp.rejectionComments);
                    verificationsToSave.add(verification);
                }
            }

            if (!verificationsToSave.isEmpty()) {
                checklistVerificationRepository.saveAll(verificationsToSave);
            }

            entityManager.flush();
            entityManager.clear();

            totalMigrated += validTemps.size();
            totalSkipped += (batchTemps.size() - validTemps.size());

            if (batchTemps.size() < batchSize || (totalMigrated + totalSkipped) >= 1000 || offset >= 1000) {
                hasMore = false;
            } else {
                offset += batchSize;
            }
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("closeChecklists");
        return "Successfully migrated " + totalMigrated
                + " close checklist records from HRMS_CHECKLIST_PENDING_MASTER to qms_checklist_assignment."
                + (totalSkipped > 0 ? " (Skipped " + totalSkipped + " records with no matching checklist.)" : "");
    }

    // ─── AUDIT AREA MIGRATION ───────────────────────────────────────────────────
    @Transactional
    public String migrateAuditAreas() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }
        String sql = "SELECT * FROM AUDIT_ZONE_AREA_MASTER";

        List<com.autonoma.erp.modules.qms.audit.entity.AuditArea> migratedList = jdbcTemplate.query(sql,
                (rs, rowNum) -> {
                    com.autonoma.erp.modules.qms.audit.entity.AuditArea area = new com.autonoma.erp.modules.qms.audit.entity.AuditArea();

                    area.setType(getTrimmedString(rs, "TYPE"));
                    area.setDescription(getTrimmedString(rs, "DESCRIPTION"));

                    String status = getTrimmedString(rs, "STATUS");
                    area.setIsActive(status == null || "ACTIVE".equalsIgnoreCase(status));

                    area.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                    area.setCreatedAt(rs.getTimestamp("CREAT_DT"));

                    return area;
                });

        int migratedCount = 0;
        if (!migratedList.isEmpty()) {
            for (com.autonoma.erp.modules.qms.audit.entity.AuditArea a : migratedList) {
                // Check by both Type and Description to avoid duplicating identical
                // descriptions that belong to different types (e.g. ZONE vs AREA)
                if (!auditAreaRepository.existsByTypeIgnoreCaseAndDescriptionIgnoreCase(a.getType(),
                        a.getDescription())) {
                    auditAreaRepository.save(a);
                    migratedCount++;
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                            .update("auditAreas", migratedCount);
                }
            }
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("auditAreas");
        return "Successfully migrated " + migratedCount
                + " audit area records from AUDIT_ZONE_AREA_MASTER to QMS_AUDIT_AREA.";
    }

    // ─── AUDIT TYPE MIGRATION ───────────────────────────────────────────────────
    @Transactional
    public String migrateAuditTypes() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }
        String sql = "SELECT * FROM AUDIT_TYPE_MASTER";

        List<com.autonoma.erp.modules.qms.audit.entity.AuditType> migratedList = jdbcTemplate.query(sql,
                (rs, rowNum) -> {
                    com.autonoma.erp.modules.qms.audit.entity.AuditType type = new com.autonoma.erp.modules.qms.audit.entity.AuditType();

                    type.setAuditType(getTrimmedString(rs, "AUDIT_TYPE"));
                    type.setStandard(getTrimmedString(rs, "STD"));
                    type.setDescription(getTrimmedString(rs, "DESCRIPTION"));
                    type.setCriteriaMinCount(rs.getInt("AUDIT_CRITERIA_MIN_COUNT"));
                    type.setAuditArea(getTrimmedString(rs, "AUDIT_AREA"));
                    String status = getTrimmedString(rs, "STATUS");
                    type.setIsActive(status == null || "ACTIVE".equalsIgnoreCase(status));

                    type.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
                    type.setCreatedAt(rs.getTimestamp("CREAT_DT"));

                    return type;
                });

        int migratedCount = 0;
        if (!migratedList.isEmpty()) {
            for (com.autonoma.erp.modules.qms.audit.entity.AuditType t : migratedList) {
                if (t.getAuditType() != null && !auditTypeRepository.existsByAuditTypeIgnoreCase(t.getAuditType())) {
                    auditTypeRepository.save(t);
                    migratedCount++;
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                            .update("auditTypes", migratedCount);
                }
            }
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("auditTypes");
        return "Successfully migrated " + migratedCount
                + " audit type records from AUDIT_TYPE_MASTER to QMS_AUDIT_TYPE.";
    }

    // ─── AUDIT CRITERIA MIGRATION
    // ─────────────────────────────────────────────────
    @Transactional
    public String migrateAuditCriteria(String createdUser) {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }
        String sql = "SELECT * FROM AUDIT_MASTER";

        class TempCriteria {
            int legacyRowId;
            String legacyDeptNo;
            AuditCriteria criteria;
        }

        List<TempCriteria> migratedList = jdbcTemplate.query(sql, (rs, rowNum) -> {
            AuditCriteria criteria = new AuditCriteria();

            criteria.setSeqNo(getTrimmedString(rs, "SEQ_NO"));
            criteria.setAuditType(getTrimmedString(rs, "AUDIT_TYPE"));
            criteria.setClause(getTrimmedString(rs, "CLAUSE"));
            criteria.setCriteriaText(getTrimmedString(rs, "AUDIT_CRITERIA"));
            String deptNo = getTrimmedString(rs, "DEPT_NO");
            if (deptNo != null && !deptNo.trim().isEmpty() && !deptNo.trim().equals(",")) {
                // We will process this as a comma-separated list into QMS_AUDIT_DEPARTMENT
                // later.
            }
            String attReq = getTrimmedString(rs, "ATTACHMENT_REQ");
            criteria.setAttachmentRequired(attReq != null
                    && ("YES".equalsIgnoreCase(attReq) || "1".equals(attReq) || "TRUE".equalsIgnoreCase(attReq)));
            String status = getTrimmedString(rs, "STATUS");
            criteria.setIsActive(status == null || "ACTIVE".equalsIgnoreCase(status));
            criteria.setAttachmentInfo(null);
            criteria.setLevel(null);

            // Set logged-in user as the creator; fall back to safe values if absent
            if (createdUser != null && !createdUser.trim().isEmpty()) {
                criteria.setCreatedUser(createdUser);
                criteria.setUpdatedUser(createdUser);
            }
            criteria.setCreatedDate(rs.getTimestamp("CREAT_DT"));
            criteria.setUpdatedDate(rs.getTimestamp("LST_UPDT_TS"));

            if (stopFlag.get())
                return null;

            TempCriteria temp = new TempCriteria();
            temp.legacyRowId = rs.getInt("ROW_ID");
            temp.legacyDeptNo = deptNo;
            temp.criteria = criteria;
            return temp;
        });

        // Filter out nulls from stop signal
        migratedList = migratedList.stream().filter(c -> c != null).collect(Collectors.toList());

        if (stopFlag.get()) {
            return "Migration stopped by user. Migrated 0 criteria records.";
        }

        int migratedCount = 0;
        int fileCount = 0;
        for (TempCriteria t : migratedList) {
            AuditCriteria c = t.criteria;
            // Unconditionally save all legacy records (no duplicate check per user request)
            AuditCriteria saved = auditCriteriaRepository.save(c);
            migratedCount++;

            // Migrate departments to QMS_AUDIT_DEPARTMENT
            if (t.legacyDeptNo != null && !t.legacyDeptNo.trim().isEmpty() && !t.legacyDeptNo.trim().equals(",")) {
                String[] parts = t.legacyDeptNo.split(",");
                for (String p : parts) {
                    if (p.trim().length() > 0) {
                        departmentRepository.findByDepartmentNo(p.trim()).ifPresent(d -> {
                            com.autonoma.erp.modules.qms.audit.entity.AuditDepartment ad = new com.autonoma.erp.modules.qms.audit.entity.AuditDepartment();
                            ad.setPageCode("M1130");
                            ad.setRefId(saved.getId());
                            ad.setDeptId(d.getId());
                            ad.setCreatedBy(saved.getCreatedUser());
                            ad.setCreatedDate(saved.getCreatedDate());
                            ad.setUpdatedBy(saved.getUpdatedUser());
                            ad.setUpdatedDate(saved.getUpdatedDate());
                            auditDepartmentRepository.save(ad);
                        });
                    }
                }
            }

            // Migrate attachments dynamically
            try {
                String fileSql = "SELECT FILE_NAME FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE = 'AUDIT_CRITERIA' AND REF_ROW_ID = "
                        + t.legacyRowId;
                List<String> files = jdbcTemplate.queryForList(fileSql, String.class);
                for (String fileName : files) {
                    if (fileName == null || fileName.trim().isEmpty())
                        continue;
                    fileName = fileName.trim();

                    // Copy physical file
                    java.io.File sourceFile = new java.io.File(getSecondaryProcessImgLocation() + "\\AUDIT", fileName);
                    if (sourceFile.exists()) {
                        java.nio.file.Path rootPath = fileService.getRootPath();
                        java.io.File targetDir = rootPath
                                .resolve(AppUtil.BosDocConstants.MASTER_QMS_AUDIT_AUDIT_CRITERIA_PATH).toFile();
                        if (!targetDir.exists())
                            targetDir.mkdirs();
                        java.io.File targetFile = new java.io.File(targetDir, fileName);
                        java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                                java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                        System.out.println("[ATTACHMENT MIGRATION] SUCCESS: Copied " + sourceFile.getAbsolutePath()
                                + " to " + targetFile.getAbsolutePath());
                    } else {
                        System.err.println("[ATTACHMENT MIGRATION] FAILED: Source file does not exist on disk: "
                                + sourceFile.getAbsolutePath());
                    }

                    // Insert into QMS_ATTACHMENT_PATH
                    List<?> existingAtt = entityManager.createNativeQuery(
                            "SELECT 1 FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE='M1130' AND REF_ID=? AND FILE_NAME=?")
                            .setParameter(1, saved.getId())
                            .setParameter(2, fileName)
                            .getResultList();

                    if (existingAtt.isEmpty()) {
                        String logicalPath = AppUtil.BosDocConstants.MASTER_QMS_AUDIT_AUDIT_CRITERIA_PATH + "/"
                                + fileName;
                        entityManager.createNativeQuery(
                                "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, 'AUDIT CRITERIA', ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)")
                                .setParameter(1, "M1130")
                                .setParameter(2, saved.getId())
                                .setParameter(3, logicalPath)
                                .setParameter(4, fileName)
                                .setParameter(5, saved.getCreatedUser() != null ? saved.getCreatedUser() : "SUPER BOSS")
                                .setParameter(6, saved.getUpdatedUser() != null ? saved.getUpdatedUser() : "SUPER BOSS")
                                .executeUpdate();
                        fileCount++;
                    }
                }
            } catch (Exception e) {
                System.err.println("Error migrating attachments for AuditCriteria legacy row " + t.legacyRowId + ": "
                        + e.getMessage());
            }
        }

        int skipped = migratedList.size() - migratedCount;
        return "Successfully migrated " + migratedCount
                + " criteria records from AUDIT_MASTER to QMS_AUDIT_CRITERIA."
                + (skipped > 0 ? " (Skipped " + skipped + " duplicate records.)" : "");
    }

    @Transactional
    public String clearAuditSchedules() {
        try {
            entityManager.createNativeQuery("DELETE FROM QMS_AUDIT_SCHEDULE_CRITERIA").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM QMS_AUDIT_SCHEDULE").executeUpdate();

            entityManager.createNativeQuery("DBCC CHECKIDENT ('QMS_AUDIT_SCHEDULE_CRITERIA', RESEED, 0)")
                    .executeUpdate();
            entityManager.createNativeQuery("DBCC CHECKIDENT ('QMS_AUDIT_SCHEDULE', RESEED, 0)").executeUpdate();
        } catch (Exception e) {
            System.err.println("Failed to clear Audit Schedules: " + e.getMessage());
            return "Error clearing audit schedules: " + e.getMessage();
        }
        return "Cleared all audit schedules.";
    }

    @Transactional
    public String migrateAuditSchedules() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        String sqlMaster = "SELECT * FROM AUDIT_SCHEDULE_MASTER";
        int migratedMaster = 0;
        int migratedTrans = 0;

        try {
            List<Map<String, Object>> masters = jdbcTemplate.queryForList(sqlMaster);
            for (Map<String, Object> master : masters) {
                if (stopFlag.get()) {
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                            .fail("auditSchedules");
                    return "Migration stopped manually.";
                }
                Long legacyId = master.get("ROW_ID") != null ? ((Number) master.get("ROW_ID")).longValue() : null;
                if (legacyId == null)
                    continue;

                // Lookup relations
                Object typeObj = master.get("AUDIT_TYPE");
                Long typeId = null;
                if (typeObj != null) {
                    try {
                        String legacyTypeStr = jdbcTemplate.queryForObject(
                                "SELECT AUDIT_TYPE FROM AUDIT_TYPE_MASTER WHERE ROW_ID = ?", String.class, typeObj);
                        if (legacyTypeStr != null) {
                            List<?> types = entityManager
                                    .createNativeQuery("SELECT id FROM QMS_AUDIT_TYPE WHERE AUDIT_TYPE = ?")
                                    .setParameter(1, legacyTypeStr).getResultList();
                            if (!types.isEmpty())
                                typeId = ((Number) types.get(0)).longValue();
                        }
                    } catch (Exception e) {
                        List<?> types = entityManager
                                .createNativeQuery("SELECT id FROM QMS_AUDIT_TYPE WHERE AUDIT_TYPE = ?")
                                .setParameter(1, String.valueOf(typeObj)).getResultList();
                        if (!types.isEmpty())
                            typeId = ((Number) types.get(0)).longValue();
                    }
                }

                Object areaObj = master.get("AUDIT_AREA");
                Long areaId = null;
                if (areaObj != null) {
                    try {
                        String legacyAreaStr = jdbcTemplate.queryForObject(
                                "SELECT DESCRIPTION FROM AUDIT_ZONE_AREA_MASTER WHERE ROW_ID = ?", String.class,
                                areaObj);
                        if (legacyAreaStr != null) {
                            List<?> areas = entityManager
                                    .createNativeQuery("SELECT id FROM QMS_AUDIT_AREA WHERE DESCRIPTION = ?")
                                    .setParameter(1, legacyAreaStr).getResultList();
                            if (!areas.isEmpty())
                                areaId = ((Number) areas.get(0)).longValue();
                        }
                    } catch (Exception e) {
                        List<?> areas = entityManager
                                .createNativeQuery("SELECT id FROM QMS_AUDIT_AREA WHERE DESCRIPTION = ?")
                                .setParameter(1, String.valueOf(areaObj)).getResultList();
                        if (!areas.isEmpty())
                            areaId = ((Number) areas.get(0)).longValue();
                    }
                }

                Long deptId = null;
                Object deptObj = master.get("DEPT_NO");
                if (deptObj != null) {
                    try {
                        String legacyDeptNo = jdbcTemplate.queryForObject("SELECT DEPT_NO FROM DEPT WHERE ROW_ID = ?",
                                String.class, deptObj);
                        if (legacyDeptNo != null) {
                            List<?> depts = entityManager
                                    .createNativeQuery("SELECT id FROM HR_DEPARTMENT WHERE DEPARTMENT_NO = ?")
                                    .setParameter(1, legacyDeptNo).getResultList();
                            if (!depts.isEmpty())
                                deptId = ((Number) depts.get(0)).longValue();
                        }
                    } catch (Exception e) {
                        List<?> depts = entityManager
                                .createNativeQuery("SELECT id FROM HR_DEPARTMENT WHERE DEPARTMENT_NO = ?")
                                .setParameter(1, String.valueOf(deptObj)).getResultList();
                        if (!depts.isEmpty())
                            deptId = ((Number) depts.get(0)).longValue();
                    }
                }

                Object oldAuditee = master.get("AUDITEE_ID");
                Object oldAuditor = master.get("AUDITOR_ID");
                Object oldNcrApp = master.get("NCR_APP_ID") != null ? master.get("NCR_APP_ID")
                        : master.get("NCR_APPROVED_BY");

                Long auditeeId = getEmployeeIdByEmpCode(oldAuditee != null ? String.valueOf(oldAuditee) : null);
                Long auditorId = getEmployeeIdByEmpCode(oldAuditor != null ? String.valueOf(oldAuditor) : null);
                Long ncrApprovedById = getEmployeeIdByEmpCode(oldNcrApp != null ? String.valueOf(oldNcrApp) : null);

                String scheduleNo = master.get("SCH_NO") != null ? String.valueOf(master.get("SCH_NO")) : "UNKNOWN";
                if (oldAuditee != null && auditeeId == null) {
                    System.out.println("[MIGRATION WARNING] Auditee EMP_CODE '" + oldAuditee
                            + "' not found in HR_EMPLOYEE for Schedule: " + scheduleNo);
                }
                if (oldAuditor != null && auditorId == null) {
                    System.out.println("[MIGRATION WARNING] Auditor EMP_CODE '" + oldAuditor
                            + "' not found in HR_EMPLOYEE for Schedule: " + scheduleNo);
                }
                if (oldNcrApp != null && ncrApprovedById == null) {
                    System.out.println("[MIGRATION WARNING] NCR Approved By EMP_CODE '" + oldNcrApp
                            + "' not found in HR_EMPLOYEE for Schedule: " + scheduleNo);
                }

                String insertSchedule = "INSERT INTO QMS_AUDIT_SCHEDULE (SCHEDULE_NO, AUDIT_DATE, SCHEDULE_DATE, " +
                        "AUDIT_TYPE_ID, AUDIT_AREA_ID, DEPARTMENT_ID, AUDITEE_ID, AUDITOR_ID, NCR_APPROVED_BY_ID, STATUS, "
                        +
                        "START_TIME, END_TIME, RESCHEDULE_COUNT, EMAIL_TO_CUSTOMER, FROM_EMAIL_TO_CUSTOMER, " +
                        "CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, IS_ACTIVE, FREQUENCY) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'NONE')";

                entityManager.createNativeQuery(insertSchedule)
                        .setParameter(1, master.get("SCH_NO"))
                        .setParameter(2, master.get("AUDIT_DATE"))
                        .setParameter(3, master.get("SCH_DATE"))
                        .setParameter(4, typeId)
                        .setParameter(5, areaId)
                        .setParameter(6, deptId)
                        .setParameter(7, auditeeId)
                        .setParameter(8, auditorId)
                        .setParameter(9, ncrApprovedById)
                        .setParameter(10, master.get("STATUS"))
                        .setParameter(11, master.get("START_TIME"))
                        .setParameter(12, master.get("END_TIME"))
                        .setParameter(13, master.get("RESCHEDULE_COUNT") != null ? master.get("RESCHEDULE_COUNT") : 0)
                        .setParameter(14, master.get("EMAIL_TO_CUSTOMER"))
                        .setParameter(15, master.get("FROM_EMAIL_TO_CUSTOMER"))
                        .setParameter(16, resolveUser(master.get("CREAT_USER_ID_CD")))
                        .setParameter(17, master.get("CREAT_DT"))
                        .setParameter(18, resolveUser(master.get("LST_UPDT_USER_ID_CD")))
                        .setParameter(19, master.get("LST_UPDT_TS"))
                        .executeUpdate();

                // Get the generated ID for the master record
                List<?> newIdList = entityManager.createNativeQuery("SELECT IDENT_CURRENT('QMS_AUDIT_SCHEDULE')")
                        .getResultList();
                Long newScheduleId = ((Number) newIdList.get(0)).longValue();

                // Now migrate transactions for this master
                List<Map<String, Object>> transRecords = jdbcTemplate
                        .queryForList("SELECT * FROM AUDIT_SCHEDULE_TRANS WHERE SCH_ROW_ID = ?", legacyId);
                for (Map<String, Object> trans : transRecords) {
                    String insertCriteria = "INSERT INTO QMS_AUDIT_SCHEDULE_CRITERIA (AUDIT_SCHEDULE_ID, SEQ_NO, CLAUSE, "
                            +
                            "CRITERIA_DETAILS, REMARKS, IS_ACTIVE, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, ATTACHMENT_REQ) "
                            +
                            "VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)";

                    Boolean attReq = null;
                    String attReqStr = (String) trans.get("ATTACHMENT_REQ");
                    if ("YES".equalsIgnoreCase(attReqStr) || "1".equals(attReqStr) || "Y".equalsIgnoreCase(attReqStr)) {
                        attReq = true;
                    } else if ("NO".equalsIgnoreCase(attReqStr) || "0".equals(attReqStr)
                            || "N".equalsIgnoreCase(attReqStr)) {
                        attReq = false;
                    }

                    entityManager.createNativeQuery(insertCriteria)
                            .setParameter(1, newScheduleId)
                            .setParameter(2, trans.get("SEQ_NO") != null ? String.valueOf(trans.get("SEQ_NO")) : null)
                            .setParameter(3, trans.get("CLAUSE"))
                            .setParameter(4, trans.get("CRITERIA_DETAILS"))
                            .setParameter(5, trans.get("REMARKS"))
                            .setParameter(6, resolveUser(trans.get("CREAT_USER_ID_CD")))
                            .setParameter(7, trans.get("CREAT_DT"))
                            .setParameter(8, resolveUser(trans.get("LST_UPDT_USER_ID_CD")))
                            .setParameter(9, trans.get("LST_UPDT_TS"))
                            .setParameter(10, attReq)
                            .executeUpdate();
                    migratedTrans++;
                }

                migratedMaster++;
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to migrate Audit Schedules: " + e.getMessage());
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("auditSchedules");
        return "Successfully migrated " + migratedMaster + " schedules and " + migratedTrans
                + " schedule criteria records.";
    }

    // ─── AUDIT USER ATTENDANCE MIGRATION ─────────────────────────────────────────
    @Transactional
    public String migrateAuditAttendances() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        java.util.Set<String> validUsers = new java.util.HashSet<>();
        try {
            java.util.List<String> userIds = entityManager.createNativeQuery("SELECT USER_ID FROM AD_USER_CREDENTIAL")
                    .getResultList();
            for (String u : userIds) {
                if (u != null)
                    validUsers.add(u.toUpperCase());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // To safely fetch, we'll try pulling fields using a map
        List<Map<String, Object>> records;
        try {
            records = jdbcTemplate.queryForList("SELECT * FROM AUDIT_USER_ATTENDANCE");
        } catch (Exception e) {
            return "Failed to fetch from AUDIT_USER_ATTENDANCE: " + e.getMessage();
        }

        int migratedCount = 0;
        int skippedCount = 0;

        for (Map<String, Object> record : records) {
            if (stopFlag.get()) {
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .fail("auditAttendances");
                return "Migration stopped manually.";
            }
            try {
                // 1. Audit Schedule No mapping
                String schNoStr = null;
                Object schObj = record.get("SCH_NO");
                if (schObj == null) {
                    schObj = record.get("SCH_ROW_ID");
                }
                if (schObj == null) {
                    schObj = record.get("AUDIT_SCHEDULE_NO");
                }

                if (schObj != null) {
                    String valStr = String.valueOf(schObj).trim();
                    if (valStr.matches("^\\d+$")) {
                        try {
                            schNoStr = jdbcTemplate.queryForObject(
                                    "SELECT SCH_NO FROM AUDIT_SCHEDULE_MASTER WHERE ROW_ID = ?", String.class,
                                    Integer.parseInt(valStr));
                        } catch (Exception e) {
                            schNoStr = valStr;
                        }
                    } else {
                        schNoStr = valStr;
                    }
                }

                if (schNoStr == null || schNoStr.trim().isEmpty()) {
                    if (skippedCount < 5) {
                        System.out.println("SKIPPED AUDIT ATTENDANCE (Missing Schedule No). Record: " + record);
                    }
                    skippedCount++;
                    continue; // Orphan or missing
                }

                // Lookup target schedule ID from QMS_AUDIT_SCHEDULE
                Long scheduleIdVal = null;
                if (schNoStr != null) {
                    try {
                        List<?> sIds = entityManager.createNativeQuery(
                                "SELECT id FROM QMS_AUDIT_SCHEDULE WHERE SCHEDULE_NO = ? OR CAST(id AS VARCHAR) = ?")
                                .setParameter(1, schNoStr.trim())
                                .setParameter(2, schNoStr.trim())
                                .getResultList();
                        if (!sIds.isEmpty() && sIds.get(0) != null) {
                            scheduleIdVal = ((Number) sIds.get(0)).longValue();
                        }
                    } catch (Exception ignore) {
                    }
                }

                // 2. Employee mapping
                Long empId = null;
                Object empObj = record.get("AUDIT_EMPCODE"); // The user specified column
                if (empObj == null)
                    empObj = record.get("USER_ID");
                if (empObj == null)
                    empObj = record.get("EMPLOYEE_ID");
                if (empObj == null)
                    empObj = record.get("EMP_ID");

                if (empObj != null) {
                    try {
                        // First try direct mapping since AUDIT_EMPCODE is usually the EMP_CODE itself
                        List<?> users = entityManager.createNativeQuery("SELECT id FROM HR_EMPLOYEE WHERE EMP_CODE = ?")
                                .setParameter(1, String.valueOf(empObj)).getResultList();
                        if (!users.isEmpty()) {
                            empId = ((Number) users.get(0)).longValue();
                        } else {
                            // If it's not the emp code directly, try looking it up as ROW_ID in legacy
                            // EMPLOYEE table
                            String legacyEmpCode = jdbcTemplate.queryForObject(
                                    "SELECT EMP_CODE FROM EMPLOYEE WHERE ID = ? OR ROW_ID = ?", String.class, empObj,
                                    empObj);
                            if (legacyEmpCode != null) {
                                users = entityManager.createNativeQuery("SELECT id FROM HR_EMPLOYEE WHERE EMP_CODE = ?")
                                        .setParameter(1, legacyEmpCode).getResultList();
                                if (!users.isEmpty())
                                    empId = ((Number) users.get(0)).longValue();
                            }
                        }
                    } catch (Exception e) {
                        // Ignore exception and leave empId as null if not found
                    }
                }

                if (empId == null) {
                    if (skippedCount < 5) {
                        System.out.println("SKIPPED AUDIT ATTENDANCE (Missing Employee mapping). empObj=" + empObj
                                + ", Record: " + record);
                    }
                    skippedCount++;
                    continue; // Skip if no user mapped
                }

                String inTime = record.get("IN_TIME") != null ? String.valueOf(record.get("IN_TIME")) : null;
                String outTime = record.get("OUT_TIME") != null ? String.valueOf(record.get("OUT_TIME")) : null;
                String attStatus = record.get("ATTENDANCE_STATUS") != null
                        ? String.valueOf(record.get("ATTENDANCE_STATUS"))
                        : null;
                if (attStatus == null)
                    attStatus = record.get("STATUS") != null ? String.valueOf(record.get("STATUS")) : "Present";

                String isActiveStr = record.get("IS_ACTIVE") != null ? String.valueOf(record.get("IS_ACTIVE")) : "1";
                boolean isActive = isActiveStr.equalsIgnoreCase("ACTIVE") || isActiveStr.equals("1")
                        || isActiveStr.equalsIgnoreCase("Y");

                String insertSql = "INSERT INTO QMS_AUDIT_ATTENDANCE (AUDIT_SCH_ID, EMPLOYEE_ID, IN_TIME, OUT_TIME, ATTENDANCE_STATUS, IS_ACTIVE, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) "
                        +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                String loggedInUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                if (loggedInUser == null)
                    loggedInUser = "SUPER BOSS";

                String cUser = record.get("CREATE_USER_ID") != null ? String.valueOf(record.get("CREATE_USER_ID"))
                        : loggedInUser;
                if (!validUsers.contains(cUser.toUpperCase()))
                    cUser = loggedInUser;

                String uUser = record.get("LAST_UPDT_USER_ID") != null ? String.valueOf(record.get("LAST_UPDT_USER_ID"))
                        : null;
                if (uUser != null && !validUsers.contains(uUser.toUpperCase()))
                    uUser = null;

                entityManager.createNativeQuery(insertSql)
                        .setParameter(1, scheduleIdVal)
                        .setParameter(2, empId)
                        .setParameter(3, inTime)
                        .setParameter(4, outTime)
                        .setParameter(5, attStatus)
                        .setParameter(6, isActive ? 1 : 0)
                        .setParameter(7, cUser)
                        .setParameter(8,
                                record.get("CREATE_DT") != null ? record.get("CREATE_DT") : new java.util.Date())
                        .setParameter(9, uUser)
                        .setParameter(10, record.get("LAST_UPDT_DT"))
                        .executeUpdate();

                migratedCount++;
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .update("auditAttendances", migratedCount);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }

        String debugMsg = "";
        if (!records.isEmpty() && migratedCount == 0) {
            Map<String, Object> first = records.get(0);
            debugMsg = " First record columns: " + first.keySet().toString() + " | values: "
                    + first.values().toString();
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("auditAttendances");
        return "Successfully migrated " + migratedCount + " audit attendance records. Skipped: " + skippedCount + "."
                + debugMsg;
    }

    // ─── AUDIT OBSERVATION MIGRATION ─────────────────────────────────────────────
    @Transactional
    public String migrateAuditObservations() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        int migratedMaster = 0;
        int migratedTrans = 0;

        try {
            java.util.Map<String, Long> statusIdMap = new java.util.HashMap<>();
            // 1. Fetch Masters
            List<Map<String, Object>> masters = jdbcTemplate.queryForList("SELECT * FROM AUDIT_OBSERVATION_MASTER");
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start("auditObservations",
                    masters.size());

            String insertMaster = "INSERT INTO QMS_AUDIT_OBSERVATION (" +
                    "OBSERVATION_NO, OBSERVATION_DATE, AUDIT_SCHEDULE_NO, AUDIT_TYPE_ID, AUDIT_AREA_ID, " +
                    "DEPARTMENT_ID, AUDITEE_ID, AUDITOR_ID, NCR_APPROVED_BY_ID, STATUS, " +
                    "AUDIT_SCORE, OFI_COUNT, COMPLIANCE_COUNT, NCR_COUNT, IS_ACTIVE, " +
                    "CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            String insertDetail = "INSERT INTO QMS_AUDIT_OBSERVATION_DETAIL (" +
                    "OBSERVATION_ID, NCR_NO, SEQ_NO, CLAUSE, CRITERIA_DETAILS, ATTACHMENT_REQ, " +
                    "OBSERVATION_STATUS, APPROVAL_STATUS, COMMENTS, ROOT_CAUSE, CORRECTIVE_ACTION, " +
                    "PREVENTIVE_ACTION, TARGET_DATE, CLOSED_DATE, CLOSED_BY, NCR_STATUS, " +
                    "CANCEL_REMARKS, REV_NO, IS_ACTIVE, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            for (Map<String, Object> master : masters) {
                if (stopFlag.get()) {
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                            .fail("auditObservations");
                    return "Migration stopped manually.";
                }

                // FK resolution
                Long auditTypeId = null;
                Object typeObj = master.get("AUDIT_TYPE");
                if (typeObj != null) {
                    try {
                        String legacyType = jdbcTemplate.queryForObject(
                                "SELECT AUDIT_TYPE FROM AUDIT_TYPE_MASTER WHERE ROW_ID = ?", String.class, typeObj);
                        if (legacyType != null) {
                            List<?> types = entityManager
                                    .createNativeQuery("SELECT id FROM QMS_AUDIT_TYPE WHERE AUDIT_TYPE = ?")
                                    .setParameter(1, legacyType).getResultList();
                            if (!types.isEmpty())
                                auditTypeId = ((Number) types.get(0)).longValue();
                        }
                    } catch (Exception e) {
                        List<?> types = entityManager
                                .createNativeQuery("SELECT id FROM QMS_AUDIT_TYPE WHERE AUDIT_TYPE = ?")
                                .setParameter(1, String.valueOf(typeObj)).getResultList();
                        if (!types.isEmpty())
                            auditTypeId = ((Number) types.get(0)).longValue();
                    }
                }

                Long auditAreaId = null;
                Object areaObj = master.get("AUDIT_AREA");
                if (areaObj != null) {
                    try {
                        String legacyArea = jdbcTemplate.queryForObject(
                                "SELECT DESCRIPTION FROM AUDIT_ZONE_AREA_MASTER WHERE ROW_ID = ?", String.class,
                                areaObj);
                        if (legacyArea != null) {
                            List<?> areas = entityManager
                                    .createNativeQuery("SELECT id FROM QMS_AUDIT_AREA WHERE DESCRIPTION = ?")
                                    .setParameter(1, legacyArea).getResultList();
                            if (!areas.isEmpty())
                                auditAreaId = ((Number) areas.get(0)).longValue();
                        }
                    } catch (Exception e) {
                        List<?> areas = entityManager
                                .createNativeQuery("SELECT id FROM QMS_AUDIT_AREA WHERE DESCRIPTION = ?")
                                .setParameter(1, String.valueOf(areaObj)).getResultList();
                        if (!areas.isEmpty())
                            auditAreaId = ((Number) areas.get(0)).longValue();
                    }
                }

                Long deptId = null;
                Object deptObj = master.get("DEPT_NO");
                if (deptObj != null) {
                    try {
                        String legacyDeptNo = jdbcTemplate.queryForObject("SELECT DEPT_NO FROM DEPT WHERE ROW_ID = ?",
                                String.class, deptObj);
                        if (legacyDeptNo != null) {
                            List<?> depts = entityManager
                                    .createNativeQuery("SELECT id FROM HR_DEPARTMENT WHERE DEPARTMENT_NO = ?")
                                    .setParameter(1, legacyDeptNo).getResultList();
                            if (!depts.isEmpty())
                                deptId = ((Number) depts.get(0)).longValue();
                        }
                    } catch (Exception e) {
                        List<?> depts = entityManager
                                .createNativeQuery("SELECT id FROM HR_DEPARTMENT WHERE DEPARTMENT_NO = ?")
                                .setParameter(1, String.valueOf(deptObj)).getResultList();
                        if (!depts.isEmpty())
                            deptId = ((Number) depts.get(0)).longValue();
                    }
                }

                Object oldAuditee = master.get("AUDITEE_ID");
                Object oldAuditor = master.get("AUDITOR_ID");
                Object oldNcrApp = master.get("NCR_APP_ID") != null ? master.get("NCR_APP_ID")
                        : master.get("NCR_APPROVED_BY");

                Long auditeeId = getEmployeeIdByEmpCode(oldAuditee != null ? String.valueOf(oldAuditee) : null);
                Long auditorId = getEmployeeIdByEmpCode(oldAuditor != null ? String.valueOf(oldAuditor) : null);
                Long ncrApprovedById = getEmployeeIdByEmpCode(oldNcrApp != null ? String.valueOf(oldNcrApp) : null);

                String observationNo = master.get("OBR_NO") != null ? String.valueOf(master.get("OBR_NO"))
                        : (master.get("OBSERVATION_NO") != null ? String.valueOf(master.get("OBSERVATION_NO"))
                                : String.valueOf(master.get("ROW_ID")));

                if (oldAuditee != null && auditeeId == null) {
                    System.out.println("[MIGRATION WARNING] Auditee EMP_CODE '" + oldAuditee
                            + "' not found in HR_EMPLOYEE for Observation: " + observationNo);
                }
                if (oldAuditor != null && auditorId == null) {
                    System.out.println("[MIGRATION WARNING] Auditor EMP_CODE '" + oldAuditor
                            + "' not found in HR_EMPLOYEE for Observation: " + observationNo);
                }
                if (oldNcrApp != null && ncrApprovedById == null) {
                    System.out.println("[MIGRATION WARNING] NCR Approved By EMP_CODE '" + oldNcrApp
                            + "' not found in HR_EMPLOYEE for Observation: " + observationNo);
                }

                String schNoStr = null;
                Object schObj = master.get("SCH_NO");
                if (schObj != null) {
                    try {
                        String legacySchNo = jdbcTemplate.queryForObject(
                                "SELECT SCH_NO FROM AUDIT_SCHEDULE_MASTER WHERE ROW_ID = ?", String.class, schObj);
                        schNoStr = legacySchNo;
                    } catch (Exception e) {
                        schNoStr = String.valueOf(schObj);
                    }
                }

                // Look up Auditor and NCR Approved By from the already migrated schedule using
                // schNoStr
                if (schNoStr != null) {
                    try {
                        List<?> scheduleInfo = entityManager.createNativeQuery(
                                "SELECT AUDITOR_ID, NCR_APPROVED_BY_ID FROM QMS_AUDIT_SCHEDULE WHERE SCHEDULE_NO = ?")
                                .setParameter(1, schNoStr)
                                .getResultList();
                        if (!scheduleInfo.isEmpty() && scheduleInfo.get(0) != null) {
                            Object[] row = (Object[]) scheduleInfo.get(0);
                            if (row[0] != null) {
                                auditorId = ((Number) row[0]).longValue();
                            }
                            if (row[1] != null) {
                                ncrApprovedById = ((Number) row[1]).longValue();
                            }
                        }
                    } catch (Exception e) {
                        System.err.println(
                                "Failed to lookup auditor/ncrApprovedById from QMS_AUDIT_SCHEDULE: " + e.getMessage());
                    }
                }

                String obsNoStr = master.get("OBR_NO") != null ? String.valueOf(master.get("OBR_NO"))
                        : (master.get("OBSERVATION_NO") != null ? String.valueOf(master.get("OBSERVATION_NO"))
                                : String.valueOf(master.get("ROW_ID")));

                Object obsDateVal = master.get("OBR_DATE") != null ? master.get("OBR_DATE")
                        : master.get("OBSERVATION_DATE");

                String status = master.get("STATUS") != null ? String.valueOf(master.get("STATUS")) : "Draft";
                boolean isActive = "ACTIVE".equalsIgnoreCase(status) || "1".equals(status) || status == null;

                entityManager.createNativeQuery(insertMaster)
                        .setParameter(1, obsNoStr)
                        .setParameter(2, obsDateVal)
                        .setParameter(3, schNoStr)
                        .setParameter(4, auditTypeId)
                        .setParameter(5, auditAreaId)
                        .setParameter(6, deptId)
                        .setParameter(7, auditeeId)
                        .setParameter(8, auditorId)
                        .setParameter(9, ncrApprovedById)
                        .setParameter(10, status)
                        .setParameter(11, master.get("AUDIT_SCORE") != null ? master.get("AUDIT_SCORE") : 0)
                        .setParameter(12, master.get("OFI_COUNT") != null ? master.get("OFI_COUNT") : 0)
                        .setParameter(13, master.get("COMPLIANCE_COUNT") != null ? master.get("COMPLIANCE_COUNT") : 0)
                        .setParameter(14, master.get("NCR_COUNT") != null ? master.get("NCR_COUNT") : 0)
                        .setParameter(15, isActive ? 1 : 0)
                        .setParameter(16, resolveUser(master.get("CREAT_USER_ID_CD")))
                        .setParameter(17, master.get("CREAT_DT"))
                        .setParameter(18, resolveUser(master.get("LST_UPDT_USER_ID_CD")))
                        .setParameter(19, master.get("LST_UPDT_TS"))
                        .executeUpdate();

                // Get ID of inserted master
                List<?> ids = entityManager.createNativeQuery("SELECT IDENT_CURRENT('QMS_AUDIT_OBSERVATION')")
                        .getResultList();
                if (ids.isEmpty() || ids.get(0) == null)
                    continue;
                Long newObservationId = ((Number) ids.get(0)).longValue();

                // 2. Fetch and insert trans records
                List<Map<String, Object>> transRecords;
                try {
                    transRecords = jdbcTemplate.queryForList(
                            "SELECT * FROM AUDIT_OBSERVATION_TRANS WHERE OBR_ROW_ID = ?", master.get("ROW_ID"));
                } catch (Exception e) {
                    try {
                        transRecords = jdbcTemplate.queryForList(
                                "SELECT * FROM AUDIT_OBSERVATION_TRANS WHERE OBSERVATION_ROW_ID = ?",
                                master.get("ROW_ID"));
                    } catch (Exception ex) {
                        try {
                            transRecords = jdbcTemplate.queryForList(
                                    "SELECT * FROM AUDIT_OBSERVATION_TRANS WHERE OBSERVATION_NO = ?", obsNoStr);
                        } catch (Exception ex2) {
                            transRecords = new java.util.ArrayList<>();
                        }
                    }
                }

                for (Map<String, Object> trans : transRecords) {
                    String dStatus = trans.get("STATUS") != null ? String.valueOf(trans.get("STATUS")) : "ACTIVE";
                    boolean dIsActive = "ACTIVE".equalsIgnoreCase(dStatus) || "1".equals(dStatus);

                    String attReqStr = trans.get("ATTACHMENT_REQ") != null ? String.valueOf(trans.get("ATTACHMENT_REQ"))
                            : "0";
                    boolean attReq = "YES".equalsIgnoreCase(attReqStr) || "1".equals(attReqStr)
                            || "TRUE".equalsIgnoreCase(attReqStr);

                    Object legacyNcrStatusObj = trans.get("NCR_APPRVAL") != null ? trans.get("NCR_APPRVAL")
                            : (trans.get("ncr_apprval") != null ? trans.get("ncr_apprval")
                                    : (trans.get("NCR_STATUS") != null ? trans.get("NCR_STATUS")
                                            : trans.get("ncr_status")));
                    Long ncrStatusId = null;
                    if (legacyNcrStatusObj != null) {
                        String ncrStatusStr = String.valueOf(legacyNcrStatusObj).trim();
                        if ("APPROVED".equalsIgnoreCase(ncrStatusStr)) {
                            ncrStatusStr = "VERIFIED";
                        } else if ("PENDING FOR APPROVAL".equalsIgnoreCase(ncrStatusStr)) {
                            ncrStatusStr = "PENDING FOR VERIFY";
                        }
                        if (!ncrStatusStr.isEmpty()) {
                            ncrStatusId = getOrCreateStatusId(ncrStatusStr, statusIdMap);
                        }
                    }

                    entityManager.createNativeQuery(insertDetail)
                            .setParameter(1, newObservationId)
                            .setParameter(2, trans.get("NCR_NO"))
                            .setParameter(3, trans.get("SEQ_NO") != null ? String.valueOf(trans.get("SEQ_NO")) : null)
                            .setParameter(4, trans.get("CLAUSE"))
                            .setParameter(5, trans.get("CRITERIA_DETAILS"))
                            .setParameter(6, attReq ? 1 : 0)
                            .setParameter(7, trans.get("OBR_STATUS") != null ? trans.get("OBR_STATUS")
                                    : (trans.get("obr_status") != null ? trans.get("obr_status")
                                            : (trans.get("OBSERVATION_STATUS") != null ? trans.get("OBSERVATION_STATUS")
                                                    : trans.get("observation_status"))))
                            .setParameter(8, (trans.get("APPROVAL_STATUS") != null)
                                    ? ("APPROVED".equalsIgnoreCase(String.valueOf(trans.get("APPROVAL_STATUS")).trim())
                                            ? "VERIFIED"
                                            : ("PENDING FOR APPROVAL".equalsIgnoreCase(
                                                    String.valueOf(trans.get("APPROVAL_STATUS")).trim())
                                                            ? "PENDING FOR VERIFY"
                                                            : trans.get("APPROVAL_STATUS")))
                                    : null)
                            .setParameter(9, trans.get("COMMENTS"))
                            .setParameter(10, trans.get("ROOT_CAUSE"))
                            .setParameter(11, trans.get("CORRECTIVE_ACTION"))
                            .setParameter(12, trans.get("PREVENTIVE_ACTION"))
                            .setParameter(13, trans.get("TARGET_DATE"))
                            .setParameter(14, trans.get("CLOSED_DATE"))
                            .setParameter(15, trans.get("CLOSED_BY"))
                            .setParameter(16, ncrStatusId)
                            .setParameter(17, trans.get("CANCEL_REMARKS"))
                            .setParameter(18, trans.get("REV_NO") != null ? trans.get("REV_NO") : 0)
                            .setParameter(19, dIsActive ? 1 : 0)
                            .setParameter(20, resolveUser(trans.get("CREAT_USER_ID_CD")))
                            .setParameter(21, trans.get("CREAT_DT"))
                            .setParameter(22, resolveUser(trans.get("LST_UPDT_USER_ID_CD")))
                            .setParameter(23, trans.get("LST_UPDT_TS"))
                            .executeUpdate();

                    // Attachments Migration
                    try {
                        List<?> dIds = entityManager
                                .createNativeQuery("SELECT MAX(id) FROM QMS_AUDIT_OBSERVATION_DETAIL").getResultList();
                        if (!dIds.isEmpty() && dIds.get(0) != null) {
                            Long newDetailId = ((Number) dIds.get(0)).longValue();

                            String fileSql = "SELECT FILE_NAME FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE = 'AUDIT' AND REF_ROW_ID = "
                                    + trans.get("ROW_ID");
                            List<String> files = jdbcTemplate.queryForList(fileSql, String.class);
                            for (String fileName : files) {
                                if (fileName == null || fileName.trim().isEmpty())
                                    continue;
                                fileName = fileName.trim();

                                java.io.File sourceFile = new java.io.File(getSecondaryProcessImgLocation() + "\\AUDIT",
                                        fileName);
                                if (sourceFile.exists()) {
                                    java.nio.file.Path rootPath = fileService.getRootPath();
                                    java.io.File targetDir = rootPath.resolve(
                                            BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION_PATH)
                                            .toFile();
                                    if (!targetDir.exists())
                                        targetDir.mkdirs();
                                    java.io.File targetFile = new java.io.File(targetDir, fileName);
                                    try {
                                        java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                                                java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                                        String logicalPath = BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION_PATH
                                                + "/" + fileName;
                                        String insertAtt = "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES ('QM1230', ?, 'EVIDENCE', ?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)";
                                        entityManager.createNativeQuery(insertAtt)
                                                .setParameter(1, String.valueOf(newDetailId))
                                                .setParameter(2, logicalPath)
                                                .setParameter(3, fileName)
                                                .executeUpdate();
                                    } catch (Exception ex) {
                                        System.err.println("Failed to migrate attachment: " + fileName);
                                        ex.printStackTrace();
                                    }
                                }
                            }
                        }
                    } catch (Exception attachEx) {
                        attachEx.printStackTrace();
                    }

                    migratedTrans++;
                }

                migratedMaster++;
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .update("auditObservations", migratedMaster);
            }

            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                    .complete("auditObservations");
        } catch (Exception e) {
            e.printStackTrace();
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("auditObservations");
            return "Failed to migrate Audit Observations: " + e.getMessage();
        }

        return "Successfully migrated " + migratedMaster + " observations and " + migratedTrans
                + " observation detail records.";
    }

    public Long getEmployeeIdByEmpCode(String empCode) {
        if (empCode == null || empCode.trim().isEmpty()) {
            return null;
        }
        String trimmed = empCode.trim();
        try {
            // 1. Match EMP_CODE directly in HR_EMPLOYEE
            List<?> users = entityManager.createNativeQuery("SELECT id FROM HR_EMPLOYEE WHERE EMP_CODE = ?")
                    .setParameter(1, trimmed)
                    .getResultList();
            if (!users.isEmpty() && users.get(0) != null) {
                return ((Number) users.get(0)).longValue();
            }

            // 2. Match OLD_EMP_CODE directly in HR_EMPLOYEE
            List<?> usersOld = entityManager.createNativeQuery("SELECT id FROM HR_EMPLOYEE WHERE OLD_EMP_CODE = ?")
                    .setParameter(1, trimmed)
                    .getResultList();
            if (!usersOld.isEmpty() && usersOld.get(0) != null) {
                return ((Number) usersOld.get(0)).longValue();
            }

            // 3. Match legacy OLDEMP_CD lookup fallback
            try {
                String legacyOldEmpCd = jdbcTemplate.queryForObject(
                        "SELECT OLDEMP_CD FROM EMPLOYEE WHERE EMP_CD = ?", String.class, trimmed);
                if (legacyOldEmpCd != null && !legacyOldEmpCd.trim().isEmpty()) {
                    String targetCode = legacyOldEmpCd.trim();
                    List<?> usersLegacy = entityManager.createNativeQuery(
                            "SELECT id FROM HR_EMPLOYEE WHERE EMP_CODE = ? OR OLD_EMP_CODE = ?")
                            .setParameter(1, targetCode)
                            .setParameter(2, targetCode)
                            .getResultList();
                    if (!usersLegacy.isEmpty() && usersLegacy.get(0) != null) {
                        return ((Number) usersLegacy.get(0)).longValue();
                    }
                }
            } catch (Exception ignore) {
            }
        } catch (Exception e) {
            System.err.println("Error resolving employee ID for code: " + empCode + " - " + e.getMessage());
        }
        return null;
    }

    private Long resolveEmployeeId(Object empObj) {
        if (empObj == null)
            return null;
        return getEmployeeIdByEmpCode(String.valueOf(empObj));
    }

    @Transactional
    public String clearAuditAttendances() {
        try {
            entityManager.createNativeQuery("DELETE FROM QMS_AUDIT_ATTENDANCE").executeUpdate();
            return "Successfully cleared Audit Attendances.";
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to clear Audit Attendances: " + e.getMessage());
        }
    }

    @Transactional
    public String clearAuditObservations() {
        try {
            try {
                @SuppressWarnings("unchecked")
                java.util.List<String> paths = entityManager
                        .createNativeQuery("SELECT PATH FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'QM1230'")
                        .getResultList();

                for (String p : paths) {
                    if (p != null && !p.trim().isEmpty()) {
                        String physicalPath = p.trim();
                        if (physicalPath.startsWith("QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION/")) {
                            String fileName = physicalPath
                                    .substring("QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION/".length());
                            physicalPath = BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION_PATH + "/"
                                    + fileName;
                        }
                        boolean deleted = fileService.deleteFile(physicalPath);
                        if (deleted) {
                            System.out.println("[ATTACHMENT CLEAR] Deleted physical file: " + physicalPath);
                        } else {
                            System.err.println("[ATTACHMENT CLEAR] Failed to delete physical file: " + physicalPath);
                        }
                    }
                }

                entityManager.createNativeQuery("DELETE FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'QM1230'")
                        .executeUpdate();
            } catch (Exception e) {
                // Table might not exist yet, safe to ignore
                System.out.println("Could not clear QMS_ATTACHMENT_PATH (table might not exist). Continuing...");
            }
            entityManager.createNativeQuery("DELETE FROM QMS_AUDIT_OBSERVATION_DETAIL").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM QMS_AUDIT_OBSERVATION").executeUpdate();
            return "Successfully cleared Audit Observations.";
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to clear Audit Observations: " + e.getMessage());
        }
    }

    @Transactional
    public String clearAuditNcrReworks() {
        try {
            // Delete physical attachments for QMS_NCR_OFI
            @SuppressWarnings("unchecked")
            java.util.List<String> paths = entityManager
                    .createNativeQuery("SELECT PATH FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'QMS_NCR_OFI'")
                    .getResultList();

            for (String p : paths) {
                if (p != null && !p.trim().isEmpty()) {
                    String physicalPath = p.trim();
                    if (physicalPath.startsWith("QUALITY_MANAGEMENT_SYSTEMS_AUDIT_CLOSE_NC_OFI/")) {
                        String fileName = physicalPath
                                .substring("QUALITY_MANAGEMENT_SYSTEMS_AUDIT_CLOSE_NC_OFI/".length());
                        physicalPath = AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_CLOSE_NC_OFI_PATH + "/"
                                + fileName;
                    }
                    fileService.deleteFile(physicalPath);
                }
            }

            entityManager.createNativeQuery("DELETE FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'QMS_NCR_OFI'")
                    .executeUpdate();

            entityManager.createNativeQuery("DELETE FROM QMS_NCR_REWORK_LOG").executeUpdate();
            entityManager.createNativeQuery("DBCC CHECKIDENT ('QMS_NCR_REWORK_LOG', RESEED, 0)").executeUpdate();
            return "Successfully cleared Audit NCR Reworks and attachments.";
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to clear Audit NCR Reworks: " + e.getMessage());
        }
    }

    @Transactional
    public String migrateAuditNcrReworks() {
        if (jdbcTemplate == null) {
            return "Migration database not configured.";
        }

        String sql = "SELECT n.ROW_ID, n.OBR_TRANS_ID, n.NCR_NO, n.ROOT_NCR, n.ACTION_NCR, n.PREVENTION_ACTION, " +
                "n.CREAT_USER_ID_CD, n.CREAT_DT, n.LST_UPDT_USER_ID_CD, n.LST_UPDT_TS, " +
                "n.STATUS as OLD_STATUS, " +
                "t.SEQ_NO, t.NCR_APPROVAL as NCR_STATUS, m.ROW_ID as M_ROW_ID, m.OBR_NO as M_OBR_NO " +
                "FROM CREATE_NCR_MASTER n " +
                "LEFT JOIN AUDIT_OBSERVATION_TRANS t ON n.OBR_TRANS_ID = t.ROW_ID " +
                "LEFT JOIN AUDIT_OBSERVATION_MASTER m ON t.OBR_ROW_ID = m.ROW_ID " +
                "ORDER BY n.OBR_TRANS_ID, n.CREAT_DT";

        List<Map<String, Object>> records;
        try {
            records = jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            return "Error querying CREATE_NCR_MASTER: " + e.getMessage();
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start("auditNcr",
                records.size());

        int migrated = 0;
        int filesMigrated = 0;
        long lastDetailId = -1;
        int reworkCounter = 1;
        int unlinkedCounter = 10000;

        try {
            for (Map<String, Object> r : records) {
                if (stopFlag.get()) {
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("auditNcr");
                    return "Migration stopped. Migrated " + migrated + " NCR Reworks.";
                }

                String seqNo = r.get("SEQ_NO") != null ? String.valueOf(r.get("SEQ_NO")) : null;
                String mRowId = r.get("M_ROW_ID") != null ? String.valueOf(r.get("M_ROW_ID")) : null;
                String mObrNo = r.get("M_OBR_NO") != null ? String.valueOf(r.get("M_OBR_NO")) : null;

                Long detailId = null;

                if (seqNo != null) {
                    List<?> detailIds = entityManager.createNativeQuery(
                            "SELECT d.ID FROM QMS_AUDIT_OBSERVATION_DETAIL d " +
                                    "JOIN QMS_AUDIT_OBSERVATION o ON d.OBSERVATION_ID = o.ID " +
                                    "WHERE (o.OBSERVATION_NO = ? OR o.OBSERVATION_NO = ?) AND d.SEQ_NO = ?")
                            .setParameter(1, mObrNo)
                            .setParameter(2, mRowId)
                            .setParameter(3, seqNo)
                            .getResultList();

                    if (!detailIds.isEmpty() && detailIds.get(0) != null) {
                        detailId = ((Number) detailIds.get(0)).longValue();
                    }
                }

                if (detailId != null) {
                    if (detailId == lastDetailId) {
                        reworkCounter++;
                    } else {
                        reworkCounter = 1;
                        lastDetailId = detailId;
                    }
                } else {
                    reworkCounter = unlinkedCounter++;
                }

                String createdBy = r.get("CREAT_USER_ID_CD") != null ? resolveUser(r.get("CREAT_USER_ID_CD"))
                        : "SUPER BOSS";
                String updatedBy = r.get("LST_UPDT_USER_ID_CD") != null ? resolveUser(r.get("LST_UPDT_USER_ID_CD"))
                        : "SUPER BOSS";

                String oldStatus = r.get("OLD_STATUS") != null ? String.valueOf(r.get("OLD_STATUS")).trim() : null;
                String verifyStatus = null;
                if (oldStatus != null) {
                    if ("APPROVED".equalsIgnoreCase(oldStatus) || "VERIFIED".equalsIgnoreCase(oldStatus)) {
                        verifyStatus = "VERIFIED";
                    } else if (oldStatus.toUpperCase().contains("PENDING")) {
                        verifyStatus = "PENDING";
                    } else if ("REJECTED".equalsIgnoreCase(oldStatus)) {
                        verifyStatus = "REJECTED";
                    } else {
                        verifyStatus = oldStatus;
                    }
                }

                String ncrStatusVal = r.get("NCR_STATUS") != null ? String.valueOf(r.get("NCR_STATUS")).trim() : null;
                if (ncrStatusVal != null) {
                    if ("VERIFIED".equalsIgnoreCase(ncrStatusVal) || "APPROVED".equalsIgnoreCase(ncrStatusVal)
                            || "COMPLETED".equalsIgnoreCase(ncrStatusVal)) {
                        ncrStatusVal = "COMPLETED";
                    } else if (ncrStatusVal.toUpperCase().contains("PENDING")) {
                        ncrStatusVal = "PENDING";
                    } else if ("REJECTED".equalsIgnoreCase(ncrStatusVal)
                            || "UNRESOLVED".equalsIgnoreCase(ncrStatusVal)) {
                        ncrStatusVal = "UNRESOLVED";
                    }
                }
                String verifiedBy = null;
                if ("VERIFIED".equalsIgnoreCase(verifyStatus)) {
                    Object lstUpdtUserObj = r.get("LST_UPDT_USER_ID_CD");
                    if (lstUpdtUserObj != null) {
                        String userStr = String.valueOf(lstUpdtUserObj).trim();
                        if (!userStr.isEmpty()) {
                            try {
                                List<?> empIds = entityManager.createNativeQuery(
                                        "SELECT EMP_ID FROM AD_USER_CREDENTIAL WHERE USER_ID = ?")
                                        .setParameter(1, userStr)
                                        .getResultList();
                                if (!empIds.isEmpty() && empIds.get(0) != null) {
                                    verifiedBy = String.valueOf(empIds.get(0));
                                }
                            } catch (Exception ignore) {
                            }
                            if (verifiedBy == null) {
                                Long empId = resolveEmployeeId(userStr);
                                if (empId != null) {
                                    verifiedBy = String.valueOf(empId);
                                }
                            }
                        }
                    }
                }
                Object verifyDate = null;
                if ("VERIFIED".equalsIgnoreCase(verifyStatus)) {
                    verifyDate = r.get("LST_UPDT_TS");
                }

                String insertSql = "INSERT INTO QMS_NCR_REWORK_LOG (OBSERVATION_DETAIL_ID, REWORK_NO, SUBMITTED_BY, SUBMITTED_AT, "
                        + "ROOT_CAUSE, CORRECTIVE_ACTION, PREVENTIVE_ACTION, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, "
                        + "NCR_STATUS, VERIFY_STATUS, VERIFIED_BY, VERIFY_DATE) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                entityManager.createNativeQuery(insertSql)
                        .setParameter(1, detailId)
                        .setParameter(2, reworkCounter)
                        .setParameter(3, createdBy)
                        .setParameter(4, r.get("CREAT_DT"))
                        .setParameter(5, r.get("ROOT_NCR"))
                        .setParameter(6, r.get("ACTION_NCR"))
                        .setParameter(7, r.get("PREVENTION_ACTION"))
                        .setParameter(8, createdBy)
                        .setParameter(9, r.get("CREAT_DT"))
                        .setParameter(10, updatedBy)
                        .setParameter(11, r.get("LST_UPDT_TS"))
                        .setParameter(12, ncrStatusVal)
                        .setParameter(13, verifyStatus)
                        .setParameter(14, verifiedBy)
                        .setParameter(15, verifyDate)
                        .executeUpdate();

                migrated++;
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update("auditNcr",
                        migrated);

                String rowId = String.valueOf(r.get("ROW_ID"));
                String fileSql = "SELECT FILE_NAME, FROM_WHERE FROM FILE_UPLOAD_TRANS " +
                        "WHERE FROM_WHERE IN ('ROOT_CAUSE_NCR_AUDIT', 'CORRECTIVE_ACTION_NCR_AUDIT', 'PREVENTIVE_ACTION_NCR_AUDIT') "
                        +
                        "AND REF_ROW_ID = " + rowId;
                List<Map<String, Object>> files = jdbcTemplate.queryForList(fileSql);

                for (Map<String, Object> f : files) {
                    String fileName = (String) f.get("FILE_NAME");
                    String fromWhere = (String) f.get("FROM_WHERE");
                    if (fileName == null || fileName.trim().isEmpty())
                        continue;
                    fileName = fileName.trim();

                    String docType = "GENERAL";
                    if ("ROOT_CAUSE_NCR_AUDIT".equals(fromWhere))
                        docType = "ROOT_CAUSE";
                    else if ("CORRECTIVE_ACTION_NCR_AUDIT".equals(fromWhere))
                        docType = "CORRECTIVE";
                    else if ("PREVENTIVE_ACTION_NCR_AUDIT".equals(fromWhere))
                        docType = "PREVENTIVE";

                    java.io.File sourceFile = new java.io.File(getSecondaryProcessImgLocation() + "\\AUDIT NCR",
                            fileName);
                    if (sourceFile.exists()) {
                        java.nio.file.Path rootPath = fileService.getRootPath();
                        java.io.File targetDir = rootPath
                                .resolve(AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_CLOSE_NC_OFI_PATH)
                                .toFile();
                        if (!targetDir.exists())
                            targetDir.mkdirs();
                        java.io.File targetFile = new java.io.File(targetDir, fileName);

                        try {
                            java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                            String logicalPath = AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_AUDIT_CLOSE_NC_OFI_PATH
                                    + "/" + fileName;
                            String refId = detailId != null ? String.valueOf(detailId) : "0";
                            String insertAtt = "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) "
                                    +
                                    "VALUES ('QMS_NCR_OFI', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)";
                            entityManager.createNativeQuery(insertAtt)
                                    .setParameter(1, refId)
                                    .setParameter(2, docType)
                                    .setParameter(3, logicalPath)
                                    .setParameter(4, fileName)
                                    .setParameter(5, createdBy)
                                    .setParameter(6, updatedBy)
                                    .executeUpdate();
                            filesMigrated++;
                        } catch (Exception ex) {
                            System.err.println("Failed to migrate NCR attachment: " + fileName);
                        }
                    }
                }
            }

            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("auditNcr");
        } catch (Exception e) {
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("auditNcr");
            e.printStackTrace();
            return "Failed to migrate Audit NCR: " + e.getMessage();
        }

        return "Successfully migrated " + migrated + " Audit NCR Reworks and " + filesMigrated + " attachments.";
    }

    // ==============================|| MEETING MIGRATION STUBS
    // ||==============================

    @Transactional
    public String migrateMeetingMaster() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        // Clean existing records first to allow clean migration
        try {
            entityManager.createNativeQuery("DELETE FROM QMS_MEETING_MASTER").executeUpdate();
            entityManager.createNativeQuery("DBCC CHECKIDENT ('QMS_MEETING_MASTER', RESEED, 0)").executeUpdate();
        } catch (Exception e) {
            // ignore
        }

        List<Map<String, Object>> records;
        try {
            records = jdbcTemplate.queryForList(
                    "SELECT MEETING_NAME, MEETING_DES, MEETING_PREFIX, MEETING_AGENDA FROM MINUTES_MEETING_MASTER");
        } catch (Exception e) {
            return "Failed to fetch meeting types from MINUTES_MEETING_MASTER: " + e.getMessage();
        }

        int migratedCount = 0;
        Long activeStatusId = null;
        try {
            List<?> sIds = entityManager.createNativeQuery(
                    "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = 'ACTIVE'")
                    .getResultList();
            if (!sIds.isEmpty()) {
                activeStatusId = ((Number) sIds.get(0)).longValue();
            } else {
                entityManager.createNativeQuery("INSERT INTO AD_STATUS_MASTER (NAME) VALUES ('Active')")
                        .executeUpdate();
                sIds = entityManager.createNativeQuery(
                        "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = 'ACTIVE'")
                        .getResultList();
                if (!sIds.isEmpty()) {
                    activeStatusId = ((Number) sIds.get(0)).longValue();
                }
            }
        } catch (Exception ex) {
            // ignore
        }

        for (Map<String, Object> record : records) {
            String prefix = record.get("MEETING_PREFIX") != null ? String.valueOf(record.get("MEETING_PREFIX")).trim()
                    : "";
            if (prefix.isEmpty()) {
                prefix = record.get("MEETING_NAME") != null ? String.valueOf(record.get("MEETING_NAME")).trim() : "";
            }
            if (prefix.isEmpty()) {
                continue;
            }
            String name = record.get("MEETING_NAME") != null ? String.valueOf(record.get("MEETING_NAME")).trim() : "";
            String description = record.get("MEETING_DES") != null ? String.valueOf(record.get("MEETING_DES")).trim()
                    : "";
            String agenda = record.get("MEETING_AGENDA") != null ? String.valueOf(record.get("MEETING_AGENDA")).trim()
                    : "";

            try {
                // Check duplicate prefix in new DB
                List<?> existing = entityManager.createNativeQuery(
                        "SELECT id FROM QMS_MEETING_MASTER WHERE UPPER(MEETING_PREFIX) = ?")
                        .setParameter(1, prefix.toUpperCase())
                        .getResultList();
                if (!existing.isEmpty()) {
                    continue;
                }

                final String fPrefix = prefix;
                final String fName = name;
                final String fDescription = description;
                final String fAgenda = agenda;
                final Long fStatusId = activeStatusId;

                primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
                    String sql = "INSERT INTO QMS_MEETING_MASTER (MEETING_NAME, MEETING_DESCRIPTION, MEETING_PREFIX, MEETING_AGENDA, STATUS, IS_ACTIVE, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) "
                            +
                            "VALUES (?, ?, ?, ?, ?, 1, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)";
                    try (java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
                        ps.setString(1, fName);
                        ps.setString(2, fDescription);
                        ps.setString(3, fPrefix);
                        ps.setString(4, fAgenda);
                        if (fStatusId != null) {
                            ps.setLong(5, fStatusId);
                        } else {
                            ps.setNull(5, java.sql.Types.BIGINT);
                        }
                        ps.executeUpdate();
                    }
                    return null;
                });
                migratedCount++;
            } catch (Exception ex) {
                System.err.println("[MIGRATION ERROR] Failed to migrate meeting master prefix: " + prefix + " - "
                        + ex.getMessage());
            }
        }

        return "Successfully migrated " + migratedCount + " Meeting Master records.";
    }

    private Long resolveEmployeeByLegacyCode(Object empCodeObj) {
        if (empCodeObj == null)
            return null;
        String empCode = String.valueOf(empCodeObj).trim();
        if (empCode.isEmpty())
            return null;
        try {
            List<?> list = entityManager.createNativeQuery("SELECT id FROM HR_EMPLOYEE WHERE UPPER(EMP_CODE) = UPPER(?) OR CAST(id AS VARCHAR) = ?")
                    .setParameter(1, empCode)
                    .setParameter(2, empCode)
                    .getResultList();
            if (!list.isEmpty() && list.get(0) != null) {
                return ((Number) list.get(0)).longValue();
            }
            List<?> userList = entityManager.createNativeQuery("SELECT EMP_ID FROM AD_USER_CREDENTIAL WHERE UPPER(USER_ID) = UPPER(?) OR CAST(EMP_ID AS VARCHAR) = ?")
                    .setParameter(1, empCode)
                    .setParameter(2, empCode)
                    .getResultList();
            if (!userList.isEmpty() && userList.get(0) != null) {
                return ((Number) userList.get(0)).longValue();
            }
            try {
                String legacyEmpCode = jdbcTemplate.queryForObject(
                        "SELECT EMP_CODE FROM EMPLOYEE WHERE CAST(ID AS VARCHAR) = ? OR CAST(ROW_ID AS VARCHAR) = ?", String.class, empCode, empCode);
                if (legacyEmpCode != null) {
                    list = entityManager.createNativeQuery("SELECT id FROM HR_EMPLOYEE WHERE UPPER(EMP_CODE) = UPPER(?)")
                            .setParameter(1, legacyEmpCode.trim()).getResultList();
                    if (!list.isEmpty() && list.get(0) != null)
                        return ((Number) list.get(0)).longValue();
                }
            } catch (Exception ignore) {}
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    public Long getDepartmentIdByCode(String departmentCode) {
        if (departmentCode == null)
            return null;
        String trimmed = departmentCode.trim();
        if (trimmed.isEmpty())
            return null;
        try {
            List<?> list = entityManager
                    .createNativeQuery("SELECT id FROM HR_DEPARTMENT WHERE DEPARTMENT_NO = ? OR id = ?")
                    .setParameter(1, trimmed)
                    .setParameter(2, trimmed)
                    .getResultList();
            if (!list.isEmpty()) {
                return ((Number) list.get(0)).longValue();
            }
        } catch (Exception e) {
            try {
                List<?> list = entityManager.createNativeQuery("SELECT id FROM HR_DEPARTMENT WHERE DEPARTMENT_NO = ?")
                        .setParameter(1, trimmed)
                        .getResultList();
                if (!list.isEmpty()) {
                    return ((Number) list.get(0)).longValue();
                }
            } catch (Exception ex) {
                // ignore
            }
        }
        return null;
    }

    @Transactional
    public String migrateMeetingSchedule() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        List<Map<String, Object>> records;
        try {
            records = jdbcTemplate.queryForList("SELECT * FROM MEETING_SCHEDULE_MASTER");
        } catch (Exception e) {
            return "Failed to fetch from MEETING_SCHEDULE_MASTER: " + e.getMessage();
        }

        int migratedCount = 0;
        int skippedCount = 0;
        int filesMigratedCount = 0;

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start("meetingSchedule",
                records.size());

        for (Map<String, Object> record : records) {
            if (stopFlag.get()) {
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .fail("meetingSchedule");
                return "Migration stopped manually.";
            }

            try {
                Object rowIdObj = record.get("ROW_ID");
                if (rowIdObj == null) {
                    skippedCount++;
                    continue;
                }
                long legacyRowId = ((Number) rowIdObj).longValue();

                // Check duplicate
                List<?> existing = entityManager.createNativeQuery(
                        "SELECT id FROM QMS_MEETING_SCHEDULE WHERE id = ?")
                        .setParameter(1, legacyRowId)
                        .getResultList();
                if (!existing.isEmpty()) {
                    skippedCount++;
                    continue;
                }

                // Resolve Meeting Type
                String legacyMeetingType = record.get("MEETING_TYPE") != null
                        ? String.valueOf(record.get("MEETING_TYPE")).trim()
                        : "";
                Integer meetingTypeId = null;
                if (!legacyMeetingType.isEmpty()) {
                    List<?> mIds = entityManager.createNativeQuery(
                            "SELECT id FROM QMS_MEETING_MASTER WHERE UPPER(MEETING_PREFIX) = ? OR UPPER(MEETING_NAME) = ?")
                            .setParameter(1, legacyMeetingType.toUpperCase())
                            .setParameter(2, legacyMeetingType.toUpperCase())
                            .getResultList();
                    if (!mIds.isEmpty()) {
                        meetingTypeId = ((Number) mIds.get(0)).intValue();
                    }
                }

                if (meetingTypeId == null || meetingTypeId == 0) {
                    skippedCount++;
                    continue;
                }

                // Resolve Chaired By and Host By
                Long chairedById = resolveEmployeeByLegacyCode(record.get("CHAIRED"));
                Long hostById = resolveEmployeeByLegacyCode(record.get("HOST"));

                // Status mapping: OPEN, CLOSED, AUTO CLOSED, RESCHEDULE
                String status = record.get("STATUS") != null ? String.valueOf(record.get("STATUS")).trim() : "OPEN";
                if (status.isEmpty())
                    status = "OPEN";

                Long statusId = null;
                try {
                    List<?> sIds = entityManager.createNativeQuery(
                            "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = ?")
                            .setParameter(1, status.toUpperCase())
                            .getResultList();
                    if (!sIds.isEmpty()) {
                        statusId = ((Number) sIds.get(0)).longValue();
                    } else {
                        // Insert new status if not exists
                        entityManager.createNativeQuery("INSERT INTO AD_STATUS_MASTER (NAME) VALUES (?)")
                                .setParameter(1, status)
                                .executeUpdate();
                        sIds = entityManager.createNativeQuery(
                                "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = ?")
                                .setParameter(1, status.toUpperCase())
                                .getResultList();
                        if (!sIds.isEmpty()) {
                            statusId = ((Number) sIds.get(0)).longValue();
                        }
                    }
                } catch (Exception ex) {
                    // ignore
                }

                // Times parsing
                String startTimeStr = record.get("START_TIME") != null ? String.valueOf(record.get("START_TIME")).trim()
                        : null;
                String endTimeStr = record.get("END_TIME") != null ? String.valueOf(record.get("END_TIME")).trim()
                        : null;
                String intervalTimeStr = record.get("INTERVAL_TIME") != null
                        ? String.valueOf(record.get("INTERVAL_TIME")).trim()
                        : null;

                java.time.LocalTime startTime = parseLocalTime(startTimeStr);
                java.time.LocalTime endTime = parseLocalTime(endTimeStr);
                java.time.LocalTime intervalTime = parseLocalTime(intervalTimeStr);

                if (startTime == null) {
                    startTime = java.time.LocalTime.of(9, 0); // fallback default
                }
                if (endTime == null) {
                    endTime = startTime.plusHours(1); // fallback default
                }

                String createdBy = record.get("CREAT_USER_ID_CD") != null
                        ? resolveUser(record.get("CREAT_USER_ID_CD"))
                        : "SUPER BOSS";
                String updatedBy = record.get("LST_UPDT_USER_ID_CD") != null
                        ? resolveUser(record.get("LST_UPDT_USER_ID_CD"))
                        : "SUPER BOSS";
                Object createdDate = record.get("CREAT_DT");
                Object updatedDate = record.get("LST_UPDT_TS");

                // Execute INSERT using Connection callback for IDENTITY_INSERT and transaction
                // rollback safety
                final Integer mTypeId = meetingTypeId;
                final Long cById = chairedById;
                final Long hById = hostById;
                final Long fStatusId = statusId;
                final java.time.LocalTime fStartTime = startTime;
                final java.time.LocalTime fEndTime = endTime;
                final java.time.LocalTime fIntervalTime = intervalTime;
                final String fCreatedBy = createdBy;
                final String fUpdatedBy = updatedBy;

                // Get legacy attachments before JDBC callback
                String fileSql = "SELECT FILE_NAME FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE = 'MEETING SCHEDULE' AND REF_ROW_ID = "
                        + legacyRowId;
                List<String> files = jdbcTemplate.queryForList(fileSql, String.class);
                List<String> successfullyCopiedFiles = new ArrayList<>();
                for (String fileName : files) {
                    if (fileName == null || fileName.trim().isEmpty())
                        continue;
                    fileName = fileName.trim();

                    // Physical file copy from HRMS erpimage directory
                    java.io.File sourceFile = new java.io.File(getSecondaryProcessImgLocation() + "\\HRMS", fileName);
                    if (sourceFile.exists()) {
                        try {
                            java.nio.file.Path rootPath = fileService.getRootPath();
                            java.io.File targetDir = rootPath.resolve(
                                    AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_MEETING_SCHEDULE_PATH)
                                    .toFile();
                            if (!targetDir.exists())
                                targetDir.mkdirs();
                            java.io.File targetFile = new java.io.File(targetDir, fileName);
                            java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                            successfullyCopiedFiles.add(fileName);
                        } catch (Exception ex) {
                            System.err.println(
                                    "[MIGRATION] File copy exception for " + fileName + ": " + ex.getMessage());
                        }
                    }
                }

                final List<String> fFiles = successfullyCopiedFiles;

                primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
                    java.sql.Savepoint savepoint = null;
                    boolean autoCommit = conn.getAutoCommit();
                    try {
                        if (autoCommit) {
                            conn.setAutoCommit(false);
                        }
                        savepoint = conn.setSavepoint();

                        try (java.sql.Statement stmt = conn.createStatement()) {
                            stmt.execute("SET IDENTITY_INSERT QMS_MEETING_SCHEDULE ON");
                        } catch (java.sql.SQLException e) {
                            System.err.println("[MIGRATION] Failed to set IDENTITY_INSERT ON for QMS_MEETING_SCHEDULE: "
                                    + e.getMessage());
                        }

                        String insertScheduleSql = "INSERT INTO QMS_MEETING_SCHEDULE (" +
                                "id, SCHEDULE_NO, REV_SOURCE_SCHEDULE_NO, REV_NO, MEETING_TYPE_ID, MEETING_DATE, " +
                                "START_TIME, END_TIME, INTERVAL_TIME, FREQUENCY, CHAIRED_BY_ID, HOST_BY_ID, " +
                                "CANCEL_REASON, RESCHEDULE_REASON, COMMENTS, SUBJECT, IS_ACTIVE, STATUS, " +
                                "CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE" +
                                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)";

                        try (java.sql.PreparedStatement ps = conn.prepareStatement(insertScheduleSql)) {
                            ps.setLong(1, legacyRowId);
                            ps.setString(2, record.get("SCH_NO") != null ? String.valueOf(record.get("SCH_NO")).trim()
                                    : "MEET-" + legacyRowId);
                            ps.setString(3,
                                    record.get("REV_SOURCE_SCH_NO") != null
                                            ? String.valueOf(record.get("REV_SOURCE_SCH_NO")).trim()
                                            : null);
                            ps.setInt(4, record.get("REV_NO") != null ? ((Number) record.get("REV_NO")).intValue() : 0);
                            ps.setInt(5, mTypeId);
                            ps.setDate(6,
                                    record.get("MEETING_DATE") != null
                                            ? new java.sql.Date(((java.util.Date) record.get("MEETING_DATE")).getTime())
                                            : new java.sql.Date(System.currentTimeMillis()));
                            ps.setTime(7, java.sql.Time.valueOf(fStartTime));
                            ps.setTime(8, java.sql.Time.valueOf(fEndTime));
                            ps.setTime(9, fIntervalTime != null ? java.sql.Time.valueOf(fIntervalTime) : null);
                            ps.setString(10,
                                    record.get("FREQUENCY_LEVEL") != null
                                            ? String.valueOf(record.get("FREQUENCY_LEVEL")).trim()
                                            : "NONE");
                            ps.setObject(11, cById, java.sql.Types.BIGINT);
                            ps.setObject(12, hById, java.sql.Types.BIGINT);
                            ps.setString(13,
                                    record.get("CANCEL_REASON") != null
                                            ? String.valueOf(record.get("CANCEL_REASON")).trim()
                                            : null);
                            ps.setString(14,
                                    record.get("RESCHEDULE_REASON") != null
                                            ? String.valueOf(record.get("RESCHEDULE_REASON")).trim()
                                            : null);
                            ps.setString(15,
                                    record.get("COMMENTS") != null ? String.valueOf(record.get("COMMENTS")).trim()
                                            : null);
                            ps.setString(16,
                                    record.get("MEETING_SUBJECT") != null
                                            ? String.valueOf(record.get("MEETING_SUBJECT")).trim()
                                            : null);
                            ps.setObject(17, fStatusId, java.sql.Types.BIGINT);
                            ps.setString(18, fCreatedBy);
                            ps.setTimestamp(19,
                                    createdDate != null
                                            ? new java.sql.Timestamp(((java.util.Date) createdDate).getTime())
                                            : new java.sql.Timestamp(System.currentTimeMillis()));
                            ps.setString(20, fUpdatedBy);
                            ps.setTimestamp(21,
                                    updatedDate != null
                                            ? new java.sql.Timestamp(((java.util.Date) updatedDate).getTime())
                                            : null);
                            ps.executeUpdate();
                        } finally {
                            try (java.sql.Statement stmt = conn.createStatement()) {
                                stmt.execute("SET IDENTITY_INSERT QMS_MEETING_SCHEDULE OFF");
                            } catch (java.sql.SQLException e) {
                                System.err
                                        .println(
                                                "[MIGRATION] Failed to set IDENTITY_INSERT OFF for QMS_MEETING_SCHEDULE: "
                                                        + e.getMessage());
                            }
                        }

                        // Existing department migration logic (unaffected)
                        if (record.get("DEPARTMENT") != null) {
                            String legacyDepts = String.valueOf(record.get("DEPARTMENT"));
                            String[] deptCodes = legacyDepts.split(",");
                            for (String dCode : deptCodes) {
                                dCode = dCode.trim();
                                if (dCode.isEmpty())
                                    continue;
                                Long deptId = null;
                                try {
                                    List<?> dIds = entityManager.createNativeQuery(
                                            "SELECT id FROM HR_DEPARTMENT WHERE id = ? OR DEPARTMENT_NO = ?")
                                            .setParameter(1, dCode)
                                            .setParameter(2, dCode)
                                            .getResultList();
                                    if (!dIds.isEmpty()) {
                                        deptId = ((Number) dIds.get(0)).longValue();
                                    }
                                } catch (Exception ex) {
                                    // ignore
                                }
                                if (deptId != null) {
                                    try (java.sql.PreparedStatement origDeptPs = conn.prepareStatement(
                                            "INSERT INTO QMS_MEETING_SCHEDULE_DEPARTMENT (schedule_id, department_id, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)")) {
                                        origDeptPs.setLong(1, legacyRowId);
                                        origDeptPs.setLong(2, deptId);
                                        origDeptPs.executeUpdate();
                                    }
                                }
                            }
                        }

                        // Existing participant migration logic (unaffected)
                        if (record.get("PARTICIPANTS") != null) {
                            String legacyParts = String.valueOf(record.get("PARTICIPANTS"));
                            String[] partCodes = legacyParts.split(",");
                            for (String pCode : partCodes) {
                                pCode = pCode.trim();
                                if (pCode.isEmpty())
                                    continue;
                                Long empId = resolveEmployeeByLegacyCode(pCode);
                                if (empId != null) {
                                    try (java.sql.PreparedStatement origPartPs = conn.prepareStatement(
                                            "INSERT INTO QMS_MEETING_SCHEDULE_PARTICIPANT (schedule_id, employee_id, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)")) {
                                        origPartPs.setLong(1, legacyRowId);
                                        origPartPs.setLong(2, empId);
                                        origPartPs.executeUpdate();
                                    }
                                }
                            }
                        }

                        // New mapping logic for QMS_MEETING_DEPARTMENT_MAPPING
                        if (record.get("DEPARTMENT") != null) {
                            String legacyDepts = String.valueOf(record.get("DEPARTMENT"));
                            String[] deptCodes = legacyDepts.split(",");
                            java.util.Set<Long> processedDeptIds = new java.util.HashSet<>();
                            for (String dCode : deptCodes) {
                                dCode = dCode.trim();
                                if (dCode.isEmpty())
                                    continue;
                                Long deptId = getDepartmentIdByCode(dCode);
                                if (deptId == null) {
                                    System.err.println("[MIGRATION] Missing department code: " + dCode
                                            + " along with Meeting ID: " + legacyRowId);
                                    continue;
                                }
                                if (processedDeptIds.add(deptId)) {
                                    // Check DB duplicate mapping
                                    boolean duplicate = false;
                                    try (java.sql.PreparedStatement checkPs = conn.prepareStatement(
                                            "SELECT 1 FROM QMS_MEETING_DEPARTMENT_MAPPING WHERE SCHEDULE_ID = ? AND DEPARTMENT_ID = ?")) {
                                        checkPs.setLong(1, legacyRowId);
                                        checkPs.setLong(2, deptId);
                                        try (java.sql.ResultSet rs = checkPs.executeQuery()) {
                                            if (rs.next()) {
                                                duplicate = true;
                                            }
                                        }
                                    }
                                    if (!duplicate) {
                                        try (java.sql.PreparedStatement insertPs = conn.prepareStatement(
                                                "INSERT INTO QMS_MEETING_DEPARTMENT_MAPPING (SCHEDULE_ID, DEPARTMENT_ID, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)")) {
                                            insertPs.setLong(1, legacyRowId);
                                            insertPs.setLong(2, deptId);
                                            insertPs.executeUpdate();
                                        }
                                    }
                                }
                            }
                        }

                        // New mapping logic for QMS_MEETING_PARTICIPANT_MAPPING
                        if (record.get("PARTICIPANTS") != null) {
                            String legacyParts = String.valueOf(record.get("PARTICIPANTS"));
                            String[] partCodes = legacyParts.split(",");
                            java.util.Set<Long> processedEmpIds = new java.util.HashSet<>();
                            for (String pCode : partCodes) {
                                pCode = pCode.trim();
                                if (pCode.isEmpty())
                                    continue;
                                Long empId = getEmployeeIdByEmpCode(pCode);
                                if (empId == null) {
                                    System.err.println("[MIGRATION] Missing employee code: " + pCode
                                            + " along with Meeting ID: " + legacyRowId);
                                    continue;
                                }
                                if (processedEmpIds.add(empId)) {
                                    // Check DB duplicate mapping
                                    boolean duplicate = false;
                                    try (java.sql.PreparedStatement checkPs = conn.prepareStatement(
                                            "SELECT 1 FROM QMS_MEETING_PARTICIPANT_MAPPING WHERE SCHEDULE_ID = ? AND EMPLOYEE_ID = ?")) {
                                        checkPs.setLong(1, legacyRowId);
                                        checkPs.setLong(2, empId);
                                        try (java.sql.ResultSet rs = checkPs.executeQuery()) {
                                            if (rs.next()) {
                                                duplicate = true;
                                            }
                                        }
                                    }
                                    if (!duplicate) {
                                        try (java.sql.PreparedStatement insertPs = conn.prepareStatement(
                                                "INSERT INTO QMS_MEETING_PARTICIPANT_MAPPING (SCHEDULE_ID, EMPLOYEE_ID, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)")) {
                                            insertPs.setLong(1, legacyRowId);
                                            insertPs.setLong(2, empId);
                                            insertPs.executeUpdate();
                                        }
                                    }
                                }
                            }
                        }

                        // Attachment path inserts
                        for (String fileName : fFiles) {
                            String logicalPath = AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_MEETING_SCHEDULE_PATH
                                    + "/" + fileName;
                            try (java.sql.PreparedStatement attachPs = conn.prepareStatement(
                                    "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES ('QM1310', ?, 'MEETING SCHEDULE', ?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)")) {
                                attachPs.setLong(1, legacyRowId);
                                attachPs.setString(2, logicalPath);
                                attachPs.setString(3, fileName);
                                attachPs.executeUpdate();
                            }
                        }

                    } catch (Exception e) {
                        if (savepoint != null) {
                            try {
                                conn.rollback(savepoint);
                            } catch (Exception ex) {
                                // ignore
                            }
                        }
                        throw e;
                    } finally {
                        if (autoCommit) {
                            try {
                                conn.setAutoCommit(true);
                            } catch (Exception ex) {
                                // ignore
                            }
                        }
                    }
                    return null;
                });

                // Update migrated files counter
                filesMigratedCount += fFiles.size();
                migratedCount++;
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update(
                        "meetingSchedule",
                        migratedCount);

            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("meetingSchedule");
        return "Successfully migrated " + migratedCount + " meeting schedule records and " + filesMigratedCount
                + " attachments. Skipped: " + skippedCount + ".";
    }

    /**
     * Stub: Clear Meeting Master data (for dev/reset use only).
     */
    public String clearMeetingMaster() {
        return "Clear Meeting Master: no legacy data to clear.";
    }

    /**
     * Clear Meeting Schedule data (for dev/reset use only).
     */
    @Transactional
    public String clearMeetingSchedule() {
        try {
            // Delete QMS_ATTACHMENT_PATH for QM1310
            try {
                @SuppressWarnings("unchecked")
                java.util.List<String> paths = entityManager
                        .createNativeQuery("SELECT PATH FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'QM1310'")
                        .getResultList();
                for (String p : paths) {
                    if (p != null && !p.trim().isEmpty()) {
                        fileService.deleteFile(p.trim());
                    }
                }
                entityManager.createNativeQuery("DELETE FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'QM1310'")
                        .executeUpdate();
            } catch (Exception ignore) {
            }

            entityManager.createNativeQuery("DELETE FROM QMS_MEETING_PARTICIPANT_MAPPING").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM QMS_MEETING_DEPARTMENT_MAPPING").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM QMS_MEETING_SCHEDULE_PARTICIPANT").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM QMS_MEETING_SCHEDULE_DEPARTMENT").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM QMS_MEETING_SCHEDULE").executeUpdate();
            try {
                entityManager.createNativeQuery("DBCC CHECKIDENT ('QMS_MEETING_SCHEDULE', RESEED, 0)").executeUpdate();
            } catch (Exception ignore) {
            }
            try {
                entityManager.createNativeQuery("DBCC CHECKIDENT ('QMS_MEETING_PARTICIPANT_MAPPING', RESEED, 0)")
                        .executeUpdate();
            } catch (Exception ignore) {
            }
            try {
                entityManager.createNativeQuery("DBCC CHECKIDENT ('QMS_MEETING_DEPARTMENT_MAPPING', RESEED, 0)")
                        .executeUpdate();
            } catch (Exception ignore) {
            }
            return "Cleared all meeting schedule records, participants, departments and attachments.";
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to clear Meeting Schedule: " + e.getMessage());
        }
    }

    @Transactional
    public String migrateMeetingUserAttendance() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        List<Map<String, Object>> records;
        try {
            records = jdbcTemplate.queryForList("SELECT * FROM MEETING_USER_ATTENDANCE");
        } catch (Exception e) {
            return "Failed to fetch from MEETING_USER_ATTENDANCE: " + e.getMessage();
        }

        int migratedCount = 0;
        int skippedCount = 0;
        int noScheduleCount = 0;
        int noEmployeeCount = 0;
        int duplicateCount = 0;

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start("meetingUserAttendance",
                records.size());

        for (Map<String, Object> record : records) {
            if (stopFlag.get()) {
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .fail("meetingUserAttendance");
                return "Migration stopped manually.";
            }
            try {
                // 1. Resolve Schedule ID
                String schNo = record.get("SCH_NO") != null ? String.valueOf(record.get("SCH_NO")).trim() : null;
                if (schNo == null || schNo.isEmpty()) {
                    schNo = record.get("SCH_ROW_ID") != null ? String.valueOf(record.get("SCH_ROW_ID")).trim() : null;
                }
                if (schNo == null || schNo.isEmpty()) {
                    schNo = record.get("MEETING_SCH_NO") != null ? String.valueOf(record.get("MEETING_SCH_NO")).trim() : null;
                }
                if (schNo == null || schNo.isEmpty()) {
                    schNo = record.get("SCHEDULE_ID") != null ? String.valueOf(record.get("SCHEDULE_ID")).trim() : null;
                }
                if (schNo == null || schNo.isEmpty()) {
                    schNo = record.get("MEETING_SCH_ID") != null ? String.valueOf(record.get("MEETING_SCH_ID")).trim() : null;
                }
                if (schNo == null || schNo.isEmpty()) {
                    schNo = record.get("MEET_SCH_ID") != null ? String.valueOf(record.get("MEET_SCH_ID")).trim() : null;
                }
                if (schNo == null || schNo.isEmpty()) {
                    schNo = record.get("REF_ROW_ID") != null ? String.valueOf(record.get("REF_ROW_ID")).trim() : null;
                }
                if (schNo == null || schNo.isEmpty()) {
                    schNo = record.get("REF_ID") != null ? String.valueOf(record.get("REF_ID")).trim() : null;
                }

                if (schNo == null || schNo.isEmpty()) {
                    skippedCount++;
                    noScheduleCount++;
                    continue;
                }

                List<?> scheduleIds = entityManager.createNativeQuery(
                        "SELECT ID FROM QMS_MEETING_SCHEDULE WHERE SCHEDULE_NO = ? OR CAST(ID AS VARCHAR) = ?")
                        .setParameter(1, schNo)
                        .setParameter(2, schNo)
                        .getResultList();

                if (scheduleIds.isEmpty()) {
                    try {
                        String legacySchNo = jdbcTemplate.queryForObject(
                                "SELECT SCH_NO FROM MEETING_SCHEDULE_MASTER WHERE CAST(ROW_ID AS VARCHAR) = ? OR SCH_NO = ?", String.class, schNo, schNo);
                        if (legacySchNo != null) {
                            scheduleIds = entityManager.createNativeQuery(
                                    "SELECT ID FROM QMS_MEETING_SCHEDULE WHERE SCHEDULE_NO = ? OR CAST(ID AS VARCHAR) = ?")
                                    .setParameter(1, legacySchNo.trim())
                                    .setParameter(2, legacySchNo.trim())
                                    .getResultList();
                        }
                    } catch (Exception ignore) {}
                }

                if (scheduleIds.isEmpty()) {
                    skippedCount++;
                    noScheduleCount++;
                    continue; // Skip if no matching schedule exists in new schema
                }
                Long scheduleId = ((Number) scheduleIds.get(0)).longValue();

                // 2. Resolve Employee ID
                Object attendeeObj = record.get("MEET_ATTENDEE_ID");
                if (attendeeObj == null) attendeeObj = record.get("ATTENDEE_ID");
                if (attendeeObj == null) attendeeObj = record.get("EMP_CODE");
                if (attendeeObj == null) attendeeObj = record.get("EMP_ID");
                if (attendeeObj == null) attendeeObj = record.get("USER_ID");
                if (attendeeObj == null) attendeeObj = record.get("EMPLOYEE_ID");
                if (attendeeObj == null) attendeeObj = record.get("ATTENDEE");
                if (attendeeObj == null) attendeeObj = record.get("MEMBER_ID");

                if (attendeeObj == null) {
                    skippedCount++;
                    noEmployeeCount++;
                    continue;
                }

                Long employeeId = resolveEmployeeByLegacyCode(attendeeObj);
                if (employeeId == null) {
                    skippedCount++;
                    noEmployeeCount++;
                    continue; // Skip if employee is not found in the new schema
                }

                // 3. Resolve Status ID from AD_STATUS_MASTER
                String legacyStatus = record.get("ATTENDANCE_STATUS") != null
                        ? String.valueOf(record.get("ATTENDANCE_STATUS")).trim().toUpperCase()
                        : "PRESENT";

                Long statusId = null;
                List<?> statusList = entityManager.createNativeQuery(
                        "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = ?")
                        .setParameter(1, legacyStatus)
                        .getResultList();
                if (!statusList.isEmpty()) {
                    statusId = ((Number) statusList.get(0)).longValue();
                } else {
                    entityManager.createNativeQuery("INSERT INTO AD_STATUS_MASTER (NAME) VALUES (?)")
                            .setParameter(1, legacyStatus)
                            .executeUpdate();
                    List<?> newStatusList = entityManager.createNativeQuery(
                            "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = ?")
                            .setParameter(1, legacyStatus)
                            .getResultList();
                    if (!newStatusList.isEmpty()) {
                        statusId = ((Number) newStatusList.get(0)).longValue();
                    }
                }

                // 4. Extract times and active status
                String inTimeStr = record.get("IN_TIME") != null ? String.valueOf(record.get("IN_TIME")).trim() : null;
                String outTimeStr = record.get("OUT_TIME") != null ? String.valueOf(record.get("OUT_TIME")).trim()
                        : null;

                java.time.LocalTime inTime = parseLocalTime(inTimeStr);
                java.time.LocalTime outTime = parseLocalTime(outTimeStr);

                // Check for duplicates
                List<?> existing = entityManager.createNativeQuery(
                        "SELECT id FROM QMS_MEETING_USER_ATTENDANCE WHERE SCHEDULE_ID = ? AND EMPLOYEE_ID = ?")
                        .setParameter(1, scheduleId)
                        .setParameter(2, employeeId)
                        .getResultList();

                if (!existing.isEmpty()) {
                    skippedCount++;
                    duplicateCount++;
                    continue;
                }

                String insertSql = "INSERT INTO QMS_MEETING_USER_ATTENDANCE (SCHEDULE_ID, EMPLOYEE_ID, IN_TIME, OUT_TIME, STATUS, IS_ACTIVE, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) "
                        + "VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)";

                String createdBy = resolveUserId(
                        record.get("CREATE_USER") != null ? String.valueOf(record.get("CREATE_USER")) : "SUPER BOSS");
                String updatedBy = resolveUserId(
                        record.get("LAST_UPDT_USER") != null ? String.valueOf(record.get("LAST_UPDT_USER"))
                                : "SUPER BOSS");
                Object createdDate = record.get("CREATE_DT");
                Object updatedDate = record.get("LAST_UPDT_DT");

                entityManager.createNativeQuery(insertSql)
                        .setParameter(1, scheduleId)
                        .setParameter(2, employeeId)
                        .setParameter(3, inTime)
                        .setParameter(4, outTime)
                        .setParameter(5, statusId)
                        .setParameter(6, createdBy)
                        .setParameter(7, createdDate != null ? createdDate : new java.util.Date())
                        .setParameter(8, updatedBy)
                        .setParameter(9, updatedDate != null ? updatedDate : new java.util.Date())
                        .executeUpdate();

                migratedCount++;
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .update("meetingUserAttendance", migratedCount);

            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                .complete("meetingUserAttendance");
        return "Successfully migrated " + migratedCount + " meeting user attendance records. Skipped: " + skippedCount
                + " (No matching Schedule: " + noScheduleCount + ", No matching Employee: " + noEmployeeCount + ", Duplicates: " + duplicateCount + ").";
    }

    private java.time.LocalTime parseLocalTime(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty() || "00:00".equals(timeStr.trim())
                || "00:00:00".equals(timeStr.trim())) {
            return null;
        }
        String t = timeStr.trim();
        String[] parts = t.split(":");
        if (parts.length >= 2) {
            try {
                int hour = Integer.parseInt(parts[0]);
                int minute = Integer.parseInt(parts[1]);
                int second = 0;
                if (parts.length >= 3) {
                    String secPart = parts[2].split("\\.")[0];
                    second = Integer.parseInt(secPart);
                }
                return java.time.LocalTime.of(hour, minute, second);
            } catch (Exception e) {
                // Return null if parsing fails
            }
        }
        return null;
    }

    private String resolveUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            userId = "SUPER BOSS";
        } else {
            userId = userId.trim();
        }
        try {
            List<?> list = entityManager.createNativeQuery("SELECT 1 FROM AD_USER_CREDENTIAL WHERE USER_ID = ?")
                    .setParameter(1, userId)
                    .getResultList();
            if (!list.isEmpty()) {
                return userId;
            }
            // Check if Admin exists
            List<?> adminCheck = entityManager
                    .createNativeQuery("SELECT 1 FROM AD_USER_CREDENTIAL WHERE USER_ID = 'SUPER BOSS'")
                    .getResultList();
            if (!adminCheck.isEmpty()) {
                return "SUPER BOSS";
            }
            // Otherwise, fetch any valid USER_ID
            List<?> defaultUser = entityManager.createNativeQuery("SELECT TOP 1 USER_ID FROM AD_USER_CREDENTIAL")
                    .getResultList();
            if (!defaultUser.isEmpty()) {
                return String.valueOf(defaultUser.get(0));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "SUPER BOSS";
    }

    @Transactional
    public String clearMeetingUserAttendance() {
        try {
            entityManager.createNativeQuery("DELETE FROM QMS_MEETING_USER_ATTENDANCE").executeUpdate();
            return "Successfully cleared Meeting User Attendance.";
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to clear Meeting User Attendance: " + e.getMessage());
        }
    }

    @Transactional
    public String clearMeetingMom() {
        try {
            entityManager.createNativeQuery("DELETE FROM QMS_MOM_DETAILS").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM QMS_MOM_MASTER").executeUpdate();
            return "Successfully cleared Meeting MOM Master and Details.";
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to clear Meeting MOM: " + e.getMessage());
        }
    }

    @Transactional
    public String migrateMeetingMom() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        List<Map<String, Object>> masters;
        try {
            masters = jdbcTemplate.queryForList("SELECT * FROM MEETING_MINUTES_MASTER");
        } catch (Exception e) {
            return "Failed to fetch from MEETING_MINUTES_MASTER: " + e.getMessage();
        }

        int migratedCount = 0;
        int skippedCount = 0;
        int detailMigratedCount = 0;

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start("meetingMom",
                masters.size());

        for (Map<String, Object> master : masters) {
            if (stopFlag.get()) {
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("meetingMom");
                return "Migration stopped manually.";
            }

            try {
                // Get row ID for linking trans records
                Object rowIdObj = master.get("ROW_ID");
                if (rowIdObj == null) {
                    skippedCount++;
                    continue;
                }
                int legacyRowId = ((Number) rowIdObj).intValue();

                // 1. Resolve Schedule ID
                String schNo = master.get("MEETING_SCH_NO") != null
                        ? String.valueOf(master.get("MEETING_SCH_NO")).trim()
                        : null;
                if (schNo == null || schNo.isEmpty()) {
                    skippedCount++;
                    continue;
                }

                List<?> scheduleIds = entityManager.createNativeQuery(
                        "SELECT ID FROM QMS_MEETING_SCHEDULE WHERE SCHEDULE_NO = ?")
                        .setParameter(1, schNo)
                        .getResultList();

                if (scheduleIds.isEmpty()) {
                    skippedCount++;
                    continue; // Skip if no matching schedule exists in new schema
                }
                Long scheduleId = ((Number) scheduleIds.get(0)).longValue();

                // 2. Resolve Status ID from AD_STATUS_MASTER
                String legacyStatus = master.get("MEETING_STATUS") != null
                        ? String.valueOf(master.get("MEETING_STATUS")).trim().toUpperCase()
                        : "OPEN";
                if (legacyStatus.isEmpty()) {
                    legacyStatus = "OPEN";
                }

                Long statusId = null;
                List<?> statusList = entityManager.createNativeQuery(
                        "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = ?")
                        .setParameter(1, legacyStatus)
                        .getResultList();
                if (!statusList.isEmpty()) {
                    statusId = ((Number) statusList.get(0)).longValue();
                } else {
                    entityManager.createNativeQuery("INSERT INTO AD_STATUS_MASTER (NAME) VALUES (?)")
                            .setParameter(1, legacyStatus)
                            .executeUpdate();
                    List<?> newStatusList = entityManager.createNativeQuery(
                            "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = ?")
                            .setParameter(1, legacyStatus)
                            .getResultList();
                    if (!newStatusList.isEmpty()) {
                        statusId = ((Number) newStatusList.get(0)).longValue();
                    }
                }

                // 3. Resolve Chaired By ID from schedule if possible
                Long chairedById = null;
                List<?> chairedByList = entityManager.createNativeQuery(
                        "SELECT CHAIRED_BY_ID FROM QMS_MEETING_SCHEDULE WHERE ID = ?")
                        .setParameter(1, scheduleId)
                        .getResultList();
                if (!chairedByList.isEmpty() && chairedByList.get(0) != null) {
                    chairedById = ((Number) chairedByList.get(0)).longValue();
                }

                // 4. Resolve START_TIME and END_TIME from the first non-null trans record
                String momNo = master.get("MEETING_MIN_NO") != null
                        ? String.valueOf(master.get("MEETING_MIN_NO")).trim()
                        : null;
                java.time.LocalTime startTime = null;
                java.time.LocalTime endTime = null;
                if (legacyRowId > 0) {
                    List<Map<String, Object>> timeRecords = jdbcTemplate.queryForList(
                            "SELECT START_TIME, END_TIME FROM MEETING_MINUTE_TRANS WHERE MEETING_ID = ? AND START_TIME IS NOT NULL",
                            legacyRowId);
                    if (!timeRecords.isEmpty()) {
                        String startStr = (String) timeRecords.get(0).get("START_TIME");
                        String endStr = (String) timeRecords.get(0).get("END_TIME");
                        startTime = parseLocalTime(startStr);
                        endTime = parseLocalTime(endStr);
                    }
                }

                // Check for duplicates
                List<?> existing = entityManager.createNativeQuery(
                        "SELECT id FROM QMS_MOM_MASTER WHERE MOM_NO = ?")
                        .setParameter(1, momNo)
                        .getResultList();

                Long momId = null;
                if (!existing.isEmpty()) {
                    momId = ((Number) existing.get(0)).longValue();
                } else {
                    final long finalLegacyRowId = legacyRowId;
                    final String finalMomNo = momNo;
                    final Object finalMomDate = master.get("MEETING_MIN_DT");
                    final Long finalScheduleId = scheduleId;
                    final Long finalChairedById = chairedById;
                    final java.time.LocalTime finalStartTime = startTime;
                    final java.time.LocalTime finalEndTime = endTime;
                    final Long finalStatusId = statusId;
                    final String finalCreatedBy = resolveUserId(
                            master.get("CREATE_USER_ID") != null ? String.valueOf(master.get("CREATE_USER_ID")).trim()
                                    : "SUPER BOSS");
                    final String finalUpdatedBy = resolveUserId(
                            master.get("LAST_UPDT_USER") != null ? String.valueOf(master.get("LAST_UPDT_USER")).trim()
                                    : "SUPER BOSS");
                    final Object finalCreatedDate = master.get("CREATE_DT");
                    final Object finalUpdatedDate = master.get("LAST_UPDT_DT");

                    primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
                        try (java.sql.Statement stmt = conn.createStatement()) {
                            stmt.execute("SET IDENTITY_INSERT QMS_MOM_MASTER ON");
                        } catch (java.sql.SQLException e) {
                            System.err.println("[MIGRATION] Failed to set IDENTITY_INSERT ON for QMS_MOM_MASTER: "
                                    + e.getMessage());
                        }

                        String insertMasterSql = "INSERT INTO QMS_MOM_MASTER (id, MOM_NO, MOM_DATE, SCHEDULE_ID, CHAIRED_BY_ID, START_TIME, END_TIME, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE, IS_ACTIVE) "
                                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";

                        try (java.sql.PreparedStatement ps = conn.prepareStatement(insertMasterSql)) {
                            ps.setLong(1, finalLegacyRowId);
                            ps.setString(2, finalMomNo);
                            ps.setDate(3,
                                    finalMomDate != null ? new java.sql.Date(((java.util.Date) finalMomDate).getTime())
                                            : new java.sql.Date(System.currentTimeMillis()));
                            ps.setLong(4, finalScheduleId);
                            ps.setObject(5, finalChairedById, java.sql.Types.BIGINT);
                            ps.setTime(6, finalStartTime != null ? java.sql.Time.valueOf(finalStartTime) : null);
                            ps.setTime(7, finalEndTime != null ? java.sql.Time.valueOf(finalEndTime) : null);
                            ps.setObject(8, finalStatusId, java.sql.Types.BIGINT);
                            ps.setString(9, finalCreatedBy);
                            ps.setTimestamp(10,
                                    finalCreatedDate != null
                                            ? new java.sql.Timestamp(((java.util.Date) finalCreatedDate).getTime())
                                            : new java.sql.Timestamp(System.currentTimeMillis()));
                            ps.setString(11, finalUpdatedBy);
                            ps.setTimestamp(12,
                                    finalUpdatedDate != null
                                            ? new java.sql.Timestamp(((java.util.Date) finalUpdatedDate).getTime())
                                            : null);
                            ps.executeUpdate();
                        } finally {
                            try (java.sql.Statement stmt = conn.createStatement()) {
                                stmt.execute("SET IDENTITY_INSERT QMS_MOM_MASTER OFF");
                            } catch (java.sql.SQLException e) {
                                System.err.println("[MIGRATION] Failed to set IDENTITY_INSERT OFF for QMS_MOM_MASTER: "
                                        + e.getMessage());
                            }
                        }
                        return null;
                    });
                    momId = (long) legacyRowId;
                    migratedCount++;
                }

                if (momId != null && legacyRowId > 0) {
                    // Migrate Detail records linked by MEETING_ID
                    List<Map<String, Object>> details = jdbcTemplate.queryForList(
                            "SELECT * FROM MEETING_MINUTE_TRANS WHERE MEETING_ID = ?", legacyRowId);

                    if (!details.isEmpty()) {
                        final Long finalMomId = momId;
                        final java.util.concurrent.atomic.AtomicInteger detailCount = new java.util.concurrent.atomic.AtomicInteger(
                                0);

                        primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
                            try (java.sql.Statement stmt = conn.createStatement()) {
                                stmt.execute("SET IDENTITY_INSERT QMS_MOM_DETAILS ON");
                            } catch (java.sql.SQLException e) {
                                System.err.println("[MIGRATION] Failed to set IDENTITY_INSERT ON for QMS_MOM_DETAILS: "
                                        + e.getMessage());
                            }

                            String insertDetailSql = "INSERT INTO QMS_MOM_DETAILS ("
                                    + "ID, MOM_ID, MIN_NO, DISCUSSED_POINT, POINT_TYPE_ID, PROCESS_TYPE_ID, "
                                    + "ASSIGNED_BY_ID, ASSIGNED_TO_ID, TARGET_DATE, REVIEW_DATE, "
                                    + "ATTACHMENT_REQUIRED, ATTACHMENT_INFO, STATUS, ACTION_TAKEN, "
                                    + "CANCEL_REMARKS, REV_NO, AMENDMENT_COMMENTS, CREATED_BY, "
                                    + "CREATED_DATE, UPDATED_BY, UPDATED_DATE, IS_ACTIVE"
                                    + ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";

                            try (java.sql.PreparedStatement ps = conn.prepareStatement(insertDetailSql)) {
                                for (Map<String, Object> det : details) {
                                    String discussedPoint = det.get("DISCUSSED_POINT") != null
                                            ? String.valueOf(det.get("DISCUSSED_POINT")).trim()
                                            : "";
                                    if (discussedPoint.isEmpty()) {
                                        continue;
                                    }

                                    String legacyMeetMinNo = det.get("MEET_MIN_NO") != null
                                            ? String.valueOf(det.get("MEET_MIN_NO")).trim()
                                            : null;

                                    // Prefix discussed point as in saveMom()
                                    String prefix = "[" + momNo + "] ";
                                    if (!discussedPoint.startsWith("[")) {
                                        discussedPoint = prefix + discussedPoint;
                                    }

                                    // Check duplicate details using the connection conn
                                    boolean hasDuplicate = false;
                                    try (java.sql.PreparedStatement checkPs = conn.prepareStatement(
                                            "SELECT 1 FROM QMS_MOM_DETAILS WHERE MOM_ID = ? AND DISCUSSED_POINT = ?")) {
                                        checkPs.setLong(1, finalMomId);
                                        checkPs.setString(2, discussedPoint);
                                        try (java.sql.ResultSet checkRs = checkPs.executeQuery()) {
                                            if (checkRs.next()) {
                                                hasDuplicate = true;
                                            }
                                        }
                                    }

                                    if (hasDuplicate) {
                                        continue;
                                    }

                                    // Resolve Point Type ID
                                    String matType = det.get("MAT_TYPE") != null
                                            ? String.valueOf(det.get("MAT_TYPE")).trim().toUpperCase()
                                            : "PROCESS";
                                    if (matType.isEmpty()) {
                                        matType = "PROCESS";
                                    }
                                    Long pointTypeId = null;
                                    try (java.sql.PreparedStatement ptPs = conn.prepareStatement(
                                            "SELECT ID FROM QMS_POINT_TYPE_MASTER WHERE UPPER(CODE) = ?")) {
                                        ptPs.setString(1, matType);
                                        try (java.sql.ResultSet ptRs = ptPs.executeQuery()) {
                                            if (ptRs.next()) {
                                                pointTypeId = ptRs.getLong(1);
                                            }
                                        }
                                    }

                                    // Resolve Process Type ID
                                    String process = det.get("PROCESS") != null
                                            ? String.valueOf(det.get("PROCESS")).trim().toUpperCase()
                                            : "INFO";
                                    if (process.isEmpty()) {
                                        process = "INFO";
                                    }
                                    Long processTypeId = null;
                                    try (java.sql.PreparedStatement procPs = conn.prepareStatement(
                                            "SELECT ID FROM QMS_PROCESS_TYPE_MASTER WHERE UPPER(CODE) = ?")) {
                                        procPs.setString(1, process);
                                        try (java.sql.ResultSet procRs = procPs.executeQuery()) {
                                            if (procRs.next()) {
                                                processTypeId = procRs.getLong(1);
                                            }
                                        }
                                    }

                                    // Resolve Assigned To ID
                                    Long assignedToId = null;
                                    Object assignToObj = det.get("ASSIGN_TO");
                                    if (assignToObj != null) {
                                        try (java.sql.PreparedStatement empPs = conn
                                                .prepareStatement("SELECT ID FROM HR_EMPLOYEE WHERE EMP_CODE = ?")) {
                                            empPs.setString(1, String.valueOf(assignToObj).trim());
                                            try (java.sql.ResultSet empRs = empPs.executeQuery()) {
                                                if (empRs.next()) {
                                                    assignedToId = empRs.getLong(1);
                                                }
                                            }
                                        }
                                    }

                                    // Resolve Assigned By ID
                                    Long assignedById = null;
                                    Object assignByObj = det.get("ASSIGN_BY");
                                    if (assignByObj != null) {
                                        try (java.sql.PreparedStatement empPs = conn
                                                .prepareStatement("SELECT ID FROM HR_EMPLOYEE WHERE EMP_CODE = ?")) {
                                            empPs.setString(1, String.valueOf(assignByObj).trim());
                                            try (java.sql.ResultSet empRs = empPs.executeQuery()) {
                                                if (empRs.next()) {
                                                    assignedById = empRs.getLong(1);
                                                }
                                            }
                                        }
                                    }

                                    // Resolve Status ID for Detail
                                    String detailStatus = det.get("STATUS") != null
                                            ? String.valueOf(det.get("STATUS")).trim()
                                            : ("INFO".equals(process) ? "CLOSED" : "OPEN");
                                    if (detailStatus.isEmpty()) {
                                        detailStatus = "INFO".equals(process) ? "CLOSED" : "OPEN";
                                    }
                                    Long detailStatusId = null;
                                    try (java.sql.PreparedStatement statusPs = conn.prepareStatement(
                                            "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(NAME) = ?")) {
                                        statusPs.setString(1, detailStatus.toUpperCase());
                                        try (java.sql.ResultSet statusRs = statusPs.executeQuery()) {
                                            if (statusRs.next()) {
                                                detailStatusId = statusRs.getLong(1);
                                            }
                                        }
                                    }
                                    if (detailStatusId == null) {
                                        try (java.sql.PreparedStatement insertStatusPs = conn.prepareStatement(
                                                "INSERT INTO AD_STATUS_MASTER (NAME) VALUES (?)",
                                                java.sql.Statement.RETURN_GENERATED_KEYS)) {
                                            insertStatusPs.setString(1, detailStatus);
                                            insertStatusPs.executeUpdate();
                                            try (java.sql.ResultSet generatedKeys = insertStatusPs.getGeneratedKeys()) {
                                                if (generatedKeys.next()) {
                                                    detailStatusId = generatedKeys.getLong(1);
                                                }
                                            }
                                        }
                                    }

                                    // Attachment info & migration from FILE_UPLOAD_TRANS (FROM_WHERE = 'MEETING
                                    // MINUTES') using REF_ROW_ID!
                                    long legacyDetailId = ((Number) det.get("REF_ROW_ID")).longValue();

                                    String fileSql = "SELECT FILE_NAME FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE = 'MEETING MINUTES' AND REF_ROW_ID = "
                                            + legacyDetailId;
                                    List<String> files = jdbcTemplate.queryForList(fileSql, String.class);
                                    List<String> validFiles = new java.util.ArrayList<>();
                                    for (String fName : files) {
                                        if (fName == null || fName.trim().isEmpty())
                                            continue;
                                        fName = fName.trim();
                                        validFiles.add(fName);

                                        // Physical file copy from HRMS erpimage directory
                                        java.io.File sourceFile = new java.io.File(
                                                getSecondaryProcessImgLocation() + "\\HRMS", fName);
                                        if (sourceFile.exists()) {
                                            try {
                                                java.nio.file.Path rootPath = fileService.getRootPath();
                                                java.io.File targetDir = rootPath.resolve(
                                                        AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_MINUTES_OF_MEETING_PATH)
                                                        .toFile();
                                                if (!targetDir.exists())
                                                    targetDir.mkdirs();
                                                java.io.File targetFile = new java.io.File(targetDir, fName);
                                                java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                                                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                                            } catch (Exception ex) {
                                                System.err.println(
                                                        "[MIGRATION] File copy exception for " + fName + ": "
                                                                + ex.getMessage());
                                            }
                                        }

                                        // Insert into QMS_ATTACHMENT_PATH
                                        try {
                                            String logicalPath = AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_MINUTES_OF_MEETING_PATH
                                                    + "/" + fName;
                                            try (java.sql.PreparedStatement attPs = conn.prepareStatement(
                                                    "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES ('QM1320', ?, 'MEETING MINUTES', ?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)")) {
                                                attPs.setLong(1, legacyDetailId);
                                                attPs.setString(2, logicalPath);
                                                attPs.setString(3, fName);
                                                attPs.executeUpdate();
                                            }
                                        } catch (Exception ex) {
                                            System.err.println(
                                                    "[MIGRATION] DB insert failed for attachment " + fName + ": "
                                                            + ex.getMessage());
                                        }
                                    }

                                    // Fallback to detail column file name if nothing in FILE_UPLOAD_TRANS
                                    if (validFiles.isEmpty()) {
                                        String legacyFileName = det.get("FILE_NAME") != null
                                                ? String.valueOf(det.get("FILE_NAME")).trim()
                                                : null;
                                        if (legacyFileName != null && !legacyFileName.isEmpty()) {
                                            validFiles.add(legacyFileName);
                                            java.io.File sourceFile = new java.io.File(
                                                    getSecondaryProcessImgLocation() + "\\HRMS", legacyFileName);
                                            if (sourceFile.exists()) {
                                                try {
                                                    java.nio.file.Path rootPath = fileService.getRootPath();
                                                    java.io.File targetDir = rootPath.resolve(
                                                            AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_MINUTES_OF_MEETING_PATH)
                                                            .toFile();
                                                    if (!targetDir.exists())
                                                        targetDir.mkdirs();
                                                    java.io.File targetFile = new java.io.File(targetDir,
                                                            legacyFileName);
                                                    java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                                                            java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                                                } catch (Exception ex) {
                                                    System.err.println(
                                                            "[MIGRATION] File copy exception for " + legacyFileName
                                                                    + ": " + ex.getMessage());
                                                }
                                            }

                                            try {
                                                String logicalPath = AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_MINUTES_OF_MEETING_PATH
                                                        + "/" + legacyFileName;
                                                try (java.sql.PreparedStatement attPs = conn.prepareStatement(
                                                        "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES ('QM1320', ?, 'MEETING MINUTES', ?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)")) {
                                                    attPs.setLong(1, legacyDetailId);
                                                    attPs.setString(2, logicalPath);
                                                    attPs.setString(3, legacyFileName);
                                                    attPs.executeUpdate();
                                                }
                                            } catch (Exception ex) {
                                                System.err.println(
                                                        "[MIGRATION] DB insert failed for attachment " + legacyFileName
                                                                + ": " + ex.getMessage());
                                            }
                                        }
                                    }

                                    String attachmentInfo = null;
                                    String attachmentRequired = "NO";
                                    if (!validFiles.isEmpty()) {
                                        attachmentRequired = "YES";
                                        StringBuilder sb = new StringBuilder("[");
                                        for (int i = 0; i < validFiles.size(); i++) {
                                            sb.append("{\"fileName\":\"").append(validFiles.get(i)).append("\"}");
                                            if (i < validFiles.size() - 1) {
                                                sb.append(",");
                                            }
                                        }
                                        sb.append("]");
                                        attachmentInfo = sb.toString();
                                    }

                                    // Dates
                                    Object targetDate = det.get("TARGET_DATE");
                                    Object reviewDate = det.get("REVIEW_DATE");

                                    String dCreatedBy = resolveUserId(
                                            det.get("CREATE_USER_ID") != null
                                                    ? String.valueOf(det.get("CREATE_USER_ID")).trim()
                                                    : "SUPER BOSS");
                                    String dUpdatedBy = resolveUserId(
                                            det.get("LAST_UPDT_USER") != null
                                                    ? String.valueOf(det.get("LAST_UPDT_USER")).trim()
                                                    : "SUPER BOSS");
                                    Object dCreatedDate = det.get("CREATE_DT");
                                    Object dUpdatedDate = det.get("LAST_UPDT_DT");
                                    int revNo = det.get("REV_MEETMIN_NO") != null
                                            ? ((Number) det.get("REV_MEETMIN_NO")).intValue()
                                            : 0;
                                    String cancelRemarks = det.get("CANCEL_REASON_MOM") != null
                                            ? String.valueOf(det.get("CANCEL_REASON_MOM")).trim()
                                            : null;
                                    String actionTaken = det.get("ACTION_TAKEN") != null
                                            ? String.valueOf(det.get("ACTION_TAKEN")).trim()
                                            : null;
                                    String comments = det.get("COMMENTS") != null
                                            ? String.valueOf(det.get("COMMENTS")).trim()
                                            : null;

                                    ps.setLong(1, legacyDetailId);
                                    ps.setLong(2, finalMomId);
                                    ps.setString(3, legacyMeetMinNo);
                                    ps.setString(4, discussedPoint);
                                    ps.setObject(5, pointTypeId, java.sql.Types.BIGINT);
                                    ps.setObject(6, processTypeId, java.sql.Types.BIGINT);
                                    ps.setObject(7, assignedById, java.sql.Types.BIGINT);
                                    ps.setObject(8, assignedToId, java.sql.Types.BIGINT);
                                    ps.setDate(9,
                                            targetDate != null
                                                    ? new java.sql.Date(((java.util.Date) targetDate).getTime())
                                                    : null);
                                    ps.setDate(10,
                                            reviewDate != null
                                                    ? new java.sql.Date(((java.util.Date) reviewDate).getTime())
                                                    : null);
                                    ps.setString(11, attachmentRequired);
                                    ps.setString(12, attachmentInfo);
                                    ps.setObject(13, detailStatusId, java.sql.Types.BIGINT);
                                    ps.setString(14, actionTaken);
                                    ps.setString(15, cancelRemarks);
                                    ps.setInt(16, revNo);
                                    ps.setString(17, comments);
                                    ps.setString(18, dCreatedBy);
                                    ps.setTimestamp(19,
                                            dCreatedDate != null
                                                    ? new java.sql.Timestamp(((java.util.Date) dCreatedDate).getTime())
                                                    : new java.sql.Timestamp(System.currentTimeMillis()));
                                    ps.setString(20, dUpdatedBy);
                                    ps.setTimestamp(21,
                                            dUpdatedDate != null
                                                    ? new java.sql.Timestamp(((java.util.Date) dUpdatedDate).getTime())
                                                    : new java.sql.Timestamp(System.currentTimeMillis()));
                                    ps.executeUpdate();

                                    detailCount.incrementAndGet();
                                }
                            } finally {
                                try (java.sql.Statement stmt = conn.createStatement()) {
                                    stmt.execute("SET IDENTITY_INSERT QMS_MOM_DETAILS OFF");
                                } catch (java.sql.SQLException e) {
                                    System.err.println(
                                            "[MIGRATION] Failed to set IDENTITY_INSERT OFF for QMS_MOM_DETAILS: "
                                                    + e.getMessage());
                                }
                            }
                            return null;
                        });

                        detailMigratedCount += detailCount.get();
                    }
                }

                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .update("meetingMom", migratedCount);

            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("meetingMom");
        return "Successfully migrated " + migratedCount + " MOM master records and " + detailMigratedCount
                + " detail records. Skipped: " + skippedCount + ".";
    }

    // ─── CHECKLIST CLOSED MIGRATION (HRMS_CHECKLIST_PENDING_MASTER →
    // QMS_CHECKLIST_CLOSED) ───

    /**
     * Returns the ID of a StatusMaster whose NAME matches targetName.
     * If none exists it is created, persisted, and cached in the idMap.
     * Uses IDs (not entities) so the map stays valid across entityManager.clear()
     * calls.
     */
    private Long getOrCreateStatusId(String targetName, Map<String, Long> idMap) {
        Long id = idMap.get(targetName.toUpperCase());
        if (id != null)
            return id;
        // Check DB
        Optional<StatusMaster> dbFound = statusRepo.findByName(targetName);
        if (dbFound.isPresent()) {
            idMap.put(targetName.toUpperCase(), dbFound.get().getId());
            return dbFound.get().getId();
        }
        // Create it
        StatusMaster newStatus = new StatusMaster();
        newStatus.setName(targetName);
        newStatus = statusRepo.save(newStatus);
        idMap.put(targetName.toUpperCase(), newStatus.getId());
        System.out.println(
                "[MIGRATION] Created missing StatusMaster: '" + targetName + "' (id=" + newStatus.getId() + ")");
        return newStatus.getId();
    }

    private String normalizeFrequency(String freq) {
        if (freq == null || freq.trim().isEmpty())
            return "DAILY";
        switch (freq.trim().toUpperCase()) {
            case "BI-ANNUAL":
                return "HALF_YEARLY";
            case "ANNUAL":
                return "YEARLY";
            default:
                return freq.trim().toUpperCase();
        }
    }

    private Long resolveClosedStatusId(String legacyStatus, Map<String, Long> idMap) {
        if (legacyStatus == null)
            return getOrCreateStatusId("Open", idMap);
        switch (legacyStatus.trim().toUpperCase()) {
            case "COMPLETED":
            case "VERIFIED":
            case "ACCEPTED":
                return getOrCreateStatusId("Completed", idMap);
            case "UNRESOLVED":
            case "NOT COMPLETED":
            case "MISSED":
                return getOrCreateStatusId("Unresolved", idMap);
            case "PENDING":
            case "STARTED":
            case "25%":
            case "50%":
            case "75%":
                return getOrCreateStatusId("Pending", idMap);
            default:
                return getOrCreateStatusId("Open", idMap);
        }
    }

    public int getChecklistClosedCount() {
        if (jdbcTemplate == null) {
            return 0;
        }
        try {
            return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HRMS_CHECKLIST_PENDING_MASTER", Integer.class);
        } catch (Exception e) {
            return 0;
        }
    }

    @Transactional
    public String migrateChecklistClosed() {
        if (jdbcTemplate == null) {
            return "Migration database not configured.";
        }
        ensureAttachmentPathTableHasIdentity();

        // Store checklist ID mapping (legacy row ID -> new MasterChecklist entity)
        List<MasterChecklist> allChecklists = masterChecklistRepository.findAll();
        Map<Long, MasterChecklist> checklistById = allChecklists.stream()
                .collect(Collectors.toMap(MasterChecklist::getId, c -> c));

        if (checklistById.isEmpty()) {
            return "No migrated checklists found. Please run master checklist migration first.";
        }

        // Status name (uppercase) → status ID
        Map<String, Long> statusIdMap = new java.util.HashMap<>();
        statusRepo.findAll().forEach(s -> statusIdMap.put(s.getName().toUpperCase(), s.getId()));

        Map<String, Long> empCodeToIdMap = new java.util.HashMap<>();
        try {
            primaryJdbcTemplate.query("SELECT EMP_CODE, OLD_EMP_CODE, ID FROM HR_EMPLOYEE", (rsRow) -> {
                long id = rsRow.getLong("ID");
                empCodeToIdMap.put(String.valueOf(id), id);
                String code = rsRow.getString("EMP_CODE");
                if (code != null && !code.trim().isEmpty()) {
                    empCodeToIdMap.put(code.trim().toUpperCase(), id);
                }
                String oldCode = rsRow.getString("OLD_EMP_CODE");
                if (oldCode != null && !oldCode.trim().isEmpty()) {
                    empCodeToIdMap.put(oldCode.trim().toUpperCase(), id);
                }
            });
        } catch (Exception e) {
            System.err.println("[MIGRATION ERROR] Failed to load empCodeToIdMap: " + e.getMessage());
        }

        int totalMigrated = 0;
        int totalSkipped = 0;
        int batchSize = 1000;
        int lastRowId = 0;
        boolean hasMore = true;

        class TempPendingMaster {
            int legacyRowId;
            ChecklistClosed closed;
        }

        while (hasMore) {
            if (stopFlag.get())
                break;
            String sql = "SELECT TOP " + batchSize + " * FROM HRMS_CHECKLIST_PENDING_MASTER WHERE ROW_ID > " + lastRowId
                    + " ORDER BY ROW_ID";

            List<TempPendingMaster> batchTemps = jdbcTemplate.query(sql, (rs, rowNum) -> {
                if (stopFlag.get())
                    return null;

                long legacyCheckId = rs.getLong("CHECK_ROW_ID");
                MasterChecklist parentChecklist = checklistById.get(legacyCheckId);
                if (parentChecklist == null)
                    return null; // no matching master checklist

                ChecklistClosed closed = new ChecklistClosed();
                closed.setChecklist(parentChecklist);

                // ASSIGNED_TO — EMP_CODE as string resolved to Employee ID
                String empCodeVal = getTrimmedString(rs, "EMP_CODE");
                Long resolvedEmpId = null;
                if (empCodeVal != null && !empCodeVal.isEmpty()) {
                    resolvedEmpId = empCodeToIdMap.get(empCodeVal.trim().toUpperCase());
                    if (resolvedEmpId == null) {
                        try {
                            double dVal = Double.parseDouble(empCodeVal);
                            resolvedEmpId = empCodeToIdMap.get(String.valueOf((int) dVal).toUpperCase());
                        } catch (Exception ignore) {
                        }
                    }
                    if (resolvedEmpId == null) {
                        System.err.println("[MIGRATION WARNING] Missing EMP_CODE: " + empCodeVal + " for Row ID: "
                                + rs.getInt("ROW_ID"));
                    }
                }
                closed.setAssignedTo(resolvedEmpId != null ? String.valueOf(resolvedEmpId)
                        : (empCodeVal != null && !empCodeVal.isEmpty() ? empCodeVal : null));

                // ASSIGNED_BY — prefer numeric col, fall back to CREAT_USER_ID_CD, resolved to
                // Employee ID
                String assignedByVal = getTrimmedString(rs, "ASSIGNED_BY");
                Long resolvedAssignedBy = null;
                if (assignedByVal != null && !assignedByVal.isEmpty()) {
                    resolvedAssignedBy = empCodeToIdMap.get(assignedByVal.trim().toUpperCase());
                    if (resolvedAssignedBy == null) {
                        try {
                            double dVal = Double.parseDouble(assignedByVal);
                            resolvedAssignedBy = empCodeToIdMap.get(String.valueOf((int) dVal).toUpperCase());
                        } catch (Exception ignore) {
                        }
                    }
                    if (resolvedAssignedBy == null) {
                        System.err.println("[MIGRATION WARNING] Missing ASSIGNED_BY EMP_CODE: " + assignedByVal
                                + " for Row ID: " + rs.getInt("ROW_ID"));
                    }
                }
                closed.setAssignedBy(resolvedAssignedBy != null ? String.valueOf(resolvedAssignedBy)
                        : (assignedByVal != null && !assignedByVal.isEmpty() ? assignedByVal
                                : getTrimmedString(rs, "CREAT_USER_ID_CD")));

                closed.setAssignedDate(rs.getTimestamp("CREAT_DT"));
                closed.setRemarks(getTrimmedString(rs, "COMMENTS"));
                closed.setChecklistDate(rs.getDate("CHECKLIST_DATE"));

                Object cfObj = rs.getObject("CARRY_FORWARD_COUNT");
                closed.setCarryForwardCount(cfObj != null ? ((Number) cfObj).intValue() : 0);

                // STATUS
                String legacyStatus = getTrimmedString(rs, "STATUS");
                Long statusId = resolveClosedStatusId(legacyStatus, statusIdMap);
                closed.setStatus(entityManager.getReference(StatusMaster.class, statusId));

                // VERIFICATION STATUS / VERIFY_STATUS_ID
                String verificationStatus = getTrimmedString(rs, "VERIFICATION_STATUS");
                Long verifyStatusId = null;
                if (verificationStatus != null && !verificationStatus.trim().isEmpty()) {
                    verifyStatusId = getOrCreateStatusId(verificationStatus.trim(), statusIdMap);
                }
                closed.setVerifyStatus(
                        verifyStatusId != null ? entityManager.getReference(StatusMaster.class, verifyStatusId) : null);

                closed.setAssignType(getTrimmedString(rs, "FROM_WHERE"));

                closed.setVerifiedBy(getTrimmedString(rs, "LST_UPDT_USER_ID_CD"));
                closed.setVerifiedDate(rs.getTimestamp("VERIFICATION_DATE"));
                closed.setComments(getTrimmedString(rs, "REJECTION_COMMENTS"));

                // FREQUENCY — mandatory, default DAILY if null
                closed.setFrequency(normalizeFrequency(getTrimmedString(rs, "FREQUENCY_LEVEL")));

                closed.setIsActive(true);

                TempPendingMaster temp = new TempPendingMaster();
                temp.legacyRowId = rs.getInt("ROW_ID");
                temp.closed = closed;
                return temp;
            });

            List<TempPendingMaster> validTemps = batchTemps.stream()
                    .filter(t -> t != null)
                    .collect(Collectors.toList());

            if (stopFlag.get())
                break;

            if (validTemps.isEmpty()) {
                if (batchTemps.isEmpty()) {
                    hasMore = false;
                } else {
                    totalSkipped += batchTemps.size();
                    lastRowId = batchTemps.get(batchTemps.size() - 1).legacyRowId;
                }
                continue;
            }

            // Map files for this batch in a single query
            List<Integer> legacyRowIds = validTemps.stream()
                    .map(t -> t.legacyRowId)
                    .collect(Collectors.toList());

            String idsString = legacyRowIds.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));

            Map<Integer, List<String>> filesByLegacyRowId = new java.util.HashMap<>();
            if (!idsString.isEmpty()) {
                String fileSql = "SELECT ref_row_id, file_name FROM FILE_UPLOAD_TRANS WHERE from_where = 'CLOSE CHECKLIST' AND ref_row_id IN ("
                        + idsString + ")";
                jdbcTemplate.query(fileSql, (rsFile) -> {
                    int refRowId = rsFile.getInt("ref_row_id");
                    String fileName = rsFile.getString("file_name");
                    if (fileName != null && !fileName.trim().isEmpty()) {
                        filesByLegacyRowId.computeIfAbsent(refRowId, k -> new ArrayList<>()).add(fileName.trim());
                    }
                });
            }

            // Set files and IDs on ChecklistClosed records
            for (TempPendingMaster temp : validTemps) {
                temp.closed.setId((long) temp.legacyRowId);
                List<String> files = filesByLegacyRowId.get(temp.legacyRowId);
                if (files != null) {
                    temp.closed.setActualFiles(files);
                }
            }

            primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
                String insertClosedSql = "INSERT INTO QMS_CHECKLIST_CLOSED (id, checklist_id, assigned_to, assigned_by, assigned_date, status_id, remarks, checklist_date, carry_forward_count, assign_type, verified_by, verified_date, verified_comments, frequency, active, created_by, created_date, updated_by, updated_date, verify_status_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                String checkAttSql = "SELECT 1 FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE='QM1120' AND REF_ID=? AND FILE_NAME=?";
                String insertAttSql = "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES ('QM1120', ?, 'CLOSE CHECKLIST', ?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)";

                try (java.sql.Statement stmt = conn.createStatement()) {
                    stmt.execute("SET IDENTITY_INSERT QMS_CHECKLIST_CLOSED ON");
                } catch (java.sql.SQLException e) {
                    System.err.println("[MIGRATION ERROR] Failed to set IDENTITY_INSERT ON for QMS_CHECKLIST_CLOSED: "
                            + e.getMessage());
                }

                try (java.sql.PreparedStatement psClosed = conn.prepareStatement(insertClosedSql);
                        java.sql.PreparedStatement psCheckAtt = conn.prepareStatement(checkAttSql);
                        java.sql.PreparedStatement psInsertAtt = conn.prepareStatement(insertAttSql)) {

                    for (TempPendingMaster temp : validTemps) {
                        ChecklistClosed closed = temp.closed;
                        long closedId = temp.legacyRowId;

                        psClosed.setLong(1, closedId);
                        psClosed.setObject(2, closed.getChecklist() != null ? closed.getChecklist().getId() : null,
                                java.sql.Types.BIGINT);
                        psClosed.setString(3, closed.getAssignedTo());
                        psClosed.setString(4, closed.getAssignedBy());
                        psClosed.setTimestamp(5,
                                closed.getAssignedDate() != null
                                        ? new java.sql.Timestamp(closed.getAssignedDate().getTime())
                                        : null);
                        psClosed.setObject(6, closed.getStatus() != null ? closed.getStatus().getId() : null,
                                java.sql.Types.BIGINT);
                        psClosed.setString(7, closed.getRemarks());
                        psClosed.setDate(8,
                                closed.getChecklistDate() != null
                                        ? new java.sql.Date(closed.getChecklistDate().getTime())
                                        : null);
                        psClosed.setObject(9, closed.getCarryForwardCount(), java.sql.Types.INTEGER);
                        psClosed.setString(10, closed.getAssignType());
                        psClosed.setString(11, closed.getVerifiedBy());
                        psClosed.setTimestamp(12,
                                closed.getVerifiedDate() != null
                                        ? new java.sql.Timestamp(closed.getVerifiedDate().getTime())
                                        : null);
                        psClosed.setString(13, closed.getComments());
                        psClosed.setString(14, closed.getFrequency());
                        psClosed.setBoolean(15, closed.getIsActive() != null ? closed.getIsActive() : true);

                        String createdBy = closed.getCreatedBy() != null ? closed.getCreatedBy() : "SUPER BOSS";
                        java.sql.Timestamp createdDate = closed.getCreatedDate() != null
                                ? new java.sql.Timestamp(closed.getCreatedDate().getTime())
                                : new java.sql.Timestamp(System.currentTimeMillis());

                        psClosed.setString(16, createdBy);
                        psClosed.setTimestamp(17, createdDate);
                        psClosed.setString(18, closed.getUpdatedBy());
                        psClosed.setTimestamp(19,
                                closed.getUpdatedAt() != null ? new java.sql.Timestamp(closed.getUpdatedAt().getTime())
                                        : null);
                        psClosed.setObject(20,
                                closed.getVerifyStatus() != null ? closed.getVerifyStatus().getId() : null,
                                java.sql.Types.BIGINT);
                        psClosed.executeUpdate();

                        // Migrate physical files and insert into QMS_ATTACHMENT_PATH
                        if (closed.getActualFiles() != null) {
                            for (String fileName : closed.getActualFiles()) {
                                // 1. Physical copy
                                try {
                                    java.io.File sourceFile = new java.io.File(
                                            getSecondaryProcessImgLocation() + "\\HRMS",
                                            fileName);
                                    if (sourceFile.exists()) {
                                        java.nio.file.Path rootPath = fileService.getRootPath();
                                        java.io.File targetDir = rootPath
                                                .resolve(
                                                        AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CLOSE_CHECKLIST_RENEWAL_PATH)
                                                .toFile();
                                        if (!targetDir.exists()) {
                                            targetDir.mkdirs();
                                        }
                                        java.io.File targetFile = new java.io.File(targetDir, fileName);
                                        java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                                                java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                                        System.out.println("[CLOSE CHECKLIST DOC MIGRATION] SUCCESS: Copied "
                                                + sourceFile.getAbsolutePath()
                                                + " to " + targetFile.getAbsolutePath());
                                    } else {
                                        System.err.println(
                                                "[CLOSE CHECKLIST DOC MIGRATION] FAILED: Source file does not exist on disk: "
                                                        + sourceFile.getAbsolutePath());
                                    }
                                } catch (Exception e) {
                                    System.err.println("[CLOSE CHECKLIST DOC MIGRATION] File copy exception for "
                                            + fileName + ": " + e.getMessage());
                                }

                                // 2. DB insertion into QMS_ATTACHMENT_PATH
                                try {
                                    psCheckAtt.setLong(1, closedId);
                                    psCheckAtt.setString(2, fileName);
                                    boolean exists = false;
                                    try (java.sql.ResultSet rs = psCheckAtt.executeQuery()) {
                                        if (rs.next()) {
                                            exists = true;
                                        }
                                    }
                                    if (!exists) {
                                        String logicalPath = AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CLOSE_CHECKLIST_RENEWAL_PATH
                                                + "/"
                                                + fileName;
                                        psInsertAtt.setLong(1, closedId);
                                        psInsertAtt.setString(2, logicalPath);
                                        psInsertAtt.setString(3, fileName);
                                        psInsertAtt.executeUpdate();
                                    }
                                } catch (Exception e) {
                                    System.err.println("[CLOSE CHECKLIST DOC MIGRATION] DB insert failed for "
                                            + fileName + ": " + e.getMessage());
                                }
                            }
                        }
                    }
                } finally {
                    try (java.sql.Statement stmt = conn.createStatement()) {
                        stmt.execute("SET IDENTITY_INSERT QMS_CHECKLIST_CLOSED OFF");
                    } catch (java.sql.SQLException e) {
                        System.err.println(
                                "[MIGRATION ERROR] Failed to set IDENTITY_INSERT OFF for QMS_CHECKLIST_CLOSED: "
                                        + e.getMessage());
                    }
                }
                return null;
            });

            totalMigrated += validTemps.size();
            totalSkipped += (batchTemps.size() - validTemps.size());
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                    .update("checklistClosed", totalMigrated);

            if (batchTemps.size() < batchSize) {
                hasMore = false;
            } else {
                lastRowId = batchTemps.get(batchTemps.size() - 1).legacyRowId;
            }
        }

        if (stopFlag.get()) {
            return "Migration stopped. Migrated " + totalMigrated + " checklist closed records so far.";
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("checklistClosed");

        return "Successfully migrated " + totalMigrated
                + " checklist closed records from HRMS_CHECKLIST_PENDING_MASTER to QMS_CHECKLIST_CLOSED."
                + (totalSkipped > 0 ? " (Skipped " + totalSkipped + " with no matching master checklist.)" : "");
    }

    @Transactional
    public String clearChecklistClosed() {
        try {
            entityManager.createNativeQuery("DELETE FROM QMS_CHECKLIST_CLOSED").executeUpdate();
            try {
                entityManager.createNativeQuery("DBCC CHECKIDENT ('QMS_CHECKLIST_CLOSED', RESEED, 0)").executeUpdate();
            } catch (Exception ignore) {
            }
            return "Cleared all records from QMS_CHECKLIST_CLOSED.";
        } catch (Exception e) {
            return "Error clearing QMS_CHECKLIST_CLOSED: " + e.getMessage();
        }
    }

    @Transactional
    public String migrateChecklistMasterDocuments() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        // Build a lookup: legacy row_id -> new MasterChecklist id using
        // TEMP_MIGRATION_CHECKLIST_MAP
        Map<String, Long> checklistIdByLegacyId = new java.util.HashMap<>();
        try {
            primaryJdbcTemplate.query("SELECT legacy_row_id, new_id FROM TEMP_MIGRATION_CHECKLIST_MAP", (rs) -> {
                long legacyId = rs.getLong("legacy_row_id");
                long newId = rs.getLong("new_id");
                checklistIdByLegacyId.put(String.valueOf(legacyId), newId);
            });
        } catch (Exception e) {
            System.err.println("[MIGRATION ERROR] Failed to query TEMP_MIGRATION_CHECKLIST_MAP: " + e.getMessage());
        }

        if (checklistIdByLegacyId.isEmpty()) {
            return "No migrated checklists found. Please run checklists migration first.";
        }

        String sql = "SELECT ref_row_id, file_name FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE = 'MASTER CHECKLIST'";
        List<Map<String, Object>> records = jdbcTemplate.queryForList(sql);

        int totalMigrated = 0;
        int totalSkipped = 0;

        try {
            String debugContent = "checklistIdByLegacyId size: " + checklistIdByLegacyId.size() + "\n"
                    + "records size: " + records.size() + "\n"
                    + "Sample mapping keys: " + checklistIdByLegacyId.keySet().stream().limit(10)
                            .collect(java.util.stream.Collectors.joining(", "))
                    + "\n";
            if (!records.isEmpty()) {
                debugContent += "Sample record: " + records.get(0).toString() + "\n";
                Object sampleRef = records.get(0).get("ref_row_id");
                debugContent += "Sample ref_row_id value: " + sampleRef + ", mapped ID: "
                        + (sampleRef != null ? checklistIdByLegacyId.get(String.valueOf(sampleRef).trim()) : "null")
                        + "\n";
            }
            java.nio.file.Files.writeString(java.nio.file.Paths.get("migration_debug.txt"), debugContent);
        } catch (Exception ignore) {
        }

        for (Map<String, Object> record : records) {
            if (stopFlag.get()) {
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .fail("checklistMasterDocuments");
                return "Migration stopped. Migrated " + totalMigrated + " documents.";
            }

            Object refRowIdObj = record.get("ref_row_id");
            String fileName = (String) record.get("file_name");

            if (refRowIdObj == null || fileName == null || fileName.trim().isEmpty()) {
                totalSkipped++;
                continue;
            }

            String legacyCheckId = String.valueOf(refRowIdObj).trim();
            fileName = fileName.trim();

            Long parentChecklistId = checklistIdByLegacyId.get(legacyCheckId);
            if (parentChecklistId == null) {
                totalSkipped++;
                continue;
            }

            // Physical File Copy
            try {
                java.io.File sourceFile = new java.io.File(getSecondaryProcessImgLocation() + "\\HRMS", fileName);
                if (sourceFile.exists()) {
                    java.nio.file.Path rootPath = fileService.getRootPath();
                    java.io.File targetDir = rootPath
                            .resolve(AppUtil.BosDocConstants.MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER_PATH).toFile();
                    if (!targetDir.exists()) {
                        targetDir.mkdirs();
                    }
                    java.io.File targetFile = new java.io.File(targetDir, fileName);
                    java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                            java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                    System.out.println("[CHECKLIST DOC MIGRATION] SUCCESS: Copied " + sourceFile.getAbsolutePath()
                            + " to " + targetFile.getAbsolutePath());
                } else {
                    System.err.println("[CHECKLIST DOC MIGRATION] FAILED: Source file does not exist on disk: "
                            + sourceFile.getAbsolutePath());
                }
            } catch (Exception e) {
                System.err.println(
                        "[CHECKLIST DOC MIGRATION] File copy exception for " + fileName + ": " + e.getMessage());
            }

            // DB Record Insertion
            try {
                String checkSql = "SELECT COUNT(*) FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE='M1210' AND REF_ID=? AND FILE_NAME=?";
                Integer count = primaryJdbcTemplate.queryForObject(checkSql, Integer.class, parentChecklistId,
                        fileName);

                if (count == null || count == 0) {
                    String logicalPath = AppUtil.BosDocConstants.MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER_PATH + "/"
                            + fileName;
                    String insertSql = "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) VALUES (?, ?, 'MASTER CHECKLIST', ?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)";
                    primaryJdbcTemplate.update(insertSql, "M1210", parentChecklistId, logicalPath, fileName);
                    totalMigrated++;
                    com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                            .update("checklistMasterDocuments", totalMigrated);
                } else {
                    totalSkipped++;
                }
            } catch (Exception e) {
                System.err
                        .println("[CHECKLIST DOC MIGRATION] DB insert failed for " + fileName + ": " + e.getMessage());
                totalSkipped++;
            }
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                .complete("checklistMasterDocuments");
        return "Successfully migrated " + totalMigrated + " checklist master document records."
                + (totalSkipped > 0
                        ? " (Skipped " + totalSkipped
                                + " records either already existing, invalid, or missing checklist master.)"
                        : "");
    }

    @Transactional
    public String clearChecklistMasterDocuments() {
        try {
            // Fetch paths of attachments mapped to Checklist Master (PAGE_CODE = 'M1210')
            String selectSql = "SELECT PATH FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'M1210'";
            List<String> paths = primaryJdbcTemplate.query(selectSql, (rs, rowNum) -> rs.getString("PATH"));

            // Delete physical files
            for (String p : paths) {
                if (p != null && !p.trim().isEmpty()) {
                    String physicalPath = p.trim();
                    fileService.deleteFile(physicalPath);
                }
            }

            // Delete DB records
            String deleteSql = "DELETE FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'M1210'";
            int deletedRecords = primaryJdbcTemplate.update(deleteSql);

            return "Cleared all " + deletedRecords + " checklist master document records and physical files.";
        } catch (Exception e) {
            return "Error clearing Checklist Master documents: " + e.getMessage();
        }
    }

    @Transactional
    public void repairExistingChecklistAssignmentsAndClosed() {
        System.out.println("[REPAIR] Starting employee code to ID repair for checklists...");

        Map<String, Long> empCodeToIdMap = new java.util.HashMap<>();
        try {
            primaryJdbcTemplate.query("SELECT ID, EMP_CODE FROM HR_EMPLOYEE WHERE EMP_CODE IS NOT NULL", rs -> {
                String empCode = rs.getString("EMP_CODE");
                if (empCode != null && !empCode.trim().isEmpty()) {
                    empCodeToIdMap.put(empCode.trim(), rs.getLong("ID"));
                }
            });
        } catch (Exception e) {
            System.err.println("[REPAIR] Failed to fetch employees via JDBC: " + e.getMessage());
            return;
        }

        // 1. Repair QMS_CHECKLIST_ASSIGNMENT
        try {
            List<ChecklistAssignment> assignments = checklistAssignmentRepository.findAll();
            int repairedAssignmentsCount = 0;
            for (ChecklistAssignment assignment : assignments) {
                String assignedTo = assignment.getAssignedTo();
                if (assignedTo != null && !assignedTo.trim().isEmpty()) {
                    Long resolvedId = empCodeToIdMap.get(assignedTo.trim());
                    if (resolvedId != null) {
                        assignment.setAssignedTo(String.valueOf(resolvedId));
                        checklistAssignmentRepository.save(assignment);
                        repairedAssignmentsCount++;
                    }
                }
            }
            System.out
                    .println("[REPAIR] Repaired " + repairedAssignmentsCount + " records in QMS_CHECKLIST_ASSIGNMENT.");
        } catch (Exception e) {
            System.err.println("[REPAIR] Failed to repair QMS_CHECKLIST_ASSIGNMENT: " + e.getMessage());
        }

        // 2. Repair QMS_CHECKLIST_CLOSED
        try {
            List<ChecklistClosed> closedRecords = checklistClosedRepository.findAll();
            int repairedClosedCount = 0;
            for (ChecklistClosed closed : closedRecords) {
                boolean changed = false;
                String assignedTo = closed.getAssignedTo();
                if (assignedTo != null && !assignedTo.trim().isEmpty()) {
                    Long resolvedId = empCodeToIdMap.get(assignedTo.trim());
                    if (resolvedId != null) {
                        closed.setAssignedTo(String.valueOf(resolvedId));
                        changed = true;
                    }
                }
                if (closed.getVerifyStatus() != null && "Open".equalsIgnoreCase(closed.getVerifyStatus().getName())) {
                    statusRepo.findByName("N/A").ifPresent(closed::setVerifyStatus);
                    changed = true;
                }
                if (changed) {
                    checklistClosedRepository.save(closed);
                    repairedClosedCount++;
                }
            }
            System.out.println("[REPAIR] Repaired " + repairedClosedCount + " records in QMS_CHECKLIST_CLOSED.");
        } catch (Exception e) {
            System.err.println("[REPAIR] Failed to repair QMS_CHECKLIST_CLOSED: " + e.getMessage());
        }

        // 3. Repair QMS_CHECKLIST_MASTER
        try {
            List<MasterChecklist> checklists = masterChecklistRepository.findAll();
            int repairedMasterCount = 0;
            for (MasterChecklist checklist : checklists) {
                String assignTo = checklist.getAssignTo();
                if (assignTo != null && !assignTo.trim().isEmpty()) {
                    String[] parts = assignTo.split(",");
                    List<String> resolvedParts = new ArrayList<>();
                    boolean changed = false;
                    for (String part : parts) {
                        String trimmed = part.trim();
                        Long resolvedId = empCodeToIdMap.get(trimmed);
                        if (resolvedId != null) {
                            resolvedParts.add(String.valueOf(resolvedId));
                            changed = true;
                        } else {
                            resolvedParts.add(trimmed);
                        }
                    }
                    if (changed) {
                        checklist.setAssignTo(String.join(", ", resolvedParts));
                        masterChecklistRepository.save(checklist);
                        repairedMasterCount++;
                    }
                }
            }
            System.out.println("[REPAIR] Repaired " + repairedMasterCount + " records in QMS_CHECKLIST_MASTER.");
        } catch (Exception e) {
            System.err.println("[REPAIR] Failed to repair QMS_CHECKLIST_MASTER: " + e.getMessage());
        }
    }

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void onApplicationReady() {
        // System.out.println("[REPAIR] Auto-repair skipped.");
        /*
        try {
            repairExistingChecklistAssignmentsAndClosed();
        } catch (Throwable t) {
            System.err.println("[REPAIR ERROR] Failed to run checklist data repair: " + t.getMessage());
        }
        */
    }

    @Transactional
    public String clearCloseMom() {
        entityManager.createNativeQuery("DELETE FROM QMS_CLOSE_MOM_AND_VERIFY").executeUpdate();
        try {
            entityManager.createNativeQuery("DBCC CHECKIDENT ('QMS_CLOSE_MOM_AND_VERIFY', RESEED, 0)").executeUpdate();
        } catch (Exception ignore) {
        }
        entityManager.createNativeQuery("DELETE FROM QMS_ATTACHMENT_PATH WHERE PAGE_CODE = 'QM1340'").executeUpdate();
        return "Cleared all Close MOM migration records.";
    }

    @Transactional
    public String migrateCloseMom() {
        if (jdbcTemplate == null) {
            return "Migration database not configured in application.properties.";
        }

        List<Map<String, Object>> audits;
        try {
            audits = jdbcTemplate.queryForList("SELECT * FROM CLOSE_MOM_ACTION");
        } catch (Exception e) {
            return "Failed to fetch from legacy CLOSE_MOM_ACTION: " + e.getMessage();
        }

        int migratedCount = 0;
        int skippedCount = 0;

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.start("closeMom",
                audits.size());

        for (Map<String, Object> audit : audits) {
            if (stopFlag.get()) {
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("closeMom");
                return "Migration stopped manually.";
            }

            try {
                Object idObj = audit.get("ROW_ID");
                if (idObj == null) {
                    skippedCount++;
                    continue;
                }
                long legacyId = ((Number) idObj).longValue();

                Object actionItemIdObj = audit.get("MEETING_TRANS_ID");
                if (actionItemIdObj == null) {
                    skippedCount++;
                    continue;
                }
                long actionItemId = ((Number) actionItemIdObj).longValue();

                List<?> detailsCheck = entityManager.createNativeQuery("SELECT ID FROM QMS_MOM_DETAILS WHERE ID = ?")
                        .setParameter(1, actionItemId)
                        .getResultList();
                if (detailsCheck.isEmpty()) {
                    skippedCount++;
                    continue;
                }

                String detailsQuery = "SELECT d.DISCUSSED_POINT, d.TARGET_DATE, m.MOM_NO, m.MOM_DATE, " +
                        "       (SELECT TOP 1 EMPLOYEE_NAME FROM HR_EMPLOYEE WHERE id = d.ASSIGNED_TO_ID) as EMP_NAME "
                        +
                        "FROM QMS_MOM_DETAILS d " +
                        "LEFT JOIN QMS_MOM_MASTER m ON d.MOM_ID = m.ID " +
                        "WHERE d.ID = ?";
                List<Map<String, Object>> detailRows = primaryJdbcTemplate.queryForList(detailsQuery, actionItemId);

                String discussedPoint = null;
                java.sql.Date targetDate = null;
                String momNo = null;
                java.sql.Date meetingDate = null;
                String responsibility = null;

                if (!detailRows.isEmpty()) {
                    Map<String, Object> row = detailRows.get(0);
                    discussedPoint = (String) row.get("DISCUSSED_POINT");
                    if (row.get("TARGET_DATE") != null) {
                        targetDate = new java.sql.Date(((java.util.Date) row.get("TARGET_DATE")).getTime());
                    }
                    momNo = (String) row.get("MOM_NO");
                    if (row.get("MOM_DATE") != null) {
                        meetingDate = new java.sql.Date(((java.util.Date) row.get("MOM_DATE")).getTime());
                    }
                    responsibility = (String) row.get("EMP_NAME");
                }

                List<?> existing = entityManager
                        .createNativeQuery("SELECT ID FROM QMS_CLOSE_MOM_AND_VERIFY WHERE ID = ?")
                        .setParameter(1, legacyId)
                        .getResultList();
                if (!existing.isEmpty()) {
                    skippedCount++;
                    continue;
                }

                String fileSql = "SELECT FILE_NAME FROM FILE_UPLOAD_TRANS WHERE FROM_WHERE = 'CORRECTIVE_ACTION' AND REF_ROW_ID = "
                        + legacyId;
                List<String> files = jdbcTemplate.queryForList(fileSql, String.class);
                List<String> validFiles = new java.util.ArrayList<>();
                for (String fName : files) {
                    if (fName == null || fName.trim().isEmpty())
                        continue;
                    fName = fName.trim();
                    validFiles.add(fName);

                    java.io.File sourceFile = new java.io.File(getSecondaryProcessImgLocation() + "\\HRMS", fName);
                    if (sourceFile.exists()) {
                        try {
                            java.nio.file.Path rootPath = fileService.getRootPath();
                            java.io.File targetDir = rootPath
                                    .resolve(AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_CLOSE_MOM_PATH)
                                    .toFile();
                            if (!targetDir.exists())
                                targetDir.mkdirs();
                            java.io.File targetFile = new java.io.File(targetDir, fName);
                            java.nio.file.Files.copy(sourceFile.toPath(), targetFile.toPath(),
                                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                        } catch (Exception ex) {
                            System.err.println(
                                    "[MIGRATION] Close MOM File copy exception for " + fName + ": " + ex.getMessage());
                        }
                    }

                    try {
                        String logicalPath = AppUtil.BosDocConstants.QUALITY_MANAGEMENT_SYSTEMS_MEETING_CLOSE_MOM_PATH
                                + "/" + fName;
                        primaryJdbcTemplate.update(
                                "INSERT INTO QMS_ATTACHMENT_PATH (PAGE_CODE, REF_ID, DOC_TYPE, PATH, FILE_NAME, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) "
                                        +
                                        "VALUES ('QM1340', ?, 'CORRECTIVE_ACTION', ?, ?, 'SUPER BOSS', CURRENT_TIMESTAMP, 'SUPER BOSS', CURRENT_TIMESTAMP)",
                                legacyId, logicalPath, fName);
                    } catch (Exception ex) {
                        System.err.println("[MIGRATION] Close MOM DB insert failed for attachment " + fName + ": "
                                + ex.getMessage());
                    }
                }

                String attachmentInfo = null;
                if (!validFiles.isEmpty()) {
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < validFiles.size(); i++) {
                        sb.append("{\"fileName\":\"").append(validFiles.get(i)).append("\"}");
                        if (i < validFiles.size() - 1) {
                            sb.append(",");
                        }
                    }
                    sb.append("]");
                    attachmentInfo = sb.toString();
                }

                String statusVal = audit.get("STATUS") != null ? String.valueOf(audit.get("STATUS")).trim() : "";

                String action = "Submit";
                if ("APPROVED".equalsIgnoreCase(statusVal) || "VERIFIED".equalsIgnoreCase(statusVal)) {
                    action = "Verify";
                } else if ("REJECTED".equalsIgnoreCase(statusVal)) {
                    action = "Reject";
                } else if ("PENDING FOR APPROVAL".equalsIgnoreCase(statusVal)
                        || "PENDING FOR VERIFY".equalsIgnoreCase(statusVal)) {
                    action = "Submit";
                }

                String prevStatus = "OPEN";
                if ("APPROVED".equalsIgnoreCase(statusVal) || "VERIFIED".equalsIgnoreCase(statusVal)
                        || "REJECTED".equalsIgnoreCase(statusVal)) {
                    prevStatus = "PENDING FOR VERIFY";
                }

                String newStatus = statusVal;
                if ("APPROVED".equalsIgnoreCase(statusVal)) {
                    newStatus = "VERIFIED";
                } else if ("PENDING FOR APPROVAL".equalsIgnoreCase(statusVal)) {
                    newStatus = "PENDING FOR VERIFY";
                } else if ("CREATED".equalsIgnoreCase(statusVal) || statusVal.isEmpty()) {
                    newStatus = "OPEN";
                }

                String rawPerformedBy = null;
                if ("APPROVED".equalsIgnoreCase(statusVal) || "REJECTED".equalsIgnoreCase(statusVal)) {
                    rawPerformedBy = audit.get("LST_UPDT_USER_ID_CD") != null
                            ? String.valueOf(audit.get("LST_UPDT_USER_ID_CD"))
                            : null;
                }
                if (rawPerformedBy == null || rawPerformedBy.trim().isEmpty()) {
                    rawPerformedBy = audit.get("CREAT_USER_ID_CD") != null
                            ? String.valueOf(audit.get("CREAT_USER_ID_CD"))
                            : null;
                }
                String performedBy = resolveUserId(rawPerformedBy);

                java.util.Date rawPerformedDate = null;
                if ("APPROVED".equalsIgnoreCase(statusVal)) {
                    rawPerformedDate = (java.util.Date) audit.get("APPROVED_DATE");
                } else if ("PENDING FOR APPROVAL".equalsIgnoreCase(statusVal)) {
                    rawPerformedDate = (java.util.Date) audit.get("SEND_FOR_APPROVAL_DATE");
                }
                if (rawPerformedDate == null) {
                    rawPerformedDate = (java.util.Date) audit.get("LST_UPDT_TS");
                }
                if (rawPerformedDate == null) {
                    rawPerformedDate = (java.util.Date) audit.get("CREAT_DT");
                }

                java.sql.Timestamp performedDate = rawPerformedDate != null
                        ? new java.sql.Timestamp(rawPerformedDate.getTime())
                        : new java.sql.Timestamp(System.currentTimeMillis());

                String correctiveAction = audit.get("CORRECTIVE_ACTION") != null
                        ? String.valueOf(audit.get("CORRECTIVE_ACTION"))
                        : null;
                String comments = correctiveAction;

                String actionTaken = correctiveAction;
                String actionObservation = audit.get("ACTION_OBSERVATION") != null
                        ? String.valueOf(audit.get("ACTION_OBSERVATION"))
                        : null;

                String verifiedBy = "Verify".equalsIgnoreCase(action) ? performedBy : null;
                java.sql.Timestamp verifiedDate = "Verify".equalsIgnoreCase(action) ? performedDate : null;
                String rejectedBy = "Reject".equalsIgnoreCase(action) ? performedBy : null;
                java.sql.Timestamp rejectedDate = "Reject".equalsIgnoreCase(action) ? performedDate : null;
                String rejectionRemarks = audit.get("REJECTION_REASON") != null
                        ? String.valueOf(audit.get("REJECTION_REASON"))
                        : null;

                final long finalLegacyId = legacyId;
                final long finalActionItemId = actionItemId;
                final String finalAction = action;
                final String finalPrevStatus = prevStatus;
                final String finalNewStatus = newStatus;
                final String finalPerformedBy = performedBy;
                final java.sql.Timestamp finalPerformedDate = performedDate;
                final String finalActionTaken = actionTaken;
                final String finalActionObservation = actionObservation;
                final String finalAttachmentInfo = attachmentInfo;
                final String finalVerifiedBy = verifiedBy;
                final java.sql.Timestamp finalVerifiedDate = verifiedDate;
                final String finalRejectedBy = rejectedBy;
                final java.sql.Timestamp finalRejectedDate = rejectedDate;
                final String finalRejectionRemarks = rejectionRemarks;
                final String finalComments = comments;
                final String finalMomNo = momNo;
                final java.sql.Date finalMeetingDate = meetingDate;
                final String finalDiscussedPoint = discussedPoint;
                final String finalResponsibility = responsibility;
                final java.sql.Date finalTargetDate = targetDate;

                primaryJdbcTemplate.execute((java.sql.Connection conn) -> {
                    turnOffAllIdentityInserts(conn);
                    try (java.sql.Statement stmt = conn.createStatement()) {
                        stmt.execute("SET IDENTITY_INSERT QMS_CLOSE_MOM_AND_VERIFY ON");
                    } catch (java.sql.SQLException e) {
                        System.err.println("[MIGRATION] Failed to set IDENTITY_INSERT ON for QMS_CLOSE_MOM_AND_VERIFY: "
                                + e.getMessage());
                    }

                    String insertSql = "INSERT INTO QMS_CLOSE_MOM_AND_VERIFY (id, ACTION_ITEM_ID, ACTION, PREVIOUS_STATUS, NEW_STATUS, "
                            +
                            "PERFORMED_BY, PERFORMED_DATE, ACTION_TAKEN, ACTION_OBSERVATION, ATTACHMENT_INFO, " +
                            "VERIFIED_BY, VERIFIED_DATE, REJECTED_BY, REJECTED_DATE, REJECTION_REMARKS, COMMENTS, " +
                            "MOM_NO, MEETING_DATE, DISCUSSED_POINT, RESPONSIBILITY, TARGET_DATE) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                    try (java.sql.PreparedStatement ps = conn.prepareStatement(insertSql)) {
                        ps.setLong(1, finalLegacyId);
                        ps.setLong(2, finalActionItemId);
                        ps.setString(3, finalAction);
                        ps.setString(4, finalPrevStatus);
                        ps.setString(5, finalNewStatus);
                        ps.setString(6, finalPerformedBy);
                        ps.setTimestamp(7, finalPerformedDate);
                        ps.setString(8, finalActionTaken);
                        ps.setString(9, finalActionObservation);
                        ps.setString(10, finalAttachmentInfo);
                        ps.setString(11, finalVerifiedBy);
                        ps.setTimestamp(12, finalVerifiedDate);
                        ps.setString(13, finalRejectedBy);
                        ps.setTimestamp(14, finalRejectedDate);
                        ps.setString(15, finalRejectionRemarks);
                        ps.setString(16, finalComments);
                        ps.setString(17, finalMomNo);
                        ps.setDate(18, finalMeetingDate);
                        ps.setString(19, finalDiscussedPoint);
                        ps.setString(20, finalResponsibility);
                        ps.setDate(21, finalTargetDate);
                        ps.executeUpdate();
                    } finally {
                        try (java.sql.Statement stmt = conn.createStatement()) {
                            stmt.execute("SET IDENTITY_INSERT QMS_CLOSE_MOM_AND_VERIFY OFF");
                        } catch (java.sql.SQLException e) {
                            System.err.println(
                                    "[MIGRATION] Failed to set IDENTITY_INSERT OFF for QMS_CLOSE_MOM_AND_VERIFY: "
                                            + e.getMessage());
                        }
                    }
                    return null;
                });

                migratedCount++;
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.update("closeMom",
                        migratedCount);

            } catch (Exception ex) {
                ex.printStackTrace();
                skippedCount++;
            }
        }

        com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.complete("closeMom");
        return "Successfully migrated " + migratedCount
                + " Close MOM audit records from CLOSE_MOM_ACTION to QMS_CLOSE_MOM_AND_VERIFY. Skipped: " + skippedCount
                + ".";
    }

    private Long getStatusIdByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        String normName = name.trim().toUpperCase();
        if ("ACTIVE".equals(normName)) {
            normName = "ACTIVE";
        } else if ("INACTIVE".equals(normName) || "IN ACTIVE".equals(normName) || "EXPIRED".equals(normName)
                || "CANCELLED".equals(normName) || "CLOSED".equals(normName) || "CANCELED".equals(normName)) {
            normName = "INACTIVE";
        } else if ("VERIFIED".equals(normName) || "APPROVED".equals(normName) || "ACCEPT".equals(normName)
                || "ACCEPTED".equals(normName) || "COMPLETED".equals(normName) || "DONE".equals(normName)) {
            normName = "VERIFIED";
        } else if ("REJECTED".equals(normName) || "REJECT".equals(normName) || "UNRESOLVED".equals(normName)) {
            normName = "REJECTED";
        } else if ("UN ASSIGNED".equals(normName) || "UNASSIGNED".equals(normName)) {
            normName = "UN ASSIGNED";
        } else if ("ASSIGNED".equals(normName) || "IN PROGRESS".equals(normName) || "INPROGRESS".equals(normName)
                || "OVERDUE".equals(normName) || "STARTED".equals(normName)) {
            normName = "ASSIGNED";
        } else {
            normName = "TO BE VERIFIED";
        }
        final String finalName = normName;
        return statusRepo.findByNameIgnoreCase(finalName)
                .map(StatusMaster::getId)
                .orElseGet(() -> {
                    StatusMaster sm = new StatusMaster();
                    sm.setName(finalName);
                    return statusRepo.save(sm).getId();
                });
    }
}

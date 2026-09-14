package com.autonoma.erp.modules.platform.datamigration.controller;

import com.autonoma.erp.modules.npd.product.service.NpdMigrationService;
import com.autonoma.erp.model.admin.MigrationAuditLog;
import com.autonoma.erp.repository.admin.MigrationAuditLogRepository;
import com.autonoma.erp.modules.qms.checklist.service.MasterChecklistMigrationService;
import com.autonoma.erp.modules.platform.datamigration.service.HrmsMigrationService;
import com.autonoma.erp.modules.platform.datamigration.service.DatabaseCleanupService;
import com.autonoma.erp.modules.platform.datamigration.dto.MigrationRequest;
import com.autonoma.erp.service.OrderMigrationService;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.repository.admin.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/admin/migration")
@RequirePagePermission(pageCode = "AD1210", action = "write")
public class DataMigrationController {

    // Concurrency lock per migration type to prevent simultaneous duplicate runs
    private final ConcurrentHashMap<String, AtomicBoolean> runningMigrations = new ConcurrentHashMap<>();

    @Autowired
    private MasterChecklistMigrationService migrationService;

    @Autowired
    private HrmsMigrationService hrmsMigrationService;

    @Autowired
    private com.autonoma.erp.modules.npd.product.service.NpdMigrationService npdMigrationService;

    @Autowired
    private OrderMigrationService orderMigrationService;

    @Autowired
    private MigrationAuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DatabaseCleanupService databaseCleanupService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.autonoma.erp.modules.platform.datamigration.service.AccountsMigrationService accountsMigrationService;

    @Autowired
    private com.autonoma.erp.modules.platform.datamigration.service.DynamicMigrationDbService dynamicMigrationDbService;

    @Autowired
    private com.autonoma.erp.modules.platform.datamigration.service.SmbFileBrowserService smbFileBrowserService;

    @Autowired
    private com.autonoma.erp.modules.qmc.inspectionspecification.service.InspectionSpecificationMigrationService inspectionSpecificationMigrationService;

    @GetMapping("/databases")
    @RequirePagePermission(pageCode = "AD1210", action = "read")
    public ResponseEntity<List<String>> getDatabases(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword) {
        try {
            List<String> databases;
            if (sqlIp != null && !sqlIp.trim().isEmpty()) {
                databases = dynamicMigrationDbService.getDatabases(sqlIp, sqlUsername, sqlPassword);
            } else {
                databases = jdbcTemplate.queryForList(
                        "SELECT name FROM sys.databases WHERE state_desc = 'ONLINE' AND database_id > 4", String.class);
            }
            return ResponseEntity.ok(databases);
        } catch (Exception e) {
            if (sqlIp != null && !sqlIp.trim().isEmpty()) {
                throw new RuntimeException("Database connection failed: " + e.getMessage(), e);
            }
            // Fallback if not using SQL Server or sys.databases is unavailable
            return ResponseEntity.ok(java.util.Arrays.asList("AUTONOMA", "ERPDb_NUTECH", "essl"));
        }
    }

    @PostMapping("/browse-path")
    @RequirePagePermission(pageCode = "AD1210", action = "read")
    public ResponseEntity<List<String>> browsePathPost(@RequestBody MigrationRequest body) {
        String ip = body != null ? body.getFileIp() : null;
        String user = body != null ? body.getFileUsername() : null;
        String pass = body != null ? body.getFilePassword() : null;
        String p = body != null ? body.getPath() : null;
        return doBrowsePath(ip, user, pass, p);
    }

    @GetMapping("/browse-path")
    @RequirePagePermission(pageCode = "AD1210", action = "read")
    public ResponseEntity<List<String>> browsePathGet(
            @RequestParam(required = false) String fileIp,
            @RequestParam(required = false) String fileUsername,
            @RequestParam(required = false) String filePassword,
            @RequestParam(required = false) String path) {
        return doBrowsePath(fileIp, fileUsername, filePassword, path);
    }

    private ResponseEntity<List<String>> doBrowsePath(String ip, String user, String pass, String path) {
        try {
            List<String> directories = smbFileBrowserService.browseDirectories(ip, user, pass, path);
            return ResponseEntity.ok(directories);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Collections.singletonList("Error: " + e.getMessage()));
        }
    }

    // ─── Resolve current user safely ────────────────────────────────────────────
    private String resolveCurrentUser() {
        String currentUser = SecurityUtils.getCurrentUserId();
        if (currentUser != null && !userRepository.existsById(currentUser)) {
            return "SUPER BOSS";
        }
        if (currentUser == null || currentUser.trim().isEmpty()) {
            return "SUPER BOSS";
        }
        return currentUser;
    }

    // ─── Extract record count from result message ────────────────────────────────

    private void logMigration(String tableName, int count, long durationMs, String status, String message) {
        try {
            String currentUser = resolveCurrentUser();
            com.autonoma.erp.model.admin.MigrationAuditLog auditLog = com.autonoma.erp.model.admin.MigrationAuditLog
                    .builder()
                    .tableName(tableName)
                    .migratedBy(currentUser)
                    .migratedAt(new java.util.Date())
                    .build();
            auditLog.setStatus(status);
            auditLog.setRecordsCount(count);
            auditLog.setMessage(message);
            auditLog.setExecutionTimeMs(durationMs);
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private int extractCount(String result) {
        if (result == null || result.trim().isEmpty()) {
            return 0;
        }
        Pattern[] patterns = new Pattern[] {
            Pattern.compile("(?i)(?:successfully\\s+migrated|migrated|imported|processed|inserted|cleared|created)\\s+(\\d+)"),
            Pattern.compile("(?i)total(?:\\s+records)?\\s+migrated[:\\s]+(\\d+)"),
            Pattern.compile("(?i)(\\d+)\\s+(?:records?|items?|rows?|departments?|designations?|grades?|employees?|products?|materials?|checklists?)"),
            Pattern.compile("(\\d+)")
        };
        for (Pattern p : patterns) {
            Matcher matcher = p.matcher(result);
            if (matcher.find()) {
                try {
                    return Integer.parseInt(matcher.group(1));
                } catch (Exception ignored) {
                }
            }
        }
        return 0;
    }

    // ─── POST /api/admin/migration/checklists ────────────────────────────────────
    @PostMapping("/checklists")
    public ResponseEntity<Map<String, String>> migrateChecklists() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("HRMS_MASTER_CHECKLIST -> qms_checklist_master")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateOldChecklists();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/checklist-master-documents ────────────────────
    @PostMapping("/checklist-master-documents")
    public ResponseEntity<Map<String, String>> migrateChecklistMasterDocuments() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("FILE_UPLOAD_TRANS -> QMS_ATTACHMENT_PATH")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateChecklistMasterDocuments();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Checklist Master documents migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/meeting-master ────────────────────────────────
    @PostMapping("/meeting-master")
    public ResponseEntity<Map<String, String>> migrateMeetingMaster() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("MINUTES_MEETING_MASTER -> QMS_MEETING_MASTER")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateMeetingMaster();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Meeting Master migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/meeting-schedule
    // ────────────────────────────────
    @PostMapping("/meeting-schedule")
    public ResponseEntity<Map<String, String>> migrateMeetingSchedule() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("MEETING_SCHEDULE_MASTER -> QMS_MEETING_SCHEDULE")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateMeetingSchedule();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Meeting Schedule migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/meeting-user-attendance
    // ────────────────────────
    @PostMapping("/meeting-user-attendance")
    public ResponseEntity<Map<String, String>> migrateMeetingUserAttendance() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("MEETING_USER_ATTENDANCE -> QMS_MEETING_USER_ATTENDANCE")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateMeetingUserAttendance();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Meeting User Attendance migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/npd/products ─────────────────────────────────
    @PostMapping("/npd/products")
    public ResponseEntity<Map<String, String>> migrateProducts(
            @RequestParam(value = "oldAttachmentPath", required = false) String oldAttachmentPath,
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName,
            @RequestParam(value = "fileIp", required = false) String fileIp,
            @RequestParam(value = "fileUsername", required = false) String fileUsername,
            @RequestParam(value = "filePassword", required = false) String filePassword,
            @RequestParam(value = "skipAttachments", required = false, defaultValue = "false") boolean skipAttachments) {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("NT_FSS.items -> NPD_PRODUCT_MASTER")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = npdMigrationService.migrateProducts(oldAttachmentPath, sqlIp, sqlUsername, sqlPassword,
                    secondaryDbName, fileIp, fileUsername, filePassword, skipAttachments);
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(response);
        } catch (Throwable e) {
            String errorMsg = "Product migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.toString());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            try {
                auditLogRepository.save(auditLog);
            } catch (Exception ex) {
                // Ignore audit log save failure to return response
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/npd/instruments")
    public ResponseEntity<Map<String, String>> migrateInstruments(
            @RequestParam(value = "oldAttachmentPath", required = false) String oldAttachmentPath,
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName,
            @RequestParam(value = "fileIp", required = false) String fileIp,
            @RequestParam(value = "fileUsername", required = false) String fileUsername,
            @RequestParam(value = "filePassword", required = false) String filePassword,
            @RequestParam(value = "skipAttachments", required = false, defaultValue = "false") boolean skipAttachments) {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        long startTime = System.currentTimeMillis();
        new Thread(() -> {
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId("autonoma");
                MigrationAuditLog auditLog = MigrationAuditLog.builder()
                        .tableName("NT_FSS.items -> QMT_ASSET_MASTER (Instruments)")
                        .migratedBy(currentUser)
                        .migratedAt(new Date())
                        .build();

                String result = npdMigrationService.migrateInstruments(oldAttachmentPath, sqlIp, sqlUsername, sqlPassword,
                        secondaryDbName, fileIp, fileUsername, filePassword, skipAttachments);
                
                auditLog.setStatus("SUCCESS");
                auditLog.setRecordsCount(extractCount(result));
                auditLog.setMessage(result);
                auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
                auditLogRepository.save(auditLog);
            } catch (Throwable e) {
                MigrationAuditLog auditLog = MigrationAuditLog.builder()
                        .tableName("NT_FSS.items -> QMT_ASSET_MASTER (Instruments)")
                        .migratedBy(currentUser)
                        .migratedAt(new Date())
                        .build();
                auditLog.setStatus("FAILED");
                auditLog.setRecordsCount(0);
                auditLog.setMessage(e.toString());
                auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
                try { auditLogRepository.save(auditLog); } catch (Exception ex) {}
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("instrumentMaster");
            } finally {
                com.autonoma.erp.config.TenantContextHolder.clear();
            }
        }).start();

        response.put("message", "Migration started in background.");
        response.put("status", "BACKGROUND");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/npd/consumables")
    public ResponseEntity<Map<String, String>> migrateConsumables(
            @RequestParam(value = "oldAttachmentPath", required = false) String oldAttachmentPath,
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName,
            @RequestParam(value = "fileIp", required = false) String fileIp,
            @RequestParam(value = "fileUsername", required = false) String fileUsername,
            @RequestParam(value = "filePassword", required = false) String filePassword,
            @RequestParam(value = "skipAttachments", required = false, defaultValue = "false") boolean skipAttachments) {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        long startTime = System.currentTimeMillis();
        new Thread(() -> {
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId("autonoma");
                MigrationAuditLog auditLog = MigrationAuditLog.builder()
                        .tableName("NT_FSS.items -> QMT_ASSET_MASTER (Consumables)")
                        .migratedBy(currentUser)
                        .migratedAt(new Date())
                        .build();

                String result = npdMigrationService.migrateConsumables(oldAttachmentPath, sqlIp, sqlUsername, sqlPassword,
                        secondaryDbName, fileIp, fileUsername, filePassword, skipAttachments);
                
                auditLog.setStatus("SUCCESS");
                auditLog.setRecordsCount(extractCount(result));
                auditLog.setMessage(result);
                auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
                auditLogRepository.save(auditLog);
            } catch (Throwable e) {
                MigrationAuditLog auditLog = MigrationAuditLog.builder()
                        .tableName("NT_FSS.items -> QMT_ASSET_MASTER (Consumables)")
                        .migratedBy(currentUser)
                        .migratedAt(new Date())
                        .build();
                auditLog.setStatus("FAILED");
                auditLog.setRecordsCount(0);
                auditLog.setMessage(e.toString());
                auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
                try { auditLogRepository.save(auditLog); } catch (Exception ex) {}
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("consumableMaster");
            } finally {
                com.autonoma.erp.config.TenantContextHolder.clear();
            }
        }).start();

        response.put("message", "Migration started in background.");
        response.put("status", "BACKGROUND");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/npd/machines-assets")
    public ResponseEntity<Map<String, String>> migrateMachinesAssets(
            @RequestParam(value = "oldAttachmentPath", required = false) String oldAttachmentPath,
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName,
            @RequestParam(value = "fileIp", required = false) String fileIp,
            @RequestParam(value = "fileUsername", required = false) String fileUsername,
            @RequestParam(value = "filePassword", required = false) String filePassword,
            @RequestParam(value = "skipAttachments", required = false, defaultValue = "false") boolean skipAttachments) {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        long startTime = System.currentTimeMillis();
        new Thread(() -> {
            try {
                com.autonoma.erp.config.TenantContextHolder.setTenantId("autonoma");
                MigrationAuditLog auditLog = MigrationAuditLog.builder()
                        .tableName("NT_FSS.items -> QMT_ASSET_MASTER (Assets)")
                        .migratedBy(currentUser)
                        .migratedAt(new Date())
                        .build();

                String result = npdMigrationService.migrateMachinesAssets(oldAttachmentPath, sqlIp, sqlUsername, sqlPassword,
                        secondaryDbName, fileIp, fileUsername, filePassword, skipAttachments);
                
                auditLog.setStatus("SUCCESS");
                auditLog.setRecordsCount(extractCount(result));
                auditLog.setMessage(result);
                auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
                auditLogRepository.save(auditLog);
            } catch (Throwable e) {
                MigrationAuditLog auditLog = MigrationAuditLog.builder()
                        .tableName("NT_FSS.items -> QMT_ASSET_MASTER (Assets)")
                        .migratedBy(currentUser)
                        .migratedAt(new Date())
                        .build();
                auditLog.setStatus("FAILED");
                auditLog.setRecordsCount(0);
                auditLog.setMessage(e.toString());
                auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
                try { auditLogRepository.save(auditLog); } catch (Exception ex) {}
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.fail("machineAssetMaster");
            } finally {
                com.autonoma.erp.config.TenantContextHolder.clear();
            }
        }).start();

        response.put("message", "Migration started in background.");
        response.put("status", "BACKGROUND");
        return ResponseEntity.ok(response);
    }

    // ─── POST /api/admin/migration/departments ──────────────────────────────────
    @PostMapping("/departments")
    public ResponseEntity<Map<String, String>> migrateDepartments() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("DEPT -> hrm_department_master")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateDepartments();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Department migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping(value = "/departments/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDepartments(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MasterChecklistMigrationService.resetStop();
        Map<String, Object> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EXCEL -> HR_DEPARTMENT")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> result = hrmsMigrationService.migrateDepartmentsFromExcel(file);
            response.putAll(result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount((String) result.get("message")));
            auditLog.setMessage((String) result.get("message"));
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Department Excel migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/departments/sample")
    public ResponseEntity<byte[]> getDepartmentsSampleExcel() {
        try {
            byte[] fileContent = hrmsMigrationService.generateDepartmentSampleExcel();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "Department_Sample.xlsx");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─── POST /api/admin/migration/audit-areas ──────────────────────────────────
    @PostMapping("/audit-areas")
    public ResponseEntity<Map<String, String>> migrateAuditAreas() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("AUDIT_ZONE_AREA_MASTER -> QMS_AUDIT_AREA")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateAuditAreas();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Audit Area migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/audit-types ──────────────────────────────────
    @PostMapping("/audit-types")
    public ResponseEntity<Map<String, String>> migrateAuditTypes() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("AUDIT_TYPE_MASTER -> QMS_AUDIT_TYPE")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateAuditTypes();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Audit Type migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/audit-criteria ────────────────────────────────
    @PostMapping("/audit-criteria")
    public ResponseEntity<Map<String, String>> migrateAuditCriteria() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("AUDIT_MASTER -> QMS_AUDIT_CRITERIA")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateAuditCriteria(currentUser);
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Audit Criteria migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/audit-schedules ──────────────────────────────
    @PostMapping("/audit-schedules")
    public ResponseEntity<Map<String, String>> migrateAuditSchedules() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("AUDIT_SCHEDULE_MASTER -> QMS_AUDIT_SCHEDULE")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateAuditSchedules();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Audit Schedule migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/audit-attendances ────────────────────────────
    @PostMapping("/audit-attendances")
    public ResponseEntity<Map<String, String>> migrateAuditAttendances() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("AUDIT_USER_ATTENDANCE -> QMS_AUDIT_ATTENDANCE")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateAuditAttendances();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Audit Attendance migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/audit-observations ───────────────────────────
    @PostMapping("/audit-observations")
    public ResponseEntity<Map<String, String>> migrateAuditObservations() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("AUDIT_OBSERVATION_MASTER -> QMS_AUDIT_OBSERVATION")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateAuditObservations();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Audit Observation migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/audit-ncr ─────────────────────────────────────
    @PostMapping("/audit-ncr")
    public ResponseEntity<Map<String, String>> migrateAuditNcr() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("CREATE_NCR_MASTER -> QMS_NCR_REWORK_LOG")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateAuditNcrReworks();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Audit NCR migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── DELETE /api/admin/migration/audit-ncr ───────────────────────────────────
    @DeleteMapping("/audit-ncr")
    public ResponseEntity<Map<String, String>> clearAuditNcr() {
        Map<String, String> response = new HashMap<>();
        try {
            String result = migrationService.clearAuditNcrReworks();
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Audit NCR clear failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/assignments")
    public ResponseEntity<Map<String, String>> migrateAssignments() {
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("QMS_ASSIGN_CHECKLIST -> qms_checklist_assignment")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateChecklistAssignments();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Assignment migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/checklists-and-assignments ────────────────────
    @PostMapping("/checklists-and-assignments")
    public ResponseEntity<Map<String, String>> migrateChecklistsAndAssignments() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();
        StringBuilder summary = new StringBuilder();
        boolean anyFailed = false;

        // Part 1: Master Checklists
        MigrationAuditLog masterLog = MigrationAuditLog.builder()
                .tableName("HRMS_MASTER_CHECKLIST -> qms_checklist_master")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();
        long startTime1 = System.currentTimeMillis();
        try {
            String result = migrationService.migrateOldChecklists();
            masterLog.setStatus("SUCCESS");
            masterLog.setRecordsCount(extractCount(result));
            masterLog.setMessage(result);
            summary.append("[Master] ").append(result).append(" | ");
        } catch (Exception e) {
            anyFailed = true;
            masterLog.setStatus("FAILED");
            masterLog.setRecordsCount(0);
            masterLog.setMessage(e.getMessage());
            summary.append("[Master] FAILED: ").append(e.getMessage()).append(" | ");
        } finally {
            masterLog.setExecutionTimeMs(System.currentTimeMillis() - startTime1);
            if (masterLog != null && masterLog.getRecordsCount() != null && masterLog.getRecordsCount() > 0) {
                auditLogRepository.save(masterLog);
            }
        }

        // Part 2: Checklist Assignments
        MigrationAuditLog assignLog = MigrationAuditLog.builder()
                .tableName("QMS_ASSIGN_CHECKLIST -> qms_checklist_assignment")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();
        long startTime2 = System.currentTimeMillis();
        try {
            String result = migrationService.migrateChecklistAssignments();
            assignLog.setStatus("SUCCESS");
            assignLog.setRecordsCount(extractCount(result));
            assignLog.setMessage(result);
            summary.append("[Assignments] ").append(result);
        } catch (Exception e) {
            anyFailed = true;
            assignLog.setStatus("FAILED");
            assignLog.setRecordsCount(0);
            assignLog.setMessage(e.getMessage());
            summary.append("[Assignments] FAILED: ").append(e.getMessage());
        } finally {
            assignLog.setExecutionTimeMs(System.currentTimeMillis() - startTime2);
            if (assignLog != null && assignLog.getRecordsCount() != null && assignLog.getRecordsCount() > 0) {
                auditLogRepository.save(assignLog);
            }
        }

        response.put("message", summary.toString());
        return anyFailed
                ? ResponseEntity.internalServerError().body(response)
                : ResponseEntity.ok(response);
    }

    // ─── POST /api/admin/migration/all ───────────────────────────────────────────
    @PostMapping("/all")
    public ResponseEntity<Map<String, String>> migrateAll() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();
        StringBuilder summary = new StringBuilder();
        boolean anyFailed = false;

        // Step 1: Departments
        MigrationAuditLog deptLog = MigrationAuditLog.builder()
                .tableName("DEPT -> hrm_department_master")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();
        long startTime1 = System.currentTimeMillis();
        try {
            String result = migrationService.migrateDepartments();
            deptLog.setStatus("SUCCESS");
            deptLog.setRecordsCount(extractCount(result));
            deptLog.setMessage(result);
            summary.append("[Departments] ").append(result).append(" | ");
        } catch (Exception e) {
            anyFailed = true;
            deptLog.setStatus("FAILED");
            deptLog.setRecordsCount(0);
            deptLog.setMessage(e.getMessage());
            summary.append("[Departments] FAILED: ").append(e.getMessage()).append(" | ");
        } finally {
            deptLog.setExecutionTimeMs(System.currentTimeMillis() - startTime1);
            if (deptLog != null && deptLog.getRecordsCount() != null && deptLog.getRecordsCount() > 0) {
                auditLogRepository.save(deptLog);
            }
        }

        if (MasterChecklistMigrationService.stopFlag.get()) {
            response.put("message", summary.append(" | Migration stopped manually.").toString());
            return ResponseEntity.ok(response);
        }

        // Step 2: Master Checklists
        MigrationAuditLog masterLog = MigrationAuditLog.builder()
                .tableName("HRMS_MASTER_CHECKLIST -> qms_checklist_master")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();
        long startTime2 = System.currentTimeMillis();
        try {
            String result = migrationService.migrateOldChecklists();
            masterLog.setStatus("SUCCESS");
            masterLog.setRecordsCount(extractCount(result));
            masterLog.setMessage(result);
            summary.append("[Master] ").append(result).append(" | ");
        } catch (Exception e) {
            anyFailed = true;
            masterLog.setStatus("FAILED");
            masterLog.setRecordsCount(0);
            masterLog.setMessage(e.getMessage());
            summary.append("[Master] FAILED: ").append(e.getMessage()).append(" | ");
        } finally {
            masterLog.setExecutionTimeMs(System.currentTimeMillis() - startTime2);
            if (masterLog != null && masterLog.getRecordsCount() != null && masterLog.getRecordsCount() > 0) {
                auditLogRepository.save(masterLog);
            }
        }

        if (MasterChecklistMigrationService.stopFlag.get()) {
            response.put("message", summary.append(" | Migration stopped manually.").toString());
            return ResponseEntity.ok(response);
        }

        // Step 3: Checklist Assignments
        MigrationAuditLog assignLog = MigrationAuditLog.builder()
                .tableName("QMS_ASSIGN_CHECKLIST -> qms_checklist_assignment")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();
        long startTime3 = System.currentTimeMillis();
        try {
            String result = migrationService.migrateChecklistAssignments();
            assignLog.setStatus("SUCCESS");
            assignLog.setRecordsCount(extractCount(result));
            assignLog.setMessage(result);
            summary.append("[Assignments] ").append(result).append(" | ");
        } catch (Exception e) {
            anyFailed = true;
            assignLog.setStatus("FAILED");
            assignLog.setRecordsCount(0);
            assignLog.setMessage(e.getMessage());
            summary.append("[Assignments] FAILED: ").append(e.getMessage()).append(" | ");
        } finally {
            assignLog.setExecutionTimeMs(System.currentTimeMillis() - startTime3);
            if (assignLog != null && assignLog.getRecordsCount() != null && assignLog.getRecordsCount() > 0) {
                auditLogRepository.save(assignLog);
            }
        }

        if (MasterChecklistMigrationService.stopFlag.get()) {
            response.put("message", summary.append(" | Migration stopped manually.").toString());
            return ResponseEntity.ok(response);
        }

        // Step 4: Close Checklist Assignments (Pending Master)
        MigrationAuditLog closeLog = MigrationAuditLog.builder()
                .tableName("HRMS_CHECKLIST_PENDING_MASTER -> qms_checklist_assignment")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();
        long startTime4 = System.currentTimeMillis();
        try {
            String result = migrationService.migrateCloseChecklists();
            closeLog.setStatus("SUCCESS");
            closeLog.setRecordsCount(extractCount(result));
            closeLog.setMessage(result);
            summary.append("[Close Checklists] ").append(result);
        } catch (Exception e) {
            anyFailed = true;
            closeLog.setStatus("FAILED");
            closeLog.setRecordsCount(0);
            closeLog.setMessage(e.getMessage());
            summary.append("[Close Checklists] FAILED: ").append(e.getMessage()).append(" | ");
        } finally {
            closeLog.setExecutionTimeMs(System.currentTimeMillis() - startTime4);
            if (closeLog != null && closeLog.getRecordsCount() != null && closeLog.getRecordsCount() > 0) {
                auditLogRepository.save(closeLog);
            }
        }

        if (MasterChecklistMigrationService.stopFlag.get()) {
            response.put("message", summary.append(" | Migration stopped manually.").toString());
            return ResponseEntity.ok(response);
        }

        // Step 5: HRMS Employee Types
        MigrationAuditLog hrmsEmpTypeLog = MigrationAuditLog.builder()
                .tableName("HRMS_EMPLOYEE_TYPE_MASTER -> HR_EMPLOYEE_TYPE")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();
        long startTime5 = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateEmployeeTypes();
            hrmsEmpTypeLog.setStatus("SUCCESS");
            hrmsEmpTypeLog.setRecordsCount(extractCount(result));
            hrmsEmpTypeLog.setMessage(result);
            summary.append("[HRMS Employee Types] ").append(result).append(" | ");
        } catch (Exception e) {
            anyFailed = true;
            hrmsEmpTypeLog.setStatus("FAILED");
            hrmsEmpTypeLog.setRecordsCount(0);
            hrmsEmpTypeLog.setMessage(e.getMessage());
            summary.append("[HRMS Employee Types] FAILED: ").append(e.getMessage()).append(" | ");
        } finally {
            hrmsEmpTypeLog.setExecutionTimeMs(System.currentTimeMillis() - startTime5);
            if (hrmsEmpTypeLog != null && hrmsEmpTypeLog.getRecordsCount() != null
                    && hrmsEmpTypeLog.getRecordsCount() > 0) {
                auditLogRepository.save(hrmsEmpTypeLog);
            }
        }

        if (MasterChecklistMigrationService.stopFlag.get()) {
            response.put("message", summary.append(" | Migration stopped manually.").toString());
            return ResponseEntity.ok(response);
        }

        // Step 6: Designations
        MigrationAuditLog desigLog = MigrationAuditLog.builder()
                .tableName("HRMS_DESIG_MASTER -> HR_DESIGNATION")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();
        long startTime6 = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateDesignations();
            desigLog.setStatus("SUCCESS");
            desigLog.setRecordsCount(extractCount(result));
            desigLog.setMessage(result);
            summary.append("[Designations] ").append(result);
        } catch (Exception e) {
            anyFailed = true;
            desigLog.setStatus("FAILED");
            desigLog.setRecordsCount(0);
            desigLog.setMessage(e.getMessage());
            summary.append("[Designations] FAILED: ").append(e.getMessage());
        } finally {
            desigLog.setExecutionTimeMs(System.currentTimeMillis() - startTime6);
            if (desigLog != null && desigLog.getRecordsCount() != null && desigLog.getRecordsCount() > 0) {
                auditLogRepository.save(desigLog);
            }
        }

        if (MasterChecklistMigrationService.stopFlag.get()) {
            response.put("message", summary.append(" | Migration stopped manually.").toString());
            return ResponseEntity.ok(response);
        }

        // Step 7: Designation Levels
        MigrationAuditLog desigLevelLog = MigrationAuditLog.builder()
                .tableName("HRMS_DESIG_LEVEL_MASTER -> HR_DESIGNATION_LEVEL")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();
        long startTime7 = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateDesignationLevels();
            desigLevelLog.setStatus("SUCCESS");
            desigLevelLog.setRecordsCount(extractCount(result));
            desigLevelLog.setMessage(result);
            summary.append("[Designation Levels] ").append(result);
        } catch (Exception e) {
            anyFailed = true;
            desigLevelLog.setStatus("FAILED");
            desigLevelLog.setRecordsCount(0);
            desigLevelLog.setMessage(e.getMessage());
            summary.append("[Designation Levels] FAILED: ").append(e.getMessage());
        } finally {
            desigLevelLog.setExecutionTimeMs(System.currentTimeMillis() - startTime7);
            if (desigLevelLog != null && desigLevelLog.getRecordsCount() != null
                    && desigLevelLog.getRecordsCount() > 0) {
                auditLogRepository.save(desigLevelLog);
            }
        }

        if (MasterChecklistMigrationService.stopFlag.get()) {
            response.put("message", summary.append(" | Migration stopped manually.").toString());
            return ResponseEntity.ok(response);
        }

        // Step 8: Grades
        MigrationAuditLog gradeLog = MigrationAuditLog.builder()
                .tableName("HRMS_GRADE_MASTER -> HR_GRADE_DETAIL")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();
        long startTime8 = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateGrades();
            gradeLog.setStatus("SUCCESS");
            gradeLog.setRecordsCount(extractCount(result));
            gradeLog.setMessage(result);
            summary.append("[Grades] ").append(result);
        } catch (Exception e) {
            anyFailed = true;
            gradeLog.setStatus("FAILED");
            gradeLog.setRecordsCount(0);
            gradeLog.setMessage(e.getMessage());
            summary.append("[Grades] FAILED: ").append(e.getMessage());
        } finally {
            gradeLog.setExecutionTimeMs(System.currentTimeMillis() - startTime8);
            if (gradeLog != null && gradeLog.getRecordsCount() != null && gradeLog.getRecordsCount() > 0) {
                auditLogRepository.save(gradeLog);
            }
        }

        response.put("message", summary.toString());
        return anyFailed
                ? ResponseEntity.internalServerError().body(response)
                : ResponseEntity.ok(response);
    }

    // ─── POST /api/admin/migration/checklist-closed ───────────────────────────
    @PostMapping("/checklist-closed")
    public ResponseEntity<Map<String, String>> migrateChecklistClosed() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();
        String tenantId = com.autonoma.erp.config.TenantContextHolder.getTenantId();

        long startTime = System.currentTimeMillis();
        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("HRMS_CHECKLIST_PENDING_MASTER -> QMS_CHECKLIST_CLOSED")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        final String secondaryDbName = MasterChecklistMigrationService.getSecondaryDbName();
        final String oldAttachmentPath = MasterChecklistMigrationService.getSecondaryAttachmentPath();
        final String sqlIp = com.autonoma.erp.config.MigrationCredentialsContext.getIp();
        final String sqlUsername = com.autonoma.erp.config.MigrationCredentialsContext.getUsername();
        final String sqlPassword = com.autonoma.erp.config.MigrationCredentialsContext.getPassword();

        new Thread(() -> {
            try {
                if (tenantId != null) {
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(tenantId);
                }
                if (secondaryDbName != null || oldAttachmentPath != null) {
                    MasterChecklistMigrationService.setMigrationContext(secondaryDbName, oldAttachmentPath);
                }
                if (sqlIp != null || sqlUsername != null || sqlPassword != null) {
                    com.autonoma.erp.config.MigrationCredentialsContext.setCredentials(sqlIp, sqlUsername, sqlPassword);
                }
                int totalCount = migrationService.getChecklistClosedCount();
                if (totalCount <= 0) {
                    totalCount = 241663; // Fallback
                }
                // Initialize progress tracker so UI knows it started
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .start("checklistClosed", totalCount);
                String result = migrationService.migrateChecklistClosed();
                auditLog.setStatus("SUCCESS");
                auditLog.setRecordsCount(extractCount(result));
                auditLog.setMessage(result);
                auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
                auditLogRepository.save(auditLog);
            } catch (Exception e) {
                auditLog.setStatus("FAILED");
                auditLog.setRecordsCount(0);
                auditLog.setMessage(e.getMessage());
                auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
                auditLogRepository.save(auditLog);
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .fail("checklistClosed");
            } finally {
                com.autonoma.erp.config.TenantContextHolder.clear();
                MasterChecklistMigrationService.clearMigrationContext();
                com.autonoma.erp.config.MigrationCredentialsContext.clear();
            }
        }).start();

        response.put("message", "Migration started in background.");
        response.put("status", "BACKGROUND");
        return ResponseEntity.ok(response);
    }

    // ─── POST /api/admin/migration/ats-recruitment ──────────────────────────────
    @PostMapping("/ats-recruitment")
    public ResponseEntity<Map<String, String>> migrateAtsRecruitment() {
        System.out.println("[ATS MIGRATION] started --> ats-recruitment");
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();
        String tenantId = com.autonoma.erp.config.TenantContextHolder.getTenantId();
        System.out.println("[ATS MIGRATION] ats-recruitment --->1. currentUser: " + currentUser + ", tenantId: " + tenantId);
        long startTime = System.currentTimeMillis();
        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("HRMS_NEWAPP_MASTER -> HR_EMPLOYEE & Child Tables")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();
        System.out.println("[ATS MIGRATION] ats-recruitment --->2");
        final String secondaryDbName = MasterChecklistMigrationService.getSecondaryDbName();
        final String oldAttachmentPath = MasterChecklistMigrationService.getSecondaryAttachmentPath();
        final String sqlIp = com.autonoma.erp.config.MigrationCredentialsContext.getIp();
        final String sqlUsername = com.autonoma.erp.config.MigrationCredentialsContext.getUsername();
        final String sqlPassword = com.autonoma.erp.config.MigrationCredentialsContext.getPassword();
        System.out.println("[ATS MIGRATION] Context values retrieved. DB: " + secondaryDbName + ", IP: " + sqlIp);

        new Thread(() -> {
            try {
                System.out.println("[ATS MIGRATION THREAD] Background thread started.");
                if (tenantId != null) {
                    System.out.println("[ATS MIGRATION THREAD] Setting tenantId: " + tenantId);
                    com.autonoma.erp.config.TenantContextHolder.setTenantId(tenantId);
                }
                if (secondaryDbName != null || oldAttachmentPath != null) {
                    System.out.println("[ATS MIGRATION THREAD] Setting migration context. DB: " + secondaryDbName + ", Path: " + oldAttachmentPath);
                    MasterChecklistMigrationService.setMigrationContext(secondaryDbName, oldAttachmentPath);
                }
                if (sqlIp != null || sqlUsername != null || sqlPassword != null) {
                    System.out.println("[ATS MIGRATION THREAD] Setting secondary DB credentials. IP: " + sqlIp + ", User: " + sqlUsername);
                    com.autonoma.erp.config.MigrationCredentialsContext.setCredentials(sqlIp, sqlUsername, sqlPassword);
                }

                System.out.println("[ATS MIGRATION THREAD] Querying total recruitment count...");
                int totalCount = hrmsMigrationService.getAtsRecruitmentCount();
                System.out.println("[ATS MIGRATION THREAD] Total count returned: " + totalCount);
                if (totalCount <= 0) {
                    totalCount = 1000; // Fallback
                    System.out.println("[ATS MIGRATION THREAD] Count <= 0, using fallback count: " + totalCount);
                }

                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .start("atsRecruitment", totalCount);
                System.out.println("[ATS MIGRATION THREAD] Tracker initialized with count: " + totalCount);

                System.out.println("[ATS MIGRATION THREAD] Calling hrmsMigrationService.migrateAtsData()...");
                String result = hrmsMigrationService.migrateAtsData();
                System.out.println("[ATS MIGRATION THREAD] migrateAtsData() completed successfully. Result: " + result);
                
                auditLog.setStatus("SUCCESS");
                auditLog.setRecordsCount(extractCount(result));
                auditLog.setMessage(result);
                auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
                auditLogRepository.save(auditLog);
                System.out.println("[ATS MIGRATION THREAD] Audit log saved successfully.");

                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .complete("atsRecruitment");
                System.out.println("[ATS MIGRATION THREAD] Tracker marked as complete.");
            } catch (Exception e) {
                System.out.println("[ATS MIGRATION THREAD] Exception occurred during migration: " + e.getMessage());
                e.printStackTrace();
                auditLog.setStatus("FAILED");
                auditLog.setRecordsCount(0);
                auditLog.setMessage(e.getMessage());
                auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
                try {
                    auditLogRepository.save(auditLog);
                    System.out.println("[ATS MIGRATION THREAD] Failed audit log saved.");
                } catch (Exception ex) {
                    System.out.println("[ATS MIGRATION THREAD] Failed to save audit log: " + ex.getMessage());
                }
                com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                        .fail("atsRecruitment");
            } finally {
                System.out.println("[ATS MIGRATION THREAD] Cleaning up contexts.");
                com.autonoma.erp.config.TenantContextHolder.clear();
                MasterChecklistMigrationService.clearMigrationContext();
                com.autonoma.erp.config.MigrationCredentialsContext.clear();
            }
        }).start();

        response.put("message", "ATS Recruitment Migration started in background.");
        response.put("status", "BACKGROUND");
        return ResponseEntity.ok(response);
    }

    // ─── POST /api/admin/migration/close-checklists ──────────────────────────────
    @PostMapping("/close-checklists")
    public ResponseEntity<Map<String, String>> migrateCloseChecklists() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("HRMS_CHECKLIST_PENDING_MASTER -> qms_checklist_assignment")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateCloseChecklists();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Close checklist migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/hrms-employee-types ───────────────────────────
    @PostMapping("/hrms-employee-types")
    public ResponseEntity<Map<String, String>> migrateHrmsEmployeeTypes() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("HRMS_EMPLOYEE_TYPE_MASTER -> HR_EMPLOYEE_TYPE")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateEmployeeTypes();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "HRMS Employee Type migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping(value = "/hrms-employee-types/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadHrmsEmployeeTypes(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MasterChecklistMigrationService.resetStop();
        Map<String, Object> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EXCEL -> HR_EMPLOYEE_TYPE")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> result = hrmsMigrationService.migrateEmployeeTypesFromExcel(file);
            response.putAll(result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount((String) result.get("message")));
            auditLog.setMessage((String) result.get("message"));
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "HRMS Employee Type Excel migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/hrms-employee-types/sample")
    public ResponseEntity<byte[]> getEmployeeTypesSampleExcel() {
        try {
            byte[] fileContent = hrmsMigrationService.generateEmployeeTypeSampleExcel();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "EmployeeType_Sample.xlsx");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─── POST /api/admin/migration/user-credentials ─────────────────────────────
    @PostMapping("/user-credentials")
    public ResponseEntity<Map<String, String>> migrateUserCredentials() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("ERP_USER -> AD_USER_CREDENTIAL")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateUserCredentials();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "User Credentials migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/divisions")
    public ResponseEntity<Map<String, String>> migrateDivisions() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("divisions -> AD_DIVISION")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateDivisions();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Divisions migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/accounts/ledger-group ────────────────────────
    @PostMapping("/accounts/ledger-group")
    public ResponseEntity<Map<String, String>> migrateLedgerGroup() {
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("FA_LEDGER_GROUP")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = accountsMigrationService.migrateLedgerGroups();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Ledger Group migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/accounts/customer ────────────────────────
    @PostMapping("/accounts/customer")
    public ResponseEntity<Map<String, String>> migrateCustomerLedgers() {
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("FA_ACCOUNT_LEDGER (CUSTOMER)")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = accountsMigrationService.migrateCustomerLedgers();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Customer Ledger migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/accounts/supplier ────────────────────────
    @PostMapping("/accounts/supplier")
    public ResponseEntity<Map<String, String>> migrateSupplierLedgers() {
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("FA_ACCOUNT_LEDGER (SUPPLIER)")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = accountsMigrationService.migrateSupplierLedgers();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Supplier Ledger migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/accounts/tax ────────────────────────
    @PostMapping("/accounts/tax")
    public ResponseEntity<Map<String, String>> migrateTaxLedgers() {
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("FA_ACCOUNT_LEDGER (TAX)")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = accountsMigrationService.migrateTaxLedgers();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Tax Ledger migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/accounts/finance ────────────────────────
    @PostMapping("/accounts/finance")
    public ResponseEntity<Map<String, String>> migrateFinanceLedgers() {
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("FA_ACCOUNT_LEDGER (FINANCE)")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = accountsMigrationService.migrateFinanceLedgers();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Finance Ledger migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/accounts/terms-master ──────────────────
    @PostMapping("/accounts/terms-master")
    public ResponseEntity<Map<String, String>> migrateTermsMaster() {
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("MST_TERMS_MASTER")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = accountsMigrationService.migrateTermsMaster();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Terms Master migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/designations ───────────────────────────
    @PostMapping("/designations")
    public ResponseEntity<Map<String, String>> migrateDesignations() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("HRMS_DESIG_MASTER -> HR_DESIGNATION")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateDesignations();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Designation migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping(value = "/designations/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDesignations(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MasterChecklistMigrationService.resetStop();
        Map<String, Object> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EXCEL -> HR_DESIGNATION")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> result = hrmsMigrationService.migrateDesignationsFromExcel(file);
            response.putAll(result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount((String) result.get("message")));
            auditLog.setMessage((String) result.get("message"));
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Designation Excel migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/designations/sample")
    public ResponseEntity<byte[]> getDesignationsSampleExcel() {
        try {
            byte[] fileContent = hrmsMigrationService.generateDesignationSampleExcel();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "Designation_Sample.xlsx");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─── POST /api/admin/migration/designation-levels ─────────────────────────
    @PostMapping("/designation-levels")
    public ResponseEntity<Map<String, String>> migrateDesignationLevels() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("HRMS_DESIG_LEVEL_MASTER -> HR_DESIGNATION_LEVEL")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateDesignationLevels();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Designation Level migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping(value = "/designation-levels/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDesignationLevels(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MasterChecklistMigrationService.resetStop();
        Map<String, Object> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EXCEL -> HR_DESIGNATION_LEVEL")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> result = hrmsMigrationService.migrateDesignationLevelsFromExcel(file);
            response.putAll(result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount((String) result.get("message")));
            auditLog.setMessage((String) result.get("message"));
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Designation Level Excel migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/designation-levels/sample")
    public ResponseEntity<byte[]> getDesignationLevelsSampleExcel() {
        try {
            byte[] fileContent = hrmsMigrationService.generateDesignationLevelSampleExcel();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "DesignationLevel_Sample.xlsx");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─── POST /api/admin/migration/grades
    // ─────────────────────────────────────────
    @PostMapping("/grades")
    public ResponseEntity<Map<String, String>> migrateGrades() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("HRMS_GRADE_MASTER -> HR_GRADE_DETAIL")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateGrades();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Grade migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping(value = "/grades/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadGrades(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MasterChecklistMigrationService.resetStop();
        Map<String, Object> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EXCEL -> HR_GRADE_DETAIL")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> result = hrmsMigrationService.migrateGradesFromExcel(file);
            response.putAll(result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount((String) result.get("message")));
            auditLog.setMessage((String) result.get("message"));
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Grade Excel migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/grades/sample")
    public ResponseEntity<byte[]> getGradesSampleExcel() {
        try {
            byte[] fileContent = hrmsMigrationService.generateGradeSampleExcel();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "Grade_Sample.xlsx");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─── POST /api/admin/migration/payroll/permissions ────────────────────────
    @PostMapping("/payroll/permissions")
    public ResponseEntity<Map<String, String>> migratePermissions() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("HRMS_PERMISSION_DETAILS -> HR_PERMISSION_DETAILS")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migratePermissions();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Permission migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/meeting-mom")
    public ResponseEntity<Map<String, String>> migrateMeetingMom() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("MEETING_MINUTES_MASTER -> QMS_MOM_MASTER")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateMeetingMom();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Meeting Mom migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/close-mom")
    public ResponseEntity<Map<String, String>> migrateCloseMom() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("CLOSE_MOM_ACTION -> QMS_CLOSE_MOM_AND_VERIFY")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationService.migrateCloseMom();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Close MOM migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── GET /api/admin/migration/audit-logs ─────────────────────────────────────
    @GetMapping("/audit-logs")
    public ResponseEntity<List<MigrationAuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByMigratedAtDesc());
    }

    // ─── DELETE /api/admin/migration/audit-logs/{id} (single) ──────────────────
    @DeleteMapping("/audit-logs/{id}")
    public ResponseEntity<Map<String, String>> deleteAuditLog(@PathVariable Long id) {
        if (!auditLogRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        auditLogRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Audit log deleted successfully."));
    }

    // ─── DELETE /api/admin/migration/audit-logs (bulk) ──────────────────────────
    @DeleteMapping("/audit-logs")
    public ResponseEntity<Map<String, String>> deleteAuditLogs(@RequestBody List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No IDs provided."));
        }
        auditLogRepository.deleteAllById(ids);
        return ResponseEntity.ok(Map.of("message", "Deleted " + ids.size() + " audit log(s) successfully."));
    }

    // ─── POST /api/admin/migration/stop ──────────────────────────────────────────
    @PostMapping("/stop")
    public ResponseEntity<Map<String, String>> stopMigration(@RequestParam(value = "stepId", required = false) String stepId) {
        MasterChecklistMigrationService.requestStop();
        if (stepId != null && !stepId.trim().isEmpty()) {
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.requestStop(stepId.trim());
        } else {
            com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.requestStop();
        }
        Map<String, String> response = new HashMap<>();
        response.put("message", "Stop signal sent to active migrations.");
        return ResponseEntity.ok(response);
    }

    // ─── DELETE /api/admin/migration/drop-tables ──────────────────────────────
    @DeleteMapping("/drop-tables")
    public ResponseEntity<Map<String, String>> dropAllTables() {
        Map<String, String> response = new HashMap<>();
        try {
            String result = databaseCleanupService.dropAllTables();
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Failed to drop tables: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/create-tables ──────────────────────────────
    @PostMapping("/create-tables")
    public ResponseEntity<Map<String, String>> createAllTables() {
        Map<String, String> response = new HashMap<>();
        try {
            String result = databaseCleanupService.createAllTables();
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Failed to create tables: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }


    // ─── GET /api/admin/migration/progress/{migrationId} ─────────────────────────
    @GetMapping("/progress/{migrationId}")
    public ResponseEntity<?> getMigrationProgress(@PathVariable String migrationId) {
        com.autonoma.erp.modules.platform.datamigration.dto.MigrationProgress progress = com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker
                .getProgress(migrationId);

        if (progress == null) {
            com.autonoma.erp.modules.platform.datamigration.dto.MigrationProgress defaultProgress = new com.autonoma.erp.modules.platform.datamigration.dto.MigrationProgress();
            defaultProgress.setTotalRecords(-1);
            defaultProgress.setMigratedRecords(0);
            defaultProgress.setPendingRecords(0);
            defaultProgress.setFailedRecords(0);
            defaultProgress.setStatus("NOT_STARTED");
            return ResponseEntity.ok(defaultProgress);
        }
        return ResponseEntity.ok(progress);
    }

    // ─── GET /api/admin/migration/progress/all ──────────────────────────────
    @GetMapping("/progress/all")
    public ResponseEntity<?> getAllMigrationProgress() {
        return ResponseEntity
                .ok(com.autonoma.erp.modules.platform.datamigration.service.MigrationProgressTracker.progressMap);
    }

    // ─── DELETE /api/admin/migration/clear/{module} ──────────────────────────────
    @DeleteMapping("/clear/{module}")
    public ResponseEntity<Map<String, String>> clearMigrationData(@PathVariable String module) {
        Map<String, String> response = new HashMap<>();
        try {
            String message;
            switch (module) {
                case "checklists-and-assignments":
                    message = migrationService.clearChecklists();
                    break;
                case "ledgerGroup":
                    message = accountsMigrationService.clearLedgerGroups();
                    break;
                case "customerAccount":
                    message = accountsMigrationService.clearCustomerLedgers();
                    break;
                case "supplierAccount":
                    message = accountsMigrationService.clearSupplierLedgers();
                    break;
                case "financeAccount":
                    message = accountsMigrationService.clearFinanceLedgers();
                    break;
                case "taxAccount":
                    message = accountsMigrationService.clearTaxLedgers();
                    break;
                case "termsMaster":
                case "terms-master":
                    message = accountsMigrationService.clearTermsMaster();
                    break;
                case "checklist-master-documents":
                case "checklistMasterDocuments":
                    message = migrationService.clearChecklistMasterDocuments();
                    break;
                case "close-checklists":
                    message = migrationService.clearChecklistAssignments();
                    break;
                case "checklist-closed":
                case "checklistClosed":
                    message = migrationService.clearChecklistClosed();
                    break;
                case "departments":
                    message = migrationService.clearDepartments();
                    break;
                case "hrms-employee-types":
                    message = hrmsMigrationService.clearEmployeeTypes();
                    break;
                case "user-credentials":
                case "userCredentials":
                    message = hrmsMigrationService.clearUserCredentials();
                    break;
                case "designations":
                    message = hrmsMigrationService.clearDesignations();
                    break;
                case "designation-levels":
                    message = hrmsMigrationService.clearDesignationLevels();
                    break;
                case "grades":
                    message = hrmsMigrationService.clearGrades();
                    break;
                case "payroll/permissions":
                case "permissions":
                    message = hrmsMigrationService.clearPermissions();
                    break;
                case "auditAreas":
                case "audit-areas":
                    message = migrationService.clearAuditAreas();
                    break;
                case "auditTypes":
                case "audit-types":
                    message = migrationService.clearAuditTypes();
                    break;
                case "auditCriteria":
                case "audit-criteria":
                    message = migrationService.clearAuditCriteria();
                    break;
                case "auditSchedules":
                case "audit-schedules":
                    message = migrationService.clearAuditSchedules();
                    break;
                case "auditAttendances":
                case "audit-attendances":
                    message = migrationService.clearAuditAttendances();
                    break;
                case "auditObservations":
                case "audit-observations":
                    message = migrationService.clearAuditObservations();
                    break;
                case "meeting-master":
                    message = migrationService.clearMeetingMaster();
                    break;
                case "meeting-schedule":
                    message = migrationService.clearMeetingSchedule();
                    break;
                case "meeting-user-attendance":
                case "meetingUserAttendance":
                    message = migrationService.clearMeetingUserAttendance();
                    break;
                case "meeting-mom":
                case "meetingMom":
                    message = migrationService.clearMeetingMom();
                    break;
                case "close-mom":
                case "closeMom":
                    message = migrationService.clearCloseMom();
                    break;
                case "order/visitor-gate-pass":
                case "visitor-gate-pass":
                    message = orderMigrationService.clearVisitorGatePass();
                    break;
                case "auditNcr":
                case "audit-ncr":
                    message = migrationService.clearAuditNcrReworks();
                    break;
                case "interview-criteria":
                case "interviewCriteria":
                    message = hrmsMigrationService.clearInterviewCriteria();
                    break;
                case "induction-criteria":
                case "inductionCriteria":
                    message = hrmsMigrationService.clearInductionCriteria();
                    break;
                case "applicantVerificationCriteria":
                    message = hrmsMigrationService.clearApplicantVerificationCriteria();
                    break;
                case "ats-recruitment":
                case "atsRecruitment":
                    message = hrmsMigrationService.clearAtsData();
                    break;
                case "productMaster":
                    message = npdMigrationService.clearProductMaster();
                    break;
                case "productBomMaster":
                case "product-bom-master":
                    message = npdMigrationService.clearProductBoms();
                    break;
                case "consumableMaster":
                    message = npdMigrationService.clearConsumableMaster();
                    break;
                case "instrumentMaster":
                    message = npdMigrationService.clearInstrumentMaster();
                    break;
                case "machineAssetMaster":
                    message = npdMigrationService.clearMachineAssetMaster();
                    break;
                case "divisionMaster":
                    message = hrmsMigrationService.clearDivisions();
                    break;
                case "inspectionSpecification":
                case "inspection-specification":
                    message = inspectionSpecificationMigrationService.clearInspectionSpecifications();
                    break;
                default:
                    return ResponseEntity.badRequest().body(Map.of("message", "Unknown module for clearing data."));
            }
            response.put("message", message);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Clear operation failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── POST /api/admin/migration/employee-master-all ─────────────────────────
    @PostMapping("/employee-master-all")
    public ResponseEntity<Map<String, String>> migrateEmployeeMasterAll(
            @RequestParam(required = false) String sqlIp,
            @RequestParam(required = false) String sqlUsername,
            @RequestParam(required = false) String sqlPassword,
            @RequestParam(required = false) String secondaryDbName) {
        MasterChecklistMigrationService.resetStop();

        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        org.springframework.jdbc.core.JdbcTemplate migrationTemplate = (sqlIp != null && !sqlIp.trim().isEmpty())
                ? dynamicMigrationDbService.getDynamicTemplate(sqlIp, sqlUsername, sqlPassword, secondaryDbName)
                : null; // Fallback handled in service

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EMPLOYEE & 12 SUB-TABLES")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            StringBuilder sb = new StringBuilder();
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeeMaster(migrationTemplate), "Employee Master")).append("\n");
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeeActivities(migrationTemplate), "Employee Activities"))
                    .append("\n");
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeeAssets(migrationTemplate), "Employee Assets")).append("\n");
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeeContacts(migrationTemplate), "Employee Contacts"))
                    .append("\n");
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeePersonalDetails(migrationTemplate),
                    "Employee Personal Details")).append("\n");
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeePassports(migrationTemplate), "Employee Passports"))
                    .append("\n");
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeeKycDocuments(migrationTemplate), "Employee KYC"))
                    .append("\n");
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeeJobProfiles(migrationTemplate), "Employee Job Profiles"))
                    .append("\n");
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeeEmergencyContacts(migrationTemplate),
                    "Employee Emergency Contacts")).append("\n");
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeeEducation(migrationTemplate), "Employee Education"))
                    .append("\n");
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeeExperience(migrationTemplate), "Employee Experience"))
                    .append("\n");
            sb.append(safeMigrate(() -> hrmsMigrationService.migrateEmployeeDependents(migrationTemplate), "Employee Dependents"))
                    .append("\n");
            sb.append(
                    safeMigrate(() -> hrmsMigrationService.migrateEmployeeManagerMapping(migrationTemplate), "Employee Manager Mapping"))
                    .append("\n");

            String result = sb.toString();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(1); // Aggregate (changed from 0 to log success)
            auditLog.setMessage("Migrated multiple employee tables successfully");
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(response);
        }
    }

    // ─── POST /api/admin/migration/employee-manager-mapping ───────────────────
    @PostMapping("/employee-manager-mapping")
    public ResponseEntity<Map<String, String>> migrateEmployeeManagerMapping() {
        MasterChecklistMigrationService.resetStop();

        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EMPLOYEE_MANAGER_MAPPING")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateEmployeeManagerMapping(null);
            response.put("message", result);

            int migratedCount = 0;
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("Total Employees Migrated: (\\d+)");
            java.util.regex.Matcher matcher = pattern.matcher(result);
            if (matcher.find()) {
                migratedCount = Integer.parseInt(matcher.group(1));
            }

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(migratedCount);
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(response);
        }
    }

    // ─── DELETE /api/admin/migration/clear/employee-manager-mapping ───────────
    @DeleteMapping("/clear/employee-manager-mapping")
    public ResponseEntity<Map<String, String>> clearEmployeeManagerMapping() {
        Map<String, String> response = new HashMap<>();
        try {
            String result = hrmsMigrationService.clearEmployeeManagerMapping();
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Failed to clear mapping records: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ─── HELPER FOR EMPLOYEE MIGRATIONS ───────────────────────────────────────
    private String safeMigrate(java.util.function.Supplier<String> migrationTask, String name) {
        try {
            return migrationTask.get();
        } catch (org.springframework.dao.DataAccessException e) {
            e.printStackTrace();
            return "⚠ " + name + " migration failed: " + e.getMessage();
        } catch (Exception e) {
            return "❌ " + name + " migration failed: " + e.getMessage();
        }
    }

    // ─── DELETE /api/admin/migration/clear/employee-master-all ────────────────
    @DeleteMapping("/clear/employee-master-all")
    public ResponseEntity<Map<String, String>> clearEmployeeMasterAll() {
        Map<String, String> response = new HashMap<>();
        try {
            hrmsMigrationService.clearEmployeeMasterAll();
            response.put("message", "Successfully cleared Employee Master and all 13 sub-tables.");
        } catch (Exception e) {
            response.put("message", "Error clearing data: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    // ─── HELPER FOR NPD MIGRATIONS ─────────────────────────────────────────────
    private ResponseEntity<Map<String, String>> executeNpdMigration(String tableName,
            java.util.function.Supplier<String> migrationAction) {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        long startTime = System.currentTimeMillis();
        try {
            String result = migrationAction.get();
            int count = extractCount(result);

            if (count == 0) {
                // Don't save to audit log — just return a warning
                response.put("message", "⚠ " + tableName + " not migrated — 0 records found or all already exist.");
                response.put("status", "WARNING");
                return ResponseEntity.ok(response);
            }

            response.put("message", result);

            MigrationAuditLog auditLog = MigrationAuditLog.builder()
                    .tableName(tableName)
                    .migratedBy(currentUser)
                    .migratedAt(new Date())
                    .build();
            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(count);
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Migration failed: " + e.getMessage();
            response.put("message", errorMsg);
            response.put("status", "FAILED");

            MigrationAuditLog auditLog = MigrationAuditLog.builder()
                    .tableName(tableName)
                    .migratedBy(currentUser)
                    .migratedAt(new Date())
                    .build();
            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ─── NPD MIGRATION ENDPOINTS ───────────────────────────────────────────────

    @PostMapping("/npd/item-groups")
    public ResponseEntity<Map<String, String>> migrateProductItemGroups(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_ITEM_GROUP",
                () -> npdMigrationService.migrateProductItemGroups(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/item-types")
    public ResponseEntity<Map<String, String>> migrateProductItemTypes(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_ITEM_TYPE",
                () -> npdMigrationService.migrateProductItemTypes(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/item-subtypes")
    public ResponseEntity<Map<String, String>> migrateProductItemSubtypes(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_ITEM_SUBTYPE",
                () -> npdMigrationService.migrateProductItemSubtypes(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/oems")
    public ResponseEntity<Map<String, String>> migrateProductOems(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_OEM",
                () -> npdMigrationService.migrateProductOems(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/oem-mappings")
    public ResponseEntity<Map<String, String>> migrateProductOemMappings(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_OEM_MAPPING",
                () -> npdMigrationService.migrateProductOemMappings(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/models")
    public ResponseEntity<Map<String, String>> migrateProductModels(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_MODEL",
                () -> npdMigrationService.migrateProductModels(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/capacities")
    public ResponseEntity<Map<String, String>> migrateProductCapacities(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_CAPACITY",
                () -> npdMigrationService.migrateProductCapacities(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/bom-master")
    public ResponseEntity<Map<String, String>> migrateProductBoms(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_BOM_MASTER",
                () -> npdMigrationService.migrateProductBoms(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/processes")
    public ResponseEntity<Map<String, String>> migrateProductProcesses(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_PROCESS",
                () -> npdMigrationService.migrateProductProcesses(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/wind-farms")
    public ResponseEntity<Map<String, String>> migrateProductWindFarms(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_WIND_FARM",
                () -> npdMigrationService.migrateProductWindFarms(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/uoms")
    public ResponseEntity<Map<String, String>> migrateMstUoms(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("MST_UOM",
                () -> npdMigrationService.migrateMstUoms(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/material-types")
    public ResponseEntity<Map<String, String>> migrateMaterialTypes(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_MATERIAL_TYPE",
                () -> npdMigrationService.migrateMaterialTypes(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/material-grades")
    public ResponseEntity<Map<String, String>> migrateMaterialGrades(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_MATERIAL_GRADE",
                () -> npdMigrationService.migrateMaterialGrades(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/shapes")
    public ResponseEntity<Map<String, String>> migrateShapes(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_SHAPE_MASTER",
                () -> npdMigrationService.migrateShapes(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/npd/material-conditions")
    public ResponseEntity<Map<String, String>> migrateMaterialConditions(
            @RequestParam(value = "sqlIp", required = false) String sqlIp,
            @RequestParam(value = "sqlUsername", required = false) String sqlUsername,
            @RequestParam(value = "sqlPassword", required = false) String sqlPassword,
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return executeNpdMigration("NPD_MATERIAL_CONDITION",
                () -> npdMigrationService.migrateMaterialConditions(sqlIp, sqlUsername, sqlPassword, secondaryDbName));
    }

    @PostMapping("/order/visitor-gate-pass")
    public ResponseEntity<Map<String, String>> migrateVisitorGatePass() {
        return executeNpdMigration("VISITOR_GATE_PASS", () -> orderMigrationService.migrateVisitorGatePass());
    }

    // ─── PAYROLL MIGRATION ENDPOINTS ───────────────────────────────────────────

    @PostMapping("/payroll/holidays")
    public ResponseEntity<Map<String, String>> migrateHolidays() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateHolidays();
            int count = extractCount(result);

            if (count == 0) {
                response.put("message", "⚠ HR_HOLIDAY_MASTER not migrated — 0 records found or all already exist.");
                response.put("status", "WARNING");
                return ResponseEntity.ok(response);
            }

            response.put("message", result);

            MigrationAuditLog auditLog = MigrationAuditLog.builder()
                    .tableName("HR_HOLIDAY_MASTER")
                    .migratedBy(currentUser)
                    .migratedAt(new Date())
                    .build();
            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(count);
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Migration failed: " + e.getMessage();
            response.put("message", errorMsg);
            response.put("status", "FAILED");

            MigrationAuditLog auditLog = MigrationAuditLog.builder()
                    .tableName("HR_HOLIDAY_MASTER")
                    .migratedBy(currentUser)
                    .migratedAt(new Date())
                    .build();
            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping(value = "/payroll/holidays/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadHolidays(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MasterChecklistMigrationService.resetStop();
        Map<String, Object> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EXCEL -> HR_HOLIDAY_MASTER")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> result = hrmsMigrationService.migrateHolidaysFromExcel(file);
            response.putAll(result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount((String) result.get("message")));
            auditLog.setMessage((String) result.get("message"));
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Holiday Excel migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/payroll/holidays/sample")
    public ResponseEntity<byte[]> getHolidaysSampleExcel() {
        try {
            byte[] fileContent = hrmsMigrationService.generateHolidaySampleExcel();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "Holiday_Sample.xlsx");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/payroll/holidays")
    public ResponseEntity<Map<String, String>> clearHolidays() {
        Map<String, String> response = new HashMap<>();
        try {
            String result = hrmsMigrationService.clearHolidays();
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Clear failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/payroll/loans")
    public ResponseEntity<Map<String, String>> migrateLoans() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateLoans();
            response.put("message", result);
            response.put("status", "SUCCESS");

            MigrationAuditLog auditLog = MigrationAuditLog.builder()
                    .tableName("HR_LOAN_MASTER")
                    .migratedBy(currentUser)
                    .migratedAt(new Date())
                    .build();
            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Migration failed: " + e.getMessage();
            response.put("message", errorMsg);
            response.put("status", "FAILED");

            MigrationAuditLog auditLog = MigrationAuditLog.builder()
                    .tableName("HR_LOAN_MASTER")
                    .migratedBy(currentUser)
                    .migratedAt(new Date())
                    .build();
            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/payroll/loans")
    public ResponseEntity<Map<String, String>> clearLoans() {
        Map<String, String> response = new HashMap<>();
        try {
            String result = hrmsMigrationService.clearLoans();
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Clear failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping(value = "/payroll/loans/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadLoans(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MasterChecklistMigrationService.resetStop();
        Map<String, Object> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EXCEL -> HR_LOAN_MASTER")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> result = hrmsMigrationService.migrateLoansFromExcel(file);
            response.putAll(result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount((String) result.get("message")));
            auditLog.setMessage((String) result.get("message"));
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Loan Excel migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/payroll/loans/sample")
    public ResponseEntity<byte[]> getLoansSampleExcel() {
        try {
            byte[] fileContent = hrmsMigrationService.generateLoanSampleExcel();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "Loan_Sample.xlsx");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(value = "/payroll/shifts/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadShifts(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MasterChecklistMigrationService.resetStop();
        Map<String, Object> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EXCEL -> HR_SHIFT_MASTER")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> result = hrmsMigrationService.migrateShiftsFromExcel(file);
            response.putAll(result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount((String) result.get("message")));
            auditLog.setMessage((String) result.get("message"));
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Shift Excel migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/payroll/shifts/sample")
    public ResponseEntity<byte[]> getShiftsSampleExcel() {
        try {
            byte[] fileContent = hrmsMigrationService.generateShiftSampleExcel();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "Shift_Sample.xlsx");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(value = "/payroll/months/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadMonths(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MasterChecklistMigrationService.resetStop();
        Map<String, Object> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EXCEL -> HR_MONTH_MASTER")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> result = hrmsMigrationService.migrateMonthsFromExcel(file);
            response.putAll(result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount((String) result.get("message")));
            auditLog.setMessage((String) result.get("message"));
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Month Excel migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/payroll/months/sample")
    public ResponseEntity<byte[]> getMonthsSampleExcel() {
        try {
            byte[] fileContent = hrmsMigrationService.generateMonthSampleExcel();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "Month_Sample.xlsx");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(value = "/payroll/petrol-allowances/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadPetrolAllowances(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MasterChecklistMigrationService.resetStop();
        Map<String, Object> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EXCEL -> HR_PETROL_ALLOWANCE_MASTER")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> result = hrmsMigrationService.migratePetrolAllowancesFromExcel(file);
            response.putAll(result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount((String) result.get("message")));
            auditLog.setMessage((String) result.get("message"));
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Petrol Allowance Excel migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/payroll/petrol-allowances/sample")
    public ResponseEntity<byte[]> getPetrolAllowancesSampleExcel() {
        try {
            byte[] fileContent = hrmsMigrationService.generatePetrolAllowanceSampleExcel();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "PetrolAllowance_Sample.xlsx");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(value = "/payroll/permissions/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadPermissions(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        MasterChecklistMigrationService.resetStop();
        Map<String, Object> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("EXCEL -> HR_PERMISSION_DETAILS")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            Map<String, Object> result = hrmsMigrationService.migratePermissionsFromExcel(file);
            response.putAll(result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount((String) result.get("message")));
            auditLog.setMessage((String) result.get("message"));
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Permission Excel migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/payroll/permissions/sample")
    public ResponseEntity<byte[]> getPermissionsSampleExcel() {
        try {
            byte[] fileContent = hrmsMigrationService.generatePermissionSampleExcel();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "Permission_Sample.xlsx");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─── DELETE /api/admin/migration/clear-transaction ──────────────────────────
    @DeleteMapping("/clear-transaction")
    public ResponseEntity<Map<String, String>> clearTransactionData() {
        Map<String, String> response = new HashMap<>();
        try {
            databaseCleanupService.clearTransactionData();
            response.put("status", "SUCCESS");
            response.put("message", "Database transaction data wiped successfully (protected tables/users retained).");

            // Log this major event
            MigrationAuditLog log = new MigrationAuditLog();
            log.setTableName("ALL_TRANSACTIONS");
            log.setRecordsCount(0);
            log.setMessage("Wiped all transactional data successfully.");
            log.setStatus("SUCCESS");
            log.setMigratedBy(resolveCurrentUser());
            log.setMigratedAt(new Date());
            if (log != null && log.getRecordsCount() != null && log.getRecordsCount() > 0) {
                auditLogRepository.save(log);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "ERROR");
            return ResponseEntity.status(500).body(response);
        }
    }

    // ─── DELETE /api/admin/migration/user-credentials ───────────────────────
    @DeleteMapping("/user-credentials")
    public ResponseEntity<Map<String, String>> clearUserCredentials() {
        Map<String, String> response = new HashMap<>();
        try {
            String result = hrmsMigrationService.clearUserCredentials();
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Clear failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/npd/item-types/sample")
    public ResponseEntity<byte[]> downloadProductItemTypeSample() {
        try {
            byte[] data = npdMigrationService.generateProductItemTypeSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ProductItemTypeMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/item-types/upload")
    public ResponseEntity<Map<String, Object>> uploadProductItemTypeExcel(@RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateProductItemTypeFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("ProductItemType_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("ProductItemType_EXCEL", 0, duration, "FAILED", "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/item-subtypes/sample")
    public ResponseEntity<byte[]> downloadProductItemSubtypeSample() {
        try {
            byte[] data = npdMigrationService.generateProductItemSubtypeSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=ProductItemSubtypeMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/item-subtypes/upload")
    public ResponseEntity<Map<String, Object>> uploadProductItemSubtypeExcel(@RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateProductItemSubtypeFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("ProductItemSubtype_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("ProductItemSubtype_EXCEL", 0, duration, "FAILED",
                    "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/oems/sample")
    public ResponseEntity<byte[]> downloadProductOemMasterSample() {
        try {
            byte[] data = npdMigrationService.generateProductOemMasterSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=ProductOemMasterMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/oems/upload")
    public ResponseEntity<Map<String, Object>> uploadProductOemMasterExcel(@RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateProductOemMasterFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("ProductOemMaster_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("ProductOemMaster_EXCEL", 0, duration, "FAILED", "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/oem-mappings/sample")
    public ResponseEntity<byte[]> downloadProductOemMappingSample() {
        try {
            byte[] data = npdMigrationService.generateProductOemMappingSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=ProductOemMappingMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/oem-mappings/upload")
    public ResponseEntity<Map<String, Object>> uploadProductOemMappingExcel(@RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateProductOemMappingFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("ProductOemMapping_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("ProductOemMapping_EXCEL", 0, duration, "FAILED", "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/models/sample")
    public ResponseEntity<byte[]> downloadProductModelMasterSample() {
        try {
            byte[] data = npdMigrationService.generateProductModelMasterSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=ProductModelMasterMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/models/upload")
    public ResponseEntity<Map<String, Object>> uploadProductModelMasterExcel(@RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateProductModelMasterFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("ProductModelMaster_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("ProductModelMaster_EXCEL", 0, duration, "FAILED",
                    "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/capacities/sample")
    public ResponseEntity<byte[]> downloadProductCapacityMasterSample() {
        try {
            byte[] data = npdMigrationService.generateProductCapacityMasterSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=ProductCapacityMasterMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/capacities/upload")
    public ResponseEntity<Map<String, Object>> uploadProductCapacityMasterExcel(
            @RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateProductCapacityMasterFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("ProductCapacityMaster_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("ProductCapacityMaster_EXCEL", 0, duration, "FAILED",
                    "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/processes/sample")
    public ResponseEntity<byte[]> downloadProductProcessMasterSample() {
        try {
            byte[] data = npdMigrationService.generateProductProcessMasterSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=ProductProcessMasterMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/processes/upload")
    public ResponseEntity<Map<String, Object>> uploadProductProcessMasterExcel(
            @RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateProductProcessMasterFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("ProductProcessMaster_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("ProductProcessMaster_EXCEL", 0, duration, "FAILED",
                    "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/wind-farms/sample")
    public ResponseEntity<byte[]> downloadWindFarmMasterSample() {
        try {
            byte[] data = npdMigrationService.generateWindFarmMasterSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=WindFarmMasterMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/wind-farms/upload")
    public ResponseEntity<Map<String, Object>> uploadWindFarmMasterExcel(@RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateWindFarmMasterFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("WindFarmMaster_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("WindFarmMaster_EXCEL", 0, duration, "FAILED", "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/uoms/sample")
    public ResponseEntity<byte[]> downloadUomSample() {
        try {
            byte[] data = npdMigrationService.generateUomSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=UomMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/uoms/upload")
    public ResponseEntity<Map<String, Object>> uploadUomExcel(@RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateUomFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("Uom_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("Uom_EXCEL", 0, duration, "FAILED", "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/interview-criteria")
    public ResponseEntity<Map<String, String>> migrateInterviewCriteria() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("INTERVIEW_CRITERIA_MASTER -> HR_INTERVIEW")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateInterviewCriteria();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Interview Criteria migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/interview-criteria")
    public ResponseEntity<Map<String, String>> clearInterviewCriteria() {
        Map<String, String> response = new HashMap<>();
        try {
            String result = hrmsMigrationService.clearInterviewCriteria();
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Interview Criteria clear failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/induction-criteria")
    public ResponseEntity<Map<String, String>> migrateInductionCriteria() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("INDUCTION_CRITERIA_MASTER -> HR_INDUCTION")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateInductionCriteria();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Induction Criteria migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/induction-criteria")
    public ResponseEntity<Map<String, String>> clearInductionCriteria() {
        Map<String, String> response = new HashMap<>();
        try {
            String result = hrmsMigrationService.clearInductionCriteria();
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Induction Criteria clear failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/applicant-verification-criteria")
    public ResponseEntity<Map<String, String>> migrateApplicantVerificationCriteria() {
        MasterChecklistMigrationService.resetStop();
        Map<String, String> response = new HashMap<>();
        String currentUser = resolveCurrentUser();

        MigrationAuditLog auditLog = MigrationAuditLog.builder()
                .tableName("HRMS_APPLICANT_VERIFICATION_CRITERIA -> HR_VERIFICATION_CRITERIA")
                .migratedBy(currentUser)
                .migratedAt(new Date())
                .build();

        long startTime = System.currentTimeMillis();
        try {
            String result = hrmsMigrationService.migrateApplicantVerificationCriteria();
            response.put("message", result);

            auditLog.setStatus("SUCCESS");
            auditLog.setRecordsCount(extractCount(result));
            auditLog.setMessage(result);
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMsg = "Applicant Verification Criteria migration failed: " + e.getMessage();
            response.put("message", errorMsg);

            auditLog.setStatus("FAILED");
            auditLog.setRecordsCount(0);
            auditLog.setMessage(e.getMessage());
            auditLog.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            if (auditLog != null && auditLog.getRecordsCount() != null && auditLog.getRecordsCount() > 0) {
                auditLogRepository.save(auditLog);
            }

            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/applicant-verification-criteria")
    public ResponseEntity<Map<String, String>> clearApplicantVerificationCriteria() {
        Map<String, String> response = new HashMap<>();
        try {
            String result = hrmsMigrationService.clearApplicantVerificationCriteria();
            response.put("message", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("message", "Applicant Verification Criteria clear failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/npd/products/sample")
    public ResponseEntity<byte[]> downloadProductMasterSample() {
        try {
            byte[] data = npdMigrationService.generateProductMasterSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ProductMasterMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/products/upload")
    public ResponseEntity<Map<String, Object>> uploadProductMasterExcel(@RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateProductMasterFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("ProductMaster_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("ProductMaster_EXCEL", 0, duration, "FAILED", "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/inventory-types/sample")
    public ResponseEntity<byte[]> downloadInventoryTypeSample() {
        try {
            byte[] data = npdMigrationService.generateInventoryTypeSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=InventoryTypeMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/inventory-types/upload")
    public ResponseEntity<Map<String, Object>> uploadInventoryTypeExcel(@RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateInventoryTypeFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("InventoryType_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("InventoryType_EXCEL", 0, duration, "FAILED", "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/item-groups/sample")
    public ResponseEntity<byte[]> downloadProductItemGroupSample() {
        try {
            byte[] data = npdMigrationService.generateProductItemGroupSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=ProductItemGroupMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/item-groups/upload")
    public ResponseEntity<Map<String, Object>> uploadProductItemGroupExcel(@RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateProductItemGroupFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("ProductItemGroup_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("ProductItemGroup_EXCEL", 0, duration, "FAILED", "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/ipps/sample")
    public ResponseEntity<byte[]> downloadProductIppSample() {
        try {
            byte[] data = npdMigrationService.generateProductIppSampleExcel();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ProductIppMigrationSample.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/npd/ipps/upload")
    public ResponseEntity<Map<String, Object>> uploadProductIppExcel(@RequestParam("file") MultipartFile file) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> result = npdMigrationService.migrateProductIppFromExcel(file);
            long duration = System.currentTimeMillis() - startTime;

            int migratedCount = (int) result.getOrDefault("migratedCount", 0);
            int failedCount = (int) result.getOrDefault("failedCount", 0);
            String message = (String) result.get("message");

            String logMessage = "Excel Migration: " + message;
            if (failedCount > 0) {
                logMessage += " (" + failedCount + " failed)";
            }

            logMigration("ProductIpp_EXCEL", migratedCount, duration, "SUCCESS", logMessage);

            response.put("status", "SUCCESS");
            response.put("message", message);
            response.put("details", result.get("details"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logMigration("ProductIpp_EXCEL", 0, duration, "FAILED", "Excel Migration failed: " + e.getMessage());
            response.put("status", "FAILED");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/npd/material-types/sample")
    public org.springframework.http.ResponseEntity<byte[]> downloadMaterialTypeSample() {
        byte[] excelBytes = npdMigrationService.generateMaterialTypeSampleExcel();
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=MaterialType_Sample.xlsx")
                .contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    @PostMapping("/npd/material-types/upload")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> uploadMaterialType(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = npdMigrationService.migrateMaterialTypeFromExcel(file);
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @GetMapping("/npd/material-grades/sample")
    public org.springframework.http.ResponseEntity<byte[]> downloadMaterialGradeSample() {
        byte[] excelBytes = npdMigrationService.generateMaterialGradeSampleExcel();
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=MaterialGrade_Sample.xlsx")
                .contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    @PostMapping("/npd/material-grades/upload")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> uploadMaterialGrade(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = npdMigrationService.migrateMaterialGradeFromExcel(file);
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @GetMapping("/npd/shapes/sample")
    public org.springframework.http.ResponseEntity<byte[]> downloadShapeSample() {
        byte[] excelBytes = npdMigrationService.generateShapeSampleExcel();
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=Shape_Sample.xlsx")
                .contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    @PostMapping("/npd/shapes/upload")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> uploadShape(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = npdMigrationService.migrateShapeFromExcel(file);
        return org.springframework.http.ResponseEntity.ok(response);
    }

    @GetMapping("/npd/material-conditions/sample")
    public org.springframework.http.ResponseEntity<byte[]> downloadMaterialConditionSample() {
        byte[] excelBytes = npdMigrationService.generateMaterialConditionSampleExcel();
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=MaterialCondition_Sample.xlsx")
                .contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    @PostMapping("/npd/material-conditions/upload")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> uploadMaterialCondition(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        java.util.Map<String, Object> response = npdMigrationService.migrateMaterialConditionFromExcel(file);
        return org.springframework.http.ResponseEntity.ok(response);
    }

}

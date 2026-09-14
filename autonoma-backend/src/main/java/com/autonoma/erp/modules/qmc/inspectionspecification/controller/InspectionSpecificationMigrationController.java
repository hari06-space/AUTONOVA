package com.autonoma.erp.modules.qmc.inspectionspecification.controller;

import com.autonoma.erp.modules.qmc.inspectionspecification.service.InspectionSpecificationMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/migration/quality")
@RequiredArgsConstructor
public class InspectionSpecificationMigrationController {

    private final InspectionSpecificationMigrationService migrationService;
    private final com.autonoma.erp.repository.admin.MigrationAuditLogRepository auditLogRepository;

    @PostMapping("/inspection-specification")
    public ResponseEntity<Map<String, Object>> migrateInspectionSpecifications(
            @RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        long startTime = System.currentTimeMillis();
        try {
            String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            if (currentUser == null || currentUser.trim().isEmpty()) {
                currentUser = "SUPER BOSS";
            }
            
            String result = migrationService.migrateQualityPlan(secondaryDbName);
            
            int count = 0;
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("Successfully migrated (\\d+)").matcher(result);
            if (matcher.find()) {
                count = Integer.parseInt(matcher.group(1));
            }
            
            com.autonoma.erp.model.admin.MigrationAuditLog auditLog = com.autonoma.erp.model.admin.MigrationAuditLog.builder()
                    .tableName("quality_plan -> QMC_INSPECTION_SPECIFICATION")
                    .migratedBy(currentUser)
                    .migratedAt(new java.util.Date())
                    .status("SUCCESS")
                    .recordsCount(count)
                    .message(result)
                    .executionTimeMs(System.currentTimeMillis() - startTime)
                    .build();
            
            auditLogRepository.save(auditLog);
            
            return ResponseEntity.ok(Collections.singletonMap("message", result));
        } catch (Exception e) {
            com.autonoma.erp.model.admin.MigrationAuditLog auditLog = com.autonoma.erp.model.admin.MigrationAuditLog.builder()
                    .tableName("quality_plan -> QMC_INSPECTION_SPECIFICATION")
                    .migratedBy("SUPER BOSS")
                    .migratedAt(new java.util.Date())
                    .status("FAILED")
                    .recordsCount(0)
                    .message(e.getMessage())
                    .executionTimeMs(System.currentTimeMillis() - startTime)
                    .build();
            auditLogRepository.save(auditLog);
            
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Migration Failed: " + e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.GetMapping("/api/auth/debug-schema")
    public ResponseEntity<?> debugSchema(@RequestParam(value = "secondaryDbName", required = false) String secondaryDbName) {
        return ResponseEntity.ok(migrationService.debugSchema(secondaryDbName));
    }
}

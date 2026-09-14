package com.autonoma.erp.controller.admin;

import com.autonoma.erp.service.admin.AuditTrailService;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.model.admin.AuditTrail;
import com.autonoma.erp.repository.admin.AuditTrailRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductBundleDetailRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/audit-trail")
@CrossOrigin(origins = "*")
public class AuditTrailController {

    @Autowired
    private AuditTrailRepository auditTrailRepository;

    @Autowired
    private ProductBundleDetailRepository bundleDetailRepository;

    @Autowired
    private AuditTrailService auditTrailService;

    @GetMapping
    public List<AuditTrail> getAllLogs() {
        return auditTrailRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{tableName}/{recordId}")
    public List<AuditTrail> getLogsForRecord(@PathVariable String tableName, @PathVariable String recordId) {
        return auditTrailRepository.findByTableNameAndRecordIdOrderByCreatedAtDesc(tableName, recordId);
    }

    /**
     * Returns ALL audit logs for a Product Bundle — combining:
     * 1. ProductBundleMaster changes (record_id = bundleId)
     * 2. ProductBundleDetail changes logged by our service (record_id = bundleId)
     * 3. ProductBundleDetail changes logged by GlobalAuditInterceptor (record_id = detail row ID)
     */
    @GetMapping("/bundle/{bundleId}")
    public List<AuditTrail> getLogsForBundle(@PathVariable Long bundleId) {
        // Collect all record IDs: the bundle master ID + all detail row IDs
        List<String> recordIds = new ArrayList<>();
        recordIds.add(bundleId.toString());

        // Include all detail row IDs so interceptor-generated entries are captured too
        List<Long> detailIds = bundleDetailRepository.findIdsByBundleMasterId(bundleId);
        detailIds.forEach(did -> recordIds.add(did.toString()));

        List<String> tableNames = Arrays.asList("ProductBundleMaster", "ProductBundleDetail");

        List<AuditTrail> logs = new ArrayList<>(
            auditTrailRepository.findByTableNameInAndRecordIdInOrderByCreatedAtDesc(tableNames, recordIds)
        );

        // Sort by created date descending
        logs.sort(Comparator.comparing(
            a -> a.getCreatedAt() != null ? a.getCreatedAt() : new java.util.Date(0),
            Comparator.reverseOrder()
        ));

        return logs;
    }

    @PostMapping("/log")
    @RequirePagePermission(pageCode = "AD1150", action = "write")
    public org.springframework.http.ResponseEntity<?> logAction(@RequestBody java.util.Map<String, Object> payload) {
        try {
            String userId = (String) payload.get("userId");
            String pageName = (String) payload.get("pageName");
            String actionType = (String) payload.get("actionType");
            String tableName = (String) payload.get("tableName");
            String recordId = (String) payload.get("recordId");
            String prevVal = (String) payload.get("previousValue");
            String currVal = (String) payload.get("currentValue");
            String comments = (String) payload.get("comments");

            auditTrailService.saveAuditTrailAsync(actionType, tableName, recordId, prevVal, currVal, comments, userId, pageName);
            return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "Logged successfully"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/restore/{id}")
    @RequirePagePermission(pageCode = "AD1150", action = "write")
    public org.springframework.http.ResponseEntity<?> restoreRecord(@PathVariable Long id) {
        try {
            auditTrailService.restoreRecord(id);
            return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "Record restored successfully"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}

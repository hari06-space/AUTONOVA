package com.autonoma.erp.controller.admin;

import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistManualTriggerService;
import com.autonoma.erp.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for the Admin → BOS → Process Automation → Trigger page.
 * Provides endpoints to manually invoke checklist generation and retrieve trigger logs.
 */
@RestController
@RequestMapping("/api/admin/checklist-manual-trigger")
@Tag(name = "Admin – Checklist Manual Trigger", description = "Manually invoke the 4 AM checklist generation job and view execution logs.")
public class ChecklistManualTriggerController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChecklistManualTriggerController.class);

    private final ChecklistManualTriggerService manualTriggerService;

    @org.springframework.beans.factory.annotation.Autowired
    public ChecklistManualTriggerController(ChecklistManualTriggerService manualTriggerService) {
        this.manualTriggerService = manualTriggerService;
    }

    /**
     * POST /api/admin/checklist-manual-trigger/trigger
     * <p>
     * Manually executes the same checklist generation logic as the 4 AM scheduler.
     * Requires write permission on page AD1290.
     */
    @PostMapping("/trigger")
    @RequirePagePermission(pageCode = "AD1290", action = "write")
    @Operation(
        summary = "Manually trigger checklist generation",
        description = "Executes the same business logic as the daily 4 AM scheduler. " +
                      "Generates all pending checklist executions without creating duplicates. " +
                      "An audit log entry is saved on every invocation."
    )
    public ResponseEntity<Map<String, Object>> triggerChecklist() {
        String triggeredBy = SecurityUtils.getCurrentUserId();
        if (triggeredBy == null || triggeredBy.isBlank()) {
            triggeredBy = "Unknown";
        }
        log.info("[ManualTrigger] Endpoint hit by user: {}", triggeredBy);
        Map<String, Object> result = manualTriggerService.triggerManually(triggeredBy);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/admin/checklist-manual-trigger/logs
     * <p>
     * Returns the 50 most recent manual trigger execution logs.
     * Requires read permission on page AD1290.
     */
    @GetMapping("/logs")
    @RequirePagePermission(pageCode = "AD1290", action = "read")
    @Operation(
        summary = "Get trigger execution logs",
        description = "Returns up to 50 most recent manual trigger log entries, ordered newest first."
    )
    public ResponseEntity<List<Map<String, Object>>> getLogs() {
        return ResponseEntity.ok(manualTriggerService.getLogs());
    }
}

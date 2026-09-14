package com.autonoma.erp.controller.admin;

import com.autonoma.erp.model.admin.BosSchedulerConfig;
import com.autonoma.erp.model.admin.BosSchedulerAuditLog;
import com.autonoma.erp.model.admin.BosSchedulerExecutionLog;
import com.autonoma.erp.repository.admin.BosSchedulerConfigRepository;
import com.autonoma.erp.repository.admin.BosSchedulerAuditLogRepository;
import com.autonoma.erp.repository.admin.BosSchedulerExecutionLogRepository;
import com.autonoma.erp.service.admin.MetadataDiscoveryService;
import com.autonoma.erp.service.admin.DynamicQueryBuilderService;
import com.autonoma.erp.service.admin.AutomationSchedulerEngine;
import com.autonoma.erp.service.admin.AutomationJobExecutor;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/automation-configs")
@CrossOrigin(origins = "*")
@Tag(name = "Automation Designer Config API", description = "Endpoints for managing dynamic workflows and scheduler details")
public class BosSchedulerConfigController {

    @Autowired
    private BosSchedulerConfigRepository repository;

    @Autowired
    private BosSchedulerAuditLogRepository auditRepository;

    @Autowired
    private BosSchedulerExecutionLogRepository executionRepository;

    @Autowired
    private MetadataDiscoveryService metadataService;

    @Autowired
    private DynamicQueryBuilderService queryBuilderService;

    @Autowired
    private AutomationSchedulerEngine schedulerEngine;

    @Autowired
    private Scheduler quartzScheduler;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    @Operation(summary = "Get all configurations")
    public List<BosSchedulerConfig> getAllConfigs() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get configuration details")
    public ResponseEntity<BosSchedulerConfig> getConfigDetails(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/metadata")
    @Operation(summary = "Get dynamically discovered metadata objects")
    public ResponseEntity<List<Map<String, Object>>> getDiscoveryMetadata() {
        return ResponseEntity.ok(metadataService.getDiscoverableEntities());
    }

    @PostMapping("/preview-data")
    @Operation(summary = "Preview dataset based on dynamic builder specifications")
    public ResponseEntity<List<Map<String, Object>>> previewData(@RequestBody Map<String, String> payload) {
        String entityName = payload.get("entityName");
        String selectedFields = payload.get("selectedFields");
        String filterJson = payload.get("filterJson");

        List<Map<String, Object>> rows = queryBuilderService.executeQuery(entityName, selectedFields, filterJson);
        // Return top 15 rows for UI layout preview
        int limit = Math.min(rows.size(), 15);
        return ResponseEntity.ok(rows.subList(0, limit));
    }

    @PostMapping
    @RequirePagePermission(pageCode = "AD1270", action = "write")
    @Operation(summary = "Save or update a configuration")
    public ResponseEntity<BosSchedulerConfig> saveConfig(@RequestBody BosSchedulerConfig config) {
        String username = "SUPER BOSS";
        try {
            username = SecurityUtils.getCurrentUserEmployeeName();
        } catch (Exception e) {
        }

        // Parse and extract triggerType from schedulerJson if not present
        if ((config.getTriggerType() == null || config.getTriggerType().trim().isEmpty())
                && config.getSchedulerJson() != null) {
            try {
                Map<String, Object> sched = objectMapper.readValue(config.getSchedulerJson(),
                        new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {
                        });
                if (sched.containsKey("triggerType") && sched.get("triggerType") != null) {
                    config.setTriggerType((String) sched.get("triggerType"));
                }
            } catch (Exception e) {
                config.setTriggerType("DAILY");
            }
        }
        if (config.getTriggerType() == null || config.getTriggerType().trim().isEmpty()) {
            config.setTriggerType("DAILY");
        }

        BosSchedulerConfig saved;
        String prevJson = null;

        if (config.getRowId() != null) {
            Optional<BosSchedulerConfig> existingOpt = repository.findById(config.getRowId());
            if (existingOpt.isPresent()) {
                BosSchedulerConfig existing = existingOpt.get();
                try {
                    prevJson = objectMapper.writeValueAsString(existing);
                } catch (Exception ex) {
                }

                existing.setConfigName(config.getConfigName());
                existing.setDescription(config.getDescription());
                existing.setCategory(config.getCategory());
                existing.setTriggerType(config.getTriggerType());
                existing.setIsActive(config.getIsActive());
                existing.setSourceType(config.getSourceType());
                existing.setSourceName(config.getSourceName());
                existing.setSelectedFields(config.getSelectedFields());
                existing.setFilterJson(config.getFilterJson());
                existing.setRecipientJson(config.getRecipientJson());
                existing.setSchedulerJson(config.getSchedulerJson());
                existing.setOutputJson(config.getOutputJson());
                existing.setLayoutJson(config.getLayoutJson());
                existing.setUpdatedBy(username);

                saved = repository.save(existing);

                // Reschedule in Quartz
                schedulerEngine.scheduleJob(saved);

                // Write Audit Log
                writeAuditLog(saved.getRowId(), "UPDATE", username, prevJson, saved);
                return ResponseEntity.ok(saved);
            }
        }

        // Auto generate config code
        if (config.getConfigCode() == null || config.getConfigCode().trim().isEmpty()) {
            config.setConfigCode("AUTO-" + (System.currentTimeMillis() % 1000000));
        }
        config.setCreatedBy(username);
        saved = repository.save(config);

        // Schedule in Quartz
        schedulerEngine.scheduleJob(saved);

        // Write Audit Log
        writeAuditLog(saved.getRowId(), "CREATE", username, null, saved);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/toggle-active")
    @RequirePagePermission(pageCode = "AD1270", action = "write")
    @Operation(summary = "Toggle active state")
    public ResponseEntity<BosSchedulerConfig> toggleActive(@PathVariable Long id) {
        Optional<BosSchedulerConfig> configOpt = repository.findById(id);
        if (!configOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        BosSchedulerConfig config = configOpt.get();
        String username = "SUPER BOSS";
        try {
            username = SecurityUtils.getCurrentUserEmployeeName();
        } catch (Exception e) {
        }

        String prevJson = null;
        try {
            prevJson = objectMapper.writeValueAsString(config);
        } catch (Exception ex) {
        }

        config.setIsActive(!config.getIsActive());
        if (config.getIsActive()) {
            config.setActivatedUser(username);
            config.setActivatedDate(new Date());
        } else {
            config.setDeactivatedUser(username);
            config.setDeactivatedDate(new Date());
        }
        config.setUpdatedBy(username);

        BosSchedulerConfig saved = repository.save(config);

        // Sync with Quartz scheduler
        if (saved.getIsActive()) {
            schedulerEngine.scheduleJob(saved);
            writeAuditLog(saved.getRowId(), "ACTIVATE", username, prevJson, saved);
        } else {
            schedulerEngine.unscheduleJob(saved.getRowId());
            writeAuditLog(saved.getRowId(), "DEACTIVATE", username, prevJson, saved);
        }

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/clone")
    @RequirePagePermission(pageCode = "AD1270", action = "write")
    @Operation(summary = "Clone configuration")
    public ResponseEntity<BosSchedulerConfig> cloneConfig(@PathVariable Long id) {
        Optional<BosSchedulerConfig> sourceOpt = repository.findById(id);
        if (!sourceOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        BosSchedulerConfig source = sourceOpt.get();
        String username = "SUPER BOSS";
        try {
            username = SecurityUtils.getCurrentUserEmployeeName();
        } catch (Exception e) {
        }

        BosSchedulerConfig clone = new BosSchedulerConfig();
        clone.setConfigName(source.getConfigName() + " - Copy");
        clone.setConfigCode("AUTO-" + (System.currentTimeMillis() % 1000000));
        clone.setDescription(source.getDescription());
        clone.setCategory(source.getCategory());
        clone.setTriggerType(source.getTriggerType());
        clone.setIsActive(false);
        clone.setSourceType(source.getSourceType());
        clone.setSourceName(source.getSourceName());
        clone.setSelectedFields(source.getSelectedFields());
        clone.setFilterJson(source.getFilterJson());
        clone.setRecipientJson(source.getRecipientJson());
        clone.setSchedulerJson(source.getSchedulerJson());
        clone.setOutputJson(source.getOutputJson());
        clone.setLayoutJson(source.getLayoutJson());

        clone.setCreatedBy(username);
        BosSchedulerConfig saved = repository.save(clone);

        writeAuditLog(saved.getRowId(), "CLONE", username, null, saved);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/run-now")
    @RequirePagePermission(pageCode = "AD1270", action = "write")
    @Operation(summary = "Trigger instant execution run")
    public ResponseEntity<String> triggerRunNow(@PathVariable Long id) {
        try {
            if (quartzScheduler.isShutdown()) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Quartz scheduler is currently shut down.");
            }
            JobKey jobKey = new JobKey("autoJob_" + id, "BOS_AUTOMATION");
            if (quartzScheduler.checkExists(jobKey)) {
                quartzScheduler.triggerJob(jobKey);
                return ResponseEntity.ok("Manual execution triggered successfully in background Quartz threads.");
            } else {
                // If not scheduled, schedule temporarily and run once
                Optional<BosSchedulerConfig> configOpt = repository.findById(id);
                if (configOpt.isPresent()) {
                    JobDetail tempJob = JobBuilder.newJob(AutomationJobExecutor.class)
                            .withIdentity("tempAutoJob_" + id + "_" + System.currentTimeMillis(), "TEMP_EXEC")
                            .usingJobData("configId", id)
                            .build();
                    Trigger tempTrigger = TriggerBuilder.newTrigger()
                            .withIdentity("tempAutoTrigger_" + id + "_" + System.currentTimeMillis(), "TEMP_EXEC")
                            .startNow()
                            .build();
                    quartzScheduler.scheduleJob(tempJob, tempTrigger);
                    return ResponseEntity.ok("Manual execution bootstrapped and scheduled immediately.");
                }
                return ResponseEntity.badRequest().body("Configuration ID not found.");
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to trigger run: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/logs")
    @Operation(summary = "Get execution monitoring logs list")
    public List<BosSchedulerExecutionLog> getExecutionLogs(@PathVariable Long id) {
        return executionRepository.findByConfigIdOrderByTriggerTimeDesc(id);
    }

    @GetMapping("/{id}/audits")
    @Operation(summary = "Get configuration modification audit logs")
    public List<BosSchedulerAuditLog> getAuditLogs(@PathVariable Long id) {
        return auditRepository.findByConfigIdOrderByChangedDateDesc(id);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "AD1270", action = "delete")
    @Operation(summary = "Delete configuration")
    public ResponseEntity<Void> deleteConfig(@PathVariable Long id) {
        schedulerEngine.unscheduleJob(id);
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private void writeAuditLog(Long configId, String action, String user, String prevJson,
            BosSchedulerConfig nextConfig) {
        try {
            String newJson = objectMapper.writeValueAsString(nextConfig);
            BosSchedulerAuditLog audit = new BosSchedulerAuditLog();
            audit.setConfigId(configId);
            audit.setActionType(action);
            audit.setChangedBy(user);
            audit.setChangedDate(new Date());
            audit.setPreviousState(prevJson);
            audit.setNewState(newJson);
            audit.setComments(action + " event completed.");
            auditRepository.save(audit);
        } catch (Exception e) {
            // Log error silently
        }
    }
}

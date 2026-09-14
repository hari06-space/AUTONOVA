package com.autonoma.erp.modules.admin.schedule.controller;

import com.autonoma.erp.modules.admin.schedule.entity.ScheduleConfiguration;
import com.autonoma.erp.modules.admin.schedule.service.ScheduleConfigurationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.modules.admin.schedule.service.DynamicScheduleTriggerService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/schedule-config")
public class ScheduleConfigurationController {

    @Autowired
    private ScheduleConfigurationService service;

    @Autowired
    private DynamicScheduleTriggerService triggerService;

    @GetMapping
    public ResponseEntity<List<ScheduleConfiguration>> getAll() {
        List<ScheduleConfiguration> configs = service.getAllConfigs();
        for (ScheduleConfiguration c : configs) {
            c.setIsRunning(triggerService.isSchedulerRunning(c.getSchedularName()));
        }
        return ResponseEntity.ok(configs);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScheduleConfiguration> update(@PathVariable Long id, @RequestBody ScheduleConfiguration config) {
        ScheduleConfiguration updated = service.updateConfig(id, config);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        } else {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/trigger")
    public ResponseEntity<?> manualTrigger(
            @PathVariable Long id,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd") java.util.Date targetDate,
            @RequestParam(defaultValue = "true") boolean closePast) {
        java.util.Optional<ScheduleConfiguration> config = service.getAllConfigs().stream().filter(c -> c.getId().equals(id)).findFirst();
        if (config.isPresent()) {
            String schedulerName = config.get().getSchedularName();
            if (triggerService.isSchedulerRunning(schedulerName)) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Scheduler " + schedulerName + " is already running in background."));
            }
            java.util.Date dateToRun = targetDate != null ? targetDate : new java.util.Date();
            
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext ctx = com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext.get();
                ctx.setExecutionType("MANUAL");
                ctx.setSchedulerName(schedulerName);
                ctx.setTriggerId(config.get().getId());
                ctx.setDueDate(dateToRun);
                try {
                    triggerService.executeTrigger(schedulerName, dateToRun, closePast);
                } catch (Exception e) {
                    org.slf4j.LoggerFactory.getLogger(ScheduleConfigurationController.class)
                            .error("Error executing manual trigger async for {}", schedulerName, e);
                } finally {
                    com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext.clear();
                }
            });

            return ResponseEntity.ok(java.util.Map.of("message", "Trigger execution started in background."));
        }
        return ResponseEntity.notFound().build();
    }
}

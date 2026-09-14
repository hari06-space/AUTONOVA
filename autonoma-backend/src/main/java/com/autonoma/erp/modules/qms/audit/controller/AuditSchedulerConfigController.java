package com.autonoma.erp.modules.qms.audit.controller;

import com.autonoma.erp.modules.qms.audit.entity.AuditSchedulerConfig;
import com.autonoma.erp.modules.qms.audit.entity.AuditSchedulerLog;
import com.autonoma.erp.modules.qms.audit.service.AuditSchedulerConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/qms/audit-configs")
public class AuditSchedulerConfigController {

    @Autowired
    private AuditSchedulerConfigService service;

    @GetMapping
    public ResponseEntity<List<AuditSchedulerConfig>> getAll() {
        return ResponseEntity.ok(service.getAllConfigs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditSchedulerConfig> getById(@PathVariable Long id) {
        AuditSchedulerConfig config = service.getConfigById(id);
        if (config != null) {
            return ResponseEntity.ok(config);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<AuditSchedulerConfig> save(@RequestBody AuditSchedulerConfig config) {
        return ResponseEntity.ok(service.saveConfig(config));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AuditSchedulerConfig> update(@PathVariable Long id, @RequestBody AuditSchedulerConfig config) {
        config.setId(id);
        return ResponseEntity.ok(service.saveConfig(config));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteConfig(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/toggle-active")
    public ResponseEntity<AuditSchedulerConfig> toggleActive(@PathVariable Long id) {
        AuditSchedulerConfig updated = service.toggleActive(id);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/run-now")
    public ResponseEntity<Void> runNow(
            @PathVariable Long id,
            @RequestParam(required = false) String date) {
        service.runNow(id, date);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/run-all")
    public ResponseEntity<Void> runAll(@RequestParam(required = false) String date) {
        service.runAll(date);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<AuditSchedulerLog>> getLogs(@PathVariable Long id) {
        return ResponseEntity.ok(service.getLogsForConfig(id));
    }
}

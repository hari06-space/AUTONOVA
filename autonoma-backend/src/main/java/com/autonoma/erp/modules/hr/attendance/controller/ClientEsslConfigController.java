package com.autonoma.erp.modules.hr.attendance.controller;

import com.autonoma.erp.config.essl.EsslDataSourceService;
import com.autonoma.erp.modules.hr.attendance.entity.ClientEsslConfig;
import com.autonoma.erp.modules.hr.attendance.repository.ClientEsslConfigRepository;
import com.autonoma.erp.modules.hr.attendance.service.AttendanceMigrationService;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/hr/essl-config")
public class ClientEsslConfigController {

    @Autowired
    private ClientEsslConfigRepository configRepository;

    @Autowired
    private EsslDataSourceService esslDataSourceService;

    @Autowired
    private AttendanceMigrationService attendanceMigrationService;

    @GetMapping
    public ResponseEntity<List<ClientEsslConfig>> listAll() {
        return ResponseEntity.ok(configRepository.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ClientEsslConfig>> listActive() {
        return ResponseEntity.ok(configRepository.findByIsActiveTrue());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ClientEsslConfig config) {
        if (config.getClientId() == null || config.getClientId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "clientId is required"));
        }
        config.setClientId(config.getClientId().trim().toUpperCase());
        if (configRepository.existsByClientId(config.getClientId())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "clientId already exists"));
        }
        config.setCreatedBy(resolveCurrentUser());
        ClientEsslConfig saved = configRepository.save(config);
        esslDataSourceService.registerDataSource(saved);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ClientEsslConfig updates) {
        return configRepository.findById(id)
                .map(existing -> {
                    if (updates.getClientName() != null) existing.setClientName(updates.getClientName());
                    if (updates.getJdbcUrl() != null) existing.setJdbcUrl(updates.getJdbcUrl());
                    if (updates.getUsername() != null) existing.setUsername(updates.getUsername());
                    if (updates.getPassword() != null) existing.setPassword(updates.getPassword());
                    if (updates.getEsslTableName() != null) existing.setEsslTableName(updates.getEsslTableName());
                    if (updates.getEmpCdColumn() != null) existing.setEmpCdColumn(updates.getEmpCdColumn());
                    if (updates.getDateColumn() != null) existing.setDateColumn(updates.getDateColumn());
                    if (updates.getInTimeColumn() != null) existing.setInTimeColumn(updates.getInTimeColumn());
                    if (updates.getOutTimeColumn() != null) existing.setOutTimeColumn(updates.getOutTimeColumn());
                    if (updates.getSyncMode() != null) existing.setSyncMode(updates.getSyncMode());
                    if (updates.getIsActive() != null) existing.setIsActive(updates.getIsActive());
                    existing.setUpdatedBy(resolveCurrentUser());
                    ClientEsslConfig saved = configRepository.save(existing);
                    if (Boolean.TRUE.equals(saved.getIsActive())) {
                        esslDataSourceService.registerDataSource(saved);
                    } else {
                        esslDataSourceService.removeDataSource(saved.getClientId());
                    }
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/refresh-datasources")
    public ResponseEntity<Map<String, Object>> refreshDataSources() {
        esslDataSourceService.refreshAllDataSources();
        return ResponseEntity.ok(Map.of("success", true, "message", "ESSL datasources refreshed from config"));
    }

    @PostMapping("/migrate")
    public ResponseEntity<Map<String, Object>> migrateAll() {
        return ResponseEntity.ok(attendanceMigrationService.runMigrationForAllClients());
    }

    @PostMapping("/migrate/{clientId}")
    public ResponseEntity<Map<String, Object>> migrateClient(@PathVariable String clientId) {
        Map<String, Object> result = attendanceMigrationService.runMigrationForClientId(clientId, null);
        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    private String resolveCurrentUser() {
        try {
            String userId = SecurityUtils.getCurrentUserId();
            return userId != null && !userId.isBlank() ? userId : "admin";
        } catch (Exception e) {
            return "admin";
        }
    }
}

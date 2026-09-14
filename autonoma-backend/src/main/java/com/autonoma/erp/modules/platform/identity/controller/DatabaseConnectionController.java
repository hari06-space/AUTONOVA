package com.autonoma.erp.modules.platform.identity.controller;

import com.autonoma.erp.modules.platform.identity.dto.DatabaseConnectionRequestDTO;
import com.autonoma.erp.modules.platform.identity.dto.DatabaseTestResultDTO;
import com.autonoma.erp.modules.platform.identity.service.DatabaseConnectionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/database", "/database"})
public class DatabaseConnectionController {

    @Autowired
    private DatabaseConnectionService databaseConnectionService;

    @PostMapping("/test-connection")
    public ResponseEntity<DatabaseTestResultDTO> testConnection(@Valid @RequestBody DatabaseConnectionRequestDTO request) {
        DatabaseTestResultDTO result = databaseConnectionService.testConnection(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/list-databases")
    public ResponseEntity<List<String>> listDatabases(@Valid @RequestBody DatabaseConnectionRequestDTO request) {
        List<String> databases = databaseConnectionService.listDatabases(request);
        return ResponseEntity.ok(databases);
    }

    @PostMapping("/backup")
    public ResponseEntity<?> backupDatabase(@Valid @RequestBody DatabaseConnectionRequestDTO request) {
        try {
            boolean isDownload = Boolean.TRUE.equals(request.getDownload());
            byte[] backupBytes = databaseConnectionService.backupDatabase(request, request.getBackupFolder(), isDownload);
            
            if (isDownload) {
                String fileName = request.getDbName() + "_backup.bak";
                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                        .contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
                        .body(backupBytes);
            } else {
                java.util.Map<String, Object> response = new java.util.HashMap<>();
                response.put("success", true);
                response.put("message", "✔ Database backup successfully saved to server.");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage() != null ? e.getMessage() : "Database backup failed.");
            return ResponseEntity.status(500).body(response);
        }
    }
}

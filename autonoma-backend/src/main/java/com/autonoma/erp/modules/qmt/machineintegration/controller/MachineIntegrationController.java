package com.autonoma.erp.modules.qmt.machineintegration.controller;

import com.autonoma.erp.modules.qmt.machineintegration.dto.MachineIntegrationConfigDto;
import com.autonoma.erp.modules.qmt.machineintegration.dto.SendDataRequestDto;
import com.autonoma.erp.modules.qmt.machineintegration.dto.TestConnectionResultDto;
import com.autonoma.erp.modules.qmt.machineintegration.service.MachineIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/machine-integration")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MachineIntegrationController {

    @Autowired
    private MachineIntegrationService service;

    @GetMapping("/{machineIdRef}/config")
    public ResponseEntity<MachineIntegrationConfigDto> getConfig(@PathVariable Long machineIdRef) {
        MachineIntegrationConfigDto config = service.getConfig(machineIdRef);
        return config != null ? ResponseEntity.ok(config) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{machineIdRef}/config")
    public ResponseEntity<MachineIntegrationConfigDto> saveConfig(
            @PathVariable Long machineIdRef,
            @RequestBody MachineIntegrationConfigDto dto) {
        return ResponseEntity.ok(service.saveConfig(machineIdRef, dto));
    }

    @PostMapping("/{machineIdRef}/test-connection")
    public ResponseEntity<TestConnectionResultDto> testConnection(@PathVariable Long machineIdRef) {
        try {
            return ResponseEntity.ok(service.testConnection(machineIdRef));
        } catch (Exception e) {
            return ResponseEntity.ok(new TestConnectionResultDto(false, e.getMessage()));
        }
    }

    /** Returns all table names in the external machine DB */
    @GetMapping("/{machineIdRef}/tables")
    public ResponseEntity<?> getTables(@PathVariable Long machineIdRef) {
        try {
            List<String> tables = service.getTables(machineIdRef);
            return ResponseEntity.ok(Map.of("success", true, "tables", tables));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Returns all column names from the configured production table or specified table in the machine DB */
    @GetMapping("/{machineIdRef}/columns")
    public ResponseEntity<?> getTableColumns(
            @PathVariable Long machineIdRef,
            @RequestParam(required = false) String tableName) {
        try {
            List<String> columns = service.getTableColumns(machineIdRef, tableName);
            return ResponseEntity.ok(Map.of("success", true, "columns", columns));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Reads data from external machine DB using the configured column list */
    @GetMapping("/{machineIdRef}/read")
    public ResponseEntity<?> readExternalData(@PathVariable Long machineIdRef) {
        try {
            List<Map<String, Object>> data = service.readExternalData(machineIdRef);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Ad-hoc send with a one-time payload (quick test) */
    @PostMapping("/{machineIdRef}/send")
    public ResponseEntity<?> sendExternalData(
            @PathVariable Long machineIdRef,
            @RequestBody SendDataRequestDto dto) {
        try {
            String result = service.sendExternalData(machineIdRef, dto);
            return ResponseEntity.ok(Map.of("success", true, "message", "Data sent successfully.", "externalRecordId", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Runs the configured Send job (SQL → machine DB table or JSON file) */
    @PostMapping("/{machineIdRef}/run-job")
    public ResponseEntity<?> runConfiguredJob(@PathVariable Long machineIdRef) {
        try {
            Map<String, Object> result = service.runConfiguredJob(machineIdRef);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Previews the data to be sent by running the configured SQL Query locally */
    @GetMapping("/{machineIdRef}/preview-send")
    public ResponseEntity<?> previewSendData(@PathVariable Long machineIdRef) {
        try {
            List<Map<String, Object>> data = service.getSendDataPreview(machineIdRef);
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** Resets the integration logs/history so already read or sent rows can be processed again */
    @PostMapping("/{machineIdRef}/reset-history")
    public ResponseEntity<?> resetHistory(@PathVariable Long machineIdRef) {
        try {
            service.resetIntegrationHistory(machineIdRef);
            return ResponseEntity.ok(Map.of("success", true, "message", "Integration history reset successfully. All records will be re-processed next time."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}

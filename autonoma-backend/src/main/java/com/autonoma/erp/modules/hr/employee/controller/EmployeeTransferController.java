package com.autonoma.erp.modules.hr.employee.controller;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeTransfer;
import com.autonoma.erp.modules.hr.employee.service.EmployeeTransferService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr/employee-transfers")
@CrossOrigin(origins = "*")
public class EmployeeTransferController {

    @Autowired
    private EmployeeTransferService service;

    @GetMapping
    @RequirePagePermission(pageCode = "HA1280", action = "read")
    public ResponseEntity<List<EmployeeTransfer>> getAllTransfers() {
        return ResponseEntity.ok(service.getAllTransfers());
    }

    @GetMapping("/latest-info/{employeeId}")
    @RequirePagePermission(pageCode = "HA1280", action = "read")
    public ResponseEntity<Map<String, Object>> getLatestInfo(@PathVariable Long employeeId) {
        try {
            return ResponseEntity.ok(service.getLatestInfo(employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    @RequirePagePermission(pageCode = "HA1280", action = "write")
    public ResponseEntity<?> saveTransfer(@RequestBody EmployeeTransfer transfer) {
        try {
            return ResponseEntity.ok(service.saveTransfer(transfer));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

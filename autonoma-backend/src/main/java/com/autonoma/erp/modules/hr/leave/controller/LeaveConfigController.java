package com.autonoma.erp.modules.hr.leave.controller;

import com.autonoma.erp.modules.hr.leave.entity.LeaveConfig;
import com.autonoma.erp.modules.hr.leave.service.LeaveConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping({"/api/hr/leave-configs", "/api/hra/attendance/leave-config", "/hra/attendance/leave-config"})
@CrossOrigin(origins = "*")
public class LeaveConfigController {

    @Autowired
    private LeaveConfigService service;

    @GetMapping
    public ResponseEntity<List<LeaveConfig>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveConfig> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2393", action = "write")
    public ResponseEntity<?> save(@RequestBody LeaveConfig entity, Principal principal) {
        try {
            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            return ResponseEntity.ok(service.save(entity, currentUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2393", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody LeaveConfig entity, Principal principal) {
        try {
            entity.setId(id);
            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            return ResponseEntity.ok(service.save(entity, currentUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2393", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

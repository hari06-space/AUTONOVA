package com.autonoma.erp.modules.qms.audit.controller;

import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.qms.audit.entity.VerificationCriteria;
import com.autonoma.erp.modules.qms.audit.service.VerificationCriteriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/hr/verification-criteria")
@CrossOrigin(origins = "*")
public class VerificationCriteriaController {

    @Autowired
    private VerificationCriteriaService service;

    @GetMapping
    @RequirePagePermission(pageCode = "M2130", action = "read")
    public ResponseEntity<List<VerificationCriteria>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/next-sequence")
    @RequirePagePermission(pageCode = "M2130", action = "read")
    public ResponseEntity<Long> getNextSequence() {
        return ResponseEntity.ok(service.getNextSequence());
    }

    @GetMapping("/{id}")
    @RequirePagePermission(pageCode = "M2130", action = "read")
    public ResponseEntity<VerificationCriteria> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2130", action = "write")
    public ResponseEntity<?> save(@RequestBody VerificationCriteria entity, Principal principal) {
        try {
            String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserDisplayName();
            if (currentUser == null) {
                currentUser = principal != null ? principal.getName() : "SYSTEM";
            }
            return ResponseEntity.ok(service.save(entity, currentUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2130", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody VerificationCriteria entity, Principal principal) {
        try {
            entity.setId(id);
            String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserDisplayName();
            if (currentUser == null) {
                currentUser = principal != null ? principal.getName() : "SYSTEM";
            }
            return ResponseEntity.ok(service.save(entity, currentUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2130", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

package com.autonoma.erp.modules.induction.controller;

import com.autonoma.erp.modules.induction.entity.InductionMaster;
import com.autonoma.erp.modules.induction.service.InductionMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/hr/induction-master")
@CrossOrigin(origins = "*")
public class InductionMasterController {

    @Autowired
    private InductionMasterService service;

    @GetMapping
    @RequirePagePermission(pageCode = "M2140", action = "read")
    public ResponseEntity<List<InductionMaster>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/next-sequence")
    @RequirePagePermission(pageCode = "M2140", action = "read")
    public ResponseEntity<Long> getNextSequence() {
        return ResponseEntity.ok(service.getNextSequence());
    }

    @GetMapping("/{id}")
    @RequirePagePermission(pageCode = "M2140", action = "read")
    public ResponseEntity<InductionMaster> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2140", action = "write")
    public ResponseEntity<?> save(@RequestBody InductionMaster entity, Principal principal) {
        try {
            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            return ResponseEntity.ok(service.save(entity, currentUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2140", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody InductionMaster entity, Principal principal) {
        try {
            entity.setId(id);
            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            return ResponseEntity.ok(service.save(entity, currentUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2140", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

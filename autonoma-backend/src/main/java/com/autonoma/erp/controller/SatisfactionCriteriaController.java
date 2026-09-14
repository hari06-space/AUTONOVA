package com.autonoma.erp.controller;

import com.autonoma.erp.model.SatisfactionCriteria;
import com.autonoma.erp.service.SatisfactionCriteriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/qms/satisfaction-criteria")
@CrossOrigin(origins = "*")
public class SatisfactionCriteriaController {

    @Autowired
    private SatisfactionCriteriaService service;

    @GetMapping
    public ResponseEntity<List<SatisfactionCriteria>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SatisfactionCriteria> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody SatisfactionCriteria entity, Principal principal) {
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
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody SatisfactionCriteria entity, Principal principal) {
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
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

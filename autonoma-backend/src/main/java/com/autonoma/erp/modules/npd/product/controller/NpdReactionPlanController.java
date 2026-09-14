package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.entity.NpdReactionPlan;
import com.autonoma.erp.modules.npd.product.repository.NpdReactionPlanRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/process/reaction-plan")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class NpdReactionPlanController {

    private final NpdReactionPlanRepository repository;

    public NpdReactionPlanController(NpdReactionPlanRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<NpdReactionPlan>> getAll() {
        try {
            return ResponseEntity.ok(repository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NpdReactionPlan> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3420", action = "write")
    public ResponseEntity<?> create(@RequestBody NpdReactionPlan entity) {
        try {
            if (entity.getShortName() == null || entity.getShortName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Short Name is required.");
            }
            if (entity.getReactionPlan() == null || entity.getReactionPlan().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Reaction Plan is required.");
            }

            if (repository.existsByShortNameIgnoreCase(entity.getShortName().trim())) {
                return ResponseEntity.badRequest().body("Short Name '" + entity.getShortName() + "' already exists.");
            }
            if (repository.existsByReactionPlanIgnoreCase(entity.getReactionPlan().trim())) {
                return ResponseEntity.badRequest().body("Reaction Plan '" + entity.getReactionPlan() + "' already exists.");
            }

            entity.setShortName(entity.getShortName().trim());
            entity.setReactionPlan(entity.getReactionPlan().trim());

            NpdReactionPlan saved = repository.save(entity);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3420", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody NpdReactionPlan entity) {
        try {
            return repository.findById(id)
                .map(existing -> {
                    if (entity.getShortName() == null || entity.getShortName().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Short Name is required.");
                    }
                    if (entity.getReactionPlan() == null || entity.getReactionPlan().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Reaction Plan is required.");
                    }

                    if (repository.existsByShortNameIgnoreCaseAndIdNot(entity.getShortName().trim(), id)) {
                        return ResponseEntity.badRequest().body("Short Name '" + entity.getShortName() + "' already exists.");
                    }
                    if (repository.existsByReactionPlanIgnoreCaseAndIdNot(entity.getReactionPlan().trim(), id)) {
                        return ResponseEntity.badRequest().body("Reaction Plan '" + entity.getReactionPlan() + "' already exists.");
                    }

                    existing.setShortName(entity.getShortName().trim());
                    existing.setReactionPlan(entity.getReactionPlan().trim());
                    existing.setStatus(entity.getStatus());
                    existing.setUpdatedBy(entity.getUpdatedBy());

                    NpdReactionPlan updated = repository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3420", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            if (!repository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            repository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete record: " + e.getMessage());
        }
    }
}

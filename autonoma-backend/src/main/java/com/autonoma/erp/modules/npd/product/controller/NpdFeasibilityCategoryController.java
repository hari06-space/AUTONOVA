package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.entity.NpdFeasibilityCategory;
import com.autonoma.erp.modules.npd.product.repository.NpdFeasibilityCategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/process/feasibility-category")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class NpdFeasibilityCategoryController {

    private final NpdFeasibilityCategoryRepository repository;

    public NpdFeasibilityCategoryController(NpdFeasibilityCategoryRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<NpdFeasibilityCategory>> getAll() {
        try {
            return ResponseEntity.ok(repository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NpdFeasibilityCategory> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3400", action = "write")
    public ResponseEntity<?> create(@RequestBody NpdFeasibilityCategory entity) {
        try {
            if (entity.getType() == null || entity.getType().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Type is required.");
            }
            String type = entity.getType().trim().toUpperCase();
            if (!type.equals("FEASIBILITY") && !type.equals("PRODUCT REVIEW")) {
                return ResponseEntity.badRequest().body("Type must be either 'FEASIBILITY' or 'PRODUCT REVIEW'.");
            }

            if (entity.getCategory() == null || entity.getCategory().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Category is required.");
            }

            if (repository.existsByCategoryIgnoreCase(entity.getCategory().trim())) {
                return ResponseEntity.badRequest().body("Category '" + entity.getCategory() + "' already exists.");
            }

            entity.setType(type);
            entity.setCategory(entity.getCategory().trim());
            if (entity.getDescription() != null) {
                entity.setDescription(entity.getDescription().trim());
            }

            NpdFeasibilityCategory saved = repository.save(entity);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3400", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody NpdFeasibilityCategory entity) {
        try {
            return repository.findById(id)
                .map(existing -> {
                    if (entity.getType() == null || entity.getType().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Type is required.");
                    }
                    String type = entity.getType().trim().toUpperCase();
                    if (!type.equals("FEASIBILITY") && !type.equals("PRODUCT REVIEW")) {
                        return ResponseEntity.badRequest().body("Type must be 'FEASIBILITY' or 'PRODUCT REVIEW'.");
                    }

                    if (entity.getCategory() == null || entity.getCategory().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Category is required.");
                    }

                    if (repository.existsByCategoryIgnoreCaseAndIdNot(entity.getCategory().trim(), id)) {
                        return ResponseEntity.badRequest().body("Category '" + entity.getCategory() + "' already exists.");
                    }

                    existing.setType(type);
                    existing.setCategory(entity.getCategory().trim());
                    existing.setSeqNo(entity.getSeqNo());
                    existing.setDescription(entity.getDescription() != null ? entity.getDescription().trim() : null);
                    existing.setStatus(entity.getStatus());
                    existing.setUpdatedBy(entity.getUpdatedBy());

                    NpdFeasibilityCategory updated = repository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3400", action = "delete")
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

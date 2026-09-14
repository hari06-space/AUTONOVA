package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.entity.NpdCorrectiveAction;
import com.autonoma.erp.modules.npd.product.repository.NpdCorrectiveActionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/process/corrective-action")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class NpdCorrectiveActionController {

    private final NpdCorrectiveActionRepository repository;

    public NpdCorrectiveActionController(NpdCorrectiveActionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<NpdCorrectiveAction>> getAll() {
        try {
            return ResponseEntity.ok(repository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NpdCorrectiveAction> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3410", action = "write")
    public ResponseEntity<?> create(@RequestBody NpdCorrectiveAction entity) {
        try {
            if (entity.getShortName() == null || entity.getShortName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Short Name is required.");
            }
            if (entity.getCorrectivePlan() == null || entity.getCorrectivePlan().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Corrective Plan is required.");
            }

            if (repository.existsByShortNameIgnoreCase(entity.getShortName().trim())) {
                return ResponseEntity.badRequest().body("Short Name '" + entity.getShortName() + "' already exists.");
            }
            if (repository.existsByCorrectivePlanIgnoreCase(entity.getCorrectivePlan().trim())) {
                return ResponseEntity.badRequest().body("Corrective Plan '" + entity.getCorrectivePlan() + "' already exists.");
            }

            entity.setShortName(entity.getShortName().trim());
            entity.setCorrectivePlan(entity.getCorrectivePlan().trim());

            NpdCorrectiveAction saved = repository.save(entity);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3410", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody NpdCorrectiveAction entity) {
        try {
            return repository.findById(id)
                .map(existing -> {
                    if (entity.getShortName() == null || entity.getShortName().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Short Name is required.");
                    }
                    if (entity.getCorrectivePlan() == null || entity.getCorrectivePlan().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Corrective Plan is required.");
                    }

                    if (repository.existsByShortNameIgnoreCaseAndIdNot(entity.getShortName().trim(), id)) {
                        return ResponseEntity.badRequest().body("Short Name '" + entity.getShortName() + "' already exists.");
                    }
                    if (repository.existsByCorrectivePlanIgnoreCaseAndIdNot(entity.getCorrectivePlan().trim(), id)) {
                        return ResponseEntity.badRequest().body("Corrective Plan '" + entity.getCorrectivePlan() + "' already exists.");
                    }

                    existing.setShortName(entity.getShortName().trim());
                    existing.setCorrectivePlan(entity.getCorrectivePlan().trim());
                    existing.setStatus(entity.getStatus());
                    existing.setUpdatedBy(entity.getUpdatedBy());

                    NpdCorrectiveAction updated = repository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3410", action = "delete")
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

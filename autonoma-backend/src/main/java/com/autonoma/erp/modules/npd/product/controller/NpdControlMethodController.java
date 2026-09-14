package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.entity.NpdControlMethod;
import com.autonoma.erp.modules.npd.product.repository.NpdControlMethodRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/process/control-method")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class NpdControlMethodController {

    private final NpdControlMethodRepository repository;

    public NpdControlMethodController(NpdControlMethodRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<NpdControlMethod>> getAll() {
        try {
            return ResponseEntity.ok(repository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NpdControlMethod> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3390", action = "write")
    public ResponseEntity<?> create(@RequestBody NpdControlMethod entity) {
        try {
            if (entity.getControlMethod() == null || entity.getControlMethod().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Control Method is required.");
            }

            if (repository.existsByControlMethodIgnoreCase(entity.getControlMethod().trim())) {
                return ResponseEntity.badRequest().body("Control Method '" + entity.getControlMethod() + "' already exists.");
            }

            entity.setControlMethod(entity.getControlMethod().trim());

            NpdControlMethod saved = repository.save(entity);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3390", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody NpdControlMethod entity) {
        try {
            return repository.findById(id)
                .map(existing -> {
                    if (entity.getControlMethod() == null || entity.getControlMethod().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Control Method is required.");
                    }

                    if (repository.existsByControlMethodIgnoreCaseAndIdNot(entity.getControlMethod().trim(), id)) {
                        return ResponseEntity.badRequest().body("Control Method '" + entity.getControlMethod() + "' already exists.");
                    }

                    existing.setControlMethod(entity.getControlMethod().trim());
                    existing.setStatus(entity.getStatus());
                    existing.setUpdatedBy(entity.getUpdatedBy());

                    NpdControlMethod updated = repository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3390", action = "delete")
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

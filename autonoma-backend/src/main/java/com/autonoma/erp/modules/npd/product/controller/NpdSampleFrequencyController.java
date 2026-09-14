package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.entity.NpdSampleFrequency;
import com.autonoma.erp.modules.npd.product.repository.NpdSampleFrequencyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/process/sample-frequency")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class NpdSampleFrequencyController {

    private final NpdSampleFrequencyRepository repository;

    public NpdSampleFrequencyController(NpdSampleFrequencyRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<NpdSampleFrequency>> getAll() {
        try {
            return ResponseEntity.ok(repository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NpdSampleFrequency> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3380", action = "write")
    public ResponseEntity<?> create(@RequestBody NpdSampleFrequency entity) {
        try {
            if (entity.getFrequency() == null || entity.getFrequency().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Sample Frequency is required.");
            }

            if (repository.existsByFrequencyIgnoreCase(entity.getFrequency().trim())) {
                return ResponseEntity.badRequest().body("Sample Frequency '" + entity.getFrequency() + "' already exists.");
            }

            entity.setFrequency(entity.getFrequency().trim());

            NpdSampleFrequency saved = repository.save(entity);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3380", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody NpdSampleFrequency entity) {
        try {
            return repository.findById(id)
                .map(existing -> {
                    if (entity.getFrequency() == null || entity.getFrequency().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Sample Frequency is required.");
                    }

                    if (repository.existsByFrequencyIgnoreCaseAndIdNot(entity.getFrequency().trim(), id)) {
                        return ResponseEntity.badRequest().body("Sample Frequency '" + entity.getFrequency() + "' already exists.");
                    }

                    existing.setFrequency(entity.getFrequency().trim());
                    existing.setStatus(entity.getStatus());
                    existing.setUpdatedBy(entity.getUpdatedBy());

                    NpdSampleFrequency updated = repository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3380", action = "delete")
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

package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.entity.NpdCharacterSpecification;
import com.autonoma.erp.modules.npd.product.repository.NpdCharacterSpecificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/process/character-specification")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class NpdCharacterSpecificationController {

    private final NpdCharacterSpecificationRepository repository;

    public NpdCharacterSpecificationController(NpdCharacterSpecificationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<NpdCharacterSpecification>> getAll() {
        try {
            return ResponseEntity.ok(repository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NpdCharacterSpecification> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3360", action = "write")
    public ResponseEntity<?> create(@RequestBody NpdCharacterSpecification entity) {
        try {
            if (entity.getCharacterSpecification() == null || entity.getCharacterSpecification().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Character Specification is required.");
            }

            if (repository.existsByCharacterSpecificationIgnoreCase(entity.getCharacterSpecification().trim())) {
                return ResponseEntity.badRequest().body("Character Specification '" + entity.getCharacterSpecification() + "' already exists.");
            }

            entity.setCharacterSpecification(entity.getCharacterSpecification().trim());

            NpdCharacterSpecification saved = repository.save(entity);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3360", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody NpdCharacterSpecification entity) {
        try {
            return repository.findById(id)
                .map(existing -> {
                    if (entity.getCharacterSpecification() == null || entity.getCharacterSpecification().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Character Specification is required.");
                    }

                    if (repository.existsByCharacterSpecificationIgnoreCaseAndIdNot(entity.getCharacterSpecification().trim(), id)) {
                        return ResponseEntity.badRequest().body("Character Specification '" + entity.getCharacterSpecification() + "' already exists.");
                    }

                    existing.setCharacterSpecification(entity.getCharacterSpecification().trim());
                    existing.setStatus(entity.getStatus());
                    existing.setUpdatedBy(entity.getUpdatedBy());

                    NpdCharacterSpecification updated = repository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3360", action = "delete")
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

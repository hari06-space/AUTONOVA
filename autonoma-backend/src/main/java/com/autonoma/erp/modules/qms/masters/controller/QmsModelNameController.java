package com.autonoma.erp.modules.qms.masters.controller;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.qms.masters.entity.QmsModelName;
import com.autonoma.erp.modules.qms.masters.repository.QmsModelNameRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/qms/model-name")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class QmsModelNameController {

    private final QmsModelNameRepository repository;

    public QmsModelNameController(QmsModelNameRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<QmsModelName>> getAllModelNames() {
        try {
            return ResponseEntity.ok(repository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<QmsModelName> getModelNameById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping


    @RequirePagePermission(pageCode = "M3160", action = "write")
    public ResponseEntity<?> createModelName(@RequestBody QmsModelName modelName) {
        try {
            if (modelName.getModelName() == null || modelName.getModelName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Model Name is required.");
            }

            String cleanVal = modelName.getModelName().trim();
            if (repository.existsByModelNameIgnoreCase(cleanVal)) {
                return ResponseEntity.badRequest().body("Model Name '" + cleanVal + "' already exists.");
            }

            modelName.setModelName(cleanVal);
            QmsModelName saved = repository.save(modelName);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create Model Name: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")


    @RequirePagePermission(pageCode = "M3160", action = "write")
    public ResponseEntity<?> updateModelName(@PathVariable Long id, @RequestBody QmsModelName modelName) {
        try {
            if (!repository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            if (modelName.getModelName() == null || modelName.getModelName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Model Name is required.");
            }

            String cleanVal = modelName.getModelName().trim();
            if (repository.existsByModelNameIgnoreCaseAndIdNot(cleanVal, id)) {
                return ResponseEntity.badRequest().body("Model Name '" + cleanVal + "' already exists.");
            }

            modelName.setId(id);
            modelName.setModelName(cleanVal);
            QmsModelName updated = repository.save(modelName);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update Model Name: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")


    @RequirePagePermission(pageCode = "M3160", action = "delete")
    public ResponseEntity<?> deleteModelName(@PathVariable Long id) {
        try {
            if (!repository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            repository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete Model Name: " + e.getMessage());
        }
    }
}

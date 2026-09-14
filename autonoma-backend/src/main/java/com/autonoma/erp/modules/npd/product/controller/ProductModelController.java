package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.entity.ProductModel;
import com.autonoma.erp.modules.npd.oem.entity.ProductOem;
import com.autonoma.erp.modules.npd.product.repository.ProductModelRepository;
import com.autonoma.erp.modules.npd.oem.repository.ProductOemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/master/npd/model")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProductModelController {

    private final ProductModelRepository modelRepository;
    private final ProductOemRepository oemRepository;

    public ProductModelController(ProductModelRepository modelRepository, ProductOemRepository oemRepository) {
        this.modelRepository = modelRepository;
        this.oemRepository = oemRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProductModel>> getAllModels() {
        try {
            return ResponseEntity.ok(modelRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{modelNo}")
    public ResponseEntity<ProductModel> getModelById(@PathVariable String modelNo) {
        return modelRepository.findById(modelNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3160", action = "write")
    public ResponseEntity<?> createModel(@RequestBody ProductModel model) {
        try {
            if (model.getModelNo() == null || model.getModelNo().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Model No is required.");
            }
            if (model.getOem() == null || model.getOem().getOemShortName() == null || model.getOem().getOemShortName().isEmpty()) {
                return ResponseEntity.badRequest().body("OEM selection is required.");
            }

            Optional<ProductOem> oemOpt = oemRepository.findById(model.getOem().getOemShortName());
            if (oemOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Selected OEM does not exist.");
            }

            if (modelRepository.existsByModelNoIgnoreCase(model.getModelNo().trim())) {
                return ResponseEntity.badRequest().body("Model No '" + model.getModelNo() + "' already exists.");
            }

            model.setOem(oemOpt.get());
            model.setModelNo(model.getModelNo().trim());
            if (model.getRotorDiameter() == null) {
                model.setRotorDiameter(0.0);
            }

            ProductModel saved = modelRepository.save(model);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create model: " + e.getMessage());
        }
    }

    @PutMapping("/{modelNo}")
    @RequirePagePermission(pageCode = "M3160", action = "write")
    public ResponseEntity<?> updateModel(@PathVariable String modelNo, @RequestBody ProductModel model) {
        try {
            return modelRepository.findById(modelNo)
                .map(existing -> {
                    if (model.getModelNo() == null || model.getModelNo().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Model No is required.");
                    }
                    if (model.getOem() == null || model.getOem().getOemShortName() == null || model.getOem().getOemShortName().isEmpty()) {
                        return ResponseEntity.badRequest().body("OEM selection is required.");
                    }

                    Optional<ProductOem> oemOpt = oemRepository.findById(model.getOem().getOemShortName());
                    if (oemOpt.isEmpty()) {
                        return ResponseEntity.badRequest().body("Selected OEM does not exist.");
                    }

                    if (!existing.getModelNo().equalsIgnoreCase(model.getModelNo().trim())) {
                        if (modelRepository.existsByModelNoIgnoreCase(model.getModelNo().trim())) {
                            return ResponseEntity.badRequest().body("Model No '" + model.getModelNo() + "' already exists.");
                        }
                    }

                    existing.setOem(oemOpt.get());
                    existing.setModelNo(model.getModelNo().trim());
                    existing.setRotorDiameter(model.getRotorDiameter() != null ? model.getRotorDiameter() : 0.0);
                    existing.setStatus(model.getStatus());
                    existing.setUpdatedBy(model.getUpdatedBy());

                    ProductModel updated = modelRepository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update model: " + e.getMessage());
        }
    }

    @DeleteMapping("/{modelNo}")
    @RequirePagePermission(pageCode = "M3160", action = "delete")
    public ResponseEntity<?> deleteModel(@PathVariable String modelNo) {
        try {
            if (!modelRepository.existsById(modelNo)) {
                return ResponseEntity.notFound().build();
            }
            modelRepository.deleteById(modelNo);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete model: " + e.getMessage());
        }
    }
}

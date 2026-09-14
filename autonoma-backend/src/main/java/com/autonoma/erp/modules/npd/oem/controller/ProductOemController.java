package com.autonoma.erp.modules.npd.oem.controller;

import com.autonoma.erp.modules.npd.oem.entity.ProductOem;
import com.autonoma.erp.modules.npd.oem.repository.ProductOemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/oem")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProductOemController {

    private final ProductOemRepository oemRepository;

    public ProductOemController(ProductOemRepository oemRepository) {
        this.oemRepository = oemRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProductOem>> getAllOems() {
        try {
            return ResponseEntity.ok(oemRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{oemShortName}")
    public ResponseEntity<ProductOem> getOemById(@PathVariable String oemShortName) {
        return oemRepository.findById(oemShortName)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3140", action = "write")
    public ResponseEntity<?> createOem(@RequestBody ProductOem oem) {
        try {
            if (oem.getOemShortName() == null || oem.getOemShortName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("OEM Short Name is required.");
            }

            if (oemRepository.existsByOemShortNameIgnoreCase(oem.getOemShortName().trim())) {
                return ResponseEntity.badRequest().body("OEM Short Name '" + oem.getOemShortName() + "' already exists.");
            }

            oem.setOemShortName(oem.getOemShortName().trim());
            if (oem.getOemPrefix() != null) {
                oem.setOemPrefix(oem.getOemPrefix().trim().toUpperCase());
            }
            if (oem.getOemDescription() != null) {
                oem.setOemDescription(oem.getOemDescription().trim());
            }
            if (oem.getOriginCountry() != null) {
                oem.setOriginCountry(oem.getOriginCountry().trim());
            }
            if (oem.getStatusYear() != null) {
                oem.setStatusYear(oem.getStatusYear().trim());
            }

            ProductOem saved = oemRepository.save(oem);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create OEM: " + e.getMessage());
        }
    }

    @PutMapping("/{oemShortName}")
    @RequirePagePermission(pageCode = "M3140", action = "write")
    public ResponseEntity<?> updateOem(@PathVariable String oemShortName, @RequestBody ProductOem oem) {
        try {
            return oemRepository.findById(oemShortName)
                .map(existing -> {
                    if (oem.getOemShortName() == null || oem.getOemShortName().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("OEM Short Name is required.");
                    }

                    if (!existing.getOemShortName().equalsIgnoreCase(oem.getOemShortName().trim())) {
                        if (oemRepository.existsByOemShortNameIgnoreCase(oem.getOemShortName().trim())) {
                            return ResponseEntity.badRequest().body("OEM Short Name '" + oem.getOemShortName() + "' already exists.");
                        }
                    }

                    existing.setOemShortName(oem.getOemShortName().trim());
                    existing.setOemPrefix(oem.getOemPrefix() != null ? oem.getOemPrefix().trim().toUpperCase() : null);
                    existing.setOemDescription(oem.getOemDescription() != null ? oem.getOemDescription().trim() : null);
                    existing.setOriginCountry(oem.getOriginCountry() != null ? oem.getOriginCountry().trim() : null);
                    existing.setStatusYear(oem.getStatusYear() != null ? oem.getStatusYear().trim() : null);
                    existing.setStatus(oem.getStatus());
                    existing.setUpdatedBy(oem.getUpdatedBy());

                    ProductOem updated = oemRepository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update OEM: " + e.getMessage());
        }
    }

    @DeleteMapping("/{oemShortName}")
    @RequirePagePermission(pageCode = "M3140", action = "delete")
    public ResponseEntity<?> deleteOem(@PathVariable String oemShortName) {
        try {
            if (!oemRepository.existsById(oemShortName)) {
                return ResponseEntity.notFound().build();
            }
            oemRepository.deleteById(oemShortName);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete OEM: " + e.getMessage());
        }
    }
}

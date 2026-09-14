package com.autonoma.erp.modules.npd.itemtaxonomy.controller;

import com.autonoma.erp.modules.npd.itemtaxonomy.entity.ProductItemSubtype;
import com.autonoma.erp.modules.npd.itemtaxonomy.repository.ProductItemSubtypeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/item-subtype")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProductItemSubtypeController {

    private final ProductItemSubtypeRepository subtypeRepository;

    public ProductItemSubtypeController(ProductItemSubtypeRepository subtypeRepository) {
        this.subtypeRepository = subtypeRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProductItemSubtype>> getAllSubtypes() {
        try {
            return ResponseEntity.ok(subtypeRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductItemSubtype> getSubtypeById(@PathVariable String id) {
        return subtypeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3130", action = "write")
    public ResponseEntity<?> createSubtype(@RequestBody ProductItemSubtype subtype) {
        try {
            if (subtype.getType() == null || subtype.getType().getItemType() == null) {
                return ResponseEntity.badRequest().body("Item Type is required.");
            }
            if (subtype.getSubType() == null || subtype.getSubType().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Sub Type Name is required.");
            }

            // Check if Sub Type already exists for the selected Item Type
            if (subtypeRepository.existsByTypeAndSubTypeIgnoreCase(subtype.getType(), subtype.getSubType().trim())) {
                return ResponseEntity.badRequest().body("Sub Type '" + subtype.getSubType() + "' already exists for this Item Type.");
            }

            subtype.setSubType(subtype.getSubType().trim());
            if (subtype.getSubItemPrefix() != null) {
                subtype.setSubItemPrefix(subtype.getSubItemPrefix().trim().toUpperCase());
            }

            ProductItemSubtype saved = subtypeRepository.save(subtype);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create Sub Type: " + e.getMessage());
        }
    }

    @PutMapping("/{originalSubType}")
    @RequirePagePermission(pageCode = "M3130", action = "write")
    public ResponseEntity<?> updateSubtype(@PathVariable String originalSubType, @RequestBody ProductItemSubtype subtype) {
        try {
            return subtypeRepository.findById(originalSubType)
                .map(existing -> {
                    if (subtype.getType() == null || subtype.getType().getItemType() == null) {
                        return ResponseEntity.badRequest().body("Item Type is required.");
                    }
                    if (subtype.getSubType() == null || subtype.getSubType().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Sub Type Name is required.");
                    }

                    // Check duplicate Sub Type for the selected Item Type (excluding this record)
                    if (subtypeRepository.existsByTypeAndSubTypeIgnoreCaseAndSubTypeNot(subtype.getType(), subtype.getSubType().trim(), originalSubType)) {
                        return ResponseEntity.badRequest().body("Sub Type '" + subtype.getSubType() + "' already exists for this Item Type.");
                    }

                    existing.setType(subtype.getType());
                    existing.setSubType(subtype.getSubType().trim());
                    existing.setSubItemPrefix(subtype.getSubItemPrefix() != null ? subtype.getSubItemPrefix().trim().toUpperCase() : null);
                    existing.setIsAutoGenerateCode(subtype.getIsAutoGenerateCode());
                    existing.setPrefixBased(subtype.getPrefixBased());
                    existing.setStatus(subtype.getStatus());
                    existing.setUpdatedBy(subtype.getUpdatedBy());

                    ProductItemSubtype updated = subtypeRepository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update Sub Type: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3130", action = "delete")
    public ResponseEntity<?> deleteSubtype(@PathVariable String id) {
        try {
            if (!subtypeRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            subtypeRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete Sub Type: " + e.getMessage());
        }
    }
}

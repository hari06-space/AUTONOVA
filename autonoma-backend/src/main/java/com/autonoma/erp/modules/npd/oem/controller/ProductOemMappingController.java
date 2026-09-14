package com.autonoma.erp.modules.npd.oem.controller;

import com.autonoma.erp.modules.npd.oem.entity.ProductOemMapping;
import com.autonoma.erp.modules.npd.oem.repository.ProductOemMappingRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/master/npd/oem-mapping")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProductOemMappingController {

    private final ProductOemMappingRepository mappingRepository;
    private final ProductMasterRepository productMasterRepository;

    public ProductOemMappingController(ProductOemMappingRepository mappingRepository, ProductMasterRepository productMasterRepository) {
        this.mappingRepository = mappingRepository;
        this.productMasterRepository = productMasterRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProductOemMapping>> getAllMappings() {
        try {
            return ResponseEntity.ok(mappingRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductOemMapping> getMappingById(@PathVariable Long id) {
        return mappingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3150", action = "write")
    public ResponseEntity<?> createMapping(@RequestBody ProductOemMapping mapping) {
        try {
            if (mapping.getPartNo() == null || mapping.getPartNo().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Part No is required.");
            }
            if (mapping.getOemPartNo() == null || mapping.getOemPartNo().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("OEM Part No is required.");
            }

            String cleanPartNo = mapping.getPartNo().trim();
            if (!productMasterRepository.findByItemNo(cleanPartNo).isPresent()) {
                return ResponseEntity.badRequest().body("Part No '" + cleanPartNo + "' does not exist in Product Master.");
            }

            if (mappingRepository.existsByPartNoIgnoreCase(cleanPartNo)) {
                return ResponseEntity.badRequest().body("Part No '" + mapping.getPartNo() + "' already exists.");
            }

            mapping.setPartNo(cleanPartNo);
            mapping.setOemPartNo(mapping.getOemPartNo().trim());
            if (mapping.getOemDescription() != null) {
                mapping.setOemDescription(mapping.getOemDescription().trim());
            }

            ProductOemMapping saved = mappingRepository.save(mapping);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create mapping: " + e.getMessage());
        }
    }

    @PostMapping("/bulk")
    @RequirePagePermission(pageCode = "M3150", action = "write")
    public ResponseEntity<?> createMappingsBulk(@RequestBody List<ProductOemMapping> mappings) {
        try {
            List<String> fileDuplicates = new ArrayList<>();
            List<String> dbDuplicates = new ArrayList<>();
            List<String> nonExistentParts = new ArrayList<>();
            java.util.Set<String> processedPartNos = new java.util.HashSet<>();

            for (ProductOemMapping mapping : mappings) {
                if (mapping.getPartNo() == null || mapping.getPartNo().trim().isEmpty()) {
                    continue;
                }
                if (mapping.getOemPartNo() == null || mapping.getOemPartNo().trim().isEmpty()) {
                    continue;
                }

                String cleanPartNo = mapping.getPartNo().trim();
                String key = cleanPartNo.toLowerCase();

                if (processedPartNos.contains(key)) {
                    if (!fileDuplicates.contains(cleanPartNo)) {
                        fileDuplicates.add(cleanPartNo);
                    }
                } else {
                    processedPartNos.add(key);
                }

                if (!productMasterRepository.findByItemNo(cleanPartNo).isPresent()) {
                    if (!nonExistentParts.contains(cleanPartNo)) {
                        nonExistentParts.add(cleanPartNo);
                    }
                }

                if (mappingRepository.existsByPartNoIgnoreCase(cleanPartNo)) {
                    if (!dbDuplicates.contains(cleanPartNo)) {
                        dbDuplicates.add(cleanPartNo);
                    }
                }
            }

            if (!fileDuplicates.isEmpty() || !dbDuplicates.isEmpty() || !nonExistentParts.isEmpty()) {
                StringBuilder errorMsg = new StringBuilder();
                if (!fileDuplicates.isEmpty()) {
                    errorMsg.append("Duplicate Part No(s) found in the file: ")
                            .append(String.join(", ", fileDuplicates))
                            .append(". ");
                }
                if (!nonExistentParts.isEmpty()) {
                    errorMsg.append("Part No(s) do not exist in Product Master: ")
                            .append(String.join(", ", nonExistentParts))
                            .append(". ");
                }
                if (!dbDuplicates.isEmpty()) {
                    errorMsg.append("Part No(s) already exist in the database: ")
                            .append(String.join(", ", dbDuplicates))
                            .append(". ");
                }
                return ResponseEntity.badRequest().body(errorMsg.toString().trim());
            }

            int savedCount = 0;
            for (ProductOemMapping mapping : mappings) {
                if (mapping.getPartNo() == null || mapping.getPartNo().trim().isEmpty()) {
                    continue;
                }
                if (mapping.getOemPartNo() == null || mapping.getOemPartNo().trim().isEmpty()) {
                    continue;
                }

                String cleanPartNo = mapping.getPartNo().trim();
                mapping.setPartNo(cleanPartNo);
                mapping.setOemPartNo(mapping.getOemPartNo().trim());
                if (mapping.getOemDescription() != null) {
                    mapping.setOemDescription(mapping.getOemDescription().trim());
                } else {
                    mapping.setOemDescription("");
                }
                if (mapping.getStatus() == null) {
                    mapping.setStatus(true);
                }
                if (mapping.getCreatedBy() == null || mapping.getCreatedBy().trim().isEmpty()) {
                    mapping.setCreatedBy("Bulk Upload");
                }
                mapping.setCreatedAt(LocalDateTime.now());

                mappingRepository.saveAndFlush(mapping);
                savedCount++;
            }

            Map<String, Object> result = new HashMap<>();
            result.put("savedCount", savedCount);
            result.put("duplicateCount", 0);
            result.put("messages", new ArrayList<String>());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Bulk upload failed: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3150", action = "write")
    public ResponseEntity<?> updateMapping(@PathVariable Long id, @RequestBody ProductOemMapping mapping) {
        try {
            if (!mappingRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            if (mapping.getPartNo() == null || mapping.getPartNo().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Part No is required.");
            }
            if (mapping.getOemPartNo() == null || mapping.getOemPartNo().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("OEM Part No is required.");
            }

            String cleanPartNo = mapping.getPartNo().trim();
            if (!productMasterRepository.findByItemNo(cleanPartNo).isPresent()) {
                return ResponseEntity.badRequest().body("Part No '" + cleanPartNo + "' does not exist in Product Master.");
            }

            if (mappingRepository.existsByPartNoIgnoreCaseAndIdNot(cleanPartNo, id)) {
                return ResponseEntity.badRequest().body("Part No '" + mapping.getPartNo() + "' already exists.");
            }

            mapping.setId(id);
            mapping.setPartNo(cleanPartNo);
            mapping.setOemPartNo(mapping.getOemPartNo().trim());
            if (mapping.getOemDescription() != null) {
                mapping.setOemDescription(mapping.getOemDescription().trim());
            }

            ProductOemMapping updated = mappingRepository.save(mapping);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update mapping: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3150", action = "delete")
    public ResponseEntity<?> deleteMapping(@PathVariable Long id) {
        try {
            if (!mappingRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            mappingRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete mapping: " + e.getMessage());
        }
    }
}

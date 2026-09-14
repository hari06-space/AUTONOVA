package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.entity.ProductIpp;
import com.autonoma.erp.modules.npd.product.repository.ProductIppRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/product-ipp")
@CrossOrigin(origins = "*")
@Tag(name = "NPD - Product IPP Master", description = "Endpoints for managing Product IPP Master")
public class ProductIppController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ProductIppController.class);

    @Autowired
    private ProductIppRepository repository;

    @Autowired
    private ProductMasterRepository productMasterRepository;

    @GetMapping
    @Operation(summary = "Get All Product IPPs", description = "Fetches a complete list of Product IPPs")
    public List<ProductIpp> getAll() {
        log.info("Fetching all Product IPP records");
        return repository.findAll();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3190", action = "write")
    @Operation(summary = "Create Product IPP", description = "Creates a new Product IPP record")
    public ResponseEntity<?> create(@RequestBody ProductIpp productIpp) {
        log.info("Creating Product IPP: {}", productIpp);
        if (productIpp.getCustomerId() == null) {
            return ResponseEntity.badRequest().body("Customer ID is required!");
        }
        
        // Validation: Verify partNo exists in Product Master
        String partNo = productIpp.getPartNo();
        if (partNo != null && !partNo.trim().isEmpty()) {
            if (!productMasterRepository.findByItemNo(partNo.trim()).isPresent()) {
                return ResponseEntity.badRequest().body("Selected Part Number '" + partNo + "' does not exist in Product Master!");
            }
        }

        ProductIpp saved = repository.save(productIpp);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3190", action = "write")
    @Operation(summary = "Update Product IPP", description = "Updates an existing Product IPP record")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ProductIpp details) {
        log.info("Updating Product IPP ID {}: {}", id, details);
        if (details.getCustomerId() == null) {
            return ResponseEntity.badRequest().body("Customer ID is required!");
        }

        // Validation: Verify partNo exists in Product Master
        String partNo = details.getPartNo();
        if (partNo != null && !partNo.trim().isEmpty()) {
            if (!productMasterRepository.findByItemNo(partNo.trim()).isPresent()) {
                return ResponseEntity.badRequest().body("Selected Part Number '" + partNo + "' does not exist in Product Master!");
            }
        }

        return repository.findById(id)
                .map(record -> {
                    record.setCustomerId(details.getCustomerId());
                    record.setCustomerName(details.getCustomerName());
                    record.setCustomerGroup(details.getCustomerGroup());
                    record.setPartNo(details.getPartNo());
                    record.setOemPartNo(details.getOemPartNo());
                    record.setCustPartNo(details.getCustPartNo());
                    record.setIsActive(details.getIsActive());
                    record.setUpdatedBy(details.getUpdatedBy());
                    
                    ProductIpp saved = repository.save(record);
                    return ResponseEntity.ok(saved);
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3190", action = "delete")
    @Operation(summary = "Delete Product IPP", description = "Deletes a Product IPP record by its ID")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("Deleting Product IPP ID: {}", id);
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.entity.ProductCapacity;
import com.autonoma.erp.modules.npd.product.entity.ProductModel;
import com.autonoma.erp.modules.npd.product.repository.ProductCapacityRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductModelRepository;
import com.autonoma.erp.modules.npd.product.entity.ProductCapacityId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/master/npd/capacity")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProductCapacityController {

    private final ProductCapacityRepository capacityRepository;
    private final ProductModelRepository modelRepository;

    public ProductCapacityController(ProductCapacityRepository capacityRepository, ProductModelRepository modelRepository) {
        this.capacityRepository = capacityRepository;
        this.modelRepository = modelRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProductCapacity>> getAllCapacities() {
        try {
            return ResponseEntity.ok(capacityRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{modelNo}/{uom}/{capacityVal:.+}")
    public ResponseEntity<ProductCapacity> getCapacityById(
            @PathVariable String modelNo, 
            @PathVariable String uom, 
            @PathVariable Double capacityVal) {
        ProductCapacityId id = new ProductCapacityId(modelNo, uom, capacityVal);
        return capacityRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3170", action = "write")
    public ResponseEntity<?> createCapacity(@RequestBody ProductCapacity capacity) {
        try {
            if (capacity.getUom() == null || capacity.getUom().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("UOM is required.");
            }
            if (capacity.getCapacityVal() == null) {
                return ResponseEntity.badRequest().body("Capacity value is required.");
            }
            if (capacity.getModel() == null || capacity.getModel().getModelNo() == null || capacity.getModel().getModelNo().isEmpty()) {
                return ResponseEntity.badRequest().body("Model Name selection is required.");
            }

            Optional<ProductModel> modelOpt = modelRepository.findById(capacity.getModel().getModelNo());
            if (modelOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Selected Model Name does not exist.");
            }

            String cleanUom = capacity.getUom().trim().toUpperCase();
            if (!List.of("KW", "MW").contains(cleanUom)) {
                return ResponseEntity.badRequest().body("Invalid UOM. Supported units are KW and MW.");
            }

            ProductCapacityId id = new ProductCapacityId(modelOpt.get().getModelNo(), cleanUom, capacity.getCapacityVal());
            if (capacityRepository.existsById(id)) {
                return ResponseEntity.badRequest().body("Capacity entry with this Model, UOM, and Value already exists.");
            }

            capacity.setModel(modelOpt.get());
            capacity.setUom(cleanUom);

            ProductCapacity saved = capacityRepository.save(capacity);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create capacity: " + e.getMessage());
        }
    }

    @PutMapping("/{modelNo}/{uom}/{capacityVal:.+}")
    @RequirePagePermission(pageCode = "M3170", action = "write")
    public ResponseEntity<?> updateCapacity(
            @PathVariable String modelNo, 
            @PathVariable String uom, 
            @PathVariable Double capacityVal, 
            @RequestBody ProductCapacity capacity) {
        try {
            ProductCapacityId id = new ProductCapacityId(modelNo, uom, capacityVal);
            if (!capacityRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            if (capacity.getUom() == null || capacity.getUom().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("UOM is required.");
            }
            if (capacity.getCapacityVal() == null) {
                return ResponseEntity.badRequest().body("Capacity value is required.");
            }
            if (capacity.getModel() == null || capacity.getModel().getModelNo() == null || capacity.getModel().getModelNo().isEmpty()) {
                return ResponseEntity.badRequest().body("Model Name selection is required.");
            }

            Optional<ProductModel> modelOpt = modelRepository.findById(capacity.getModel().getModelNo());
            if (modelOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Selected Model Name does not exist.");
            }

            String cleanUom = capacity.getUom().trim().toUpperCase();
            if (!List.of("KW", "MW").contains(cleanUom)) {
                return ResponseEntity.badRequest().body("Invalid UOM. Supported units are KW and MW.");
            }

            ProductCapacityId newId = new ProductCapacityId(modelOpt.get().getModelNo(), cleanUom, capacity.getCapacityVal());
            if (!id.equals(newId) && capacityRepository.existsById(newId)) {
                return ResponseEntity.badRequest().body("Capacity entry with this Model, UOM, and Value already exists.");
            }
            if (!id.equals(newId)) {
                capacityRepository.deleteById(id);
            }

            capacity.setModel(modelOpt.get());
            capacity.setUom(cleanUom);

            ProductCapacity updated = capacityRepository.save(capacity);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update capacity: " + e.getMessage());
        }
    }

    @DeleteMapping("/{modelNo}/{uom}/{capacityVal:.+}")
    @RequirePagePermission(pageCode = "M3170", action = "delete")
    public ResponseEntity<?> deleteCapacity(
            @PathVariable String modelNo, 
            @PathVariable String uom, 
            @PathVariable Double capacityVal) {
        try {
            ProductCapacityId id = new ProductCapacityId(modelNo, uom, capacityVal);
            if (!capacityRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            capacityRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete capacity: " + e.getMessage());
        }
    }
}

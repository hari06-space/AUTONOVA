package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.entity.ProductWindFarm;
import com.autonoma.erp.modules.npd.product.repository.ProductWindFarmRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/wind-farm")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProductWindFarmController {

    private final ProductWindFarmRepository repository;

    public ProductWindFarmController(ProductWindFarmRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<ProductWindFarm>> getAllWindFarms() {
        try {
            return ResponseEntity.ok(repository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductWindFarm> getWindFarmById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3210", action = "write")
    public ResponseEntity<?> createWindFarm(@RequestBody ProductWindFarm windFarm) {
        try {
            if (windFarm.getWindFarmName() == null || windFarm.getWindFarmName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Wind Farm Name is required.");
            }
            if (windFarm.getCity() == null || windFarm.getCity().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("City is required.");
            }
            if (windFarm.getState() == null || windFarm.getState().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("State is required.");
            }
            if (windFarm.getCountry() == null || windFarm.getCountry().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Country is required.");
            }

            String cleanVal = windFarm.getWindFarmName().trim();
            if (repository.existsByWindFarmNameIgnoreCase(cleanVal)) {
                return ResponseEntity.badRequest().body("Wind Farm '" + cleanVal + "' already exists.");
            }

            windFarm.setWindFarmName(cleanVal);
            windFarm.setCity(windFarm.getCity().trim());
            windFarm.setState(windFarm.getState().trim());
            windFarm.setCountry(windFarm.getCountry().trim());

            ProductWindFarm saved = repository.save(windFarm);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create Wind Farm: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3210", action = "write")
    public ResponseEntity<?> updateWindFarm(@PathVariable Long id, @RequestBody ProductWindFarm windFarm) {
        try {
            if (!repository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            if (windFarm.getWindFarmName() == null || windFarm.getWindFarmName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Wind Farm Name is required.");
            }
            if (windFarm.getCity() == null || windFarm.getCity().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("City is required.");
            }
            if (windFarm.getState() == null || windFarm.getState().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("State is required.");
            }
            if (windFarm.getCountry() == null || windFarm.getCountry().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Country is required.");
            }

            String cleanVal = windFarm.getWindFarmName().trim();
            if (repository.existsByWindFarmNameIgnoreCaseAndIdNot(cleanVal, id)) {
                return ResponseEntity.badRequest().body("Wind Farm '" + cleanVal + "' already exists.");
            }

            windFarm.setId(id);
            windFarm.setWindFarmName(cleanVal);
            windFarm.setCity(windFarm.getCity().trim());
            windFarm.setState(windFarm.getState().trim());
            windFarm.setCountry(windFarm.getCountry().trim());

            ProductWindFarm updated = repository.save(windFarm);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update Wind Farm: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3210", action = "delete")
    public ResponseEntity<?> deleteWindFarm(@PathVariable Long id) {
        try {
            if (!repository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            repository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete Wind Farm: " + e.getMessage());
        }
    }
}

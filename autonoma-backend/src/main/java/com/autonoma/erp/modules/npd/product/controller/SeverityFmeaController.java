package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.dto.SeverityFmeaDto;
import com.autonoma.erp.modules.npd.product.service.SeverityFmeaService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/ppap/severity-fmea")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class SeverityFmeaController {

    private final SeverityFmeaService service;

    public SeverityFmeaController(SeverityFmeaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<SeverityFmeaDto>> getAll() {
        try {
            return ResponseEntity.ok(service.getAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<SeverityFmeaDto> getById(@PathVariable Long id) {
        SeverityFmeaDto dto = service.getById(id);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3430", action = "write")
    public ResponseEntity<?> create(@RequestBody SeverityFmeaDto dto) {
        try {
            if (dto.getSeverityEffect() == null || dto.getSeverityEffect().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Severity Effect is required.");
            }
            if (dto.getCustomerEffect() == null || dto.getCustomerEffect().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Customer Effect is required.");
            }
            if (dto.getManufacturingEffect() == null || dto.getManufacturingEffect().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Manufacturing Effect is required.");
            }
            if (dto.getRank() == null) {
                return ResponseEntity.badRequest().body("Rank is required.");
            }

            SeverityFmeaDto saved = service.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3430", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody SeverityFmeaDto dto) {
        try {
            if (dto.getSeverityEffect() == null || dto.getSeverityEffect().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Severity Effect is required.");
            }
            if (dto.getCustomerEffect() == null || dto.getCustomerEffect().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Customer Effect is required.");
            }
            if (dto.getManufacturingEffect() == null || dto.getManufacturingEffect().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Manufacturing Effect is required.");
            }
            if (dto.getRank() == null) {
                return ResponseEntity.badRequest().body("Rank is required.");
            }

            SeverityFmeaDto updated = service.update(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3430", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete record: " + e.getMessage());
        }
    }
}

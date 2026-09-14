package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.dto.DetectionFmeaDto;
import com.autonoma.erp.modules.npd.product.service.DetectionFmeaService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/ppap/detection-fmea")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class DetectionFmeaController {

    private final DetectionFmeaService service;

    public DetectionFmeaController(DetectionFmeaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<DetectionFmeaDto>> getAll() {
        try {
            return ResponseEntity.ok(service.getAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<DetectionFmeaDto> getById(@PathVariable Long id) {
        DetectionFmeaDto dto = service.getById(id);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3440", action = "write")
    public ResponseEntity<?> create(@RequestBody DetectionFmeaDto dto) {
        try {
            if (dto.getDetection() == null || dto.getDetection().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Detection is required.");
            }
            if (dto.getCriteria() == null || dto.getCriteria().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Criteria is required.");
            }
            if (dto.getDetectionMethod() == null || dto.getDetectionMethod().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Detection Method is required.");
            }
            if (dto.getRank() == null) {
                return ResponseEntity.badRequest().body("Rank is required.");
            }

            DetectionFmeaDto saved = service.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3440", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody DetectionFmeaDto dto) {
        try {
            if (dto.getDetection() == null || dto.getDetection().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Detection is required.");
            }
            if (dto.getCriteria() == null || dto.getCriteria().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Criteria is required.");
            }
            if (dto.getDetectionMethod() == null || dto.getDetectionMethod().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Detection Method is required.");
            }
            if (dto.getRank() == null) {
                return ResponseEntity.badRequest().body("Rank is required.");
            }

            DetectionFmeaDto updated = service.update(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3440", action = "delete")
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

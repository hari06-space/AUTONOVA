package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.dto.OccuranceFmeaDto;
import com.autonoma.erp.modules.npd.product.service.OccuranceFmeaService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/ppap/occurance-fmea")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class OccuranceFmeaController {

    private final OccuranceFmeaService service;

    public OccuranceFmeaController(OccuranceFmeaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<OccuranceFmeaDto>> getAll() {
        try {
            return ResponseEntity.ok(service.getAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<OccuranceFmeaDto> getById(@PathVariable Long id) {
        OccuranceFmeaDto dto = service.getById(id);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3450", action = "write")
    public ResponseEntity<?> create(@RequestBody OccuranceFmeaDto dto) {
        try {
            if (dto.getProbabilityOfFailure() == null || dto.getProbabilityOfFailure().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Probability of Failure is required.");
            }
            if (dto.getLikelyFailureRates() == null || dto.getLikelyFailureRates().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Likely Failure Rates is required.");
            }
            if (dto.getRank() == null) {
                return ResponseEntity.badRequest().body("Rank is required.");
            }

            OccuranceFmeaDto saved = service.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3450", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody OccuranceFmeaDto dto) {
        try {
            if (dto.getProbabilityOfFailure() == null || dto.getProbabilityOfFailure().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Probability of Failure is required.");
            }
            if (dto.getLikelyFailureRates() == null || dto.getLikelyFailureRates().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Likely Failure Rates is required.");
            }
            if (dto.getRank() == null) {
                return ResponseEntity.badRequest().body("Rank is required.");
            }

            OccuranceFmeaDto updated = service.update(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3450", action = "delete")
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

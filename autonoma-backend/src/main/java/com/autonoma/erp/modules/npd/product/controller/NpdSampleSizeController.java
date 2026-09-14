package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.dto.NpdSampleSizeDto;
import com.autonoma.erp.modules.npd.product.service.NpdSampleSizeService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master/npd/process/sample-size")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class NpdSampleSizeController {

    private final NpdSampleSizeService service;

    public NpdSampleSizeController(NpdSampleSizeService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<NpdSampleSizeDto>> getAll() {
        try {
            return ResponseEntity.ok(service.getAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NpdSampleSizeDto> getById(@PathVariable Long id) {
        NpdSampleSizeDto dto = service.getById(id);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M3370", action = "write")
    public ResponseEntity<?> create(@RequestBody NpdSampleSizeDto dto) {
        try {
            if (dto.getSize() == null || dto.getSize().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Sample Size is required.");
            }

            NpdSampleSizeDto saved = service.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M3370", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody NpdSampleSizeDto dto) {
        try {
            if (dto.getSize() == null || dto.getSize().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Sample Size is required.");
            }

            NpdSampleSizeDto updated = service.update(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M3370", action = "delete")
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

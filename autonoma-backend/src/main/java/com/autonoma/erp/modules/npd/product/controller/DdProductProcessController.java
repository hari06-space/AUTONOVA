package com.autonoma.erp.modules.npd.product.controller;

import com.autonoma.erp.modules.npd.product.dto.DdProductProcessDto;
import com.autonoma.erp.modules.npd.product.service.DdProductProcessService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dd/product-process")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class DdProductProcessController {

    private final DdProductProcessService service;

    public DdProductProcessController(DdProductProcessService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<DdProductProcessDto>> getAllProcesses() {
        try {
            return ResponseEntity.ok(service.getAllProcesses());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<DdProductProcessDto> getProcessById(@PathVariable Long id) {
        DdProductProcessDto dto = service.getProcessById(id);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "DD1111", action = "write")
    public ResponseEntity<?> createProcess(@RequestBody DdProductProcessDto processDto) {
        try {
            if (processDto.getProcessCode() == null || processDto.getProcessCode().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Process Code is required.");
            }
            if (processDto.getProcessName() == null || processDto.getProcessName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Process Name is required.");
            }

            DdProductProcessDto saved = service.createProcess(processDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create product process: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "DD1111", action = "write")
    public ResponseEntity<?> updateProcess(@PathVariable Long id, @RequestBody DdProductProcessDto processDto) {
        try {
            if (processDto.getProcessCode() == null || processDto.getProcessCode().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Process Code is required.");
            }
            if (processDto.getProcessName() == null || processDto.getProcessName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Process Name is required.");
            }

            DdProductProcessDto updated = service.updateProcess(id, processDto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update product process: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "DD1111", action = "delete")
    public ResponseEntity<?> deleteProcess(@PathVariable Long id) {
        try {
            service.deleteProcess(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete product process: " + e.getMessage());
        }
    }

    @GetMapping("/by-product/{productId}")
    public ResponseEntity<List<DdProductProcessDto>> getProcessesByProductId(@PathVariable Long productId) {
        try {
            return ResponseEntity.ok(service.getProcessesByProductId(productId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/bulk-save")
    @RequirePagePermission(pageCode = "DD1111", action = "write")
    public ResponseEntity<?> bulkSaveProcesses(@RequestBody com.autonoma.erp.modules.npd.product.dto.BulkProductProcessDto dto) {
        try {
            service.bulkSaveProcesses(dto);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to bulk save processes: " + e.getMessage());
        }
    }
}

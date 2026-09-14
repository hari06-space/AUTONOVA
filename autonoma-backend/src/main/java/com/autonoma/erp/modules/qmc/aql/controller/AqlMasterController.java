package com.autonoma.erp.modules.qmc.aql.controller;

import com.autonoma.erp.modules.qmc.aql.dto.AqlMasterDto;
import com.autonoma.erp.modules.qmc.aql.service.AqlMasterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/qmc/aql")
@RequiredArgsConstructor
public class AqlMasterController {

    private final AqlMasterService aqlMasterService;

    @GetMapping
    public ResponseEntity<?> getAllAqlMasters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            Page<AqlMasterDto> aqlMasters = aqlMasterService.getAllAqlMasters(pageable, search);
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", aqlMasters.getContent());
            response.put("currentPage", aqlMasters.getNumber());
            response.put("totalItems", aqlMasters.getTotalElements());
            response.put("totalPages", aqlMasters.getTotalPages());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching AQL Masters: {}", e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", "Error fetching data: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAqlMasterById(@PathVariable Long id) {
        try {
            AqlMasterDto aqlMaster = aqlMasterService.getAqlMasterById(id);
            return ResponseEntity.ok(aqlMaster);
        } catch (Exception e) {
            log.error("Error fetching AQL Master {}: {}", id, e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping
    public ResponseEntity<?> createAqlMaster(@RequestBody AqlMasterDto dto) {
        try {
            // Hardcoded "system" username for now, normally would get from SecurityContext
            String username = "system"; 
            AqlMasterDto created = aqlMasterService.createAqlMaster(dto, username);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            log.error("Error creating AQL Master: {}", e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAqlMaster(@PathVariable Long id, @RequestBody AqlMasterDto dto) {
        try {
            String username = "system";
            AqlMasterDto updated = aqlMasterService.updateAqlMaster(id, dto, username);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating AQL Master {}: {}", id, e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        try {
            String username = "system";
            aqlMasterService.toggleStatus(id, username);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error toggling status for AQL Master {}: {}", id, e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}

package com.autonoma.erp.modules.qmc.inspectionspecification.controller;

import com.autonoma.erp.modules.qmc.inspectionspecification.dto.InspectionSpecificationDto;
import com.autonoma.erp.modules.qmc.inspectionspecification.service.InspectionSpecificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/qmc/inspection-specification")
@RequiredArgsConstructor
public class InspectionSpecificationController {

    private final InspectionSpecificationService service;

    // ──────────── LIST ────────────
    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long itemId,
            @RequestParam(required = false) Long statusId) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            Page<InspectionSpecificationDto> result = service.getAll(search, itemId, statusId, pageable);
            Map<String, Object> response = new HashMap<>();
            response.put("content", result.getContent());
            response.put("currentPage", result.getNumber());
            response.put("totalItems", result.getTotalElements());
            response.put("totalPages", result.getTotalPages());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching Inspection Specifications: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ──────────── GET BY ID ────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (Exception e) {
            log.error("Error fetching Inspection Specification {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ──────────── CREATE ────────────
    @PostMapping
    public ResponseEntity<?> create(@RequestBody InspectionSpecificationDto dto) {
        try {
            return ResponseEntity.ok(service.create(dto));
        } catch (Exception e) {
            log.error("Error creating Inspection Specification: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ──────────── UPDATE ────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody InspectionSpecificationDto dto) {
        try {
            return ResponseEntity.ok(service.update(id, dto));
        } catch (Exception e) {
            log.error("Error updating Inspection Specification {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ──────────── TOGGLE STATUS ────────────
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        try {
            service.toggleStatus(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error toggling status for Inspection Specification {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ──────────── INCOMING INSPECTION ENDPOINT ────────────
    @GetMapping("/active-for-item")
    public ResponseEntity<?> getActiveForItem(
            @RequestParam Long itemId,
            @RequestParam(required = false) String inspectionDate) {
        try {
            LocalDate date = (inspectionDate != null) ? LocalDate.parse(inspectionDate) : LocalDate.now();
            return ResponseEntity.ok(service.getActiveSpecificationForItem(itemId, date));
        } catch (Exception e) {
            log.error("Error resolving active spec for item {}: {}", itemId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

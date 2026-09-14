package com.autonoma.erp.modules.master.organization.controller;

import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.master.organization.service.DivisionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/divisions")
@CrossOrigin(origins = "*")
@Tag(name = "Admin - Division Master",
     description = "Division management endpoints — divisions are scoped to a company "
                 + "and drive per-division data isolation in tenant databases")
public class DivisionController {

    @Autowired
    private DivisionService divisionService;

    // ── Next sequence number (used by frontend for default Seq No field) ──────
    @Operation(summary = "Get next sequence number")
    @GetMapping("/next-seq")
    public ResponseEntity<Integer> getNextSeq() {
        return ResponseEntity.ok(divisionService.getNextSequenceNo());
    }

    // ── List all (admin / super-user) ─────────────────────────────────────────
    @Operation(summary = "Get all divisions across all companies")
    @GetMapping
    public ResponseEntity<List<Division>> getAllDivisions() {
        return ResponseEntity.ok(divisionService.getAllDivisions());
    }

    // ── List by company ───────────────────────────────────────────────────────
    @Operation(summary = "Get all divisions for a specific company")
    @GetMapping("/by-company/{companyId}")
    public ResponseEntity<List<Division>> getByCompany(@PathVariable Long companyId) {
        return ResponseEntity.ok(divisionService.getDivisionsByCompany(companyId));
    }

    @Operation(summary = "Get active divisions for a company (used in login / selection screens)")
    @GetMapping("/by-company/{companyId}/active")
    public ResponseEntity<List<Division>> getActiveByCompany(@PathVariable Long companyId) {
        return ResponseEntity.ok(divisionService.getActiveDivisionsByCompany(companyId));
    }

    // ── Create ────────────────────────────────────────────────────────────────
    @Operation(summary = "Create a new division — division_code (BIGINT) is auto-assigned by the server")
    @PostMapping
    @RequirePagePermission(pageCode = "AD1120", action = "write")
    public ResponseEntity<Division> create(@RequestBody Division division) {
        return ResponseEntity.ok(divisionService.createDivision(division));
    }

    // ── Get by ID ─────────────────────────────────────────────────────────────
    @Operation(summary = "Get a division by ID")
    @GetMapping("/{id}")
    public ResponseEntity<Division> getById(@PathVariable Long id) {
        return divisionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Update ────────────────────────────────────────────────────────────────
    @Operation(summary = "Update an existing division")
    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "AD1120", action = "write")
    public ResponseEntity<Division> update(@PathVariable Long id, @RequestBody Division details) {
        return divisionService.updateDivision(id, details)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    @Operation(summary = "Delete a division by ID")
    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "AD1120", action = "delete")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        return divisionService.findById(id)
                .map(d -> {
                    divisionService.deleteDivision(id);
                    return ResponseEntity.ok(Map.of("message", "Division deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

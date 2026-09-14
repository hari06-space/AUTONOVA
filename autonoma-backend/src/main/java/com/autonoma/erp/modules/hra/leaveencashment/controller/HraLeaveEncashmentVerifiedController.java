package com.autonoma.erp.modules.hra.leaveencashment.controller;

import com.autonoma.erp.modules.hra.leaveencashment.entity.HraLeaveEncashmentVerified;
import com.autonoma.erp.modules.hra.leaveencashment.service.HraLeaveEncashmentVerifiedService;
import com.autonoma.erp.security.RequirePagePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller — HRA Leave Encashment Verified
 * Base URL : /api/hra/leave-encashment-verified
 * Page Code: HA1295
 */
@RestController
@RequestMapping("/api/hra/leave-encashment-verified")
@CrossOrigin(origins = "*")
public class HraLeaveEncashmentVerifiedController {

    private static final String PAGE_CODE = "HA1295";

    private final HraLeaveEncashmentVerifiedService service;

    @org.springframework.beans.factory.annotation.Autowired
    public HraLeaveEncashmentVerifiedController(HraLeaveEncashmentVerifiedService service) {
        this.service = service;
    }

    // ── GET ALL ──────────────────────────────────────────────────

    @GetMapping
    @RequirePagePermission(pageCode = PAGE_CODE, action = "read")
    public ResponseEntity<List<HraLeaveEncashmentVerified>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // ── GET BY ID ────────────────────────────────────────────────

    @GetMapping("/{id}")
    @RequirePagePermission(pageCode = PAGE_CODE, action = "read")
    public ResponseEntity<HraLeaveEncashmentVerified> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    // ── GET BY YEAR ──────────────────────────────────────────────

    @GetMapping("/year/{year}")
    @RequirePagePermission(pageCode = PAGE_CODE, action = "read")
    public ResponseEntity<List<HraLeaveEncashmentVerified>> getByYear(@PathVariable Integer year) {
        return ResponseEntity.ok(service.getByYear(year));
    }

    // ── CREATE ───────────────────────────────────────────────────

    @PostMapping
    @RequirePagePermission(pageCode = PAGE_CODE, action = "write")
    public ResponseEntity<HraLeaveEncashmentVerified> create(
            @Valid @RequestBody HraLeaveEncashmentVerified record) {
        return ResponseEntity.ok(service.create(record));
    }

    // ── UPDATE ───────────────────────────────────────────────────

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = PAGE_CODE, action = "write")
    public ResponseEntity<HraLeaveEncashmentVerified> update(
            @PathVariable Long id,
            @Valid @RequestBody HraLeaveEncashmentVerified record) {
        return ResponseEntity.ok(service.update(id, record));
    }

    // ── WORKFLOW TRANSITIONS ─────────────────────────────────────

    @PutMapping("/{id}/verify")
    @RequirePagePermission(pageCode = PAGE_CODE, action = "approval")
    public ResponseEntity<?> verify(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String remarks = body != null ? body.get("remarks") : null;
            return ResponseEntity.ok(service.verify(id, remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    @RequirePagePermission(pageCode = PAGE_CODE, action = "approval")
    public ResponseEntity<?> approve(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String remarks = body != null ? body.get("remarks") : null;
            return ResponseEntity.ok(service.approve(id, remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    @RequirePagePermission(pageCode = PAGE_CODE, action = "approval")
    public ResponseEntity<?> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String remarks = body.get("remarks");
            return ResponseEntity.ok(service.reject(id, remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── SOFT DELETE ──────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = PAGE_CODE, action = "delete")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.softDelete(id);
        return ResponseEntity.ok(Map.of("message", "Record deleted successfully."));
    }
}

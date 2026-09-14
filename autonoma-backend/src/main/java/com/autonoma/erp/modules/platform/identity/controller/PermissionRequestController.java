package com.autonoma.erp.modules.platform.identity.controller;

import com.autonoma.erp.modules.platform.identity.entity.PermissionEntry;
import com.autonoma.erp.modules.platform.identity.service.PermissionEntryService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sc/permission-requests")
@CrossOrigin(origins = "*")
public class PermissionRequestController {

    @Autowired
    private PermissionEntryService service;

    @GetMapping
    @RequirePagePermission(pageCode = "SC1410", action = "read")
    public ResponseEntity<List<PermissionEntry>> getFilteredRequests(@RequestParam(value = "scope", required = false) String scope) {
        return ResponseEntity.ok(service.getFilteredEntries(scope));
    }

    @PutMapping("/{id}/accept")
    @RequirePagePermission(pageCode = "SC1410", action = "manager")
    public ResponseEntity<?> accept(@PathVariable Long id) {
        try {
            PermissionEntry accepted = service.approveEntry(id);
            return ResponseEntity.ok(accepted);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    @RequirePagePermission(pageCode = "SC1410", action = "manager")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String reason = body.get("rejectionReason");
            PermissionEntry rejected = service.rejectEntry(id, reason);
            return ResponseEntity.ok(rejected);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

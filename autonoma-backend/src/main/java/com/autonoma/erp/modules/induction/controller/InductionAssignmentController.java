package com.autonoma.erp.modules.induction.controller;

import com.autonoma.erp.modules.induction.entity.InductionAssignment;
import com.autonoma.erp.modules.induction.service.InductionAssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr/induction-assignment")
@CrossOrigin(origins = "*")
public class InductionAssignmentController {

    @Autowired
    private InductionAssignmentService service;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<InductionAssignment>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<InductionAssignment>> getActiveOnly() {
        return ResponseEntity.ok(service.getActiveOnly());
    }

    @GetMapping("/employee/{empCode}")
    public ResponseEntity<List<InductionAssignment>> getByEmployee(@PathVariable String empCode) {
        return ResponseEntity.ok(service.getByEmpCode(empCode));
    }

    @PostMapping
    @RequirePagePermission(pageCode = "HA1410", action = "write")
    public ResponseEntity<?> save(@RequestBody String jsonPayload, Principal principal) {
        System.out.println("Incoming POST payload: " + jsonPayload);
        try {
            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            if (jsonPayload.trim().startsWith("[")) {
                List<InductionAssignment> list = objectMapper.readValue(jsonPayload, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, InductionAssignment.class));
                return ResponseEntity.ok(service.saveAll(list, currentUser));
            } else {
                InductionAssignment entity = objectMapper.readValue(jsonPayload, InductionAssignment.class);
                return ResponseEntity.ok(service.save(entity, currentUser));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1410", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody String jsonPayload, Principal principal) {
        System.out.println("Incoming PUT payload for ID " + id + ": " + jsonPayload);
        try {
            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            if (jsonPayload.trim().startsWith("[")) {
                List<InductionAssignment> list = objectMapper.readValue(jsonPayload, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, InductionAssignment.class));
                return ResponseEntity.ok(service.saveAll(list, currentUser));
            } else {
                InductionAssignment entity = objectMapper.readValue(jsonPayload, InductionAssignment.class);
                entity.setId(id);
                return ResponseEntity.ok(service.save(entity, currentUser));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/check-references")
    public ResponseEntity<?> checkReferences(@PathVariable Long id) {
        boolean isUsed = service.isUsedInTraining(id);
        return ResponseEntity.ok(java.util.Map.of("isUsed", isUsed));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1410", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id, Principal principal) {
        try {
            if (service.isUsedInTraining(id)) {
                return ResponseEntity.badRequest().body("Cannot delete this induction assignment because it is already used in training records.");
            }
            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            service.deleteAssignment(id, currentUser);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage() != null ? e.getMessage() : "Failed to delete induction assignment.");
        }
    }

    @PatchMapping("/{id}/status")
    @RequirePagePermission(pageCode = "HA1410", action = "write")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> statusMap, Principal principal) {
        try {
            String newStatus = statusMap.get("status");
            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            service.updateStatus(id, newStatus, currentUser);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

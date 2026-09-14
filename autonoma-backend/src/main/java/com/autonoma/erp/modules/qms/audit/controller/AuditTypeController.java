package com.autonoma.erp.modules.qms.audit.controller;

import com.autonoma.erp.modules.qms.audit.repository.AuditCriteriaRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository;
import com.autonoma.erp.modules.qms.audit.service.AuditTypeService;

import com.autonoma.erp.modules.qms.audit.entity.AuditType;
import com.autonoma.erp.modules.qms.audit.repository.AuditTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/master/qms/audit-type")
@CrossOrigin(origins = "*")
@Tag(name = "QMS - Audit Type Master", description = "Endpoints for managing QMS audit types and standards")
public class AuditTypeController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuditTypeController.class);

    @Autowired
    private com.autonoma.erp.modules.qms.audit.service.AuditTypeService auditTypeService;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditCriteriaRepository auditCriteriaRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository auditScheduleRepository;

    @Autowired
    private AuditTypeRepository auditTypeRepository;

    @GetMapping
    @Operation(summary = "Get All Audit Types", description = "Fetches the list of all audit types")
    public List<AuditType> getAllAuditTypes() {
        log.info("Fetching all audit types");
        return auditTypeService.getAll();
    }

    @GetMapping("/active")
    public List<AuditType> getActiveAuditTypes() {
        return auditTypeService.getActive();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditType> getAuditTypeById(@PathVariable Long id) {
        return auditTypeService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M1120", action = "write")
    @org.springframework.cache.annotation.CacheEvict(value = "masterCache", key = "'AUDIT_TYPE'")
    @Operation(summary = "Create Audit Type", description = "Creates a new audit type configuration")
    public ResponseEntity<?> createAuditType(@RequestBody AuditType auditType) {
        log.info("Saving audit type: {}", auditType);
        auditType.setUpdatedBy(null);
        auditType.setUpdatedDate(null);
        AuditType saved = auditTypeService.save(auditType);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M1120", action = "write")
    @org.springframework.cache.annotation.CacheEvict(value = "masterCache", key = "'AUDIT_TYPE'")
    public ResponseEntity<?> updateAuditType(@PathVariable Long id, @RequestBody AuditType auditType) {
        log.info("Updating audit type with ID {}: {}", id, auditType);
        AuditType existing = auditTypeRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Preserve created info
        auditType.setId(id);
        auditType.setCreatedBy(existing.getCreatedBy());
        auditType.setCreatedDate(existing.getCreatedDate());

        AuditType saved = auditTypeService.save(auditType);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M1120", action = "delete")
    @org.springframework.cache.annotation.CacheEvict(value = "masterCache", key = "'AUDIT_TYPE'")
    public ResponseEntity<?> deleteAuditType(@PathVariable Long id) {
        log.info("Attempting to delete audit type with ID: {}", id);
        AuditType existing = auditTypeRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        String typeName = existing.getAuditType();
        if (typeName == null || typeName.trim().isEmpty()) {
            auditTypeRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }

        typeName = typeName.trim();
        final String searchName = typeName.toLowerCase();

        List<String> dependencies = new java.util.ArrayList<>();

        // 1. Check if referenced in Audit Criteria
        boolean inCriteria = auditCriteriaRepository.findAll().stream()
            .anyMatch(c -> c.getAuditType() != null &&
                java.util.Arrays.stream(c.getAuditType().split(","))
                    .map(String::trim)
                    .anyMatch(t -> t.equalsIgnoreCase(searchName)));
        if (inCriteria) {
            dependencies.add("Audit Criteria");
        }

        // 2. Check if referenced in Audit Schedule
        boolean inSchedule = auditScheduleRepository.findAll().stream()
            .anyMatch(sch -> sch.getAuditType() != null &&
                java.util.Arrays.stream(sch.getAuditType().split(","))
                    .map(String::trim)
                    .anyMatch(t -> t.equalsIgnoreCase(searchName)));
        if (inSchedule) {
            dependencies.add("Audit Schedule");
        }

        if (!dependencies.isEmpty()) {
            String depStr = String.join(", ", dependencies);
            return ResponseEntity.badRequest().body("Deletion not allowed. Audit Type is in use in: " + depStr + ". Delete related records first.");
        }

        auditTypeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

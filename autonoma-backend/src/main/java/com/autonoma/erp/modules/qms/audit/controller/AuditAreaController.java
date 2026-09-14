package com.autonoma.erp.modules.qms.audit.controller;

import com.autonoma.erp.modules.qms.audit.entity.AuditType;
import com.autonoma.erp.modules.qms.audit.repository.AuditCriteriaRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository;
import com.autonoma.erp.modules.qms.audit.repository.AuditTypeRepository;

import com.autonoma.erp.modules.qms.audit.entity.AuditArea;
import com.autonoma.erp.modules.qms.audit.entity.AuditTypeArea;
import com.autonoma.erp.modules.qms.audit.repository.AuditAreaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/master/qms/audit-area")
@CrossOrigin(origins = "*")
@Tag(name = "QMS - Audit Area Master", description = "Endpoints for managing QMS audit areas and zones")
public class AuditAreaController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuditAreaController.class);

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditTypeRepository auditTypeRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository auditScheduleRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditCriteriaRepository auditCriteriaRepository;

    @Autowired
    private AuditAreaRepository auditAreaRepository;

    @GetMapping
    @Operation(summary = "Get All Audit Areas", description = "Fetches a complete list of audit areas and zones")
    public List<AuditArea> getAllAuditAreas() {
        log.info("Fetching all audit areas");
        return auditAreaRepository.findAll();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M1110", action = "write")
    @Operation(summary = "Create Audit Area", description = "Creates a new audit area")
    public ResponseEntity<?> createAuditArea(@RequestBody AuditArea auditArea) {
        log.info("Saving audit area: {}", auditArea);
        String type = auditArea.getType() != null ? auditArea.getType().trim() : "";
        String desc = auditArea.getDescription() != null ? auditArea.getDescription().trim() : "";
        if (!desc.isEmpty() && auditAreaRepository.existsByTypeIgnoreCaseAndDescriptionIgnoreCase(type, desc)) {
            return ResponseEntity.badRequest().body("Duplicate value on field description for type " + (type.isEmpty() ? "unspecified" : type));
        }
        auditArea.setUpdatedBy(null);
        auditArea.setUpdatedDate(null);
        AuditArea saved = auditAreaRepository.save(auditArea);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M1110", action = "write")
    @Operation(summary = "Update Audit Area", description = "Updates an existing audit area")
    public ResponseEntity<?> updateAuditArea(@PathVariable Long id, @RequestBody AuditArea auditArea) {
        log.info("Updating audit area with id: {}, data: {}", id, auditArea);
        AuditArea existing = auditAreaRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        String type = auditArea.getType() != null ? auditArea.getType().trim() : (existing.getType() != null ? existing.getType().trim() : "");
        String desc = auditArea.getDescription() != null ? auditArea.getDescription().trim() : "";
        if (!desc.isEmpty() && auditAreaRepository.existsByTypeIgnoreCaseAndDescriptionIgnoreCaseAndIdNot(type, desc, id)) {
            return ResponseEntity.badRequest().body("Duplicate value on field description for type " + (type.isEmpty() ? "unspecified" : type));
        }
        
        // Preserve created info
        auditArea.setId(id);
        auditArea.setCreatedBy(existing.getCreatedBy());
        auditArea.setCreatedDate(existing.getCreatedDate());
        
        AuditArea saved = auditAreaRepository.save(auditArea);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M1110", action = "delete")
    @Operation(summary = "Delete Audit Area", description = "Deletes an audit area by its ID")
    public ResponseEntity<?> deleteAuditArea(@PathVariable Long id) {
        AuditArea existing = auditAreaRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        
        String areaName = existing.getDescription();
        if (areaName == null || areaName.trim().isEmpty()) {
            auditAreaRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        
        areaName = areaName.trim();
        final String searchName = areaName.toLowerCase();

        // 1. Check if referenced in Audit Type
        List<com.autonoma.erp.modules.qms.audit.entity.AuditType> matchingTypes = auditTypeRepository.findAll().stream()
            .filter(t -> t.getAuditTypeAreas() != null &&
                t.getAuditTypeAreas().stream()
                    .anyMatch(ata -> {
                        if (ata.getAuditAreaEntity() != null && ata.getAuditAreaEntity().getId().equals(id)) {
                            return true;
                        }
                        return ata.getAuditArea() != null && ata.getAuditArea().trim().equalsIgnoreCase(searchName);
                    }))
            .toList();

        // 2. Check if referenced in Audit Schedule
        List<com.autonoma.erp.modules.qms.audit.entity.AuditSchedule> matchingSchedules = auditScheduleRepository.findAll().stream()
            .filter(s -> {
                if (s.getAuditAreaId() != null && s.getAuditAreaId().equals(id)) {
                    return true;
                }
                if (s.getAuditAreaEntity() != null && s.getAuditAreaEntity().getId().equals(id)) {
                    return true;
                }
                if (s.getAuditArea() != null &&
                    java.util.Arrays.stream(s.getAuditArea().split(","))
                        .map(String::trim)
                        .anyMatch(a -> a.equalsIgnoreCase(searchName))) {
                    return true;
                }
                if (s.getAuditeeDetails() != null &&
                    java.util.Arrays.stream(s.getAuditeeDetails().split(","))
                        .map(String::trim)
                        .anyMatch(a -> a.equalsIgnoreCase(searchName))) {
                    return true;
                }
                return false;
            })
            .toList();

        // 3. Check if any matching Audit Type is referenced in Audit Criteria
        List<com.autonoma.erp.modules.qms.audit.entity.AuditCriteria> matchingCriteria = new java.util.ArrayList<>();
        if (!matchingTypes.isEmpty()) {
            List<String> typeNames = matchingTypes.stream().map(t -> t.getAuditType().toLowerCase()).toList();
            matchingCriteria = auditCriteriaRepository.findAll().stream()
                .filter(c -> c.getAuditType() != null &&
                    java.util.Arrays.stream(c.getAuditType().split(","))
                        .map(String::trim)
                        .map(String::toLowerCase)
                        .anyMatch(typeNames::contains))
                .toList();
        }

        if (!matchingTypes.isEmpty() || !matchingSchedules.isEmpty() || !matchingCriteria.isEmpty()) {
            StringBuilder errorBuilder = new StringBuilder();
            errorBuilder.append("Cannot delete Audit Area \"")
                .append(areaName)
                .append("\" because it is currently referenced by:\n");

            if (!matchingTypes.isEmpty()) {
                errorBuilder.append("• Audit Type(s): ")
                    .append(matchingTypes.stream().map(com.autonoma.erp.modules.qms.audit.entity.AuditType::getAuditType).collect(java.util.stream.Collectors.joining(", ")))
                    .append("\n");
            }

            if (!matchingSchedules.isEmpty()) {
                errorBuilder.append("• Audit Schedule(s): ")
                    .append(matchingSchedules.stream().map(com.autonoma.erp.modules.qms.audit.entity.AuditSchedule::getScheduleNo).collect(java.util.stream.Collectors.joining(", ")))
                    .append("\n");
            }

            if (!matchingCriteria.isEmpty()) {
                errorBuilder.append("• Audit Criteria: ")
                    .append(matchingCriteria.stream().map(c -> c.getClause() != null ? c.getClause() : c.getCriteriaText()).limit(5).collect(java.util.stream.Collectors.joining(", ")));
                if (matchingCriteria.size() > 5) {
                    errorBuilder.append("... (+").append(matchingCriteria.size() - 5).append(" more)");
                }
                errorBuilder.append("\n");
            }

            errorBuilder.append("Please remove or update these dependencies first.");
            return ResponseEntity.badRequest().body(errorBuilder.toString());
        }

        auditAreaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

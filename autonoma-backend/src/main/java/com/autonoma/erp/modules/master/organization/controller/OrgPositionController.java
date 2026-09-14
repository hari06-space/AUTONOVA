package com.autonoma.erp.modules.master.organization.controller;

import com.autonoma.erp.modules.master.organization.repository.OrgPositionRepository;

import com.autonoma.erp.dto.OrgPositionDTO;
import com.autonoma.erp.modules.master.organization.entity.OrgPosition;
import com.autonoma.erp.modules.master.organization.service.OrgPositionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;

@RestController
@RequestMapping("/api/master/hr/positions")
public class OrgPositionController {

    @Autowired
    private OrgPositionService positionService;

    @Autowired
    private EmployeeMasterRepository employeeRepo;

    @Autowired
    private EmployeeManagerMappingRepository mappingRepo;

    @Autowired
    private com.autonoma.erp.modules.master.organization.repository.OrgPositionRepository positionRepo;

    @Autowired
    private com.autonoma.erp.modules.hr.orgstructure.repository.LevelMasterRepository levelMasterRepo;

    @PostMapping("/migrate")
    public ResponseEntity<String> migrateFromMappings() {
        // Fetch ALL employees instead of just Active, as requested
        List<EmployeeMaster> employees = employeeRepo.findAll();
        List<EmployeeManagerMapping> mappings = mappingRepo.findAll();
        List<OrgPosition> existingPositions = positionRepo.findAll();
        List<com.autonoma.erp.modules.hr.orgstructure.entity.LevelMaster> levels = levelMasterRepo.findAll();

        Map<Long, String> levelIdToNameMap = new java.util.HashMap<>();
        for (com.autonoma.erp.modules.hr.orgstructure.entity.LevelMaster l : levels) {
            levelIdToNameMap.put(l.getId(), l.getLevelName());
        }

        Map<Long, OrgPosition> empToPosMap = new java.util.HashMap<>();
        for (OrgPosition p : existingPositions) {
            if (p.getAssignedEmployeeId() != null) {
                empToPosMap.put(p.getAssignedEmployeeId(), p);
            }
        }
        
        int createdCount = 0;
        
        // Phase 1: Ensure a position exists for each employee
        for (EmployeeMaster emp : employees) {
            OrgPosition pos = empToPosMap.get(emp.getId());
            if (pos == null) {
                pos = new OrgPosition();
                pos.setPositionTitle(emp.getOrganization() != null && emp.getOrganization().getDesignationId() != null ? String.valueOf(emp.getOrganization().getDesignationId()) : "Employee");
                pos.setDepartmentId(emp.getOrganization() != null ? emp.getOrganization().getDepartmentId() : null);
                pos.setAssignedEmployeeId(emp.getId());
                String statusName = "Active";
                try {
                    if (emp.getStatus() != null) statusName = emp.getStatus().getName();
                } catch (Exception ignored) {}
                pos.setStatus(statusName);
                pos = positionRepo.save(pos);
                empToPosMap.put(emp.getId(), pos);
                createdCount++;
            }
        }

        // Helper to get numeric rank from level name (e.g., "L7" -> 7). Larger is higher.
        java.util.function.Function<Long, Integer> getRank = (levelId) -> {
            if (levelId == null) return -1;
            String name = levelIdToNameMap.get(levelId);
            if (name == null) return -1;
            try {
                return Integer.parseInt(name.replaceAll("[^0-9]", ""));
            } catch (Exception e) {
                return -1;
            }
        };

        // Find best fallback manager for an employee based on department and rank
        java.util.function.Function<EmployeeMaster, Long> findFallbackManager = (emp) -> {
            if (emp.getOrganization() == null || emp.getOrganization().getDepartmentId() == null) return null;
            Long deptId = emp.getOrganization().getDepartmentId();
            int myRank = getRank.apply(emp.getOrganization().getEmpLevelId());
            
            EmployeeMaster bestMgr = null;
            int bestRank = -1;
            
            for (EmployeeMaster candidate : employees) {
                if (candidate.getId().equals(emp.getId())) continue;
                if (candidate.getOrganization() != null && deptId.equals(candidate.getOrganization().getDepartmentId())) {
                    int candRank = getRank.apply(candidate.getOrganization().getEmpLevelId());
                    if (candRank > myRank && candRank > bestRank) {
                        bestRank = candRank;
                        bestMgr = candidate;
                    }
                }
            }
            return bestMgr != null ? bestMgr.getId() : null;
        };

        // Phase 2: Update parent positions based on manager mapping and fallback logic for ALL employees
        for (EmployeeMaster emp : employees) {
            EmployeeManagerMapping empMapping = null;
            for (EmployeeManagerMapping m : mappings) {
                if (m.getEmpId().equals(emp.getId())) {
                    empMapping = m;
                    break;
                }
            }
            
            Long managerId = null;
            if (empMapping != null) {
                managerId = empMapping.getHomeManagerId();
                if (managerId == null) {
                    managerId = empMapping.getBusinessManagerId();
                }
                if (managerId == null) {
                    managerId = empMapping.getVerticalHeadId();
                }
            }
            
            // SMART FALLBACK: If no direct manager mapped, find the highest ranked employee in the same department
            if (managerId == null) {
                managerId = findFallbackManager.apply(emp);
            }
            
            if (managerId != null) {
                OrgPosition childPos = empToPosMap.get(emp.getId());
                OrgPosition parentPos = empToPosMap.get(managerId);
                if (childPos != null && parentPos != null) {
                    if (!parentPos.getId().equals(childPos.getParentPositionId())) {
                        childPos.setParentPositionId(parentPos.getId());
                        positionRepo.save(childPos);
                    }
                }
            }
        }

        return ResponseEntity.ok("Sync successful! Created " + createdCount + " new positions. Total synced: " + employees.size());
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<String> clearAllPositions() {
        try {
            // Because they have self-referencing foreign keys, we need to clear parent references first before deleting.
            List<OrgPosition> all = positionRepo.findAll();
            for (OrgPosition pos : all) {
                pos.setParentPositionId(null);
            }
            positionRepo.saveAll(all);
            
            positionRepo.deleteAll();
            return ResponseEntity.ok("Organization Structure cleared successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to clear organization structure: " + e.getMessage());
        }
    }

    @GetMapping("/tree")
    public ResponseEntity<List<OrgPositionDTO>> getPositionTree() {
        return ResponseEntity.ok(positionService.getPositionTree());
    }

    @PostMapping
    public ResponseEntity<OrgPosition> createPosition(@RequestBody OrgPosition position) {
        return ResponseEntity.ok(positionService.createPosition(position));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrgPosition> updatePosition(@PathVariable Long id, @RequestBody OrgPosition position) {
        return ResponseEntity.ok(positionService.updatePosition(id, position));
    }

    @PostMapping("/assign")
    public ResponseEntity<OrgPosition> assignEmployee(@RequestBody Map<String, Long> payload) {
        Long positionId = payload.get("positionId");
        Long employeeId = payload.get("employeeId");
        return ResponseEntity.ok(positionService.assignEmployee(positionId, employeeId));
    }

    @PostMapping("/unassign")
    public ResponseEntity<OrgPosition> unassignEmployee(@RequestBody Map<String, Long> payload) {
        Long positionId = payload.get("positionId");
        return ResponseEntity.ok(positionService.unassignEmployee(positionId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePosition(@PathVariable Long id) {
        try {
            positionService.deletePosition(id);
            return ResponseEntity.ok("Deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

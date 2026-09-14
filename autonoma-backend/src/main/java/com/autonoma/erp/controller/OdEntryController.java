package com.autonoma.erp.controller;

import com.autonoma.erp.model.OdEntry;
import com.autonoma.erp.service.OdEntryService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/hra/od-entries")
@CrossOrigin(origins = "*")
public class OdEntryController {

    @Autowired
    private OdEntryService service;

    @Autowired
    private com.autonoma.erp.repository.admin.UserRepository userRepository;

    @Autowired
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @Autowired
    private com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository attachmentRepo;

    private void validateUserAccess(Long targetEmployeeId) {
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (currentUserId == null || "SYSTEM".equals(currentUserId)) {
            return; // Allow internal system context
        }

        com.autonoma.erp.model.admin.UserCredential user = userRepository.findById(currentUserId).orElse(null);
        if (user == null) {
            throw new org.springframework.security.access.AccessDeniedException("User session not found.");
        }

        // Allow Admin/Boss Admin (additional1 permission on page HA1330)
        if (authService.hasPermission(currentUserId, "HA1330", "additional1")) {
            return;
        }

        if (!targetEmployeeId.equals(user.getEmpId())) {
            throw new org.springframework.security.access.AccessDeniedException("Access Denied: You do not have permission to view or modify this employee's records.");
        }
    }

    @GetMapping
    @RequirePagePermission(pageCode = "HA1330", action = "read")
    public List<OdEntry> getAll(@RequestParam(value = "self", required = false) Boolean self) {
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (currentUserId != null && !"SYSTEM".equals(currentUserId)) {
            boolean hasCompanyAccess = authService.hasPermission(currentUserId, "HA1330", "additional1");
            if (Boolean.TRUE.equals(self) || !hasCompanyAccess) {
                com.autonoma.erp.model.admin.UserCredential user = userRepository.findById(currentUserId).orElse(null);
                if (user != null) {
                    // Return only the logged-in user's OD entries
                    return service.getByEmployeeId(user.getEmpId());
                }
            }
        }
        return service.getAll();
    }

    @GetMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1330", action = "read")
    public ResponseEntity<OdEntry> getById(@PathVariable Long id) {
        OdEntry entry = service.getById(id);
        validateUserAccess(entry.getEmployeeId());
        return ResponseEntity.ok(entry);
    }

    @GetMapping("/next-code")
    public String getNextCode() {
        return service.getNextODNumber();
    }

    private void saveAttachments(Long refId, Object documentsObj) {
        attachmentRepo.deleteByPageCodeAndRefIdAndDocType("HA1330", refId, "OD_ATTACHMENT");
        if (documentsObj == null) return;
        
        List<String> paths = new ArrayList<>();
        if (documentsObj instanceof String) {
            String str = (String) documentsObj;
            if (!str.trim().isEmpty()) {
                for (String s : str.split(",")) {
                    if (!s.trim().isEmpty()) paths.add(s.trim());
                }
            }
        } else if (documentsObj instanceof List) {
            List<?> list = (List<?>) documentsObj;
            for (Object item : list) {
                if (item instanceof String) {
                    paths.add((String) item);
                } else if (item instanceof Map) {
                    Map<?, ?> map = (Map<?, ?>) item;
                    Object pathVal = map.get("serverFileName");
                    if (pathVal == null) pathVal = map.get("path");
                    if (pathVal == null) pathVal = map.get("fileName");
                    if (pathVal != null) {
                        paths.add(pathVal.toString());
                    }
                }
            }
        }
        
        String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (currentUser == null) currentUser = "SYSTEM";
        
        for (String filePath : paths) {
            com.autonoma.erp.modules.induction.entity.HrAttachmentPath path = new com.autonoma.erp.modules.induction.entity.HrAttachmentPath();
            path.setPageCode("HA1330");
            path.setRefId(refId);
            path.setDocType("OD_ATTACHMENT");
            path.setPath(filePath.trim());
            String fileName = filePath.trim();
            if (fileName.contains("/")) {
                fileName = fileName.substring(fileName.lastIndexOf("/") + 1);
            }
            path.setFileName(fileName);
            path.setCreatedBy(currentUser);
            path.setCreatedDate(new java.util.Date());
            attachmentRepo.save(path);
        }
    }

    @PostMapping
    @RequirePagePermission(pageCode = "HA1330", action = "write")
    public ResponseEntity<OdEntry> save(@RequestBody OdEntry entry) {
        validateUserAccess(entry.getEmployeeId());
        OdEntry saved = service.save(entry);
        saveAttachments(saved.getId(), entry.getDocuments());
        saved = service.getById(saved.getId());
        return ResponseEntity.ok(saved);
    }

    /**
     * Batch create: one OD entry per employeeId, with sequential OD numbers.
     * Accepts a wrapper object: { template: OdEntry, employeeIds: [1,2,3] }
     */
    @PostMapping("/batch")
    @RequirePagePermission(pageCode = "HA1330", action = "write")
    public ResponseEntity<List<OdEntry>> saveBatch(@RequestBody Map<String, Object> body) {
        // Extract template entry
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        OdEntry template = mapper.convertValue(body.get("template"), OdEntry.class);

        // Extract employee IDs
        List<?> rawIds = (List<?>) body.get("employeeIds");
        List<Long> employeeIds = new ArrayList<>();
        if (rawIds != null) {
            for (Object rawId : rawIds) {
                if (rawId instanceof Number) {
                    employeeIds.add(((Number) rawId).longValue());
                }
            }
        }

        // Validate access for all employee IDs
        for (Long empId : employeeIds) {
            validateUserAccess(empId);
        }

        List<OdEntry> created = service.saveBatch(template, employeeIds);
        for (OdEntry od : created) {
            saveAttachments(od.getId(), template.getDocuments());
        }

        List<OdEntry> reloaded = new ArrayList<>();
        for (OdEntry od : created) {
            reloaded.add(service.getById(od.getId()));
        }

        return ResponseEntity.ok(reloaded);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1330", action = "write")
    public ResponseEntity<OdEntry> update(@PathVariable Long id, @RequestBody OdEntry entry) {
        OdEntry existing = service.getById(id);
        validateUserAccess(existing.getEmployeeId());
        validateUserAccess(entry.getEmployeeId());
        OdEntry updated = service.update(id, entry);
        saveAttachments(updated.getId(), entry.getDocuments());
        updated = service.getById(updated.getId());
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/verify")
    @RequirePagePermission(pageCode = "HA1342", action = "approval")
    public ResponseEntity<OdEntry> verify(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        String remarks = payload.get("remarks");
        return ResponseEntity.ok(service.verify(id, status, remarks));
    }
}

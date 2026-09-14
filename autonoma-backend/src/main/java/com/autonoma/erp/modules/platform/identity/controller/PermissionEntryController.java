package com.autonoma.erp.modules.platform.identity.controller;

import com.autonoma.erp.modules.platform.identity.entity.PermissionEntry;
import com.autonoma.erp.modules.platform.identity.service.PermissionEntryService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hra/permission-entries")
@CrossOrigin(origins = "*")
public class PermissionEntryController {

    @Autowired
    private PermissionEntryService service;

    @Autowired
    private com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusMasterRepo;

    @Autowired
    private com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository attachmentRepo;

    @GetMapping
    @RequirePagePermission(pageCode = "HA1310", action = "read")
    public ResponseEntity<List<PermissionEntry>> getFilteredEntries(@RequestParam(value = "scope", required = false) String scope) {
        return ResponseEntity.ok(service.getFilteredEntries(scope));
    }

    @GetMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1310", action = "read")
    public ResponseEntity<PermissionEntry> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getPermissionEntryById(id));
    }

    private Date parseDate(Object val) {
        if (val == null) return null;
        try {
            if (val instanceof Number) {
                return new Date(((Number) val).longValue());
            }
            String str = val.toString();
            try {
                return new Date(Long.parseLong(str));
            } catch (NumberFormatException e) {
                return new java.text.SimpleDateFormat("yyyy-MM-dd").parse(str);
            }
        } catch (Exception e) {
            throw new RuntimeException("Invalid date format: " + val);
        }
    }

    private void saveAttachments(Long refId, Object documentsObj) {
        attachmentRepo.deleteByPageCodeAndRefIdAndDocType("HA1310", refId, "PERMISSION_ATTACHMENT");
        if (documentsObj == null) return;
        
        List<String> paths = new java.util.ArrayList<>();
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
            path.setPageCode("HA1310");
            path.setRefId(refId);
            path.setDocType("PERMISSION_ATTACHMENT");
            path.setPath(filePath.trim());
            String fileName = filePath.trim();
            if (fileName.contains("/")) {
                fileName = fileName.substring(fileName.lastIndexOf("/") + 1);
            }
            path.setFileName(fileName);
            path.setCreatedBy(currentUser);
            path.setCreatedDate(new Date());
            attachmentRepo.save(path);
        }
    }

    @PostMapping
    @RequirePagePermission(pageCode = "HA1310", action = "write")
    public ResponseEntity<?> save(@RequestBody Map<String, Object> req) {
        try {
            PermissionEntry entry = new PermissionEntry();
            entry.setEmployeeId(Long.valueOf(req.get("employeeId").toString()));
            entry.setPermissionDate(parseDate(req.get("permissionDate")));
            entry.setFromTime(req.get("fromTime").toString());
            entry.setToTime(req.get("toTime").toString());
            entry.setReason(req.get("reason") != null ? req.get("reason").toString() : "");
            
            if (req.get("statusId") != null) {
                entry.setStatusId(Long.valueOf(req.get("statusId").toString()));
            } else if (req.get("status") != null) {
                String stName = req.get("status").toString().trim();
                statusMasterRepo.findByNameIgnoreCase(stName)
                        .ifPresent(st -> entry.setStatusId(st.getId()));
            }

            if (req.get("whereFrom") != null) {
                entry.setWhereFrom(req.get("whereFrom").toString());
            } else if (req.get("fromWhere") != null) {
                entry.setWhereFrom(req.get("fromWhere").toString());
            }

            PermissionEntry saved = service.savePermissionEntry(entry);
            saveAttachments(saved.getId(), req.get("documents"));
            saved = service.getPermissionEntryById(saved.getId());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1310", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        try {
            PermissionEntry entry = new PermissionEntry();
            entry.setEmployeeId(Long.valueOf(req.get("employeeId").toString()));
            entry.setPermissionDate(parseDate(req.get("permissionDate")));
            entry.setFromTime(req.get("fromTime").toString());
            entry.setToTime(req.get("toTime").toString());
            entry.setReason(req.get("reason") != null ? req.get("reason").toString() : "");
            
            if (req.get("statusId") != null) {
                entry.setStatusId(Long.valueOf(req.get("statusId").toString()));
            } else if (req.get("status") != null) {
                String stName = req.get("status").toString().trim();
                statusMasterRepo.findByNameIgnoreCase(stName)
                        .ifPresent(st -> entry.setStatusId(st.getId()));
            }

            if (req.get("rejectionReason") != null) {
                entry.setRejectionReason(req.get("rejectionReason").toString());
            }

            PermissionEntry updated = service.updatePermissionEntry(id, entry);
            saveAttachments(updated.getId(), req.get("documents"));
            updated = service.getPermissionEntryById(updated.getId());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancel")
    @RequirePagePermission(pageCode = "HA1310", action = "write")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        try {
            service.cancelPermissionEntry(id);
            return ResponseEntity.ok(Map.of("message", "Request cancelled successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    @RequirePagePermission(pageCode = "HA1315", action = "write")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        try {
            PermissionEntry approved = service.approveEntry(id);
            return ResponseEntity.ok(approved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    @RequirePagePermission(pageCode = "HA1315", action = "write")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String comments = body.get("rejectionComment");
            PermissionEntry rejected = service.rejectEntry(id, comments);
            return ResponseEntity.ok(rejected);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/consumed-duration")
    @RequirePagePermission(pageCode = "HA1310", action = "read")
    public ResponseEntity<?> getConsumedDuration(
            @RequestParam Long employeeId,
            @RequestParam String date,
            @RequestParam(required = false) Long excludeId) {
        try {
            Date parsedDate = new java.text.SimpleDateFormat("yyyy-MM-dd").parse(date);
            double consumed = service.getConsumedDuration(employeeId, parsedDate, excludeId);
            return ResponseEntity.ok(Map.of("consumedDuration", consumed));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/monthly-usage")
    @RequirePagePermission(pageCode = "HA1310", action = "read")
    public ResponseEntity<?> getMonthlyUsage(
            @RequestParam Long employeeId,
            @RequestParam String date,
            @RequestParam(required = false) Long excludeId) {
        try {
            Date parsedDate = new java.text.SimpleDateFormat("yyyy-MM-dd").parse(date);
            return ResponseEntity.ok(service.getMonthlyUsage(employeeId, parsedDate, excludeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}


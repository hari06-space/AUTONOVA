package com.autonoma.erp.modules.qms.checklist.controller;

import com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignment;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistVerification;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.qms.checklist.entity.MasterChecklist;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistSchedulerService;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistAutoAssignmentService;

import com.autonoma.erp.modules.qms.checklist.service.ChecklistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.*;
import com.autonoma.erp.modules.notebook.service.EntityRegistryService;
import com.autonoma.erp.modules.notebook.service.ModulePageResolver;
import com.autonoma.erp.modules.notebook.entity.BosAiEntity;
import com.autonoma.erp.modules.notebook.entity.BosAiEntityField;
import org.springframework.jdbc.core.JdbcTemplate;

@RestController
@RequestMapping("/api/qms/checklist")
@Tag(name = "QMS - Master Checklist", description = "Endpoints for managing QMS Master Checklists, assignments, and verifications")
public class ChecklistController {

    @Autowired
    private ChecklistService checklistService;

    @Autowired
    private com.autonoma.erp.modules.qms.checklist.service.ChecklistSchedulerService schedulerService;

    @Autowired
    private ChecklistAutoAssignmentService checklistAutoAssignmentService;

    @Autowired
    private com.autonoma.erp.service.realtime.RealtimeDataSyncPublisher realtimeDataSyncPublisher;

    @Autowired
    private EntityRegistryService registryService;

    @Autowired
    private ModulePageResolver modulePageResolver;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    // @RequirePagePermission(pageCode = "QM1110", action = "read")
    @Operation(summary = "Get All Master Checklists", description = "Retrieves a paginated list of master checklists with comprehensive filtering options including category, department, dual check flag, and verification status.")
    public ResponseEntity<Page<MasterChecklist>> getAllChecklists(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String taskStatus,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String searchBy,
            @RequestParam(required = false) String searchValue,
            @RequestParam(required = false) String dualCheck,
            @RequestParam(required = false) String verifyStatus,
            @RequestParam(required = false) String seqNo,
            @RequestParam(required = false) String frequency,
            @RequestParam(required = false) String checkingPoint,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String stockLink,
            @RequestParam(required = false) String photoRequired,
            @RequestParam(required = false) String carryForward,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fromDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date toDate,
            @RequestParam(required = false) String considerDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date considerDateValue,
            @RequestParam(required = false) String taskType,
            @RequestParam(required = false) String currentUser,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.unsorted());
        return ResponseEntity.ok(checklistService.getAllChecklists(status, taskStatus, category, department, searchBy,
                searchValue, dualCheck, verifyStatus,
                seqNo, frequency, checkingPoint, description, stockLink, photoRequired, carryForward,
                fromDate, toDate, considerDate, considerDateValue, taskType, currentUser, assignedTo, pageable));
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M1210", action = "write")
    @Operation(summary = "Create/Update Master Checklist", description = "Creates a new Master Checklist or updates an existing one")
    public ResponseEntity<MasterChecklist> createMasterChecklist(@RequestBody MasterChecklist checklist,
            @RequestParam(required = false) List<String> departments) {
        MasterChecklist saved = checklistService.saveMasterChecklist(checklist, departments);
        realtimeDataSyncPublisher.publishMutation("MasterChecklist", "SAVE");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    @RequirePagePermission(pageCode = "M1210", action = "write")
    @Operation(summary = "Update Checklist Status", description = "Updates the active/inactive status of a checklist")
    public ResponseEntity<MasterChecklist> updateChecklistStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        MasterChecklist updated = checklistService.updateChecklistStatus(id, status);
        realtimeDataSyncPublisher.publishMutation("MasterChecklist", "UPDATE_STATUS");
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M1210", action = "delete")
    @Operation(summary = "Delete Master Checklist", description = "Deletes a Master Checklist by ID")
    @CrossOrigin(origins = "*")
    public ResponseEntity<Void> deleteMasterChecklist(@PathVariable Long id) {
        System.out.println("Deleting checklist with ID: " + id);
        checklistService.deleteMasterChecklist(id);
        realtimeDataSyncPublisher.publishMutation("MasterChecklist", "DELETE");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/assignment-groups")
    @Operation(summary = "Get Distinct Group Names", description = "Retrieves all unique group names across all checklist assignments")
    public ResponseEntity<List<String>> getDistinctGroupNames() {
        return ResponseEntity.ok(checklistService.getDistinctGroupNames());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Master Checklist by ID", description = "Retrieves a single Master Checklist details by ID")
    public ResponseEntity<MasterChecklist> getChecklistById(@PathVariable Long id) {
        return checklistService.getChecklistById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/next-sequence")
    @RequirePagePermission(pageCode = "M1210", action = "read")
    @Operation(summary = "Get Next Sequence Number", description = "Calculates the next available sequence number for a new checklist")
    public ResponseEntity<Map<String, String>> getNextSequence() {
        return ResponseEntity.ok(Map.of("nextSeqNo", checklistService.getNextSequenceNumber()));
    }

    @GetMapping("/metadata/page-entities")
    @Operation(summary = "Get Entities and Fields for a Page", description = "Loads metadata of entities and fields associated with the selected ERP Page Code dynamically.")
    public ResponseEntity<List<Map<String, Object>>> getEntitiesForPage(@RequestParam String pageCode) {
        List<Map<String, Object>> result = new ArrayList<>();

        // Fetch all base tables in the schema directly
        List<String> allTables = new ArrayList<>();
        try {
            allTables = jdbcTemplate.queryForList(
                    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME",
                    String.class);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }

        for (String dbTable : allTables) {
            String nameUpper = dbTable.toUpperCase();

            // Exclude admin related (AD/ADMIN), BOS related, and client (CLI/CM) related
            if (nameUpper.startsWith("AD_") || nameUpper.startsWith("ADMIN_") ||
                    nameUpper.startsWith("BOS_") || nameUpper.contains("FILE") ||
                    nameUpper.contains("ATTACHMENT") || nameUpper.contains("COMMON") ||
                    nameUpper.contains("DEVICE") || nameUpper.contains("LOG") ||
                    nameUpper.startsWith("ERP_") ||
                    nameUpper.startsWith("CLI_") || nameUpper.startsWith("CM_") ||
                    nameUpper.startsWith("DATABASECHANGELOG") || nameUpper.startsWith("FLYWAY_")) {
                continue;
            }

            try {
                String displayName = formatEntityName(dbTable);
                Map<String, Object> entMap = new HashMap<>();
                entMap.put("entityCode", dbTable);
                entMap.put("displayName", displayName);
                entMap.put("dbTable", dbTable);

                List<Map<String, String>> fieldList = new ArrayList<>();
                List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                        "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
                        dbTable);

                for (Map<String, Object> col : columns) {
                    String colName = (String) col.get("COLUMN_NAME");
                    String dataType = (String) col.get("DATA_TYPE");

                    Map<String, String> fMap = new HashMap<>();
                    fMap.put("fieldCode", colName);
                    fMap.put("displayName", formatFieldName(colName));
                    fMap.put("fieldType", mapDataType(dataType));
                    fieldList.add(fMap);
                }

                entMap.put("fields", fieldList);
                result.add(entMap);
            } catch (Exception e) {
                // Ignore SQL errors and proceed with other tables
            }
        }

        return ResponseEntity.ok(result);
    }

    private String formatEntityName(String tableName) {
        if (tableName == null || tableName.trim().isEmpty()) {
            return "";
        }

        String[] parts = tableName.split("_");
        StringBuilder sb = new StringBuilder();

        // Define known abbreviations to keep fully uppercase
        java.util.Set<String> uppercaseAbbrs = new java.util.HashSet<>(java.util.Arrays.asList(
                "HR", "QMS", "QMT", "SLS", "NPD", "VND", "CLI", "CM", "SM", "PP", "FA", "INV", "ATS"));

        for (int i = 0; i < parts.length; i++) {
            String part = parts[i].trim();
            if (part.isEmpty())
                continue;

            String upper = part.toUpperCase();
            if (uppercaseAbbrs.contains(upper)) {
                sb.append(upper).append(" ");
            } else {
                sb.append(Character.toUpperCase(part.charAt(0)))
                        .append(part.substring(1).toLowerCase())
                        .append(" ");
            }
        }

        return sb.toString().trim();
    }

    private String formatFieldName(String colName) {
        String[] parts = colName.split("_");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part.length() > 0) {
                sb.append(Character.toUpperCase(part.charAt(0)))
                        .append(part.substring(1).toLowerCase())
                        .append(" ");
            }
        }
        return sb.toString().trim();
    }

    private String mapDataType(String dbType) {
        if (dbType == null)
            return "TEXT";
        String type = dbType.toUpperCase();
        if (type.contains("INT") || type.contains("DECIMAL") || type.contains("NUMERIC") || type.contains("FLOAT")
                || type.contains("REAL") || type.contains("DOUBLE")) {
            return "NUMBER";
        }
        if (type.contains("DATE") || type.contains("TIME")) {
            return "DATE";
        }
        if (type.contains("BIT") || type.contains("BOOL")) {
            return "ENUM";
        }
        return "TEXT";
    }

    @GetMapping("/my-team-employees")
    @RequirePagePermission(pageCode = "QM1120", action = "read")
    @Operation(summary = "Get Reporting Employees", description = "Fetches active employees reporting to the logged-in user as Vertical Head")
    public ResponseEntity<List<EmployeeMaster>> getMyTeamEmployees(@RequestParam(required = false) String currentUser) {
        String sessionUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (sessionUser == null && currentUser != null) {
            sessionUser = currentUser;
        }
        return ResponseEntity.ok(checklistService.getMyTeamEmployees(sessionUser));
    }

    @GetMapping("/assignments")
    // @RequirePagePermission(pageCode = "QM1110", action = "read")
    @Operation(summary = "Get Checklist Assignments", description = "Fetches a paginated list of checklist assignments")
    public ResponseEntity<Page<ChecklistAssignment>> getAssignments(
            @RequestParam(required = false) Long checklistId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fromDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date toDate,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String searchBy,
            @RequestParam(required = false) String searchValue,
            @RequestParam(required = false) String masterVerifyStatus,
            @RequestParam(required = false) String taskType,
            @RequestParam(required = false) String currentUser,
            @RequestParam(required = false) String pageCode,
            @RequestParam(defaultValue = "false") boolean excludeCompleted,
            @RequestParam(defaultValue = "false") boolean excludePending,
            @RequestParam(required = false) String dualCheck,
            @RequestParam(required = false) String considerDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date considerDateValue,
            @RequestParam(required = false) String seqNo,
            @RequestParam(required = false) String checkingPoint,
            @RequestParam(required = false) String frequency,
            @RequestParam(required = false) String stockLink,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String assignedBy,
            @RequestParam(required = false) String assignType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok(checklistService.getAssignments(checklistId, status, assignedTo, fromDate, toDate,
                category,
                searchBy, searchValue, masterVerifyStatus, taskType, currentUser, pageCode, excludeCompleted,
                excludePending,
                dualCheck, considerDate, considerDateValue, seqNo, checkingPoint, frequency, stockLink, department,
                assignedBy, assignType, pageable));
    }

    @GetMapping("/closed")
    @Operation(summary = "Get Closed Checklists", description = "Fetches a paginated list of closed checklists")
    public ResponseEntity<Page<ChecklistAssignment>> getClosedChecklists(
            @RequestParam(required = false) Long checklistId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fromDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date toDate,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String searchBy,
            @RequestParam(required = false) String searchValue,
            @RequestParam(required = false) String masterVerifyStatus,
            @RequestParam(required = false) String taskType,
            @RequestParam(required = false) String currentUser,
            @RequestParam(required = false) String pageCode,
            @RequestParam(defaultValue = "false") boolean excludeCompleted,
            @RequestParam(defaultValue = "false") boolean excludePending,
            @RequestParam(required = false) String dualCheck,
            @RequestParam(required = false) String considerDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date considerDateValue,
            @RequestParam(required = false) String seqNo,
            @RequestParam(required = false) String checkingPoint,
            @RequestParam(required = false) String frequency,
            @RequestParam(required = false) String stockLink,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String assignedBy,
            @RequestParam(required = false) String assignType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok(checklistService.getAssignments(checklistId, status, assignedTo, fromDate, toDate,
                category,
                searchBy, searchValue, masterVerifyStatus, taskType, currentUser, "QM1120", excludeCompleted,
                excludePending,
                dualCheck, considerDate, considerDateValue, seqNo, checkingPoint, frequency, stockLink, department,
                assignedBy, assignType, pageable));
    }

    @GetMapping("/assignments/{id}")
    @Operation(summary = "Get Assignment By ID")
    public ResponseEntity<ChecklistAssignment> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(checklistService.getAssignmentById(id));
    }

    @PostMapping("/assign")
    @RequirePagePermission(pageCode = "QM1110", action = "write")
    @Operation(summary = "Assign Checklist to User", description = "Creates a new assignment for a specific checklist and user")
    public ResponseEntity<ChecklistAssignment> assignTask(@RequestBody Map<String, Object> payload) {
        Long id = payload.get("id") != null ? Long.valueOf(payload.get("id").toString()) : null;
        Long checklistId = Long.valueOf(payload.get("checklistId").toString());
        String assignedTo = payload.get("assignedTo").toString();
        String assignedBy = payload.get("assignedBy").toString();
        String assignType = (payload.get("assignType") != null
                && !payload.get("assignType").toString().trim().isEmpty()) ? payload.get("assignType").toString()
                        : null;
        String groupName = (payload.get("groupName") != null
                && !payload.get("groupName").toString().trim().isEmpty()) ? payload.get("groupName").toString().trim()
                        : null;

        Date checklistDate = null;
        Object rawDate = payload.get("checklistDate");
        if (rawDate == null) {
            rawDate = payload.get("assignedDate");
        }
        if (rawDate != null && !rawDate.toString().trim().isEmpty()) {
            try {
                String dateStr = rawDate.toString();
                if (dateStr.contains("T")) {
                    dateStr = dateStr.split("T")[0];
                }
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                checklistDate = sdf.parse(dateStr);
            } catch (Exception e) {
                // Ignore parsing errors and fallback
            }
        }

        if (checklistDate != null) {
            return ResponseEntity.ok(
                    checklistService.assignTask(id, checklistId, assignedTo, assignedBy, assignType, groupName, checklistDate));
        } else {
            return ResponseEntity.ok(checklistService.assignTask(id, checklistId, assignedTo, assignedBy, assignType, groupName));
        }
    }

    @DeleteMapping("/assignment/{id}")
    @RequirePagePermission(pageCode = "QM1110", action = "delete")
    @Operation(summary = "Delete Assignment", description = "Deletes a specific checklist assignment")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        checklistService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify")
    @RequirePagePermission(pageCode = "QM1110", action = "approval")
    @Operation(summary = "Verify Checklist Task", description = "Verifies a specific checklist assignment")
    public ResponseEntity<ChecklistVerification> verifyTask(@RequestBody Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("assignmentId") || payload.get("assignmentId") == null) {
            throw new IllegalArgumentException("Assignment ID is required and cannot be null");
        }
        Long assignmentId = Long.valueOf(payload.get("assignmentId").toString());
        String verifiedBy = payload.get("verifiedBy") != null ? payload.get("verifiedBy").toString() : "";
        String status = payload.get("status") != null ? payload.get("status").toString() : "";
        String remarks = payload.getOrDefault("remarks", "") != null ? payload.getOrDefault("remarks", "").toString()
                : "";
        @SuppressWarnings("unchecked")
        List<String> actualFiles = (List<String>) payload.get("actualFiles");
        String nextRenewalDate = payload.get("nextRenewalDate") != null ? payload.get("nextRenewalDate").toString() : null;
        ChecklistVerification res = checklistService.verifyTask(assignmentId, verifiedBy, status, remarks, actualFiles, nextRenewalDate);
        realtimeDataSyncPublisher.publishMutation("ChecklistAssignment", "VERIFY");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/execution-update")
    @RequirePagePermission(pageCode = "QM1120", action = "write")
    @Operation(summary = "Update Checklist Task Execution", description = "Updates execution progress for a checklist assignment")
    public ResponseEntity<ChecklistVerification> executionUpdate(@RequestBody Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("assignmentId") || payload.get("assignmentId") == null) {
            throw new IllegalArgumentException("Assignment ID is required and cannot be null");
        }
        Long assignmentId = Long.valueOf(payload.get("assignmentId").toString());
        String verifiedBy = payload.get("verifiedBy") != null ? payload.get("verifiedBy").toString() : "";
        String status = payload.get("status") != null ? payload.get("status").toString() : "";
        String remarks = payload.getOrDefault("remarks", "") != null ? payload.getOrDefault("remarks", "").toString()
                : "";
        @SuppressWarnings("unchecked")
        List<String> actualFiles = (List<String>) payload.get("actualFiles");
        String nextRenewalDate = payload.get("nextRenewalDate") != null ? payload.get("nextRenewalDate").toString() : null;
        ChecklistVerification res = checklistService.verifyTask(assignmentId, verifiedBy, status, remarks, actualFiles, nextRenewalDate);
        realtimeDataSyncPublisher.publishMutation("ChecklistAssignment", "UPDATE");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/verify-master")
    @RequirePagePermission(pageCode = "QM1110", action = "approval")
    @Operation(summary = "Verify Master Checklist", description = "Approves or rejects a Master Checklist definition")
    public ResponseEntity<MasterChecklist> verifyMaster(
            @RequestBody Map<String, Object> payload,
            @RequestParam(required = false) List<String> departments) {
        if (payload == null) {
            throw new IllegalArgumentException("Payload cannot be null");
        }

        if (payload.containsKey("checkingPoint") || payload.containsKey("seqNo") || payload.containsKey("category")) {
            // It represents checklist registration/save
            MasterChecklist checklist = new MasterChecklist();

            // Map fields from payload to MasterChecklist
            if (payload.get("id") != null) {
                checklist.setId(Long.valueOf(payload.get("id").toString()));
            }
            checklist.setSeqNo((String) payload.get("seqNo"));
            checklist.setCategory((String) payload.get("category"));
            checklist.setCheckingPoint((String) payload.get("checkingPoint"));
            checklist.setFrequency((String) payload.get("frequency"));
            checklist.setDescription((String) payload.get("description"));
            checklist.setVerificationRequired((String) payload.get("verificationRequired"));
            checklist.setStockLink((String) payload.get("stockLink"));
            checklist.setPhotoRequired((String) payload.get("photoRequired"));
            checklist.setDualCheck((String) payload.get("dualCheck"));
            checklist.setCarryForward((String) payload.get("carryForward"));
            checklist.setWeekDays((String) payload.get("weekDays"));

            if (payload.get("repeatEveryValue") != null) {
                checklist.setRepeatEveryValue(Integer.valueOf(payload.get("repeatEveryValue").toString()));
            }
            checklist.setRepeatEveryUnit((String) payload.get("repeatEveryUnit"));

            // Parse dates
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
            try {
                if (payload.get("effectiveFrom") != null) {
                    checklist.setEffectiveFrom(sdf.parse(payload.get("effectiveFrom").toString()));
                }
            } catch (Exception e) {
            }
            try {
                if (payload.get("expiryDate") != null) {
                    checklist.setExpiryDate(sdf.parse(payload.get("expiryDate").toString()));
                }
            } catch (Exception e) {
            }
            try {
                if (payload.get("reminderDate") != null) {
                    checklist.setReminderDate(sdf.parse(payload.get("reminderDate").toString()));
                }
            } catch (Exception e) {
            }

            if (payload.get("reminderDays") != null) {
                checklist.setReminderDays(Long.valueOf(payload.get("reminderDays").toString()));
            }
            checklist.setAmendmentReason((String) payload.get("amendmentReason"));
            checklist.setLevelIds((String) payload.get("levelIds"));
            checklist.setUploadedFiles((String) payload.get("uploadedFiles"));
            checklist.setScannedFiles((String) payload.get("scannedFiles"));
            checklist.setStatus((String) payload.get("status"));

            // Auto assignment mappings
            if (payload.get("primaryEmployee") != null) {
                Map<String, Object> emp = (Map<String, Object>) payload.get("primaryEmployee");
                if (emp.get("id") != null) {
                    EmployeeMaster primary = new EmployeeMaster();
                    primary.setId(Long.valueOf(emp.get("id").toString()));
                    checklist.setPrimaryEmployee(primary);
                }
            }
            if (payload.get("secondaryEmployee") != null) {
                Map<String, Object> emp = (Map<String, Object>) payload.get("secondaryEmployee");
                if (emp.get("id") != null) {
                    EmployeeMaster secondary = new EmployeeMaster();
                    secondary.setId(Long.valueOf(emp.get("id").toString()));
                    checklist.setSecondaryEmployee(secondary);
                }
            }
            if (payload.get("tertiaryEmployee") != null) {
                Map<String, Object> emp = (Map<String, Object>) payload.get("tertiaryEmployee");
                if (emp.get("id") != null) {
                    EmployeeMaster tertiary = new EmployeeMaster();
                    tertiary.setId(Long.valueOf(emp.get("id").toString()));
                    checklist.setTertiaryEmployee(tertiary);
                }
            }
            checklist.setDynamicRuleJson((String) payload.get("dynamicRuleJson"));
            Object pIdObj = payload.get("pageId") != null ? payload.get("pageId") : payload.get("pageCode");
            if (pIdObj != null && !pIdObj.toString().trim().isEmpty()) {
                checklist.setPageId(Integer.valueOf(pIdObj.toString()));
            }
            checklist.setEventTrigger((String) payload.get("eventTrigger"));
            Object oDaysObj = payload.get("offsetDays");
            if (oDaysObj != null && !oDaysObj.toString().trim().isEmpty()) {
                checklist.setOffsetDays(Integer.valueOf(oDaysObj.toString()));
            }
            checklist.setOffsetType((String) payload.get("offsetType"));
            // Set verifyStatus to "To Be Verified" to route it to verification staging
            checklist.setVerifyStatus("To Be Verified");
            MasterChecklist saved = checklistService.saveMasterChecklist(checklist, departments);
            realtimeDataSyncPublisher.publishMutation("MasterChecklist", "SAVE");
            return ResponseEntity.ok(saved);
        }

        if (!payload.containsKey("checklistId") || payload.get("checklistId") == null) {
            throw new IllegalArgumentException("Checklist ID is required and cannot be null");
        }
        Long checklistId = Long.valueOf(payload.get("checklistId").toString());
        String verifiedBy = payload.get("verifiedBy") != null ? payload.get("verifiedBy").toString() : "";
        String status = payload.get("status") != null ? payload.get("status").toString() : "";
        String remarks = payload.getOrDefault("remarks", "") != null ? payload.getOrDefault("remarks", "").toString()
                : "";
        MasterChecklist verified = checklistService.verifyMasterChecklist(checklistId, verifiedBy, status, remarks);
        realtimeDataSyncPublisher.publishMutation("MasterChecklist", "VERIFY");
        return ResponseEntity.ok(verified);
    }

    @PostMapping("/trigger-notifications")
    @RequirePagePermission(pageCode = "QM1110", action = "write")
    @Operation(summary = "Manual Notification Trigger", description = "Manually triggers the future checklist notifications (for testing)")
    public ResponseEntity<String> triggerNotifications() {
        checklistService.notifyFutureAssignmentsDueToday();
        return ResponseEntity.ok("Notifications triggered successfully.");
    }

    @PostMapping("/trigger-scheduler")
    @RequirePagePermission(pageCode = "QM1110", action = "write")
    @Operation(summary = "Manual Scheduler Trigger", description = "Manually triggers the recurring checklist generation (for testing/maintenance)")
    public ResponseEntity<String> triggerScheduler() {
        schedulerService.generateRecurringAssignments();
        return ResponseEntity.ok("Scheduler triggered successfully. Check logs for details.");
    }

    @PostMapping("/trigger-eod")
    @RequirePagePermission(pageCode = "QM1110", action = "write")
    @Operation(summary = "Manual EOD Trigger", description = "Manually triggers the End-of-Day job: marks old uncompleted tasks as Unresolved (CarryForward=No) or keeps them Pending with incremented counter (CarryForward=Yes)")
    public ResponseEntity<String> triggerEod() {
        schedulerService.processUncompletedChecklists(new java.util.Date());
        return ResponseEntity.ok(
                "EOD job triggered successfully. Old uncompleted checklists have been processed. Check logs for details.");
    }

    @PutMapping("/{id}/scheduler-config")
    @RequirePagePermission(pageCode = "QM1110", action = "write")
    @Operation(summary = "Update Scheduler Config", description = "Updates primary, secondary, and tertiary assignees for a checklist")
    public ResponseEntity<MasterChecklist> updateSchedulerConfig(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        Long primaryId = payload.get("primaryEmployeeId") != null
                ? Long.valueOf(payload.get("primaryEmployeeId").toString())
                : null;
        Long secondaryId = payload.get("secondaryEmployeeId") != null
                ? Long.valueOf(payload.get("secondaryEmployeeId").toString())
                : null;
        Long tertiaryId = payload.get("tertiaryEmployeeId") != null
                ? Long.valueOf(payload.get("tertiaryEmployeeId").toString())
                : null;

        return ResponseEntity.ok(checklistService.saveSchedulerConfig(id, primaryId, secondaryId, tertiaryId));
    }

    @PostMapping("/trigger-reassignment-check")
    @RequirePagePermission(pageCode = "QM1110", action = "write")
    @Operation(summary = "Manual Reassignment Check Trigger", description = "Manually triggers the auto-reassignment check (for testing)")
    public ResponseEntity<String> triggerReassignmentCheck() {
        checklistAutoAssignmentService.runReassignmentCheckForOpenAssignments();
        return ResponseEntity.ok("Reassignment check triggered successfully.");
    }

    @GetMapping("/bootstrap")
    @RequirePagePermission(pageCode = "QM1110", action = "write")
    public ResponseEntity<String> bootstrap() {
        checklistService.seedStatuses();
        return ResponseEntity.ok("QMS Statuses seeded successfully");
    }

    @GetMapping("/unassigned-warnings")
    // @RequirePagePermission(pageCode = "QM1110", action = "read")
    @Operation(summary = "Get Unassigned Checklists Warnings", description = "Retrieves active checklists that have failed auto-assignment and remain unassigned")
    public ResponseEntity<List<MasterChecklist>> getUnassignedWarnings() {
        return ResponseEntity.ok(checklistService.getUnassignedChecklists());
    }

    @GetMapping("/repair-assigned-to")
    @RequirePagePermission(pageCode = "QM1110", action = "write")
    @Operation(summary = "Repair legacy name-based ASSIGNED_TO fields", description = "One-time migration: converts assignedTo values that are employee names to their empCode")
    public ResponseEntity<String> repairAssignedTo() {
        return ResponseEntity.ok(checklistService.repairAssignedToFields());
    }

    @PostMapping("/{id}/close")
    @RequirePagePermission(pageCode = "QM1120", action = "write")
    @Operation(summary = "Close Master Checklist", description = "Closes a Master Checklist indefinitely, stopping future recurrence")
    public ResponseEntity<MasterChecklist> closeChecklist(@PathVariable Long id) {
        return ResponseEntity.ok(checklistService.closeMasterChecklist(id));
    }

    @PutMapping("/assignment/{id}/inactive")
    @RequirePagePermission(pageCode = "QM1110", action = "write")
    @Operation(summary = "Mark Assignment Inactive", description = "Marks a checklist assignment as inactive")
    public ResponseEntity<ChecklistAssignment> markAssignmentInactive(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String remarks = payload.getOrDefault("remarks", "");
        return ResponseEntity.ok(checklistService.markAssignmentInactive(id, remarks));
    }

    @PutMapping("/assignment/{id}/reassign")
    @RequirePagePermission(pageCode = "QM1110", action = "write")
    @Operation(summary = "Reassign Checklist Assignment", description = "Reassigns a checklist assignment to a new employee")
    public ResponseEntity<ChecklistAssignment> reassignAssignment(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String newAssignee = payload.get("newAssignee");
        String remarks = payload.getOrDefault("remarks", "");
        if (newAssignee == null || newAssignee.trim().isEmpty()) {
            throw new IllegalArgumentException("New assignee is required.");
        }
        return ResponseEntity.ok(checklistService.reassignAssignment(id, newAssignee, remarks));
    }

    @GetMapping("/debug-rows")
    public ResponseEntity<Map<String, Object>> getDebugRows(@RequestParam Long checklistId) {
        Map<String, Object> res = new java.util.HashMap<>();
        res.put("assignments", checklistService.getRawAssignmentsForChecklist(checklistId));
        res.put("closed", checklistService.getRawClosedForChecklist(checklistId));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/metadata/distinct-values")
    @Operation(summary = "Get Distinct Values", description = "Fetches distinct values for a given table and column")
    public ResponseEntity<List<Map<String, String>>> getDistinctValues(
            @RequestParam String tableName,
            @RequestParam String columnName) {
        try {
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class, tableName, columnName);
            if (exists == null || exists == 0) {
                return ResponseEntity.badRequest().build();
            }

            String sql = String.format("SELECT DISTINCT CAST(%s AS NVARCHAR(MAX)) FROM %s WHERE %s IS NOT NULL ORDER BY CAST(%s AS NVARCHAR(MAX))",
                columnName, tableName, columnName, columnName);
            List<String> rawValues = jdbcTemplate.queryForList(sql, String.class);
            rawValues.removeIf(v -> v == null || v.trim().isEmpty());
            if (rawValues.size() > 100) {
                rawValues = rawValues.subList(0, 100);
            }

            List<Map<String, String>> result = new ArrayList<>();
            boolean isStatusCol = columnName.toUpperCase().contains("STATUS") || columnName.toUpperCase().endsWith("_ID");
            boolean hasNumeric = false;
            List<Integer> numericIds = new ArrayList<>();
            if (isStatusCol) {
                for (String val : rawValues) {
                    try {
                        numericIds.add(Integer.valueOf(val));
                        hasNumeric = true;
                    } catch (Exception e) {
                    }
                }
            }

            Map<String, String> statusMap = new HashMap<>();
            if (hasNumeric && !numericIds.isEmpty()) {
                String inClause = String.join(",", numericIds.stream().map(String::valueOf).toArray(String[]::new));
                String statusSql = String.format("SELECT ID, NAME FROM AD_STATUS_MASTER WHERE ID IN (%s)", inClause);
                List<Map<String, Object>> statusRows = jdbcTemplate.queryForList(statusSql);
                for (Map<String, Object> row : statusRows) {
                    Object id = row.get("ID");
                    Object name = row.get("NAME");
                    if (id != null && name != null) {
                        statusMap.put(id.toString(), name.toString().trim());
                    }
                }
            }

            for (String val : rawValues) {
                Map<String, String> map = new HashMap<>();
                map.put("value", val);
                if (statusMap.containsKey(val)) {
                    map.put("label", statusMap.get(val));
                } else {
                    map.put("label", val);
                }
                result.add(map);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // --- Checklist Acknowledgement API Endpoints ---

    @GetMapping("/acknowledgement/pending")
    @Operation(summary = "Get Pending Reassignment Acknowledgements", description = "Fetches pending checklist reassignments for current user")
    public ResponseEntity<List<com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement>> getPendingAcknowledgements(
            @RequestParam(value = "currentUser", required = false) String currentUser) {
        String user = currentUser != null && !currentUser.trim().isEmpty() ? currentUser : com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(checklistService.getPendingAcknowledgementsForUser(user));
    }

    @GetMapping("/acknowledgement/all")
    @Operation(summary = "Get All Reassignment Acknowledgements", description = "Fetches all checklist reassignments for current user")
    public ResponseEntity<List<com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement>> getAllAcknowledgements(
            @RequestParam(value = "currentUser", required = false) String currentUser) {
        String user = currentUser != null && !currentUser.trim().isEmpty() ? currentUser : com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(checklistService.getAllAcknowledgementsForUser(user));
    }

    @PostMapping("/acknowledgement/create")
    @RequirePagePermission(pageCode = "QM1110", action = "write")
    @Operation(summary = "Create Reassignment Acknowledgement Request", description = "Initiates reassignment workflow requiring recipient acknowledgement")
    public ResponseEntity<com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement> createAcknowledgement(
            @RequestBody Map<String, Object> payload,
            @RequestParam(value = "currentUser", required = false) String currentUser) {
        String user = currentUser != null && !currentUser.trim().isEmpty() ? currentUser : com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        Long checklistId = Long.valueOf(payload.get("checklistId").toString());
        Long oldAssigneeId = payload.get("oldAssigneeId") != null ? Long.valueOf(payload.get("oldAssigneeId").toString()) : null;
        Long newAssigneeId = Long.valueOf(payload.get("newAssigneeId").toString());
        String memberType = (String) payload.getOrDefault("memberType", "PRIMARY");
        String reason = (String) payload.getOrDefault("reason", "");

        com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement ack = 
            checklistService.createReassignmentAcknowledgement(checklistId, oldAssigneeId, newAssigneeId, memberType, reason, user);
        return ResponseEntity.ok(ack);
    }

    @PostMapping("/acknowledgement/respond")
    @RequirePagePermission(pageCode = "QM1150", action = "read")
    @Operation(summary = "Respond to Checklist Acknowledgement", description = "Accepts or Rejects a pending checklist reassignment")
    public ResponseEntity<com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement> respondAcknowledgement(
            @RequestBody Map<String, Object> payload,
            @RequestParam(value = "currentUser", required = false) String currentUser) {
        String user = currentUser != null && !currentUser.trim().isEmpty() ? currentUser : com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        Long ackId = Long.valueOf(payload.get("id").toString());
        String action = (String) payload.get("action"); // ACCEPTED / REJECTED
        String rejectionReason = (String) payload.getOrDefault("rejectionReason", "");

        com.autonoma.erp.modules.qms.checklist.entity.ChecklistAcknowledgement updated = 
            checklistService.respondToAcknowledgement(ackId, action, rejectionReason, user);
        return ResponseEntity.ok(updated);
    }

}


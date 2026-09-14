package com.autonoma.erp.modules.hr.leave.controller;

import AppUtil.AppConstants;
import com.autonoma.erp.model.admin.UserCredential;

import com.autonoma.erp.modules.hr.leave.entity.LeaveEntry;
import com.autonoma.erp.modules.hr.leave.service.LeaveEntryService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import org.springframework.security.access.AccessDeniedException;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr/leave-entries")
@CrossOrigin(origins = "*")
public class LeaveEntryController {

    @Autowired
    private LeaveEntryService service;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeaveEntryRepository leaveEntryRepo;

    @Autowired
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @Autowired
    private StatusMasterRepository statusMasterRepo;

    private void validateUserAccess(Long targetEmployeeId) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || "SYSTEM".equals(currentUserId)) {
            return; // Allow internal system context
        }

        com.autonoma.erp.model.admin.UserCredential user = userRepository.findById(currentUserId).orElse(null);
        if (user == null) {
            throw new AccessDeniedException("User session not found.");
        }

        // Allow Admin/Boss Admin (additional1 permission on page M2390 / HA1390)
        if (authService.hasPermission(currentUserId, "M2390", "additional1")
                || authService.hasPermission(currentUserId, "HA1390", "additional1")) {
            return;
        }

        if (!targetEmployeeId.equals(user.getEmpId())) {
            throw new AccessDeniedException("Access Denied: You do not have permission to view or modify this employee's records.");
        }
    }

    @GetMapping
    @RequirePagePermission(pageCode = "M2390", action = "read")
    public ResponseEntity<List<LeaveEntry>> getAllLeaveEntries(@RequestParam(value = "self", required = false) Boolean self) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null && !"SYSTEM".equals(currentUserId)) {
            boolean hasCompanyAccess = authService.hasPermission(currentUserId, "M2390", "additional1")
                    || authService.hasPermission(currentUserId, "HA1390", "additional1");
            if (Boolean.TRUE.equals(self) || !hasCompanyAccess) {
                com.autonoma.erp.model.admin.UserCredential user = userRepository.findById(currentUserId).orElse(null);
                if (user != null) {
                    // Return only the logged-in user's active leaves
                    return ResponseEntity.ok(leaveEntryRepo.findByEmployeeIdAndIsActiveTrue(user.getEmpId()));
                }
            }
        }
        return ResponseEntity.ok(service.getAllLeaveEntries());
    }

    @GetMapping("/employee-details/{employeeId}")
    @RequirePagePermission(pageCode = "M2390", action = "read")
    public ResponseEntity<Map<String, Object>> getEmployeeDetails(@PathVariable Long employeeId) {
        try {
            validateUserAccess(employeeId);
            return ResponseEntity.ok(service.getEmployeeDetailsWithBalances(employeeId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
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

    @GetMapping("/on-leave")
    public ResponseEntity<List<Long>> getEmployeeIdsOnLeave(
            @RequestParam("date") @DateTimeFormat(pattern = "yyyy-MM-dd") Date date) {
        return ResponseEntity.ok(service.getEmployeeIdsOnLeave(date));
    }

    @PostMapping("/check")
    @RequirePagePermission(pageCode = "M2390", action = "read")
    public ResponseEntity<?> checkLeaveAvailability(@RequestBody Map<String, Object> req) {
        try {
            Long employeeId = Long.valueOf(req.get("employeeId").toString());
            validateUserAccess(employeeId);
            String leaveType = req.get("leaveType").toString();
            
            Date fromDate = parseDate(req.get("fromDate"));
            Date toDate = parseDate(req.get("toDate"));
            String halfDay = req.get("halfDay").toString();

            return ResponseEntity.ok(service.checkLeaveAvailability(employeeId, leaveType, fromDate, toDate, halfDay));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2390", action = "write")
    public ResponseEntity<?> saveLeaveEntry(@RequestBody Map<String, Object> req) {
        try {
            Long employeeId = Long.valueOf(req.get("employeeId").toString());
            validateUserAccess(employeeId);
            String leaveType = req.get("leaveType").toString();
            
            Date fromDate = parseDate(req.get("fromDate"));
            Date toDate = parseDate(req.get("toDate"));
            String halfDay = req.get("halfDay").toString();
            String reason = req.get("reason") != null ? req.get("reason").toString() : "";
            String filePaths = req.get("filePaths") != null ? req.get("filePaths").toString() : null;
            String source = req.get("source") != null ? req.get("source").toString() : "HRA";

            List<LeaveEntry> saved = service.saveLeaveEntry(employeeId, leaveType, fromDate, toDate, halfDay, reason, filePaths, source);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2390", action = "delete")
    public ResponseEntity<?> deleteLeaveEntry(@PathVariable Long id) {
        try {
            LeaveEntry entry = leaveEntryRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Leave Entry record not found with ID: " + id));
            validateUserAccess(entry.getEmployeeId());
            service.deleteLeaveEntry(id);
            return ResponseEntity.ok(Map.of("message", "Leave entry cancelled and balance credited back successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/verification-list")
    @RequirePagePermission(pageCode = "M2392", action = "read")
    public ResponseEntity<List<LeaveEntry>> getVerificationList(@RequestParam(value = "scope", required = false) String scope) {
        return ResponseEntity.ok(service.getFilteredVerificationList(scope));
    }

    @PostMapping("/{id}/verify")
    @RequirePagePermission(pageCode = "M2392", action = "write")
    public ResponseEntity<?> verifyLeaveEntry(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String newStatus = payload.get("status");
            if (!"Verified".equalsIgnoreCase(newStatus) && !"Rejected".equalsIgnoreCase(newStatus) && !"Pending to Verify".equalsIgnoreCase(newStatus)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid status value. Must be 'Verified', 'Rejected', or 'Pending to Verify'."));
            }
            LeaveEntry entry = leaveEntryRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Leave Entry record not found with ID: " + id));
            
            // Prevent modification if already Verified or Rejected
            if (entry.getStatus() != null && ("Verified".equalsIgnoreCase(entry.getStatus()) || "Rejected".equalsIgnoreCase(entry.getStatus()))) {
                return ResponseEntity.badRequest().body(Map.of("message", "This leave record has already been " + entry.getStatus().toLowerCase() + " and cannot be modified further."));
            }

            String verifier = SecurityUtils.getCurrentUserId();
            Date verificationTime = new Date();
            
            // Resolve and set STATUS_ID from Status Master (creating if not present)
            Long statusId = service.resolveStatusId(newStatus);
            entry.setStatusId(statusId);
            entry.setStatus(newStatus);
            
            if ("Verified".equalsIgnoreCase(newStatus) || "Rejected".equalsIgnoreCase(newStatus)) {
                entry.setVerifiedBy(verifier);
                entry.setVerifiedDate(verificationTime);
            }
            
            // If rejected, restore leave master balances and store reject reason
            if ("Rejected".equalsIgnoreCase(newStatus)) {
                String rejectReason = payload.get("remarks");
                if (rejectReason == null || rejectReason.trim().isEmpty()) {
                    rejectReason = payload.get("rejectReason");
                }
                if (rejectReason == null || rejectReason.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Rejection reason is mandatory when rejecting a leave request."));
                }
                entry.setRejectReason(rejectReason.trim());
                service.creditBackBalance(entry);
            }
            
            LeaveEntry updated = leaveEntryRepo.save(entry);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

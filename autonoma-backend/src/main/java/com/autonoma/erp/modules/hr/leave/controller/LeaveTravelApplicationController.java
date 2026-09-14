package com.autonoma.erp.modules.hr.leave.controller;

import AppUtil.AppConstants;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.modules.hr.leave.entity.LeaveTravelApplication;
import com.autonoma.erp.modules.hr.leave.repository.LeaveTravelApplicationRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository;
import com.autonoma.erp.modules.induction.entity.HrAttachmentPath;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.Map;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository;
import java.util.Optional;

@RestController
@RequestMapping("/api/hr/leave-travel-applications")
@CrossOrigin(origins = "*")
public class LeaveTravelApplicationController {

    @Autowired
    private LeaveTravelApplicationRepository repo;

    @Autowired
    private EmployeeMasterRepository employeeRepo;

    @Autowired
    private DesignationLevelRepository designationLevelRepo;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HrAttachmentPathRepository attachmentRepo;

    @Autowired
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @Autowired
    private StatusMasterRepository statusMasterRepo;

    public Long resolveStatusId(String name) {
        if (name == null || name.trim().isEmpty()) return null;
        String cleanName = name.trim();
        return statusMasterRepo.findByNameIgnoreCase(cleanName)
                .map(sm -> sm.getId())
                .orElseGet(() -> {
                    com.autonoma.erp.modules.platform.common.entity.StatusMaster sm = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                    sm.setName(cleanName);
                    return statusMasterRepo.save(sm).getId();
                });
    }

    private void validateUserAccess(Long targetEmployeeId) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || "SYSTEM".equals(currentUserId)) {
            return;
        }

        UserCredential user = userRepository.findById(currentUserId).orElse(null);
        if (user == null) {
            throw new AccessDeniedException("User session not found.");
        }

        if (authService.hasPermission(currentUserId, "ESC1020", "additional1") || authService.hasPermission(currentUserId, "HA1396", "additional1") || authService.hasPermission(currentUserId, "M2396", "additional1")) {
            return;
        }

        if (!targetEmployeeId.equals(user.getEmpId())) {
            throw new AccessDeniedException("Access Denied: You do not have permission to modify this employee's records.");
        }
    }

    @GetMapping
    @RequirePagePermission(pageCode = "ESC1020", action = "read")
    public ResponseEntity<List<LeaveTravelApplication>> getAllApplications() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null && !"SYSTEM".equals(currentUserId)) {
            boolean hasCompanyAccess = authService.hasPermission(currentUserId, "ESC1020", "additional1");
            if (!hasCompanyAccess) {
                UserCredential user = userRepository.findById(currentUserId).orElse(null);
                if (user != null) {
                    return ResponseEntity.ok(repo.findByEmployeeIdAndIsActiveTrueOrderByIdDesc(user.getEmpId()));
                }
            }
        }
        return ResponseEntity.ok(repo.findByIsActiveTrueOrderByIdDesc());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "ESC1020", action = "write")
    public ResponseEntity<?> saveApplication(@RequestBody Map<String, Object> req) {
        try {
            Long employeeId = Long.valueOf(req.get("employeeId").toString());
            validateUserAccess(employeeId);

            LeaveTravelApplication app;
            if (req.get("id") != null && !req.get("id").toString().isEmpty()) {
                Long id = Long.valueOf(req.get("id").toString());
                app = repo.findById(id).orElseThrow(() -> new RuntimeException("Application not found."));
                if ("Verified".equalsIgnoreCase(app.getStatus())) {
                    throw new RuntimeException("Cannot edit application that is already verified.");
                }
            } else {
                app = new LeaveTravelApplication();
                app.setEmployeeId(employeeId);
            }

            Object descObj = req.get("description");
            if (descObj == null || descObj.toString().trim().isEmpty()) {
                throw new RuntimeException("Description / Travel details cannot be empty.");
            }
            app.setDescription(descObj.toString());
            
            // Handle parsing dates
            Object fromD = req.get("fromDate");
            Object toD = req.get("toDate");
            app.setFromDate(parseDate(fromD));
            app.setToDate(parseDate(toD));

            app.setTotalDays(new BigDecimal(req.get("totalDays").toString()));
            app.setAmount(new BigDecimal(req.get("amount").toString()));
            
            if (req.get("noOfBills") != null && !req.get("noOfBills").toString().trim().isEmpty()) {
                try {
                    app.setNoOfBills(Integer.parseInt(req.get("noOfBills").toString().trim()));
                } catch (Exception e) {
                    app.setNoOfBills(1);
                }
            } else {
                app.setNoOfBills(1);
            }
            
            // Validate LTA Limit according to Designation Level
            EmployeeMaster emp = employeeRepo.findById(employeeId).orElse(null);
            if (emp != null) {
                Long empLevelId = emp.getEmpLevelId();
                Double ltaLimit = null;
                String levelName = null;
                if (empLevelId != null) {
                    Optional<DesignationLevel> dlOpt = designationLevelRepo.findById(empLevelId);
                    if (dlOpt.isPresent()) {
                        ltaLimit = dlOpt.get().getLtaLimit();
                        levelName = dlOpt.get().getLevel();
                    }
                }
                if (ltaLimit == null && emp.getDesignation() != null && emp.getDesignation().getSubCategoryLevel() != null) {
                    String catLvl = emp.getDesignation().getSubCategoryLevel().trim();
                    Optional<DesignationLevel> dlOpt = designationLevelRepo.findByLevel(catLvl);
                    if (dlOpt.isPresent()) {
                        ltaLimit = dlOpt.get().getLtaLimit();
                        levelName = dlOpt.get().getLevel();
                    }
                }
                if (ltaLimit != null && app.getAmount() != null && app.getAmount().doubleValue() > ltaLimit) {
                    throw new RuntimeException(String.format("Claim amount (₹%.2f) exceeds the maximum eligible LTA limit (₹%.2f) for designation level %s.",
                            app.getAmount().doubleValue(), ltaLimit, levelName != null ? levelName : ""));
                }
            }
            
            String statusStr = req.get("status") != null ? req.get("status").toString() : "Pending to Verify";
            app.setStatusId(resolveStatusId(statusStr));

            Object wfObj = req.get("whereFrom") != null ? req.get("whereFrom") : req.get("fromWhere");
            if (wfObj == null) {
                wfObj = req.get("source");
            }
            if (wfObj != null && !wfObj.toString().trim().isEmpty()) {
                String wf = wfObj.toString().trim();
                if (wf.toLowerCase().contains("self care")) {
                    app.setWhereFrom("Employee Self Care");
                } else if (wf.toLowerCase().contains("hra") || wf.toLowerCase().contains("details") || wf.toLowerCase().contains("admin")) {
                    app.setWhereFrom("HRA Module");
                } else {
                    app.setWhereFrom(wf);
                }
            } else if (app.getWhereFrom() == null) {
                app.setWhereFrom("HRA Module");
            }

            if (req.get("filePaths") != null) {
                app.setFilePaths(req.get("filePaths").toString());
            } else {
                app.setFilePaths(null);
            }

            LeaveTravelApplication saved = repo.save(app);
            saveAttachments(saved.getId(), saved.getFilePaths());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/submit")
    @RequirePagePermission(pageCode = "ESC1020", action = "write")
    public ResponseEntity<?> submitForApproval(@PathVariable Long id) {
        try {
            LeaveTravelApplication app = repo.findById(id).orElseThrow(() -> new RuntimeException("Application not found."));
            validateUserAccess(app.getEmployeeId());
            app.setStatusId(resolveStatusId("Pending to Verify"));
            
            LeaveTravelApplication saved = repo.save(app);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "ESC1020", action = "delete")
    public ResponseEntity<?> deleteApplication(@PathVariable Long id) {
        try {
            LeaveTravelApplication app = repo.findById(id).orElseThrow(() -> new RuntimeException("Application not found."));
            validateUserAccess(app.getEmployeeId());
            repo.delete(app);
            return ResponseEntity.ok(Map.of("message", "Application cancelled successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/verification-list")
    @RequirePagePermission(pageCode = "HA1394", action = "read")
    public ResponseEntity<List<LeaveTravelApplication>> getVerificationList() {
        return ResponseEntity.ok(repo.findByIsActiveTrueOrderByIdDesc());
    }

    @PostMapping("/{id}/verify")
    @RequirePagePermission(pageCode = "HA1394", action = "write")
    public ResponseEntity<?> verifyApplication(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String newStatus = payload.get("status");
            if (!"Verified".equalsIgnoreCase(newStatus) && !"Rejected".equalsIgnoreCase(newStatus) && !"Pending to Verify".equalsIgnoreCase(newStatus)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid status value. Must be 'Verified', 'Rejected', or 'Pending to Verify'."));
            }
            LeaveTravelApplication app = repo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Leave Travel Application record not found with ID: " + id));

            if (app.getStatus() != null && ("Verified".equalsIgnoreCase(app.getStatus()) || "Rejected".equalsIgnoreCase(app.getStatus()))) {
                return ResponseEntity.badRequest().body(Map.of("message", "This record has already been " + app.getStatus().toLowerCase() + " and cannot be modified further."));
            }

            String verifier = SecurityUtils.getCurrentUserId();
            Date verificationTime = new Date();

            Long statusId = resolveStatusId(newStatus);
            app.setStatusId(statusId);

            if ("Verified".equalsIgnoreCase(newStatus) || "Rejected".equalsIgnoreCase(newStatus)) {
                app.setVerifiedBy(verifier);
                app.setVerifiedDate(verificationTime);
            }

            if ("Rejected".equalsIgnoreCase(newStatus)) {
                String rejectReason = payload.get("remarks");
                if (rejectReason == null || rejectReason.trim().isEmpty()) {
                    rejectReason = payload.get("rejectReason");
                }
                if (rejectReason == null || rejectReason.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Rejection reason is mandatory when rejecting a request."));
                }
                app.setRejectReason(rejectReason.trim());
            }

            LeaveTravelApplication updated = repo.save(app);
            return ResponseEntity.ok(updated);
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

    private void saveAttachments(Long ltaId, String filePaths) {
        attachmentRepo.deleteByPageCodeAndRefIdAndDocType("ESC1020", ltaId, "LTA_ATTACHMENT");
        if (filePaths != null && !filePaths.trim().isEmpty()) {
            String currentUser = SecurityUtils.getCurrentUserId();
            if (currentUser == null) currentUser = "SYSTEM";
            String[] paths = filePaths.split(",");
            for (String filePath : paths) {
                if (filePath.trim().isEmpty()) continue;
                HrAttachmentPath path = new HrAttachmentPath();
                path.setPageCode("ESC1020");
                path.setRefId(ltaId);
                path.setDocType("LTA_ATTACHMENT");
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
    }
}

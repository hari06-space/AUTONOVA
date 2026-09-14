package com.autonoma.erp.controller.admin;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.platform.files.entity.FileTraceabilityManagement;
import com.autonoma.erp.modules.platform.files.repository.FileTraceabilityManagementRepository;
import com.autonoma.erp.model.admin.BosPage;
import com.autonoma.erp.repository.admin.BosPageRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/file-traceability")
@CrossOrigin(origins = "*")
@Tag(name = "Admin - File Traceability Hub", description = "Endpoints for tracking exported report files across pages")
public class FileTraceabilityManagementController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FileTraceabilityManagementController.class);

    @Autowired
    private FileTraceabilityManagementRepository fileTraceabilityManagementRepository;

    @Autowired
    private BosPageRepository bosPageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @GetMapping
    @Operation(summary = "Get All File Traceability Records", description = "Fetches a complete list of logged exported files")
    public List<FileTraceabilityManagement> getAllLogs() {
        log.info("Fetching all file traceability logs");
        List<FileTraceabilityManagement> logs = fileTraceabilityManagementRepository.findAllByOrderByCreatedAtDesc();
        try {
            List<UserCredential> users = userRepository.findAll();
            Map<String, UserCredential> userMap = new java.util.HashMap<>();
            for (UserCredential u : users) {
                if (u.getUserId() != null) {
                    userMap.put(u.getUserId().toLowerCase(), u);
                }
            }
            
            List<EmployeeMaster> employees = employeeMasterRepository.findAll();
            Map<Long, EmployeeMaster> empMap = new java.util.HashMap<>();
            for (EmployeeMaster e : employees) {
                if (e.getId() != null) {
                    empMap.put(e.getId(), e);
                }
            }
            
            for (FileTraceabilityManagement logEntry : logs) {
                String createdBy = logEntry.getCreatedBy();
                if (createdBy != null) {
                    UserCredential userCred = userMap.get(createdBy.toLowerCase());
                    if (userCred != null) {
                        logEntry.setCreatorImg(userCred.getImgName());
                        if (userCred.getEmpId() != null) {
                            EmployeeMaster emp = empMap.get(userCred.getEmpId());
                            if (emp != null) {
                                logEntry.setCreatorName(emp.getEmployeeName());
                            } else {
                                logEntry.setCreatorName(createdBy);
                            }
                        } else {
                            logEntry.setCreatorName(createdBy);
                        }
                    } else {
                        logEntry.setCreatorName(createdBy);
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Error populating creator details for logs", ex);
        }
        return logs;
    }

    @PostMapping


    @RequirePagePermission(pageCode = "AD1170", action = "write")
    @Operation(summary = "Log Export Event", description = "Stores information when a user exports a file (excel or pdf)")
    public ResponseEntity<?> logExport(@RequestBody Map<String, Object> payload) {
        log.info("Logging export event with payload: {}", payload);
        try {
            String pageCode = payload.get("pageCode") != null ? String.valueOf(payload.get("pageCode")) : null;
            String pageName = payload.get("pageName") != null ? String.valueOf(payload.get("pageName")) : null;
            String reportName = payload.get("reportName") != null ? String.valueOf(payload.get("reportName")) : null;
            String createdBy = payload.get("createdBy") != null ? String.valueOf(payload.get("createdBy")) : (payload.get("createdUser") != null ? String.valueOf(payload.get("createdUser")) : null);
            Object rawFilePath = payload.get("filePath");
            String filePath = null;
            if (rawFilePath instanceof String) {
                filePath = (String) rawFilePath;
            } else if (rawFilePath instanceof Map) {
                Map<?, ?> mapPath = (Map<?, ?>) rawFilePath;
                Object pathObj = mapPath.get("filePath") != null ? mapPath.get("filePath") : (mapPath.get("path") != null ? mapPath.get("path") : mapPath.get("fileUrl"));
                filePath = pathObj != null ? String.valueOf(pathObj) : mapPath.toString();
            } else if (rawFilePath != null) {
                filePath = String.valueOf(rawFilePath);
            }

            Integer finalPageId = null;
            String finalPageName = pageName;

            // Step 1: Auto-fetch from DB using dynamic matching on pageName
            if (pageName != null && !pageName.trim().isEmpty()) {
                List<BosPage> allPages = bosPageRepository.findAll();
                BosPage bestMatch = null;
                String lowerFrontendName = pageName.toLowerCase();

                for (BosPage page : allPages) {
                    if (page.getPageName() == null) continue;
                    String dbName = page.getPageName().toLowerCase();

                    // Exact match
                    if (lowerFrontendName.equals(dbName)) {
                        bestMatch = page;
                        break;
                    }

                    // Partial match: e.g., "audit type details master" contains "audit type"
                    if (lowerFrontendName.contains(dbName)) {
                        if (bestMatch == null || page.getPageName().length() > bestMatch.getPageName().length()) {
                            bestMatch = page;
                        }
                    }
                }

                if (bestMatch != null) {
                    finalPageId = bestMatch.getPageId();
                    finalPageName = bestMatch.getPageName();
                }
            }

            // Step 2: Fallback to pageCode if still not found
            if (finalPageId == null && pageCode != null && !pageCode.trim().isEmpty() && !pageCode.equals("M_DF_01")) {
                Optional<BosPage> bosPage = bosPageRepository.findByPageCode(pageCode);
                if (bosPage.isPresent()) {
                    finalPageId = bosPage.get().getPageId();
                    finalPageName = bosPage.get().getPageName();
                }
            }

            // Fallback to payload pageId
            if (finalPageId == null) {
                if (payload.get("pageId") != null) {
                    try {
                        finalPageId = Integer.parseInt(payload.get("pageId").toString());
                    } catch (NumberFormatException e) {
                        log.warn("Invalid pageId format: {}", payload.get("pageId"));
                    }
                }
            }

            FileTraceabilityManagement traceLog = new FileTraceabilityManagement();
            traceLog.setPageId(finalPageId);
            
            traceLog.setPageName(finalPageName != null ? finalPageName : pageName);
            traceLog.setReportName(reportName);
            traceLog.setFilePath(filePath);
            
            if (createdBy != null && !createdBy.trim().isEmpty()) {
                traceLog.setCreatedBy(createdBy);
            }

            FileTraceabilityManagement savedLog = fileTraceabilityManagementRepository.save(traceLog);
            return ResponseEntity.ok(savedLog);
        } catch (Exception e) {
            log.error("Error logging export event", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

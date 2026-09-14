package com.autonoma.erp.modules.hr.employee.controller;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMemo;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeManagerMapping;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMemoRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.model.admin.PrefixCredential;
import com.autonoma.erp.repository.admin.PrefixCredentialRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.service.admin.EmailSendingService;
import com.autonoma.erp.util.SecurityUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/hr/employee/memo")
@Slf4j
public class EmployeeMemoController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EmployeeMemoController.class);

    @Autowired
    private EmployeeMemoRepository employeeMemoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private EmployeeManagerMappingRepository employeeManagerMappingRepository;

    @Autowired
    private PrefixCredentialRepository prefixCredentialRepository;

    @Autowired
    private EmailSendingService emailSendingService;

    @GetMapping("/prefixes")
    public ResponseEntity<List<PrefixCredential>> getAllPrefixes() {
        log.info("Fetching all prefix configuration records");
        return ResponseEntity.ok(prefixCredentialRepository.findAll());
    }

    @GetMapping("/generate-number")
    public ResponseEntity<Map<String, String>> generateMemoNumber() {
        log.info("Generating next unique Memo Number");

        String prefix = "MEM";
        String suffix = "";
        int digit = 4;

        String memoNumberPattern = prefix + "%" + suffix;
        List<EmployeeMemo> memos = employeeMemoRepository.findByMemoNumberStartingWith(prefix);
        int nextId = 1;
        if (!memos.isEmpty()) {
            for (EmployeeMemo memo : memos) {
                String numStr = memo.getMemoNumber();
                if (numStr.startsWith(prefix) && numStr.endsWith(suffix)) {
                    try {
                        String middle = numStr.substring(prefix.length(), numStr.length() - suffix.length());
                        int currentVal = Integer.parseInt(middle);
                        if (currentVal >= nextId) {
                            nextId = currentVal + 1;
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }

        String formattedNum = String.format("%0" + digit + "d", nextId);
        String finalMemoNumber = prefix + formattedNum + suffix;

        Map<String, String> response = new HashMap<>();
        response.put("memoNumber", finalMemoNumber);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<EmployeeMemo>> getMemos(
            @RequestParam(value = "employeeId", required = false) Long employeeId,
            @RequestParam(value = "memoType", required = false) String memoType) {
        log.info("Fetching employee memos. EmployeeId: {}, MemoType: {}", employeeId, memoType);

        // Handle "null" or empty strings sent by frontend parameter bindings
        Long filteredEmpId = employeeId;
        String filteredMemoType = (memoType != null && !memoType.trim().isEmpty() && !"All".equalsIgnoreCase(memoType))
                ? memoType
                : null;

        List<EmployeeMemo> memos = employeeMemoRepository.findFiltered(filteredEmpId, filteredMemoType);
        populateCreatedByName(memos);
        return ResponseEntity.ok(memos);
    }

    @PostMapping
    public ResponseEntity<?> createMemo(@RequestBody EmployeeMemo memoRequest) {
        log.info("Creating new Employee Memo: {}", memoRequest);

        if (memoRequest.getEmployee() == null || memoRequest.getEmployee().getId() == null) {
            return ResponseEntity.badRequest().body("Employee ID is required");
        }

        Optional<EmployeeMaster> employeeOpt = employeeMasterRepository.findById(memoRequest.getEmployee().getId());
        if (!employeeOpt.isPresent()) {
            return ResponseEntity.badRequest().body("Invalid Employee ID");
        }

        EmployeeMaster employee = employeeOpt.get();
        memoRequest.setEmployee(employee);

        // Standardize Audit columns
        String currentUser = SecurityUtils.getCurrentUserId();
        if (currentUser == null || currentUser.trim().isEmpty()) {
            currentUser = "Admin";
        }
        memoRequest.setCreatedBy(currentUser);
        memoRequest.setCreatedDate(new Date());
        memoRequest.setStatus("DRAFT");

        // Generate memo number on save to guarantee uniqueness and avoid race conditions
        ResponseEntity<Map<String, String>> numberRes = generateMemoNumber();
        if (numberRes.getBody() != null) {
            memoRequest.setMemoNumber(numberRes.getBody().get("memoNumber"));
        }

        EmployeeMemo savedMemo = employeeMemoRepository.save(memoRequest);
        log.info("Employee Memo saved as DRAFT: {}", savedMemo.getMemoNumber());

        populateCreatedByName(Collections.singletonList(savedMemo));
        return ResponseEntity.ok(savedMemo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMemo(@PathVariable Long id) {
        log.info("Deleting Employee Memo with ID: {}", id);
        Optional<EmployeeMemo> memoOpt = employeeMemoRepository.findById(id);
        if (!memoOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        employeeMemoRepository.delete(memoOpt.get());
        return ResponseEntity.ok(Map.of("message", "Employee Memo deleted successfully"));
    }

    @PostMapping({"/{id}/send", "/{id}/resend", "/send/{id}", "/resend/{id}"})
    public ResponseEntity<?> resendMemo(@PathVariable Long id) {
        log.info("Sending Employee Memo email for ID: {}", id);
        Optional<EmployeeMemo> memoOpt = employeeMemoRepository.findById(id);
        if (!memoOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        EmployeeMemo memo = memoOpt.get();
        String toEmail = memo.getToEmail();
        String fromEmail = memo.getFromEmail();
        String ccEmail = memo.getCcEmail();
        String subject = memo.getSubject();
        String empName = memo.getEmployee() != null ? memo.getEmployee().getEmployeeName() : "Employee";
        String memoType = memo.getMemoType() != null ? memo.getMemoType() : "Employee Memo";
        
        String bodyHtml = "<div style=\"font-family: Arial, sans-serif; color: #1e293b; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;\">"
                + "<div style=\"background-color: #0f172a; color: #ffffff; padding: 16px 20px; font-size: 18px; font-weight: bold;\">"
                + "OFFICIAL EMPLOYEE MEMO — " + memoType.toUpperCase()
                + "</div>"
                + "<div style=\"padding: 20px;\">"
                + "<p style=\"font-size: 15px;\">Dear <strong>" + empName + "</strong>,</p>"
                + "<div style=\"background-color: #f8fafc; border-left: 4px solid #1e3a8a; padding: 12px 16px; margin: 16px 0;\">"
                + "<strong style=\"color: #0f172a;\">Subject / Reason:</strong> " + (subject != null ? subject : "-")
                + "</div>"
                + "<div style=\"margin: 16px 0;\">"
                + "<strong style=\"color: #0f172a; display: block; margin-bottom: 6px;\">Detailed Description:</strong>"
                + "<div style=\"background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; font-size: 14px; line-height: 1.6;\">"
                + (memo.getBody() != null ? memo.getBody() : "-")
                + "</div>"
                + "</div>";

        if (memo.getClosingRemarks() != null && !memo.getClosingRemarks().trim().isEmpty()) {
            bodyHtml += "<div style=\"margin-top: 20px; font-style: italic; color: #475569;\">"
                    + "<strong>Closing Remarks:</strong><br/>"
                    + memo.getClosingRemarks().replace("\n", "<br/>")
                    + "</div>";
        }

        bodyHtml += "<p style=\"margin-top: 25px; font-size: 13px; color: #64748b;\">We anticipate your positive and constructive approach ahead.</p>"
                + "<hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;\"/>"
                + "<p style=\"font-size: 12px; color: #94a3b8;\">Nutech Autonoma | Official HR Communication</p>"
                + "</div></div>";

        boolean mailSent = false;
        try {
            mailSent = emailSendingService.sendEmailWithAttachments(toEmail, ccEmail, null, subject, bodyHtml, null);
        } catch (Exception ex) {
            log.error("Error sending memo email for ID {}: {}", id, ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "message", ex.getMessage() != null && !ex.getMessage().trim().isEmpty() 
                                ? ex.getMessage() 
                                : "Failed to dispatch email to " + (toEmail != null ? toEmail : "recipient") + ". Please check SMTP credentials in Company Profile (/admin/company-profile).",
                        "mailSent", false
                    ));
        }
        log.info("Memo email sent for ID {} (from: {}): {}", id, fromEmail, mailSent);

        if (!mailSent) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "message", "Failed to dispatch email to " + (toEmail != null ? toEmail : "recipient") + ". Please check SMTP credentials in Company Profile (/admin/company-profile).",
                        "mailSent", false
                    ));
        }

        memo.setStatus("SENT");
        employeeMemoRepository.save(memo);

        String successMessage = "SENT".equalsIgnoreCase(memo.getStatus())
                ? "Memo re-sent to " + (toEmail != null ? toEmail : "recipient") + " successfully!"
                : "Memo sent to " + (toEmail != null ? toEmail : "recipient") + " successfully!";

        return ResponseEntity.ok(Map.of(
            "message", successMessage,
            "mailSent", true
        ));
    }

    private void populateCreatedByName(List<EmployeeMemo> memos) {
        populateMemoMetadata(memos);
    }

    private void populateMemoMetadata(List<EmployeeMemo> memos) {
        if (memos == null || memos.isEmpty()) return;

        // Cache resolved user display names to avoid duplicate DB hits
        Map<String, String> userNamesMap = new HashMap<>();
        // Cache resolved employee names by employee PK to avoid duplicate DB hits
        Map<Long, String> empNameCache = new HashMap<>();

        for (EmployeeMemo memo : memos) {

            // --- 1. Resolve createdByName ---
            String createdBy = memo.getCreatedBy();
            if (createdBy == null || createdBy.trim().isEmpty()) createdBy = "Admin";
            if (userNamesMap.containsKey(createdBy)) {
                memo.setCreatedByName(userNamesMap.get(createdBy));
            } else {
                String resolvedName = createdBy;
                Optional<UserCredential> ucOpt = userRepository.findById(createdBy);
                if (ucOpt.isPresent() && ucOpt.get().getEmpId() != null) {
                    Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(ucOpt.get().getEmpId());
                    if (empOpt.isPresent()) {
                        resolvedName = empOpt.get().getEmployeeName() + " (" + createdBy + ")";
                        empNameCache.put(ucOpt.get().getEmpId(), empOpt.get().getEmployeeName());
                    }
                }
                userNamesMap.put(createdBy, resolvedName);
                memo.setCreatedByName(resolvedName);
            }

            // --- 2. Resolve Reporting Manager & HR Rep from manager mapping ---
            if (memo.getEmployee() == null) continue;
            Long empId = memo.getEmployee().getId();
            if (empId == null) continue;

            Optional<EmployeeManagerMapping> mappingOpt = employeeManagerMappingRepository.findByEmpId(empId);
            if (!mappingOpt.isPresent()) continue;

            EmployeeManagerMapping mapping = mappingOpt.get();

            // Reporting Manager — VERTICAL_HEAD_ID or HOME_MANAGER_ID or BUSINESS_MANAGER_ID
            Long mgrId = mapping.getVerticalHeadId() != null ? mapping.getVerticalHeadId()
                       : (mapping.getHomeManagerId() != null ? mapping.getHomeManagerId() : mapping.getBusinessManagerId());
            if (mgrId != null) {
                employeeMasterRepository.findById(mgrId).ifPresent(mgr -> {
                    memo.setReportingManagerName(mgr.getEmployeeName());
                    memo.setReportingManagerSignatureUpload(mgr.getEmployeeSignatureUpload());
                });
            }

            // HR Representative — HR_ID
            if (mapping.getHrId() != null) {
                employeeMasterRepository.findById(mapping.getHrId()).ifPresent(hr -> {
                    memo.setHrRepresentativeName(hr.getEmployeeName());
                    memo.setHrRepresentativeSignatureUpload(hr.getEmployeeSignatureUpload());
                });
            }
        }
    }
}

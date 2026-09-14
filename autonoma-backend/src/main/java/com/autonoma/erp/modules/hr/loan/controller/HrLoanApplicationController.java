package com.autonoma.erp.modules.hr.loan.controller;

import com.autonoma.erp.modules.hr.loan.entity.HrLoanApplication;
import com.autonoma.erp.modules.hr.loan.entity.HrLoanIssue;
import com.autonoma.erp.modules.hr.loan.repository.HrLoanApplicationRepository;
import com.autonoma.erp.modules.hr.loan.repository.HrLoanIssueRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;
import AppUtil.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/master/hr/payroll/loan-applications")
@CrossOrigin(origins = "*")
public class HrLoanApplicationController {

    @Autowired
    private HrLoanApplicationRepository loanApplicationRepository;

    @Autowired
    private HrLoanIssueRepository loanIssueRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private EmployeeManagerMappingRepository managerMappingRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @GetMapping
    @RequirePagePermission(pageCode = "QM1410", action = "read")
    public List<HrLoanApplication> getAll() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null && !"SYSTEM".equals(currentUserId)) {
            boolean hasCompanyAccess = authService.hasPermission(currentUserId, "QM1410", "additional1");
            if (!hasCompanyAccess) {
                com.autonoma.erp.model.admin.UserCredential user = userRepository.findById(currentUserId).orElse(null);
                if (user != null) {
                    if (user.getEmpId() != null) {
                        java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = employeeMasterRepository.findById(user.getEmpId());
                        if (empOpt.isPresent()) {
                            return loanApplicationRepository.findByEmpCodeAndIsActiveTrue(empOpt.get().getEmpCode());
                        }
                    }
                    return loanApplicationRepository.findByEmpCodeAndIsActiveTrue(user.getUserId());
                }
            }
        }
        return loanApplicationRepository.findByIsActiveTrue();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HrLoanApplication> getById(@PathVariable Long id) {
        return loanApplicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "QM1410", action = "write")
    public ResponseEntity<?> create(@RequestBody HrLoanApplication loanApplication) {
        try {
            loanApplication.setStatus("PENDING FOR VERIFIED");
            HrLoanApplication saved = loanApplicationRepository.save(loanApplication);
            sendLoanNotifications(saved.getEmpCode(), saved.getLoanCode(), saved.getLoanAmt(), "SUBMIT", null);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to apply for loan: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1410", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody HrLoanApplication details) {
        return loanApplicationRepository.findById(id)
                .map(loanApplication -> {
                    String oldStatus = loanApplication.getStatus();
                    loanApplication.setEmpCode(details.getEmpCode());
                    loanApplication.setEmployeeName(details.getEmployeeName());
                    loanApplication.setLoanCode(details.getLoanCode());
                    loanApplication.setLoanAmt(details.getLoanAmt());
                    loanApplication.setRepayLoanAmt(details.getRepayLoanAmt());
                    loanApplication.setIssueDate(details.getIssueDate());
                    loanApplication.setNoOfMonths(details.getNoOfMonths());
                    loanApplication.setInstallmentAmt(details.getInstallmentAmt());
                    loanApplication.setStartYear(details.getStartYear());
                    loanApplication.setStartMonth(details.getStartMonth());
                    loanApplication.setEndYear(details.getEndYear());
                    loanApplication.setEndMonth(details.getEndMonth());
                    loanApplication.setStatus(details.getStatus());
                    loanApplication.setReason(details.getReason());
                    loanApplication.setRejectReason(details.getRejectReason());
                    loanApplication.setRequestedDetails(details.getRequestedDetails());
                    loanApplication.setRequestDate(details.getRequestDate());
                    loanApplication.setCreatedDate(details.getCreatedDate());
                    loanApplication.setCurrencyCode(details.getCurrencyCode());
                    loanApplication.setUpdatedBy(SecurityUtils.getCurrentUserId());
                    HrLoanApplication saved = loanApplicationRepository.save(loanApplication);

                    if ("PENDING FOR VERIFIED".equalsIgnoreCase(saved.getStatus()) && !"PENDING FOR VERIFIED".equalsIgnoreCase(oldStatus)) {
                        sendLoanNotifications(saved.getEmpCode(), saved.getLoanCode(), saved.getLoanAmt(), "SUBMIT", null);
                    }
                    return ResponseEntity.ok(saved);
                }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/verify")
    @RequirePagePermission(pageCode = "QM1420", action = "write")
    public ResponseEntity<?> verifyLoan(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String action = payload.get("action");
        String remarks = payload.get("remarks");
        return loanApplicationRepository.findById(id)
                .map(loanApplication -> {
                    if ("APPROVE".equalsIgnoreCase(action)) {
                        loanApplication.setStatus("OPEN");
                        loanApplication.setRejectReason(null);
                        
                        // Create actual loan issue record
                        HrLoanIssue issue = new HrLoanIssue();
                        issue.setEmpCode(loanApplication.getEmpCode());
                        issue.setLoanCode(loanApplication.getLoanCode());
                        issue.setLoanAmt(loanApplication.getLoanAmt());
                        issue.setRepayLoanAmt(loanApplication.getRepayLoanAmt());
                        issue.setIssueDate(loanApplication.getIssueDate());
                        issue.setNoOfMonths(loanApplication.getNoOfMonths());
                        issue.setInstallmentAmt(loanApplication.getInstallmentAmt());
                        issue.setStartYear(loanApplication.getStartYear());
                        issue.setStartMonth(loanApplication.getStartMonth());
                        issue.setEndYear(loanApplication.getEndYear());
                        issue.setEndMonth(loanApplication.getEndMonth());
                        issue.setStatus("OPEN");
                        issue.setVerificationStatus("APPROVED");
                        issue.setReason(loanApplication.getReason());
                        issue.setRequestedDetails(loanApplication.getRequestedDetails());
                        issue.setRequestDate(loanApplication.getRequestDate());
                        issue.setCurrencyCode(loanApplication.getCurrencyCode());
                        issue.setIsActive(true);
                        
                        loanIssueRepository.save(issue);
                        sendLoanNotifications(loanApplication.getEmpCode(), loanApplication.getLoanCode(), loanApplication.getLoanAmt(), "APPROVE", null);
                    } else if ("REJECT".equalsIgnoreCase(action)) {
                        loanApplication.setStatus("REJECTED");
                        loanApplication.setRejectReason(remarks);
                        sendLoanNotifications(loanApplication.getEmpCode(), loanApplication.getLoanCode(), loanApplication.getLoanAmt(), "REJECT", remarks);
                    }
                    loanApplication.setUpdatedBy(SecurityUtils.getCurrentUserId());
                    return ResponseEntity.ok(loanApplicationRepository.save(loanApplication));
                }).orElse(ResponseEntity.notFound().build());
    }

    private void sendLoanNotifications(String empCode, String loanCode, Double amount, String actionType, String rejectReason) {
        try {
            employeeMasterRepository.findByEmpCodeIgnoreCase(empCode).ifPresent(emp -> {
                String amountStr = amount != null ? String.valueOf(amount) : "0";
                
                if ("SUBMIT".equalsIgnoreCase(actionType)) {
                    // 1. Notify applicant
                    String title = "Loan Application Submitted: " + loanCode;
                    String message = String.format("Your loan application for ₹%s has been submitted and is pending verification.", amountStr);
                    notificationService.notifyUserAboutLoan(emp, title, message, "/employee-self-care/loan-apply");

                    // 2. Notify vertical head/manager
                    managerMappingRepository.findByEmpIdAndStatus(emp.getId(), "Active").ifPresent(mapping -> {
                        if (mapping.getVerticalHeadId() != null) {
                            employeeMasterRepository.findById(mapping.getVerticalHeadId()).ifPresent(manager -> {
                                String mTitle = "Loan Verification Pending: " + empCode;
                                String mMessage = String.format("A loan request of ₹%s from %s is pending your verification.", amountStr, emp.getEmployeeName());
                                notificationService.notifyUserAboutLoan(manager, mTitle, mMessage, "/hra/payroll/loan-verification");
                            });
                        }
                    });
                } else if ("APPROVE".equalsIgnoreCase(actionType)) {
                    // Notify applicant
                    String title = "Loan Application Verified: " + loanCode;
                    String message = String.format("Your loan application for ₹%s has been verified and approved.", amountStr);
                    notificationService.notifyUserAboutLoan(emp, title, message, "/employee-self-care/loan-apply");
                } else if ("REJECT".equalsIgnoreCase(actionType)) {
                    // Notify applicant
                    String title = "Loan Application Rejected: " + loanCode;
                    String rejectMsg = rejectReason != null ? " Reason: " + rejectReason : "";
                    String message = String.format("Your loan application for ₹%s has been rejected.%s", amountStr, rejectMsg);
                    notificationService.notifyUserAboutLoan(emp, title, message, "/employee-self-care/loan-apply");
                }
            });
        } catch (Exception e) {
            System.err.println("Failed to send loan notifications: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1410", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return loanApplicationRepository.findById(id)
                .map(loanApplication -> {
                    loanApplication.setIsActive(false);
                    loanApplication.setUpdatedBy(SecurityUtils.getCurrentUserId());
                    loanApplicationRepository.save(loanApplication);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }
}

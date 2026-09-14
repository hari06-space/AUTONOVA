package com.autonoma.erp.modules.hr.loan.controller;

import com.autonoma.erp.modules.hr.loan.entity.HrLoanIssue;
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

@RestController
@RequestMapping("/api/master/hr/payroll/loan-issues")
@CrossOrigin(origins = "*")
public class HrLoanIssueController {

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
    @RequirePagePermission(pageCode = "QM1430", action = "read")
    public List<HrLoanIssue> getAll() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null && !"SYSTEM".equals(currentUserId)) {
            boolean hasCompanyAccess = authService.hasPermission(currentUserId, "QM1430", "additional1");
            if (!hasCompanyAccess) {
                com.autonoma.erp.model.admin.UserCredential user = userRepository.findById(currentUserId).orElse(null);
                if (user != null) {
                    if (user.getEmpId() != null) {
                        java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = employeeMasterRepository.findById(user.getEmpId());
                        if (empOpt.isPresent()) {
                            return loanIssueRepository.findByEmpCodeAndIsActiveTrue(empOpt.get().getEmpCode());
                        }
                    }
                    return loanIssueRepository.findByEmpCodeAndIsActiveTrue(user.getUserId());
                }
            }
        }
        return loanIssueRepository.findByIsActiveTrue();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HrLoanIssue> getById(@PathVariable Long id) {
        return loanIssueRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "QM1430", action = "write")
    public ResponseEntity<?> create(@RequestBody HrLoanIssue loanIssue) {
        try {
            HrLoanIssue saved = loanIssueRepository.save(loanIssue);
            if ("PENDING FOR VERIFIED".equalsIgnoreCase(saved.getStatus())) {
                sendLoanNotifications(saved.getEmpCode(), saved.getLoanCode(), saved.getLoanAmt(), "SUBMIT", null);
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to issue loan: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1430", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody HrLoanIssue details) {
        return loanIssueRepository.findById(id)
                .map(loanIssue -> {
                    String oldStatus = loanIssue.getStatus();
                    loanIssue.setEmpCode(details.getEmpCode());
                    loanIssue.setEmployeeName(details.getEmployeeName());
                    loanIssue.setLoanCode(details.getLoanCode());
                    loanIssue.setLoanAmt(details.getLoanAmt());
                    loanIssue.setRepayLoanAmt(details.getRepayLoanAmt());
                    loanIssue.setIssueDate(details.getIssueDate());
                    loanIssue.setNoOfMonths(details.getNoOfMonths());
                    loanIssue.setInstallmentAmt(details.getInstallmentAmt());
                    loanIssue.setStartYear(details.getStartYear());
                    loanIssue.setStartMonth(details.getStartMonth());
                    loanIssue.setEndYear(details.getEndYear());
                    loanIssue.setEndMonth(details.getEndMonth());
                    loanIssue.setStatus(details.getStatus());
                    loanIssue.setVerificationStatus(details.getVerificationStatus());
                    loanIssue.setReason(details.getReason());
                    loanIssue.setRejectReason(details.getRejectReason());
                    loanIssue.setRequestedDetails(details.getRequestedDetails());
                    loanIssue.setRequestDate(details.getRequestDate());
                    loanIssue.setCreatedDate(details.getCreatedDate());
                    loanIssue.setCurrencyCode(details.getCurrencyCode());
                    loanIssue.setUpdatedBy(SecurityUtils.getCurrentUserId());
                    HrLoanIssue saved = loanIssueRepository.save(loanIssue);

                    if ("PENDING FOR VERIFIED".equalsIgnoreCase(saved.getStatus()) && !"PENDING FOR VERIFIED".equalsIgnoreCase(oldStatus)) {
                        sendLoanNotifications(saved.getEmpCode(), saved.getLoanCode(), saved.getLoanAmt(), "SUBMIT", null);
                    }
                    return ResponseEntity.ok(saved);
                }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/verify")
    @RequirePagePermission(pageCode = "QM1420", action = "write")
    public ResponseEntity<?> verifyLoan(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        String action = payload.get("action");
        String remarks = payload.get("remarks");
        return loanIssueRepository.findById(id)
                .map(loanIssue -> {
                    if ("APPROVE".equalsIgnoreCase(action)) {
                        loanIssue.setStatus("OPEN");
                        loanIssue.setVerificationStatus("APPROVED");
                        loanIssue.setRejectReason(null);
                        sendLoanNotifications(loanIssue.getEmpCode(), loanIssue.getLoanCode(), loanIssue.getLoanAmt(), "APPROVE", null);
                    } else if ("REJECT".equalsIgnoreCase(action)) {
                        loanIssue.setStatus("REJECTED");
                        loanIssue.setVerificationStatus("REJECTED");
                        loanIssue.setRejectReason(remarks);
                        sendLoanNotifications(loanIssue.getEmpCode(), loanIssue.getLoanCode(), loanIssue.getLoanAmt(), "REJECT", remarks);
                    }
                    loanIssue.setUpdatedBy(SecurityUtils.getCurrentUserId());
                    return ResponseEntity.ok(loanIssueRepository.save(loanIssue));
                }).orElse(ResponseEntity.notFound().build());
    }

    private void sendLoanNotifications(String empCode, String loanCode, Double amount, String actionType, String rejectReason) {
        try {
            employeeMasterRepository.findByEmpCodeIgnoreCase(empCode).ifPresent(emp -> {
                String amountStr = amount != null ? String.valueOf(amount) : "0";
                
                if ("SUBMIT".equalsIgnoreCase(actionType)) {
                    // 1. Notify applicant
                    String title = "Loan Request Submitted: " + loanCode;
                    String message = String.format("Your loan issue request for ₹%s has been submitted and is pending verification.", amountStr);
                    notificationService.notifyUserAboutLoan(emp, title, message, "/employee-self-care/loan-apply");

                    // 2. Notify vertical head/manager
                    managerMappingRepository.findByEmpIdAndStatus(emp.getId(), "Active").ifPresent(mapping -> {
                        if (mapping.getVerticalHeadId() != null) {
                            employeeMasterRepository.findById(mapping.getVerticalHeadId()).ifPresent(manager -> {
                                String mTitle = "Loan Verification Pending: " + empCode;
                                String mMessage = String.format("A loan issue request of ₹%s for %s is pending your verification.", amountStr, emp.getEmployeeName());
                                notificationService.notifyUserAboutLoan(manager, mTitle, mMessage, "/hra/payroll/loan-verification");
                            });
                        }
                    });
                } else if ("APPROVE".equalsIgnoreCase(actionType)) {
                    // Notify applicant
                    String title = "Loan Issue Verified: " + loanCode;
                    String message = String.format("Your issued loan for ₹%s has been verified and approved.", amountStr);
                    notificationService.notifyUserAboutLoan(emp, title, message, "/employee-self-care/loan-apply");
                } else if ("REJECT".equalsIgnoreCase(actionType)) {
                    // Notify applicant
                    String title = "Loan Issue Rejected: " + loanCode;
                    String rejectMsg = rejectReason != null ? " Reason: " + rejectReason : "";
                    String message = String.format("Your issued loan for ₹%s has been rejected.%s", amountStr, rejectMsg);
                    notificationService.notifyUserAboutLoan(emp, title, message, "/employee-self-care/loan-apply");
                }
            });
        } catch (Exception e) {
            System.err.println("Failed to send loan notifications: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/short-close")
    @RequirePagePermission(pageCode = "QM1440", action = "write")
    public ResponseEntity<?> shortClose(@PathVariable Long id, @RequestBody HrLoanIssue closeDetails) {
        return loanIssueRepository.findById(id)
                .map(loanIssue -> {
                    // Update standard loan details
                    loanIssue.setEmpCode(closeDetails.getEmpCode());
                    loanIssue.setEmployeeName(closeDetails.getEmployeeName());
                    loanIssue.setLoanCode(closeDetails.getLoanCode());
                    loanIssue.setLoanAmt(closeDetails.getLoanAmt());
                    loanIssue.setRepayLoanAmt(closeDetails.getRepayLoanAmt());
                    loanIssue.setIssueDate(closeDetails.getIssueDate());
                    loanIssue.setNoOfMonths(closeDetails.getNoOfMonths());
                    loanIssue.setInstallmentAmt(closeDetails.getInstallmentAmt());
                    loanIssue.setStartYear(closeDetails.getStartYear());
                    loanIssue.setStartMonth(closeDetails.getStartMonth());
                    loanIssue.setEndYear(closeDetails.getEndYear());
                    loanIssue.setEndMonth(closeDetails.getEndMonth());
                    loanIssue.setReason(closeDetails.getReason());
                    loanIssue.setRequestedDetails(closeDetails.getRequestedDetails());
                    loanIssue.setRequestDate(closeDetails.getRequestDate());
                    loanIssue.setCreatedDate(closeDetails.getCreatedDate());

                    // Update short close details
                    loanIssue.setStatus("SHORT CLOSED");
                    loanIssue.setShortCloseDate(closeDetails.getShortCloseDate() != null ? closeDetails.getShortCloseDate() : new Date());
                    loanIssue.setShortCloseRemarks(closeDetails.getShortCloseRemarks());
                    loanIssue.setUpdatedBy(SecurityUtils.getCurrentUserId());
                    return ResponseEntity.ok(loanIssueRepository.save(loanIssue));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/short-close")
    @RequirePagePermission(pageCode = "QM1440", action = "delete")
    public ResponseEntity<?> deleteShortClose(@PathVariable Long id) {
        return loanIssueRepository.findById(id)
                .map(loanIssue -> {
                    loanIssue.setStatus("OPEN");
                    loanIssue.setShortCloseDate(null);
                    loanIssue.setShortCloseRemarks(null);
                    loanIssue.setUpdatedBy(SecurityUtils.getCurrentUserId());
                    return ResponseEntity.ok(loanIssueRepository.save(loanIssue));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1430", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return loanIssueRepository.findById(id)
                .map(loanIssue -> {
                    loanIssue.setIsActive(false);
                    loanIssue.setUpdatedBy(SecurityUtils.getCurrentUserId());
                    loanIssueRepository.save(loanIssue);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }
}

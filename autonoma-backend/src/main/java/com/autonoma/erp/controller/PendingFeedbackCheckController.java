package com.autonoma.erp.controller;

import com.autonoma.erp.model.CustomerSatisfactionMapping;
import com.autonoma.erp.model.EmployeeSatisfactionMapping;
import com.autonoma.erp.model.InternalCustomerSatisfactionMapping;
import com.autonoma.erp.model.VendorSatisfactionMapping;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.autonoma.erp.repository.CustomerSatisfactionMappingRepository;
import com.autonoma.erp.repository.EmployeeSatisfactionMappingRepository;
import com.autonoma.erp.repository.InternalCustomerSatisfactionMappingRepository;
import com.autonoma.erp.repository.VendorSatisfactionMappingRepository;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

/**
 * PendingFeedbackCheckController
 *
 * Single consolidated GET /api/pending-feedback-check endpoint.
 * Replaces 4 separate frontend calls with one atomic check.
 *
 * Response:
 * {
 *   "hasPending": true,
 *   "employee":  { "pending": true,  "mappingId": 5,  "status": "Pending", "feedbackCycle": "Q1-2026" },
 *   "customer":  { "pending": false },
 *   "vendor":    { "pending": false },
 *   "internal":  { "pending": false }
 * }
 *
 * Always returns HTTP 200. On any internal error, returns hasPending=false
 * so the UI is never blocked by a backend failure.
 */
@RestController
@RequestMapping("/api/pending-feedback-check")
@Slf4j
public class PendingFeedbackCheckController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PendingFeedbackCheckController.class);

    private static final List<String> ACTIVE_STATUSES = Arrays.asList("Pending", "Overdue");

    private final EmployeeSatisfactionMappingRepository     employeeMappingRepo;
    private final CustomerSatisfactionMappingRepository     customerMappingRepo;
    private final VendorSatisfactionMappingRepository       vendorMappingRepo;
    private final InternalCustomerSatisfactionMappingRepository internalMappingRepo;
    private final EmployeeMasterRepository                  employeeRepo;
    private final AccountLedgerRepository                  customerMasterRepo;
    private final com.autonoma.erp.repository.admin.UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public PendingFeedbackCheckController(
            EmployeeSatisfactionMappingRepository employeeMappingRepo,
            CustomerSatisfactionMappingRepository customerMappingRepo,
            VendorSatisfactionMappingRepository vendorMappingRepo,
            InternalCustomerSatisfactionMappingRepository internalMappingRepo,
            EmployeeMasterRepository employeeRepo,
            AccountLedgerRepository customerMasterRepo,
            com.autonoma.erp.repository.admin.UserRepository userRepository) {
        this.employeeMappingRepo = employeeMappingRepo;
        this.customerMappingRepo = customerMappingRepo;
        this.vendorMappingRepo = vendorMappingRepo;
        this.internalMappingRepo = internalMappingRepo;
        this.employeeRepo = employeeRepo;
        this.customerMasterRepo = customerMasterRepo;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> checkAllPending() {
        try {
            String userId = SecurityUtils.getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            Map<String, Object> response = new LinkedHashMap<>();
            boolean hasPending = false;

            // ── 1. Employee Satisfaction ──────────────────────────────────────────────
            Map<String, Object> empResult = pending(false);
            try {
                Optional<EmployeeMaster> empOpt = resolveEmployee(userId);
                if (empOpt.isPresent()) {
                    List<EmployeeSatisfactionMapping> list =
                        employeeMappingRepo.findByEmployeeIdAndStatusIn(empOpt.get().getId(), ACTIVE_STATUSES);
                    if (!list.isEmpty()) {
                        EmployeeSatisfactionMapping m = list.get(0);
                        empResult.put("pending",           true);
                        empResult.put("mappingId",         m.getId());
                        empResult.put("status",            m.getStatus());
                        empResult.put("feedbackCycle",     m.getFeedbackCycle());
                        empResult.put("eligibilityDate",   m.getEligibilityDate() != null ? m.getEligibilityDate().toString() : null);
                        empResult.put("feedbackStartDate", m.getFeedbackStartDate() != null ? m.getFeedbackStartDate().toString() : null);
                        empResult.put("createdDate",       m.getCreatedDate() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd").format(m.getCreatedDate()) : null);
                        empResult.put("employeeName",      empOpt.get().getEmployeeName());
                        hasPending = true;
                    }
                }
            } catch (Exception e) {
                log.debug("[PendingFeedback] Employee check skipped: {}", e.getMessage());
            }
            response.put("employee", empResult);

            // ── 2. Customer Satisfaction ────────────────────────────────
            Map<String, Object> custResult = pending(false);
            try {
                Optional<AccountLedger> custOpt = customerMasterRepo.findByCode(userId);
                if (custOpt.isPresent()) {
                    List<CustomerSatisfactionMapping> list =
                        customerMappingRepo.findByCustomerIdAndStatusIn(custOpt.get().getId(), ACTIVE_STATUSES);
                    if (!list.isEmpty()) {
                        CustomerSatisfactionMapping m = list.get(0);
                        custResult.put("pending",       true);
                        custResult.put("mappingId",     m.getId());
                        custResult.put("status",        m.getStatus());
                        custResult.put("feedbackCycle", m.getFeedbackCycle());
                        custResult.put("feedbackStartDate", m.getFeedbackStartDate() != null ? m.getFeedbackStartDate().toString() : null);
                        custResult.put("eligibilityDate",   m.getEligibilityDate() != null ? m.getEligibilityDate().toString() : null);
                        custResult.put("createdDate",       m.getCreatedDate() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd").format(m.getCreatedDate()) : null);
                        custResult.put("customerName",      custOpt.get().getCustomerName());
                        hasPending = true;
                    }
                }
            } catch (Exception e) {
                log.debug("[PendingFeedback] Customer check skipped: {}", e.getMessage());
            }
            response.put("customer", custResult);

            // ── 3. Vendor Satisfaction ────────────────────────────────────────────────
            Map<String, Object> vendResult = pending(false);
            try {
                // Use status-filtered query instead of findAll() to avoid full table scan
                List<VendorSatisfactionMapping> pendingVendors = vendorMappingRepo.findByStatus("Pending");
                Optional<VendorSatisfactionMapping> vendMatch = pendingVendors.stream()
                    .filter(m -> m.getVendor() != null &&
                        (userId.equalsIgnoreCase(m.getVendor().getCode()) ||
                         userId.equalsIgnoreCase(m.getVendor().getLedgerName())))
                    .findFirst();
                if (!vendMatch.isPresent()) {
                    // Also check Overdue
                    List<VendorSatisfactionMapping> overdueVendors = vendorMappingRepo.findByStatus("Overdue");
                    vendMatch = overdueVendors.stream()
                        .filter(m -> m.getVendor() != null &&
                            (userId.equalsIgnoreCase(m.getVendor().getCode()) ||
                             userId.equalsIgnoreCase(m.getVendor().getLedgerName())))
                        .findFirst();
                }
                if (vendMatch.isPresent()) {
                    VendorSatisfactionMapping m = vendMatch.get();
                    vendResult.put("pending",       true);
                    vendResult.put("mappingId",     m.getId());
                    vendResult.put("status",        m.getStatus());
                    vendResult.put("feedbackCycle", m.getFeedbackCycle());
                    vendResult.put("feedbackStartDate", m.getFeedbackStartDate() != null ? m.getFeedbackStartDate().toString() : null);
                    vendResult.put("eligibilityDate",   m.getEligibilityDate() != null ? m.getEligibilityDate().toString() : null);
                    vendResult.put("createdDate",       m.getCreatedDate() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd").format(m.getCreatedDate()) : null);
                    vendResult.put("vendorName",        m.getVendor().getLedgerName());
                    hasPending = true;
                }
            } catch (Exception e) {
                log.debug("[PendingFeedback] Vendor check skipped: {}", e.getMessage());
            }
            response.put("vendor", vendResult);

            // ── 4. Internal Customer Satisfaction ─────────────────────────────────────
            Map<String, Object> intResult = pending(false);
            try {
                Optional<EmployeeMaster> empOpt = resolveEmployee(userId);
                if (empOpt.isPresent()) {
                    List<InternalCustomerSatisfactionMapping> list =
                        internalMappingRepo.findByEmployeeIdAndStatusIn(empOpt.get().getId(), ACTIVE_STATUSES);
                    if (!list.isEmpty()) {
                        InternalCustomerSatisfactionMapping m = list.get(0);
                        intResult.put("pending",       true);
                        intResult.put("mappingId",     m.getId());
                        intResult.put("status",        m.getStatus());
                        intResult.put("feedbackCycle", m.getFeedbackCycle());
                        intResult.put("feedbackStartDate", m.getFeedbackStartDate() != null ? m.getFeedbackStartDate().toString() : null);
                        intResult.put("eligibilityDate",   m.getEligibilityDate() != null ? m.getEligibilityDate().toString() : null);
                        intResult.put("createdDate",       m.getCreatedDate() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd").format(m.getCreatedDate()) : null);
                        intResult.put("employeeName",      empOpt.get().getEmployeeName());
                        hasPending = true;
                    }
                }
            } catch (Exception e) {
                log.debug("[PendingFeedback] Internal check skipped: {}", e.getMessage());
            }
            response.put("internal", intResult);

            response.put("hasPending", hasPending);
            log.info("[PendingFeedback] user='{}' hasPending={}", userId, hasPending);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("[PendingFeedback] Unexpected error: {}", e.getMessage(), e);
            return ResponseEntity.ok(safeDefault());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────

    /** Resolve an EmployeeMaster from the current user's login ID (empCode) or name fallback.
     *  Uses targeted indexed queries instead of findAll() table scans.
     */
    private Optional<EmployeeMaster> resolveEmployee(String userId) {
        // 1. Direct empCode lookup (indexed, fastest path)
        Optional<EmployeeMaster> opt = employeeRepo.findByEmpCodeIgnoreCase(userId);
        if (opt.isPresent()) return opt;

        opt = employeeRepo.findByOldEmpCode(userId);
        if (opt.isPresent()) return opt;

        // 2. Lookup via user credential → empId (both are indexed lookups)
        Optional<com.autonoma.erp.model.admin.UserCredential> userCred = userRepository.findByUserId(userId);
        if (userCred.isPresent() && userCred.get().getEmpId() != null) {
            Optional<EmployeeMaster> emp = employeeRepo.findById(userCred.get().getEmpId());
            if (emp.isPresent()) return emp;
        }

        // 3. Numeric ID lookup
        try {
            long pId = Long.parseLong(userId.trim());
            return employeeRepo.findById(pId);
        } catch (NumberFormatException ignored) {}

        return Optional.empty();
    }

    private static Map<String, Object> pending(boolean value) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("pending", value);
        return m;
    }

    private static Map<String, Object> safeDefault() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("hasPending", false);
        r.put("employee",   pending(false));
        r.put("customer",   pending(false));
        r.put("vendor",     pending(false));
        r.put("internal",   pending(false));
        return r;
    }
}

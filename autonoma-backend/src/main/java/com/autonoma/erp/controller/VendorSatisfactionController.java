package com.autonoma.erp.controller;

import com.autonoma.erp.model.*;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.autonoma.erp.repository.SatisfactionCriteriaRepository;
import com.autonoma.erp.repository.VendorSatisfactionMappingRepository;
import com.autonoma.erp.repository.VendorSatisfactionResponseRepository;
import com.autonoma.erp.service.VendorSatisfactionService;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/qms/vendor-satisfaction")
@Slf4j
@CrossOrigin(origins = "*")
public class VendorSatisfactionController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(VendorSatisfactionController.class);

    private final VendorSatisfactionService satisfactionService;
    private final VendorSatisfactionMappingRepository mappingRepository;
    private final VendorSatisfactionResponseRepository responseRepository;
    private final AccountLedgerRepository supplierRepository;
    private final SatisfactionCriteriaRepository criteriaRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public VendorSatisfactionController(
            VendorSatisfactionService satisfactionService,
            VendorSatisfactionMappingRepository mappingRepository,
            VendorSatisfactionResponseRepository responseRepository,
            AccountLedgerRepository supplierRepository,
            SatisfactionCriteriaRepository criteriaRepository) {
        this.satisfactionService = satisfactionService;
        this.mappingRepository = mappingRepository;
        this.responseRepository = responseRepository;
        this.supplierRepository = supplierRepository;
        this.criteriaRepository = criteriaRepository;
    }

    @GetMapping("/mappings")
    public ResponseEntity<?> getMappings(
            @RequestParam(value = "cycle", required = false) String cycle,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search) {
        try {
            // Update overdue and closures before returning
            satisfactionService.runDailyVendorReminders();

            List<VendorSatisfactionMapping> list = mappingRepository.findAll();

            if (cycle != null && !cycle.trim().isEmpty() && !"ALL".equalsIgnoreCase(cycle)) {
                list = list.stream().filter(m -> cycle.equalsIgnoreCase(m.getFeedbackCycle())).collect(Collectors.toList());
            }

            if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                list = list.stream().filter(m -> status.equalsIgnoreCase(m.getStatus())).collect(Collectors.toList());
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchLower = search.trim().toLowerCase();
                list = list.stream().filter(m ->
                    (m.getVendor() != null && m.getVendor().getCode() != null && m.getVendor().getCode().toLowerCase().contains(searchLower)) ||
                    (m.getVendor() != null && m.getVendor().getLedgerName() != null && m.getVendor().getLedgerName().toLowerCase().contains(searchLower))
                ).collect(Collectors.toList());
            }

            List<Map<String, Object>> result = list.stream().map(m -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", m.getId());
                map.put("vendorId", m.getVendor() != null ? m.getVendor().getCode() : "N/A");
                map.put("vendorName", m.getVendor() != null ? m.getVendor().getLedgerName() : "N/A");
                map.put("joiningDate", "N/A"); // Vendor doesn't have DOJ but we map it as N/A to align grid columns
                map.put("eligibilityDate", m.getEligibilityDate() != null ? m.getEligibilityDate().toString() : "N/A");
                map.put("feedbackCycle", m.getFeedbackCycle());
                map.put("status", m.getStatus());
                map.put("isClosed", m.getIsClosed());
                map.put("totalScore", m.getTotalScore() != null ? m.getTotalScore() : 0);
                map.put("averageScore", m.getAverageScore() != null ? String.format("%.1f", m.getAverageScore()) : "0");
                map.put("submittedDate", m.getSubmittedDate() != null ? m.getSubmittedDate().toString() : "N/A");
                map.put("generalComments", m.getGeneralComments());
                map.put("riskLevel", satisfactionService.computeRiskLevel(m));
                return map;
            }).collect(Collectors.toList());

            // Default sort desc
            result.sort((r1, r2) -> ((Long) r2.get("id")).compareTo((Long) r1.get("id")));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching vendor mappings: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/responses")
    public ResponseEntity<?> getResponses(@RequestParam("mappingId") Long mappingId) {
        try {
            List<VendorSatisfactionResponse> responses = responseRepository.findByMappingId(mappingId);
            List<Map<String, Object>> result = responses.stream().map(r -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", r.getId());
                map.put("questionId", r.getQuestion().getId());
                map.put("questionCriteria", r.getQuestion().getSatisfactionCriteria());
                map.put("rating", r.getRating());
                map.put("score", r.getScore());
                map.put("comments", r.getComments());
                return map;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching responses: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitFeedback(@RequestBody Map<String, Object> payload) {
        try {
            Long mappingId = Long.valueOf(payload.get("mappingId").toString());
            String generalComments = (String) payload.get("generalComments");
            String suggestions = (String) payload.get("suggestions");
            List<Map<String, Object>> responses = (List<Map<String, Object>>) payload.get("responses");

            VendorSatisfactionMapping mapping = satisfactionService.submitFeedback(mappingId, generalComments, suggestions, responses);
            return ResponseEntity.ok(mapping);
        } catch (Exception e) {
            log.error("Error submitting feedback: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/trigger-auto-assign")
    public ResponseEntity<?> triggerAutoAssign(@RequestParam("cycle") String cycle) {
        try {
            int count = satisfactionService.triggerAutoAssignForMonth(cycle);
            return ResponseEntity.ok(Map.of("message", "Auto-assignment executed.", "assignedCount", count));
        } catch (Exception e) {
            log.error("Error triggering auto assign: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<?> getDashboardSummary() {
        try {
            // Force overdue check
            satisfactionService.runDailyVendorReminders();

            List<VendorSatisfactionMapping> mappings = mappingRepository.findAll();
            long total = mappings.size();
            long completed = mappings.stream().filter(m -> "Completed".equalsIgnoreCase(m.getStatus())).count();
            long pending = mappings.stream().filter(m -> "Pending".equalsIgnoreCase(m.getStatus())).count();
            long overdue = mappings.stream().filter(m -> "Overdue".equalsIgnoreCase(m.getStatus())).count();
            long closed = mappings.stream().filter(m -> "Closed".equalsIgnoreCase(m.getStatus())).count();

            Map<String, Object> map = new HashMap<>();
            map.put("total", total);
            map.put("completed", completed);
            map.put("pending", pending);
            map.put("overdue", overdue);
            map.put("closed", closed);

            return ResponseEntity.ok(map);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/my-pending")
    public ResponseEntity<?> getMyPending() {
        try {
            String currentUserId = SecurityUtils.getCurrentUserId();
            if (currentUserId == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            List<VendorSatisfactionMapping> allMappings = mappingRepository.findAll();
            List<VendorSatisfactionMapping> myMappings = allMappings.stream()
                .filter(m -> m.getVendor() != null &&
                    (currentUserId.equalsIgnoreCase(m.getVendor().getCode()) ||
                     currentUserId.equalsIgnoreCase(m.getVendor().getLedgerName())))
                .filter(m -> "Pending".equalsIgnoreCase(m.getStatus()) ||
                             "Overdue".equalsIgnoreCase(m.getStatus()) ||
                             "Closed".equalsIgnoreCase(m.getStatus()))
                .collect(Collectors.toList());

            List<Map<String, Object>> result = myMappings.stream().map(m -> {
                Map<String, Object> map = new HashMap<>();
                map.put("mappingId", m.getId());
                map.put("feedbackCycle", m.getFeedbackCycle());
                map.put("eligibilityDate", m.getEligibilityDate() != null ? m.getEligibilityDate().toString() : "N/A");
                map.put("status", m.getStatus());
                map.put("isClosed", m.getIsClosed());
                map.put("vendorName", m.getVendor() != null ? m.getVendor().getLedgerName() : null);
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching vendor my-pending: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/questions")
    public ResponseEntity<?> getActiveVendorQuestions() {
        try {
            List<SatisfactionCriteria> list = criteriaRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getStatus()) && "Vendor".equalsIgnoreCase(c.getSatisfactionType()))
                .collect(Collectors.toList());
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            log.error("Error fetching vendor questions: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}

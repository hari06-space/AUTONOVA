package com.autonoma.erp.controller;

import com.autonoma.erp.model.CustomerSatisfactionMapping;
import com.autonoma.erp.model.CustomerSatisfactionResponse;
import com.autonoma.erp.model.SatisfactionCriteria;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.autonoma.erp.repository.CustomerSatisfactionMappingRepository;
import com.autonoma.erp.repository.CustomerSatisfactionResponseRepository;
import com.autonoma.erp.repository.SatisfactionCriteriaRepository;
import com.autonoma.erp.service.CustomerSatisfactionFeedbackService;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customer-satisfaction/customer-feedback")
@Slf4j
public class CustomerSatisfactionFeedbackController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CustomerSatisfactionFeedbackController.class);

    @org.springframework.beans.factory.annotation.Autowired
    private CustomerSatisfactionFeedbackService satisfactionService;
    @org.springframework.beans.factory.annotation.Autowired
    private CustomerSatisfactionMappingRepository mappingRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private CustomerSatisfactionResponseRepository responseRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private SatisfactionCriteriaRepository criteriaRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private AccountLedgerRepository AccountLedgerRepository;

    @GetMapping("/summary")
    public ResponseEntity<?> getDashboardSummary(
            @RequestParam(value = "fromDate", required = false) String fromDate,
            @RequestParam(value = "toDate", required = false) String toDate,
            @RequestParam(value = "considerDate", required = false) Boolean considerDate,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search) {
        try {
            List<CustomerSatisfactionMapping> filtered = satisfactionService.getFilteredMappings(
                    fromDate, toDate, considerDate, status, search
            );
            return ResponseEntity.ok(satisfactionService.getDashboardSummaryFiltered(filtered));
        } catch (Exception e) {
            log.error("Error fetching summary: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/mappings")
    public ResponseEntity<?> getMappings(
            @RequestParam(value = "fromDate", required = false) String fromDate,
            @RequestParam(value = "toDate", required = false) String toDate,
            @RequestParam(value = "considerDate", required = false) Boolean considerDate,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search) {
        try {
            List<CustomerSatisfactionMapping> list = satisfactionService.getFilteredMappings(
                    fromDate, toDate, considerDate, status, search
            );

            List<Map<String, Object>> result = list.stream().map(m -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", m.getId());
                map.put("customerCode", m.getCustomer() != null ? m.getCustomer().getCustomerCode() : "N/A");
                map.put("customerName", m.getCustomer() != null ? m.getCustomer().getCustomerName() : "N/A");
                map.put("eligibilityDate", m.getEligibilityDate() != null ? m.getEligibilityDate().toString() : "N/A");
                map.put("sendDate", m.getSendDate() != null ? m.getSendDate().toString() : "N/A");
                map.put("submitDate", m.getSubmitDate() != null ? m.getSubmitDate().toString() : "N/A");
                map.put("feedbackCycle", m.getFeedbackCycle());
                map.put("status", m.getStatus());
                map.put("totalScore", m.getTotalScore() != null ? m.getTotalScore() : 0);
                map.put("averageScore", m.getAverageScore() != null ? String.format("%.1f", m.getAverageScore()) : "0");
                map.put("generalComments", m.getGeneralComments());
                map.put("createdBy", m.getCreatedBy());
                map.put("createdDate", m.getCreatedDate() != null ? m.getCreatedDate().toString() : "N/A");
                return map;
            }).collect(Collectors.toList());

            // Default sort: ID desc
            result.sort((r1, r2) -> ((Long) r2.get("id")).compareTo((Long) r1.get("id")));

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error loading mapping list: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/responses")
    public ResponseEntity<?> getResponses(@RequestParam("mappingId") Long mappingId) {
        try {
            List<CustomerSatisfactionResponse> responses = responseRepository.findByMappingId(mappingId);
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

    @GetMapping("/questions")
    public ResponseEntity<?> getQuestions() {
        try {
            List<SatisfactionCriteria> list = criteriaRepository.findAll().stream()
                    .filter(c -> Boolean.TRUE.equals(c.getStatus()) && "Customer".equalsIgnoreCase(c.getSatisfactionType()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(list);
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

            Optional<AccountLedger> custOpt = AccountLedgerRepository.findByCode(currentUserId);
            if (!custOpt.isPresent()) {
                custOpt = AccountLedgerRepository.findByCodeIgnoreCase(currentUserId);
            }

            if (!custOpt.isPresent()) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            AccountLedger customer = custOpt.get();
            List<CustomerSatisfactionMapping> pending = mappingRepository.findByCustomerIdAndStatusIn(
                    customer.getId(), Arrays.asList("Pending", "Overdue")
            );

            List<Map<String, Object>> result = pending.stream().map(m -> {
                Map<String, Object> map = new HashMap<>();
                map.put("mappingId", m.getId());
                map.put("feedbackCycle", m.getFeedbackCycle());
                map.put("eligibilityDate", m.getEligibilityDate().toString());
                map.put("status", m.getStatus());
                map.put("customerName", customer.getCustomerName());
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error checking pending feedback: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitFeedback(@RequestBody Map<String, Object> payload) {
        try {
            Long mappingId = Long.valueOf(payload.get("mappingId").toString());
            String generalComments = (String) payload.get("generalComments");
            List<Map<String, Object>> responses = (List<Map<String, Object>>) payload.get("responses");

            CustomerSatisfactionMapping mapping = satisfactionService.submitFeedback(mappingId, generalComments, responses);
            return ResponseEntity.ok(mapping);
        } catch (Exception e) {
            log.error("Error submitting feedback: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/later")
    public ResponseEntity<?> remindLater(@RequestParam("mappingId") Long mappingId) {
        try {
            CustomerSatisfactionMapping mapping = mappingRepository.findById(mappingId)
                    .orElseThrow(() -> new RuntimeException("Mapping not found"));
            mapping.setDismissedCount(mapping.getDismissedCount() + 1);
            mappingRepository.save(mapping);
            return ResponseEntity.ok(Map.of("message", "Updated dismiss count"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/trigger-auto-assign")
    public ResponseEntity<?> triggerAutoAssign(@RequestParam("cycle") String cycle) {
        try {
            int count = satisfactionService.triggerAutoAssignForMonth(cycle);
            return ResponseEntity.ok(Map.of("message", "FIFO Auto-assignment executed.", "assignedCount", count));
        } catch (Exception e) {
            log.error("Error triggering auto-assignment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

}

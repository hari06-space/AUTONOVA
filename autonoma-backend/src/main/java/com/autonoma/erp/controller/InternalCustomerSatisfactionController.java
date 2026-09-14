package com.autonoma.erp.controller;

import com.autonoma.erp.model.*;
import com.autonoma.erp.repository.InternalCustomerSatisfactionMappingRepository;
import com.autonoma.erp.repository.InternalCustomerSatisfactionResponseRepository;
import com.autonoma.erp.repository.SatisfactionCriteriaRepository;
import com.autonoma.erp.service.InternalCustomerSatisfactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/qms/internal-customer-satisfaction")
@Slf4j
@CrossOrigin(origins = "*")
public class InternalCustomerSatisfactionController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(InternalCustomerSatisfactionController.class);

    private final InternalCustomerSatisfactionService satisfactionService;
    private final InternalCustomerSatisfactionMappingRepository mappingRepository;
    private final InternalCustomerSatisfactionResponseRepository responseRepository;
    private final SatisfactionCriteriaRepository criteriaRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public InternalCustomerSatisfactionController(
            InternalCustomerSatisfactionService satisfactionService,
            InternalCustomerSatisfactionMappingRepository mappingRepository,
            InternalCustomerSatisfactionResponseRepository responseRepository,
            SatisfactionCriteriaRepository criteriaRepository) {
        this.satisfactionService = satisfactionService;
        this.mappingRepository = mappingRepository;
        this.responseRepository = responseRepository;
        this.criteriaRepository = criteriaRepository;
    }

    @GetMapping("/mappings")
    public ResponseEntity<?> getMappings(
            @RequestParam(value = "cycle", required = false) String cycle,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search) {
        try {
            // Update overdue and closures before returning
            satisfactionService.updatePendingToOverdueRealtime();

            List<InternalCustomerSatisfactionMapping> list = mappingRepository.findAll();

            if (cycle != null && !cycle.trim().isEmpty() && !"ALL".equalsIgnoreCase(cycle)) {
                list = list.stream().filter(m -> cycle.equalsIgnoreCase(m.getFeedbackCycle())).collect(Collectors.toList());
            }

            if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                list = list.stream().filter(m -> status.equalsIgnoreCase(m.getStatus())).collect(Collectors.toList());
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchLower = search.trim().toLowerCase();
                list = list.stream().filter(m ->
                    (m.getEmployee() != null && m.getEmployee().getEmpCode() != null && m.getEmployee().getEmpCode().toLowerCase().contains(searchLower)) ||
                    (m.getEmployee() != null && m.getEmployee().getEmployeeName() != null && m.getEmployee().getEmployeeName().toLowerCase().contains(searchLower))
                ).collect(Collectors.toList());
            }

            List<Map<String, Object>> result = list.stream().map(m -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", m.getId());
                map.put("employeeId", m.getEmployee() != null ? m.getEmployee().getEmpCode() : "N/A");
                map.put("employeeName", m.getEmployee() != null ? m.getEmployee().getEmployeeName() : "N/A");
                map.put("department", m.getEmployee() != null && m.getEmployee().getDepartment() != null ? m.getEmployee().getDepartment().getDepartmentName() : "N/A");
                map.put("designation", m.getEmployee() != null && m.getEmployee().getDesignation() != null ? m.getEmployee().getDesignation().getDesignationName() : "N/A");
                map.put("joiningDate", m.getEmployee() != null && m.getEmployee().getDateOfJoining() != null ? m.getEmployee().getDateOfJoining().toString() : "N/A");
                map.put("eligibilityDate", m.getEligibilityDate() != null ? m.getEligibilityDate().toString() : "N/A");
                map.put("feedbackCycle", m.getFeedbackCycle());
                map.put("status", m.getStatus());
                map.put("isClosed", m.getIsClosed());
                map.put("reminderCount", m.getReminderCount());
                map.put("lastReminderDate", m.getLastReminderDate() != null ? m.getLastReminderDate().toString() : "N/A");
                map.put("nextReminderDate", m.getNextReminderDate() != null ? m.getNextReminderDate().toString() : "N/A");
                map.put("totalScore", m.getTotalScore() != null ? m.getTotalScore() : 0);
                map.put("averageScore", m.getAverageScore() != null ? String.format("%.1f", m.getAverageScore()) : "0");
                map.put("submittedDate", m.getSubmittedDate() != null ? m.getSubmittedDate().toString() : "N/A");
                map.put("generalComments", m.getGeneralComments());
                map.put("suggestions", m.getSuggestions());
                map.put("riskLevel", satisfactionService.computeRiskLevel(m));
                return map;
            }).collect(Collectors.toList());

            // Default sort desc
            result.sort((r1, r2) -> ((Long) r2.get("id")).compareTo((Long) r1.get("id")));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching internal customer mappings: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/responses")
    public ResponseEntity<?> getResponses(@RequestParam("mappingId") Long mappingId) {
        try {
            List<InternalCustomerSatisfactionResponse> responses = responseRepository.findByMappingId(mappingId);
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

            InternalCustomerSatisfactionMapping mapping = satisfactionService.submitFeedback(mappingId, generalComments, suggestions, responses);
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
            return ResponseEntity.ok(Map.of("message", "Auto-assignment executed successfully.", "assignedCount", count));
        } catch (Exception e) {
            log.error("Error triggering auto assign: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/trigger-reminders")
    public ResponseEntity<?> triggerReminders() {
        try {
            satisfactionService.runDailyInternalCustomerReminders();
            return ResponseEntity.ok(Map.of("message", "Reminders triggered successfully."));
        } catch (Exception e) {
            log.error("Error triggering reminders: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<?> getDashboardSummary() {
        try {
            satisfactionService.updatePendingToOverdueRealtime();

            List<InternalCustomerSatisfactionMapping> mappings = mappingRepository.findAll();
            long total = mappings.size();
            long completed = mappings.stream().filter(m -> "Completed".equalsIgnoreCase(m.getStatus())).count();
            long pending = mappings.stream().filter(m -> "Pending".equalsIgnoreCase(m.getStatus())).count();
            long overdue = mappings.stream().filter(m -> "Overdue".equalsIgnoreCase(m.getStatus())).count();
            long closed = mappings.stream().filter(m -> "Closed".equalsIgnoreCase(m.getStatus())).count();

            double averageSatisfactionScore = mappings.stream()
                .filter(m -> "Completed".equalsIgnoreCase(m.getStatus()) && m.getAverageScore() != null)
                .mapToDouble(InternalCustomerSatisfactionMapping::getAverageScore)
                .average()
                .orElse(0.0);

            Map<String, Object> map = new HashMap<>();
            map.put("total", total);
            map.put("completed", completed);
            map.put("pending", pending);
            map.put("overdue", overdue);
            map.put("closed", closed);
            map.put("averageSatisfactionScore", Double.valueOf(String.format("%.1f", averageSatisfactionScore)));

            return ResponseEntity.ok(map);
        } catch (Exception e) {
            log.error("Error fetching dashboard summary: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    @GetMapping("/my-pending")
    public ResponseEntity<?> getMyPending() {
        try {
            String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            if (currentUserId == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            List<InternalCustomerSatisfactionMapping> allMappings = mappingRepository.findAll();
            List<InternalCustomerSatisfactionMapping> myMappings = allMappings.stream()
                .filter(m -> m.getEmployee() != null &&
                    (currentUserId.equalsIgnoreCase(m.getEmployee().getEmpCode()) ||
                     currentUserId.equalsIgnoreCase(m.getEmployee().getEmployeeName())))
                .filter(m -> "Pending".equalsIgnoreCase(m.getStatus()) ||
                             "Overdue".equalsIgnoreCase(m.getStatus()) ||
                             "Closed".equalsIgnoreCase(m.getStatus()))
                .collect(java.util.stream.Collectors.toList());

            List<Map<String, Object>> result = myMappings.stream().map(m -> {
                Map<String, Object> map = new HashMap<>();
                map.put("mappingId", m.getId());
                map.put("feedbackCycle", m.getFeedbackCycle());
                map.put("eligibilityDate", m.getEligibilityDate() != null ? m.getEligibilityDate().toString() : "N/A");
                map.put("status", m.getStatus());
                map.put("isClosed", m.getIsClosed());
                map.put("employeeName", m.getEmployee() != null ? m.getEmployee().getEmployeeName() : null);
                return map;
            }).collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching internal customer my-pending: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/questions")
    public ResponseEntity<?> getActiveInternalQuestions() {
        try {
            List<SatisfactionCriteria> list = criteriaRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getStatus()) && "Internal Customer".equalsIgnoreCase(c.getSatisfactionType()))
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            log.error("Error fetching internal customer questions: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}

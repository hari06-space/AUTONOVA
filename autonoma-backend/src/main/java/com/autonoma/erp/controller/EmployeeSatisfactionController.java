package com.autonoma.erp.controller;

import com.autonoma.erp.model.*;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.repository.EmployeeSatisfactionMappingRepository;
import com.autonoma.erp.repository.EmployeeSatisfactionResponseRepository;
import com.autonoma.erp.repository.EmployeeSatisfactionReminderLogRepository;
import com.autonoma.erp.repository.SatisfactionCriteriaRepository;
import com.autonoma.erp.service.EmployeeSatisfactionService;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController("hraEmployeeSatisfactionController")
@RequestMapping("/api/hra/employee-satisfaction")
@Slf4j
public class EmployeeSatisfactionController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EmployeeSatisfactionController.class);

    private final EmployeeSatisfactionService satisfactionService;
    private final EmployeeSatisfactionMappingRepository mappingRepository;
    private final EmployeeSatisfactionResponseRepository responseRepository;
    private final EmployeeSatisfactionReminderLogRepository reminderLogRepository;
    private final SatisfactionCriteriaRepository criteriaRepository;
    private final EmployeeMasterRepository employeeMasterRepository;
    private final com.autonoma.erp.repository.admin.UserRepository userRepository;
    private final com.autonoma.erp.service.VendorSatisfactionService vendorSatisfactionService;
    private final com.autonoma.erp.service.InternalCustomerSatisfactionService internalCustomerSatisfactionService;
    private final com.autonoma.erp.service.CustomerSatisfactionFeedbackService customerSatisfactionFeedbackService;

    @org.springframework.beans.factory.annotation.Autowired
    public EmployeeSatisfactionController(
            EmployeeSatisfactionService satisfactionService,
            EmployeeSatisfactionMappingRepository mappingRepository,
            EmployeeSatisfactionResponseRepository responseRepository,
            EmployeeSatisfactionReminderLogRepository reminderLogRepository,
            SatisfactionCriteriaRepository criteriaRepository,
            EmployeeMasterRepository employeeMasterRepository,
            com.autonoma.erp.repository.admin.UserRepository userRepository,
            com.autonoma.erp.service.VendorSatisfactionService vendorSatisfactionService,
            com.autonoma.erp.service.InternalCustomerSatisfactionService internalCustomerSatisfactionService,
            com.autonoma.erp.service.CustomerSatisfactionFeedbackService customerSatisfactionFeedbackService) {
        this.satisfactionService = satisfactionService;
        this.mappingRepository = mappingRepository;
        this.responseRepository = responseRepository;
        this.reminderLogRepository = reminderLogRepository;
        this.criteriaRepository = criteriaRepository;
        this.employeeMasterRepository = employeeMasterRepository;
        this.userRepository = userRepository;
        this.vendorSatisfactionService = vendorSatisfactionService;
        this.internalCustomerSatisfactionService = internalCustomerSatisfactionService;
        this.customerSatisfactionFeedbackService = customerSatisfactionFeedbackService;
    }

    @GetMapping("/config")
    public ResponseEntity<?> getConfig() {
        try {
            return ResponseEntity.ok(satisfactionService.getConfig());
        } catch (Exception e) {
            log.error("Error fetching config: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/config")
    public ResponseEntity<?> saveConfig(@RequestBody EmployeeSatisfactionConfig config) {
        try {
            return ResponseEntity.ok(satisfactionService.saveConfig(config));
        } catch (Exception e) {
            log.error("Error saving config: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/timeline/{mappingId}")
    public ResponseEntity<?> getFeedbackTimeline(@PathVariable("mappingId") Long mappingId) {
        try {
            EmployeeSatisfactionMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found: " + mappingId));
            
            List<Map<String, Object>> timeline = new ArrayList<>();
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("dd-MMM-yyyy");

            // Event 1: Feedback Assigned
            Map<String, Object> e1 = new HashMap<>();
            e1.put("date", sdf.format(java.sql.Date.valueOf(mapping.getEligibilityDate())));
            e1.put("activity", "Feedback Assigned");
            e1.put("status", "info");
            timeline.add(e1);

            // Event 2: Reminders Sent
            List<EmployeeSatisfactionReminderLog> logs = reminderLogRepository.findByMappingId(mappingId);
            logs.sort(Comparator.comparing(EmployeeSatisfactionReminderLog::getReminderDate));
            for (EmployeeSatisfactionReminderLog log : logs) {
                Map<String, Object> eLog = new HashMap<>();
                eLog.put("date", sdf.format(java.sql.Date.valueOf(log.getReminderDate())));
                eLog.put("activity", String.format("Reminder Email %s (Reminder #%d)", 
                    "Sent".equalsIgnoreCase(log.getEmailStatus()) ? "Sent" : "Failed",
                    log.getReminderNumber()));
                eLog.put("status", "Sent".equalsIgnoreCase(log.getEmailStatus()) ? "success" : "error");
                timeline.add(eLog);
            }

            // Event 3: Feedback Submitted
            if ("Completed".equals(mapping.getStatus()) && mapping.getSubmittedDate() != null) {
                Map<String, Object> eSub = new HashMap<>();
                eSub.put("date", sdf.format(mapping.getSubmittedDate()));
                eSub.put("activity", "Feedback Submitted");
                eSub.put("status", "success");
                timeline.add(eSub);
            }

            return ResponseEntity.ok(timeline);
        } catch (Exception e) {
            log.error("Error loading feedback timeline: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<?> getDashboardSummary(
            @RequestParam(value = "cycle", required = false) String cycle,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "departmentId", required = false) Long departmentId,
            @RequestParam(value = "designationId", required = false) Long designationId,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "joinStartDate", required = false) String joinStartDate,
            @RequestParam(value = "joinEndDate", required = false) String joinEndDate,
            @RequestParam(value = "minScore", required = false) Integer minScore,
            @RequestParam(value = "maxScore", required = false) Integer maxScore,
            @RequestParam(value = "riskLevel", required = false) String riskLevel,
            @RequestParam(value = "reminderStatus", required = false) String reminderStatus,
            @RequestParam(value = "search", required = false) String search) {
        try {
            List<EmployeeSatisfactionMapping> filtered = satisfactionService.getFilteredMappings(
                cycle, status, departmentId, designationId, startDate, endDate, joinStartDate, joinEndDate,
                minScore, maxScore, riskLevel, reminderStatus, search
            );
            return ResponseEntity.ok(satisfactionService.getDashboardSummaryFiltered(filtered));
        } catch (Exception e) {
            log.error("Error fetching dashboard summary: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/mappings")
    public ResponseEntity<?> getMappings(
            @RequestParam(value = "cycle", required = false) String cycle,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "departmentId", required = false) Long departmentId,
            @RequestParam(value = "designationId", required = false) Long designationId,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "joinStartDate", required = false) String joinStartDate,
            @RequestParam(value = "joinEndDate", required = false) String joinEndDate,
            @RequestParam(value = "minScore", required = false) Integer minScore,
            @RequestParam(value = "maxScore", required = false) Integer maxScore,
            @RequestParam(value = "riskLevel", required = false) String riskLevel,
            @RequestParam(value = "reminderStatus", required = false) String reminderStatus,
            @RequestParam(value = "search", required = false) String search) {
        try {
            List<EmployeeSatisfactionMapping> list = satisfactionService.getFilteredMappings(
                cycle, status, departmentId, designationId, startDate, endDate, joinStartDate, joinEndDate,
                minScore, maxScore, riskLevel, reminderStatus, search
            );

            List<Map<String, Object>> result = list.stream().map(m -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", m.getId());
                map.put("employeeId", m.getEmployee() != null ? m.getEmployee().getEmpCode() : "N/A");
                map.put("employeeName", m.getEmployee() != null ? m.getEmployee().getEmployeeName() : "N/A");
                map.put("department", (m.getEmployee() != null && m.getEmployee().getDepartment() != null) ? m.getEmployee().getDepartment().getDepartmentName() : "N/A");
                map.put("designation", (m.getEmployee() != null && m.getEmployee().getDesignation() != null) ? m.getEmployee().getDesignation().getDesignationName() : "N/A");
                map.put("joiningDate", (m.getEmployee() != null && m.getEmployee().getDateOfJoining() != null) ? new java.text.SimpleDateFormat("yyyy-MM-dd").format(m.getEmployee().getDateOfJoining()) : "N/A");
                map.put("eligibilityDate", m.getEligibilityDate() != null ? m.getEligibilityDate().toString() : "N/A");
                map.put("feedbackCycle", m.getFeedbackCycle());
                map.put("status", m.getStatus());
                map.put("reminderCount", m.getReminderCount() != null ? Integer.parseInt(m.getReminderCount()) : 0);
                map.put("lastReminderDate", m.getLastReminderDate() != null ? m.getLastReminderDate().toString() : "N/A");
                map.put("nextReminderDate", m.getNextReminderDate() != null ? m.getNextReminderDate().toString() : "N/A");
                map.put("submittedDate", m.getSubmittedDate() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(m.getSubmittedDate()) : "N/A");
                map.put("totalScore", m.getTotalScore() != null ? Integer.parseInt(m.getTotalScore()) : 0);
                map.put("averageScore", m.getAverageScore() != null ? String.format("%.1f", Double.parseDouble(m.getAverageScore())) : "0");
                map.put("suggestions", m.getSuggestions());
                map.put("generalComments", m.getGeneralComments());
                map.put("createdBy", m.getCreatedBy());
                map.put("createdDate", m.getCreatedDate() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(m.getCreatedDate()) : "N/A");
                map.put("email", m.getEmployee() != null ? m.getEmployee().getOfficeMail() : "N/A");
                map.put("updatedBy", m.getUpdatedBy() != null ? m.getUpdatedBy() : "N/A");
                map.put("updatedDate", m.getUpdatedDate() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(m.getUpdatedDate()) : "N/A");
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
            List<EmployeeSatisfactionResponse> responses = responseRepository.findByMappingId(mappingId);
            List<Map<String, Object>> result = responses.stream().map(r -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", r.getId());
                map.put("questionId", r.getQuestion().getId());
                map.put("questionCriteria", r.getQuestion().getSatisfactionCriteria());
                map.put("rating", r.getRating());
                map.put("score", r.getScore() != null ? Integer.parseInt(r.getScore()) : 0);
                map.put("comments", r.getComments());
                return map;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching responses: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/reminder-logs/{mappingId}")
    public ResponseEntity<?> getReminderLogs(@PathVariable("mappingId") Long mappingId) {
        try {
            List<EmployeeSatisfactionReminderLog> logs = reminderLogRepository.findByMappingId(mappingId);
            List<Map<String, Object>> result = logs.stream().map(l -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", l.getId());
                map.put("reminderNumber", l.getReminderNumber() != null ? Integer.parseInt(l.getReminderNumber()) : 0);
                map.put("reminderDate", l.getReminderDate().toString());
                map.put("emailStatus", l.getEmailStatus());
                map.put("feedbackStatus", l.getMapping().getStatus());
                return map;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching reminder logs: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/manual-reminder/{mappingId}")
    public ResponseEntity<?> triggerManualReminder(
            @PathVariable("mappingId") Long mappingId,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            EmployeeSatisfactionMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Mapping not found with ID: " + mappingId));

            if ("Completed".equals(mapping.getStatus())) {
                return ResponseEntity.badRequest().body("Feedback already completed, no reminder needed.");
            }

            if (payload != null) {
                boolean updated = false;
                if (payload.get("employeeId") != null && mapping.getEmployee() != null) {
                    mapping.getEmployee().setEmpCode(payload.get("employeeId"));
                    updated = true;
                }
                if (payload.get("email") != null && mapping.getEmployee() != null) {
                    mapping.getEmployee().setOfficeMail(payload.get("email"));
                    updated = true;
                }
                if (updated && mapping.getEmployee() != null) {
                    employeeMasterRepository.save(mapping.getEmployee());
                }
            }

            LocalDate today = LocalDate.now();
            satisfactionService.sendReminderEmail(mapping, today);
            return ResponseEntity.ok().body(Map.of("message", "Manual reminder sent successfully."));
        } catch (Exception e) {
            log.error("Error triggering manual reminder: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(
            @RequestParam(value = "cycle", required = false) String cycle,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "departmentId", required = false) Long departmentId,
            @RequestParam(value = "designationId", required = false) Long designationId,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "joinStartDate", required = false) String joinStartDate,
            @RequestParam(value = "joinEndDate", required = false) String joinEndDate,
            @RequestParam(value = "minScore", required = false) Integer minScore,
            @RequestParam(value = "maxScore", required = false) Integer maxScore,
            @RequestParam(value = "riskLevel", required = false) String riskLevel,
            @RequestParam(value = "reminderStatus", required = false) String reminderStatus,
            @RequestParam(value = "search", required = false) String search) {
        try {
            List<EmployeeSatisfactionMapping> filtered = satisfactionService.getFilteredMappings(
                cycle, status, departmentId, designationId, startDate, endDate, joinStartDate, joinEndDate,
                minScore, maxScore, riskLevel, reminderStatus, search
            );
            return ResponseEntity.ok(satisfactionService.getAnalyticsFiltered(filtered));
        } catch (Exception e) {
            log.error("Error fetching analytics: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/risk-employees")
    public ResponseEntity<?> getRiskEmployees(
            @RequestParam(value = "cycle", required = false) String cycle,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "departmentId", required = false) Long departmentId,
            @RequestParam(value = "designationId", required = false) Long designationId,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "joinStartDate", required = false) String joinStartDate,
            @RequestParam(value = "joinEndDate", required = false) String joinEndDate,
            @RequestParam(value = "minScore", required = false) Integer minScore,
            @RequestParam(value = "maxScore", required = false) Integer maxScore,
            @RequestParam(value = "riskLevel", required = false) String riskLevel,
            @RequestParam(value = "reminderStatus", required = false) String reminderStatus,
            @RequestParam(value = "search", required = false) String search) {
        try {
            List<EmployeeSatisfactionMapping> filtered = satisfactionService.getFilteredMappings(
                cycle, status, departmentId, designationId, startDate, endDate, joinStartDate, joinEndDate,
                minScore, maxScore, riskLevel, reminderStatus, search
            );
            return ResponseEntity.ok(satisfactionService.getRiskEmployeesFiltered(filtered));
        } catch (Exception e) {
            log.error("Error fetching risk employees: {}", e.getMessage(), e);
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

    @PostMapping("/trigger-reminders")
    public ResponseEntity<?> triggerReminders() {
        try {
            satisfactionService.runDailyReminders();
            vendorSatisfactionService.runDailyVendorReminders();
            internalCustomerSatisfactionService.runDailyInternalCustomerReminders();
            customerSatisfactionFeedbackService.runDailyCustomerReminders();
            return ResponseEntity.ok(Map.of("message", "Reminder execution completed."));
        } catch (Exception e) {
            log.error("Error triggering reminders: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/questions")
    public ResponseEntity<?> getQuestions() {
        try {
            List<SatisfactionCriteria> list = criteriaRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getStatus()) && "Employee".equalsIgnoreCase(c.getSatisfactionType()))
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
            
            Optional<EmployeeMaster> empOpt = employeeMasterRepository.findByEmpCode(currentUserId);
            if (!empOpt.isPresent()) {
                empOpt = employeeMasterRepository.findByEmpCodeIgnoreCase(currentUserId);
            }
            if (!empOpt.isPresent()) {
                empOpt = employeeMasterRepository.findByOldEmpCode(currentUserId);
            }

            if (!empOpt.isPresent()) {
                Optional<com.autonoma.erp.model.admin.UserCredential> userCred = userRepository.findByUserId(currentUserId);
                if (userCred.isPresent() && userCred.get().getEmpId() != null) {
                    empOpt = employeeMasterRepository.findById(userCred.get().getEmpId());
                }
            }

            if (!empOpt.isPresent()) {
                try {
                    long pId = Long.parseLong(currentUserId.trim());
                    empOpt = employeeMasterRepository.findById(pId);
                } catch (NumberFormatException ignored) {}
            }

            if (!empOpt.isPresent()) {
                return ResponseEntity.status(404).body("Employee record not found for user: " + currentUserId);
            }

            EmployeeMaster emp = empOpt.get();
            List<EmployeeSatisfactionMapping> pending = mappingRepository.findByEmployeeIdAndStatusIn(emp.getId(), Arrays.asList("Pending", "Overdue", "Closed"));

            List<EmployeeSatisfactionMapping> filtered = pending.stream()
                .filter(m -> !"Closed".equals(m.getStatus()) || m.getSubmittedDate() == null)
                .collect(Collectors.toList());

            if (filtered.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            List<Map<String, Object>> result = filtered.stream().map(m -> {
                Map<String, Object> map = new HashMap<>();
                map.put("mappingId", m.getId());
                map.put("feedbackCycle", m.getFeedbackCycle());
                map.put("eligibilityDate", m.getEligibilityDate().toString());
                map.put("status", m.getStatus());
                map.put("employeeName", m.getEmployee() != null ? m.getEmployee().getEmployeeName() : null);
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching my pending feedback: {}", e.getMessage(), e);
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

            EmployeeSatisfactionMapping mapping = satisfactionService.submitFeedback(mappingId, generalComments, suggestions, responses);
            return ResponseEntity.ok(mapping);
        } catch (Exception e) {
            log.error("Error submitting feedback: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}

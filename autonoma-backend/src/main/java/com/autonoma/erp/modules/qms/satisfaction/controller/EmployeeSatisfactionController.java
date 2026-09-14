package com.autonoma.erp.modules.qms.satisfaction.controller;

import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.qms.satisfaction.entity.EmployeeSatisfactionResponse;
import com.autonoma.erp.modules.qms.satisfaction.entity.EmployeeSatisfactionTracking;
import com.autonoma.erp.modules.qms.satisfaction.entity.QmsSatisfactionCriteria;
import com.autonoma.erp.modules.qms.satisfaction.entity.VendorSatisfactionResponse;
import com.autonoma.erp.modules.qms.satisfaction.service.EmployeeSatisfactionService;
import com.autonoma.erp.modules.qms.satisfaction.service.SatisfactionReminderScheduler;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController("qmsEmployeeSatisfactionController")
@RequestMapping("/api/qms/satisfaction")
@Slf4j
public class EmployeeSatisfactionController {

    private final EmployeeSatisfactionService satisfactionService;
    private final SatisfactionReminderScheduler reminderScheduler;
    private final UserRepository userRepo;

    @org.springframework.beans.factory.annotation.Autowired
    public EmployeeSatisfactionController(
            EmployeeSatisfactionService satisfactionService,
            SatisfactionReminderScheduler reminderScheduler,
            UserRepository userRepo) {
        this.satisfactionService = satisfactionService;
        this.reminderScheduler = reminderScheduler;
        this.userRepo = userRepo;
    }

    // =========================================================================
    // 1. Criteria Master APIs
    // =========================================================================

    @GetMapping("/criteria")
    @RequirePagePermission(pageCode = "M2270", action = "read")
    public ResponseEntity<?> getCriteria(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String criteria) {
        Pageable pageable = PageRequest.of(page, size);
        Page<QmsSatisfactionCriteria> result = satisfactionService.getCriteriaPage(type, criteria, pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/criteria")
    @RequirePagePermission(pageCode = "M2270", action = "write")
    public ResponseEntity<?> createCriteria(@RequestBody QmsSatisfactionCriteria criteria) {
        QmsSatisfactionCriteria saved = satisfactionService.saveCriteria(criteria);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/criteria/{id}")
    @RequirePagePermission(pageCode = "M2270", action = "write")
    public ResponseEntity<?> updateCriteria(@PathVariable Long id, @RequestBody QmsSatisfactionCriteria criteria) {
        criteria.setId(id);
        QmsSatisfactionCriteria updated = satisfactionService.saveCriteria(criteria);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/criteria/{id}")
    @RequirePagePermission(pageCode = "M2270", action = "delete")
    public ResponseEntity<?> deleteCriteria(@PathVariable Long id) {
        satisfactionService.deleteCriteria(id);
        return ResponseEntity.ok(Map.of("message", "Criteria deleted successfully"));
    }

    // =========================================================================
    // 2. Feedback Entry APIs
    // =========================================================================

    // Feedback Entry APIs have been moved to QmsSatisfactionFeedbackController to support the new generic feedback tables.

    // =========================================================================
    // 3. Dashboard APIs
    // =========================================================================

    @GetMapping("/dashboard/cards")
    @RequirePagePermission(pageCode = "QM1520", action = "read")
    public ResponseEntity<?> getCards(@RequestParam String cycle) {
        Map<String, Object> cards = satisfactionService.getDashboardCards(cycle);
        return ResponseEntity.ok(cards);
    }

    @GetMapping("/dashboard/employees")
    @RequirePagePermission(pageCode = "QM1520", action = "read")
    public ResponseEntity<?> getEmployees(
            @RequestParam String cycle,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Double minScore,
            @RequestParam(required = false) Double maxScore,
            @RequestParam(required = false) String riskLevel) {
        List<Map<String, Object>> mappings = satisfactionService.getEmployeeMappings(cycle, departmentId, status, minScore, maxScore, riskLevel);
        return ResponseEntity.ok(mappings);
    }

    @GetMapping("/dashboard/reminders")
    @RequirePagePermission(pageCode = "QM1520", action = "read")
    public ResponseEntity<?> getReminders(@RequestParam String cycle) {
        List<Map<String, Object>> reminders = satisfactionService.getReminderTrackings(cycle);
        return ResponseEntity.ok(reminders);
    }

    @GetMapping("/dashboard/timeline/{employeeId}")
    @RequirePagePermission(pageCode = "QM1520", action = "read")
    public ResponseEntity<?> getTimeline(@PathVariable Long employeeId, @RequestParam String cycle) {
        List<?> timeline = satisfactionService.getEmployeeTimeline(employeeId, cycle);
        return ResponseEntity.ok(timeline);
    }

    @GetMapping("/dashboard/responses/{employeeId}")
    @RequirePagePermission(pageCode = "QM1520", action = "read")
    public ResponseEntity<?> getResponses(@PathVariable Long employeeId, @RequestParam String cycle) {
        List<EmployeeSatisfactionResponse> responses = satisfactionService.getEmployeeResponses(employeeId, cycle);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/dashboard/charts")
    @RequirePagePermission(pageCode = "QM1520", action = "read")
    public ResponseEntity<?> getCharts(@RequestParam String cycle) {
        Map<String, Object> charts = satisfactionService.getChartData(cycle);
        return ResponseEntity.ok(charts);
    }

    @PostMapping("/dashboard/assign")
    @RequirePagePermission(pageCode = "QM1520", action = "write")
    public ResponseEntity<?> assignCycle(@RequestParam String cycle, @RequestBody Map<String, Object> payload) {
        List<Integer> empIdsRaw = (List<Integer>) payload.get("employeeIds");
        List<Long> employeeIds = new ArrayList<>();
        if (empIdsRaw != null) {
            for (Integer id : empIdsRaw) {
                employeeIds.add(Long.valueOf(id));
            }
        }
        satisfactionService.assignFeedback(employeeIds, cycle, new Date());
        return ResponseEntity.ok(Map.of("message", "Feedback cycle assigned successfully."));
    }

    @PostMapping("/dashboard/trigger-reminder/{employeeId}")
    @RequirePagePermission(pageCode = "QM1520", action = "write")
    public ResponseEntity<?> manualReminder(@PathVariable Long employeeId, @RequestParam String cycle) {
        EmployeeSatisfactionTracking tracking = satisfactionService.getPendingTracking(employeeId, cycle)
                .orElseThrow(() -> new IllegalArgumentException("Feedback tracking record not found"));
        reminderScheduler.sendReminder(tracking);
        return ResponseEntity.ok(Map.of("message", "Reminder sent successfully."));
    }
}

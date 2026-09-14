package com.autonoma.erp.modules.hr.employee.controller;

import com.autonoma.erp.modules.hr.employee.entity.SatisfactionResponse;
import com.autonoma.erp.modules.hr.employee.entity.SatisfactionReminder;
import com.autonoma.erp.modules.hr.employee.repository.SatisfactionResponseRepository;
import com.autonoma.erp.modules.hr.employee.repository.SatisfactionReminderRepository;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/master/hr/satisfaction-dashboard")
@CrossOrigin(origins = "*")
public class EmployeeSatisfactionDashboardController {

    @Autowired
    private SatisfactionResponseRepository responseRepository;

    @Autowired
    private SatisfactionReminderRepository reminderRepository;

    @GetMapping("/data")
    @RequirePagePermission(pageCode = "HA1350", action = "read")
    public ResponseEntity<?> getDashboardData(@RequestParam(name = "type", defaultValue = "Employee") String satisfactionType) {
        // 1. Fetch filtered lists from DB
        List<SatisfactionResponse> allResponses = responseRepository.findBySatisfactionType(satisfactionType);
        List<SatisfactionReminder> allReminders = reminderRepository.findBySatisfactionType(satisfactionType);

        // 2. Aggregate KPI counts
        long assigned = allReminders.stream().filter(r -> "Assigned".equalsIgnoreCase(r.getFeedbackStatus())).count();
        long completed = allReminders.stream().filter(r -> "Completed".equalsIgnoreCase(r.getFeedbackStatus())).count();
        long pending = allReminders.stream().filter(r -> "Pending".equalsIgnoreCase(r.getFeedbackStatus())).count();
        long overdue = allReminders.stream().filter(r -> "Overdue".equalsIgnoreCase(r.getFeedbackStatus())).count();
        long closed = allReminders.stream().filter(r -> "Closed".equalsIgnoreCase(r.getFeedbackStatus())).count();

        Map<String, Long> kpis = new HashMap<>();
        kpis.put("assigned", assigned);
        kpis.put("completed", completed);
        kpis.put("pending", pending);
        kpis.put("overdue", overdue);
        kpis.put("closed", closed);

        // 3. Aggregate Overall Score metrics
        int totalResponses = allResponses.size();
        double averageScore = 0.0;
        double highestScore = 0.0;
        double lowestScore = 0.0;
        double overallSatisfactionScore = 0.0;

        if (totalResponses > 0) {
            averageScore = allResponses.stream().mapToDouble(SatisfactionResponse::getScore).average().orElse(0.0);
            highestScore = allResponses.stream().mapToDouble(SatisfactionResponse::getScore).max().orElse(0.0);
            lowestScore = allResponses.stream().mapToDouble(SatisfactionResponse::getScore).min().orElse(0.0);
            overallSatisfactionScore = averageScore; // e.g. score matches average percentage
        }

        Map<String, Object> overallScore = new HashMap<>();
        overallScore.put("totalResponses", totalResponses);
        overallScore.put("averageScore", Math.round(averageScore * 100.0) / 100.0);
        overallScore.put("highestScore", Math.round(highestScore * 100.0) / 100.0);
        overallScore.put("lowestScore", Math.round(lowestScore * 100.0) / 100.0);
        overallScore.put("overallSatisfactionScore", Math.round(overallSatisfactionScore * 100.0) / 100.0);

        // 4. Combine into final response map
        Map<String, Object> data = new HashMap<>();
        data.put("kpis", kpis);
        data.put("overallScore", overallScore);
        data.put("responses", allResponses);
        data.put("reminders", allReminders);

        return ResponseEntity.ok(data);
    }
}

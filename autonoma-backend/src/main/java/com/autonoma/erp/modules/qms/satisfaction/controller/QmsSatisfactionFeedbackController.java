package com.autonoma.erp.modules.qms.satisfaction.controller;

import com.autonoma.erp.modules.qms.satisfaction.service.QmsSatisfactionFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/qms/satisfaction/feedback")
@CrossOrigin(origins = "*")
public class QmsSatisfactionFeedbackController {

    private final QmsSatisfactionFeedbackService feedbackService;

    @org.springframework.beans.factory.annotation.Autowired
    public QmsSatisfactionFeedbackController(QmsSatisfactionFeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    /**
     * GET /api/qms/satisfaction/feedback/pending?cycle=June+2026
     * Returns a mock pending assignment for the logged-in user.
     * Returns 204 if not applicable (currently always returns an assignment).
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingAssignment(
            @RequestParam(value = "cycle", defaultValue = "June 2026") String cycle,
            Principal principal) {
        String username = principal != null ? principal.getName() : "ANONYMOUS";
        Map<String, Object> assignment = feedbackService.getPendingAssignment(username, cycle);
        return ResponseEntity.ok(assignment);
    }

    /**
     * GET /api/qms/satisfaction/feedback/questions?type=Employee
     * Returns active satisfaction criteria for the given type.
     */
    @GetMapping("/questions")
    public ResponseEntity<?> getQuestions(
            @RequestParam(value = "type", defaultValue = "Employee") String type) {
        return ResponseEntity.ok(feedbackService.getQuestions(type));
    }

    /**
     * GET /api/qms/satisfaction/feedback/saved?cycle=June+2026&type=Employee
     * Returns previously saved draft responses for the logged-in user.
     */
    @GetMapping("/saved")
    public ResponseEntity<?> getSaved(
            @RequestParam(value = "cycle", defaultValue = "June 2026") String cycle,
            @RequestParam(value = "type", defaultValue = "Employee") String type,
            Principal principal) {
        String username = principal != null ? principal.getName() : "ANONYMOUS";
        return ResponseEntity.ok(feedbackService.getSavedDraft(username, cycle, type));
    }

    /**
     * POST /api/qms/satisfaction/feedback/save-draft?cycle=June+2026
     * Saves or updates draft responses for the current user.
     * Body: List of { questionId, rating, comments }
     */
    @PostMapping("/save-draft")
    public ResponseEntity<?> saveDraft(
            @RequestBody List<Map<String, Object>> responses,
            @RequestParam(value = "cycle", defaultValue = "June 2026") String cycle,
            @RequestParam(value = "type", defaultValue = "Employee") String type,
            Principal principal) {
        String username = principal != null ? principal.getName() : "ANONYMOUS";
        try {
            var entry = feedbackService.saveDraft(username, responses, cycle, type);
            return ResponseEntity.ok(Map.of(
                    "message", "Draft saved successfully",
                    "entryId", entry.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * POST /api/qms/satisfaction/feedback/submit?cycle=June+2026&type=Employee
     * Finalizes and submits feedback.
     * Body: List of { questionId, rating, comments }
     */
    @PostMapping("/submit")
    public ResponseEntity<?> submitFeedback(
            @RequestBody List<Map<String, Object>> responses,
            @RequestParam(value = "cycle", defaultValue = "June 2026") String cycle,
            @RequestParam(value = "type", defaultValue = "Employee") String type,
            Principal principal) {
        String username = principal != null ? principal.getName() : "ANONYMOUS";
        try {
            var entry = feedbackService.submitFeedback(username, responses, cycle, type);
            return ResponseEntity.ok(Map.of(
                    "message", "Feedback submitted successfully",
                    "entryId", entry.getId(),
                    "totalScore", entry.getTotalScore(),
                    "averageScore", entry.getAverageScore()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * GET /api/qms/satisfaction/feedback/list?type=All
     * Returns all submitted feedback entries for the dashboard.
     */
    @GetMapping("/list")
    public ResponseEntity<?> listEntries(
            @RequestParam(value = "type", defaultValue = "All") String type) {
        return ResponseEntity.ok(feedbackService.getAllEntries(type));
    }
}

package com.autonoma.erp.modules.induction.controller;

import com.autonoma.erp.modules.induction.entity.InductionAssignment;
import com.autonoma.erp.modules.induction.entity.InductionTrainingDetail;
import com.autonoma.erp.modules.induction.repository.InductionAssignmentRepository;
import com.autonoma.erp.modules.induction.service.InductionTraineeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/public/induction-feedback")
@CrossOrigin(origins = "*")
public class InductionFeedbackPublicController {

    @Autowired
    private InductionAssignmentRepository assignmentRepo;

    @Autowired
    private InductionTraineeService traineeService;

    @GetMapping
    public ResponseEntity<?> getFeedbackDetails(@RequestParam String token) {
        Optional<InductionAssignment> assignmentOpt = assignmentRepo.findByFeedbackToken(token);
        if (!assignmentOpt.isPresent()) {
            return ResponseEntity.badRequest().body("This feedback link is invalid.");
        }
        InductionAssignment assignment = assignmentOpt.get();
        if (assignment.getFeedbackTokenActive() == null || !assignment.getFeedbackTokenActive()) {
            return ResponseEntity.badRequest().body("This feedback link has expired or has already been used.");
        }
        


        // Fetch details
        List<InductionTrainingDetail> details = traineeService.getDetails(assignment.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("assignment", assignment);
        response.put("details", details);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitFeedback(@RequestBody Map<String, Object> payload) {
        String token = (String) payload.get("token");
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Token is required.");
        }
        Optional<InductionAssignment> assignmentOpt = assignmentRepo.findByFeedbackToken(token);
        if (!assignmentOpt.isPresent()) {
            return ResponseEntity.badRequest().body("This feedback link is invalid.");
        }
        InductionAssignment assignment = assignmentOpt.get();
        if (assignment.getFeedbackTokenActive() == null || !assignment.getFeedbackTokenActive()) {
            return ResponseEntity.badRequest().body("This feedback link has expired or has already been used.");
        }

        List<?> rawResponses = (List<?>) payload.get("responses");
        if (rawResponses == null || rawResponses.isEmpty()) {
            return ResponseEntity.badRequest().body("Responses are required.");
        }

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        List<InductionTrainingDetail> responses;
        try {
            responses = mapper.convertValue(rawResponses, 
                mapper.getTypeFactory().constructCollectionType(List.class, InductionTrainingDetail.class));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid responses payload structure.");
        }

        try {
            // Submit trainee responses with a guest identifier
            InductionAssignment updatedAssignment = traineeService.submitResponses(assignment.getId(), responses, "TRAINEE_GUEST");
            return ResponseEntity.ok(updatedAssignment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

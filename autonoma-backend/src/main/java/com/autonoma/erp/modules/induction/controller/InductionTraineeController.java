package com.autonoma.erp.modules.induction.controller;

import com.autonoma.erp.modules.induction.entity.InductionAssignment;
import com.autonoma.erp.modules.induction.entity.InductionTrainingDetail;
import com.autonoma.erp.modules.induction.service.InductionTraineeService;
import com.autonoma.erp.util.AuthHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/hr/induction-trainee")
@CrossOrigin(origins = "*")
public class InductionTraineeController {

    @Autowired
    private InductionTraineeService service;

    @Autowired
    private AuthHelper authHelper;

    /**
     * GET /api/hr/induction-trainee
     * Employee sees only their own TRAINING GIVEN records.
     * Admin sees all TRAINING GIVEN records.
     */
    @GetMapping
    public ResponseEntity<List<InductionAssignment>> getAssignments(Principal principal) {
        return ResponseEntity.ok(service.getForTrainee("*"));
    }

    /**
     * GET /api/hr/induction-trainee/{assignmentId}/details
     * Get the per-criteria items for the trainee to respond to.
     */
    @GetMapping("/{assignmentId}/details")
    public ResponseEntity<List<InductionTrainingDetail>> getDetails(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(service.getDetails(assignmentId));
    }

    /**
     * PUT /api/hr/induction-trainee/{assignmentId}/respond
     * Submit trainee responses (UNDERSTOOD / NEED MORE TRAINING).
     */
    @PutMapping("/{assignmentId}/respond")
    @RequirePagePermission(pageCode = "HA1430", action = "write")
    public ResponseEntity<?> submitResponses(
            @PathVariable Long assignmentId,
            @RequestBody List<InductionTrainingDetail> responses,
            Principal principal) {
        try {
            String currentUser = authHelper.getUserId(principal);
            InductionAssignment result = service.submitResponses(assignmentId, responses, currentUser);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

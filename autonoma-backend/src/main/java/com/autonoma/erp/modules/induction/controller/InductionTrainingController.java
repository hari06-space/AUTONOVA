package com.autonoma.erp.modules.induction.controller;


import com.autonoma.erp.modules.induction.entity.InductionAssignment;
import com.autonoma.erp.modules.induction.entity.InductionTrainingDetail;
import com.autonoma.erp.modules.induction.service.InductionTrainingService;
import com.autonoma.erp.util.AuthHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/hr/induction-training")
@CrossOrigin(origins = "*")
public class InductionTrainingController {

    @Autowired
    private InductionTrainingService service;

    @Autowired
    private AuthHelper authHelper;

    /**
     * GET /api/hr/induction-training
     * Trainer sees only their assignments. Admin sees all.
     */
    @GetMapping
    public ResponseEntity<List<InductionAssignment>> getAssignments(Principal principal) {
        return ResponseEntity.ok(service.getAllReady());
    }

    /**
     * GET /api/hr/induction-training/all
     * Admin-only: see all training assignments.
     */
    @GetMapping("/all")
    public ResponseEntity<List<InductionAssignment>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /**
     * GET /api/hr/induction-training/{assignmentId}/details
     * Get the per-criteria training items for a specific assignment.
     */
    @GetMapping("/{assignmentId}/details")
    public ResponseEntity<List<InductionTrainingDetail>> getDetails(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(service.getDetails(assignmentId));
    }

    /**
     * POST /api/hr/induction-training/{assignmentId}/start
     * Start training: creates detail rows from InductionMaster criteria.
     */
    @PostMapping("/{assignmentId}/start")
    @RequirePagePermission(pageCode = "HA1420", action = "write")
    public ResponseEntity<?> startTraining(@PathVariable Long assignmentId, Principal principal) {
        try {
            String currentUser = authHelper.getUserId(principal);
            InductionAssignment result = service.startTraining(assignmentId, currentUser);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * PUT /api/hr/induction-training/{assignmentId}/details
     * Save trainer progress (batch update items).
     */
    @PutMapping("/{assignmentId}/details")
    @RequirePagePermission(pageCode = "HA1420", action = "write")
    public ResponseEntity<?> saveProgress(
            @PathVariable Long assignmentId,
            @RequestBody List<InductionTrainingDetail> updates,
            Principal principal) {
        try {
            String currentUser = authHelper.getUserId(principal);
            service.saveProgress(assignmentId, updates, currentUser);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * POST /api/hr/induction-training/{assignmentId}/complete
     * Mark training as given: validates all items + calculates rating.
     */
    @PostMapping("/{assignmentId}/complete")
    @RequirePagePermission(pageCode = "HA1420", action = "write")
    public ResponseEntity<?> completeTraining(@PathVariable Long assignmentId, Principal principal) {
        try {
            String currentUser = authHelper.getUserId(principal);
            InductionAssignment result = service.completeTraining(assignmentId, currentUser);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

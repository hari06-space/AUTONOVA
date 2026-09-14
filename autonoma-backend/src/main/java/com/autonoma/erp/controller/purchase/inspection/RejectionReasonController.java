package com.autonoma.erp.controller.purchase.inspection;

import com.autonoma.erp.model.purchase.inspection.RejectionReason;
import com.autonoma.erp.service.purchase.inspection.RejectionReasonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase/rejection-reasons")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RejectionReasonController {

    @Autowired
    private RejectionReasonService service;

    @GetMapping
    public ResponseEntity<List<RejectionReason>> getAllActiveReasons() {
        return ResponseEntity.ok(service.getAllActiveReasons());
    }

    @PostMapping
    public ResponseEntity<RejectionReason> createReason(
            @RequestParam String reason, 
            @RequestParam String userId) {
        try {
            RejectionReason created = service.createReason(reason, userId);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

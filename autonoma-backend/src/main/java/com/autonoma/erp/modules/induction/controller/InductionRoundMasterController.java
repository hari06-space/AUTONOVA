package com.autonoma.erp.modules.induction.controller;

import com.autonoma.erp.modules.induction.entity.InductionRoundMaster;
import com.autonoma.erp.modules.induction.repository.InductionRoundMasterRepository;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/hr/induction-round")
@CrossOrigin(origins = "*")
public class InductionRoundMasterController {

    @Autowired
    private InductionRoundMasterRepository repository;

    /**
     * Get all rounds (ordered by displayOrder).
     */
    @GetMapping
    @RequirePagePermission(pageCode = "M2180", action = "read")
    public ResponseEntity<List<InductionRoundMaster>> getAll() {
        return ResponseEntity.ok(repository.findAllOrdered());
    }

    /**
     * Get only ACTIVE rounds (used by dropdowns in Assignment & Criteria pages).
     */
    @GetMapping("/active")
    @RequirePagePermission(pageCode = "M2180", action = "read")
    public ResponseEntity<List<InductionRoundMaster>> getActive() {
        return ResponseEntity.ok(repository.findAllActive());
    }

    /**
     * Create a new round.
     */
    @PostMapping
    @RequirePagePermission(pageCode = "M2180", action = "write")
    public ResponseEntity<?> create(@RequestBody InductionRoundMaster entity, Principal principal) {
        try {
            // Duplicate check
            if (repository.findByRoundName(entity.getRoundName()).isPresent()) {
                return ResponseEntity.badRequest().body("Round '" + entity.getRoundName() + "' already exists.");
            }

            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            entity.setCreatedBy(currentUser);
            entity.setCreatedAt(new Date());
            if (entity.getIsActive() == null) {
                entity.setIsActive(true);
            }
            return ResponseEntity.ok(repository.save(entity));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Update an existing round.
     */
    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2180", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody InductionRoundMaster entity, Principal principal) {
        try {
            InductionRoundMaster existing = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Round not found."));

            // Duplicate check (exclude self)
            repository.findByRoundName(entity.getRoundName()).ifPresent(found -> {
                if (!found.getId().equals(id)) {
                    throw new RuntimeException("Round '" + entity.getRoundName() + "' already exists.");
                }
            });

            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            existing.setRoundName(entity.getRoundName());
            existing.setDescription(entity.getDescription());
            existing.setIsActive(entity.getIsActive());
            existing.setDisplayOrder(entity.getDisplayOrder());
            existing.setUpdatedBy(currentUser);
            existing.setUpdatedAt(new Date());

            return ResponseEntity.ok(repository.save(existing));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Soft-delete (set status to IN ACTIVE).
     */
    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2180", action = "delete")
    public ResponseEntity<?> deactivate(@PathVariable Long id, Principal principal) {
        try {
            InductionRoundMaster existing = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Round not found."));

            String currentUser = principal != null ? principal.getName() : "SYSTEM";
            existing.setIsActive(false);
            existing.setUpdatedBy(currentUser);
            existing.setUpdatedAt(new Date());
            repository.save(existing);

            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

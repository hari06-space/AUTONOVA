package com.autonoma.erp.modules.hr.month.controller;

import com.autonoma.erp.modules.hr.month.entity.HrMonthMaster;
import com.autonoma.erp.modules.hr.month.repository.HrMonthMasterRepository;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the unified Month Master.
 *
 * Endpoints:
 *   GET  /api/master/hr/payroll/months          → all months (list page)
 *   GET  /api/master/hr/payroll/months?type=HR  → filtered by MONTH_TYPE (dropdown consumers)
 *   POST /api/master/hr/payroll/months          → create
 *   PUT  /api/master/hr/payroll/months/{id}     → update
 *   DELETE /api/master/hr/payroll/months/{id}   → delete
 */
@RestController
@RequestMapping("/api/master/hr/payroll/months")
@CrossOrigin(origins = "*")
public class HrMonthMasterController {

    @Autowired
    private HrMonthMasterRepository monthMasterRepository;

    /**
     * Returns all months.
     * If the optional query param {@code type} is provided (REGULAR | HR),
     * only months of that type are returned, sorted by SEQ_NO — useful for dropdowns.
     */
    @GetMapping("/next-seq-no")
    public ResponseEntity<Integer> getNextSeqNo(@RequestParam String type) {
        try {
            Integer maxSeq = monthMasterRepository.findMaxSeqNoByMonthType(type.toUpperCase()).orElse(0);
            return ResponseEntity.ok(maxSeq + 1);
        } catch (Exception e) {
            return ResponseEntity.ok(1);
        }
    }

    @GetMapping
    public List<HrMonthMaster> getAll(@RequestParam(required = false) String type) {
        if (type != null && !type.isBlank()) {
            return monthMasterRepository.findByMonthTypeAndIsActiveTrueOrderBySeqNoAsc(type.toUpperCase());
        }
        return monthMasterRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HrMonthMaster> getById(@PathVariable Long id) {
        return monthMasterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2395", action = "write")
    public ResponseEntity<?> create(@RequestBody HrMonthMaster month) {
        if (month.getMonthType() == null || month.getMonthType().isBlank()) {
            return ResponseEntity.badRequest().body("Month Type is required.");
        }
        if (month.getMonthName() == null || month.getMonthName().isBlank()) {
            return ResponseEntity.badRequest().body("Month Name is required.");
        }
        month.setMonthType(month.getMonthType().toUpperCase());

        if (monthMasterRepository.existsByMonthTypeAndMonthName(month.getMonthType(), month.getMonthName())) {
            return ResponseEntity.badRequest().body(
                    "'" + month.getMonthName() + "' already exists for type " + month.getMonthType() + "."
            );
        }
        try {
            return ResponseEntity.ok(monthMasterRepository.save(month));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to save month: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2395", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody HrMonthMaster details) {
        return monthMasterRepository.findById(id)
                .map(existing -> {
                    if (details.getMonthType() == null || details.getMonthType().isBlank()) {
                        return ResponseEntity.badRequest().body((Object) "Month Type is required.");
                    }
                    if (details.getMonthName() == null || details.getMonthName().isBlank()) {
                        return ResponseEntity.badRequest().body((Object) "Month Name is required.");
                    }

                    String type = details.getMonthType().toUpperCase();
                    if (monthMasterRepository.existsByMonthTypeAndMonthNameAndIdNot(type, details.getMonthName(), id)) {
                        return ResponseEntity.badRequest().body((Object) (
                                "'" + details.getMonthName() + "' already exists for type " + type + "."
                        ));
                    }

                    existing.setMonthType(type);
                    existing.setMonthName(details.getMonthName());
                    existing.setSeqNo(details.getSeqNo() != null ? details.getSeqNo() : existing.getSeqNo());
                    existing.setIsActive(details.getIsActive() != null ? details.getIsActive() : existing.getIsActive());
                    existing.setUpdatedBy(SecurityUtils.getCurrentUserId());

                    return ResponseEntity.ok((Object) monthMasterRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2395", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return monthMasterRepository.findById(id)
                .map(month -> {
                    monthMasterRepository.delete(month);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

package com.autonoma.erp.modules.hr.attendance.controller;

import com.autonoma.erp.modules.hr.attendance.entity.ShiftMaster;
import com.autonoma.erp.modules.hr.attendance.repository.ShiftMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/hr/shift-master")
public class ShiftMasterController {

    @Autowired
    private ShiftMasterRepository repository;

    @GetMapping
    public ResponseEntity<List<ShiftMaster>> getAll() {
        return ResponseEntity.ok(repository.findAllByOrderByShiftCodeAsc());
    }

    @GetMapping({"/active", "/shifts"})
    public ResponseEntity<List<ShiftMaster>> getActive() {
        return ResponseEntity.ok(repository.findByIsActiveTrue());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody ShiftMaster entry) {
        // Check for duplicate shift code
        if (entry.getShiftCode() != null) {
            Optional<ShiftMaster> existingOpt = repository.findByShiftCode(entry.getShiftCode());
            if (existingOpt.isPresent()) {
                ShiftMaster existing = existingOpt.get();
                if (entry.getId() == null || !existing.getId().equals(entry.getId())) {
                    // Update the existing record (upsert)
                    existing.setShiftName(entry.getShiftName());
                    existing.setStartTime(entry.getStartTime());
                    existing.setEndTime(entry.getEndTime());
                    existing.setBreakMinutes(entry.getBreakMinutes());
                    existing.setGraceMinutes(entry.getGraceMinutes());
                    existing.setStandardHours(entry.getStandardHours());
                    existing.setIsNightShift(entry.getIsNightShift());
                    existing.setIsActive(entry.getIsActive());
                    return ResponseEntity.ok(repository.save(existing));
                }
            }
        }

        if (entry.getId() != null) {
            Optional<ShiftMaster> byIdOpt = repository.findById(entry.getId());
            if (byIdOpt.isPresent()) {
                ShiftMaster existing = byIdOpt.get();
                existing.setShiftCode(entry.getShiftCode());
                existing.setShiftName(entry.getShiftName());
                existing.setStartTime(entry.getStartTime());
                existing.setEndTime(entry.getEndTime());
                existing.setBreakMinutes(entry.getBreakMinutes());
                existing.setGraceMinutes(entry.getGraceMinutes());
                existing.setStandardHours(entry.getStandardHours());
                existing.setIsNightShift(entry.getIsNightShift());
                existing.setIsActive(entry.getIsActive());
                return ResponseEntity.ok(repository.save(existing));
            }
        }

        return ResponseEntity.ok(repository.save(entry));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Shift deleted successfully.");
        return ResponseEntity.ok(response);
    }
}

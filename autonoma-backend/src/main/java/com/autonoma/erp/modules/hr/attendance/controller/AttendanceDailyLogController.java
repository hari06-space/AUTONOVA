package com.autonoma.erp.modules.hr.attendance.controller;

import com.autonoma.erp.modules.hr.attendance.dto.AttendanceDailyLogDTO;
import com.autonoma.erp.modules.hr.attendance.dto.AttendanceDailyLogSaveRequest;
import com.autonoma.erp.modules.hr.attendance.service.AttendanceDailyLogService;
import com.autonoma.erp.security.RequirePagePermission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr/attendance-daily-log")
public class AttendanceDailyLogController {

    private static final Logger log = LoggerFactory.getLogger(AttendanceDailyLogController.class);

    @Autowired
    private AttendanceDailyLogService service;

    /**
     * Steps 1-6: Load all employee attendance for a given date.
     */
    @GetMapping("/by-date")
    @RequirePagePermission(pageCode = "HA1345", action = "read")
    public ResponseEntity<?> getByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            List<AttendanceDailyLogDTO> data = service.loadDailyAttendance(date);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("Error loading attendance for date {}: {}", date, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Steps 8-13: Recalculate metrics for a single entry (frontend real-time calculation).
     */
    @PostMapping("/calculate")
    @RequirePagePermission(pageCode = "HA1345", action = "read")
    public ResponseEntity<?> calculate(@RequestBody AttendanceDailyLogDTO dto) {
        try {
            AttendanceDailyLogDTO result = service.calculateMetrics(dto);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error calculating metrics: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Steps 14-16: Save a single attendance entry.
     */
    @PostMapping("/save")
    @RequirePagePermission(pageCode = "HA1345", action = "write")
    public ResponseEntity<?> save(@RequestBody AttendanceDailyLogSaveRequest request) {
        try {
            AttendanceDailyLogDTO saved = service.saveEntry(request);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error saving attendance entry: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to save: " + e.getMessage()));
        }
    }

    /**
     * Batch save all entries for a date.
     */
    @PostMapping("/save-bulk")
    @RequirePagePermission(pageCode = "HA1345", action = "write")
    public ResponseEntity<?> saveBulk(@RequestBody List<AttendanceDailyLogSaveRequest> entries) {
        try {
            List<AttendanceDailyLogDTO> saved = service.saveBulk(entries);
            return ResponseEntity.ok(Map.of(
                    "message", "Successfully saved " + saved.size() + " attendance entries.",
                    "data", saved));
        } catch (Exception e) {
            log.error("Error saving bulk attendance: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

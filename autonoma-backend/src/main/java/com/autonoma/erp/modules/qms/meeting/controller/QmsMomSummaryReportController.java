package com.autonoma.erp.modules.qms.meeting.controller;

import com.autonoma.erp.modules.qms.meeting.dto.QmsMomSummaryReportDto;
import com.autonoma.erp.modules.qms.meeting.service.QmsMomSummaryReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/qms/mom-summary-report")
public class QmsMomSummaryReportController {

    @Autowired
    private QmsMomSummaryReportService summaryReportService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<List<QmsMomSummaryReportDto>> getSummaryReport(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String considerDate,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String employeeName,
            @RequestParam(required = false) String status
    ) {
        List<QmsMomSummaryReportDto> reports = summaryReportService.getSummaryReport(
                type, fromDate, toDate, considerDate, department, employeeName, status);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/debug")
    public Map<String, Object> debug() {
        Map<String, Object> result = new HashMap<>();
        result.put("statuses", jdbcTemplate.queryForList("SELECT ID, NAME FROM AD_STATUS_MASTER"));
        return result;
    }
}

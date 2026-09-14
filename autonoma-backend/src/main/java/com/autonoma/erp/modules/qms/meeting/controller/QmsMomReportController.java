package com.autonoma.erp.modules.qms.meeting.controller;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMomReportHd;
import com.autonoma.erp.modules.qms.meeting.service.QmsMomReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/qms/mom-report")
public class QmsMomReportController {

    @Autowired
    private QmsMomReportService reportService;

    @GetMapping
    public ResponseEntity<List<QmsMomReportHd>> getReports(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String process,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String actionValue
    ) {
        List<QmsMomReportHd> reports = reportService.getReports(type, fromDate, toDate, status, process, actionType, actionValue);
        return ResponseEntity.ok(reports);
    }
    @GetMapping("/debug")
    public ResponseEntity<?> debugReports() {
        return ResponseEntity.ok(reportService.getReports("Company", null, null, "ALL", "ALL", null, null));
    }
}

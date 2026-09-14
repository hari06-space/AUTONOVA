package com.autonoma.erp.modules.hr.leave.controller;

import com.autonoma.erp.modules.hr.leave.entity.LeaveEncashmentEntry;
import com.autonoma.erp.modules.hr.leave.service.LeaveEncashmentEntryService;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/hr/leave-encashment")
@CrossOrigin(origins = "*")
public class LeaveEncashmentEntryController {

    @Autowired
    private LeaveEncashmentEntryService service;

    // M2391: Leave Encashment Request — registered via V271 migration
    private static final String PAGE_CODE = "M2391";

    @GetMapping
    @RequirePagePermission(pageCode = PAGE_CODE, action = "read")
    public ResponseEntity<Page<LeaveEncashmentEntry>> searchLeaveEncashment(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String employeeName,
            @RequestParam(required = false) String employeeCode,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fromDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(service.searchLeaveEncashment(status, employeeName, employeeCode, fromDate, toDate, pageable));
    }

    @PostMapping("/save")
    @RequirePagePermission(pageCode = PAGE_CODE, action = "write")
    public ResponseEntity<?> saveLeaveEncashment(@RequestBody LeaveEncashmentEntry entry) {
        LeaveEncashmentEntry saved = service.saveLeaveEncashment(entry);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Leave Encashment Entry saved successfully");
        response.put("data", saved);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/submit")
    @RequirePagePermission(pageCode = PAGE_CODE, action = "write")
    public ResponseEntity<?> submitLeaveEncashment(@PathVariable Long id) {
        LeaveEncashmentEntry submitted = service.submitForApproval(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Sent for approval successfully");
        response.put("data", submitted);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = PAGE_CODE, action = "delete")
    public ResponseEntity<?> deleteLeaveEncashment(@PathVariable Long id) {
        service.deleteLeaveEncashment(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Leave Encashment Entry deleted successfully");
        return ResponseEntity.ok(response);
    }
}

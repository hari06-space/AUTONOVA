package com.autonoma.erp.modules.qms.checklist.controller;

import com.autonoma.erp.modules.qms.checklist.entity.ChecklistClosed;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Date;

@RestController
@RequestMapping("/api/qms/checklist")
@Tag(name = "QMS - Closed Checklist", description = "Endpoints for retrieving closed checklists directly")
public class ChecklistClosedController {

    @Autowired
    private ChecklistService checklistService;

    @GetMapping("/closed-direct")
    @Operation(summary = "Get Closed Checklists Directly", description = "Fetches a paginated list of ChecklistClosed entities directly")
    public ResponseEntity<Page<ChecklistClosed>> getClosedChecklistsDirect(
            @RequestParam(required = false) Long checklistId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fromDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date toDate,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String searchBy,
            @RequestParam(required = false) String searchValue,
            @RequestParam(required = false) String masterVerifyStatus,
            @RequestParam(required = false) String taskType,
            @RequestParam(required = false) String currentUser,
            @RequestParam(defaultValue = "false") boolean excludeCompleted,
            @RequestParam(defaultValue = "false") boolean excludePending,
            @RequestParam(required = false) String dualCheck,
            @RequestParam(required = false) String considerDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date considerDateValue,
            @RequestParam(required = false) String seqNo,
            @RequestParam(required = false) String checkingPoint,
            @RequestParam(required = false) String frequency,
            @RequestParam(required = false) String stockLink,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String assignedBy,
            @RequestParam(required = false) String assignType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok(checklistService.getClosedChecklistsDirect(checklistId, status, assignedTo, fromDate, toDate, category,
                searchBy, searchValue, masterVerifyStatus, taskType, currentUser, excludeCompleted, excludePending,
                dualCheck, considerDate, considerDateValue, seqNo, checkingPoint, frequency, stockLink, department,
                assignedBy, assignType, pageable));
    }
}

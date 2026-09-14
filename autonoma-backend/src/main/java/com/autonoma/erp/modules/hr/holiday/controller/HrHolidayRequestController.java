package com.autonoma.erp.modules.hr.holiday.controller;

import com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;

import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.leave.entity.HrLeaveMaster;
import com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;
import com.autonoma.erp.modules.hr.leave.repository.HrLeaveMasterRepository;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.hr.leave.service.HrLeaveRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Holiday Request Controller — delegates to HrLeaveRequestService.
 * Optional/Personal holiday requests are stored in HR_LEAVE_REQUEST (leave type OH/PL).
 * This controller retains its original URL path (/api/hra/holiday-requests) for full
 * backward compatibility with the existing frontend views, and translates between
 * the holiday-shaped DTO used by the UI and the underlying HrLeaveRequest entity.
 */
@RestController
@RequestMapping("/api/hra/holiday-requests")
@CrossOrigin(origins = "*")
public class HrHolidayRequestController {

    private static final String CODE_OPTIONAL_HOLIDAY = "OH";
    private static final String CODE_PERSONAL_HOLIDAY = "PL";

    @Autowired
    private HrLeaveRequestService service;

    @Autowired
    private HrLeaveMasterRepository leaveMasterRepository;

    @Autowired
    private HrHolidayMasterRepository holidayMasterRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeManagerMappingRepository managerMappingRepository;

    @GetMapping("/me")
    @RequirePagePermission(pageCode = "HA1210", action = "read")
    public List<Map<String, Object>> getMyRequests() {
        return service.findMyRequests().stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    @GetMapping("/pending/manager")
    @RequirePagePermission(pageCode = "HA1220", action = "read")
    public List<Map<String, Object>> getPendingForManager() {
        return service.findPendingForManager().stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    @GetMapping("/pending/hr")
    @RequirePagePermission(pageCode = "HA1230", action = "read")
    public List<Map<String, Object>> getPendingForHr() {
        return service.findPendingForHr().stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(toResponseDto(service.findById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @RequirePagePermission(pageCode = "HA1210", action = "write")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> payload) {
        try {
            HrLeaveRequest entity = fromRequestDto(payload, new HrLeaveRequest());
            return ResponseEntity.ok(toResponseDto(service.create(entity)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1210", action = "write")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            HrLeaveRequest staged = fromRequestDto(payload, new HrLeaveRequest());
            return ResponseEntity.ok(toResponseDto(service.update(id, staged)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/submit")
    @RequirePagePermission(pageCode = "HA1210", action = "write")
    public ResponseEntity<?> submit(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(toResponseDto(service.submit(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/cancel")
    @RequirePagePermission(pageCode = "HA1210", action = "write")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(toResponseDto(service.cancel(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "HA1210", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Approval workflow ───────────────────────────────────────────────────

    @GetMapping("/{id}/conflicts")
    public List<Map<String, Object>> getConflicts(@PathVariable Long id) {
        return service.findConflicts(id).stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    @PatchMapping("/{id}/approve-manager")
    @RequirePagePermission(pageCode = "HA1220", action = "approval")
    public ResponseEntity<?> approveManager(@PathVariable Long id,
                                            @RequestBody(required = false) Map<String, String> body) {
        try {
            String remarks = body != null ? body.get("remarks") : null;
            return ResponseEntity.ok(toResponseDto(service.approveByManager(id, remarks)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/reject-manager")
    @RequirePagePermission(pageCode = "HA1220", action = "approval")
    public ResponseEntity<?> rejectManager(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> body) {
        try {
            String remarks = body != null ? body.get("remarks") : null;
            return ResponseEntity.ok(toResponseDto(service.rejectByManager(id, remarks)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/approve-hr")
    @RequirePagePermission(pageCode = "HA1230", action = "approval")
    public ResponseEntity<?> approveHr(@PathVariable Long id,
                                       @RequestBody(required = false) Map<String, String> body) {
        try {
            String remarks = body != null ? body.get("remarks") : null;
            return ResponseEntity.ok(toResponseDto(service.approveByHr(id, remarks)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/reject-hr")
    @RequirePagePermission(pageCode = "HA1230", action = "approval")
    public ResponseEntity<?> rejectHr(@PathVariable Long id,
                                      @RequestBody(required = false) Map<String, String> body) {
        try {
            String remarks = body != null ? body.get("remarks") : null;
            return ResponseEntity.ok(toResponseDto(service.rejectByHr(id, remarks)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Reports ─────────────────────────────────────────────────────────────

    @GetMapping("/report/calendar")
    @RequirePagePermission(pageCode = "HA1240", action = "read")
    public List<Map<String, Object>> getApprovedBetween(@RequestParam("from") String from,
                                                        @RequestParam("to") String to) {
        return service.findApprovedBetween(LocalDate.parse(from), LocalDate.parse(to))
                .stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    @GetMapping("/report/yearly-summary")
    @RequirePagePermission(pageCode = "HA1250", action = "read")
    public List<Map<String, Object>> getApprovedByYear(@RequestParam("year") Integer year) {
        return service.findApprovedByYear(year)
                .stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    // ── DTO translation ─────────────────────────────────────────────────────

    /**
     * Builds an HrLeaveRequest from the holiday-shaped UI payload:
     *   { requestType: 'OPTIONAL_HOLIDAY' | 'PERSONAL_HOLIDAY',
     *     holidayId?: number, holidayName?: string, holidayDate: 'YYYY-MM-DD', reason?: string }
     */
    private HrLeaveRequest fromRequestDto(Map<String, Object> payload, HrLeaveRequest target) {
        String requestType = stringValue(payload.get("requestType"));
        if (requestType == null || requestType.isBlank()) {
            throw new RuntimeException("Request Type is required");
        }
        String leaveCode = mapRequestTypeToLeaveCode(requestType);
        HrLeaveMaster leaveType = leaveMasterRepository.findByLeaveCode(leaveCode)
                .orElseThrow(() -> new RuntimeException(
                        "Leave type '" + leaveCode + "' is not configured in HR_LEAVE_MASTER"));

        String holidayDateStr = stringValue(payload.get("holidayDate"));
        if (holidayDateStr == null || holidayDateStr.isBlank()) {
            throw new RuntimeException("Holiday Date is required");
        }
        LocalDate date = LocalDate.parse(holidayDateStr.length() > 10 ? holidayDateStr.substring(0, 10) : holidayDateStr);

        target.setLeaveTypeId(leaveType.getLeaveTypeId());
        target.setLeaveTypeName(leaveType.getLeaveName());
        target.setStartDate(date);
        target.setEndDate(date);
        target.setNumberOfDays(1.0);

        Object holidayIdRaw = payload.get("holidayId");
        if (holidayIdRaw != null && !holidayIdRaw.toString().isBlank()) {
            try {
                target.setHolidayId(Long.parseLong(holidayIdRaw.toString()));
            } catch (NumberFormatException ignored) {
                target.setHolidayId(null);
            }
        } else {
            target.setHolidayId(null);
        }

        String reason = stringValue(payload.get("reason"));
        if (CODE_PERSONAL_HOLIDAY.equals(leaveCode) && (reason == null || reason.isBlank())) {
            throw new RuntimeException("Reason is required for personal holiday requests");
        }
        target.setReason(reason);
        return target;
    }

    private Map<String, Object> toResponseDto(HrLeaveRequest req) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("requestId", req.getLeaveRequestId());
        dto.put("requestNo", req.getRequestNo());
        dto.put("empId", req.getEmpId());
        dto.put("empCode", req.getEmpCode());
        dto.put("empName", req.getEmpName());
        dto.put("departmentId", req.getDepartmentId());
        dto.put("departmentName", req.getDepartmentName());

        String leaveCode = null;
        if (req.getLeaveTypeId() != null) {
            leaveCode = leaveMasterRepository.findById(req.getLeaveTypeId())
                    .map(HrLeaveMaster::getLeaveCode).orElse(null);
        }
        dto.put("requestType", mapLeaveCodeToRequestType(leaveCode));
        dto.put("leaveTypeId", req.getLeaveTypeId());
        dto.put("leaveTypeName", req.getLeaveTypeName());

        dto.put("holidayId", req.getHolidayId());
        String holidayName = null;
        if (req.getHolidayId() != null) {
            holidayName = holidayMasterRepository.findById(req.getHolidayId())
                    .map(HrHolidayMaster::getHolidayName).orElse(null);
        }
        if (holidayName == null) {
            holidayName = CODE_PERSONAL_HOLIDAY.equals(leaveCode) ? "Personal Holiday" : req.getLeaveTypeName();
        }
        dto.put("holidayName", holidayName);
        dto.put("holidayDate", req.getStartDate());
        dto.put("holidayDay", req.getStartDate() != null ? req.getStartDate().getDayOfWeek().toString() : null);

        dto.put("status", req.getStatus());
        dto.put("reason", req.getReason());
        dto.put("managerId", req.getManagerId());
        dto.put("managerName", req.getManagerName());
        dto.put("managerRemarks", req.getManagerRemarks());
        dto.put("managerActionDate", req.getManagerActionDate());
        dto.put("hrId", req.getHrId());
        dto.put("hrName", req.getHrName());
        dto.put("hrRemarks", req.getHrRemarks());
        dto.put("hrActionDate", req.getHrActionDate());
        dto.put("rejectionReason", req.getRejectionReason());
        dto.put("requestDate", req.getRequestDate());
        dto.put("submittedDate", req.getSubmittedDate());
        dto.put("createdBy", req.getCreatedBy());
        dto.put("createdDate", req.getCreatedDate());

        // New Vertical Head Approval fields
        dto.put("approvedBy", req.getApprovedBy());
        dto.put("approvedDate", req.getApprovedDate());
        dto.put("rejectedBy", req.getRejectedBy());
        dto.put("rejectedDate", req.getRejectedDate());
        dto.put("approvalRemarks", req.getApprovalRemarks());
        dto.put("numberOfDays", req.getNumberOfDays());

        // Dynamically resolve Vertical Head details
        if (req.getEmpId() != null) {
            try {
                managerMappingRepository.findByEmpIdAndStatus(req.getEmpId(), "Active").ifPresent(m -> {
                    if (m.getVerticalHeadId() != null) {
                        dto.put("verticalHeadId", m.getVerticalHeadId());
                        employeeRepository.findById(m.getVerticalHeadId()).ifPresent(vh -> {
                            dto.put("verticalHeadName", vh.getEmployeeName());
                        });
                    }
                });
            } catch (Exception ignored) {}
        }

        return dto;
    }

    private String mapRequestTypeToLeaveCode(String requestType) {
        return switch (requestType) {
            case "OPTIONAL_HOLIDAY" -> CODE_OPTIONAL_HOLIDAY;
            case "PERSONAL_HOLIDAY" -> CODE_PERSONAL_HOLIDAY;
            default -> throw new RuntimeException("Unknown requestType: " + requestType);
        };
    }

    private String mapLeaveCodeToRequestType(String leaveCode) {
        if (CODE_OPTIONAL_HOLIDAY.equals(leaveCode)) return "OPTIONAL_HOLIDAY";
        if (CODE_PERSONAL_HOLIDAY.equals(leaveCode)) return "PERSONAL_HOLIDAY";
        return leaveCode;
    }

    private String stringValue(Object o) {
        return o == null ? null : o.toString();
    }
}

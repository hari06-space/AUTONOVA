package com.autonoma.erp.controller;

import com.autonoma.erp.model.HrOtMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.service.HrOtMasterService;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.model.admin.UserCredential;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/hra/ot-master")
@CrossOrigin(origins = "*")
public class HrOtMasterController {

    @Autowired
    private HrOtMasterService otMasterService;

    @Autowired
    private UserRepository userRepository;

    private Long getCurrentUserCompanyId() {
        return 1L;
    }

    private Long getCurrentUserEmpId() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null && !"SYSTEM".equals(currentUserId)) {
            UserCredential user = userRepository.findById(currentUserId).orElse(null);
            if (user != null) {
                return user.getEmpId();
            }
        }
        return null;
    }

    @GetMapping("/eligible-employees")
    @RequirePagePermission(pageCode = "HA1347", action = "read")
    public ResponseEntity<List<EmployeeMaster>> getEligibleEmployees() {
        Long companyId = getCurrentUserCompanyId();
        return ResponseEntity.ok(otMasterService.getEligibleEmployees(companyId));
    }

    @GetMapping("/list")
    @RequirePagePermission(pageCode = "HA1347", action = "read")
    public ResponseEntity<List<HrOtMaster>> getOtRecords(
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date toDate,
            @RequestParam(value = "employeeId", required = false) Long employeeId,
            @RequestParam(value = "self", required = false) Boolean self) {

        Long companyId = getCurrentUserCompanyId();
        Long filterEmpId = employeeId;

        if (Boolean.TRUE.equals(self)) {
            filterEmpId = getCurrentUserEmpId();
        }

        return ResponseEntity.ok(otMasterService.getOtRecords(companyId, fromDate, toDate, filterEmpId));
    }

    @GetMapping("/pending-verifications")
    @RequirePagePermission(pageCode = "HA1348", action = "read")
    public ResponseEntity<List<HrOtMaster>> getPendingVerifications(
            @RequestParam(value = "verticalHeadId", required = false) Long verticalHeadId,
            @RequestParam(value = "all", required = false) Boolean all) {

        Long companyId = getCurrentUserCompanyId();
        Long filterVerticalHeadId = verticalHeadId;

        if (!Boolean.TRUE.equals(all) && filterVerticalHeadId == null) {
            filterVerticalHeadId = getCurrentUserEmpId();
        }

        return ResponseEntity.ok(otMasterService.getPendingVerifications(companyId, filterVerticalHeadId));
    }

    @PostMapping("/save")
    @RequirePagePermission(pageCode = "HA1347", action = "write")
    public ResponseEntity<?> saveOtRecord(@RequestBody HrOtMaster entry) {
        if (entry.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Employee selection is required."));
        }
        if (entry.getOtDate() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "OT Date is required."));
        }
        if (entry.getDurationMinutes() == null || entry.getDurationMinutes() <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Valid OT Duration in minutes is required."));
        }

        HrOtMaster saved = otMasterService.saveOtRecord(entry);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/verify")
    @RequirePagePermission(pageCode = "HA1348", action = "approval")
    public ResponseEntity<?> verifyOtRecord(@RequestBody Map<String, Object> payload) {
        Object otIdObj = payload.get("otId");
        Object idsObj = payload.get("ids");
        String action = (String) payload.get("action");
        String rejectReason = (String) payload.get("rejectReason");

        if (action == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Action (APPROVE/REJECT) is required."));
        }

        if (idsObj instanceof List<?>) {
            List<?> idsList = (List<?>) idsObj;
            List<HrOtMaster> verifiedList = new ArrayList<>();
            for (Object item : idsList) {
                Long id = Long.parseLong(item.toString());
                verifiedList.add(otMasterService.verifyOtRecord(id, action, rejectReason));
            }
            return ResponseEntity.ok(verifiedList);
        } else if (otIdObj != null) {
            Long otId = Long.parseLong(otIdObj.toString());
            HrOtMaster verified = otMasterService.verifyOtRecord(otId, action, rejectReason);
            return ResponseEntity.ok(verified);
        }

        return ResponseEntity.badRequest().body(Map.of("message", "Invalid OT ID parameter."));
    }

    @GetMapping("/payroll-summary")
    public ResponseEntity<?> getPayrollOtSummary(
            @RequestParam("employeeId") Long employeeId,
            @RequestParam("month") Integer month,
            @RequestParam("year") Integer year) {

        Integer approvedMinutes = otMasterService.getApprovedOtMinutes(employeeId, month, year);
        double approvedHours = approvedMinutes != null ? approvedMinutes / 60.0 : 0.0;

        return ResponseEntity.ok(Map.of(
                "employeeId", employeeId,
                "month", month,
                "year", year,
                "approvedMinutes", approvedMinutes != null ? approvedMinutes : 0,
                "approvedHours", approvedHours
        ));
    }
}

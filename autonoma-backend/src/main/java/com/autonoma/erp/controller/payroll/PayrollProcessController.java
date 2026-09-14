package com.autonoma.erp.controller.payroll;

import com.autonoma.erp.service.payroll.PayrollProcessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payroll/process")
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "Payroll Process Module", description = "New Payroll Process API (Master/Trans)")
public class PayrollProcessController {

    @Autowired
    private PayrollProcessService payrollProcessService;

    @GetMapping("/periods")
    @Operation(summary = "Get all processed payroll periods")
    public ResponseEntity<List<Map<String, Object>>> getProcessedPeriods() {
        return ResponseEntity.ok(payrollProcessService.getProcessedPeriods());
    }

    @GetMapping("/filters")
    @Operation(summary = "Get companies, categories, and departments for filters")
    public ResponseEntity<Map<String, Object>> getFilters() {
        return ResponseEntity.ok(payrollProcessService.getFilters());
    }

    @PostMapping("/calculate")
    @Operation(summary = "Dry-run calculate payroll for a target month and year with optional filters")
    public ResponseEntity<List<Map<String, Object>>> calculatePayroll(
            @RequestParam Integer year,
            @RequestParam String month,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long employeeId) {
        return ResponseEntity.ok(payrollProcessService.calculatePayroll(year, month, companyId, categoryId, departmentId, employeeId));
    }

    @PostMapping("/save")
    @Operation(summary = "Save and commit calculated payroll")
    public ResponseEntity<String> savePayroll(
            @RequestParam Integer year,
            @RequestParam String month,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long departmentId,
            @RequestBody List<Map<String, Object>> payload) {
        payrollProcessService.savePayroll(year, month, companyId, categoryId, departmentId, payload);
        return ResponseEntity.ok("Payroll processed and saved successfully");
    }

    @PostMapping("/validate")
    @Operation(summary = "Check if payroll run already exists/approved")
    public ResponseEntity<Map<String, Object>> validatePayroll(
            @RequestParam Integer year,
            @RequestParam String month,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long departmentId) {
        return ResponseEntity.ok(payrollProcessService.validatePayroll(year, month, companyId, categoryId, departmentId));
    }

    @PostMapping("/approve")
    @Operation(summary = "Approve processed payroll for a target month, year and filters")
    public ResponseEntity<String> approvePayroll(
            @RequestParam Integer year,
            @RequestParam String month,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long departmentId) {
        payrollProcessService.approvePayroll(year, month, companyId, categoryId, departmentId);
        return ResponseEntity.ok("Payroll period approved successfully");
    }

    @DeleteMapping("/period")
    @Operation(summary = "Delete processed payroll for a period")
    public ResponseEntity<String> deletePayrollPeriod(
            @RequestParam Integer year,
            @RequestParam String month,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long departmentId) {
        payrollProcessService.deletePayrollPeriod(year, month, companyId, categoryId, departmentId);
        return ResponseEntity.ok("Payroll period deleted successfully");
    }

    @GetMapping("/details")
    @Operation(summary = "Get detailed processed payroll for a target month and year")
    public ResponseEntity<List<Map<String, Object>>> getProcessedDetails(
            @RequestParam Integer year,
            @RequestParam String month,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long departmentId) {
        return ResponseEntity.ok(payrollProcessService.getProcessedDetails(year, month, companyId, categoryId, departmentId));
    }
}

package com.autonoma.erp.controller.payroll;

import com.autonoma.erp.model.payroll.HrPayrollAttendance;
import com.autonoma.erp.model.payroll.HrPayrollAttendanceConfig;
import com.autonoma.erp.model.payroll.HrPayrollComponent;
import com.autonoma.erp.model.payroll.HrPayrollComponentDependency;
import com.autonoma.erp.model.payroll.HrPayrollEmployeeDetail;
import com.autonoma.erp.model.payroll.HrPayrollEmployeeSummary;
import com.autonoma.erp.model.payroll.HrPayrollProcessConfig;
import com.autonoma.erp.model.payroll.HrPayrollRun;
import com.autonoma.erp.model.payroll.HrPayrollStatutory;
import com.autonoma.erp.model.payroll.HrPayrollStructure;
import com.autonoma.erp.model.payroll.HrPayrollStructureAssignment;
import com.autonoma.erp.model.payroll.HrPayrollStructureDetail;
import com.autonoma.erp.model.payroll.HrPayrollValidationRule;
import com.autonoma.erp.model.payroll.HrPayslipTemplate;
import com.autonoma.erp.repository.payroll.HrPayrollAttendanceConfigRepository;
import com.autonoma.erp.repository.payroll.HrPayrollAttendanceRepository;
import com.autonoma.erp.repository.payroll.HrPayrollComponentDependencyRepository;
import com.autonoma.erp.repository.payroll.HrPayrollComponentRepository;
import com.autonoma.erp.repository.payroll.HrPayrollEmployeeDetailRepository;
import com.autonoma.erp.repository.payroll.HrPayrollEmployeeSummaryRepository;
import com.autonoma.erp.repository.payroll.HrPayrollProcessConfigRepository;
import com.autonoma.erp.repository.payroll.HrPayrollRunRepository;
import com.autonoma.erp.repository.payroll.HrPayrollStatutoryRepository;
import com.autonoma.erp.repository.payroll.HrPayrollStructureAssignmentRepository;
import com.autonoma.erp.repository.payroll.HrPayrollStructureDetailRepository;
import com.autonoma.erp.repository.payroll.HrPayrollStructureRepository;
import com.autonoma.erp.repository.payroll.HrPayrollValidationRuleRepository;
import com.autonoma.erp.repository.payroll.HrPayslipTemplateRepository;
import com.autonoma.erp.repository.payroll.HrSalaryRegisterConfigRepository;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;

import com.autonoma.erp.model.payroll.*;
import com.autonoma.erp.repository.payroll.*;
import com.autonoma.erp.service.payroll.DependencyResolver;
import com.autonoma.erp.service.payroll.PayrollEngineService;
import com.autonoma.erp.service.payroll.PayrollReportService;
import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.util.PayrollFormulaEvaluator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "Payroll Engine Module", description = "Dynamic Configuration and Salary Processing API")
public class PayrollController {

    @Autowired
    private HrPayrollComponentRepository componentRepository;

    @Autowired
    private HrPayrollComponentDependencyRepository componentDependencyRepository;

    @Autowired
    private HrPayrollStructureRepository structureRepository;

    @Autowired
    private HrPayrollStructureDetailRepository structureDetailRepository;

    @Autowired
    private HrPayrollStructureAssignmentRepository structureAssignmentRepository;

    @Autowired
    private HrPayrollStatutoryRepository statutoryRepository;

    @Autowired
    private HrPayrollAttendanceConfigRepository attendanceConfigRepository;

    @Autowired
    private HrPayrollAttendanceRepository attendanceRepository;

    @Autowired
    private HrPayrollProcessConfigRepository processConfigRepository;

    @Autowired
    private HrPayrollValidationRuleRepository validationRuleRepository;

    @Autowired
    private HrPayslipTemplateRepository payslipTemplateRepository;

    @Autowired
    private HrSalaryRegisterConfigRepository salaryRegisterConfigRepository;

    @Autowired
    private HrPayrollRunRepository payrollRunRepository;

    @Autowired
    private HrPayrollEmployeeSummaryRepository employeeSummaryRepository;

    @Autowired
    private HrPayrollEmployeeDetailRepository employeeDetailRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeRepository;

    @Autowired
    private PayrollEngineService engineService;

    @Autowired
    private PayrollReportService reportService;

    @Autowired
    private DependencyResolver dependencyResolver;

    // ======================== SALARY COMPONENTS ========================

    @GetMapping("/components")
    @Operation(summary = "List all components")
    public List<HrPayrollComponent> getAllComponents() {
        return componentRepository.findAll();
    }

    @PostMapping("/components")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    @Operation(summary = "Save or update salary component")
    public HrPayrollComponent saveComponent(@RequestBody HrPayrollComponent component) {
        if (component.getComponentCode() != null) {
            component.setComponentCode(component.getComponentCode().toUpperCase());
        }
        if (component.getRowId() != null && component.getIsActive() != null && !component.getIsActive()) {
            boolean isMapped = structureDetailRepository.existsByComponentRowId(component.getRowId());
            if (isMapped) {
                throw new IllegalArgumentException("Cannot make component inactive. It is currently mapped in one or more salary structures.");
            }
        }
        return componentRepository.save(component);
    }

    @DeleteMapping("/components/{id}")
    @RequirePagePermission(pageCode = "AD1250", action = "delete")
    @Operation(summary = "Delete component")
    public ResponseEntity<Void> deleteComponent(@PathVariable Long id) {
        componentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/components/validate-formula")
    @Operation(summary = "Dry-run validate a formula syntax")
    public ResponseEntity<Map<String, Object>> validateFormula(@RequestBody Map<String, String> payload) {
        String formula = payload.get("formula");
        Map<String, Object> resp = new HashMap<>();
        Set<String> variables = new HashSet<>();
        try {
            List<HrPayrollComponent> components = componentRepository.findAll();
            if (components != null) {
                for (HrPayrollComponent comp : components) {
                    if (comp.getComponentCode() != null) {
                        variables.add(comp.getComponentCode().toUpperCase());
                    }
                }
            }
        } catch (Exception e) {
            // Keep variables empty on database error
        }
        boolean ok = PayrollFormulaEvaluator.validate(formula, variables);
        resp.put("valid", ok);
        resp.put("message", ok ? "Formula is syntactically correct." : "Invalid formula expression or unrecognized functions/variables.");
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/components/auto-sequence")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    @Operation(summary = "Auto-resolve execution order and update sequence numbers")
    public ResponseEntity<Map<String, Object>> autoSequence() {
        Map<String, Object> resp = new HashMap<>();
        try {
            List<HrPayrollComponent> components = componentRepository.findByIsActiveTrueOrderBySequenceNoAsc();
            List<HrPayrollComponentDependency> dependencies = componentDependencyRepository.findAll();
            List<HrPayrollComponent> sorted = dependencyResolver.resolveAndSort(components, dependencies);

            int seq = 10;
            for (HrPayrollComponent c : sorted) {
                c.setSequenceNo(seq);
                componentRepository.save(c);
                seq += 10;
            }
            resp.put("success", true);
            resp.put("message", "Calculated sequence numbers updated successfully.");
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
        }
        return ResponseEntity.ok(resp);
    }

    // ======================== COMPONENT DEPENDENCY ========================

    @GetMapping("/dependencies")
    public List<HrPayrollComponentDependency> getAllDependencies() {
        return componentDependencyRepository.findAll();
    }

    @PostMapping("/dependencies")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    public HrPayrollComponentDependency saveDependency(@RequestBody HrPayrollComponentDependency dependency) {
        if (dependency.getComponentCode() != null) dependency.setComponentCode(dependency.getComponentCode().toUpperCase());
        if (dependency.getDependsOnComponentCode() != null) dependency.setDependsOnComponentCode(dependency.getDependsOnComponentCode().toUpperCase());
        return componentDependencyRepository.save(dependency);
    }

    @DeleteMapping("/dependencies/{id}")
    @RequirePagePermission(pageCode = "AD1250", action = "delete")
    public ResponseEntity<Void> deleteDependency(@PathVariable Long id) {
        componentDependencyRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ======================== SALARY STRUCTURES ========================

    @GetMapping("/structures")
    public List<HrPayrollStructure> getAllStructures() {
        return structureRepository.findAll();
    }

    @GetMapping("/structures/{id}")
    public ResponseEntity<Map<String, Object>> getStructureWithDetails(@PathVariable Long id) {
        Optional<HrPayrollStructure> structOpt = structureRepository.findById(id);
        if (!structOpt.isPresent()) return ResponseEntity.notFound().build();
        
        Map<String, Object> resp = new HashMap<>();
        resp.put("structure", structOpt.get());
        resp.put("details", structureDetailRepository.findByStructureId(id));
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/structures")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    @Transactional
    public HrPayrollStructure saveStructure(@RequestBody Map<String, Object> payload) {
        // Parse Structure Header
        Map<String, Object> headerMap = (Map<String, Object>) payload.get("structure");
        Long rowId = headerMap.get("rowId") != null ? ((Number) headerMap.get("rowId")).longValue() : null;
        if (rowId != null) {
            throw new IllegalArgumentException("Modifying an existing salary structure is not allowed. Please create a new structure.");
        }

        HrPayrollStructure struct = new HrPayrollStructure();
        struct.setStructureCode((String) headerMap.get("structureCode"));
        struct.setStructureName((String) headerMap.get("structureName"));
        struct.setDescription((String) headerMap.get("description"));
        struct.setIsActive(headerMap.get("isActive") == null || (Boolean) headerMap.get("isActive"));
        if (headerMap.get("employeeTypeId") != null) {
            struct.setEmployeeTypeId(((Number) headerMap.get("employeeTypeId")).longValue());
        } else {
            struct.setEmployeeTypeId(null);
        }
        struct.setEffectiveFrom(new Date());

        // Deactivate existing active structures for the same employee type
        if (struct.getIsActive() && struct.getEmployeeTypeId() != null) {
            List<HrPayrollStructure> existingActive = structureRepository.findByEmployeeTypeIdAndIsActiveTrueOrderByRowIdDesc(struct.getEmployeeTypeId());
            for (HrPayrollStructure existing : existingActive) {
                existing.setIsActive(false);
                structureRepository.save(existing);
            }
        }

        struct = structureRepository.save(struct);

        // Delete old details if updating
        if (struct.getRowId() != null) {
            structureDetailRepository.deleteByStructureId(struct.getRowId());
        }

        // Parse details
        List<Map<String, Object>> detailsList = (List<Map<String, Object>>) payload.get("details");
        if (detailsList != null) {
            for (Map<String, Object> dMap : detailsList) {
                Map<String, Object> compMap = (Map<String, Object>) dMap.get("component");
                Long compId = ((Number) compMap.get("rowId")).longValue();
                HrPayrollComponent comp = componentRepository.findById(compId).orElse(null);
                if (comp == null) continue;

                HrPayrollStructureDetail detail = new HrPayrollStructureDetail();
                detail.setStructureId(struct.getRowId());
                detail.setComponent(comp);
                detail.setCalculationType((String) dMap.get("calculationType"));
                detail.setCalculationValue(dMap.get("calculationValue") != null ? new java.math.BigDecimal(dMap.get("calculationValue").toString()) : null);
                detail.setFormulaExpression((String) dMap.get("formulaExpression"));
                structureDetailRepository.save(detail);
                structureDetailRepository.save(detail);
            }
        }

        return struct;
    }

    @DeleteMapping("/structures/{id}")
    @RequirePagePermission(pageCode = "AD1250", action = "delete")
    @Transactional
    public ResponseEntity<Void> deleteStructure(@PathVariable Long id) {
        structureDetailRepository.deleteByStructureId(id);
        structureRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ======================== STRUCTURE ASSIGNMENT ========================

    @GetMapping("/structures/assignments")
    public List<HrPayrollStructureAssignment> getAllAssignments() {
        return structureAssignmentRepository.findAll();
    }

    @PostMapping("/structures/assignments")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    public HrPayrollStructureAssignment saveAssignment(@RequestBody HrPayrollStructureAssignment assignment) {
        assignment.setEffectiveFrom(new Date());
        return structureAssignmentRepository.save(assignment);
    }

    @DeleteMapping("/structures/assignments/{id}")
    @RequirePagePermission(pageCode = "AD1250", action = "delete")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        structureAssignmentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ======================== STATUTORY SETUP ========================

    @GetMapping("/statutory")
    public List<HrPayrollStatutory> getAllStatutoryConfigs() {
        return statutoryRepository.findAll();
    }

    @PostMapping("/statutory")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    public HrPayrollStatutory saveStatutory(@RequestBody HrPayrollStatutory statutory) {
        statutory.setEffectiveFrom(new Date());
        return statutoryRepository.save(statutory);
    }

    // ======================== ATTENDANCE CONFIG & DATA ========================

    @GetMapping("/attendance-config")
    public HrPayrollAttendanceConfig getAttendanceConfig() {
        return attendanceConfigRepository.findFirstByIsActiveTrue()
                .orElseGet(() -> {
                    HrPayrollAttendanceConfig defaultConfig = new HrPayrollAttendanceConfig();
                    defaultConfig.setWorkingDaysCalculation("CALENDAR_DAYS");
                    defaultConfig.setWeeklyOffHandling("PAID");
                    defaultConfig.setHolidayHandling("PAID");
                    defaultConfig.setLeaveHandlingJson("{\"CL\":\"PAID\",\"SL\":\"PAID\",\"EL\":\"PAID\",\"LOP\":\"UNPAID\"}");
                    defaultConfig.setLopCalculationFormula("(GROSS / TOTAL_DAYS) * LOP_DAYS");
                    defaultConfig.setHalfDayCalculation("0.5");
                    defaultConfig.setAttendanceSourceMapping("MANUAL");
                    return defaultConfig;
                });
    }

    @PostMapping("/attendance-config")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    public HrPayrollAttendanceConfig saveAttendanceConfig(@RequestBody HrPayrollAttendanceConfig config) {
        return attendanceConfigRepository.save(config);
    }

    @GetMapping("/attendance")
    public List<HrPayrollAttendance> getAttendanceData(@RequestParam Integer year, @RequestParam String month) {
        return attendanceRepository.findByPayrollYearAndPayrollMonth(year, month);
    }

    @PostMapping("/attendance")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    public HrPayrollAttendance saveAttendanceRecord(@RequestBody HrPayrollAttendance record) {
        return attendanceRepository.save(record);
    }

    @PostMapping("/attendance/bulk")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    public ResponseEntity<List<HrPayrollAttendance>> saveBulkAttendance(@RequestBody List<HrPayrollAttendance> records) {
        List<HrPayrollAttendance> saved = new ArrayList<>();
        for (HrPayrollAttendance r : records) {
            Optional<HrPayrollAttendance> existing = attendanceRepository.findByEmpCodeAndPayrollYearAndPayrollMonth(
                    r.getEmpCode(), r.getPayrollYear(), r.getPayrollMonth()
            );
            if (existing.isPresent()) {
                HrPayrollAttendance ext = existing.get();
                ext.setTotalDays(r.getTotalDays());
                ext.setPresentDays(r.getPresentDays());
                ext.setLopDays(r.getLopDays());
                ext.setWeeklyOffs(r.getWeeklyOffs());
                ext.setHolidays(r.getHolidays());
                ext.setPaidLeaves(r.getPaidLeaves());
                ext.setPaidDays(r.getPaidDays());
                saved.add(attendanceRepository.save(ext));
            } else {
                saved.add(attendanceRepository.save(r));
            }
        }
        return ResponseEntity.ok(saved);
    }

    // ======================== PROCESS CONFIG ========================

    @GetMapping("/process-configs")
    public List<HrPayrollProcessConfig> getAllProcessConfigs() {
        return processConfigRepository.findAllByOrderByPayrollYearDescStartDateDesc();
    }

    @PostMapping("/process-configs")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    public HrPayrollProcessConfig saveProcessConfig(@RequestBody HrPayrollProcessConfig config) {
        return processConfigRepository.save(config);
    }

    @DeleteMapping("/process-configs/{id}")
    @RequirePagePermission(pageCode = "AD1250", action = "delete")
    @Operation(summary = "Delete payroll process configuration (Month)")
    public ResponseEntity<Void> deleteProcessConfig(@PathVariable Long id) {
        processConfigRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ======================== VALIDATION RULES ========================

    @GetMapping("/validation-rules")
    public List<HrPayrollValidationRule> getAllValidationRules() {
        return validationRuleRepository.findAll();
    }

    @PostMapping("/validation-rules")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    public HrPayrollValidationRule saveValidationRule(@RequestBody HrPayrollValidationRule rule) {
        return validationRuleRepository.save(rule);
    }

    @DeleteMapping("/validation-rules/{id}")
    @RequirePagePermission(pageCode = "AD1250", action = "delete")
    public ResponseEntity<Void> deleteValidationRule(@PathVariable Long id) {
        validationRuleRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ======================== PAYSLIP TEMPLATE ========================

    @GetMapping("/payslip-template")
    public HrPayslipTemplate getPayslipTemplate() {
        return payslipTemplateRepository.findByIsDefaultTrue()
                .orElseGet(() -> {
                    HrPayslipTemplate defaultTmpl = new HrPayslipTemplate();
                    defaultTmpl.setTemplateName("Standard Template");
                    defaultTmpl.setHeaderHtml("<h2>Enterprise ERP Payslip</h2>");
                    defaultTmpl.setFooterHtml("This is a computer generated document and does not require signature.");
                    defaultTmpl.setIsDefault(true);
                    return defaultTmpl;
                });
    }

    @PostMapping("/payslip-template")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    public HrPayslipTemplate savePayslipTemplate(@RequestBody HrPayslipTemplate template) {
        template.setIsDefault(true); // Simplified
        return payslipTemplateRepository.save(template);
    }

    // ======================== PAYROLL EXECUTION / RUNS ========================

    @GetMapping("/runs")
    public List<HrPayrollRun> getPayrollRuns() {
        return payrollRunRepository.findAllByOrderByPayrollYearDescPayrollMonthDesc();
    }

    @PostMapping("/runs")
    @RequirePagePermission(pageCode = "AD1250", action = "write")
    public ResponseEntity<HrPayrollRun> triggerPayrollRun(@RequestBody Map<String, Object> payload) {
        Integer year = ((Number) payload.get("year")).intValue();
        String month = (String) payload.get("month");
        String user = "admin";
        try {
            user = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmployeeName();
        } catch (Exception e) {}

        HrPayrollRun run = engineService.runPayroll(year, month, user);
        return ResponseEntity.ok(run);
    }

    @GetMapping("/runs/{id}/employees")
    public List<HrPayrollEmployeeSummary> getRunEmployeeSummaries(@PathVariable Long id) {
        return employeeSummaryRepository.findByPayrollRunId(id);
    }

    @GetMapping("/employee-summary/{id}/details")
    public List<HrPayrollEmployeeDetail> getEmployeeSalaryDetails(@PathVariable Long id) {
        Optional<HrPayrollEmployeeSummary> summaryOpt = employeeSummaryRepository.findById(id);
        if (summaryOpt.isPresent()) {
            HrPayrollEmployeeSummary summary = summaryOpt.get();
            Long empId = employeeRepository.findByEmpCode(summary.getEmpCode()).map(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster::getId).orElse(null);
            if (empId != null) {
                return employeeDetailRepository.findByPayrollRunIdAndEmpId(summary.getPayrollRunId(), empId);
            }
        }
        return List.of();
    }

    // ======================== EXPORT REPORTS ========================

    @GetMapping("/runs/{id}/register/excel")
    public ResponseEntity<byte[]> downloadSalaryRegisterExcel(@PathVariable Long id) {
        try {
            byte[] data = reportService.generateSalaryRegisterExcel(id);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDisposition(ContentDisposition.builder("attachment")
                    .filename("Salary_Register_Run_" + id + ".xlsx")
                    .build());
            return new ResponseEntity<>(data, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/employee-summary/{id}/payslip/pdf")
    public ResponseEntity<byte[]> downloadPayslipPdf(@PathVariable Long id) {
        try {
            byte[] data = reportService.generatePayslipPdf(id);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.builder("inline")
                    .filename("Payslip_EmployeeSummary_" + id + ".pdf")
                    .build());
            return new ResponseEntity<>(data, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}

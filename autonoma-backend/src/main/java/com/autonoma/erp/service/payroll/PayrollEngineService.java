package com.autonoma.erp.service.payroll;

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

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.model.payroll.*;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.repository.payroll.*;
import com.autonoma.erp.util.PayrollFormulaEvaluator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class PayrollEngineService {

    @Autowired
    private EmployeeMasterRepository employeeRepository;

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
    private HrPayrollRunRepository payrollRunRepository;

    @Autowired
    private HrPayrollEmployeeSummaryRepository employeeSummaryRepository;

    @Autowired
    private HrPayrollEmployeeDetailRepository employeeDetailRepository;

    @Autowired
    private DependencyResolver dependencyResolver;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Transactional
    public HrPayrollRun runPayroll(Integer year, String month, String executedBy) {
        // 1. Check if period is locked
        Optional<HrPayrollProcessConfig> procConfigOpt = processConfigRepository.findByPayrollYearAndPayrollMonth(year, month);
        if (procConfigOpt.isPresent() && "LOCKED".equalsIgnoreCase(procConfigOpt.get().getStatus())) {
            throw new IllegalStateException("Payroll period " + month + "-" + year + " is locked and cannot be processed.");
        }

        // Find or create payroll run record
        HrPayrollRun run = payrollRunRepository.findByPayrollYearAndPayrollMonth(year, month)
                .orElseGet(() -> {
                    HrPayrollRun newRun = new HrPayrollRun();
                    newRun.setFinancialYear((year - 1) + "-" + year);
                    newRun.setPayrollMonth(month);
                    newRun.setPayrollYear(year);
                    newRun.setStatus("PROCESSING");
                    return newRun;
                });
        
        run.setStatus("PROCESSING");
        run.setCreatedBy(executedBy);
        run = payrollRunRepository.save(run);

        // Delete old execution details for this run if any
        employeeDetailRepository.deleteByPayrollRunId(run.getRowId());
        employeeSummaryRepository.deleteByPayrollRunId(run.getRowId());

        // 2. Load and sort components
        List<HrPayrollComponent> components = componentRepository.findByIsActiveTrueOrderBySequenceNoAsc();
        List<HrPayrollComponentDependency> dependencies = componentDependencyRepository.findAll();
        List<HrPayrollComponent> sortedComponents = dependencyResolver.resolveAndSort(components, dependencies);

        // 3. Load active employees
        List<EmployeeMaster> employees = employeeRepository.findByStatus("Active");
        
        // 4. Load attendance config
        HrPayrollAttendanceConfig attConfig = attendanceConfigRepository.findFirstByIsActiveTrue()
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

        // Load monthly attendances
        List<HrPayrollAttendance> monthlyAtt = attendanceRepository.findByPayrollYearAndPayrollMonth(year, month);
        Map<String, HrPayrollAttendance> attendanceMap = new HashMap<>();
        for (HrPayrollAttendance att : monthlyAtt) {
            attendanceMap.put(att.getEmpCode().toUpperCase(), att);
        }

        // 5. Load Statutory variables
        Map<String, BigDecimal> statutoryVars = loadStatutoryVariables();

        // 6. Load validation rules
        List<HrPayrollValidationRule> valRules = validationRuleRepository.findByIsEnabledTrue();

        int totalCount = employees.size();
        int processedCount = 0;
        int failedCount = 0;
        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;

        // Process each employee
        for (EmployeeMaster emp : employees) {
            try {
                HrPayrollEmployeeSummary summary = processEmployeeSalary(
                        run.getRowId(), year, month, emp, sortedComponents, attConfig,
                        attendanceMap.get(emp.getEmpCode().toUpperCase()), statutoryVars, valRules, executedBy
                );
                
                if ("ERROR".equalsIgnoreCase(summary.getStatus())) {
                    failedCount++;
                } else {
                    processedCount++;
                    totalGross = totalGross.add(summary.getGrossEarnings());
                    totalDeductions = totalDeductions.add(summary.getTotalDeductions());
                    totalNet = totalNet.add(summary.getNetSalary());
                }
            } catch (Exception e) {
                failedCount++;
                HrPayrollEmployeeSummary errorSummary = new HrPayrollEmployeeSummary();
                errorSummary.setPayrollRunId(run.getRowId());
                errorSummary.setEmpCode(emp.getEmpCode());
                errorSummary.setEmployeeName(emp.getEmployeeName());
                errorSummary.setDepartmentName(emp.getDepartment() != null ? emp.getDepartment().getDepartmentName() : "N/A");
                errorSummary.setDesignationName(emp.getDesignation() != null ? emp.getDesignation().getDesignationName() : "N/A");
                errorSummary.setPresentDays(BigDecimal.ZERO);
                errorSummary.setLopDays(BigDecimal.ZERO);
                errorSummary.setPaidDays(BigDecimal.ZERO);
                errorSummary.setGrossEarnings(BigDecimal.ZERO);
                errorSummary.setTotalDeductions(BigDecimal.ZERO);
                errorSummary.setNetSalary(BigDecimal.ZERO);
                errorSummary.setStatus("ERROR");
                errorSummary.setErrorMessage(e.getMessage() != null ? e.getMessage() : e.toString());
                errorSummary.setCreatedBy(executedBy);
                employeeSummaryRepository.save(errorSummary);
            }
        }

        // Update run stats
        run.setTotalEmployees(totalCount);
        run.setProcessedEmployees(processedCount);
        run.setFailedEmployees(failedCount);
        run.setGrossSalary(totalGross.setScale(2, RoundingMode.HALF_UP));
        run.setTotalDeductions(totalDeductions.setScale(2, RoundingMode.HALF_UP));
        run.setNetPayable(totalNet.setScale(2, RoundingMode.HALF_UP));
        run.setStatus("COMPLETED");
        run.setUpdatedBy(executedBy);
        
        return payrollRunRepository.save(run);
    }

    private Map<String, BigDecimal> loadStatutoryVariables() {
        Map<String, BigDecimal> vars = new HashMap<>();
        
        // PF Defaults
        vars.put("PF_LIMIT", BigDecimal.valueOf(15000));
        vars.put("PF_PCT", BigDecimal.valueOf(12));
        
        // ESI Defaults
        vars.put("ESI_LIMIT", BigDecimal.valueOf(21000));
        vars.put("ESI_PCT", BigDecimal.valueOf(0.75));

        List<HrPayrollStatutory> configs = statutoryRepository.findAll();
        for (HrPayrollStatutory statutory : configs) {
            if (!statutory.getIsActive()) continue;
            
            String key = statutory.getConfigKey().toUpperCase();
            String json = statutory.getConfigJson();
            // Parse simple keys from JSON (standard attributes)
            if (key.contains("PF")) {
                parseJsonField(json, "monthlyCeiling", "PF_LIMIT", vars);
                parseJsonField(json, "employeeRate", "PF_PCT", vars);
            } else if (key.contains("ESI")) {
                parseJsonField(json, "monthlyCeiling", "ESI_LIMIT", vars);
                parseJsonField(json, "employeeRate", "ESI_PCT", vars);
            }
        }
        
        return vars;
    }

    private void parseJsonField(String json, String jsonField, String varKey, Map<String, BigDecimal> vars) {
        if (json == null) return;
        try {
            // Primitive JSON parser to keep it clean and robust without Jackson dependencies
            int index = json.indexOf("\"" + jsonField + "\"");
            if (index != -1) {
                int colonIndex = json.indexOf(":", index);
                if (colonIndex != -1) {
                    int commaIndex = json.indexOf(",", colonIndex);
                    if (commaIndex == -1) {
                        commaIndex = json.indexOf("}", colonIndex);
                    }
                    if (commaIndex != -1) {
                        String valStr = json.substring(colonIndex + 1, commaIndex).trim().replace("\"", "");
                        vars.put(varKey, new BigDecimal(valStr));
                    }
                }
            }
        } catch (Exception e) {
            // Fall back to default
        }
    }

    private HrPayrollEmployeeSummary processEmployeeSalary(
            Long runId, Integer year, String month, EmployeeMaster employee, List<HrPayrollComponent> components,
            HrPayrollAttendanceConfig attConfig, HrPayrollAttendance attendance,
            Map<String, BigDecimal> statutoryVars, List<HrPayrollValidationRule> valRules, String executedBy) {

        // 1. Resolve monthly days
        BigDecimal totalDays = BigDecimal.valueOf(30);
        BigDecimal presentDays = BigDecimal.valueOf(30);
        BigDecimal lopDays = BigDecimal.ZERO;
        BigDecimal paidDays = BigDecimal.valueOf(30);

        if (attendance != null) {
            totalDays = attendance.getTotalDays();
            presentDays = attendance.getPresentDays();
            lopDays = attendance.getLopDays();
            paidDays = attendance.getPaidDays();
        }

        // 2. Load structure assignment
        HrPayrollStructure structure = resolveStructureForEmployee(employee);
        Map<String, HrPayrollStructureDetail> structDetails = new HashMap<>();
        if (structure != null) {
            List<HrPayrollStructureDetail> details = structureDetailRepository.findByStructureId(structure.getRowId());
            for (HrPayrollStructureDetail d : details) {
                structDetails.put(d.getComponent().getComponentCode().toUpperCase(), d);
            }
        }

        // 3. Build context
        Map<String, BigDecimal> context = new HashMap<>();
        // Seed default variables
        int monthNum = 1;
        if (month != null) {
            String m = month.toUpperCase();
            if (m.startsWith("JAN")) monthNum = 1;
            else if (m.startsWith("FEB")) monthNum = 2;
            else if (m.startsWith("MAR")) monthNum = 3;
            else if (m.startsWith("APR")) monthNum = 4;
            else if (m.startsWith("MAY")) monthNum = 5;
            else if (m.startsWith("JUN")) monthNum = 6;
            else if (m.startsWith("JUL")) monthNum = 7;
            else if (m.startsWith("AUG")) monthNum = 8;
            else if (m.startsWith("SEP")) monthNum = 9;
            else if (m.startsWith("OCT")) monthNum = 10;
            else if (m.startsWith("NOV")) monthNum = 11;
            else if (m.startsWith("DEC")) monthNum = 12;
        }
        context.put("MONTH", BigDecimal.valueOf(monthNum));

        int calendarDays = java.time.LocalDate.of(year, monthNum, 1).lengthOfMonth();
        context.put("TOTAL_DAYS", BigDecimal.valueOf(calendarDays));
        context.put("PRESENT_DAYS", presentDays);
        context.put("LOP_DAYS", lopDays);
        context.put("PAID_DAYS", paidDays);
        
        // Seed statutory
        context.putAll(statutoryVars);

        // Seed initial component values as ZERO
        for (HrPayrollComponent comp : components) {
            context.put(comp.getComponentCode().toUpperCase(), BigDecimal.ZERO);
        }

        List<HrPayrollEmployeeDetail> detailsToSave = new ArrayList<>();
        BigDecimal grossEarnings = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;

        // 4. Calculate components in sequence
        for (HrPayrollComponent comp : components) {
            String code = comp.getComponentCode().toUpperCase();
            
            // Check override in structure
            String calcType = comp.getCalculationType();
            BigDecimal calcVal = comp.getCalculationValue();
            String formula = comp.getFormulaExpression();

            if (structDetails.containsKey(code)) {
                HrPayrollStructureDetail structDetail = structDetails.get(code);
                calcType = structDetail.getCalculationType();
                calcVal = structDetail.getCalculationValue();
                formula = structDetail.getFormulaExpression();
            }

            BigDecimal originalAmount = BigDecimal.ZERO;

            if ("FIXED".equalsIgnoreCase(calcType)) {
                originalAmount = calcVal != null ? calcVal : BigDecimal.ZERO;
            } else if ("PERCENTAGE".equalsIgnoreCase(calcType)) {
                BigDecimal pct = calcVal != null ? calcVal : BigDecimal.ZERO;
                String baseComp = "BASIC";
                String limitType = "NONE";
                String limitValStr = "";

                if (formula != null && formula.trim().startsWith("{")) {
                    baseComp = parseSimpleJsonField(formula, "baseComponent", "BASIC");
                    limitType = parseSimpleJsonField(formula, "limitType", "NONE");
                    limitValStr = parseSimpleJsonField(formula, "limitValue", "");
                } else if (formula != null && !formula.trim().isEmpty()) {
                    baseComp = formula.trim().toUpperCase();
                }

                 BigDecimal base = BigDecimal.ZERO;
                 String[] baseParts = baseComp.split("\\+");
                 for (String part : baseParts) {
                     String partName = part.trim().toUpperCase();
                     BigDecimal val = context.getOrDefault(partName, BigDecimal.ZERO);
                     boolean isDeduction = false;
                     for (HrPayrollComponent c : components) {
                         if (c.getComponentCode().equalsIgnoreCase(partName) && "DEDUCTION".equalsIgnoreCase(c.getComponentType())) {
                             isDeduction = true;
                             break;
                         }
                     }
                     if (isDeduction) {
                         base = base.subtract(val);
                     } else {
                         base = base.add(val);
                     }
                 }
                 originalAmount = base.multiply(pct).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
 
                 if ("FIXED".equalsIgnoreCase(limitType) && !limitValStr.isEmpty()) {
                     try {
                         BigDecimal maxLimit = new BigDecimal(limitValStr);
                         if (originalAmount.compareTo(maxLimit) > 0) {
                             originalAmount = maxLimit;
                         }
                     } catch (Exception e) {
                         // ignore
                     }
                 } else if ("COMPONENT".equalsIgnoreCase(limitType) && !limitValStr.isEmpty()) {
                     BigDecimal maxLimit = BigDecimal.ZERO;
                     String[] parts = limitValStr.split("\\+");
                     for (String part : parts) {
                         String partName = part.trim().toUpperCase();
                         BigDecimal val = context.getOrDefault(partName, BigDecimal.ZERO);
                         boolean isDeduction = false;
                         for (HrPayrollComponent c : components) {
                             if (c.getComponentCode().equalsIgnoreCase(partName) && "DEDUCTION".equalsIgnoreCase(c.getComponentType())) {
                                 isDeduction = true;
                                 break;
                             }
                         }
                         if (isDeduction) {
                             maxLimit = maxLimit.subtract(val);
                         } else {
                             maxLimit = maxLimit.add(val);
                         }
                     }
                     if (originalAmount.compareTo(maxLimit) > 0) {
                         originalAmount = maxLimit;
                     }
                 }
            } else if ("FORMULA".equalsIgnoreCase(calcType)) {
                if (formula != null && !formula.trim().isEmpty()) {
                    originalAmount = PayrollFormulaEvaluator.evaluate(formula, context);
                }
            } else if ("MANUAL".equalsIgnoreCase(calcType)) {
                originalAmount = calcVal != null ? calcVal : BigDecimal.ZERO;
            } else if ("DAILY_RATE".equalsIgnoreCase(calcType) || "DAILY".equalsIgnoreCase(calcType)) {
                originalAmount = (calcVal != null ? calcVal : BigDecimal.ZERO).multiply(paidDays);
            }

            BigDecimal calculatedAmount = originalAmount;
            
            // Apply LOP pro-rating
            if (comp.getIsLopApplicable() && !"DAILY_RATE".equalsIgnoreCase(calcType) && !"DAILY".equalsIgnoreCase(calcType) && lopDays.compareTo(BigDecimal.ZERO) > 0 && totalDays.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal ratio = paidDays.divide(totalDays, 4, RoundingMode.HALF_UP);
                calculatedAmount = originalAmount.multiply(ratio).setScale(4, RoundingMode.HALF_UP);
            }

            // Put in context
            BigDecimal finalVal = calculatedAmount.setScale(2, RoundingMode.HALF_UP);
            context.put(code, finalVal);

            // Accumulate Gross vs Deductions
            if (comp.getShowInRegister() == null || comp.getShowInRegister()) {
                if ("EARNING".equalsIgnoreCase(comp.getComponentType())) {
                    grossEarnings = grossEarnings.add(finalVal);
                } else if ("DEDUCTION".equalsIgnoreCase(comp.getComponentType())) {
                    totalDeductions = totalDeductions.add(finalVal);
                }
            }

            // Store detail row
            HrPayrollEmployeeDetail detail = new HrPayrollEmployeeDetail();
            detail.setComponentCode(comp.getComponentCode());
            detail.setComponentName(comp.getComponentName());
            detail.setComponentType(comp.getComponentType());
            detail.setCalculatedAmount(finalVal);
            detail.setOriginalAmount(originalAmount.setScale(2, RoundingMode.HALF_UP));
            detail.setFormulaExpression(formula);
            detail.setEmpId(employee.getId());
            detail.setCreatedBy(executedBy);
            detailsToSave.add(detail);
        }

        BigDecimal netSalary = grossEarnings.subtract(totalDeductions).setScale(2, RoundingMode.HALF_UP);
        context.put("GROSS", grossEarnings);
        context.put("NET_SALARY", netSalary);

        // 5. Run validation rules
        String status = "PROCESSED";
        String errMsg = null;
        for (HrPayrollValidationRule rule : valRules) {
            try {
                BigDecimal pass = PayrollFormulaEvaluator.evaluate(rule.getRuleCondition(), context);
                if (pass.compareTo(BigDecimal.ZERO) == 0) { // Failed
                    if ("ERROR".equalsIgnoreCase(rule.getSeverity())) {
                        status = "ERROR";
                        errMsg = rule.getErrorMessage();
                        break; // Stop at first hard error
                    } else {
                        status = "WARNING";
                        errMsg = rule.getErrorMessage();
                    }
                }
            } catch (Exception e) {
                // Rule evaluation error
                status = "ERROR";
                errMsg = "Validation rule [" + rule.getRuleName() + "] evaluation error: " + e.getMessage();
                break;
            }
        }

        // Save Summary
        HrPayrollEmployeeSummary summary = new HrPayrollEmployeeSummary();
        summary.setPayrollRunId(runId);
        summary.setEmpCode(employee.getEmpCode());
        summary.setEmployeeName(employee.getEmployeeName());
        summary.setDepartmentName(employee.getDepartment() != null ? employee.getDepartment().getDepartmentName() : "N/A");
        summary.setDesignationName(employee.getDesignation() != null ? employee.getDesignation().getDesignationName() : "N/A");
        summary.setPresentDays(presentDays);
        summary.setLopDays(lopDays);
        summary.setPaidDays(paidDays);
        summary.setGrossEarnings(grossEarnings);
        summary.setTotalDeductions(totalDeductions);
        summary.setNetSalary(netSalary);
        summary.setStatus(status);
        summary.setErrorMessage(errMsg);
        summary.setCreatedBy(executedBy);
        summary = employeeSummaryRepository.save(summary);

        // Save Details tied to summary
        for (HrPayrollEmployeeDetail det : detailsToSave) {
            det.setPayrollRunId(runId);
            employeeDetailRepository.save(det);
        }

        return summary;
    }

    private HrPayrollStructure resolveStructureForEmployee(EmployeeMaster employee) {
        if (employee.getEmployeeTypeId() != null) {
            List<HrPayrollStructure> structures = structureRepository.findAll();
            for (HrPayrollStructure s : structures) {
                if (s.getIsActive() && employee.getEmployeeTypeId().equals(s.getEmployeeTypeId())) {
                    return s;
                }
            }
        }

        // Fallback: Default structural assignment (take first active structure)
        List<HrPayrollStructure> structures = structureRepository.findAll();
        for (HrPayrollStructure s : structures) {
            if (s.getIsActive()) return s;
        }

        return null;
    }

    private String parseSimpleJsonField(String json, String field, String defaultVal) {
        if (json == null) return defaultVal;
        try {
            int index = json.indexOf("\"" + field + "\"");
            if (index != -1) {
                int colonIndex = json.indexOf(":", index);
                if (colonIndex != -1) {
                    int commaIndex = json.indexOf(",", colonIndex);
                    if (commaIndex == -1) {
                        commaIndex = json.indexOf("}", colonIndex);
                    }
                    if (commaIndex != -1) {
                        return json.substring(colonIndex + 1, commaIndex).trim().replace("\"", "");
                    }
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return defaultVal;
    }
}

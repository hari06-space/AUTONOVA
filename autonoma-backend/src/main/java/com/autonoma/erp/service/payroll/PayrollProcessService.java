package com.autonoma.erp.service.payroll;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeSalaryComponent;
import com.autonoma.erp.modules.hr.employee.entity.EmployeePersonalDetail;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeSalaryComponentRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeePersonalDetailRepository;
import com.autonoma.erp.modules.hr.attendance.entity.HrAttendanceDailyLog;
import com.autonoma.erp.modules.hr.attendance.repository.HrAttendanceDailyLogRepository;
import com.autonoma.erp.modules.hr.loan.entity.HrLoanIssue;
import com.autonoma.erp.modules.hr.loan.repository.HrLoanIssueRepository;
import com.autonoma.erp.modules.hra.leaveencashment.entity.HraLeaveEncashmentVerified;
import com.autonoma.erp.modules.hra.leaveencashment.repository.HraLeaveEncashmentVerifiedRepository;
import com.autonoma.erp.modules.hr.leave.entity.LeaveTravelApplication;
import com.autonoma.erp.modules.hr.leave.repository.LeaveTravelApplicationRepository;
import com.autonoma.erp.modules.hra.penalty.entity.HraPenalty;
import com.autonoma.erp.modules.hra.penalty.repository.HraPenaltyRepository;
import com.autonoma.erp.model.payroll.HrPayrollProcessMaster;
import com.autonoma.erp.model.payroll.HrPayrollProcessTrans;
import com.autonoma.erp.model.payroll.HrPayrollComponent;
import com.autonoma.erp.model.payroll.HrPayrollAttendance;
import com.autonoma.erp.repository.payroll.HrPayrollProcessMasterRepository;
import com.autonoma.erp.repository.payroll.HrPayrollProcessTransRepository;
import com.autonoma.erp.repository.payroll.HrPayrollComponentRepository;
import com.autonoma.erp.repository.payroll.HrPayrollAttendanceRepository;
import com.autonoma.erp.util.SecurityUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PayrollProcessService {

    @Autowired
    private EmployeeMasterRepository employeeRepository;

    @Autowired
    private EmployeeJobProfileRepository jobProfileRepository;

    @Autowired
    private EmployeeSalaryComponentRepository employeeSalaryComponentRepository;

    @Autowired
    private HrAttendanceDailyLogRepository dailyLogRepository;

    @Autowired
    private HrLoanIssueRepository loanIssueRepository;

    @Autowired
    private HraLeaveEncashmentVerifiedRepository leaveEncashmentRepository;

    @Autowired
    private LeaveTravelApplicationRepository leaveTravelApplicationRepository;

    @Autowired
    private HraPenaltyRepository penaltyRepository;

    @Autowired
    private HrPayrollComponentRepository componentRepository;

    @Autowired
    private HrPayrollAttendanceRepository attendanceRepository;

    @Autowired
    private EmployeePersonalDetailRepository personalRepository;

    @Autowired
    private HrPayrollProcessMasterRepository processMasterRepository;

    @Autowired
    private HrPayrollProcessTransRepository processTransRepository;

    @Autowired
    private com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository leaveEntryRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Long getStatusIdByName(String name) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = UPPER(TRIM(?))", Long.class, name);
        } catch (Exception e) {
            try {
                return jdbcTemplate.queryForObject(
                        "SELECT TOP 1 ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'PENDING'", Long.class);
            } catch (Exception ex) {
                return 1L;
            }
        }
    }

    private String getStatusNameById(Long id) {
        try {
            return jdbcTemplate.queryForObject("SELECT NAME FROM AD_STATUS_MASTER WHERE ID = ?", String.class, id);
        } catch (Exception e) {
            return "PENDING";
        }
    }

    private static final Map<String, Integer> MONTH_MAP = new HashMap<>();
    static {
        MONTH_MAP.put("JANUARY", 1);
        MONTH_MAP.put("FEBRUARY", 2);
        MONTH_MAP.put("MARCH", 3);
        MONTH_MAP.put("APRIL", 4);
        MONTH_MAP.put("MAY", 5);
        MONTH_MAP.put("JUNE", 6);
        MONTH_MAP.put("JULY", 7);
        MONTH_MAP.put("AUGUST", 8);
        MONTH_MAP.put("SEPTEMBER", 9);
        MONTH_MAP.put("OCTOBER", 10);
        MONTH_MAP.put("NOVEMBER", 11);
        MONTH_MAP.put("DECEMBER", 12);
    }

    public Map<String, Object> getFilters() {
        Map<String, Object> res = new HashMap<>();
        res.put("companies", jdbcTemplate
                .queryForList("SELECT ID as id, DIVISION_NAME as name FROM AD_DIVISION WHERE IS_ACTIVE = 1"));
        res.put("categories",
                jdbcTemplate.queryForList("SELECT ID as id, CATEGORY_NAME as name FROM HR_CATEGORY_MASTER"));
        res.put("departments",
                jdbcTemplate.queryForList("SELECT ID as id, DEPARTMENT_NAME as name FROM HR_DEPARTMENT"));
        return res;
    }

    public Map<String, Object> validatePayroll(Integer year, String month, Long companyId, Long categoryId,
            Long departmentId) {
        String sql = "SELECT STATUS_ID FROM HR_PAYROLL_PROCESS_MASTER WHERE PAYROLL_YEAR = ? AND PAYROLL_MONTH = ?";
        List<Object> params = new ArrayList<>();
        params.add(year);
        params.add(month.toUpperCase());
        if (companyId != null) {
            sql += " AND COMPANY_ID = ?";
            params.add(companyId);
        }
        if (categoryId != null) {
            sql += " AND EMPLOYEE_CATEGORY_ID = ?";
            params.add(categoryId);
        }
        if (departmentId != null) {
            sql += " AND DEPARTMENT_ID = ?";
            params.add(departmentId);
        }
        List<Long> statuses = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getLong(1), params.toArray());
        Map<String, Object> res = new HashMap<>();
        if (statuses.isEmpty()) {
            res.put("exists", false);
            res.put("status", null);
        } else {
            res.put("exists", true);
            boolean approved = false;
            for (Long statusId : statuses) {
                String name = getStatusNameById(statusId);
                if ("APPROVED".equalsIgnoreCase(name)) {
                    approved = true;
                    break;
                }
            }
            res.put("status", approved ? "APPROVED" : "PENDING");
        }
        return res;
    }

    @Transactional
    public void approvePayroll(Integer year, String month, Long companyId, Long categoryId, Long departmentId) {
        Long approvedStatusId = getStatusIdByName("APPROVED");
        String sql = "UPDATE HR_PAYROLL_PROCESS_MASTER SET STATUS_ID = ?, APPROVED_BY = ?, APPROVED_DATE = ? WHERE PAYROLL_YEAR = ? AND PAYROLL_MONTH = ?";
        List<Object> params = new ArrayList<>();
        params.add(approvedStatusId);
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null)
            currentUserId = "System";
        params.add(currentUserId);
        params.add(new Date());
        params.add(year);
        params.add(month.toUpperCase());
        if (companyId != null) {
            sql += " AND COMPANY_ID = ?";
            params.add(companyId);
        }
        if (categoryId != null) {
            sql += " AND EMPLOYEE_CATEGORY_ID = ?";
            params.add(categoryId);
        }
        if (departmentId != null) {
            sql += " AND DEPARTMENT_ID = ?";
            params.add(departmentId);
        }
        jdbcTemplate.update(sql, params.toArray());
    }

    public List<Map<String, Object>> getProcessedPeriods() {
        List<HrPayrollProcessMaster> list = processMasterRepository.findAllByOrderByPayrollYearDescPayrollMonthDesc();
        Map<String, Map<String, Object>> grouped = new LinkedHashMap<>();
        for (HrPayrollProcessMaster m : list) {
            String key = m.getPayrollYear() + "-" + m.getPayrollMonth().toUpperCase() +
                    "-" + (m.getCompanyId() != null ? m.getCompanyId() : "0") +
                    "-" + (m.getEmployeeCategoryId() != null ? m.getEmployeeCategoryId() : "0") +
                    "-" + (m.getDepartmentId() != null ? m.getDepartmentId() : "0");
            if (!grouped.containsKey(key)) {
                Map<String, Object> map = new HashMap<>();
                map.put("year", m.getPayrollYear());
                map.put("month", m.getPayrollMonth());
                map.put("companyId", m.getCompanyId());
                map.put("employeeCategoryId", m.getEmployeeCategoryId());
                map.put("departmentId", m.getDepartmentId());
                map.put("totalEmployees", 0);
                map.put("totalNetSalary", BigDecimal.ZERO);
                map.put("status", getStatusNameById(m.getStatusId()));
                grouped.put(key, map);
            }
            Map<String, Object> map = grouped.get(key);
            map.put("totalEmployees", (Integer) map.get("totalEmployees") + 1);
            map.put("totalNetSalary", ((BigDecimal) map.get("totalNetSalary")).add(m.getNetSalary()));
        }
        return new ArrayList<>(grouped.values());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> calculatePayroll(Integer year, String month, Long companyId, Long categoryId,
            Long departmentId, Long employeeId) {
        List<Map<String, Object>> results = new ArrayList<>();
        List<EmployeeMaster> employees = new ArrayList<>();
        if (employeeId != null) {
            employeeRepository.findById(employeeId).ifPresent(employees::add);
        } else {
            employees = employeeRepository.findByStatus("Active");
        }
        List<HrPayrollComponent> components = new ArrayList<>(
                componentRepository.findByIsActiveTrueOrderBySequenceNoAsc());

        // Ensure all dynamic components are present in the components list for
        // processing
        String[] dynamicCodes = { "OT_AMOUNT", "LEAVE_ENCASHMENT", "LTA", "PENALTY", "LOM" };
        for (String dCode : dynamicCodes) {
            boolean exists = components.stream().anyMatch(c -> c.getComponentCode().equalsIgnoreCase(dCode));
            if (!exists) {
                HrPayrollComponent dc = new HrPayrollComponent();
                dc.setComponentCode(dCode);
                if ("OT_AMOUNT".equalsIgnoreCase(dCode)) {
                    dc.setComponentName("OT AMOUNT");
                } else if ("LEAVE_ENCASHMENT".equalsIgnoreCase(dCode)) {
                    dc.setComponentName("LEAVE ENCASHMENT");
                } else if ("LTA".equalsIgnoreCase(dCode)) {
                    dc.setComponentName("LTA");
                } else if ("PENALTY".equalsIgnoreCase(dCode)) {
                    dc.setComponentName("PENALTY");
                } else if ("LOM".equalsIgnoreCase(dCode)) {
                    dc.setComponentName("LOM");
                }
                dc.setComponentType(
                        "PENALTY".equalsIgnoreCase(dCode) || "LOM".equalsIgnoreCase(dCode) ? "DEDUCTION" : "EARNING");
                dc.setIsActive(true);
                dc.setSequenceNo(900);
                components.add(dc);
            }
        }

        Map<String, HrPayrollComponent> compMap = components.stream()
                .collect(Collectors.toMap(HrPayrollComponent::getComponentCode, c -> c, (a, b) -> a));

        int monthNum = MONTH_MAP.getOrDefault(month.toUpperCase(), 1);
        LocalDate startDate = LocalDate.of(year, monthNum, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        for (EmployeeMaster emp : employees) {
            if (emp.getOrganization() == null)
                continue;
            if (companyId != null && !companyId.equals(emp.getOrganization().getUnitId()))
                continue;
            if (categoryId != null && !categoryId.equals(emp.getOrganization().getCategoryId()))
                continue;
            if (departmentId != null && !departmentId.equals(emp.getOrganization().getDepartmentId()))
                continue;

            Map<String, Object> calc = runCalculationForEmployee(emp, year, month, startDate, endDate, compMap);
            if (calc != null) {
                results.add(calc);
            }
        }
        return results;
    }

    @Transactional
    public void savePayroll(Integer year, String month, Long companyId, Long categoryId, Long departmentId,
            List<Map<String, Object>> payload) {
        String selectSql = "SELECT ROW_ID FROM HR_PAYROLL_PROCESS_MASTER WHERE PAYROLL_YEAR = ? AND PAYROLL_MONTH = ?";
        List<Object> params = new ArrayList<>();
        params.add(year);
        params.add(month.toUpperCase());
        if (companyId != null) {
            selectSql += " AND COMPANY_ID = ?";
            params.add(companyId);
        }
        if (categoryId != null) {
            selectSql += " AND EMPLOYEE_CATEGORY_ID = ?";
            params.add(categoryId);
        }
        if (departmentId != null) {
            selectSql += " AND DEPARTMENT_ID = ?";
            params.add(departmentId);
        }
        List<Long> ids = jdbcTemplate.query(selectSql, (rs, rowNum) -> rs.getLong(1), params.toArray());
        if (!ids.isEmpty()) {
            processTransRepository.deleteByMasterIdIn(ids);
            processMasterRepository.deleteAllById(ids);
        }

        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null)
            currentUserId = "System";

        int monthNum = MONTH_MAP.getOrDefault(month.toUpperCase(), 1);

        for (Map<String, Object> item : payload) {
            HrPayrollProcessMaster master = new HrPayrollProcessMaster();
            master.setPayrollYear(year);
            master.setPayrollMonth(month.toUpperCase());
            master.setCompanyId(
                    item.get("companyId") != null ? Long.valueOf(String.valueOf(item.get("companyId"))) : companyId);
            master.setEmployeeCategoryId(item.get("employeeCategoryId") != null
                    ? Long.valueOf(String.valueOf(item.get("employeeCategoryId")))
                    : categoryId);
            master.setEmployeeId(Long.valueOf(String.valueOf(item.get("employeeId"))));
            master.setEmployeeCode(String.valueOf(item.get("employeeCode")));
            master.setEmployeeName(String.valueOf(item.get("employeeName")));
            master.setPaymentMode(String.valueOf(item.get("paymentMode")));
            master.setBankName(item.get("bankName") != null ? String.valueOf(item.get("bankName")) : null);
            master.setBranchName(item.get("branchName") != null ? String.valueOf(item.get("branchName")) : null);
            master.setIfscCode(item.get("ifscCode") != null ? String.valueOf(item.get("ifscCode")) : null);
            master.setSalaryAccountNumber(
                    item.get("salaryAccountNumber") != null ? String.valueOf(item.get("salaryAccountNumber")) : null);
            master.setAccountName(item.get("accountName") != null ? String.valueOf(item.get("accountName")) : null);
            master.setBankAccountType(
                    item.get("bankAccountType") != null ? String.valueOf(item.get("bankAccountType")) : null);
            master.setGrossSalary(parseBigDecimalSafely(item.get("grossSalary")));
            master.setTotalDeductions(parseBigDecimalSafely(item.get("totalDeductions")));
            master.setNetSalary(parseBigDecimalSafely(item.get("netSalary")));
            master.setPresentDays(parseBigDecimalSafely(item.get("presentDays")));
            master.setLopDays(parseBigDecimalSafely(item.get("lopDays")));
            master.setPaidDays(parseBigDecimalSafely(item.get("paidDays")));
            master.setOtHours(item.get("otHours") != null ? parseBigDecimalSafely(item.get("otHours")) : null);
            master.setWageType(item.get("wageType") != null ? String.valueOf(item.get("wageType")) : null);
            master.setDepartmentId(
                    item.get("departmentId") != null ? Long.valueOf(String.valueOf(item.get("departmentId"))) : null);
            master.setDesignationId(
                    item.get("designationId") != null ? Long.valueOf(String.valueOf(item.get("designationId"))) : null);
            master.setEsiNo(item.get("esiNo") != null ? String.valueOf(item.get("esiNo")) : null);
            master.setPfNo(item.get("pfNo") != null ? String.valueOf(item.get("pfNo")) : null);
            master.setOldEmployeeCode(
                    item.get("oldEmployeeCode") != null ? String.valueOf(item.get("oldEmployeeCode")) : null);
            master.setStatusId(getStatusIdByName("PENDING"));
            master.setCreatedBy(currentUserId);
            master.setCreatedDate(new Date());

            master = processMasterRepository.save(master);

            List<Map<String, Object>> transList = (List<Map<String, Object>>) item.get("components");
            if (transList != null) {
                for (Map<String, Object> transMap : transList) {
                    HrPayrollProcessTrans trans = new HrPayrollProcessTrans();
                    trans.setMasterId(master.getRowId());
                    trans.setComponentId(transMap.get("componentId") != null
                            ? Long.valueOf(String.valueOf(transMap.get("componentId")))
                            : null);
                    trans.setComponentCode(String.valueOf(transMap.get("componentCode")));
                    trans.setComponentName(String.valueOf(transMap.get("componentName")));
                    trans.setComponentType(String.valueOf(transMap.get("componentType")));
                    trans.setActualAmount(parseBigDecimalSafely(transMap.get("actualAmount")));
                    trans.setProcessAmount(parseBigDecimalSafely(transMap.get("processAmount")));
                    trans.setFormula(transMap.get("formula") != null ? String.valueOf(transMap.get("formula")) : null);
                    trans.setCalcType(
                            transMap.get("calcType") != null ? String.valueOf(transMap.get("calcType")) : null);
                    trans.setCalculationBasis(
                            transMap.get("calculationBasis") != null ? String.valueOf(transMap.get("calculationBasis"))
                                     : null);
                    trans.setCalculationSequence(transMap.get("calculationSequence") != null
                            ? Integer.valueOf(String.valueOf(transMap.get("calculationSequence")))
                            : null);
                    trans.setPercentage(transMap.get("percentage") != null
                            ? parseBigDecimalSafely(transMap.get("percentage"))
                            : null);
                    trans.setRate(
                            transMap.get("rate") != null ? parseBigDecimalSafely(transMap.get("rate")) : null);
                    trans.setManualOverride(transMap.get("manualOverride") != null
                            ? Boolean.valueOf(String.valueOf(transMap.get("manualOverride")))
                            : false);
                    trans.setCalculationLog(
                            transMap.get("calculationLog") != null ? String.valueOf(transMap.get("calculationLog"))
                                    : null);
                    trans.setFormulaVersion(
                            transMap.get("formulaVersion") != null ? String.valueOf(transMap.get("formulaVersion"))
                                    : null);
                    trans.setCalculationTimestamp(new Date());
                    processTransRepository.save(trans);
                }
            }

            // Update statuses for dynamic/variable components once processed in payroll
            Long empIdVal = master.getEmployeeId();

            // 1. Leave Encashment -> APPROVED
            List<HraLeaveEncashmentVerified> encashments = leaveEncashmentRepository.findByEmployeeId(empIdVal);
            for (HraLeaveEncashmentVerified enc : encashments) {
                if (enc.getEncashmentYear() != null && enc.getEncashmentYear().equals(year) &&
                        "VERIFIED".equalsIgnoreCase(enc.getStatus()) && Boolean.TRUE.equals(enc.getIsActive())) {
                    enc.setStatus("APPROVED");
                    leaveEncashmentRepository.save(enc);
                }
            }

            // 2. LTA -> Approved
            List<LeaveTravelApplication> ltaList = leaveTravelApplicationRepository
                    .findByEmployeeIdAndIsActiveTrueOrderByIdDesc(empIdVal);
            Long approvedLtaStatusId = getStatusIdByName("Approved");
            for (LeaveTravelApplication lta : ltaList) {
                if ("Verified".equalsIgnoreCase(getStatusNameById(lta.getStatusId()))) {
                    lta.setStatusId(approvedLtaStatusId);
                    leaveTravelApplicationRepository.save(lta);
                }
            }

            // 3. Penalties -> PAID
            List<HraPenalty> penalties = penaltyRepository.findByEmployeeId(empIdVal);
            for (HraPenalty p : penalties) {
                if (p.getMonth() != null && p.getMonth().equals(monthNum) &&
                        p.getYear() != null && p.getYear().equals(year) &&
                        "OPEN".equalsIgnoreCase(p.getStatus())) {
                    p.setStatus("PAID");
                    penaltyRepository.save(p);
                }
            }
        }
    }

    @Transactional
    public void deletePayrollPeriod(Integer year, String month, Long companyId, Long categoryId, Long departmentId) {
        String selectSql = "SELECT ROW_ID FROM HR_PAYROLL_PROCESS_MASTER WHERE PAYROLL_YEAR = ? AND PAYROLL_MONTH = ?";
        List<Object> params = new ArrayList<>();
        params.add(year);
        params.add(month.toUpperCase());
        if (companyId != null) {
            selectSql += " AND COMPANY_ID = ?";
            params.add(companyId);
        }
        if (categoryId != null) {
            selectSql += " AND EMPLOYEE_CATEGORY_ID = ?";
            params.add(categoryId);
        }
        if (departmentId != null) {
            selectSql += " AND DEPARTMENT_ID = ?";
            params.add(departmentId);
        }
        List<Long> ids = jdbcTemplate.query(selectSql, (rs, rowNum) -> rs.getLong(1), params.toArray());
        if (!ids.isEmpty()) {
            processTransRepository.deleteByMasterIdIn(ids);
            processMasterRepository.deleteAllById(ids);
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getProcessedDetails(Integer year, String month, Long companyId, Long categoryId,
            Long departmentId) {
        List<HrPayrollProcessMaster> list = processMasterRepository.findByPayrollYearAndPayrollMonth(year, month);
        List<Map<String, Object>> result = new ArrayList<>();
        for (HrPayrollProcessMaster m : list) {
            if (companyId != null && !companyId.equals(m.getCompanyId()))
                continue;
            if (categoryId != null && !categoryId.equals(m.getEmployeeCategoryId()))
                continue;
            if (departmentId != null && !departmentId.equals(m.getDepartmentId()))
                continue;

            Map<String, Object> map = new HashMap<>();
            map.put("rowId", m.getRowId());
            map.put("employeeId", m.getEmployeeId());
            map.put("employeeCode", m.getEmployeeCode());
            map.put("employeeName", m.getEmployeeName());
            map.put("paymentMode", m.getPaymentMode());
            map.put("bankName", m.getBankName());
            map.put("branchName", m.getBranchName());
            map.put("ifscCode", m.getIfscCode());
            map.put("salaryAccountNumber", m.getSalaryAccountNumber());
            map.put("accountName", m.getAccountName());
            map.put("bankAccountType", m.getBankAccountType());
            map.put("grossSalary", m.getGrossSalary());
            map.put("totalDeductions", m.getTotalDeductions());
            map.put("netSalary", m.getNetSalary());
            map.put("presentDays", m.getPresentDays());
            map.put("lopDays", m.getLopDays());
            map.put("paidDays", m.getPaidDays());
            map.put("otHours", m.getOtHours());
            map.put("wageType", m.getWageType());
            map.put("departmentId", m.getDepartmentId());
            map.put("designationId", m.getDesignationId());
            map.put("esiNo", m.getEsiNo());
            map.put("pfNo", m.getPfNo());
            map.put("oldEmployeeCode", m.getOldEmployeeCode());
            map.put("status", getStatusNameById(m.getStatusId()));

            List<HrPayrollProcessTrans> transList = processTransRepository.findByMasterId(m.getRowId());
            List<Map<String, Object>> transMaps = new ArrayList<>();
            for (HrPayrollProcessTrans t : transList) {
                Map<String, Object> tm = new HashMap<>();
                tm.put("componentId", t.getComponentId());
                tm.put("componentCode", t.getComponentCode());
                tm.put("componentName", t.getComponentName());
                tm.put("componentType", t.getComponentType());
                tm.put("actualAmount", t.getActualAmount());
                tm.put("processAmount", t.getProcessAmount());
                tm.put("formula", t.getFormula());
                tm.put("calcType", t.getCalcType());
                tm.put("calculationBasis", t.getCalculationBasis());
                tm.put("calculationSequence", t.getCalculationSequence());
                tm.put("percentage", t.getPercentage());
                tm.put("rate", t.getRate());
                tm.put("manualOverride", t.getManualOverride());
                tm.put("calculationLog", t.getCalculationLog());
                transMaps.add(tm);
            }
            map.put("components", transMaps);
            result.add(map);
        }
        return result;
    }

    private double evaluateExpression(String expression) {
        return new Object() {
            int pos = -1, ch;

            void nextChar() {
                ch = (++pos < expression.length()) ? expression.charAt(pos) : -1;
            }

            boolean eat(int charToEat) {
                while (ch == ' ')
                    nextChar();
                if (ch == charToEat) {
                    nextChar();
                    return true;
                }
                return false;
            }

            double parse() {
                nextChar();
                double x = parseExpression();
                if (pos < expression.length())
                    throw new RuntimeException("Unexpected: " + (char) ch);
                return x;
            }

            double parseExpression() {
                double x = parseTerm();
                for (;;) {
                    if (eat('+'))
                        x += parseTerm();
                    else if (eat('-'))
                        x -= parseTerm();
                    else
                        return x;
                }
            }

            double parseTerm() {
                double x = parseFactor();
                for (;;) {
                    if (eat('*'))
                        x *= parseFactor();
                    else if (eat('/'))
                        x /= parseFactor();
                    else
                        return x;
                }
            }

            double parseFactor() {
                if (eat('+'))
                    return parseFactor();
                if (eat('-'))
                    return -parseFactor();
                double x;
                int startPos = this.pos;
                if (eat('(')) {
                    x = parseExpression();
                    eat(')');
                } else if ((ch >= '0' && ch <= '9') || ch == '.') {
                    while ((ch >= '0' && ch <= '9') || ch == '.')
                        nextChar();
                    x = Double.parseDouble(expression.substring(startPos, this.pos));
                } else {
                    throw new RuntimeException("Unexpected: " + (char) ch);
                }
                return x;
            }
        }.parse();
    }

    private int getSundaysInMonth(int year, String month) {
        int monthNum = MONTH_MAP.getOrDefault(month.toUpperCase(), 1);
        LocalDate date = LocalDate.of(year, monthNum, 1);
        int length = date.lengthOfMonth();
        int sundays = 0;
        for (int i = 1; i <= length; i++) {
            if (LocalDate.of(year, monthNum, i).getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                sundays++;
            }
        }
        return sundays;
    }

    private Map<String, Object> runCalculationForEmployee(
            EmployeeMaster emp, Integer year, String month,
            LocalDate startDate, LocalDate endDate,
            Map<String, HrPayrollComponent> compMap) {

        Optional<EmployeeJobProfile> profileOpt = jobProfileRepository.findByEmployeeId(emp.getId());
        if (!profileOpt.isPresent())
            return null;
        EmployeeJobProfile profile = profileOpt.get();

        int monthNum = MONTH_MAP.getOrDefault(month.toUpperCase(), 1);

        Optional<HrPayrollAttendance> attOpt = attendanceRepository
                .findByEmpCodeAndPayrollYearAndPayrollMonth(emp.getEmpCode(), year, month);
        BigDecimal totalDays = BigDecimal.valueOf(startDate.lengthOfMonth());
        BigDecimal presentDays = totalDays;
        BigDecimal lopDays = BigDecimal.ZERO;
        BigDecimal paidDays = totalDays;

        if (attOpt.isPresent()) {
            HrPayrollAttendance att = attOpt.get();
            if (att.getTotalDays() != null && att.getTotalDays().compareTo(BigDecimal.ZERO) > 0) {
                totalDays = att.getTotalDays();
            }
            presentDays = att.getPresentDays() != null ? att.getPresentDays() : BigDecimal.ZERO;
            lopDays = att.getLopDays() != null ? att.getLopDays() : BigDecimal.ZERO;
            paidDays = att.getPaidDays() != null ? att.getPaidDays() : BigDecimal.ZERO;
        }

        BigDecimal computedLopDays = BigDecimal.ZERO;
        try {
            List<com.autonoma.erp.modules.hr.leave.entity.LeaveEntry> leaveEntries = leaveEntryRepository
                    .findByEmployeeIdAndIsActiveTrue(emp.getId());
            for (com.autonoma.erp.modules.hr.leave.entity.LeaveEntry le : leaveEntries) {
                String status = le.getStatus();
                if (status != null && (status.equalsIgnoreCase("VERIFIED") || status.equalsIgnoreCase("APPROVED"))) {
                    if (le.getLeaveType() != null && le.getLeaveType().equalsIgnoreCase("LOP")) {
                        LocalDate fromLoc = new java.util.Date(le.getFromDate().getTime()).toInstant()
                                .atZone(ZoneId.systemDefault()).toLocalDate();
                        LocalDate toLoc = new java.util.Date(le.getToDate().getTime()).toInstant()
                                .atZone(ZoneId.systemDefault()).toLocalDate();
                        LocalDate overlapStart = fromLoc.isBefore(startDate) ? startDate : fromLoc;
                        LocalDate overlapEnd = toLoc.isAfter(endDate) ? endDate : toLoc;
                        if (!overlapStart.isAfter(overlapEnd)) {
                            long totalLeaveDays = java.time.temporal.ChronoUnit.DAYS.between(fromLoc, toLoc) + 1;
                            long overlapDays = java.time.temporal.ChronoUnit.DAYS.between(overlapStart, overlapEnd) + 1;
                            BigDecimal noOfDays = le.getNoOfDays() != null ? le.getNoOfDays() : BigDecimal.ONE;
                            if (totalLeaveDays > 0) {
                                BigDecimal factor = BigDecimal.valueOf(overlapDays)
                                        .divide(BigDecimal.valueOf(totalLeaveDays), 4, RoundingMode.HALF_UP);
                                computedLopDays = computedLopDays.add(noOfDays.multiply(factor));
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {
            System.err.println("Error computing LOP days: " + ex.getMessage());
        }

        if (computedLopDays.compareTo(BigDecimal.ZERO) > 0) {
            lopDays = computedLopDays;
            paidDays = totalDays.subtract(lopDays);
            if (paidDays.compareTo(BigDecimal.ZERO) < 0)
                paidDays = BigDecimal.ZERO;
            if (presentDays.compareTo(paidDays) > 0) {
                presentDays = paidDays;
            }
        }

        int sundaysCount = getSundaysInMonth(year, month);
        presentDays = presentDays.subtract(BigDecimal.valueOf(sundaysCount));
        if (presentDays.compareTo(BigDecimal.ZERO) < 0) {
            presentDays = BigDecimal.ZERO;
        }

        Optional<EmployeePersonalDetail> personalOpt = personalRepository.findByEmployeeId(emp.getId());
        String esiNo = personalOpt.map(EmployeePersonalDetail::getEsicNumber).orElse(null);
        String pfNo = personalOpt.map(EmployeePersonalDetail::getPfNumber).orElse(null);
        Long departmentId = emp.getOrganization() != null ? emp.getOrganization().getDepartmentId() : null;
        Long designationId = emp.getOrganization() != null ? emp.getOrganization().getDesignationId() : null;
        String oldEmployeeCode = emp.getOldEmpCode();
        String wageType = profile.getWagesType();

        List<EmployeeSalaryComponent> savedComps = employeeSalaryComponentRepository.findByEmployeeId(emp.getId());
        if (savedComps.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("employeeId", emp.getId());
            result.put("employeeCode", emp.getEmpCode());
            result.put("employeeName", emp.getEmployeeName());
            result.put("paymentMode", profile.getPaymentMode() != null ? profile.getPaymentMode() : "CASH");
            result.put("bankName", profile.getBankName());
            result.put("branchName", profile.getBranchName());
            result.put("ifscCode", profile.getIfscCode());
            result.put("salaryAccountNumber", profile.getSalaryAccountNumber());
            result.put("accountName", profile.getAccountName());
            result.put("bankAccountType", profile.getBankAccountType());
            result.put("grossSalary", BigDecimal.ZERO);
            result.put("totalDeductions", BigDecimal.ZERO);
            result.put("netSalary", BigDecimal.ZERO);
            result.put("presentDays", presentDays);
            result.put("lopDays", lopDays);
            result.put("paidDays", paidDays);
            result.put("otHours", BigDecimal.ZERO);
            result.put("wageType", wageType);
            result.put("departmentId", departmentId);
            result.put("designationId", designationId);
            result.put("esiNo", esiNo);
            result.put("pfNo", pfNo);
            result.put("oldEmployeeCode", oldEmployeeCode);
            result.put("components", new ArrayList<>());
            result.put("noSalaryComponents", true);
            return result;
        }

        Map<String, BigDecimal> calculatedValues = new HashMap<>();
        List<Map<String, Object>> transComponents = new ArrayList<>();
        BigDecimal grossEarnings = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;

        calculatedValues.put("PRESENT_DAYS", presentDays);
        calculatedValues.put("LOP_DAYS", lopDays);
        calculatedValues.put("PAID_DAYS", paidDays);
        int calendarDays = java.time.LocalDate.of(year, MONTH_MAP.getOrDefault(month.toUpperCase(), 1), 1).lengthOfMonth();
        calculatedValues.put("TOTAL_DAYS", BigDecimal.valueOf(calendarDays));

        List<HrAttendanceDailyLog> logs = dailyLogRepository.findByEmpIdAndAttendanceDateBetween(emp.getId(), startDate,
                endDate);
        int totalOtMinutes = 0;
        int totalLomMinutes = 0;
        for (HrAttendanceDailyLog log : logs) {
            totalOtMinutes += log.getOt() != null ? log.getOt() : 0;
            totalLomMinutes += log.getLom() != null ? log.getLom() : 0;
        }

        BigDecimal otHours = BigDecimal.valueOf(totalOtMinutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        calculatedValues.put("OT_HOURS", otHours);

        List<HrPayrollComponent> sortedComponents = compMap.values().stream()
                .sorted(Comparator.comparingInt(c -> c.getSequenceNo() != null ? c.getSequenceNo() : 999))
                .collect(Collectors.toList());

        for (HrPayrollComponent meta : sortedComponents) {
            String code = meta.getComponentCode();

            Optional<EmployeeSalaryComponent> escOpt = savedComps.stream()
                    .filter(c -> c.getComponentCode().equalsIgnoreCase(code))
                    .findFirst();

            boolean isDynamic = "OT_AMOUNT".equalsIgnoreCase(code) ||
                    "LEAVE_ENCASHMENT".equalsIgnoreCase(code) ||
                    "LTA".equalsIgnoreCase(code) ||
                    "PENALTY".equalsIgnoreCase(code) ||
                    "LOM".equalsIgnoreCase(code);

            if (!escOpt.isPresent() && !isDynamic) {
                calculatedValues.put(code, BigDecimal.ZERO);
                continue;
            }

            BigDecimal baseAmount = escOpt.isPresent()
                    ? (escOpt.get().getAmount() != null ? escOpt.get().getAmount() : BigDecimal.ZERO)
                    : BigDecimal.ZERO;
            BigDecimal processedAmount = baseAmount;
            StringBuilder calcLog = new StringBuilder();
            calcLog.append("Base amount: ").append(baseAmount);

            if ("PERCENTAGE".equalsIgnoreCase(meta.getCalculationType())) {
                BigDecimal pct = meta.getCalculationValue() != null ? meta.getCalculationValue() : BigDecimal.ZERO;
                String baseComp = "BASIC";
                String limitType = "NONE";
                String limitValStr = "";

                String formula = meta.getFormulaExpression();
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
                    BigDecimal val = calculatedValues.getOrDefault(partName, BigDecimal.ZERO);
                    boolean isDeduction = false;
                    for (HrPayrollComponent c : sortedComponents) {
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
                
                processedAmount = base.multiply(pct).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

                if ("FIXED".equalsIgnoreCase(limitType) && !limitValStr.isEmpty()) {
                    try {
                        BigDecimal maxLimit = new BigDecimal(limitValStr);
                        if (processedAmount.compareTo(maxLimit) > 0) {
                            processedAmount = maxLimit;
                        }
                    } catch (Exception e) {
                        // ignore
                    }
                } else if ("COMPONENT".equalsIgnoreCase(limitType) && !limitValStr.isEmpty()) {
                    BigDecimal maxLimit = BigDecimal.ZERO;
                    String[] parts = limitValStr.split("\\+");
                    for (String part : parts) {
                        String partName = part.trim().toUpperCase();
                        BigDecimal val = calculatedValues.getOrDefault(partName, BigDecimal.ZERO);
                        boolean isDeduction = false;
                        for (HrPayrollComponent c : sortedComponents) {
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
                    if (processedAmount.compareTo(maxLimit) > 0) {
                        processedAmount = maxLimit;
                    }
                }
                processedAmount = processedAmount.setScale(2, RoundingMode.HALF_UP);
                calcLog.append(" | Percentage Evaluated: ").append(pct).append("% of ").append(baseComp).append(" = ").append(processedAmount);
            } else if ("FORMULA".equalsIgnoreCase(meta.getCalculationType())) {
                String formula = meta.getFormulaExpression();
                if (formula != null && !formula.trim().isEmpty()) {
                    String parsedFormula = formula;
                    for (Map.Entry<String, BigDecimal> entry : calculatedValues.entrySet()) {
                        parsedFormula = parsedFormula.replace(entry.getKey(), entry.getValue().toString());
                    }
                    try {
                        double val = evaluateExpression(parsedFormula);
                        processedAmount = BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP);
                        calcLog.append(" | Formula Evaluated: [").append(formula).append("] -> [").append(parsedFormula)
                                .append("] = ").append(processedAmount);
                    } catch (Exception ex) {
                        calcLog.append(" | Formula Error: ").append(ex.getMessage());
                    }
                }
            } else if ("DAILY_RATE".equalsIgnoreCase(meta.getCalculationType())
                    || "DAILY".equalsIgnoreCase(meta.getCalculationType())) {
                processedAmount = baseAmount.multiply(presentDays).setScale(2, RoundingMode.HALF_UP);
                calcLog.append(" | Daily Rate: ").append(baseAmount).append(" * presentDays (").append(presentDays)
                        .append(") = ").append(processedAmount);
            }

            if ("OT_AMOUNT".equalsIgnoreCase(code)) {
                processedAmount = BigDecimal.ZERO;
                if ("YES".equalsIgnoreCase(profile.getOverTimeAllowed()) && otHours.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal factorial = BigDecimal.ONE;
                    if (profile.getOverTimeFactorial() != null && !profile.getOverTimeFactorial().trim().isEmpty()) {
                        try {
                            factorial = new BigDecimal(profile.getOverTimeFactorial().trim());
                        } catch (Exception e) {
                        }
                    }

                    Map<String, Object> hrSettings = null;
                    try {
                        hrSettings = jdbcTemplate.queryForMap(
                                "SELECT TOP 1 OT_MODE, OT_IS_FIXED, OT_FIXED_AMOUNT, OT_FORMULA FROM HR_SETTING_MASTER");
                    } catch (Exception e) {
                        // ignore
                    }

                    BigDecimal empRate = profile.getOverTimeRatePerHour();
                    if (empRate != null && empRate.compareTo(BigDecimal.ZERO) > 0) {
                        // Case 1: Employee OT rate is configured - Use it!
                        processedAmount = otHours.multiply(empRate).multiply(factorial).setScale(2, RoundingMode.HALF_UP);
                        calcLog.append(" | OT Hours: ").append(otHours)
                                .append(" * Employee Rate: ").append(empRate)
                                .append(" * Factorial: ").append(factorial);
                    } else {
                        // Case 2: Employee OT rate is not configured - Check HR Settings!
                        String otMode = hrSettings != null && hrSettings.get("OT_MODE") != null 
                                ? hrSettings.get("OT_MODE").toString() : "FORMULA";
                        String otIsFixedStr = hrSettings != null && hrSettings.get("OT_IS_FIXED") != null 
                                ? hrSettings.get("OT_IS_FIXED").toString() : "false";
                        boolean isFixed = "true".equalsIgnoreCase(otIsFixedStr) || "FIXED".equalsIgnoreCase(otMode);

                        if (isFixed) {
                            // Subcase 2a: Fixed Hourly Rate in HR settings
                            BigDecimal fixedRate = BigDecimal.ZERO;
                            if (hrSettings != null && hrSettings.get("OT_FIXED_AMOUNT") != null) {
                                fixedRate = new BigDecimal(hrSettings.get("OT_FIXED_AMOUNT").toString());
                            }
                            processedAmount = otHours.multiply(fixedRate).multiply(factorial).setScale(2, RoundingMode.HALF_UP);
                            calcLog.append(" | OT Hours: ").append(otHours)
                                    .append(" * HR Settings Fixed Rate: ").append(fixedRate)
                                    .append(" * Factorial: ").append(factorial);
                        } else {
                            // Subcase 2b: Formula Calculation in HR settings
                            String otFormula = hrSettings != null && hrSettings.get("OT_FORMULA") != null 
                                    ? hrSettings.get("OT_FORMULA").toString() : "((BASIC / 26) / 8) * 1.5 * OT_HOURS";
                            String parsedFormula = otFormula;
                            for (Map.Entry<String, BigDecimal> entry : calculatedValues.entrySet()) {
                                parsedFormula = parsedFormula.replace(entry.getKey(), entry.getValue().toString());
                            }
                            
                            boolean hasOtHoursToken = otFormula.toUpperCase().contains("OT_HOURS");
                            if (hasOtHoursToken) {
                                parsedFormula = parsedFormula.replaceAll("(?i)OT_HOURS", otHours.toString());
                            }
                            
                            try {
                                double val = evaluateExpression(parsedFormula);
                                BigDecimal evaluatedRate = BigDecimal.valueOf(val);
                                if (hasOtHoursToken) {
                                    processedAmount = evaluatedRate.setScale(2, RoundingMode.HALF_UP);
                                    calcLog.append(" | OT Formula Evaluated (with OT_HOURS): [").append(otFormula).append("] -> [").append(parsedFormula)
                                            .append("] = ").append(processedAmount);
                                } else {
                                    processedAmount = evaluatedRate.multiply(otHours).multiply(factorial).setScale(2, RoundingMode.HALF_UP);
                                    calcLog.append(" | OT Formula Evaluated (Rate): [").append(otFormula).append("] -> [").append(parsedFormula)
                                            .append("] = ").append(evaluatedRate)
                                            .append(" * OT Hours: ").append(otHours)
                                            .append(" * Factorial: ").append(factorial);
                                }
                            } catch (Exception ex) {
                                calcLog.append(" | OT Formula Error: ").append(ex.getMessage());
                            }
                        }
                    }
                }
            }

            if ("LEAVE_ENCASHMENT".equalsIgnoreCase(code)) {
                processedAmount = BigDecimal.ZERO;
                List<HraLeaveEncashmentVerified> encashments = leaveEncashmentRepository.findByEmployeeId(emp.getId());
                
                BigDecimal totalEarningsActualAmount = savedComps.stream()
                        .filter(c -> {
                            HrPayrollComponent compMeta = compMap.get(c.getComponentCode().toUpperCase());
                            return compMeta != null && "EARNING".equalsIgnoreCase(compMeta.getComponentType());
                        })
                        .map(c -> c.getAmount() != null ? c.getAmount() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                BigDecimal perDaySalary = BigDecimal.ZERO;
                if (calendarDays > 0) {
                    perDaySalary = totalEarningsActualAmount.divide(BigDecimal.valueOf(calendarDays), 6, RoundingMode.HALF_UP);
                }
                
                for (HraLeaveEncashmentVerified enc : encashments) {
                    if (enc.getEncashmentYear() != null && enc.getEncashmentYear().equals(year) &&
                            "VERIFIED".equalsIgnoreCase(enc.getStatus()) && Boolean.TRUE.equals(enc.getIsActive())) {
                        
                        BigDecimal elEnc = enc.getElEncashment() != null ? enc.getElEncashment() : BigDecimal.ZERO;
                        BigDecimal clEnc = enc.getClEncashment() != null ? enc.getClEncashment() : BigDecimal.ZERO;
                        BigDecimal totDaysEnc = elEnc.add(clEnc);
                        
                        BigDecimal calculatedAmt = perDaySalary.multiply(totDaysEnc).setScale(2, RoundingMode.HALF_UP);
                        processedAmount = processedAmount.add(calculatedAmt);
                        
                        calcLog.append(" | Encashment verified ID: ").append(enc.getId())
                                .append(" - Days: ").append(totDaysEnc)
                                .append(" * Per Day Salary (GrossActual/").append(calendarDays).append("): ").append(perDaySalary.setScale(2, RoundingMode.HALF_UP))
                                .append(" = ").append(calculatedAmt);
                    }
                }
                processedAmount = processedAmount.setScale(2, RoundingMode.HALF_UP);
                calcLog.append(" | Total Leave Encashment: ").append(processedAmount);
            }

            if ("LTA".equalsIgnoreCase(code)) {
                processedAmount = BigDecimal.ZERO;
                if ("YES".equalsIgnoreCase(emp.getLtaEligible())) {
                    List<LeaveTravelApplication> ltaList = leaveTravelApplicationRepository
                            .findByEmployeeIdAndIsActiveTrueOrderByIdDesc(emp.getId());
                    for (LeaveTravelApplication lta : ltaList) {
                        if ("Verified".equalsIgnoreCase(getStatusNameById(lta.getStatusId()))) {
                            processedAmount = processedAmount
                                    .add(lta.getAmount() != null ? lta.getAmount() : BigDecimal.ZERO);
                        }
                    }
                    processedAmount = processedAmount.setScale(2, RoundingMode.HALF_UP);
                    calcLog.append(" | Verified LTA: ").append(processedAmount);
                } else {
                    calcLog.append(" | LTA is not enabled in Employee Master");
                }
            }

            if ("PENALTY".equalsIgnoreCase(code)) {
                processedAmount = BigDecimal.ZERO;
                List<HraPenalty> penalties = penaltyRepository.findByEmployeeId(emp.getId());
                for (HraPenalty p : penalties) {
                    if (p.getMonth() != null && p.getMonth().equals(monthNum) &&
                            p.getYear() != null && p.getYear().equals(year) &&
                            "OPEN".equalsIgnoreCase(p.getStatus())) {
                        processedAmount = processedAmount
                                .add(p.getPenaltyAmount() != null ? p.getPenaltyAmount() : BigDecimal.ZERO);
                    }
                }
                processedAmount = processedAmount.setScale(2, RoundingMode.HALF_UP);
                calcLog.append(" | Sum of active Penalties: ").append(processedAmount);
            }

            if ("LOM".equalsIgnoreCase(code)) {
                processedAmount = BigDecimal.ZERO;
                if ("YES".equalsIgnoreCase(emp.getLomDeduction()) && totalLomMinutes > 0) {
                    BigDecimal basicSalary = calculatedValues.getOrDefault("BASIC", BigDecimal.ZERO);
                    if (basicSalary.compareTo(BigDecimal.ZERO) <= 0) {
                        Optional<EmployeeSalaryComponent> basicEsc = savedComps.stream()
                                .filter(c -> c.getComponentCode().equalsIgnoreCase("BASIC"))
                                .findFirst();
                        if (basicEsc.isPresent() && basicEsc.get().getAmount() != null) {
                            basicSalary = basicEsc.get().getAmount();
                        }
                    }
                    BigDecimal lomFactor = BigDecimal.ONE;
                    try {
                        BigDecimal dbFactor = jdbcTemplate.queryForObject(
                                "SELECT TOP 1 LOM_DEDUCTION_FACTOR FROM HR_SETTING_MASTER", BigDecimal.class);
                        if (dbFactor != null) {
                            lomFactor = dbFactor;
                        }
                    } catch (Exception e) {
                        // ignore
                    }
                    if (totalDays.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal minutesInMonth = totalDays.multiply(BigDecimal.valueOf(8 * 60));
                        processedAmount = basicSalary.multiply(BigDecimal.valueOf(totalLomMinutes))
                                .multiply(lomFactor)
                                .divide(minutesInMonth, 2, RoundingMode.HALF_UP);
                        calcLog.append(" | LOM minutes: ").append(totalLomMinutes)
                                .append(" * Factor: ").append(lomFactor)
                                .append(" -> Deduction: ").append(processedAmount);
                    }
                }
                processedAmount = processedAmount.setScale(2, RoundingMode.HALF_UP);
            }

            if ("LOAN_DEDUCTION".equalsIgnoreCase(code)) {
                processedAmount = BigDecimal.ZERO;
                List<HrLoanIssue> activeLoans = loanIssueRepository.findByEmpCodeAndIsActiveTrue(emp.getEmpCode());
                for (HrLoanIssue loan : activeLoans) {
                    if ("OPEN".equalsIgnoreCase(loan.getStatus())
                            && "APPROVED".equalsIgnoreCase(loan.getVerificationStatus())) {
                        int startScore = loan.getStartYear() * 12
                                + MONTH_MAP.getOrDefault(loan.getStartMonth().toUpperCase(), 1);
                        int endScore = loan.getEndYear() * 12
                                + MONTH_MAP.getOrDefault(loan.getEndMonth().toUpperCase(), 1);
                        int currentScore = year * 12 + monthNum;
                        if (currentScore >= startScore && currentScore <= endScore) {
                            BigDecimal emi = BigDecimal
                                    .valueOf(loan.getInstallmentAmt() != null ? loan.getInstallmentAmt() : 0.0)
                                    .setScale(2, RoundingMode.HALF_UP);
                            processedAmount = processedAmount.add(emi);
                        }
                    }
                }
                calcLog.append(" | EMI sum from active loans: ").append(processedAmount);
            }

            boolean isLopApplicable = meta.getIsLopApplicable() != null && meta.getIsLopApplicable();
            if (isLopApplicable && lopDays.compareTo(BigDecimal.ZERO) > 0 && totalDays.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal ratio = paidDays.divide(totalDays, 4, RoundingMode.HALF_UP);
                BigDecimal original = processedAmount;
                processedAmount = processedAmount.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
                calcLog.append(" | LOP Applied: ").append(original).append(" * (").append(paidDays).append("/")
                        .append(totalDays).append(") = ").append(processedAmount);
            }

            if (!escOpt.isPresent() && processedAmount.compareTo(BigDecimal.ZERO) <= 0) {
                calculatedValues.put(code, BigDecimal.ZERO);
                continue;
            }

            calculatedValues.put(code, processedAmount);

            String type = meta.getComponentType();
            if (meta.getShowInRegister() == null || meta.getShowInRegister()) {
                if ("EARNING".equalsIgnoreCase(type)) {
                    grossEarnings = grossEarnings.add(processedAmount);
                } else if ("DEDUCTION".equalsIgnoreCase(type)) {
                    totalDeductions = totalDeductions.add(processedAmount);
                }
            }

            Map<String, Object> tc = new HashMap<>();
            tc.put("componentId", meta.getRowId());
            tc.put("componentCode", code);
            tc.put("componentName", meta.getComponentName());
            tc.put("componentType", type);
            tc.put("actualAmount", isDynamic ? null : baseAmount);
            tc.put("processAmount", processedAmount);
            tc.put("formula", meta.getFormulaExpression());
            tc.put("calcType", meta.getCalculationType());
            tc.put("calculationBasis", isLopApplicable ? "LOP Applicable" : "Fixed");
            tc.put("calculationSequence", meta.getSequenceNo());
            tc.put("percentage", "PERCENTAGE".equalsIgnoreCase(meta.getCalculationType()) ? baseAmount : null);
            tc.put("rate", "OT_AMOUNT".equalsIgnoreCase(code) ? profile.getOverTimeRatePerHour() : null);
            tc.put("manualOverride", false);
            tc.put("calculationLog", calcLog.toString());
            tc.put("showInRegister", meta.getShowInRegister() == null || meta.getShowInRegister());
            transComponents.add(tc);
        }

        BigDecimal netSalary = grossEarnings.subtract(totalDeductions);

        Map<String, Object> result = new HashMap<>();
        result.put("employeeId", emp.getId());
        result.put("employeeCode", emp.getEmpCode());
        result.put("employeeName", emp.getEmployeeName());
        result.put("paymentMode", profile.getPaymentMode() != null ? profile.getPaymentMode() : "CASH");
        result.put("bankName", profile.getBankName());
        result.put("branchName", profile.getBranchName());
        result.put("ifscCode", profile.getIfscCode());
        result.put("salaryAccountNumber", profile.getSalaryAccountNumber());
        result.put("accountName", profile.getAccountName());
        result.put("bankAccountType", profile.getBankAccountType());
        result.put("grossSalary", grossEarnings);
        result.put("totalDeductions", totalDeductions);
        result.put("netSalary", netSalary);
        result.put("presentDays", presentDays);
        result.put("lopDays", lopDays);
        result.put("paidDays", paidDays);
        result.put("totalDays", totalDays);
        result.put("otHours", otHours);
        result.put("wageType", wageType);
        result.put("departmentId", departmentId);
        result.put("designationId", designationId);
        result.put("esiNo", esiNo);
        result.put("pfNo", pfNo);
        result.put("oldEmployeeCode", oldEmployeeCode);
        result.put("components", transComponents);

        return result;
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

    private BigDecimal parseBigDecimalSafely(Object val) {
        if (val == null) {
            return BigDecimal.ZERO;
        }
        String str = String.valueOf(val).trim();
        if (str.isEmpty() || "null".equalsIgnoreCase(str) || "undefined".equalsIgnoreCase(str) || "nan".equalsIgnoreCase(str)) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(str);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}

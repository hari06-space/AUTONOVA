package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "HR_PAYROLL_PROCESS_MASTER")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollProcessMaster extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "PAYROLL_YEAR", nullable = false)
    private Integer payrollYear;

    @Column(name = "PAYROLL_MONTH", nullable = false, length = 20)
    private String payrollMonth;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @Column(name = "EMPLOYEE_CODE", nullable = false, length = 50)
    private String employeeCode;

    @Column(name = "EMPLOYEE_NAME", nullable = false, length = 200)
    private String employeeName;

    @Column(name = "PAYMENT_MODE", nullable = false, length = 20)
    private String paymentMode;

    @Column(name = "BANK_NAME", length = 100)
    private String bankName;

    @Column(name = "BRANCH_NAME", length = 100)
    private String branchName;

    @Column(name = "IFSC_CODE", length = 20)
    private String ifscCode;

    @Column(name = "SALARY_ACCOUNT_NUMBER", length = 50)
    private String salaryAccountNumber;

    @Column(name = "ACCOUNT_NAME", length = 100)
    private String accountName;

    @Column(name = "BANK_ACCOUNT_TYPE", length = 20)
    private String bankAccountType;

    @Column(name = "GROSS_SALARY", nullable = false, precision = 18, scale = 2)
    private BigDecimal grossSalary;

    @Column(name = "TOTAL_DEDUCTIONS", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalDeductions;

    @Column(name = "NET_SALARY", nullable = false, precision = 18, scale = 2)
    private BigDecimal netSalary;

    @Column(name = "PRESENT_DAYS", nullable = false, precision = 5, scale = 2)
    private BigDecimal presentDays;

    @Column(name = "LOP_DAYS", nullable = false, precision = 5, scale = 2)
    private BigDecimal lopDays;

    @Column(name = "PAID_DAYS", nullable = false, precision = 5, scale = 2)
    private BigDecimal paidDays;

    @Column(name = "WAGE_TYPE", length = 50)
    private String wageType;

    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    @Column(name = "DESIGNATION_ID")
    private Long designationId;

    @Column(name = "ESI_NO", length = 100)
    private String esiNo;

    @Column(name = "PF_NO", length = 100)
    private String pfNo;

    @Column(name = "OLD_EMPLOYEE_CODE", length = 100)
    private String oldEmployeeCode;

    @Column(name = "COMPANY_ID")
    private Long companyId;

    @Column(name = "EMPLOYEE_CATEGORY_ID")
    private Long employeeCategoryId;

    @Column(name = "OT_HOURS", precision = 5, scale = 2)
    private BigDecimal otHours;

    @Column(name = "APPROVED_BY", length = 50)
    private String approvedBy;

    @Column(name = "APPROVED_DATE")
    private java.util.Date approvedDate;

    @Column(name = "STATUS_ID", nullable = false)
    private Long statusId;

    public Long getRowId() { return rowId; }
    public void setRowId(Long rowId) { this.rowId = rowId; }
    public Integer getPayrollYear() { return payrollYear; }
    public void setPayrollYear(Integer payrollYear) { this.payrollYear = payrollYear; }
    public String getPayrollMonth() { return payrollMonth; }
    public void setPayrollMonth(String payrollMonth) { this.payrollMonth = payrollMonth; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
    public String getSalaryAccountNumber() { return salaryAccountNumber; }
    public void setSalaryAccountNumber(String salaryAccountNumber) { this.salaryAccountNumber = salaryAccountNumber; }
    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }
    public String getBankAccountType() { return bankAccountType; }
    public void setBankAccountType(String bankAccountType) { this.bankAccountType = bankAccountType; }
    public BigDecimal getGrossSalary() { return grossSalary; }
    public void setGrossSalary(BigDecimal grossSalary) { this.grossSalary = grossSalary; }
    public BigDecimal getTotalDeductions() { return totalDeductions; }
    public void setTotalDeductions(BigDecimal totalDeductions) { this.totalDeductions = totalDeductions; }
    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }
    public BigDecimal getPresentDays() { return presentDays; }
    public void setPresentDays(BigDecimal presentDays) { this.presentDays = presentDays; }
    public BigDecimal getLopDays() { return lopDays; }
    public void setLopDays(BigDecimal lopDays) { this.lopDays = lopDays; }
    public BigDecimal getPaidDays() { return paidDays; }
    public void setPaidDays(BigDecimal paidDays) { this.paidDays = paidDays; }
    public String getWageType() { return wageType; }
    public void setWageType(String wageType) { this.wageType = wageType; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getDesignationId() { return designationId; }
    public void setDesignationId(Long designationId) { this.designationId = designationId; }
    public String getEsiNo() { return esiNo; }
    public void setEsiNo(String esiNo) { this.esiNo = esiNo; }
    public String getPfNo() { return pfNo; }
    public void setPfNo(String pfNo) { this.pfNo = pfNo; }
    public String getOldEmployeeCode() { return oldEmployeeCode; }
    public void setOldEmployeeCode(String oldEmployeeCode) { this.oldEmployeeCode = oldEmployeeCode; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getEmployeeCategoryId() { return employeeCategoryId; }
    public void setEmployeeCategoryId(Long employeeCategoryId) { this.employeeCategoryId = employeeCategoryId; }
    public BigDecimal getOtHours() { return otHours; }
    public void setOtHours(BigDecimal otHours) { this.otHours = otHours; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public java.util.Date getApprovedDate() { return approvedDate; }
    public void setApprovedDate(java.util.Date approvedDate) { this.approvedDate = approvedDate; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
}

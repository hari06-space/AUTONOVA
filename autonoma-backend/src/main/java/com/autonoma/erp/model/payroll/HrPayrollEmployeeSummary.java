package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "HR_PAYROLL_EMPLOYEE_SUMMARY")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollEmployeeSummary extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "PAYROLL_RUN_ID", nullable = false)
    private Long payrollRunId;

    @Column(name = "EMP_CODE", nullable = false, length = 50)
    private String empCode;

    @Column(name = "EMPLOYEE_NAME", nullable = false, length = 200)
    private String employeeName;

    @Column(name = "DEPARTMENT_NAME", length = 100)
    private String departmentName;

    @Column(name = "DESIGNATION_NAME", length = 100)
    private String designationName;

    @Column(name = "PRESENT_DAYS", precision = 5, scale = 2)
    private BigDecimal presentDays;

    @Column(name = "LOP_DAYS", precision = 5, scale = 2)
    private BigDecimal lopDays;

    @Column(name = "PAID_DAYS", precision = 5, scale = 2)
    private BigDecimal paidDays;

    @Column(name = "GROSS_EARNINGS", precision = 18, scale = 2)
    private BigDecimal grossEarnings;

    @Column(name = "TOTAL_DEDUCTIONS", precision = 18, scale = 2)
    private BigDecimal totalDeductions;

    @Column(name = "NET_SALARY", precision = 18, scale = 2)
    private BigDecimal netSalary;

    @Builder.Default
    @Column(name = "STATUS", nullable = false, length = 50)
    private String status = "PROCESSED"; // PROCESSED, ERROR, WARNING

    @Column(name = "ERROR_MESSAGE", length = 500)
    private String errorMessage;

    public String getEmpCode() { return empCode; }
    public String getEmployeeName() { return employeeName; }
    public String getDepartmentName() { return departmentName; }
    public String getDesignationName() { return designationName; }
    public BigDecimal getPresentDays() { return presentDays; }
    public BigDecimal getLopDays() { return lopDays; }
    public BigDecimal getPaidDays() { return paidDays; }
    public Long getPayrollRunId() { return payrollRunId; }
    public String getStatus() { return status; }
    public BigDecimal getGrossEarnings() { return grossEarnings; }
    public BigDecimal getTotalDeductions() { return totalDeductions; }
    public BigDecimal getNetSalary() { return netSalary; }
    public void setPayrollRunId(Long payrollRunId) { this.payrollRunId = payrollRunId; }
    public void setEmpCode(String empCode) { this.empCode = empCode; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public void setDesignationName(String designationName) { this.designationName = designationName; }
    public void setPresentDays(BigDecimal presentDays) { this.presentDays = presentDays; }
    public void setLopDays(BigDecimal lopDays) { this.lopDays = lopDays; }
    public void setPaidDays(BigDecimal paidDays) { this.paidDays = paidDays; }
    public void setGrossEarnings(BigDecimal grossEarnings) { this.grossEarnings = grossEarnings; }
    public void setTotalDeductions(BigDecimal totalDeductions) { this.totalDeductions = totalDeductions; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }
    public void setStatus(String status) { this.status = status; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}

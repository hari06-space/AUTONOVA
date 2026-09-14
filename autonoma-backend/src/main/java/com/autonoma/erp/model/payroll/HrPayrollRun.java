package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "HR_PAYROLL_RUN")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollRun extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "FINANCIAL_YEAR", nullable = false, length = 20)
    private String financialYear;

    @Column(name = "PAYROLL_MONTH", nullable = false, length = 20)
    private String payrollMonth;

    @Column(name = "PAYROLL_YEAR", nullable = false)
    private Integer payrollYear;

    @Builder.Default
    @Column(name = "TOTAL_EMPLOYEES")
    private Integer totalEmployees = 0;

    @Builder.Default
    @Column(name = "PROCESSED_EMPLOYEES")
    private Integer processedEmployees = 0;

    @Builder.Default
    @Column(name = "FAILED_EMPLOYEES")
    private Integer failedEmployees = 0;

    @Builder.Default
    @Column(name = "GROSS_SALARY", precision = 18, scale = 2)
    private BigDecimal grossSalary = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "TOTAL_DEDUCTIONS", precision = 18, scale = 2)
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "NET_PAYABLE", precision = 18, scale = 2)
    private BigDecimal netPayable = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "STATUS", nullable = false, length = 50)
    private String status = "DRAFT"; // DRAFT, PROCESSING, COMPLETED, APPROVED, CLOSED

    public Long getRowId() { return rowId; }
    public void setStatus(String status) { this.status = status; }
    public void setTotalEmployees(Integer totalEmployees) { this.totalEmployees = totalEmployees; }
    public void setProcessedEmployees(Integer processedEmployees) { this.processedEmployees = processedEmployees; }
    public void setFailedEmployees(Integer failedEmployees) { this.failedEmployees = failedEmployees; }
    public void setGrossSalary(BigDecimal grossSalary) { this.grossSalary = grossSalary; }
    public void setTotalDeductions(BigDecimal totalDeductions) { this.totalDeductions = totalDeductions; }
    public void setNetPayable(BigDecimal netPayable) { this.netPayable = netPayable; }
    public void setFinancialYear(String financialYear) { this.financialYear = financialYear; }
    public void setPayrollMonth(String payrollMonth) { this.payrollMonth = payrollMonth; }
    public String getPayrollMonth() { return payrollMonth; }
    public void setPayrollYear(Integer payrollYear) { this.payrollYear = payrollYear; }
    public Integer getPayrollYear() { return payrollYear; }
}

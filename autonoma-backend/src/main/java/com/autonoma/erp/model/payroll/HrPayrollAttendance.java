package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "HR_PAYROLL_ATTENDANCE", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"EMP_CODE", "PAYROLL_YEAR", "PAYROLL_MONTH"})
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollAttendance extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "EMP_CODE", nullable = false, length = 50)
    private String empCode;

    @Column(name = "PAYROLL_YEAR", nullable = false)
    private Integer payrollYear;

    @Column(name = "PAYROLL_MONTH", nullable = false, length = 20)
    private String payrollMonth;

    @Builder.Default
    @Column(name = "TOTAL_DAYS", precision = 5, scale = 2)
    private BigDecimal totalDays = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "PRESENT_DAYS", precision = 5, scale = 2)
    private BigDecimal presentDays = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "LOP_DAYS", precision = 5, scale = 2)
    private BigDecimal lopDays = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "WEEKLY_OFFS", precision = 5, scale = 2)
    private BigDecimal weeklyOffs = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "HOLIDAYS", precision = 5, scale = 2)
    private BigDecimal holidays = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "PAID_LEAVES", precision = 5, scale = 2)
    private BigDecimal paidLeaves = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "HALF_DAYS", precision = 5, scale = 2)
    private BigDecimal halfDays = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "PAID_DAYS", precision = 5, scale = 2)
    private BigDecimal paidDays = BigDecimal.ZERO;

    public String getEmpCode() { return empCode; }
    public Integer getPayrollYear() { return payrollYear; }
    public String getPayrollMonth() { return payrollMonth; }
    public BigDecimal getTotalDays() { return totalDays; }
    public BigDecimal getPresentDays() { return presentDays; }
    public BigDecimal getLopDays() { return lopDays; }
    public BigDecimal getWeeklyOffs() { return weeklyOffs; }
    public BigDecimal getHolidays() { return holidays; }
    public BigDecimal getPaidLeaves() { return paidLeaves; }
    public BigDecimal getPaidDays() { return paidDays; }
    public void setTotalDays(BigDecimal totalDays) { this.totalDays = totalDays; }
    public void setPresentDays(BigDecimal presentDays) { this.presentDays = presentDays; }
    public void setLopDays(BigDecimal lopDays) { this.lopDays = lopDays; }
    public void setWeeklyOffs(BigDecimal weeklyOffs) { this.weeklyOffs = weeklyOffs; }
    public void setHolidays(BigDecimal holidays) { this.holidays = holidays; }
    public void setPaidLeaves(BigDecimal paidLeaves) { this.paidLeaves = paidLeaves; }
    public void setPaidDays(BigDecimal paidDays) { this.paidDays = paidDays; }
}

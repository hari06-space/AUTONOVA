package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "HR_PAYROLL_PROCESS_CONFIG", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"PAYROLL_YEAR", "PAYROLL_MONTH"})
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollProcessConfig extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "FINANCIAL_YEAR", nullable = false, length = 20)
    private String financialYear; // e.g. 2026-2027

    @Column(name = "PAYROLL_MONTH", nullable = false, length = 20)
    private String payrollMonth;

    @Column(name = "PAYROLL_YEAR", nullable = false)
    private Integer payrollYear;

    @Column(name = "START_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date startDate;

    @Column(name = "END_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date endDate;

    @Column(name = "ATTENDANCE_LOCK_DATE")
    @Temporal(TemporalType.DATE)
    private Date attendanceLockDate;

    @Column(name = "SALARY_FREEZE_DATE")
    @Temporal(TemporalType.DATE)
    private Date salaryFreezeDate;

    @Column(name = "PAYROLL_LOCK_DATE")
    @Temporal(TemporalType.DATE)
    private Date payrollLockDate;

    @Column(name = "PAYSLIP_PUBLISH_DATE")
    @Temporal(TemporalType.DATE)
    private Date payslipPublishDate;

    @Builder.Default
    @Column(name = "INCLUDE_SUNDAYS", nullable = false)
    private Boolean includeSundays = true;

    @Builder.Default
    @Column(name = "CYCLE_TYPE", nullable = false, length = 50)
    private String cycleType = "STANDARD"; // STANDARD, CUSTOM

    @Builder.Default
    @Column(name = "CYCLE_START_DAY", nullable = false)
    private Integer cycleStartDay = 1;

    @Builder.Default
    @Column(name = "CYCLE_END_DAY", nullable = false)
    private Integer cycleEndDay = 30;

    @Builder.Default
    @Column(name = "STATUS", nullable = false, length = 50)
    private String status = "OPEN"; // OPEN, ATTENDANCE_LOCKED, FROZEN, PROCESSED, LOCKED

    public String getStatus() { return status; }
}

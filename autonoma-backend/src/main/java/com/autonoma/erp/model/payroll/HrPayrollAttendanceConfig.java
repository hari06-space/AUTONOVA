package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "HR_PAYROLL_ATTENDANCE_CONFIG")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollAttendanceConfig extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "COMPANY_ID")
    private Long companyId;

    @Column(name = "WORKING_DAYS_CALCULATION", nullable = false, length = 50)
    private String workingDaysCalculation; // CALENDAR_DAYS, FIXED_30, ACTUAL_WORKING_DAYS

    @Column(name = "WEEKLY_OFF_HANDLING", nullable = false, length = 50)
    private String weeklyOffHandling; // PAID, UNPAID

    @Column(name = "HOLIDAY_HANDLING", nullable = false, length = 50)
    private String holidayHandling; // PAID, UNPAID

    @Column(name = "LEAVE_HANDLING_JSON", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String leaveHandlingJson;

    @Column(name = "LOP_CALCULATION_FORMULA", nullable = false, length = 500)
    private String lopCalculationFormula;

    @Column(name = "HALF_DAY_CALCULATION", nullable = false, length = 50)
    private String halfDayCalculation;

    @Column(name = "ATTENDANCE_SOURCE_MAPPING", nullable = false, length = 100)
    private String attendanceSourceMapping;

    @Builder.Default
    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public void setWorkingDaysCalculation(String workingDaysCalculation) { this.workingDaysCalculation = workingDaysCalculation; }
    public void setWeeklyOffHandling(String weeklyOffHandling) { this.weeklyOffHandling = weeklyOffHandling; }
    public void setHolidayHandling(String holidayHandling) { this.holidayHandling = holidayHandling; }
    public void setLeaveHandlingJson(String leaveHandlingJson) { this.leaveHandlingJson = leaveHandlingJson; }
    public void setLopCalculationFormula(String lopCalculationFormula) { this.lopCalculationFormula = lopCalculationFormula; }
    public void setHalfDayCalculation(String halfDayCalculation) { this.halfDayCalculation = halfDayCalculation; }
    public void setAttendanceSourceMapping(String attendanceSourceMapping) { this.attendanceSourceMapping = attendanceSourceMapping; }
}

package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "HR_EMPLOYEE_SATISFACTION_CONFIG")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSatisfactionConfig extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @Column(name = "TOTAL_COHORTS", nullable = false)
    private Integer totalCohorts = 2;

    @Column(name = "TRIGGER_SEQUENCE", nullable = false)
    private String triggerSequence = "Cohort_A, Cohort_B";

    @Column(name = "COMPANY_HOLIDAY_REF_ID")
    private Long companyHolidayRefId;

    @Transient
    private String cycleIntervalMonths = "6";

    @Transient
    private String completionPeriodDays = "14";

    public String getCycleIntervalMonths() {
        return cycleIntervalMonths;
    }

    public void setCycleIntervalMonths(String cycleIntervalMonths) {
        this.cycleIntervalMonths = cycleIntervalMonths;
    }

    public String getCompletionPeriodDays() {
        return completionPeriodDays;
    }

    public void setCompletionPeriodDays(String completionPeriodDays) {
        this.completionPeriodDays = completionPeriodDays;
    }
}

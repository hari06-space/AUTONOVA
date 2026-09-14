package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_SATISFACTION_COHORT_AUDIT")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class HrEmployeeSatisfactionCohortAudit extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "COHORT_NAME", nullable = false)
    private String cohortName;

    @Column(name = "FEEDBACK_CYCLE", nullable = false)
    private String feedbackCycle;

    @Column(name = "EMPLOYEE_COUNT", nullable = false)
    private Integer employeeCount;

    @Column(name = "TRIGGER_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date triggerDate;
}

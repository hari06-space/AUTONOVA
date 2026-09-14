package com.autonoma.erp.model.purchase.workflow;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.master.organization.entity.Division;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "PP_PROCUREMENT_WORKFLOW")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ProcurementWorkflow extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION_ID", nullable = false)
    private Division division;

    @Column(name = "STEP_CODE", nullable = false, length = 50)
    private String stepCode;

    @Column(name = "STEP_NAME", nullable = false, length = 100)
    private String stepName;

    @Column(name = "MODULE_NAME", nullable = false, length = 100)
    private String moduleName;

    @Column(name = "SEQUENCE", nullable = false)
    private Integer sequence;

    @Column(name = "MANDATORY", nullable = false)
    private Integer mandatory = 1;

    @Column(name = "ENABLED", nullable = false)
    private Integer enabled = 1;

    @Column(name = "SKIP_ALLOWED", nullable = false)
    private Integer skipAllowed = 0;

    @Column(name = "NEXT_STEP", length = 50)
    private String nextStep;

    @Column(name = "ON_SUCCESS", length = 50)
    private String onSuccess;

    @Column(name = "ON_FAILURE", length = 50)
    private String onFailure;

    @Column(name = "CONDITION_EXPRESSION", length = 4000)
    private String conditionExpression;
}

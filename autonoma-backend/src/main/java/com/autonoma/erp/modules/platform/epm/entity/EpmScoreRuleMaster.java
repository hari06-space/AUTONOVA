package com.autonoma.erp.modules.platform.epm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "epm_score_rule_master")
@Data
@NoArgsConstructor
public class EpmScoreRuleMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_code", nullable = false, unique = true)
    private String ruleCode;

    @Column(name = "rule_name", nullable = false)
    private String ruleName;

    @Column(name = "description")
    private String description;

    @Column(name = "default_points")
    private Long defaultPoints;

    @Column(name = "formula_expression")
    private String formulaExpression;

    @Column(name = "is_penalty")
    private Boolean isPenalty = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_date", insertable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_date", insertable = false, updatable = false)
    private LocalDateTime updatedDate;
}

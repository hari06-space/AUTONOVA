package com.autonoma.erp.model;

import com.autonoma.erp.enums.FormulaType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "PP_PROCUREMENT_SCORING_RULES")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ProcurementScoringRule extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CATEGORY_ID", nullable = false)
    private ProcurementScoreCategory category;

    @Column(name = "RULE_CODE", nullable = false, length = 50)
    private String ruleCode;

    @Column(name = "DISPLAY_NAME", nullable = false, length = 100)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "FORMULA_TYPE", nullable = false, length = 50)
    private FormulaType formulaType;

    @Column(name = "FORMULA_EXPRESSION", length = 255)
    private String formulaExpression;

    @Column(name = "WEIGHT", nullable = false, precision = 5, scale = 2)
    private BigDecimal weight = BigDecimal.ZERO;

    @Column(name = "SEQUENCE")
    private Integer sequence = 0;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;

}

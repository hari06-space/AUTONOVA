package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "PP_QUOTE_COMPARISON_SCORE")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class QuoteComparisonScore extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "COMPARISON_HEAD_ID", nullable = false)
    private QuoteComparisonHead comparisonHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "COMPARISON_MATRIX_ID")
    private QuoteComparisonMatrix comparisonMatrix;

    @Column(name = "SUPPLIER_ID", nullable = false)
    private Long supplierId;

    @Column(name = "SCORE_TYPE", nullable = false, length = 50)
    private String scoreType;

    @Column(name = "RULE_CODE", length = 50)
    private String ruleCode;

    @Column(name = "VALUE_NUMERIC", precision = 18, scale = 4)
    private BigDecimal valueNumeric;

    @Column(name = "VALUE_TEXT", length = 500)
    private String valueText;

    @Column(name = "VALUE_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date valueDate;

    @Column(name = "VALUE_BOOLEAN")
    private Boolean valueBoolean;

    @Column(name = "APPLIED_WEIGHT", precision = 18, scale = 2)
    private BigDecimal appliedWeight;

    @Column(name = "CALCULATED_SCORE", precision = 18, scale = 4)
    private BigDecimal calculatedScore;

    @Column(name = "IS_LOWEST_PRICE")
    private Boolean isLowestPrice;

    @Column(name = "IS_RECOMMENDED")
    private Boolean isRecommended;

    @Column(name = "OVERALL_RANK")
    private Integer overallRank;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;

}

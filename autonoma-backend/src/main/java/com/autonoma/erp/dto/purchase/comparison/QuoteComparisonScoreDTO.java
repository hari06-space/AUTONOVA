package com.autonoma.erp.dto.purchase.comparison;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class QuoteComparisonScoreDTO {
    private Long id;
    private Long supplierId;
    private String supplierName;
    private Long rfqItemId; // Optional, if score is per item
    private String scoreType;
    private String ruleCode;
    private BigDecimal valueNumeric;
    private String valueText;
    private BigDecimal appliedWeight;
    private BigDecimal calculatedScore;
    private Boolean isLowestPrice;
    private Boolean isRecommended;
    private Integer overallRank;
}

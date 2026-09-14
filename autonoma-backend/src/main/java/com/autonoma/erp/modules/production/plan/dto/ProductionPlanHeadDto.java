/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: DTO for Production Plan Head
*/
package com.autonoma.erp.modules.production.plan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionPlanHeadDto {
    private Long planNo;
    private Date planDate;
    private Long productId;
    private String productCode;
    private String productName;
    private String productUom;
    private String sourceType;
    private Long sourceId;
    private String sourceNo;
    private Long divisionId;
    private String priority;
    private String status;
    private String remarks;
    private String createdBy;
    private Date createdDate;
    private String updatedBy;
    private Date updatedDate;

    // Aggregated Metrics
    @Builder.Default
    private BigDecimal totalPlannedQty = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal totalProductionQty = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal totalProcurementQty = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal totalShortageQty = BigDecimal.ZERO;
    private Date requiredDate;

    @Builder.Default
    private List<ProductionPlanTransDto> transactions = new ArrayList<>();

    @Builder.Default
    private List<ProductionPlanSummaryDto> requirementSummary = new ArrayList<>();
}

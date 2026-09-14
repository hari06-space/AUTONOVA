/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: DTO for Production Plan Transaction (Hierarchical Tree)
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
public class ProductionPlanTransDto {
    private Long planTransNo;
    private Long planNo;
    private Long parentTransNo;
    private Long sourceLineId;
    private Long productId;
    private String productCode;
    private String productName;
    private String itemType;       // FINISHED_GOOD, SUB_ASSEMBLY, RAW_MATERIAL, COMPONENT, BOUGHT_OUT
    private String requirementType;// PRODUCTION, PROCUREMENT
    private Long bomId;
    private String bomNo;
    private Long bomVersionId;
    private Integer bomLevel;
    private BigDecimal grossQty;
    private BigDecimal stockQty;
    private BigDecimal wipQty;
    private BigDecimal openProductionQty;
    private BigDecimal netQty;
    private String uom;
    private Date requiredDate;
    private String status;

    @Builder.Default
    private List<ProductionPlanTransDto> children = new ArrayList<>();
}

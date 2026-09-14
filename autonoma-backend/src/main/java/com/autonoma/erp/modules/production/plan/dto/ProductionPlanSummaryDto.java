/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: DTO for Aggregated Requirements (MRP Summary)
*/
package com.autonoma.erp.modules.production.plan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionPlanSummaryDto {
    private Long productId;
    private String productCode;
    private String productName;
    private String itemType;       // FINISHED_GOOD, SUB_ASSEMBLY, RAW_MATERIAL, COMPONENT, BOUGHT_OUT
    private String requirementType;// PRODUCTION, PROCUREMENT
    private BigDecimal totalGrossQty;
    private BigDecimal stockQty;
    private BigDecimal wipQty;
    private BigDecimal openProductionQty;
    private BigDecimal netQty;
    private String uom;
    private Date requiredDate;
    private Long bomId;
    private String bomNo;
    private String status;
}

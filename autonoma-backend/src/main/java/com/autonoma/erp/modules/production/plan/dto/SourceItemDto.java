/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: DTO for Source Document items & Pending Quantities
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
public class SourceItemDto {
    private Long sourceLineId;
    private Long productId;
    private String productCode;
    private String productName;
    private String uom;
    private BigDecimal sourceQty;
    private BigDecimal alreadyPlannedQty;
    private BigDecimal alreadyProducedQty;
    private BigDecimal pendingQty;
    private BigDecimal planQty;
    private Date requiredDate;
}

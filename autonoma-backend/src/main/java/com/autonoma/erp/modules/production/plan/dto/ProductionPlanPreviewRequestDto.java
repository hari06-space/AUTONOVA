/*
Organization: Autonoma ERP
Owner: Developer
Created At: 2026-09-05
Description: Input DTO for Production Plan Preview & Save Request
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
public class ProductionPlanPreviewRequestDto {
    private Long productId;
    private String sourceType; // SALES_ORDER, SALES_SCHEDULE, INVENTORY, ROL, MANUAL
    private Long sourceId;
    private String sourceNo;
    private Long divisionId;
    private String priority;
    private String remarks;

    @Builder.Default
    private List<PlanItemInput> items = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlanItemInput {
        private Long sourceLineId;
        private Long productId;
        private BigDecimal planQty;
        private Date requiredDate;
    }
}

package com.autonoma.erp.dto.purchase.comparison;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class QuoteComparisonTransDTO {
    private Long id;
    private Long rfqItemId;
    private String itemName;
    private Long selectedSupplierId;
    private String selectedSupplierName;
    private BigDecimal awardedPrice;
    private BigDecimal awardedQty;
    private String remarks;
}

package com.autonoma.erp.modules.inventory.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurrentStockReportDto {
    private Long id;
    private String inventoryType;
    private String itemNo;
    private String itemName;
    private String itemGroup;
    private String itemCategory;
    private String rackName;
    private String binName;
    private String uom;
    private String productImage;

    private Map<Long, BigDecimal> divisionStocks = new HashMap<>();
    private Map<Long, BigDecimal> divisionValues = new HashMap<>();

    private BigDecimal totalStock = BigDecimal.ZERO;
    private BigDecimal avgPrice = BigDecimal.ZERO;
    private BigDecimal totalValue = BigDecimal.ZERO;
}

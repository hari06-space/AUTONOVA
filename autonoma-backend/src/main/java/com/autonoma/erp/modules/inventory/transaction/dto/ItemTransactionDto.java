package com.autonoma.erp.modules.inventory.transaction.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ItemTransactionDto {
    private Long id;
    private String transCategory;
    private String inventoryType;
    private Long productId;
    private String productName;
    private LocalDate transDate;
    private String transNo;
    private String transType;
    private String referenceNo;
    private BigDecimal qtyIn;
    private BigDecimal qtyOut;
    private BigDecimal price;
    private String uom;
    private String batchId;
    private Long vendorId;
    private String vendorName;
    private String remarks;
    private Long divisionId;
    private String status;
    private String activeStatus;
    private Boolean isRejection = false;
}

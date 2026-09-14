package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class QuoteNegotiationTransDTO {
    private Long id;
    private Long negotiationHeadId;
    private Long quotationDetailId;
    
    private Long itemId;
    private String itemCode;
    private String itemName;
    private String itemDescription;
    
    private BigDecimal qty;
    
    private BigDecimal originalPrice;
    private BigDecimal negotiatedPrice;
    private BigDecimal savings;
    
    private Integer originalDeliveryDays;
    private Integer negotiatedDeliveryDays;
    
    private String originalWarranty;
    private String negotiatedWarranty;
    
    private String remarks;
}

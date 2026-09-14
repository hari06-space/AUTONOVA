package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;
import java.math.BigDecimal;

@Data
public class QuoteNegotiationListDTO {
    private Long id;
    private String negotiationNo;
    private Date negotiationDate;
    
    private Long quotationId;
    private String quotationNo;
    
    private Long rfqId;
    private String rfqNo;
    
    private Long prId;
    private String prNo;
    private String trackingStatus;
    
    private Long supplierId;
    private String supplierName;
    
    private Long buyerId;
    private String buyerName;
    
    private BigDecimal originalAmount;
    private BigDecimal negotiatedAmount;
    
    private Long statusId;
    private String statusName;
    
    private BigDecimal savings;
    private String negotiationRemarks;
}

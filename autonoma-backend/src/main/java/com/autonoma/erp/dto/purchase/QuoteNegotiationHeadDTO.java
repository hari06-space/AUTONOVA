package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;
import java.math.BigDecimal;
import java.util.List;

@Data
public class QuoteNegotiationHeadDTO {
    private Long id;
    private String negotiationNo;
    private Integer negotiationRound;
    private Date negotiationDate;
    
    private Long quotationId;
    private String quotationNo;
    
    private Long rfqId;
    private String rfqNo;
    
    private Long supplierId;
    private String supplierName;
    
    private Long buyerId;
    private String buyerName;
    
    private Long divisionId;
    
    private BigDecimal originalTotal;
    private BigDecimal negotiatedTotal;
    private BigDecimal totalSavings;
    
    private String originalDeliveryTerms;
    private String negotiatedDeliveryTerms;
    
    private String originalPaymentTerms;
    private String negotiatedPaymentTerms;
    
    private String originalTransportMode;
    private String negotiatedTransportMode;
    
    private String negotiationRemarks;
    private String supplierRemarks;
    
    private Long statusId;
    private String statusName;
    
    private List<QuoteNegotiationTransDTO> transactions;
    private List<QuoteNegotiationHistoryDTO> history;
}

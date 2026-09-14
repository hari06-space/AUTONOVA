package com.autonoma.erp.dto.purchase.purchasereturn;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseReturnHeadDTO {
    private Long id;
    private Long divisionId;
    
    private Long supplierId;
    private String supplierName;
    private String supplierCode;
    
    private Long grnHeadId;
    private String grnNo;
    
    private Long poHeadId;
    private String poNo;
    


    private String qiNo;
    
    private String returnNo;
    private LocalDateTime returnDate;
    private String returnType; // 'ACCEPTED_STOCK' or 'REJECTED_STOCK'
    
    private Long statusId;
    private String statusName;
    
    private BigDecimal totalQty;
    private BigDecimal totalAmount;
    private String remarks;
    
    private String createdBy;
    private LocalDateTime createdDate;
    
    @Builder.Default
    private List<PurchaseReturnTransDTO> transactions = new ArrayList<>();
}

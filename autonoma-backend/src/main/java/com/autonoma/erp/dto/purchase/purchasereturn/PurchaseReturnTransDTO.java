package com.autonoma.erp.dto.purchase.purchasereturn;

import com.autonoma.erp.dto.purchase.common.TransactionLineDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseReturnTransDTO {
    private Long id;
    private Long returnHeadId;
    
    private Long grnTransId;
    private Long poTransId;

    private Long qiTransId;
    
    private Long itemId;
    private String itemCode;
    private String itemName;
    
    private String uom;
    private String batchNo;
    
    private Long returnReasonId;
    private String returnReasonName;
    
    private BigDecimal sourceQty;
    private BigDecimal previousReturnedQty;
    private BigDecimal returnQty;
    
    private BigDecimal unitPrice;
    private BigDecimal amount;
    private String remarks;

    // Interface method for validation
    public Long getSourceLineId() {
        return qiTransId;
    }

    public BigDecimal getRequestedQty() {
        return returnQty;
    }
}

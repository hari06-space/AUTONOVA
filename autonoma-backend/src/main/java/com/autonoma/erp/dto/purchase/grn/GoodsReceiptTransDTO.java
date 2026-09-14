package com.autonoma.erp.dto.purchase.grn;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class GoodsReceiptTransDTO {
    private Long id;
    private Long grnHeadId;
    
    private Long poTransId;
    private Long gateEntryTransId;
    
    private Long purchaseScheduleId;
    private java.time.LocalDate scheduleDate;
    
    private Long itemId;
    private String itemCode;
    private String itemName;
    private Boolean isExpiryItem;
    
    private String uom;
    
    private BigDecimal price;
    private BigDecimal grnQty;
    
    private String batchNo;
    private String remarks;
    
    // New fields for PO and Tax display
    private String poNo;
    private String hsnCode;
    private BigDecimal taxPercent;
    private BigDecimal cgstPer;
    private BigDecimal sgstPer;
    private BigDecimal igstPer;
    
    // Derived property for UI convenience (not stored directly)
    private BigDecimal eligibleQty;
}

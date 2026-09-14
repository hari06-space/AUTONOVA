package com.autonoma.erp.dto.purchase.gateentry;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class GateEntryTransDTO {

    private Long id;
    private Long gateEntryHeadId;
    
    private Long sourceId;
    private String sourceType;
    private String sourceDocumentNo;
    private Long sourceLineId;
    
    private Long poTransId;
    
    private Long purchaseScheduleId;
    private java.time.LocalDate scheduleDate;
    private BigDecimal scheduleQty;
    
    private Long itemId;
    private String itemCode;
    private String itemName;
    private String itemDescription;
    private String uom;
    
    private BigDecimal qty;
    private BigDecimal pendingQty;
    
    private BigDecimal deliveredQty;
    private BigDecimal acceptedQty;
    private BigDecimal rejectedQty;
    private BigDecimal damagedQty;
    private BigDecimal shortQty;
    
    private Integer packageCount;
    private String batchNo;
    private String serialNo;
    private String remarks;
    
    private Integer activeStatus;
}

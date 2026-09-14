package com.autonoma.erp.dto.purchase.po;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;

@Data
public class PurchaseScheduleDTO {
    private Long id;
    private Long supplierId;
    private Long poId;
    private Long poItemId;
    private BigDecimal scheduleQty;
    private Date scheduleDate;
    private BigDecimal receiveQty;
    private BigDecimal asnQty;
    private Long statusId;
    private String statusName;
}

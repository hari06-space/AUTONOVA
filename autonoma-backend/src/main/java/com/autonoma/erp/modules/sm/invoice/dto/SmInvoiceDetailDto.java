package com.autonoma.erp.modules.sm.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmInvoiceDetailDto {
    private Long id;
    private Long salesOrderId;
    private String salesOrderNo;
    private Long salesOrderLineId;
    private Long partId;
    private String partNo;
    private String partName;
    private String uom;
    private Integer qty;
    private BigDecimal price;
    private BigDecimal discountPer;
    private BigDecimal cgstPer;
    private BigDecimal sgstPer;
    private BigDecimal igstPer;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal taxAmount;
    private BigDecimal netAmount;
}

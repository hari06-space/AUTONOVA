package com.autonoma.erp.modules.sm.invoice.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SmInvoiceChargeDto {
    private Long id;
    private Long chargeId;
    private BigDecimal amount;
    private Boolean taxAvailable;
    private BigDecimal cgstPer;
    private BigDecimal cgstVal;
    private BigDecimal sgstPer;
    private BigDecimal sgstVal;
    private BigDecimal igstPer;
    private BigDecimal igstVal;
    private BigDecimal totalValue;
    private Boolean status;
}

package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class QuotationChargeDTO {
    private Long id;
    private Long quoteId;
    private Long chargesId;
    private String chargeName; // the name from master for UI rendering
    private BigDecimal amount;
    private Boolean taxApplicable;
    private BigDecimal cgstPer;
    private BigDecimal cgstValue;
    private BigDecimal sgstPer;
    private BigDecimal sgstValue;
    private BigDecimal igstPer;
    private BigDecimal igstValue;
    private BigDecimal totalValue;
    private Boolean status;
}

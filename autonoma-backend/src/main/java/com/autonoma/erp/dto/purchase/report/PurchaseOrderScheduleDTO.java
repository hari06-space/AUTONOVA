package com.autonoma.erp.dto.purchase.report;

import java.math.BigDecimal;
import java.util.Date;

public interface PurchaseOrderScheduleDTO {
    Long getId();
    Long getPoId();
    String getPoNo();
    Date getPoDate();
    String getSupplierName();
    String getItemCode();
    String getItemName();
    String getUom();
    BigDecimal getPoQty();
    Date getExpectedDeliveryDate();
    String getStatus();
}

package com.autonoma.erp.dto.purchase.report;

import java.math.BigDecimal;
import java.util.Date;

public interface BatchTraceabilityDTO {
    String getBatchNo();
    String getItemCode();
    String getItemName();
    String getSupplierName();
    String getPoType();
    String getPrNo();
    String getPrStatus();
    String getPoNo();
    BigDecimal getPoQty();
    Date getExpectedDate();
    String getPoStatus();
    String getGateEntryNo();
    Date getGateEntryDate();
    Date getReceivedDate();
    String getGateEntryStatus();
    String getGrnNo();
    BigDecimal getGrnQty();
    String getGrnStatus();
    BigDecimal getAccQty();
    BigDecimal getRejQty();
    String getRejComments();
    BigDecimal getNcQty();
    String getNcComments();
    String getInspectionStatus();
}

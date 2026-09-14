package com.autonoma.erp.modules.inventory.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class StockLedgerReportDto {
    private LocalDate transDate;
    private String transNo;
    private String transType;
    private String referenceNo;
    private BigDecimal qtyIn;
    private BigDecimal qtyOut;
    private BigDecimal runningBalance;

    public StockLedgerReportDto(LocalDate transDate, String transNo, String transType, String referenceNo, BigDecimal qtyIn, BigDecimal qtyOut, BigDecimal runningBalance) {
        this.transDate = transDate;
        this.transNo = transNo;
        this.transType = transType;
        this.referenceNo = referenceNo;
        this.qtyIn = qtyIn;
        this.qtyOut = qtyOut;
        this.runningBalance = runningBalance;
    }

    public LocalDate getTransDate() { return transDate; }
    public void setTransDate(LocalDate transDate) { this.transDate = transDate; }
    public String getTransNo() { return transNo; }
    public void setTransNo(String transNo) { this.transNo = transNo; }
    public String getTransType() { return transType; }
    public void setTransType(String transType) { this.transType = transType; }
    public String getReferenceNo() { return referenceNo; }
    public void setReferenceNo(String referenceNo) { this.referenceNo = referenceNo; }
    public BigDecimal getQtyIn() { return qtyIn; }
    public void setQtyIn(BigDecimal qtyIn) { this.qtyIn = qtyIn; }
    public BigDecimal getQtyOut() { return qtyOut; }
    public void setQtyOut(BigDecimal qtyOut) { this.qtyOut = qtyOut; }
    public BigDecimal getRunningBalance() { return runningBalance; }
    public void setRunningBalance(BigDecimal runningBalance) { this.runningBalance = runningBalance; }
}

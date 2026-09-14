package com.autonoma.erp.modules.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutstandingBalanceDTO {
    
    private Long outstandingId;
    private Long partyId;
    private String partyName;
    private String partyBillNo;
    private Date partyBillDate;
    private Date dueDate;
    
    private BigDecimal originalAmount;
    private BigDecimal settledAmount;
    private BigDecimal balanceAmount;
    
    private String status;
    private Long daysOutstanding;

    public Long getOutstandingId() { return outstandingId; }
    public void setOutstandingId(Long outstandingId) { this.outstandingId = outstandingId; }
    public Long getPartyId() { return partyId; }
    public void setPartyId(Long partyId) { this.partyId = partyId; }
    public String getPartyName() { return partyName; }
    public void setPartyName(String partyName) { this.partyName = partyName; }
    public String getPartyBillNo() { return partyBillNo; }
    public void setPartyBillNo(String partyBillNo) { this.partyBillNo = partyBillNo; }
    public Date getPartyBillDate() { return partyBillDate; }
    public void setPartyBillDate(Date partyBillDate) { this.partyBillDate = partyBillDate; }
    public Date getDueDate() { return dueDate; }
    public void setDueDate(Date dueDate) { this.dueDate = dueDate; }
    public BigDecimal getOriginalAmount() { return originalAmount; }
    public void setOriginalAmount(BigDecimal originalAmount) { this.originalAmount = originalAmount; }
    public BigDecimal getSettledAmount() { return settledAmount; }
    public void setSettledAmount(BigDecimal settledAmount) { this.settledAmount = settledAmount; }
    public BigDecimal getBalanceAmount() { return balanceAmount; }
    public void setBalanceAmount(BigDecimal balanceAmount) { this.balanceAmount = balanceAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getDaysOutstanding() { return daysOutstanding; }
    public void setDaysOutstanding(Long daysOutstanding) { this.daysOutstanding = daysOutstanding; }
}

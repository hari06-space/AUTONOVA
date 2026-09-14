package com.autonoma.erp.modules.finance.dto;

import com.autonoma.erp.modules.finance.entity.FinanceOutstanding;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;

@Data
@NoArgsConstructor
public class FinanceOutstandingReportDTO {

    private Long id;
    private Date transDate;
    private String partyName;
    private Long partyId;
    private String partyBillNo;
    private Date partyBillDate;
    private Date dueDate;
    
    // Derived Calculations
    private BigDecimal billAmount;
    private BigDecimal settledAmount;
    private BigDecimal balanceAmount;
    
    private Long daysOutstanding;
    private String status; // "PAID", "PARTIALLY_PAID", "OUTSTANDING", "OVERDUE"
    private boolean onAccount;

    public FinanceOutstandingReportDTO(FinanceOutstanding entity, BigDecimal settledAmount, BigDecimal balanceAmount) {
        this.id = entity.getId();
        this.transDate = entity.getTransDate();
        this.partyId = entity.getParty() != null ? entity.getParty().getId() : null;
        if (entity.getParty() != null) {
            this.partyName = entity.getParty().getLedgerName();
        } else {
            this.partyName = String.valueOf(this.partyId);
        }
        this.partyBillNo = entity.getPartyBillNo();
        this.partyBillDate = entity.getPartyBillDate();
        this.dueDate = null; // Due Date not stored in outstanding
        this.onAccount = Boolean.TRUE.equals(entity.getOnAccount());
        
        // Ensure values are not null
        BigDecimal drAmt = entity.getDrAmt() != null ? entity.getDrAmt() : BigDecimal.ZERO;
        BigDecimal crAmt = entity.getCrAmt() != null ? entity.getCrAmt() : BigDecimal.ZERO;
        
        // Calculate Bill Amount depending on whether it's an Invoice (Dr) or On-Account Payment (Cr)
        this.billAmount = Boolean.TRUE.equals(entity.getOnAccount()) ? crAmt : drAmt;
        this.settledAmount = settledAmount != null ? settledAmount : BigDecimal.ZERO;
        this.balanceAmount = balanceAmount != null ? balanceAmount : BigDecimal.ZERO;
        
        // Calculate status
        if (this.balanceAmount.compareTo(BigDecimal.ZERO) <= 0) {
            this.status = "PAID";
        } else if (this.settledAmount.compareTo(BigDecimal.ZERO) > 0) {
            this.status = "PARTIALLY_PAID";
        } else {
            this.status = "OUTSTANDING";
        }
        
        // Overdue status check
        if (this.balanceAmount.compareTo(BigDecimal.ZERO) > 0 && this.dueDate != null) {
            if (new Date().after(this.dueDate)) {
                this.status = "OVERDUE";
            }
        }
        
        // Calculate days outstanding
        if (this.transDate != null && this.balanceAmount.compareTo(BigDecimal.ZERO) > 0) {
            long diffInMillis = new Date().getTime() - this.transDate.getTime();
            this.daysOutstanding = diffInMillis / (1000 * 60 * 60 * 24);
        } else {
            this.daysOutstanding = 0L;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Date getTransDate() { return transDate; }
    public void setTransDate(Date transDate) { this.transDate = transDate; }
    public String getPartyName() { return partyName; }
    public void setPartyName(String partyName) { this.partyName = partyName; }
    public Long getPartyId() { return partyId; }
    public void setPartyId(Long partyId) { this.partyId = partyId; }
    public String getPartyBillNo() { return partyBillNo; }
    public void setPartyBillNo(String partyBillNo) { this.partyBillNo = partyBillNo; }
    public Date getPartyBillDate() { return partyBillDate; }
    public void setPartyBillDate(Date partyBillDate) { this.partyBillDate = partyBillDate; }
    public Date getDueDate() { return dueDate; }
    public void setDueDate(Date dueDate) { this.dueDate = dueDate; }
    public BigDecimal getBillAmount() { return billAmount; }
    public void setBillAmount(BigDecimal billAmount) { this.billAmount = billAmount; }
    public BigDecimal getSettledAmount() { return settledAmount; }
    public void setSettledAmount(BigDecimal settledAmount) { this.settledAmount = settledAmount; }
    public BigDecimal getBalanceAmount() { return balanceAmount; }
    public void setBalanceAmount(BigDecimal balanceAmount) { this.balanceAmount = balanceAmount; }
    public Long getDaysOutstanding() { return daysOutstanding; }
    public void setDaysOutstanding(Long daysOutstanding) { this.daysOutstanding = daysOutstanding; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isOnAccount() { return onAccount; }
    public void setOnAccount(boolean onAccount) { this.onAccount = onAccount; }
}

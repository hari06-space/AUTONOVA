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
public class FinancePostingDTO {
    
    private Date transDate;
    private String transType; // e.g. SUPPLIER_INVOICE, SUPPLIER_PAYMENT, CUSTOMER_INVOICE, CUSTOMER_RECEIPT
    private Integer refId;
    private String vrName;
    private String vrNo;
    
    private Long headId;      // GL Account or standard Ledger
    private String headName;
    
    private Long partyId;     // The Supplier / Customer
    
    private BigDecimal drAmt;
    private BigDecimal crAmt;
    private BigDecimal taxableAmt;
    private BigDecimal billAmt;
    
    private String narration;
    private String partyBillNo;
    private Date partyBillDate;
    
    private String transMode; // NEFT, CASH, CHEQUE, UPI
    private String chequeNo;
    private Date chequeDate;
    private Date dueDate;
    
    private Boolean onAccount;
    
    private Long divisionId;
    private String userId; // Usually extracted from Security Context, but can be passed

    public Date getTransDate() { return transDate; }
    public void setTransDate(Date transDate) { this.transDate = transDate; }
    public String getTransType() { return transType; }
    public void setTransType(String transType) { this.transType = transType; }
    public Integer getRefId() { return refId; }
    public void setRefId(Integer refId) { this.refId = refId; }
    public String getVrName() { return vrName; }
    public void setVrName(String vrName) { this.vrName = vrName; }
    public String getVrNo() { return vrNo; }
    public void setVrNo(String vrNo) { this.vrNo = vrNo; }
    public Long getHeadId() { return headId; }
    public void setHeadId(Long headId) { this.headId = headId; }
    public String getHeadName() { return headName; }
    public void setHeadName(String headName) { this.headName = headName; }
    public Long getPartyId() { return partyId; }
    public void setPartyId(Long partyId) { this.partyId = partyId; }
    public BigDecimal getDrAmt() { return drAmt; }
    public void setDrAmt(BigDecimal drAmt) { this.drAmt = drAmt; }
    public BigDecimal getCrAmt() { return crAmt; }
    public void setCrAmt(BigDecimal crAmt) { this.crAmt = crAmt; }
    public BigDecimal getTaxableAmt() { return taxableAmt; }
    public void setTaxableAmt(BigDecimal taxableAmt) { this.taxableAmt = taxableAmt; }
    public BigDecimal getBillAmt() { return billAmt; }
    public void setBillAmt(BigDecimal billAmt) { this.billAmt = billAmt; }
    public String getNarration() { return narration; }
    public void setNarration(String narration) { this.narration = narration; }
    public String getPartyBillNo() { return partyBillNo; }
    public void setPartyBillNo(String partyBillNo) { this.partyBillNo = partyBillNo; }
    public Date getPartyBillDate() { return partyBillDate; }
    public void setPartyBillDate(Date partyBillDate) { this.partyBillDate = partyBillDate; }
    public String getTransMode() { return transMode; }
    public void setTransMode(String transMode) { this.transMode = transMode; }
    public String getChequeNo() { return chequeNo; }
    public void setChequeNo(String chequeNo) { this.chequeNo = chequeNo; }
    public Date getChequeDate() { return chequeDate; }
    public void setChequeDate(Date chequeDate) { this.chequeDate = chequeDate; }
    public Date getDueDate() { return dueDate; }
    public void setDueDate(Date dueDate) { this.dueDate = dueDate; }
    public Boolean getOnAccount() { return onAccount; }
    public void setOnAccount(Boolean onAccount) { this.onAccount = onAccount; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}

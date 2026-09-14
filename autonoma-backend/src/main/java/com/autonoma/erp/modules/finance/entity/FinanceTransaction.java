package com.autonoma.erp.modules.finance.entity;

import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "FA_FINANACE_TRANSACTION")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FinanceTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "TRANS_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date transDate;

    @Column(name = "TRANS_TYPE", length = 50)
    private String transType;

    @Column(name = "REF_ID")
    private Integer refId;

    @Column(name = "VR_NAME", length = 50)
    private String vrName;

    @Column(name = "VR_NO", length = 50)
    private String vrNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "HEAD_ID", nullable = false)
    private AccountLedger head;

    @Column(name = "HEAD_NAME", nullable = false, length = 250)
    private String headName;

    @Column(name = "DR_AMT", precision = 18, scale = 2)
    private BigDecimal drAmt;

    @Column(name = "CR_AMT", precision = 18, scale = 2)
    private BigDecimal crAmt;

    @Column(name = "TAXABLE_AMT", precision = 18, scale = 2)
    private BigDecimal taxableAmt;

    @Column(name = "BILL_AMT", precision = 18, scale = 2)
    private BigDecimal billAmt;

    @Column(name = "NARRATION", length = 500)
    private String narration;

    @Column(name = "PARTY_BILL_NO", length = 50)
    private String partyBillNo;

    @Column(name = "PARTY_BILL_DATE")
    @Temporal(TemporalType.DATE)
    private Date partyBillDate;

    @Column(name = "TRANS_MODE", length = 50)
    private String transMode;

    @Column(name = "CHEQUE_NO", length = 50)
    private String chequeNo;

    @Column(name = "CHEQUE_DATE")
    @Temporal(TemporalType.DATE)
    private Date chequeDate;

    @Column(name = "DUE_DATE")
    @Temporal(TemporalType.DATE)
    private Date dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PARTY_ID", nullable = false)
    private AccountLedger party;

    @Column(name = "RECO_DONE")
    private Boolean recoDone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BILL_OUTSTANDING_ID")
    private FinanceOutstanding billOutstanding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION")
    private Division division;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public AccountLedger getHead() { return head; }
    public void setHead(AccountLedger head) { this.head = head; }
    public String getHeadName() { return headName; }
    public void setHeadName(String headName) { this.headName = headName; }
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
    public AccountLedger getParty() { return party; }
    public void setParty(AccountLedger party) { this.party = party; }
    public Boolean getRecoDone() { return recoDone; }
    public void setRecoDone(Boolean recoDone) { this.recoDone = recoDone; }
    public FinanceOutstanding getBillOutstanding() { return billOutstanding; }
    public void setBillOutstanding(FinanceOutstanding billOutstanding) { this.billOutstanding = billOutstanding; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}

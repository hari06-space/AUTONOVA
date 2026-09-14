package com.autonoma.erp.modules.finance.entity;

import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "FA_FINANACE_OUTSTANDING")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FinanceOutstanding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "TRANS_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date transDate;

    @Column(name = "TRANS_TYPE", length = 50)
    private String transType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PARTY_ID", nullable = false)
    private AccountLedger party;

    @Column(name = "VR_NO", length = 50)
    private String vrNo;

    @Column(name = "PARTY_BILL_NO", length = 50)
    private String partyBillNo;

    @Column(name = "PARTY_BILL_DATE")
    @Temporal(TemporalType.DATE)
    private Date partyBillDate;

    @Column(name = "DR_AMT", precision = 18, scale = 2)
    private BigDecimal drAmt;

    @Column(name = "CR_AMT", precision = 18, scale = 2)
    private BigDecimal crAmt;

    @Column(name = "CHEQUE_NO", length = 50)
    private String chequeNo;

    @Column(name = "CHEQUE_DATE")
    @Temporal(TemporalType.DATE)
    private Date chequeDate;

    @Column(name = "ON_ACCOUNT")
    private Boolean onAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS")
    private StatusMaster status;

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
    public AccountLedger getParty() { return party; }
    public void setParty(AccountLedger party) { this.party = party; }
    public String getVrNo() { return vrNo; }
    public void setVrNo(String vrNo) { this.vrNo = vrNo; }
    public String getPartyBillNo() { return partyBillNo; }
    public void setPartyBillNo(String partyBillNo) { this.partyBillNo = partyBillNo; }
    public Date getPartyBillDate() { return partyBillDate; }
    public void setPartyBillDate(Date partyBillDate) { this.partyBillDate = partyBillDate; }
    public BigDecimal getDrAmt() { return drAmt; }
    public void setDrAmt(BigDecimal drAmt) { this.drAmt = drAmt; }
    public BigDecimal getCrAmt() { return crAmt; }
    public void setCrAmt(BigDecimal crAmt) { this.crAmt = crAmt; }
    public String getChequeNo() { return chequeNo; }
    public void setChequeNo(String chequeNo) { this.chequeNo = chequeNo; }
    public Date getChequeDate() { return chequeDate; }
    public void setChequeDate(Date chequeDate) { this.chequeDate = chequeDate; }
    public Boolean getOnAccount() { return onAccount; }
    public void setOnAccount(Boolean onAccount) { this.onAccount = onAccount; }
    public StatusMaster getStatus() { return status; }
    public void setStatus(StatusMaster status) { this.status = status; }
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

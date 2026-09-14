package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.finance.ledgergroup.entity.LedgerGroup;
import com.autonoma.erp.modules.master.commercial.entity.TermsMaster;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;

import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "SALES_PRICE_LIST_MASTER")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesPriceMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PRICE_LIST_NO", unique = true, nullable = false, length = 50)
    private String priceListNo;

    @Column(name = "PRICE_LIST_TYPE", nullable = false, length = 50)
    private String priceListType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CUSTOMER_ID")
    private AccountLedger customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CUSTOMER_GROUP_ID")
    private LedgerGroup customerGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PAYMENT_TERM_ID")
    private TermsMaster paymentTerms;

    @Column(name = "REFERENCE_NO", length = 100)
    private String referenceNo;

    @Transient
    private List<SalesAttachmentPath> attachments;

    @Column(name = "EFFECTIVE_FROM", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date effectiveFrom;

    @Column(name = "EFFECTIVE_TO", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date effectiveTo;

    @Column(name = "EXCHANGE_RATE")
    private Double exchangeRate = 1.0;

    @Column(name = "STATUS", nullable = false, length = 50)
    private String status = "ACTIVE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VERIFY_STATUS")
    private StatusMaster verifyStatus;

    @Column(name = "VERIFY_REJ_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String verifyRejComments;

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    public String getVerifyRejComments() {
        return verifyRejComments;
    }

    public void setVerifyRejComments(String verifyRejComments) {
        this.verifyRejComments = verifyRejComments;
    }

    @Column(name = "CREATED_BY", length = 50, nullable = false, updatable = false)
    private String createdBy;

    @Column(name = "CREATED_DATE", nullable = false, updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @Column(name = "VERIFIED_BY", length = 50)
    private String verifiedBy;

    @Column(name = "VERIFIED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date verifiedDate;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "priceMaster", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SalesPriceMasterDetail> details = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPriceListNo() {
        return priceListNo;
    }

    public void setPriceListNo(String priceListNo) {
        this.priceListNo = priceListNo;
    }

    public String getPriceListType() {
        return priceListType;
    }

    public void setPriceListType(String priceListType) {
        this.priceListType = priceListType;
    }

    public AccountLedger getCustomer() {
        return customer;
    }

    public void setCustomer(AccountLedger customer) {
        this.customer = customer;
    }

    public LedgerGroup getCustomerGroup() {
        return customerGroup;
    }

    public void setCustomerGroup(LedgerGroup customerGroup) {
        this.customerGroup = customerGroup;
    }

    public TermsMaster getPaymentTerms() {
        return paymentTerms;
    }

    public void setPaymentTerms(TermsMaster paymentTerms) {
        this.paymentTerms = paymentTerms;
    }

    public String getReferenceNo() {
        return referenceNo;
    }

    public void setReferenceNo(String referenceNo) {
        this.referenceNo = referenceNo;
    }

    public Date getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(Date effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public Date getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(Date effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public Double getExchangeRate() {
        return exchangeRate;
    }

    public void setExchangeRate(Double exchangeRate) {
        this.exchangeRate = exchangeRate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public StatusMaster getVerifyStatus() {
        return verifyStatus;
    }

    public void setVerifyStatus(StatusMaster verifyStatus) {
        this.verifyStatus = verifyStatus;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Date getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(Date updatedDate) {
        this.updatedDate = updatedDate;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(String verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public Date getVerifiedDate() {
        return verifiedDate;
    }

    public void setVerifiedDate(Date verifiedDate) {
        this.verifiedDate = verifiedDate;
    }

    public List<SalesPriceMasterDetail> getDetails() {
        return details;
    }

    public void setDetails(List<SalesPriceMasterDetail> details) {
        this.details = details;
    }
}

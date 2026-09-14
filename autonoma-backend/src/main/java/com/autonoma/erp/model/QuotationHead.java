package com.autonoma.erp.model;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.master.organization.entity.Division;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "PP_QUOTATION_HEAD")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class QuotationHead extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "QUOTATION_NO", length = 50, nullable = false)
    private String quotationNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RFQ_REF_ID", nullable = false)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private RfqHead rfqHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", nullable = false)
    private AccountLedger supplier;

    @Column(name = "QUOTATION_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date quotationDate;

    @Column(name = "VALIDITY_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date validityDate;

    @Column(name = "CURRENCY", length = 20, nullable = false)
    private String currency = "INR";

    @Column(name = "LEAD_TIME_DAYS")
    private Integer leadTimeDays;

    @Column(name = "WARRANTY_TERMS", length = 250)
    private String warrantyTerms;

    @Column(name = "PAYMENT_TERMS", length = 250)
    private String paymentTerms;

    @Column(name = "DELIVERY_TERMS", length = 500)
    private String deliveryTerms;

    @Column(name = "REMARKS", length = 500)
    private String remarks;

    @Column(name = "SUPPLIER_REF_NO", length = 100)
    private String supplierReferenceNo;

    @Column(name = "SUPPLIER_REF_DATE")
    @Temporal(TemporalType.DATE)
    private Date supplierReferenceDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TECHNICAL_STATUS_ID")
    private StatusMaster technicalStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS_ID", nullable = false)
    private StatusMaster status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    @OneToMany(mappedBy = "quotationHead", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private List<QuotationDetail> details;

    @OneToMany(mappedBy = "quotationHead", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private List<QuotationAttachment> attachments;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuotationNo() { return quotationNo; }
    public void setQuotationNo(String quotationNo) { this.quotationNo = quotationNo; }
    public RfqHead getRfqHead() { return rfqHead; }
    public void setRfqHead(RfqHead rfqHead) { this.rfqHead = rfqHead; }
    public AccountLedger getSupplier() { return supplier; }
    public void setSupplier(AccountLedger supplier) { this.supplier = supplier; }
    public Date getQuotationDate() { return quotationDate; }
    public void setQuotationDate(Date quotationDate) { this.quotationDate = quotationDate; }
    public Date getValidityDate() { return validityDate; }
    public void setValidityDate(Date validityDate) { this.validityDate = validityDate; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Integer getLeadTimeDays() { return leadTimeDays; }
    public void setLeadTimeDays(Integer leadTimeDays) { this.leadTimeDays = leadTimeDays; }
    public String getWarrantyTerms() { return warrantyTerms; }
    public void setWarrantyTerms(String warrantyTerms) { this.warrantyTerms = warrantyTerms; }
    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
    public String getDeliveryTerms() { return deliveryTerms; }
    public void setDeliveryTerms(String deliveryTerms) { this.deliveryTerms = deliveryTerms; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public StatusMaster getTechnicalStatus() { return technicalStatus; }
    public void setTechnicalStatus(StatusMaster technicalStatus) { this.technicalStatus = technicalStatus; }
    public StatusMaster getStatus() { return status; }
    public void setStatus(StatusMaster status) { this.status = status; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
    public List<QuotationDetail> getDetails() { return details; }
    public void setDetails(List<QuotationDetail> details) { this.details = details; }
    public List<QuotationAttachment> getAttachments() { return attachments; }
    public void setAttachments(List<QuotationAttachment> attachments) { this.attachments = attachments; }

    @OneToMany(mappedBy = "quotationHead", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private List<QuotationCharge> additionalCharges = new ArrayList<>();

    @Column(name = "TRANSPORT_SCOPE", length = 50)
    private String transportScope;

    public String getTransportScope() {
        return transportScope;
    }

    public void setTransportScope(String transportScope) {
        this.transportScope = transportScope;
    }
}

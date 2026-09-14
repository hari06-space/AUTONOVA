package com.autonoma.erp.model.admin;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_PREFIX_CREDENTIALS")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrefixCredential {

    @Id
    @Column(name = "account_year", nullable = false, columnDefinition = "NVARCHAR(20)")
    private String accountYear;

    @Column(name = "status")
    private Integer status;

    @Column(name = "sales_order_prefix", columnDefinition = "NVARCHAR(20)")
    private String salesOrderPrefix;

    @Column(name = "sales_order_suffix", columnDefinition = "NVARCHAR(20)")
    private String salesOrderSuffix;

    @Column(name = "sales_order_digit")
    private Integer salesOrderDigit;

    @Column(name = "mat_po_prefix", columnDefinition = "NVARCHAR(20)")
    private String matPoPrefix;

    @Column(name = "mat_po_suffix", columnDefinition = "NVARCHAR(20)")
    private String matPoSuffix;

    @Column(name = "mat_po_digit")
    private Integer matPoDigit;

    @Column(name = "gate_entry_prefix", columnDefinition = "NVARCHAR(20)")
    private String gateEntryPrefix;

    @Column(name = "gate_entry_suffix", columnDefinition = "NVARCHAR(20)")
    private String gateEntrySuffix;

    @Column(name = "gate_entry_digit")
    private Integer gateEntryDigit;

    @Column(name = "grn_prefix", columnDefinition = "NVARCHAR(20)")
    private String grnPrefix;

    @Column(name = "grn_suffix", columnDefinition = "NVARCHAR(20)")
    private String grnSuffix;

    @Column(name = "grn_digit")
    private Integer grnDigit;


    @Column(name = "invoice_prefix", columnDefinition = "NVARCHAR(20)")
    private String invoicePrefix;

    @Column(name = "invoice_suffix", columnDefinition = "NVARCHAR(20)")
    private String invoiceSuffix;

    @Column(name = "invoice_digit")
    private Integer invoiceDigit;

    @Column(name = "task_prefix", columnDefinition = "NVARCHAR(20)")
    private String taskPrefix;

    @Column(name = "task_suffix", columnDefinition = "NVARCHAR(20)")
    private String taskSuffix;

    @Column(name = "task_digit")
    private Integer taskDigit;

    // QMS prefix fields
    @Column(name = "ncr_prefix", columnDefinition = "NVARCHAR(20)")
    private String ncrPrefix;

    @Column(name = "ncr_suffix", columnDefinition = "NVARCHAR(20)")
    private String ncrSuffix;

    @Column(name = "ncr_digit")
    private Integer ncrDigit;

    @Column(name = "ofi_prefix", columnDefinition = "NVARCHAR(20)")
    private String ofiPrefix;

    @Column(name = "ofi_suffix", columnDefinition = "NVARCHAR(20)")
    private String ofiSuffix;

    @Column(name = "ofi_digit")
    private Integer ofiDigit;

    @Column(name = "observation_prefix", columnDefinition = "NVARCHAR(20)")
    private String observationPrefix;

    @Column(name = "observation_digit")
    private Integer observationDigit;

    @Column(name = "VISITOR_GATE_PASS_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String visitorGatePassPrefix;

    @Column(name = "VISITOR_GATE_PASS_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String visitorGatePassSuffix;

    @Column(name = "VISITOR_GATE_PASS_DIGIT")
    private Integer visitorGatePassDigit;

    @Column(name = "MEMO_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String memoPrefix;

    @Column(name = "MEMO_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String memoSuffix;

    @Column(name = "MEMO_DIGIT")
    private Integer memoDigit;

    @Column(name = "AUDIT_SCHEDULE_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String auditSchedulePrefix;

    @Column(name = "AUDIT_SCHEDULE_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String auditScheduleSuffix;

    @Column(name = "AUDIT_SCHEDULE_DIGIT")
    private Integer auditScheduleDigit;

    @Column(name = "AUDIT_OBSERVATION_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String auditObservationPrefix;

    @Column(name = "AUDIT_OBSERVATION_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String auditObservationSuffix;

    @Column(name = "AUDIT_OBSERVATION_DIGIT")
    private Integer auditObservationDigit;

    @Column(name = "PRODUCT_BUNDLE_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String productBundlePrefix;

    @Column(name = "PRODUCT_BUNDLE_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String productBundleSuffix;

    @Column(name = "PRODUCT_BUNDLE_DIGIT")
    private Integer productBundleDigit;

    @Column(name = "GPL_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String gplPrefix;

    @Column(name = "CPC_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String cpcPrefix;

    @Column(name = "PRICE_LIST_DIGIT")
    private Integer priceListDigit;

    @Column(name = "PR_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String prPrefix;

    @Column(name = "PR_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String prSuffix;

    @Column(name = "PR_DIGIT")
    private Integer prDigit;

    @Column(name = "RFQ_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String rfqPrefix;

    @Column(name = "RFQ_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String rfqSuffix;

    @Column(name = "RFQ_DIGIT")
    private Integer rfqDigit;

    @Column(name = "QUOTATION_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String quotationPrefix;

    @Column(name = "QUOTATION_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String quotationSuffix;

    @Column(name = "QUOTATION_DIGIT")
    private Integer quotationDigit;

    @Column(name = "NEGOTIATION_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String negotiationPrefix;

    @Column(name = "NEGOTIATION_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String negotiationSuffix;

    @Column(name = "NEGOTIATION_DIGIT")
    private Integer negotiationDigit;

    @Column(name = "ATS_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String atsPrefix;

    @Column(name = "ATS_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String atsSuffix;

    @Column(name = "ATS_DIGIT")
    private Integer atsDigit;

    @Column(name = "OFFER_LETTER_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String offerLetterPrefix;

    @Column(name = "OFFER_LETTER_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String offerLetterSuffix;

    @Column(name = "OFFER_LETTER_DIGIT")
    private Integer offerLetterDigit;

    @Column(name = "DC_PREFIX", columnDefinition = "NVARCHAR(20)")
    private String dcPrefix;

    @Column(name = "DC_SUFFIX", columnDefinition = "NVARCHAR(20)")
    private String dcSuffix;

    @Column(name = "DC_DIGIT")
    private Integer dcDigit;

    @Column(name = "CREATED_BY", nullable = false, length = 50, updatable = false)
    private String createdBy;

    @Column(name = "CREATED_DATE", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    // Getters and Setters
    public String getAccountYear() {
        return accountYear;
    }

    public void setAccountYear(String accountYear) {
        this.accountYear = accountYear;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public String getSalesOrderPrefix() {
        return salesOrderPrefix;
    }

    public void setSalesOrderPrefix(String salesOrderPrefix) {
        this.salesOrderPrefix = salesOrderPrefix;
    }

    public String getSalesOrderSuffix() {
        return salesOrderSuffix;
    }

    public void setSalesOrderSuffix(String salesOrderSuffix) {
        this.salesOrderSuffix = salesOrderSuffix;
    }

    public Integer getSalesOrderDigit() {
        return salesOrderDigit;
    }

    public void setSalesOrderDigit(Integer salesOrderDigit) {
        this.salesOrderDigit = salesOrderDigit;
    }

    public String getMatPoPrefix() {
        return matPoPrefix;
    }

    public void setMatPoPrefix(String matPoPrefix) {
        this.matPoPrefix = matPoPrefix;
    }

    public String getMatPoSuffix() {
        return matPoSuffix;
    }

    public void setMatPoSuffix(String matPoSuffix) {
        this.matPoSuffix = matPoSuffix;
    }

    public Integer getMatPoDigit() {
        return matPoDigit;
    }

    public void setMatPoDigit(Integer matPoDigit) {
        this.matPoDigit = matPoDigit;
    }

    public String getGateEntryPrefix() {
        return gateEntryPrefix;
    }

    public void setGateEntryPrefix(String gateEntryPrefix) {
        this.gateEntryPrefix = gateEntryPrefix;
    }

    public String getGateEntrySuffix() {
        return gateEntrySuffix;
    }

    public void setGateEntrySuffix(String gateEntrySuffix) {
        this.gateEntrySuffix = gateEntrySuffix;
    }

    public Integer getGateEntryDigit() {
        return gateEntryDigit;
    }

    public void setGateEntryDigit(Integer gateEntryDigit) {
        this.gateEntryDigit = gateEntryDigit;
    }

    public String getGrnPrefix() {
        return grnPrefix;
    }

    public void setGrnPrefix(String grnPrefix) {
        this.grnPrefix = grnPrefix;
    }

    public String getGrnSuffix() {
        return grnSuffix;
    }

    public void setGrnSuffix(String grnSuffix) {
        this.grnSuffix = grnSuffix;
    }

    public Integer getGrnDigit() {
        return grnDigit;
    }

    public void setGrnDigit(Integer grnDigit) {
        this.grnDigit = grnDigit;
    }

    public String getInvoicePrefix() {
        return invoicePrefix;
    }

    public void setInvoicePrefix(String invoicePrefix) {
        this.invoicePrefix = invoicePrefix;
    }

    public String getInvoiceSuffix() {
        return invoiceSuffix;
    }

    public void setInvoiceSuffix(String invoiceSuffix) {
        this.invoiceSuffix = invoiceSuffix;
    }

    public Integer getInvoiceDigit() {
        return invoiceDigit;
    }

    public void setInvoiceDigit(Integer invoiceDigit) {
        this.invoiceDigit = invoiceDigit;
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

    public String getTaskPrefix() {
        return taskPrefix;
    }

    public void setTaskPrefix(String taskPrefix) {
        this.taskPrefix = taskPrefix;
    }

    public String getTaskSuffix() {
        return taskSuffix;
    }

    public void setTaskSuffix(String taskSuffix) {
        this.taskSuffix = taskSuffix;
    }

    public Integer getTaskDigit() {
        return taskDigit;
    }

    public void setTaskDigit(Integer taskDigit) {
        this.taskDigit = taskDigit;
    }

    public String getNcrPrefix() {
        return ncrPrefix;
    }

    public void setNcrPrefix(String ncrPrefix) {
        this.ncrPrefix = ncrPrefix;
    }

    public String getNcrSuffix() {
        return ncrSuffix;
    }

    public void setNcrSuffix(String ncrSuffix) {
        this.ncrSuffix = ncrSuffix;
    }

    public Integer getNcrDigit() {
        return ncrDigit;
    }

    public void setNcrDigit(Integer ncrDigit) {
        this.ncrDigit = ncrDigit;
    }

    public String getOfiPrefix() {
        return ofiPrefix;
    }

    public void setOfiPrefix(String ofiPrefix) {
        this.ofiPrefix = ofiPrefix;
    }

    public String getOfiSuffix() {
        return ofiSuffix;
    }

    public void setOfiSuffix(String ofiSuffix) {
        this.ofiSuffix = ofiSuffix;
    }

    public Integer getOfiDigit() {
        return ofiDigit;
    }

    public void setOfiDigit(Integer ofiDigit) {
        this.ofiDigit = ofiDigit;
    }

    public String getObservationPrefix() {
        return observationPrefix;
    }

    public void setObservationPrefix(String observationPrefix) {
        this.observationPrefix = observationPrefix;
    }

    public Integer getObservationDigit() {
        return observationDigit;
    }

    public void setObservationDigit(Integer observationDigit) {
        this.observationDigit = observationDigit;
    }

    public String getVisitorGatePassPrefix() {
        return visitorGatePassPrefix;
    }

    public void setVisitorGatePassPrefix(String visitorGatePassPrefix) {
        this.visitorGatePassPrefix = visitorGatePassPrefix;
    }

    public String getVisitorGatePassSuffix() {
        return visitorGatePassSuffix;
    }

    public void setVisitorGatePassSuffix(String visitorGatePassSuffix) {
        this.visitorGatePassSuffix = visitorGatePassSuffix;
    }

    public Integer getVisitorGatePassDigit() {
        return visitorGatePassDigit;
    }

    public void setVisitorGatePassDigit(Integer visitorGatePassDigit) {
        this.visitorGatePassDigit = visitorGatePassDigit;
    }

    public String getMemoPrefix() {
        return memoPrefix;
    }

    public void setMemoPrefix(String memoPrefix) {
        this.memoPrefix = memoPrefix;
    }

    public String getMemoSuffix() {
        return memoSuffix;
    }

    public void setMemoSuffix(String memoSuffix) {
        this.memoSuffix = memoSuffix;
    }

    public Integer getMemoDigit() {
        return memoDigit;
    }

    public void setMemoDigit(Integer memoDigit) {
        this.memoDigit = memoDigit;
    }

    public String getAuditSchedulePrefix() {
        return auditSchedulePrefix;
    }

    public void setAuditSchedulePrefix(String auditSchedulePrefix) {
        this.auditSchedulePrefix = auditSchedulePrefix;
    }

    public String getAuditScheduleSuffix() {
        return auditScheduleSuffix;
    }

    public void setAuditScheduleSuffix(String auditScheduleSuffix) {
        this.auditScheduleSuffix = auditScheduleSuffix;
    }

    public Integer getAuditScheduleDigit() {
        return auditScheduleDigit;
    }

    public void setAuditScheduleDigit(Integer auditScheduleDigit) {
        this.auditScheduleDigit = auditScheduleDigit;
    }

    public String getAuditObservationPrefix() {
        return auditObservationPrefix;
    }

    public void setAuditObservationPrefix(String auditObservationPrefix) {
        this.auditObservationPrefix = auditObservationPrefix;
    }

    public String getAuditObservationSuffix() {
        return auditObservationSuffix;
    }

    public void setAuditObservationSuffix(String auditObservationSuffix) {
        this.auditObservationSuffix = auditObservationSuffix;
    }

    public Integer getAuditObservationDigit() {
        return auditObservationDigit;
    }

    public void setAuditObservationDigit(Integer auditObservationDigit) {
        this.auditObservationDigit = auditObservationDigit;
    }

    public String getProductBundlePrefix() {
        return productBundlePrefix;
    }

    public void setProductBundlePrefix(String productBundlePrefix) {
        this.productBundlePrefix = productBundlePrefix;
    }

    public String getProductBundleSuffix() {
        return productBundleSuffix;
    }

    public void setProductBundleSuffix(String productBundleSuffix) {
        this.productBundleSuffix = productBundleSuffix;
    }

    public Integer getProductBundleDigit() {
        return productBundleDigit;
    }

    public void setProductBundleDigit(Integer productBundleDigit) {
        this.productBundleDigit = productBundleDigit;
    }

    public String getGplPrefix() {
        return gplPrefix;
    }

    public void setGplPrefix(String gplPrefix) {
        this.gplPrefix = gplPrefix;
    }

    public String getCpcPrefix() {
        return cpcPrefix;
    }

    public void setCpcPrefix(String cpcPrefix) {
        this.cpcPrefix = cpcPrefix;
    }

    public Integer getPriceListDigit() {
        return priceListDigit;
    }

    public void setPriceListDigit(Integer priceListDigit) {
        this.priceListDigit = priceListDigit;
    }

    public String getPrPrefix() {
        return prPrefix;
    }

    public void setPrPrefix(String prPrefix) {
        this.prPrefix = prPrefix;
    }

    public String getPrSuffix() {
        return prSuffix;
    }

    public void setPrSuffix(String prSuffix) {
        this.prSuffix = prSuffix;
    }

    public Integer getPrDigit() {
        return prDigit;
    }

    public void setPrDigit(Integer prDigit) {
        this.prDigit = prDigit;
    }

    public String getRfqPrefix() {
        return rfqPrefix;
    }

    public void setRfqPrefix(String rfqPrefix) {
        this.rfqPrefix = rfqPrefix;
    }

    public String getRfqSuffix() {
        return rfqSuffix;
    }

    public void setRfqSuffix(String rfqSuffix) {
        this.rfqSuffix = rfqSuffix;
    }

    public Integer getRfqDigit() {
        return rfqDigit;
    }

    public void setRfqDigit(Integer rfqDigit) {
        this.rfqDigit = rfqDigit;
    }

    public String getQuotationPrefix() {
        return quotationPrefix;
    }

    public void setQuotationPrefix(String quotationPrefix) {
        this.quotationPrefix = quotationPrefix;
    }

    public String getQuotationSuffix() {
        return quotationSuffix;
    }

    public void setQuotationSuffix(String quotationSuffix) {
        this.quotationSuffix = quotationSuffix;
    }

    public Integer getQuotationDigit() {
        return quotationDigit;
    }

    public void setQuotationDigit(Integer quotationDigit) {
        this.quotationDigit = quotationDigit;
    }

    public String getNegotiationPrefix() {
        return negotiationPrefix;
    }

    public void setNegotiationPrefix(String negotiationPrefix) {
        this.negotiationPrefix = negotiationPrefix;
    }

    public String getNegotiationSuffix() {
        return negotiationSuffix;
    }

    public void setNegotiationSuffix(String negotiationSuffix) {
        this.negotiationSuffix = negotiationSuffix;
    }

    public Integer getNegotiationDigit() {
        return negotiationDigit;
    }

    public void setNegotiationDigit(Integer negotiationDigit) {
        this.negotiationDigit = negotiationDigit;
    }

    public String getAtsPrefix() {
        return atsPrefix;
    }

    public void setAtsPrefix(String atsPrefix) {
        this.atsPrefix = atsPrefix;
    }

    public String getAtsSuffix() {
        return atsSuffix;
    }

    public void setAtsSuffix(String atsSuffix) {
        this.atsSuffix = atsSuffix;
    }

    public Integer getAtsDigit() {
        return atsDigit;
    }

    public void setAtsDigit(Integer atsDigit) {
        this.atsDigit = atsDigit;
    }

    public String getOfferLetterPrefix() {
        return offerLetterPrefix;
    }

    public void setOfferLetterPrefix(String offerLetterPrefix) {
        this.offerLetterPrefix = offerLetterPrefix;
    }

    public String getOfferLetterSuffix() {
        return offerLetterSuffix;
    }

    public void setOfferLetterSuffix(String offerLetterSuffix) {
        this.offerLetterSuffix = offerLetterSuffix;
    }

    public Integer getOfferLetterDigit() {
        return offerLetterDigit;
    }

    public void setOfferLetterDigit(Integer offerLetterDigit) {
        this.offerLetterDigit = offerLetterDigit;
    }

    public String getDcPrefix() {
        return dcPrefix;
    }

    public void setDcPrefix(String dcPrefix) {
        this.dcPrefix = dcPrefix;
    }

    public String getDcSuffix() {
        return dcSuffix;
    }

    public void setDcSuffix(String dcSuffix) {
        this.dcSuffix = dcSuffix;
    }

    public Integer getDcDigit() {
        return dcDigit;
    }

    public void setDcDigit(Integer dcDigit) {
        this.dcDigit = dcDigit;
    }
}

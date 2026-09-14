package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
public class QuotationHeadDTO {
    private Long id;
    private String quotationNo;
    private Long rfqRefId;
    private String rfqNo;
    private Long supplierId;
    private String supplierName;
    private Date quotationDate;
    private Date validityDate;
    private String currency;
    private Integer leadTimeDays;
    private String warrantyTerms;
    private String paymentTerms;
    private String deliveryTerms;
    private String remarks;
    private String transportScope;
    private String supplierReferenceNo;
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private Date supplierReferenceDate;
    private Long technicalStatusId;
    private String technicalStatusName;
    private Long statusId;
    private String statusName;
    private Long divisionId;

    private java.math.BigDecimal subtotal;
    private java.math.BigDecimal discountAmount;
    private java.math.BigDecimal taxAmount;
    private java.math.BigDecimal freight;
    private java.math.BigDecimal packing;
    private java.math.BigDecimal insurance;
    private java.math.BigDecimal otherCharges;
    private java.math.BigDecimal grandTotal;

    private SupplierInsightsDTO supplierInsights;

    private List<QuotationDetailDTO> details;
    private List<QuotationAttachmentDTO> attachments;
    private List<QuotationChargeDTO> additionalCharges;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuotationNo() { return quotationNo; }
    public void setQuotationNo(String quotationNo) { this.quotationNo = quotationNo; }
    public Long getRfqRefId() { return rfqRefId; }
    public void setRfqRefId(Long rfqRefId) { this.rfqRefId = rfqRefId; }
    public String getRfqNo() { return rfqNo; }
    public void setRfqNo(String rfqNo) { this.rfqNo = rfqNo; }
    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
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
    public String getTransportScope() { return transportScope; }
    public void setTransportScope(String transportScope) { this.transportScope = transportScope; }
    public String getSupplierReferenceNo() { return supplierReferenceNo; }
    public void setSupplierReferenceNo(String supplierReferenceNo) { this.supplierReferenceNo = supplierReferenceNo; }
    public Date getSupplierReferenceDate() { return supplierReferenceDate; }
    public void setSupplierReferenceDate(Date supplierReferenceDate) { this.supplierReferenceDate = supplierReferenceDate; }
    public Long getTechnicalStatusId() { return technicalStatusId; }
    public void setTechnicalStatusId(Long technicalStatusId) { this.technicalStatusId = technicalStatusId; }
    public String getTechnicalStatusName() { return technicalStatusName; }
    public void setTechnicalStatusName(String technicalStatusName) { this.technicalStatusName = technicalStatusName; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String statusName) { this.statusName = statusName; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public List<QuotationDetailDTO> getDetails() { return details; }
    public void setDetails(List<QuotationDetailDTO> details) { this.details = details; }
    public List<QuotationAttachmentDTO> getAttachments() { return attachments; }
    public void setAttachments(List<QuotationAttachmentDTO> attachments) { this.attachments = attachments; }
    public List<QuotationChargeDTO> getAdditionalCharges() { return additionalCharges; }
    public void setAdditionalCharges(List<QuotationChargeDTO> additionalCharges) { this.additionalCharges = additionalCharges; }

    public java.math.BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(java.math.BigDecimal subtotal) { this.subtotal = subtotal; }
    public java.math.BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(java.math.BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public java.math.BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(java.math.BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public java.math.BigDecimal getFreight() { return freight; }
    public void setFreight(java.math.BigDecimal freight) { this.freight = freight; }
    public java.math.BigDecimal getPacking() { return packing; }
    public void setPacking(java.math.BigDecimal packing) { this.packing = packing; }
    public java.math.BigDecimal getInsurance() { return insurance; }
    public void setInsurance(java.math.BigDecimal insurance) { this.insurance = insurance; }
    public java.math.BigDecimal getOtherCharges() { return otherCharges; }
    public void setOtherCharges(java.math.BigDecimal otherCharges) { this.otherCharges = otherCharges; }
    public java.math.BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(java.math.BigDecimal grandTotal) { this.grandTotal = grandTotal; }
    public SupplierInsightsDTO getSupplierInsights() { return supplierInsights; }
    public void setSupplierInsights(SupplierInsightsDTO supplierInsights) { this.supplierInsights = supplierInsights; }
}

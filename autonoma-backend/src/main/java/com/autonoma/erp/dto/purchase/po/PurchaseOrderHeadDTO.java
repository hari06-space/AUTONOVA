package com.autonoma.erp.dto.purchase.po;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Data
public class PurchaseOrderHeadDTO {
    private Long id;
    private String poNo;
    private Date poDate;
    private Integer revisionNo;
    private Long originalPoId;

    // Supplier
    private Long supplierId;
    private String supplierName;

    // Source
    private String sourceType;
    private String sourceDocumentNo;
    private String poType;
    private Date expectedDeliveryDate;

    // People & Org
    private Long buyerId;
    private String buyerName;
    private Long departmentId;
    private String departmentName;
    private Long divisionId;
    private String gstType;

    // Address
    private String billingAddress;
    private String deliveryAddress;

    // Commercial
    private String currency;
    private BigDecimal exchangeRate;
    private String paymentTerms;
    private String deliveryTerms;
    private String shippingTerms;
    private String warrantyTerms;
    private String transportScope;

    // Financials
    private BigDecimal subtotal;
    private BigDecimal freightAmount;
    private BigDecimal packingAmount;
    private BigDecimal insuranceAmount;
    private BigDecimal otherCharges;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal roundOff;
    private BigDecimal grandTotal;

    // Status
    private Long statusId;
    private String statusName;

    // Misc
    private String remarks;
    private String internalNotes;
    private String supplierReferenceNo;
    private Date supplierReferenceDate;

    // Collections
    private List<PurchaseOrderTransDTO> items;
    private List<PurchaseOrderSourceDTO> sources;
    private List<PurchaseOrderChargeDTO> additionalCharges = new ArrayList<>();
    private List<PurchaseOrderLogDTO> auditLog;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPoNo() { return poNo; }
    public void setPoNo(String poNo) { this.poNo = poNo; }
    public Date getPoDate() { return poDate; }
    public void setPoDate(Date poDate) { this.poDate = poDate; }
    public Integer getRevisionNo() { return revisionNo; }
    public void setRevisionNo(Integer revisionNo) { this.revisionNo = revisionNo; }
    public Long getOriginalPoId() { return originalPoId; }
    public void setOriginalPoId(Long originalPoId) { this.originalPoId = originalPoId; }
    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public String getSourceDocumentNo() { return sourceDocumentNo; }
    public void setSourceDocumentNo(String sourceDocumentNo) { this.sourceDocumentNo = sourceDocumentNo; }
    public String getPoType() { return poType; }
    public void setPoType(String poType) { this.poType = poType; }
    public Date getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(Date expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public String getGstType() { return gstType; }
    public void setGstType(String gstType) { this.gstType = gstType; }
    public String getBillingAddress() { return billingAddress; }
    public void setBillingAddress(String billingAddress) { this.billingAddress = billingAddress; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }
    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
    public String getDeliveryTerms() { return deliveryTerms; }
    public void setDeliveryTerms(String deliveryTerms) { this.deliveryTerms = deliveryTerms; }
    public String getShippingTerms() { return shippingTerms; }
    public void setShippingTerms(String shippingTerms) { this.shippingTerms = shippingTerms; }
    public String getWarrantyTerms() { return warrantyTerms; }
    public void setWarrantyTerms(String warrantyTerms) { this.warrantyTerms = warrantyTerms; }
    public String getTransportScope() { return transportScope; }
    public void setTransportScope(String transportScope) { this.transportScope = transportScope; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getFreightAmount() { return freightAmount; }
    public void setFreightAmount(BigDecimal freightAmount) { this.freightAmount = freightAmount; }
    public BigDecimal getPackingAmount() { return packingAmount; }
    public void setPackingAmount(BigDecimal packingAmount) { this.packingAmount = packingAmount; }
    public BigDecimal getInsuranceAmount() { return insuranceAmount; }
    public void setInsuranceAmount(BigDecimal insuranceAmount) { this.insuranceAmount = insuranceAmount; }
    public BigDecimal getOtherCharges() { return otherCharges; }
    public void setOtherCharges(BigDecimal otherCharges) { this.otherCharges = otherCharges; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getCgstAmount() { return cgstAmount; }
    public void setCgstAmount(BigDecimal cgstAmount) { this.cgstAmount = cgstAmount; }
    public BigDecimal getSgstAmount() { return sgstAmount; }
    public void setSgstAmount(BigDecimal sgstAmount) { this.sgstAmount = sgstAmount; }
    public BigDecimal getIgstAmount() { return igstAmount; }
    public void setIgstAmount(BigDecimal igstAmount) { this.igstAmount = igstAmount; }
    public BigDecimal getRoundOff() { return roundOff; }
    public void setRoundOff(BigDecimal roundOff) { this.roundOff = roundOff; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String statusName) { this.statusName = statusName; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getInternalNotes() { return internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }
    public String getSupplierReferenceNo() { return supplierReferenceNo; }
    public void setSupplierReferenceNo(String supplierReferenceNo) { this.supplierReferenceNo = supplierReferenceNo; }
    public Date getSupplierReferenceDate() { return supplierReferenceDate; }
    public void setSupplierReferenceDate(Date supplierReferenceDate) { this.supplierReferenceDate = supplierReferenceDate; }
    public List<PurchaseOrderTransDTO> getItems() { return items; }
    public void setItems(List<PurchaseOrderTransDTO> items) { this.items = items; }
    public List<PurchaseOrderSourceDTO> getSources() { return sources; }
    public void setSources(List<PurchaseOrderSourceDTO> sources) { this.sources = sources; }
    public List<PurchaseOrderChargeDTO> getAdditionalCharges() { return additionalCharges; }
    public void setAdditionalCharges(List<PurchaseOrderChargeDTO> additionalCharges) { this.additionalCharges = additionalCharges; }
    public List<PurchaseOrderLogDTO> getAuditLog() { return auditLog; }
    public void setAuditLog(List<PurchaseOrderLogDTO> auditLog) { this.auditLog = auditLog; }
}

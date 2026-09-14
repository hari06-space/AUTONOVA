package com.autonoma.erp.model;

import com.autonoma.erp.enums.PoSourceType;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "PP_PURCHASE_ORDER_HEAD")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderHead extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "PO_NO", nullable = false, length = 50)
    private String poNo;

    @Column(name = "PO_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date poDate;

    @Column(name = "REVISION_NO", nullable = false)
    private Integer revisionNo = 0;

    @Column(name = "ORIGINAL_PO_ID")
    private Long originalPoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", nullable = false)
    private AccountLedger supplier;

    @Enumerated(EnumType.STRING)
    @Column(name = "SOURCE_TYPE", nullable = false, length = 50)
    private PoSourceType sourceType;

    @Column(name = "BUYER_ID")
    private Long buyerId;

    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    @Column(name = "GST_TYPE", nullable = false, length = 20)
    private String gstType = "INTRA_STATE";

    @Column(name = "BILLING_ADDRESS", length = 500)
    private String billingAddress;

    @Column(name = "DELIVERY_ADDRESS", length = 500)
    private String deliveryAddress;

    @Column(name = "CURRENCY", nullable = false, length = 10)
    private String currency = "INR";

    @Column(name = "EXCHANGE_RATE", nullable = false, precision = 18, scale = 6)
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Column(name = "PAYMENT_TERMS", length = 500)
    private String paymentTerms;

    @Column(name = "DELIVERY_TERMS", length = 500)
    private String deliveryTerms;

    @Column(name = "SHIPPING_TERMS", length = 200)
    private String shippingTerms;

    @Column(name = "WARRANTY_TERMS", length = 500)
    private String warrantyTerms;

    @Column(name = "SUBTOTAL", nullable = false, precision = 18, scale = 4)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "FREIGHT_AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal freightAmount = BigDecimal.ZERO;

    @Column(name = "PACKING_AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal packingAmount = BigDecimal.ZERO;

    @Column(name = "INSURANCE_AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal insuranceAmount = BigDecimal.ZERO;

    @Column(name = "OTHER_CHARGES", nullable = false, precision = 18, scale = 4)
    private BigDecimal otherCharges = BigDecimal.ZERO;

    @Column(name = "DISCOUNT_AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "TAX_AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "ROUND_OFF", nullable = false, precision = 18, scale = 4)
    private BigDecimal roundOff = BigDecimal.ZERO;

    @Column(name = "GRAND_TOTAL", nullable = false, precision = 18, scale = 4)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS_ID", nullable = false)
    private StatusMaster status;

    @Column(name = "REMARKS", length = 1000)
    private String remarks;

    @Column(name = "INTERNAL_NOTES", length = 1000)
    private String internalNotes;

    @Column(name = "SUPPLIER_REFERENCE_NO", length = 100)
    private String supplierReferenceNo;

    @Column(name = "SUPPLIER_REFERENCE_DATE")
    @Temporal(TemporalType.DATE)
    private Date supplierReferenceDate;

    @Column(name = "PO_TYPE", length = 50)
    private String poType = "ONETIME";

    @Column(name = "EXPECTED_DELIVERY_DATE")
    @Temporal(TemporalType.DATE)
    private Date expectedDeliveryDate;

    @Column(name = "TRANSPORT_SCOPE", length = 50)
    private String transportScope;

    @Column(name = "CGST_AMOUNT", precision = 18, scale = 4)
    private BigDecimal cgstAmount = BigDecimal.ZERO;

    @Column(name = "SGST_AMOUNT", precision = 18, scale = 4)
    private BigDecimal sgstAmount = BigDecimal.ZERO;

    @Column(name = "IGST_AMOUNT", precision = 18, scale = 4)
    private BigDecimal igstAmount = BigDecimal.ZERO;

    @Column(name = "APPROVAL_VERSION")
    private Integer approvalVersion;

    @Column(name = "APPROVAL_SEQUENCE")
    private Integer approvalSequence;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;

    @OneToMany(mappedBy = "purchaseOrderHead", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"purchaseOrderHead"})
    private List<PurchaseOrderTrans> items;

    @OneToMany(mappedBy = "purchaseOrderHead", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"purchaseOrderHead"})
    private List<PurchaseOrderSource> sources;

    @OneToMany(mappedBy = "purchaseOrderHead", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"purchaseOrderHead"})
    private List<PurchaseOrderCharge> additionalCharges;

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
    public AccountLedger getSupplier() { return supplier; }
    public void setSupplier(AccountLedger supplier) { this.supplier = supplier; }
    public PoSourceType getSourceType() { return sourceType; }
    public void setSourceType(PoSourceType sourceType) { this.sourceType = sourceType; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
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
    public BigDecimal getRoundOff() { return roundOff; }
    public void setRoundOff(BigDecimal roundOff) { this.roundOff = roundOff; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
    public StatusMaster getStatus() { return status; }
    public void setStatus(StatusMaster status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getInternalNotes() { return internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }
    public String getSupplierReferenceNo() { return supplierReferenceNo; }
    public void setSupplierReferenceNo(String supplierReferenceNo) { this.supplierReferenceNo = supplierReferenceNo; }
    public Date getSupplierReferenceDate() { return supplierReferenceDate; }
    public void setSupplierReferenceDate(Date supplierReferenceDate) { this.supplierReferenceDate = supplierReferenceDate; }
    public String getPoType() { return poType; }
    public void setPoType(String poType) { this.poType = poType; }
    public Date getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(Date expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }
    public String getTransportScope() { return transportScope; }
    public void setTransportScope(String transportScope) { this.transportScope = transportScope; }
    public BigDecimal getCgstAmount() { return cgstAmount; }
    public void setCgstAmount(BigDecimal cgstAmount) { this.cgstAmount = cgstAmount; }
    public BigDecimal getSgstAmount() { return sgstAmount; }
    public void setSgstAmount(BigDecimal sgstAmount) { this.sgstAmount = sgstAmount; }
    public BigDecimal getIgstAmount() { return igstAmount; }
    public void setIgstAmount(BigDecimal igstAmount) { this.igstAmount = igstAmount; }
    public Integer getApprovalVersion() { return approvalVersion; }
    public void setApprovalVersion(Integer approvalVersion) { this.approvalVersion = approvalVersion; }
    public Integer getApprovalSequence() { return approvalSequence; }
    public void setApprovalSequence(Integer approvalSequence) { this.approvalSequence = approvalSequence; }
    public Integer getActiveStatus() { return activeStatus; }
    public void setActiveStatus(Integer activeStatus) { this.activeStatus = activeStatus; }
    public List<PurchaseOrderTrans> getItems() { return items; }
    public void setItems(List<PurchaseOrderTrans> items) { this.items = items; }
    public List<PurchaseOrderSource> getSources() { return sources; }
    public void setSources(List<PurchaseOrderSource> sources) { this.sources = sources; }
    public List<PurchaseOrderCharge> getAdditionalCharges() { return additionalCharges; }
    public void setAdditionalCharges(List<PurchaseOrderCharge> additionalCharges) { this.additionalCharges = additionalCharges; }
}

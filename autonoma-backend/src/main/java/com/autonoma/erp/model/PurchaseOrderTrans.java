package com.autonoma.erp.model;

import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "PP_PURCHASE_ORDER_TRANS")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderTrans extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_HEAD_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private PurchaseOrderHead purchaseOrderHead;

    @Column(name = "LINE_NO")
    private Integer lineNo = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", nullable = false)
    private ProductMaster item;

    @Column(name = "DESCRIPTION", length = 500)
    private String description;

    @Column(name = "HSN_CODE", length = 20)
    private String hsnCode;

    @Column(name = "UOM", nullable = false, length = 20)
    private String uom;

    @Column(name = "BRAND", length = 100)
    private String brand;

    @Column(name = "ORIGIN", length = 100)
    private String origin;

    @Column(name = "QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal qty;

    @Column(name = "UNIT_PRICE", nullable = false, precision = 18, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "DISCOUNT_PERCENT", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Column(name = "TAX_PERCENT", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxPercent = BigDecimal.ZERO;

    @Column(name = "CGST_PERCENT", nullable = false, precision = 5, scale = 2)
    private BigDecimal cgstPer = BigDecimal.ZERO;

    @Column(name = "SGST_PERCENT", nullable = false, precision = 5, scale = 2)
    private BigDecimal sgstPer = BigDecimal.ZERO;

    @Column(name = "IGST_PERCENT", nullable = false, precision = 5, scale = 2)
    private BigDecimal igstPer = BigDecimal.ZERO;

    @Column(name = "CGST_AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal cgstValue = BigDecimal.ZERO;

    @Column(name = "SGST_AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal sgstValue = BigDecimal.ZERO;

    @Column(name = "IGST_AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal igstValue = BigDecimal.ZERO;

    @Column(name = "TAX_AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "NET_AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal netAmount = BigDecimal.ZERO;

    // GRN / Invoice readiness
    @Column(name = "PENDING_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal pendingQty = BigDecimal.ZERO;

    @Column(name = "RECEIVED_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal receivedQty = BigDecimal.ZERO;

    @Column(name = "REJECTED_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal rejectedQty = BigDecimal.ZERO;

    @Column(name = "RETURNED_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal returnedQty = BigDecimal.ZERO;

    @Column(name = "INVOICED_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal invoicedQty = BigDecimal.ZERO;

    @Column(name = "EXPECTED_DELIVERY_DATE")
    @Temporal(TemporalType.DATE)
    private Date expectedDeliveryDate;

    @Column(name = "DUE_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date dueDate;

    @Column(name = "WAREHOUSE", length = 100)
    private String warehouse;

    @Column(name = "PROJECT", length = 100)
    private String project;

    @Column(name = "COST_CENTER", length = 100)
    private String costCenter;

    @Column(name = "REMARKS", length = 500)
    private String remarks;

    @Column(name = "WARRANTY_TERMS", length = 250)
    private String warrantyTerms;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PurchaseOrderHead getPurchaseOrderHead() { return purchaseOrderHead; }
    public void setPurchaseOrderHead(PurchaseOrderHead purchaseOrderHead) { this.purchaseOrderHead = purchaseOrderHead; }
    public Integer getLineNo() { return lineNo; }
    public void setLineNo(Integer lineNo) { this.lineNo = lineNo; }
    public ProductMaster getItem() { return item; }
    public void setItem(ProductMaster item) { this.item = item; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public BigDecimal getQty() { return qty; }
    public void setQty(BigDecimal qty) { this.qty = qty; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }
    public BigDecimal getTaxPercent() { return taxPercent; }
    public void setTaxPercent(BigDecimal taxPercent) { this.taxPercent = taxPercent; }
    public BigDecimal getCgstPer() { return cgstPer; }
    public void setCgstPer(BigDecimal cgstPer) { this.cgstPer = cgstPer; }
    public BigDecimal getSgstPer() { return sgstPer; }
    public void setSgstPer(BigDecimal sgstPer) { this.sgstPer = sgstPer; }
    public BigDecimal getIgstPer() { return igstPer; }
    public void setIgstPer(BigDecimal igstPer) { this.igstPer = igstPer; }
    public BigDecimal getCgstValue() { return cgstValue; }
    public void setCgstValue(BigDecimal cgstValue) { this.cgstValue = cgstValue; }
    public BigDecimal getSgstValue() { return sgstValue; }
    public void setSgstValue(BigDecimal sgstValue) { this.sgstValue = sgstValue; }
    public BigDecimal getIgstValue() { return igstValue; }
    public void setIgstValue(BigDecimal igstValue) { this.igstValue = igstValue; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }
    public BigDecimal getPendingQty() { return pendingQty; }
    public void setPendingQty(BigDecimal pendingQty) { this.pendingQty = pendingQty; }
    public BigDecimal getReceivedQty() { return receivedQty; }
    public void setReceivedQty(BigDecimal receivedQty) { this.receivedQty = receivedQty; }
    public BigDecimal getRejectedQty() { return rejectedQty; }
    public void setRejectedQty(BigDecimal rejectedQty) { this.rejectedQty = rejectedQty; }
    public BigDecimal getReturnedQty() { return returnedQty; }
    public void setReturnedQty(BigDecimal returnedQty) { this.returnedQty = returnedQty; }
    public BigDecimal getInvoicedQty() { return invoicedQty; }
    public void setInvoicedQty(BigDecimal invoicedQty) { this.invoicedQty = invoicedQty; }
    public Date getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(Date expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }
    public Date getDueDate() { return dueDate; }
    public void setDueDate(Date dueDate) { this.dueDate = dueDate; }
    public String getWarehouse() { return warehouse; }
    public void setWarehouse(String warehouse) { this.warehouse = warehouse; }
    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }
    public String getCostCenter() { return costCenter; }
    public void setCostCenter(String costCenter) { this.costCenter = costCenter; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getWarrantyTerms() { return warrantyTerms; }
    public void setWarrantyTerms(String warrantyTerms) { this.warrantyTerms = warrantyTerms; }
    public Integer getActiveStatus() { return activeStatus; }
    public void setActiveStatus(Integer activeStatus) { this.activeStatus = activeStatus; }
}

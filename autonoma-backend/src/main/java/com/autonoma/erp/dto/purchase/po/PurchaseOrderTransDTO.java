package com.autonoma.erp.dto.purchase.po;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;

@Data
public class PurchaseOrderTransDTO {
    private Long id;
    private Integer lineNo;
    private Long itemId;
    private String itemName;
    private String itemCode;
    private String description;
    private String hsnCode;
    private String uom;
    private String brand;
    private String origin;
    private BigDecimal qty;
    private BigDecimal unitPrice;
    private BigDecimal discountPercent;
    private BigDecimal taxPercent;
    private BigDecimal cgstPer;
    private BigDecimal sgstPer;
    private BigDecimal igstPer;
    private BigDecimal cgstValue;
    private BigDecimal sgstValue;
    private BigDecimal igstValue;
    private BigDecimal taxAmount;
    private BigDecimal netAmount;
    private BigDecimal pendingQty;
    private BigDecimal receivedQty;
    private BigDecimal rejectedQty;
    private BigDecimal returnedQty;
    private BigDecimal invoicedQty;
    private Date expectedDeliveryDate;
    private Date dueDate;
    private String warehouse;
    private String project;
    private String costCenter;
    private String remarks;
    private String warrantyTerms;
    // Source traceability
    private Long sourceTransId;
    private String sourceDocumentNo;
    private Integer sourceLineNo;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getLineNo() { return lineNo; }
    public void setLineNo(Integer lineNo) { this.lineNo = lineNo; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }
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
    public Long getSourceTransId() { return sourceTransId; }
    public void setSourceTransId(Long sourceTransId) { this.sourceTransId = sourceTransId; }
    public String getSourceDocumentNo() { return sourceDocumentNo; }
    public void setSourceDocumentNo(String sourceDocumentNo) { this.sourceDocumentNo = sourceDocumentNo; }
    public Integer getSourceLineNo() { return sourceLineNo; }
    public void setSourceLineNo(Integer sourceLineNo) { this.sourceLineNo = sourceLineNo; }
}

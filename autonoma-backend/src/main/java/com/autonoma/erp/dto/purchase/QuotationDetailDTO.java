package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class QuotationDetailDTO {
    private Long id;
    private Long quotationRefId;
    private Long rfqDetailId;
    private Long itemId;
    private String itemName;
    private String itemCode;
    private String hsnCode;
    private String uom;
    private BigDecimal qty;
    private BigDecimal unitPrice;
    private BigDecimal discountPercent;
    private BigDecimal cgstPer;
    private BigDecimal sgstPer;
    private BigDecimal igstPer;
    private BigDecimal cgstValue;
    private BigDecimal sgstValue;
    private BigDecimal igstValue;
    private BigDecimal freightAmount;
    private BigDecimal totalAmount;
    private String remarks;
    private java.util.Date deliveryDate;
    private String warrantyTerms;

    private BigDecimal lastPurchasePrice;
    private BigDecimal lowestMarketPrice;
    private BigDecimal availableStock;
    private BigDecimal pendingPrQty;
    private BigDecimal pendingPoQty;
    private BigDecimal margin;
    private Integer deliveryDays;
    private String brand;
    private String manufacturer;
    private String countryOfOrigin;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getQuotationRefId() { return quotationRefId; }
    public void setQuotationRefId(Long quotationRefId) { this.quotationRefId = quotationRefId; }
    public Long getRfqDetailId() { return rfqDetailId; }
    public void setRfqDetailId(Long rfqDetailId) { this.rfqDetailId = rfqDetailId; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getQty() { return qty; }
    public void setQty(BigDecimal qty) { this.qty = qty; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }
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
    public BigDecimal getFreightAmount() { return freightAmount; }
    public void setFreightAmount(BigDecimal freightAmount) { this.freightAmount = freightAmount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public java.util.Date getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(java.util.Date deliveryDate) { this.deliveryDate = deliveryDate; }
    public String getWarrantyTerms() { return warrantyTerms; }
    public void setWarrantyTerms(String warrantyTerms) { this.warrantyTerms = warrantyTerms; }

    public BigDecimal getLastPurchasePrice() { return lastPurchasePrice; }
    public void setLastPurchasePrice(BigDecimal lastPurchasePrice) { this.lastPurchasePrice = lastPurchasePrice; }
    public BigDecimal getLowestMarketPrice() { return lowestMarketPrice; }
    public void setLowestMarketPrice(BigDecimal lowestMarketPrice) { this.lowestMarketPrice = lowestMarketPrice; }
    public BigDecimal getAvailableStock() { return availableStock; }
    public void setAvailableStock(BigDecimal availableStock) { this.availableStock = availableStock; }
    public BigDecimal getPendingPrQty() { return pendingPrQty; }
    public void setPendingPrQty(BigDecimal pendingPrQty) { this.pendingPrQty = pendingPrQty; }
    public BigDecimal getPendingPoQty() { return pendingPoQty; }
    public void setPendingPoQty(BigDecimal pendingPoQty) { this.pendingPoQty = pendingPoQty; }
    public BigDecimal getMargin() { return margin; }
    public void setMargin(BigDecimal margin) { this.margin = margin; }
    public Integer getDeliveryDays() { return deliveryDays; }
    public void setDeliveryDays(Integer deliveryDays) { this.deliveryDays = deliveryDays; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    public String getCountryOfOrigin() { return countryOfOrigin; }
    public void setCountryOfOrigin(String countryOfOrigin) { this.countryOfOrigin = countryOfOrigin; }
}

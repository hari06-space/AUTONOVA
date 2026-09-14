package com.autonoma.erp.dto.purchase.comparison;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class QuoteComparisonMatrixDTO {
    private Long id;
    private Long rfqItemId;
    private String itemName;
    private Long supplierId;
    private String supplierName;
    private BigDecimal originalPrice;
    private BigDecimal negotiatedPrice;
    private BigDecimal discount;
    private BigDecimal tax;
    private BigDecimal freight;
    private BigDecimal packing;
    private Integer deliveryDays;
    private String warranty;
    private String paymentTerms;
    private String brand;
    private String origin;
    private String currency;
    private BigDecimal exchangeRate;
    private String transportScope;
    
    // Header level charges and references
    private String quotationNo;
    private String supplierReferenceNo;
    private BigDecimal headTaxAmount;
    private BigDecimal headFreight;
    
    // Additional fields for displaying totals
    private BigDecimal qty;
    private String uom;
    private BigDecimal totalAmount;
    
    // Additional fields for evaluation
    private Boolean isNegotiated;
    private BigDecimal technicalScore;
    private BigDecimal commercialScore;
    
    // Negotiation metadata
    private java.util.Date negotiationDate;
    private String negotiationRemarks;
    
    // Additional metrics for insights (Historical and geographical)
    private Integer distance;
    private BigDecimal pastDeliveryPerformance;
    private BigDecimal pastQualityPerformance;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRfqItemId() { return rfqItemId; }
    public void setRfqItemId(Long rfqItemId) { this.rfqItemId = rfqItemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public BigDecimal getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(BigDecimal originalPrice) { this.originalPrice = originalPrice; }
    public BigDecimal getNegotiatedPrice() { return negotiatedPrice; }
    public void setNegotiatedPrice(BigDecimal negotiatedPrice) { this.negotiatedPrice = negotiatedPrice; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }
    public BigDecimal getTax() { return tax; }
    public void setTax(BigDecimal tax) { this.tax = tax; }
    public BigDecimal getFreight() { return freight; }
    public void setFreight(BigDecimal freight) { this.freight = freight; }
    public BigDecimal getPacking() { return packing; }
    public void setPacking(BigDecimal packing) { this.packing = packing; }
    public Integer getDeliveryDays() { return deliveryDays; }
    public void setDeliveryDays(Integer deliveryDays) { this.deliveryDays = deliveryDays; }
    public String getWarranty() { return warranty; }
    public void setWarranty(String warranty) { this.warranty = warranty; }
    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }
    public String getTransportScope() { return transportScope; }
    public void setTransportScope(String transportScope) { this.transportScope = transportScope; }
    public String getQuotationNo() { return quotationNo; }
    public void setQuotationNo(String quotationNo) { this.quotationNo = quotationNo; }
    public String getSupplierReferenceNo() { return supplierReferenceNo; }
    public void setSupplierReferenceNo(String supplierReferenceNo) { this.supplierReferenceNo = supplierReferenceNo; }
    public BigDecimal getHeadTaxAmount() { return headTaxAmount; }
    public void setHeadTaxAmount(BigDecimal headTaxAmount) { this.headTaxAmount = headTaxAmount; }
    public BigDecimal getHeadFreight() { return headFreight; }
    public void setHeadFreight(BigDecimal headFreight) { this.headFreight = headFreight; }
    public BigDecimal getQty() { return qty; }
    public void setQty(BigDecimal qty) { this.qty = qty; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public Boolean getIsNegotiated() { return isNegotiated; }
    public void setIsNegotiated(Boolean isNegotiated) { this.isNegotiated = isNegotiated; }
    public BigDecimal getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(BigDecimal technicalScore) { this.technicalScore = technicalScore; }
    public BigDecimal getCommercialScore() { return commercialScore; }
    public void setCommercialScore(BigDecimal commercialScore) { this.commercialScore = commercialScore; }
    public java.util.Date getNegotiationDate() { return negotiationDate; }
    public void setNegotiationDate(java.util.Date negotiationDate) { this.negotiationDate = negotiationDate; }
    public String getNegotiationRemarks() { return negotiationRemarks; }
    public void setNegotiationRemarks(String negotiationRemarks) { this.negotiationRemarks = negotiationRemarks; }
    public Integer getDistance() { return distance; }
    public void setDistance(Integer distance) { this.distance = distance; }
    public BigDecimal getPastDeliveryPerformance() { return pastDeliveryPerformance; }
    public void setPastDeliveryPerformance(BigDecimal pastDeliveryPerformance) { this.pastDeliveryPerformance = pastDeliveryPerformance; }
    public BigDecimal getPastQualityPerformance() { return pastQualityPerformance; }
    public void setPastQualityPerformance(BigDecimal pastQualityPerformance) { this.pastQualityPerformance = pastQualityPerformance; }
}

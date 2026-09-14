package com.autonoma.erp.modules.sm.sales.dto;

import lombok.Data;

@Data
public class SalesPriceMasterDetailDTO {
    private Long id;
    private Long productId;
    private String productCode;
    private String productName;
    private String uom;
    private Double basePrice;
    private Double minPrice;
    private Double maxPrice;
    private Double contractPrice;
    private Double targetQty;
    private String currency;
    private String remarks;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public Double getBasePrice() { return basePrice; }
    public void setBasePrice(Double basePrice) { this.basePrice = basePrice; }
    public Double getMinPrice() { return minPrice; }
    public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }
    public Double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }
    public Double getContractPrice() { return contractPrice; }
    public void setContractPrice(Double contractPrice) { this.contractPrice = contractPrice; }
    public Double getTargetQty() { return targetQty; }
    public void setTargetQty(Double targetQty) { this.targetQty = targetQty; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

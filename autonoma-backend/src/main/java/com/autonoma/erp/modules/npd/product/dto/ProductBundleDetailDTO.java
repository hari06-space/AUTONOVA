package com.autonoma.erp.modules.npd.product.dto;

import lombok.Data;

@Data
public class ProductBundleDetailDTO {
    private Long id;
    private Long productId;
    private String productCode;
    private String productName;
    private String uom;
    private Double qty;
    private Double normalRate;
    private Double bundleRate;
    private Double discountPercent;
    private Double discountAmount;
    private Boolean isActive;

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
    public Double getQty() { return qty; }
    public void setQty(Double qty) { this.qty = qty; }
    public Double getNormalRate() { return normalRate; }
    public void setNormalRate(Double normalRate) { this.normalRate = normalRate; }
    public Double getBundleRate() { return bundleRate; }
    public void setBundleRate(Double bundleRate) { this.bundleRate = bundleRate; }
    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; }
    public Double getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(Double discountAmount) { this.discountAmount = discountAmount; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

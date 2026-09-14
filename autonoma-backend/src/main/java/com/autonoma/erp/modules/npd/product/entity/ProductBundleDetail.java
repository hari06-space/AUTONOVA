package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "NPD_PRODUCT_BUNDLE_DETAIL")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"bundleMaster", "product"})
@ToString(exclude = {"bundleMaster", "product"})
@NoArgsConstructor
public class ProductBundleDetail extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BUNDLE_ID", nullable = false)
    @JsonBackReference
    private ProductBundleMaster bundleMaster;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "PRODUCT_ID", nullable = false)
    private ProductMaster product;

    @Column(name = "QTY", nullable = false)
    private Double qty;

    @Column(name = "NORMAL_RATE")
    private Double normalRate;

    @Column(name = "BUNDLE_RATE")
    private Double bundleRate;

    @Column(name = "DISCOUNT_PERCENT")
    private Double discountPercent;

    @Column(name = "DISCOUNT_AMOUNT")
    private Double discountAmount;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (isActive == null) isActive = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ProductBundleMaster getBundleMaster() { return bundleMaster; }
    public void setBundleMaster(ProductBundleMaster bundleMaster) { this.bundleMaster = bundleMaster; }
    public ProductMaster getProduct() { return product; }
    public void setProduct(ProductMaster product) { this.product = product; }
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

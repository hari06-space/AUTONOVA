package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.model.admin.UserCredential;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Date;

import lombok.ToString;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "SALES_PRICE_LIST_TRANS")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesPriceMasterDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRICE_MASTER_ID", nullable = false)
    @JsonIgnore
    private SalesPriceMaster priceMaster;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRODUCT_ID", nullable = false)
    private ProductMaster product;

    @Column(name = "BASE_PRICE")
    private Double basePrice;

    @Column(name = "MIN_PRICE")
    private Double minPrice;

    @Column(name = "MAX_PRICE")
    private Double maxPrice;

    @Column(name = "CONTRACT_PRICE")
    private Double contractPrice;

    @Column(name = "TARGET_QTY")
    private Double targetQty;

    @Column(name = "CURRENCY", length = 10)
    private String currency = "INR";

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @Column(name = "STATUS", nullable = false, length = 50)
    private String status = "ACTIVE";

    @Column(name = "CREATED_BY", length = 50, nullable = false, updatable = false)
    private String createdBy;

    @Column(name = "CREATED_DATE", nullable = false, updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public SalesPriceMaster getPriceMaster() { return priceMaster; }
    public void setPriceMaster(SalesPriceMaster priceMaster) { this.priceMaster = priceMaster; }
    public ProductMaster getProduct() { return product; }
    public void setProduct(ProductMaster product) { this.product = product; }
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
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}

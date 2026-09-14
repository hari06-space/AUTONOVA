package com.autonoma.erp.modules.inventory.transaction.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ITEM_TRANSACTION")
@EntityListeners(AuditingEntityListener.class)
public class ItemTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "TRANS_CATEGORY", nullable = false, length = 10)
    private String transCategory;

    @Column(name = "INVENTORY_TYPE", nullable = false, length = 50)
    private String inventoryType;

    @Column(name = "PRODUCT_ID", nullable = false)
    private Long productId;

    @Column(name = "TRANS_DATE", nullable = false)
    private LocalDate transDate;

    @Column(name = "TRANS_NO", nullable = false, length = 50)
    private String transNo;

    @Column(name = "TRANS_TYPE", nullable = false, length = 50)
    private String transType;

    @Column(name = "REFERENCE_NO", length = 50)
    private String referenceNo;

    @Column(name = "QTY_IN", precision = 18, scale = 3)
    private BigDecimal qtyIn;

    @Column(name = "QTY_OUT", precision = 18, scale = 3)
    private BigDecimal qtyOut;

    @Column(name = "PRICE", precision = 18, scale = 2)
    private BigDecimal price;

    @Column(name = "UOM", length = 10)
    private String uom;

    @Column(name = "IS_REJECTION")
    private Boolean isRejection = false;

    @Column(name = "BATCH_ID", length = 50)
    private String batchId;

    @Column(name = "VENDOR_ID")
    private Long vendorId;

    @Column(name = "REMARKS", length = 200)
    private String remarks;

    @Column(name = "STATUS", length = 20)
    private String status;

    @Column(name = "ACTIVE_STATUS", length = 20)
    private String activeStatus;
    @Column(name = "DIVISION_ID", nullable = false)
    private Long divisionId;

    @CreatedBy
    @Column(name = "CREATED_BY", length = 50, updatable = false)
    private String createdBy;

    @CreatedDate
    @Column(name = "CREATED_DATE", updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedBy
    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @LastModifiedDate
    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;

    @PrePersist
    protected void onCreate() {
        if (qtyIn == null)
            qtyIn = BigDecimal.ZERO;
        if (qtyOut == null)
            qtyOut = BigDecimal.ZERO;
        if (price == null)
            price = BigDecimal.ZERO;
        if (createdDate == null)
            createdDate = LocalDateTime.now();
        if (createdBy == null)
            createdBy = "SYSTEM";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedDate = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getQtyIn() { return qtyIn; }
    public void setQtyIn(BigDecimal qtyIn) { this.qtyIn = qtyIn; }
    public BigDecimal getQtyOut() { return qtyOut; }
    public void setQtyOut(BigDecimal qtyOut) { this.qtyOut = qtyOut; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getTransType() { return transType; }
    public void setTransType(String transType) { this.transType = transType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public String getTransCategory() { return transCategory; }
    public void setTransCategory(String transCategory) { this.transCategory = transCategory; }
    public String getTransNo() { return transNo; }
    public void setTransNo(String transNo) { this.transNo = transNo; }
    public LocalDate getTransDate() { return transDate; }
    public void setTransDate(LocalDate transDate) { this.transDate = transDate; }
    public String getReferenceNo() { return referenceNo; }
    public void setReferenceNo(String referenceNo) { this.referenceNo = referenceNo; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}

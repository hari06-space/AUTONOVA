package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "SM_CUSTOMER_ORDER_DETAIL")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmCustomerOrderDetail extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ORDER_REF_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonBackReference
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private SmCustomerOrderHeader orderHeader;

    @Column(name = "PART_NO", length = 50)
    private String partNo;

    @Column(name = "PART_NAME", length = 100)
    private String partName;

    @Column(name = "QUOTATION_NO", length = 50)
    private String quotationNo;

    @Column(name = "HSN_CODE", length = 50)
    private String hsnCode;

    @Column(name = "UOM", length = 20)
    private String uom;

    @Column(name = "STOCK", precision = 12, scale = 2)
    private BigDecimal stock;

    @Column(name = "QTY")
    private Integer qty;

    @Column(name = "PRICE", precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "ORDER_PRICE", precision = 12, scale = 2)
    private BigDecimal orderPrice;

    @Column(name = "ORDER_WEIGHT", precision = 12, scale = 2)
    private BigDecimal orderWeight;

    @Column(name = "DISCOUNT_PER", precision = 12, scale = 2)
    private BigDecimal discountPer;

    @Column(name = "CGST_PER", precision = 12, scale = 2)
    private BigDecimal cgstPer;

    @Column(name = "SGST_PER", precision = 12, scale = 2)
    private BigDecimal sgstPer;

    @Column(name = "IGST_PER", precision = 12, scale = 2)
    private BigDecimal igstPer;

    @Column(name = "FREIGHT_PER", precision = 12, scale = 2)
    private BigDecimal freightPer;

    @Column(name = "APPROVAL_STATUS")
    private Boolean approvalStatus;

    @Column(name = "STATUS")
    private Boolean status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public SmCustomerOrderHeader getOrderHeader() { return orderHeader; }
    public void setOrderHeader(SmCustomerOrderHeader orderHeader) { this.orderHeader = orderHeader; }
    public String getPartNo() { return partNo; }
    public void setPartNo(String partNo) { this.partNo = partNo; }
    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }
    public String getQuotationNo() { return quotationNo; }
    public void setQuotationNo(String quotationNo) { this.quotationNo = quotationNo; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public BigDecimal getStock() { return stock; }
    public void setStock(BigDecimal stock) { this.stock = stock; }
    public Integer getQty() { return qty; }
    public void setQty(Integer qty) { this.qty = qty; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getOrderPrice() { return orderPrice; }
    public void setOrderPrice(BigDecimal orderPrice) { this.orderPrice = orderPrice; }
    public BigDecimal getOrderWeight() { return orderWeight; }
    public void setOrderWeight(BigDecimal orderWeight) { this.orderWeight = orderWeight; }
    public BigDecimal getDiscountPer() { return discountPer; }
    public void setDiscountPer(BigDecimal discountPer) { this.discountPer = discountPer; }
    public BigDecimal getCgstPer() { return cgstPer; }
    public void setCgstPer(BigDecimal cgstPer) { this.cgstPer = cgstPer; }
    public BigDecimal getSgstPer() { return sgstPer; }
    public void setSgstPer(BigDecimal sgstPer) { this.sgstPer = sgstPer; }
    public BigDecimal getIgstPer() { return igstPer; }
    public void setIgstPer(BigDecimal igstPer) { this.igstPer = igstPer; }
    public BigDecimal getFreightPer() { return freightPer; }
    public void setFreightPer(BigDecimal freightPer) { this.freightPer = freightPer; }
    public Boolean getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(Boolean approvalStatus) { this.approvalStatus = approvalStatus; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}

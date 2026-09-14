package com.autonoma.erp.model;

import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "PP_QUOTATION_DETAIL")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class QuotationDetail extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUOTATION_REF_ID", nullable = false)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private QuotationHead quotationHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RFQ_DETAIL_ID", nullable = false)
    private RfqDetail rfqDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", nullable = false)
    private ProductMaster item;

    @Column(name = "UOM", length = 20, nullable = false)
    private String uom;

    @Column(name = "QTY", nullable = false, precision = 12, scale = 4)
    private BigDecimal qty = BigDecimal.ZERO;

    @Column(name = "UNIT_PRICE", nullable = false, precision = 12, scale = 4)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "DISCOUNT_PERCENT", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Column(name = "CGST_PERCENT", nullable = false, precision = 5, scale = 2)
    private BigDecimal cgstPer = BigDecimal.ZERO;

    @Column(name = "SGST_PERCENT", nullable = false, precision = 5, scale = 2)
    private BigDecimal sgstPer = BigDecimal.ZERO;

    @Column(name = "IGST_PERCENT", nullable = false, precision = 5, scale = 2)
    private BigDecimal igstPer = BigDecimal.ZERO;

    @Column(name = "CGST_AMOUNT", nullable = false, precision = 12, scale = 4)
    private BigDecimal cgstValue = BigDecimal.ZERO;

    @Column(name = "SGST_AMOUNT", nullable = false, precision = 12, scale = 4)
    private BigDecimal sgstValue = BigDecimal.ZERO;

    @Column(name = "IGST_AMOUNT", nullable = false, precision = 12, scale = 4)
    private BigDecimal igstValue = BigDecimal.ZERO;

    @Column(name = "FREIGHT_AMOUNT", nullable = false, precision = 12, scale = 4)
    private BigDecimal freightAmount = BigDecimal.ZERO;

    @Column(name = "TOTAL_AMOUNT", nullable = false, precision = 12, scale = 4)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "REMARKS", length = 250)
    private String remarks;

    @Column(name = "DELIVERY_DATE")
    @Temporal(TemporalType.DATE)
    private java.util.Date deliveryDate;

    @Column(name = "WARRANTY_TERMS", length = 250)
    private String warrantyTerms;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public QuotationHead getQuotationHead() { return quotationHead; }
    public void setQuotationHead(QuotationHead quotationHead) { this.quotationHead = quotationHead; }
    public RfqDetail getRfqDetail() { return rfqDetail; }
    public void setRfqDetail(RfqDetail rfqDetail) { this.rfqDetail = rfqDetail; }
    public ProductMaster getItem() { return item; }
    public void setItem(ProductMaster item) { this.item = item; }
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
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
}

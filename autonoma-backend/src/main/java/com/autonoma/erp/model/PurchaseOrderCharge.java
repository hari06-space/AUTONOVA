package com.autonoma.erp.model;

import com.autonoma.erp.modules.sm.sales.entity.SmAdditionalCharges;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "PP_PURCHASE_ORDER_CHARGE")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PurchaseOrderCharge extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_ID")
    @com.fasterxml.jackson.annotation.JsonIgnore
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private PurchaseOrderHead purchaseOrderHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CHARGE_ID")
    private SmAdditionalCharges chargeMaster;

    @Column(name = "AMOUNT", precision = 18, scale = 4)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "TAX_APPLICABLE")
    private Boolean taxApplicable = false;

    @Column(name = "CGST_PER", precision = 18, scale = 2)
    private BigDecimal cgstPer = BigDecimal.ZERO;

    @Column(name = "CGST_VALUE", precision = 18, scale = 2)
    private BigDecimal cgstValue = BigDecimal.ZERO;

    @Column(name = "SGST_PER", precision = 18, scale = 2)
    private BigDecimal sgstPer = BigDecimal.ZERO;

    @Column(name = "SGST_VALUE", precision = 18, scale = 2)
    private BigDecimal sgstValue = BigDecimal.ZERO;

    @Column(name = "IGST_PER", precision = 18, scale = 2)
    private BigDecimal igstPer = BigDecimal.ZERO;

    @Column(name = "IGST_VALUE", precision = 18, scale = 2)
    private BigDecimal igstValue = BigDecimal.ZERO;

    @Column(name = "TOTAL_VALUE", precision = 18, scale = 4)
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Column(name = "ACTIVE_STATUS")
    private Integer activeStatus = 1;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PurchaseOrderHead getPurchaseOrderHead() { return purchaseOrderHead; }
    public void setPurchaseOrderHead(PurchaseOrderHead purchaseOrderHead) { this.purchaseOrderHead = purchaseOrderHead; }
    public SmAdditionalCharges getChargeMaster() { return chargeMaster; }
    public void setChargeMaster(SmAdditionalCharges chargeMaster) { this.chargeMaster = chargeMaster; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Boolean getTaxApplicable() { return taxApplicable; }
    public void setTaxApplicable(Boolean taxApplicable) { this.taxApplicable = taxApplicable; }
    public BigDecimal getCgstPer() { return cgstPer; }
    public void setCgstPer(BigDecimal cgstPer) { this.cgstPer = cgstPer; }
    public BigDecimal getCgstValue() { return cgstValue; }
    public void setCgstValue(BigDecimal cgstValue) { this.cgstValue = cgstValue; }
    public BigDecimal getSgstPer() { return sgstPer; }
    public void setSgstPer(BigDecimal sgstPer) { this.sgstPer = sgstPer; }
    public BigDecimal getSgstValue() { return sgstValue; }
    public void setSgstValue(BigDecimal sgstValue) { this.sgstValue = sgstValue; }
    public BigDecimal getIgstPer() { return igstPer; }
    public void setIgstPer(BigDecimal igstPer) { this.igstPer = igstPer; }
    public BigDecimal getIgstValue() { return igstValue; }
    public void setIgstValue(BigDecimal igstValue) { this.igstValue = igstValue; }
    public BigDecimal getTotalValue() { return totalValue; }
    public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }
    public Integer getActiveStatus() { return activeStatus; }
    public void setActiveStatus(Integer activeStatus) { this.activeStatus = activeStatus; }
}

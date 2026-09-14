package com.autonoma.erp.dto.purchase.po;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PurchaseOrderChargeDTO {
    private Long id;
    private Long chargesId;
    private String chargeName;
    private BigDecimal amount;
    private Boolean taxApplicable;
    private BigDecimal cgstPer;
    private BigDecimal cgstValue;
    private BigDecimal sgstPer;
    private BigDecimal sgstValue;
    private BigDecimal igstPer;
    private BigDecimal igstValue;
    private BigDecimal totalValue;
    private Integer activeStatus;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getChargesId() { return chargesId; }
    public void setChargesId(Long chargesId) { this.chargesId = chargesId; }
    public String getChargeName() { return chargeName; }
    public void setChargeName(String chargeName) { this.chargeName = chargeName; }
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

package com.autonoma.erp.modules.sm.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmCustomerOrderChargeDto {
    private Long id;
    private Long chargeId;
    private String chargeName;
    private String calculationType;
    private BigDecimal amount;
    private Boolean taxAvailable;
    private BigDecimal cgstPer;
    private BigDecimal cgstVal;
    private BigDecimal sgstPer;
    private BigDecimal sgstVal;
    private BigDecimal igstPer;
    private BigDecimal igstVal;
    private BigDecimal totalValue;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getChargeId() { return chargeId; }
    public void setChargeId(Long chargeId) { this.chargeId = chargeId; }
    public String getChargeName() { return chargeName; }
    public void setChargeName(String chargeName) { this.chargeName = chargeName; }
    public String getCalculationType() { return calculationType; }
    public void setCalculationType(String calculationType) { this.calculationType = calculationType; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Boolean getTaxAvailable() { return taxAvailable; }
    public void setTaxAvailable(Boolean taxAvailable) { this.taxAvailable = taxAvailable; }
    public BigDecimal getCgstPer() { return cgstPer; }
    public void setCgstPer(BigDecimal cgstPer) { this.cgstPer = cgstPer; }
    public BigDecimal getCgstVal() { return cgstVal; }
    public void setCgstVal(BigDecimal cgstVal) { this.cgstVal = cgstVal; }
    public BigDecimal getSgstPer() { return sgstPer; }
    public void setSgstPer(BigDecimal sgstPer) { this.sgstPer = sgstPer; }
    public BigDecimal getSgstVal() { return sgstVal; }
    public void setSgstVal(BigDecimal sgstVal) { this.sgstVal = sgstVal; }
    public BigDecimal getIgstPer() { return igstPer; }
    public void setIgstPer(BigDecimal igstPer) { this.igstPer = igstPer; }
    public BigDecimal getIgstVal() { return igstVal; }
    public void setIgstVal(BigDecimal igstVal) { this.igstVal = igstVal; }
    public BigDecimal getTotalValue() { return totalValue; }
    public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

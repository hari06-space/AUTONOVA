package com.autonoma.erp.model.payroll;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "HR_PAYROLL_PROCESS_TRANS")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollProcessTrans {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "MASTER_ID", nullable = false)
    private Long masterId;

    @Column(name = "COMPONENT_ID")
    private Long componentId;

    @Column(name = "COMPONENT_CODE", nullable = false, length = 50)
    private String componentCode;

    @Column(name = "COMPONENT_NAME", nullable = false, length = 150)
    private String componentName;

    @Column(name = "COMPONENT_TYPE", nullable = false, length = 50)
    private String componentType;

    @Column(name = "ACTUAL_AMOUNT", nullable = false, precision = 18, scale = 2)
    private BigDecimal actualAmount;

    @Column(name = "PROCESS_AMOUNT", nullable = false, precision = 18, scale = 2)
    private BigDecimal processAmount;

    @Column(name = "FORMULA", length = 1000)
    private String formula;

    @Column(name = "CALC_TYPE", length = 50)
    private String calcType;

    @Column(name = "CALCULATION_BASIS", length = 100)
    private String calculationBasis;

    @Column(name = "CALCULATION_SEQUENCE")
    private Integer calculationSequence;

    @Column(name = "PERCENTAGE", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "RATE", precision = 18, scale = 2)
    private BigDecimal rate;

    @Column(name = "MANUAL_OVERRIDE", nullable = false)
    @Builder.Default
    private Boolean manualOverride = false;

    @Column(name = "CALCULATION_LOG")
    private String calculationLog;

    @Column(name = "FORMULA_VERSION", length = 20)
    private String formulaVersion;

    @Column(name = "CALCULATION_TIMESTAMP", nullable = false)
    @Builder.Default
    private java.util.Date calculationTimestamp = new java.util.Date();

    public Long getRowId() { return rowId; }
    public void setRowId(Long rowId) { this.rowId = rowId; }
    public Long getMasterId() { return masterId; }
    public void setMasterId(Long masterId) { this.masterId = masterId; }
    public Long getComponentId() { return componentId; }
    public void setComponentId(Long componentId) { this.componentId = componentId; }
    public String getComponentCode() { return componentCode; }
    public void setComponentCode(String componentCode) { this.componentCode = componentCode; }
    public String getComponentName() { return componentName; }
    public void setComponentName(String componentName) { this.componentName = componentName; }
    public String getComponentType() { return componentType; }
    public void setComponentType(String componentType) { this.componentType = componentType; }
    public BigDecimal getActualAmount() { return actualAmount; }
    public void setActualAmount(BigDecimal actualAmount) { this.actualAmount = actualAmount; }
    public BigDecimal getProcessAmount() { return processAmount; }
    public void setProcessAmount(BigDecimal processAmount) { this.processAmount = processAmount; }
    public String getFormula() { return formula; }
    public void setFormula(String formula) { this.formula = formula; }
    public String getCalcType() { return calcType; }
    public void setCalcType(String calcType) { this.calcType = calcType; }
    public String getCalculationBasis() { return calculationBasis; }
    public void setCalculationBasis(String calculationBasis) { this.calculationBasis = calculationBasis; }
    public Integer getCalculationSequence() { return calculationSequence; }
    public void setCalculationSequence(Integer calculationSequence) { this.calculationSequence = calculationSequence; }
    public BigDecimal getPercentage() { return percentage; }
    public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public Boolean getManualOverride() { return manualOverride; }
    public void setManualOverride(Boolean manualOverride) { this.manualOverride = manualOverride; }
    public String getCalculationLog() { return calculationLog; }
    public void setCalculationLog(String calculationLog) { this.calculationLog = calculationLog; }
    public String getFormulaVersion() { return formulaVersion; }
    public void setFormulaVersion(String formulaVersion) { this.formulaVersion = formulaVersion; }
    public java.util.Date getCalculationTimestamp() { return calculationTimestamp; }
    public void setCalculationTimestamp(java.util.Date calculationTimestamp) { this.calculationTimestamp = calculationTimestamp; }
}

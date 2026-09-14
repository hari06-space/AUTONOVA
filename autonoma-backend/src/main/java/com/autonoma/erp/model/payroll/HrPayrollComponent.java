package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "HR_PAYROLL_COMPONENT")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollComponent extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "COMPONENT_CODE", unique = true, nullable = false, length = 50)
    private String componentCode;

    @Column(name = "COMPONENT_NAME", nullable = false, length = 150)
    private String componentName;

    @Column(name = "COMPONENT_TYPE", nullable = false, length = 50)
    private String componentType; // EARNING, DEDUCTION, EMPLOYER_CONTRIBUTION, REIMBURSEMENT

    @Column(name = "CATEGORY", length = 50)
    private String category; // FIXED, VARIABLE

    @Column(name = "SEQUENCE_NO")
    private Integer sequenceNo;

    @Builder.Default
    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "IS_LOP_APPLICABLE")
    private Boolean isLopApplicable = false;

    @Builder.Default
    @Column(name = "SHOW_IN_PAYSLIP")
    private Boolean showInPayslip = true;

    @Builder.Default
    @Column(name = "SHOW_IN_REGISTER")
    private Boolean showInRegister = true;

    @Column(name = "EFFECTIVE_FROM")
    @Temporal(TemporalType.DATE)
    private Date effectiveFrom;

    @Builder.Default
    @Column(name = "VERSION")
    private Integer version = 1;

    @Column(name = "CALCULATION_TYPE", nullable = false, length = 50)
    private String calculationType; // FIXED, PERCENTAGE, FORMULA, MANUAL

    @Column(name = "CALCULATION_VALUE", precision = 18, scale = 2)
    private BigDecimal calculationValue;

    @Column(name = "FORMULA_EXPRESSION", length = 1000)
    private String formulaExpression;

    public Long getRowId() {
        return rowId;
    }

    public void setRowId(Long rowId) {
        this.rowId = rowId;
    }

    public String getComponentCode() {
        return componentCode;
    }

    public void setComponentCode(String componentCode) {
        this.componentCode = componentCode;
    }

    public String getComponentName() {
        return componentName;
    }

    public void setComponentName(String componentName) {
        this.componentName = componentName;
    }

    public String getComponentType() {
        return componentType;
    }

    public void setComponentType(String componentType) {
        this.componentType = componentType;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getSequenceNo() {
        return sequenceNo;
    }

    public void setSequenceNo(Integer sequenceNo) {
        this.sequenceNo = sequenceNo;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsLopApplicable() {
        return isLopApplicable;
    }

    public void setIsLopApplicable(Boolean isLopApplicable) {
        this.isLopApplicable = isLopApplicable;
    }

    public Boolean getShowInPayslip() {
        return showInPayslip;
    }

    public void setShowInPayslip(Boolean showInPayslip) {
        this.showInPayslip = showInPayslip;
    }

    public Boolean getShowInRegister() {
        return showInRegister;
    }

    public void setShowInRegister(Boolean showInRegister) {
        this.showInRegister = showInRegister;
    }

    public Date getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(Date effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public String getCalculationType() {
        return calculationType;
    }

    public void setCalculationType(String calculationType) {
        this.calculationType = calculationType;
    }

    public BigDecimal getCalculationValue() {
        return calculationValue;
    }

    public void setCalculationValue(BigDecimal calculationValue) {
        this.calculationValue = calculationValue;
    }

    public String getFormulaExpression() {
        return formulaExpression;
    }

    public void setFormulaExpression(String formulaExpression) {
        this.formulaExpression = formulaExpression;
    }

    @Transient
    private BigDecimal amount;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}

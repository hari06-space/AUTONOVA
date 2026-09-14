package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "HR_PAYROLL_STRUCTURE_DETAIL")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollStructureDetail extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "STRUCTURE_ID", nullable = false)
    private Long structureId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "COMPONENT_ID", nullable = false)
    private HrPayrollComponent component;

    @Column(name = "CALCULATION_TYPE", nullable = false, length = 50)
    private String calculationType; // FIXED, PERCENTAGE, FORMULA, MANUAL

    @Column(name = "CALCULATION_VALUE", precision = 18, scale = 2)
    private BigDecimal calculationValue;

    @Column(name = "FORMULA_EXPRESSION", length = 1000)
    private String formulaExpression;

    public HrPayrollComponent getComponent() { return component; }
    public String getCalculationType() { return calculationType; }
    public BigDecimal getCalculationValue() { return calculationValue; }
    public String getFormulaExpression() { return formulaExpression; }
    public void setStructureId(Long structureId) { this.structureId = structureId; }
    public void setComponent(HrPayrollComponent component) { this.component = component; }
    public void setCalculationType(String calculationType) { this.calculationType = calculationType; }
    public void setCalculationValue(BigDecimal calculationValue) { this.calculationValue = calculationValue; }
    public void setFormulaExpression(String formulaExpression) { this.formulaExpression = formulaExpression; }
}

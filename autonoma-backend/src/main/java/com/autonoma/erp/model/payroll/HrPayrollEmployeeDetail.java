package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "HR_PAYROLL_EMPLOYEE_DETAIL")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollEmployeeDetail extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "PAYROLL_RUN_ID", nullable = false)
    private Long payrollRunId;

    @Column(name = "EMP_ID")
    private Long empId;

    @Column(name = "COMPONENT_CODE", nullable = false, length = 50)
    private String componentCode;

    @Column(name = "COMPONENT_NAME", nullable = false, length = 150)
    private String componentName;

    @Column(name = "COMPONENT_TYPE", nullable = false, length = 50)
    private String componentType;

    @Column(name = "CALCULATED_AMOUNT", precision = 18, scale = 2)
    private BigDecimal calculatedAmount;

    @Column(name = "ORIGINAL_AMOUNT", precision = 18, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "FORMULA_EXPRESSION", length = 1000)
    private String formulaExpression;

    public String getComponentCode() { return componentCode; }
    public BigDecimal getCalculatedAmount() { return calculatedAmount; }
    public String getComponentType() { return componentType; }
    public String getComponentName() { return componentName; }
    public Long getRowId() { return rowId; }
    public Long getPayrollRunId() { return payrollRunId; }
    public Long getEmpId() { return empId; }
    public BigDecimal getOriginalAmount() { return originalAmount; }
    public String getFormulaExpression() { return formulaExpression; }
    public void setPayrollRunId(Long payrollRunId) { this.payrollRunId = payrollRunId; }
    public void setEmpId(Long empId) { this.empId = empId; }
    public void setComponentCode(String componentCode) { this.componentCode = componentCode; }
    public void setComponentName(String componentName) { this.componentName = componentName; }
    public void setComponentType(String componentType) { this.componentType = componentType; }
    public void setCalculatedAmount(BigDecimal calculatedAmount) { this.calculatedAmount = calculatedAmount; }
    public void setOriginalAmount(BigDecimal originalAmount) { this.originalAmount = originalAmount; }
    public void setFormulaExpression(String formulaExpression) { this.formulaExpression = formulaExpression; }
}

package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "HR_PAYROLL_COMPONENT_DEPENDENCY")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollComponentDependency extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "COMPONENT_CODE", nullable = false, length = 50)
    private String componentCode;

    @Column(name = "DEPENDS_ON_COMPONENT_CODE", nullable = false, length = 50)
    private String dependsOnComponentCode;

    public String getComponentCode() { return componentCode; }
    public void setComponentCode(String componentCode) { this.componentCode = componentCode; }
    public String getDependsOnComponentCode() { return dependsOnComponentCode; }
    public void setDependsOnComponentCode(String dependsOnComponentCode) { this.dependsOnComponentCode = dependsOnComponentCode; }
}

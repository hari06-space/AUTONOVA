package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "HR_PAYROLL_STRUCTURE")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollStructure extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    public Long getRowId() { return rowId; }

    @Column(name = "STRUCTURE_CODE", unique = true, nullable = false, length = 50)
    private String structureCode;

    @Column(name = "STRUCTURE_NAME", nullable = false, length = 150)
    private String structureName;

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "EFFECTIVE_FROM")
    @Temporal(TemporalType.DATE)
    private Date effectiveFrom;

    @Builder.Default
    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Column(name = "EMPLOYEE_TYPE_ID")
    private Long employeeTypeId;

    public Boolean getIsActive() { return isActive; }
    public Long getEmployeeTypeId() { return employeeTypeId; }
    public void setRowId(Long rowId) { this.rowId = rowId; }
    public void setStructureCode(String structureCode) { this.structureCode = structureCode; }
    public void setStructureName(String structureName) { this.structureName = structureName; }
    public void setDescription(String description) { this.description = description; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public void setEffectiveFrom(Date effectiveFrom) { this.effectiveFrom = effectiveFrom; }
    public void setEmployeeTypeId(Long employeeTypeId) { this.employeeTypeId = employeeTypeId; }
}

package com.autonoma.erp.model.payroll;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "HR_PAYROLL_STRUCTURE_ASSIGNMENT")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HrPayrollStructureAssignment extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "STRUCTURE_ID", nullable = false)
    private Long structureId;

    @Column(name = "ASSIGNMENT_TYPE", nullable = false, length = 50)
    private String assignmentType; // EMPLOYEE, GRADE, ALL

    @Column(name = "ASSIGN_TO_VALUE", nullable = false, length = 100)
    private String assignToValue; // employee code or grade code

    @Column(name = "EFFECTIVE_FROM")
    @Temporal(TemporalType.DATE)
    private Date effectiveFrom;

    public void setEffectiveFrom(Date effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    @Builder.Default
    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public Long getStructureId() { return structureId; }
}

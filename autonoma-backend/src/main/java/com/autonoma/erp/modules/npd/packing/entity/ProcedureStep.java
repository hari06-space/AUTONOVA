package com.autonoma.erp.modules.npd.packing.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "NPD_PROCEDURE_STEPS")
@Getter
@Setter
@NoArgsConstructor
public class ProcedureStep extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROCEDURE_HEADER_ID", nullable = false)
    private PackingProcedureHeader procedureHeader;

    @Column(name = "STEP_NO", nullable = false)
    private Integer stepNo;

    @Column(name = "SPENDING_MINUTES", nullable = false)
    private Integer spendingMinutes;

    @Column(name = "REQUIRED_ITEMS", columnDefinition = "NVARCHAR(MAX)")
    private String requiredItems;

    @Column(name = "PROCEDURE_DESCRIPTION", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String procedureDescription;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PackingProcedureHeader getProcedureHeader() { return procedureHeader; }
    public void setProcedureHeader(PackingProcedureHeader procedureHeader) { this.procedureHeader = procedureHeader; }
    public Integer getStepNo() { return stepNo; }
    public void setStepNo(Integer stepNo) { this.stepNo = stepNo; }
    public Integer getSpendingMinutes() { return spendingMinutes; }
    public void setSpendingMinutes(Integer spendingMinutes) { this.spendingMinutes = spendingMinutes; }
    public String getRequiredItems() { return requiredItems; }
    public void setRequiredItems(String requiredItems) { this.requiredItems = requiredItems; }
    public String getProcedureDescription() { return procedureDescription; }
    public void setProcedureDescription(String procedureDescription) { this.procedureDescription = procedureDescription; }
}

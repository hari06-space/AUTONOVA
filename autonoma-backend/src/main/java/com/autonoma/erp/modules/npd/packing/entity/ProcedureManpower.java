package com.autonoma.erp.modules.npd.packing.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.entity.Designation;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "NPD_PROCEDURE_MANPOWER")
@Getter
@Setter
@NoArgsConstructor
public class ProcedureManpower extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROCEDURE_HEADER_ID", nullable = false)
    private PackingProcedureHeader procedureHeader;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DESIGNATION_ID", nullable = false)
    private Designation designation;

    @Column(name = "QTY", nullable = false)
    private Integer qty;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PackingProcedureHeader getProcedureHeader() { return procedureHeader; }
    public void setProcedureHeader(PackingProcedureHeader procedureHeader) { this.procedureHeader = procedureHeader; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public Designation getDesignation() { return designation; }
    public void setDesignation(Designation designation) { this.designation = designation; }
    public Integer getQty() { return qty; }
    public void setQty(Integer qty) { this.qty = qty; }
}

package com.autonoma.erp.modules.npd.packing.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.entity.ProductProcess;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "NPD_PACKING_PROCEDURE_HEADER")
@Getter
@Setter
@NoArgsConstructor
public class PackingProcedureHeader extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROCESS_ID", nullable = false)
    private ProductProcess process;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRODUCT_ID", nullable = false)
    private ProductMaster product;

    @Column(name = "DOC_NO", nullable = false, length = 100)
    private String docNo;

    @Column(name = "REV_NO", nullable = false)
    private Integer revNo = 0;

    @Column(name = "REV_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date revDate;

    @Column(name = "APPROVAL_STATUS", nullable = false, length = 50)
    private String approvalStatus = "CREATED";

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    @Column(name = "DIVISION_ID")
    private Integer divisionId;

    @Column(name = "COMPANY_ID")
    private Integer companyId;

    @OneToMany(mappedBy = "procedureHeader", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProcedureConsumable> consumables = new ArrayList<>();

    @OneToMany(mappedBy = "procedureHeader", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProcedureTool> tools = new ArrayList<>();

    @OneToMany(mappedBy = "procedureHeader", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProcedureSafetyEquip> safetyEquipment = new ArrayList<>();

    @OneToMany(mappedBy = "procedureHeader", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProcedureManpower> manpower = new ArrayList<>();

    @OneToMany(mappedBy = "procedureHeader", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProcedureStep> steps = new ArrayList<>();

    @Override
    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (this.revNo == null) {
            this.revNo = 0;
        }
        if (this.revDate == null) {
            this.revDate = new Date();
        }
        if (this.approvalStatus == null) {
            this.approvalStatus = "CREATED";
        }
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ProductProcess getProcess() { return process; }
    public void setProcess(ProductProcess process) { this.process = process; }
    public ProductMaster getProduct() { return product; }
    public void setProduct(ProductMaster product) { this.product = product; }
    public String getDocNo() { return docNo; }
    public void setDocNo(String docNo) { this.docNo = docNo; }
    public Integer getRevNo() { return revNo; }
    public void setRevNo(Integer revNo) { this.revNo = revNo; }
    public Date getRevDate() { return revDate; }
    public void setRevDate(Date revDate) { this.revDate = revDate; }
    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Integer getDivisionId() { return divisionId; }
    public void setDivisionId(Integer divisionId) { this.divisionId = divisionId; }
    public Integer getCompanyId() { return companyId; }
    public void setCompanyId(Integer companyId) { this.companyId = companyId; }
    public List<ProcedureConsumable> getConsumables() { return consumables; }
    public void setConsumables(List<ProcedureConsumable> consumables) { this.consumables = consumables; }
    public List<ProcedureTool> getTools() { return tools; }
    public void setTools(List<ProcedureTool> tools) { this.tools = tools; }
    public List<ProcedureSafetyEquip> getSafetyEquipment() { return safetyEquipment; }
    public void setSafetyEquipment(List<ProcedureSafetyEquip> safetyEquipment) { this.safetyEquipment = safetyEquipment; }
    public List<ProcedureManpower> getManpower() { return manpower; }
    public void setManpower(List<ProcedureManpower> manpower) { this.manpower = manpower; }
    public List<ProcedureStep> getSteps() { return steps; }
    public void setSteps(List<ProcedureStep> steps) { this.steps = steps; }
}

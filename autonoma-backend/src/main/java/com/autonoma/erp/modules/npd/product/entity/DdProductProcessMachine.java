package com.autonoma.erp.modules.npd.product.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import com.autonoma.erp.modules.qmt.entity.MachineCategory;

@Entity
@Table(name = "DD_PRODUCT_PROCESS_MACHINE")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DdProductProcessMachine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "PROCESS_ID", insertable = false, updatable = false)
    private Long processId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROCESS_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private DdProductProcess productProcess;

    @Column(name = "MACHINE_CATEGORY_ID", nullable = false)
    private Long machineCategoryId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "MACHINE_CATEGORY_ID", insertable = false, updatable = false)
    private MachineCategory machineCategory;

    // Audit fields
    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @PrePersist
    protected void onCreate() {
        String user = resolveCurrentUser();
        this.createdBy = user;
        this.createdDate = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        String user = resolveCurrentUser();
        this.updatedBy = user;
        this.updatedDate = new Date();
    }

    private static String resolveCurrentUser() {
        String user = null;
        try { user = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception ignored) {}
        return (user != null && !user.trim().isEmpty()) ? user : "Admin";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProcessId() { return processId; }
    public void setProcessId(Long processId) { this.processId = processId; }
    public DdProductProcess getProductProcess() { return productProcess; }
    public void setProductProcess(DdProductProcess productProcess) { this.productProcess = productProcess; }
    public Long getMachineCategoryId() { return machineCategoryId; }
    public void setMachineCategoryId(Long machineCategoryId) { this.machineCategoryId = machineCategoryId; }
    public MachineCategory getMachineCategory() { return machineCategory; }
    public void setMachineCategory(MachineCategory machineCategory) { this.machineCategory = machineCategory; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}

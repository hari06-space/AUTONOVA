package com.autonoma.erp.modules.npd.product.dto;

import lombok.Data;
import java.util.Date;

@Data
public class DdProductProcessMachineDto {
    private Long id;
    private Long processId;
    private Long machineCategoryId;
    private String createdBy;
    private java.util.Date createdAt;
    private String updatedBy;
    private java.util.Date updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProcessId() { return processId; }
    public void setProcessId(Long processId) { this.processId = processId; }
    public Long getMachineCategoryId() { return machineCategoryId; }
    public void setMachineCategoryId(Long machineCategoryId) { this.machineCategoryId = machineCategoryId; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public java.util.Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.util.Date createdAt) { this.createdAt = createdAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public java.util.Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(java.util.Date updatedAt) { this.updatedAt = updatedAt; }
}

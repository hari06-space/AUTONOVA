package com.autonoma.erp.modules.master.finance.ledgergroup.dto;

import lombok.Data;

@Data
public class LedgerGroupDTO {
    private Long id;
    private String groupName;
    private String description;
    private Long level;
    private Long parentId;
    private String parentName;
    private Boolean isActive;
    
    private String createdBy;
    private java.time.LocalDateTime createdDate;
    private String updatedBy;
    private java.time.LocalDateTime updatedDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getLevel() { return level; }
    public void setLevel(Long level) { this.level = level; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public String getParentName() { return parentName; }
    public void setParentName(String parentName) { this.parentName = parentName; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public java.time.LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(java.time.LocalDateTime createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public java.time.LocalDateTime getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(java.time.LocalDateTime updatedDate) { this.updatedDate = updatedDate; }
}

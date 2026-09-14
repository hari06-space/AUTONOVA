package com.autonoma.erp.modules.npd.itemtaxonomy.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "NPD_ITEM_GROUP")
@Data
@NoArgsConstructor
public class ProductItemGroup extends BaseAuditEntity {

    @Id
    @Column(name = "GROUP_NAME", unique = true, nullable = false, length = 100)
    private String groupName;

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "STATUS", nullable = false, columnDefinition = "BIT")
    private Integer status = 1;


    @Column(name = "AQL_ID")
    private Long aqlId;

    @Override
    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }

        super.onCreate();
        if (status == null)
            status = 1;
    }

    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public Long getAqlId() { return aqlId; }
    public void setAqlId(Long aqlId) { this.aqlId = aqlId; }
}

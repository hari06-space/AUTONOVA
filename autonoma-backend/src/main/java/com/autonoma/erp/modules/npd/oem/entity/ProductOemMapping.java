package com.autonoma.erp.modules.npd.oem.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_OEM_MAPPING")
@Getter
@Setter
public class ProductOemMapping extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PART_NO", nullable = false, unique = true, length = 100)
    private String partNo;

    @Column(name = "OEM_PART_NO", nullable = false, length = 100)
    private String oemPartNo;

    @Column(name = "OEM_DESCRIPTION", length = Integer.MAX_VALUE)
    private String oemDescription;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    @Override
    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }

        super.onCreate();
        if (this.status == null) {
            this.status = true;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPartNo() { return partNo; }
    public void setPartNo(String partNo) { this.partNo = partNo; }
    public String getOemPartNo() { return oemPartNo; }
    public void setOemPartNo(String oemPartNo) { this.oemPartNo = oemPartNo; }
    public String getOemDescription() { return oemDescription; }
    public void setOemDescription(String oemDescription) { this.oemDescription = oemDescription; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}

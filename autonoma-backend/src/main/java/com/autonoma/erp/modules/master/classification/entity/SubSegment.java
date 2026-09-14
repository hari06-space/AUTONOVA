package com.autonoma.erp.modules.master.classification.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "SM_SUB_SEGMENT")
public class SubSegment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SEGMENT_NAME")
    private String segmentName;

    @Column(name = "SUB_SEGMENT_CODE")
    private String subSegmentCode;

    @Column(name = "SUB_SEGMENT_NAME")
    private String subSegmentName;

    @Column(name = "SUB_SEGMENT_DESCRIPTION")
    private String subSegmentDescription;

    @Column(name = "STATUS")
    private String status = "Active";

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE", updatable = false)
    private java.util.Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private java.util.Date updatedDate;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.createdBy = currentUserId;
        this.updatedBy = null;

        createdDate = new java.util.Date();
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        if (this.createdBy != null && this.createdBy.trim().isEmpty()) {
            this.createdBy = null;
        }

        updatedDate = new java.util.Date();

    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSegmentName() { return segmentName; }
    public void setSegmentName(String segmentName) { this.segmentName = segmentName; }
    public String getSubSegmentCode() { return subSegmentCode; }
    public void setSubSegmentCode(String subSegmentCode) { this.subSegmentCode = subSegmentCode; }
    public String getSubSegmentName() { return subSegmentName; }
    public void setSubSegmentName(String subSegmentName) { this.subSegmentName = subSegmentName; }
    public String getSubSegmentDescription() { return subSegmentDescription; }
    public void setSubSegmentDescription(String subSegmentDescription) { this.subSegmentDescription = subSegmentDescription; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}

package com.autonoma.erp.modules.hr.orgstructure.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "HR_DEPARTMENT")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "DEPARTMENT_NO", nullable = false, length = 20)
    private String departmentNo = "";

    @Column(name = "DEPARTMENT_NAME", nullable = false, length = 100)
    private String departmentName;

    public String getDepartmentName() { return departmentName; }

    @Column(name = "DEPARTMENT_MAIL_ID", nullable = false, length = 255)
    private String departmentMailId = "";

    @Column(name = "PR_PREFIX", length = 20)
    private String prPrefix = "";

    @Column(name = "NDA_CERTIFICATE", length = 10)
    private String ndaCertificate = "No";

    @Column(name = "SEQUENCE_NO")
    private Integer sequenceNo = 0;

    @Column(name = "STATUS", length = 20)
    private String status = "Active";

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

    @Column(name = "CATEGORY_ID")
    private Integer categoryId;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.createdBy = (currentUserId != null && !currentUserId.trim().isEmpty()) ? currentUserId : "SYSTEM";
        this.updatedBy = null;

        createdDate = new Date();

    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = (currentUserId);
        if (this.createdBy != null && this.createdBy.trim().isEmpty()) {
            this.createdBy = null;
        }

        updatedDate = new Date();

    }

    // Backward-compatible aliases for legacy service code
    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public Date getCreatedAt() {
        return createdDate;
    }

    public void setCreatedAt(Date d) {
        this.createdDate = d;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedAt")
    public Date getUpdatedAt() {
        return updatedDate;
    }

    public void setUpdatedAt(Date d) {
        this.updatedDate = d;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("createdUser")
    public String getCreatedUser() {
        return this.createdBy;
    }

    public void setCreatedUser(String createdUser) {
        this.createdBy = createdUser;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedUser")
    public String getUpdatedUser() {
        return this.updatedBy;
    }

    public void setUpdatedUser(String updatedUser) {
        this.updatedBy = updatedUser;
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("categoryName")
    public String getCategoryName() {
        if (categoryId == null) return null;
        if (categoryId == 1) return "QMS";
        if (categoryId == 2) return "Human Resource";
        if (categoryId == 3) return "Management";
        return null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("categoryName")
    public void setCategoryName(String categoryName) {
        if (this.categoryId == null && categoryName != null) {
            String clean = categoryName.trim().toUpperCase();
            if ("QMS".equals(clean)) this.categoryId = 1;
            else if ("HUMAN RESOURCE".equals(clean) || "HUMAN RESOURCES".equals(clean) || "HR".equals(clean)) this.categoryId = 2;
            else if ("MANAGEMENT".equals(clean)) this.categoryId = 3;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDepartmentNo() { return departmentNo; }
    public void setDepartmentNo(String departmentNo) { this.departmentNo = departmentNo; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public String getNdaCertificate() { return ndaCertificate; }
    public void setNdaCertificate(String ndaCertificate) { this.ndaCertificate = ndaCertificate; }
    public Integer getSequenceNo() { return sequenceNo; }
    public void setSequenceNo(Integer sequenceNo) { this.sequenceNo = sequenceNo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public String getDepartmentMailId() { return departmentMailId; }
    public void setDepartmentMailId(String departmentMailId) { this.departmentMailId = departmentMailId; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
    public String getPrPrefix() { return prPrefix; }
    public void setPrPrefix(String prPrefix) { this.prPrefix = prPrefix; }
}

package com.autonoma.erp.modules.hr.orgstructure.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Nationalized;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "HR_DESIGNATION")
@Data
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Designation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Nationalized
    @Column(name = "DESIGNATION_CODE", length = 50)
    private String designationCode;

    @Nationalized
    @Column(name = "DESIGNATION_NAME", length = 100)
    private String designationName;

    @Nationalized
    @Column(name = "SUB_CATEGORY_LEVEL", length = 50)
    private String subCategoryLevel;

    @Nationalized
    @Column(name = "EXPERIENCE", length = 50)
    private String experience;

    @Nationalized
    @Column(name = "APPEAR_IN_COMPETENCY", length = 10)
    private String appearInCompetency;

    @Column(name = "DISPLAY_SL_NO")
    private Integer displaySlNo;

    @Nationalized
    @Column(name = "QUALIFICATION", length = 100)
    private String qualification;

    @Nationalized
    @Column(name = "JOB_DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String jobDescription;

    @Column(name = "ORG_SEQUENCE_NO")
    private Integer orgSeqNo;

    @Column(name = "BUDGETED_POSITIONS")
    private Integer budgetedPositions;

    @Nationalized
    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private Date updatedDate;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }
            this.createdBy = (currentUserId != null && !currentUserId.trim().isEmpty()) ? currentUserId : "SYSTEM";
        }
        this.updatedBy = null;

        if (this.createdDate == null) {
            this.createdDate = new Date();
        }
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

        updatedDate = new Date();

    }

    // Manual Getters and Setters for stability
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDesignationCode() {
        return designationCode;
    }

    public void setDesignationCode(String designationCode) {
        this.designationCode = designationCode;
    }

    public String getDesignationName() {
        return designationName;
    }

    public void setDesignationName(String designationName) {
        this.designationName = designationName;
    }

    public String getSubCategoryLevel() {
        return subCategoryLevel;
    }

    public void setSubCategoryLevel(String subCategoryLevel) {
        this.subCategoryLevel = subCategoryLevel;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public String getAppearInCompetency() {
        return appearInCompetency;
    }

    public void setAppearInCompetency(String appearInCompetency) {
        this.appearInCompetency = appearInCompetency;
    }

    public Integer getDisplaySlNo() {
        return displaySlNo;
    }

    public void setDisplaySlNo(Integer displaySlNo) {
        this.displaySlNo = displaySlNo;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }

    public Integer getOrgSeqNo() {
        return orgSeqNo;
    }

    public void setOrgSeqNo(Integer orgSeqNo) {
        this.orgSeqNo = orgSeqNo;
    }

    public Integer getBudgetedPositions() {
        return budgetedPositions;
    }

    public void setBudgetedPositions(Integer budgetedPositions) {
        this.budgetedPositions = budgetedPositions;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Date getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(Date updatedDate) {
        this.updatedDate = updatedDate;
    }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "SYS_ENTERPRISE_KNOWLEDGE")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnterpriseKnowledge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "TITLE", nullable = false, length = 255)
    private String title;

    @Column(name = "CATEGORY", nullable = false, length = 50)
    private String category; // HR | QMS | SALES | FINANCE | GENERAL

    @Column(name = "SOURCE_TYPE", nullable = false, length = 20)
    private String sourceType; // PDF | URL | TEXT | POLICY | MANUAL

    @Column(name = "EXTRACTED_CONTENT", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String extractedContent;

    @Column(name = "FILE_PATH", length = 500)
    private String filePath;

    @Column(name = "SOURCE_URL", length = 1000)
    private String sourceUrl;

    @Column(name = "FILE_SIZE_KB")
    private Integer fileSizeKb;

    @Column(name = "COMPANY_ID", nullable = false)
    private Long companyId;

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

    @Column(name = "ACTIVE_STATUS", nullable = false, length = 1)
    private String activeStatus = "Y";

    @Column(name = "MODULE_SCOPE", length = 255)
    private String moduleScope; // e.g. HR | QMS | SALES | FINANCE | GENERAL

    @Column(name = "SENSITIVITY_LEVEL", length = 20)
    private String sensitivityLevel = "INTERNAL"; // PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED | SECRET

    @Column(name = "DIVISION_ID")
    private Long divisionId;

    @Column(name = "DEPARTMENT_CODE", length = 50)
    private String departmentCode;

    @Column(name = "TAGS", length = 500)
    private String tags;

    @Column(name = "VERSION", length = 20)
    private String version;

    @Column(name = "EFFECTIVE_DATE")
    @Temporal(TemporalType.DATE)
    private Date effectiveDate;

    @Column(name = "EXPIRY_DATE")
    @Temporal(TemporalType.DATE)
    private Date expiryDate;

    @Column(name = "OWNER_USER_ID", length = 50)
    private String ownerUserId;

    @Column(name = "APPROVAL_STATUS", length = 20)
    private String approvalStatus = "APPROVED"; // DRAFT | APPROVED | EXPIRED


    @PrePersist
    protected void onCreate() {
        String user = resolveCurrentUser();
        this.createdBy = user;
        this.createdDate = new Date();
        if (this.activeStatus == null) this.activeStatus = "Y";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedBy = resolveCurrentUser();
        this.updatedDate = new Date();
    }

    private static String resolveCurrentUser() {
        String user = null;
        try { user = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception ignored) {}
        return (user != null && !user.trim().isEmpty()) ? user : "Admin";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public String getExtractedContent() { return extractedContent; }
    public void setExtractedContent(String extractedContent) { this.extractedContent = extractedContent; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public Integer getFileSizeKb() { return fileSizeKb; }
    public void setFileSizeKb(Integer fileSizeKb) { this.fileSizeKb = fileSizeKb; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getActiveStatus() { return activeStatus; }
    public void setActiveStatus(String activeStatus) { this.activeStatus = activeStatus; }
    public String getSensitivityLevel() { return sensitivityLevel; }
    public void setSensitivityLevel(String sensitivityLevel) { this.sensitivityLevel = sensitivityLevel; }
}

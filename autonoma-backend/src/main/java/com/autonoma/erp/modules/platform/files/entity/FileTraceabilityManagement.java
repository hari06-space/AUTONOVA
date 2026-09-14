package com.autonoma.erp.modules.platform.files.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import com.autonoma.erp.model.admin.BosPage;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "FILE_TRACEABILITY_MANAGEMENT")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileTraceabilityManagement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "row_id")
    private Integer rowId;

    @Column(name = "page_id")
    private Integer pageId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "page_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "module", "subModule", "hibernateLazyInitializer", "handler" })
    private BosPage page;

    @Transient
    private String pageName;

    public String getPageName() {
        if (this.pageName != null) {
            return this.pageName;
        }
        return this.page != null ? this.page.getPageName() : null;
    }

    public void setPageName(String pageName) {
        this.pageName = pageName;
    }

    @Column(name = "report_name", length = 200)
    private String reportName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Transient
    private String creatorName;

    @Transient
    private String creatorImg;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public void setPageId(Integer pageId) { this.pageId = pageId; }
    public void setReportName(String reportName) { this.reportName = reportName; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public void setCreatorName(String creatorName) { this.creatorName = creatorName; }
    public void setCreatorImg(String creatorImg) { this.creatorImg = creatorImg; }

    @Column(name = "CREATED_DATE", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.createdBy = currentUserId;
        this.updatedBy = null;

        createdAt = new Date();

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

        updatedAt = new Date();

    }
}

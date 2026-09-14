package com.autonoma.erp.modules.induction.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_ATTACHMENT_PATH")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrAttachmentPath {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PAGE_CODE", nullable = false, length = 50)
    private String pageCode;

    @Column(name = "REF_ID", nullable = false)
    private Long refId;

    @Column(name = "DOC_TYPE", nullable = false, length = 50)
    private String docType;

    @Column(name = "PATH", nullable = false, length = 1000)
    private String path;

    @Column(name = "FILE_NAME", nullable = false, length = 255)
    private String fileName;

    @Column(name = "REFERENCE_ID_STRING", length = 255)
    private String referenceIdString;

    @Column(name = "FROMWHERE", length = 20)
    private String fromWhere;

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
        Date now = new Date();
        if (this.createdDate == null) {
            this.createdDate = now;
        }
        // Mirror createdBy/createdDate into updatedBy/updatedDate on initial insert
        // so the NOT NULL DB constraint is satisfied without requiring callers to set it explicitly.
        if (this.updatedBy == null) {
            this.updatedBy = this.createdBy;
        }
        if (this.updatedDate == null) {
            this.updatedDate = this.createdDate;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = new Date();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPageCode() { return pageCode; }
    public void setPageCode(String pageCode) { this.pageCode = pageCode; }

    public Long getRefId() { return refId; }
    public void setRefId(Long refId) { this.refId = refId; }

    public String getDocType() { return docType; }
    public void setDocType(String docType) { this.docType = docType; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getReferenceIdString() { return referenceIdString; }
    public void setReferenceIdString(String referenceIdString) { this.referenceIdString = referenceIdString; }

    public String getFromWhere() { return fromWhere; }
    public void setFromWhere(String fromWhere) { this.fromWhere = fromWhere; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}

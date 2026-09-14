package com.autonoma.erp.modules.qms.meeting.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "QMS_ATTACHMENT_PATH")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QmsAttachmentPath extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PAGE_CODE", length = 100, nullable = false)
    private String pageCode;

    @Column(name = "REF_ID", nullable = false)
    private Long refId;

    @Column(name = "DOC_TYPE", length = 50)
    private String docType;

    @Column(name = "PATH", length = 500, nullable = false)
    private String path;

    @Column(name = "FILE_NAME", length = 255, nullable = false)
    private String fileName;

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    @PrePersist
    protected void onQmsAttachmentCreate() {
        // BaseAuditEntity.onCreate() runs first and nulls out updated fields.
        // We restore them here because QMS_ATTACHMENT_PATH has NOT NULL constraints.
        if (this.getUpdatedDate() == null) {
            this.setUpdatedDate(this.getCreatedDate());
        }
        if (this.getUpdatedUser() == null) {
            this.setUpdatedUser(this.getCreatedUser());
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPageCode() { return pageCode; }
    public void setPageCode(String pageCode) { this.pageCode = pageCode; }
    public Long getRefId() { return refId; }
    public void setRefId(Long refId) { this.refId = refId; }
    public String getDocType() { return docType; }
    public void setDocType(String docType) { this.docType = docType; }
}

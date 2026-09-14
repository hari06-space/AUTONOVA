package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "QMS_ATTACHMENT_PATH")
@Data
public class NcrOfiAttachment extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "PAGE_CODE", length = 50, nullable = false)
    private String pageCode = "QMS_NCR_OFI";

    @Column(name = "REF_ID", length = 10, nullable = false)
    private String refId;

    @Column(name = "FILE_NAME", length = 500, nullable = false)
    private String fileName;

    @Column(name = "PATH", length = 500, nullable = false)
    private String path;

    @Column(name = "DOC_TYPE", length = 20, nullable = false)
    private String docType;

    @JsonProperty("filePath")
    public String getFilePath() {
        return path;
    }

    @JsonProperty("fileType")
    public String getFileType() {
        return docType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPageCode() { return pageCode; }
    public void setPageCode(String pageCode) { this.pageCode = pageCode; }
    public String getRefId() { return refId; }
    public void setRefId(String refId) { this.refId = refId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getDocType() { return docType; }
    public void setDocType(String docType) { this.docType = docType; }
}

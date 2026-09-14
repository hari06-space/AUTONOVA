package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "SYS_NOTEBOOK_SOURCE")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotebookSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NOTEBOOK_ID", nullable = false)
    private Long notebookId;

    @Column(name = "SOURCE_TYPE", nullable = false, length = 50)
    private String sourceType;

    @Column(name = "SOURCE_NAME", nullable = false, length = 255)
    private String sourceName;

    @Column(name = "FILE_PATH", length = 500)
    private String filePath;

    @Column(name = "SOURCE_URL", length = 1000)
    private String sourceUrl;

    @Column(name = "EXTRACTED_CONTENT", columnDefinition = "NVARCHAR(MAX)")
    private String extractedContent;

    @Column(name = "EXTRACTION_STATUS", length = 20)
    private String extractionStatus = "NONE"; // NONE | PENDING | DONE | FAILED

    @Column(name = "FILE_SIZE_KB")
    private Integer fileSizeKb;

    @Column(name = "LINKED_EMPLOYEE_ID")
    private Long linkedEmployeeId;

    @Column(name = "LINKED_MACHINE_ID")
    private Long linkedMachineId;

    @Column(name = "LINKED_CUSTOMER_ID")
    private Long linkedCustomerId;

    @Column(name = "LINKED_TICKET_ID")
    private Integer linkedTicketId;

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

    @PrePersist
    protected void onCreate() {
        String user = resolveCurrentUser();
        this.createdBy = user;
        this.createdDate = new Date();
        this.updatedBy = null;
        this.updatedDate = null;
        if (this.activeStatus == null) this.activeStatus = "Y";
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.createdDate != null && (new Date().getTime() - this.createdDate.getTime() < 5000)) {
            return;
        }
        String user = resolveCurrentUser();
        this.updatedBy = user;
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = user;
        }
        this.updatedDate = new Date();
    }

    @PostLoad
    protected void onPostLoad() {
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = "Admin";
        }
    }

    private static String resolveCurrentUser() {
        String user = null;
        try { user = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception ignored) {}
        return (user != null && !user.trim().isEmpty()) ? user : "Admin";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getNotebookId() { return notebookId; }
    public void setNotebookId(Long notebookId) { this.notebookId = notebookId; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public String getExtractedContent() { return extractedContent; }
    public void setExtractedContent(String extractedContent) { this.extractedContent = extractedContent; }
    public String getExtractionStatus() { return extractionStatus; }
    public void setExtractionStatus(String extractionStatus) { this.extractionStatus = extractionStatus; }
    public Integer getFileSizeKb() { return fileSizeKb; }
    public void setFileSizeKb(Integer fileSizeKb) { this.fileSizeKb = fileSizeKb; }
    public Long getLinkedEmployeeId() { return linkedEmployeeId; }
    public void setLinkedEmployeeId(Long linkedEmployeeId) { this.linkedEmployeeId = linkedEmployeeId; }
    public Long getLinkedMachineId() { return linkedMachineId; }
    public void setLinkedMachineId(Long linkedMachineId) { this.linkedMachineId = linkedMachineId; }
    public Long getLinkedCustomerId() { return linkedCustomerId; }
    public void setLinkedCustomerId(Long linkedCustomerId) { this.linkedCustomerId = linkedCustomerId; }
    public Integer getLinkedTicketId() { return linkedTicketId; }
    public void setLinkedTicketId(Integer linkedTicketId) { this.linkedTicketId = linkedTicketId; }
    public String getActiveStatus() { return activeStatus; }
    public void setActiveStatus(String activeStatus) { this.activeStatus = activeStatus; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
}

package com.autonoma.erp.modules.notebook.dto;

import lombok.Data;
import java.util.Date;

@Data
public class NotebookSourceDTO {
    private Long id;
    private Long notebookId;
    private String sourceType;
    private String sourceName;
    private String filePath;
    private String sourceUrl;
    private String extractedContent;
    private String extractionStatus;
    private Integer fileSizeKb;
    private Long linkedEmployeeId;
    private Long linkedMachineId;
    private Long linkedCustomerId;
    private Integer linkedTicketId;
    private String activeStatus;
    private String createdBy;
    private Date createdDate;

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


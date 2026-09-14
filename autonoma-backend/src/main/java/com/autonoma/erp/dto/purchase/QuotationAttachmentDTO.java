package com.autonoma.erp.dto.purchase;

import lombok.Data;

@Data
public class QuotationAttachmentDTO {
    private Long id;
    private Long quotationRefId;
    private String fileName;
    private String filePath;
    private String fileType;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getQuotationRefId() { return quotationRefId; }
    public void setQuotationRefId(Long quotationRefId) { this.quotationRefId = quotationRefId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
}

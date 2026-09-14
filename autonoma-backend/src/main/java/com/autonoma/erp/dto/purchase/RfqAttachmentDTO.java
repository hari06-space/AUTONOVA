package com.autonoma.erp.dto.purchase;

import lombok.Data;

@Data
public class RfqAttachmentDTO {
    private Long id;
    private Long rfqRefId;
    private String fileName;
    private String filePath;
    private String fileType;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRfqRefId() { return rfqRefId; }
    public void setRfqRefId(Long rfqRefId) { this.rfqRefId = rfqRefId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
}

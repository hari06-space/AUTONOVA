package com.autonoma.erp.dto.purchase.gateentry;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GateEntryAttachmentDTO {

    private Long id;
    private Long gateEntryHeadId;
    
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private String attachmentType;
    
    private String createdBy;
    private LocalDateTime createdDate;
    private Integer activeStatus;
}

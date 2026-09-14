package com.autonoma.erp.dto.purchase.grn;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GoodsReceiptAttachmentDTO {
    private Long id;
    private Long goodsReceiptHeadId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private String attachmentType;
    private Integer activeStatus;
    
    // Additional fields for frontend component
    private String serverFileName;
    private String fileType;
}

package com.autonoma.erp.dto.purchase;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PurchaseAttachmentDTO {
    private Long id;
    private Long poHeadId;
    private String refId;
    private String pageCode;
    private String docType;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private Integer activeStatus;

    // For frontend mapping compatibility
    private String serverFileName;
    private String name;
    private String fileType;
}

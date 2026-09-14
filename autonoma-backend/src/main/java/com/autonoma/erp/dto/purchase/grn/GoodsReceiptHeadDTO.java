package com.autonoma.erp.dto.purchase.grn;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class GoodsReceiptHeadDTO {
    private Long id;
    private Long divisionId;
    private String grnNo;
    private LocalDate grnDate;
    
    private Long poHeadId;
    private String poNo;
    
    private Long gateEntryHeadId;
    private String gateEntryNo;
    

    
    private Long supplierId;
    private String supplierName;
    private String supplierCode;
    
    private Long statusId;
    private String statusName;
    
    private String remarks;
    
    private String documentType;
    private String documentNo;
    private LocalDate documentDate;
    
    private List<GoodsReceiptTransDTO> transactions;
    
    private List<GoodsReceiptAttachmentDTO> attachments;
}

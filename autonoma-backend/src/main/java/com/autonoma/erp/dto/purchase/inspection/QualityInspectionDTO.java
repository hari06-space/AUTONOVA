package com.autonoma.erp.dto.purchase.inspection;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class QualityInspectionDTO {
    private Long id;
    
    private Long grnTransId;
    
    // UI displays from GRN usually, but we are also storing them now per new table structure
    private Long itemId;
    private String itemCode;
    private String itemName;
    private String batchNo;
    private BigDecimal grnQty;
    
    private BigDecimal previousInspectedQty; // Sent from backend to UI
    private BigDecimal remainingQty; // Sent from backend to UI
    
    private BigDecimal acceptedQty;
    private BigDecimal rejectedQty;
    private BigDecimal ncQty;
    private String ncRemarks;
    
    private Long rejectionReasonId;
    private String rejectionReason;
    private Long inspectedById;
    private String remarks;
    private String statusName;
    private Long statusId;
    
    // TC and Heat No
    private String testCertificate;
    private String tcSource;
    private String heatNo;
    
    // Read-only fields from GRN for UI display
    private String uom;
    private BigDecimal price;
    private String grnRemarks;

    private java.util.List<com.autonoma.erp.dto.purchase.PurchaseAttachmentDTO> attachments;
    private java.util.List<MaterialInspectionDTO> testReports;
}

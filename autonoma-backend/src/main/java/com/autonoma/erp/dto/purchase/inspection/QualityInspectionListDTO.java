package com.autonoma.erp.dto.purchase.inspection;

import lombok.Data;
import java.time.LocalDate;

@Data
public class QualityInspectionListDTO {
    private String id; // grnHeadId as String
    private LocalDate qiDate;
    private String grnNo;
    private String supplierName;
    private String poNo;
    private String statusName;
    private java.math.BigDecimal totalGrnQty;
    private java.math.BigDecimal totalAcceptedQty;
    private java.math.BigDecimal totalRejectedQty;
    private String itemCode;
    private String itemName;
    private String grnHeadId;
}

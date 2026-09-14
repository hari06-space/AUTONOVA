package com.autonoma.erp.dto.purchase.grn;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class GoodsReceiptListDTO {
    private Long id;
    private String grnNo;
    private LocalDate grnDate;
    private String supplierName;
    private String poNo;
    private String gateEntryNo;
    private String inspectionNo;
    private BigDecimal totalQty;
    private String statusName;
}

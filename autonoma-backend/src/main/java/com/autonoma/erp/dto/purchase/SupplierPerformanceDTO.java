package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;

@Data
public class SupplierPerformanceDTO {
    private Long id;
    private Long supplierId;
    private String supplierName;
    private BigDecimal ratingScore;
    private BigDecimal deliveryPerformance;
    private BigDecimal qualityPerformance;
    private Date lastEvaluated;
}

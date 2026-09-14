package com.autonoma.erp.modules.qmc.aql.dto;

import lombok.Data;

@Data
public class AqlSamplingRuleDto {
    private Long id;
    private Long aqlMasterId;
    private Integer lotSizeFrom;
    private Integer lotSizeTo;
    private Integer sampleSize;
    private Integer acceptanceQty;
    private Integer rejectionQty;
}

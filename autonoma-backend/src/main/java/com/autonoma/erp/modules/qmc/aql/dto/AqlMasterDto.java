package com.autonoma.erp.modules.qmc.aql.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class AqlMasterDto {
    private Long id;
    private String aqlCode;
    private String aqlName;
    private String inspectionLevel;
    private String inspectionType;
    private BigDecimal aqlValue;
    private String remarks;
    private Long status;
    private String statusName; // Helper for frontend display
    
    private List<String> itemGroups = new ArrayList<>();
    private List<AqlSamplingRuleDto> samplingRules = new ArrayList<>();
}

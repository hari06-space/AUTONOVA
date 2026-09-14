package com.autonoma.erp.dto.purchase.gateentry;

import lombok.Data;
import java.time.LocalDate;

@Data
public class GateEntrySourceDTO {

    private Long id;
    private Long gateEntryHeadId;
    
    private String sourceType;
    private Long sourceHeadId;
    private String sourceDocumentNo;
    private LocalDate sourceDocumentDate;
    
    private Integer activeStatus;
}

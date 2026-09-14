package com.autonoma.erp.dto.purchase.po;

import lombok.Data;

@Data
public class PurchaseOrderSourceRequestDTO {
    private String sourceType;
    private Long sourceDocId;
    private Long divisionId;

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public Long getSourceDocId() { return sourceDocId; }
    public void setSourceDocId(Long sourceDocId) { this.sourceDocId = sourceDocId; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
}

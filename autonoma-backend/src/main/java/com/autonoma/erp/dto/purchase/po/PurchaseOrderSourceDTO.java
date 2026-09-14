package com.autonoma.erp.dto.purchase.po;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PurchaseOrderSourceDTO {
    private Long id;
    private Long poHeadId;
    private Long poTransId;
    private String sourceType;
    private Long sourceHeadId;
    private Long sourceTransId;
    private String sourceDocumentNo;
    private Integer sourceLineNo;
    private BigDecimal sourceQty;
    private BigDecimal orderedQty;
    private BigDecimal balanceQty;
    private BigDecimal convertedQty;
    private Boolean isFullyConverted;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPoHeadId() { return poHeadId; }
    public void setPoHeadId(Long poHeadId) { this.poHeadId = poHeadId; }
    public Long getPoTransId() { return poTransId; }
    public void setPoTransId(Long poTransId) { this.poTransId = poTransId; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public Long getSourceHeadId() { return sourceHeadId; }
    public void setSourceHeadId(Long sourceHeadId) { this.sourceHeadId = sourceHeadId; }
    public Long getSourceTransId() { return sourceTransId; }
    public void setSourceTransId(Long sourceTransId) { this.sourceTransId = sourceTransId; }
    public String getSourceDocumentNo() { return sourceDocumentNo; }
    public void setSourceDocumentNo(String sourceDocumentNo) { this.sourceDocumentNo = sourceDocumentNo; }
    public Integer getSourceLineNo() { return sourceLineNo; }
    public void setSourceLineNo(Integer sourceLineNo) { this.sourceLineNo = sourceLineNo; }
    public BigDecimal getSourceQty() { return sourceQty; }
    public void setSourceQty(BigDecimal sourceQty) { this.sourceQty = sourceQty; }
    public BigDecimal getOrderedQty() { return orderedQty; }
    public void setOrderedQty(BigDecimal orderedQty) { this.orderedQty = orderedQty; }
    public BigDecimal getBalanceQty() { return balanceQty; }
    public void setBalanceQty(BigDecimal balanceQty) { this.balanceQty = balanceQty; }
    public BigDecimal getConvertedQty() { return convertedQty; }
    public void setConvertedQty(BigDecimal convertedQty) { this.convertedQty = convertedQty; }
    public Boolean getIsFullyConverted() { return isFullyConverted; }
    public void setIsFullyConverted(Boolean isFullyConverted) { this.isFullyConverted = isFullyConverted; }
}

package com.autonoma.erp.model;

import com.autonoma.erp.enums.PoSourceType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "PP_PURCHASE_ORDER_SOURCE")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderSource extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_HEAD_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private PurchaseOrderHead purchaseOrderHead;

    @Column(name = "PO_TRANS_ID")
    private Long poTransId;

    @Enumerated(EnumType.STRING)
    @Column(name = "SOURCE_TYPE", nullable = false, length = 50)
    private PoSourceType sourceType;

    @Column(name = "SOURCE_HEAD_ID", nullable = false)
    private Long sourceHeadId;

    @Column(name = "SOURCE_TRANS_ID")
    private Long sourceTransId;

    @Column(name = "SOURCE_DOCUMENT_NO", length = 100)
    private String sourceDocumentNo;

    @Column(name = "SOURCE_LINE_NO")
    private Integer sourceLineNo;

    @Column(name = "SOURCE_QTY", precision = 18, scale = 4)
    private BigDecimal sourceQty;

    @Column(name = "ORDERED_QTY", precision = 18, scale = 4)
    private BigDecimal orderedQty;

    @Column(name = "BALANCE_QTY", precision = 18, scale = 4)
    private BigDecimal balanceQty;

    @Column(name = "CONVERTED_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal convertedQty = BigDecimal.ZERO;

    @Column(name = "IS_FULLY_CONVERTED", nullable = false)
    private Boolean isFullyConverted = false;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PurchaseOrderHead getPurchaseOrderHead() { return purchaseOrderHead; }
    public void setPurchaseOrderHead(PurchaseOrderHead purchaseOrderHead) { this.purchaseOrderHead = purchaseOrderHead; }
    public Long getPoTransId() { return poTransId; }
    public void setPoTransId(Long poTransId) { this.poTransId = poTransId; }
    public PoSourceType getSourceType() { return sourceType; }
    public void setSourceType(PoSourceType sourceType) { this.sourceType = sourceType; }
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
    public Integer getActiveStatus() { return activeStatus; }
    public void setActiveStatus(Integer activeStatus) { this.activeStatus = activeStatus; }
}

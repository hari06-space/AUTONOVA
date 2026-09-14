package com.autonoma.erp.dto.purchase.po;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;

@Data
public class PurchaseOrderListDTO {
    private Long id;
    private String poNo;
    private Date poDate;
    private Integer revisionNo;
    private Long supplierId;
    private String supplierName;
    private String sourceType;
    private String sourceDocumentNo;
    private String prNo;
    private Long prId;
    private String rfqNo;
    private Long rfqId;
    private String quoteNo;
    private Long quoteId;
    private String comparisonNo;
    private Long comparisonId;
    private String currency;
    private BigDecimal grandTotal;
    private Long statusId;
    private String statusName;
    private String buyerName;
    private String departmentName;
    private Long divisionId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPoNo() { return poNo; }
    public void setPoNo(String poNo) { this.poNo = poNo; }
    public Date getPoDate() { return poDate; }
    public void setPoDate(Date poDate) { this.poDate = poDate; }
    public Integer getRevisionNo() { return revisionNo; }
    public void setRevisionNo(Integer revisionNo) { this.revisionNo = revisionNo; }
    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public String getSourceDocumentNo() { return sourceDocumentNo; }
    public void setSourceDocumentNo(String sourceDocumentNo) { this.sourceDocumentNo = sourceDocumentNo; }
    public String getPrNo() { return prNo; }
    public void setPrNo(String prNo) { this.prNo = prNo; }
    public Long getPrId() { return prId; }
    public void setPrId(Long prId) { this.prId = prId; }
    public String getRfqNo() { return rfqNo; }
    public void setRfqNo(String rfqNo) { this.rfqNo = rfqNo; }
    public Long getRfqId() { return rfqId; }
    public void setRfqId(Long rfqId) { this.rfqId = rfqId; }
    public String getQuoteNo() { return quoteNo; }
    public void setQuoteNo(String quoteNo) { this.quoteNo = quoteNo; }
    public Long getQuoteId() { return quoteId; }
    public void setQuoteId(Long quoteId) { this.quoteId = quoteId; }
    public String getComparisonNo() { return comparisonNo; }
    public void setComparisonNo(String comparisonNo) { this.comparisonNo = comparisonNo; }
    public Long getComparisonId() { return comparisonId; }
    public void setComparisonId(Long comparisonId) { this.comparisonId = comparisonId; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String statusName) { this.statusName = statusName; }
    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
}

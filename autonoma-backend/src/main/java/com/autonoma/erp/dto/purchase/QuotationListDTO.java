package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;

@Data
public class QuotationListDTO {
    private Long id;
    private String quotationNo;
    private String rfqNo;
    private Long supplierId;
    private String supplierName;
    private Date quotationDate;
    private String technicalStatusName;
    private String statusName;
    private Long prId;
    private String prNo;
    private String trackingStatus;

    private Long rfqId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuotationNo() { return quotationNo; }
    public void setQuotationNo(String quotationNo) { this.quotationNo = quotationNo; }
    public String getRfqNo() { return rfqNo; }
    public void setRfqNo(String rfqNo) { this.rfqNo = rfqNo; }
    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public Date getQuotationDate() { return quotationDate; }
    public void setQuotationDate(Date quotationDate) { this.quotationDate = quotationDate; }
    public String getTechnicalStatusName() { return technicalStatusName; }
    public void setTechnicalStatusName(String technicalStatusName) { this.technicalStatusName = technicalStatusName; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String statusName) { this.statusName = statusName; }
    public Long getRfqId() { return rfqId; }
    public void setRfqId(Long rfqId) { this.rfqId = rfqId; }
    public Long getPrId() { return prId; }
    public void setPrId(Long prId) { this.prId = prId; }
    public String getPrNo() { return prNo; }
    public void setPrNo(String prNo) { this.prNo = prNo; }
    public String getTrackingStatus() { return trackingStatus; }
    public void setTrackingStatus(String trackingStatus) { this.trackingStatus = trackingStatus; }
}

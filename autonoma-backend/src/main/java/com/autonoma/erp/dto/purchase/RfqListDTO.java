package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;

@Data
public class RfqListDTO {
    private Long id;
    private String rfqNo;
    private Date rfqDate;
    private String prNo;
    private Long prId;
    private String departmentName;
    private String buyerName;
    private Date closingDate;
    private String statusName;
    private Long statusId;
    private String quotationNos;
    private java.util.List<QuotationRefDTO> quotationList;
    private boolean allQuotationsReceived;
    private String trackingStatus;
    private Integer invitedSuppliersCount;
    private Integer receivedQuotationsCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRfqNo() { return rfqNo; }
    public void setRfqNo(String rfqNo) { this.rfqNo = rfqNo; }
    public Date getRfqDate() { return rfqDate; }
    public void setRfqDate(Date rfqDate) { this.rfqDate = rfqDate; }
    public String getPrNo() { return prNo; }
    public void setPrNo(String prNo) { this.prNo = prNo; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }
    public Date getClosingDate() { return closingDate; }
    public void setClosingDate(Date closingDate) { this.closingDate = closingDate; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String statusName) { this.statusName = statusName; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public Long getPrId() { return prId; }
    public void setPrId(Long prId) { this.prId = prId; }
    public String getQuotationNos() { return quotationNos; }
    public void setQuotationNos(String quotationNos) { this.quotationNos = quotationNos; }
    public java.util.List<QuotationRefDTO> getQuotationList() { return quotationList; }
    public void setQuotationList(java.util.List<QuotationRefDTO> quotationList) { this.quotationList = quotationList; }
    public boolean isAllQuotationsReceived() { return allQuotationsReceived; }
    public void setAllQuotationsReceived(boolean allQuotationsReceived) { this.allQuotationsReceived = allQuotationsReceived; }
    public String getTrackingStatus() { return trackingStatus; }
    public void setTrackingStatus(String trackingStatus) { this.trackingStatus = trackingStatus; }
    public Integer getInvitedSuppliersCount() { return invitedSuppliersCount; }
    public void setInvitedSuppliersCount(Integer invitedSuppliersCount) { this.invitedSuppliersCount = invitedSuppliersCount; }
    public Integer getReceivedQuotationsCount() { return receivedQuotationsCount; }
    public void setReceivedQuotationsCount(Integer receivedQuotationsCount) { this.receivedQuotationsCount = receivedQuotationsCount; }
}

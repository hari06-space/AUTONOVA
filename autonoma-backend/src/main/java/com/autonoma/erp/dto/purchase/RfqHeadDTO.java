package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonFormat;

@Data
public class RfqHeadDTO {
    private Long id;
    private String rfqNo;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date rfqDate;
    private Long prRefId;
    private String prNo;
    private Long departmentId;
    private String departmentName;
    private Long buyerId;
    private String buyerName;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date closingDate;
    private String commercialTerms;
    private String internalNotes;
    private Long statusId;
    private String statusName;
    private Long divisionId;
    
    private List<RfqDetailDTO> details;
    private List<RfqSupplierDTO> suppliers;
    private List<RfqAttachmentDTO> attachments;
    private List<RfqActivityDTO> activities;
    private List<RfqWorkflowDTO> workflows;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRfqNo() { return rfqNo; }
    public void setRfqNo(String rfqNo) { this.rfqNo = rfqNo; }
    public Date getRfqDate() { return rfqDate; }
    public void setRfqDate(Date rfqDate) { this.rfqDate = rfqDate; }
    public Long getPrRefId() { return prRefId; }
    public void setPrRefId(Long prRefId) { this.prRefId = prRefId; }
    public String getPrNo() { return prNo; }
    public void setPrNo(String prNo) { this.prNo = prNo; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }
    public Date getClosingDate() { return closingDate; }
    public void setClosingDate(Date closingDate) { this.closingDate = closingDate; }
    public String getCommercialTerms() { return commercialTerms; }
    public void setCommercialTerms(String commercialTerms) { this.commercialTerms = commercialTerms; }
    public String getInternalNotes() { return internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String statusName) { this.statusName = statusName; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public List<RfqDetailDTO> getDetails() { return details; }
    public void setDetails(List<RfqDetailDTO> details) { this.details = details; }
    public List<RfqSupplierDTO> getSuppliers() { return suppliers; }
    public void setSuppliers(List<RfqSupplierDTO> suppliers) { this.suppliers = suppliers; }
    public List<RfqAttachmentDTO> getAttachments() { return attachments; }
    public void setAttachments(List<RfqAttachmentDTO> attachments) { this.attachments = attachments; }
    public List<RfqActivityDTO> getActivities() { return activities; }
    public void setActivities(List<RfqActivityDTO> activities) { this.activities = activities; }
    public List<RfqWorkflowDTO> getWorkflows() { return workflows; }
    public void setWorkflows(List<RfqWorkflowDTO> workflows) { this.workflows = workflows; }
}

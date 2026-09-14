package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
public class PurchaseRequestHeadDTO {
    private Long id;
    private String prNo;
    private Date prDate;
    private Long departmentId;
    private String departmentName;
    private Long plannerId;
    private String plannerName;
    private String prFrom;
    private String remarks;
    private Boolean status;
    private Long divisionId;
    private String rfqNo;
    private String rfqStatus;
    private List<PurchaseRequestTransDTO> transactions;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPrNo() { return prNo; }
    public void setPrNo(String prNo) { this.prNo = prNo; }
    public Date getPrDate() { return prDate; }
    public void setPrDate(Date prDate) { this.prDate = prDate; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public Long getPlannerId() { return plannerId; }
    public void setPlannerId(Long plannerId) { this.plannerId = plannerId; }
    public String getPlannerName() { return plannerName; }
    public void setPlannerName(String plannerName) { this.plannerName = plannerName; }
    public String getPrFrom() { return prFrom; }
    public void setPrFrom(String prFrom) { this.prFrom = prFrom; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public List<PurchaseRequestTransDTO> getTransactions() { return transactions; }
    public void setTransactions(List<PurchaseRequestTransDTO> transactions) { this.transactions = transactions; }
    public String getRfqNo() { return rfqNo; }
    public void setRfqNo(String rfqNo) { this.rfqNo = rfqNo; }
    public String getRfqStatus() { return rfqStatus; }
    public void setRfqStatus(String rfqStatus) { this.rfqStatus = rfqStatus; }
}

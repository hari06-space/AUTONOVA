package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;

@Data
public class ComparisonDecisionDTO {
    private Long id;
    private Long rfqRefId;
    private String rfqNo;
    private Long recommendedSupplierId;
    private String recommendedSupplierName;
    private String recommendedReason;
    private Long selectedSupplierId;
    private String selectedSupplierName;
    private String overrideRemarks;
    private Date decisionDate;
    private Long statusId;
    private String statusName;
    private Long divisionId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRfqRefId() { return rfqRefId; }
    public void setRfqRefId(Long rfqRefId) { this.rfqRefId = rfqRefId; }
    public String getRfqNo() { return rfqNo; }
    public void setRfqNo(String rfqNo) { this.rfqNo = rfqNo; }
    public Long getRecommendedSupplierId() { return recommendedSupplierId; }
    public void setRecommendedSupplierId(Long recommendedSupplierId) { this.recommendedSupplierId = recommendedSupplierId; }
    public String getRecommendedSupplierName() { return recommendedSupplierName; }
    public void setRecommendedSupplierName(String recommendedSupplierName) { this.recommendedSupplierName = recommendedSupplierName; }
    public String getRecommendedReason() { return recommendedReason; }
    public void setRecommendedReason(String recommendedReason) { this.recommendedReason = recommendedReason; }
    public Long getSelectedSupplierId() { return selectedSupplierId; }
    public void setSelectedSupplierId(Long selectedSupplierId) { this.selectedSupplierId = selectedSupplierId; }
    public String getSelectedSupplierName() { return selectedSupplierName; }
    public void setSelectedSupplierName(String selectedSupplierName) { this.selectedSupplierName = selectedSupplierName; }
    public String getOverrideRemarks() { return overrideRemarks; }
    public void setOverrideRemarks(String overrideRemarks) { this.overrideRemarks = overrideRemarks; }
    public Date getDecisionDate() { return decisionDate; }
    public void setDecisionDate(Date decisionDate) { this.decisionDate = decisionDate; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String statusName) { this.statusName = statusName; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
}

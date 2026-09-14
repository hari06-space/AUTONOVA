package com.autonoma.erp.dto.purchase.comparison;

import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class QuoteComparisonDTO {
    private Long id;
    private String comparisonNo;
    private Integer version;
    private Date comparisonDate;
    private Long rfqId;
    private String rfqNo;
    private Long statusId;
    private String statusName;
    private String selectionType;
    private Long overallRecommendedSupplierId;
    private String overallRecommendedSupplierName;
    private Long overallSelectedSupplierId;
    private String overallSelectedSupplierName;
    private Boolean isManualOverride;
    private String overrideReason;
    private Long prId;
    private String prNo;
    private Date prDate;
    
    // Tracking fields for list view
    private String awardedSuppliers;
    private String poNumbers;
    private String trackCycle;
    
    // Detailed Lists
    private List<QuoteComparisonMatrixDTO> matrixItems;
    private List<QuoteComparisonScoreDTO> scores;
    private List<QuoteComparisonTransDTO> transactions;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getComparisonNo() { return comparisonNo; }
    public void setComparisonNo(String comparisonNo) { this.comparisonNo = comparisonNo; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public Date getComparisonDate() { return comparisonDate; }
    public void setComparisonDate(Date comparisonDate) { this.comparisonDate = comparisonDate; }
    public Long getRfqId() { return rfqId; }
    public void setRfqId(Long rfqId) { this.rfqId = rfqId; }
    public String getRfqNo() { return rfqNo; }
    public void setRfqNo(String rfqNo) { this.rfqNo = rfqNo; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String statusName) { this.statusName = statusName; }
    public String getSelectionType() { return selectionType; }
    public void setSelectionType(String selectionType) { this.selectionType = selectionType; }
    public Long getOverallRecommendedSupplierId() { return overallRecommendedSupplierId; }
    public void setOverallRecommendedSupplierId(Long overallRecommendedSupplierId) { this.overallRecommendedSupplierId = overallRecommendedSupplierId; }
    public String getOverallRecommendedSupplierName() { return overallRecommendedSupplierName; }
    public void setOverallRecommendedSupplierName(String overallRecommendedSupplierName) { this.overallRecommendedSupplierName = overallRecommendedSupplierName; }
    public Long getOverallSelectedSupplierId() { return overallSelectedSupplierId; }
    public void setOverallSelectedSupplierId(Long overallSelectedSupplierId) { this.overallSelectedSupplierId = overallSelectedSupplierId; }
    public String getOverallSelectedSupplierName() { return overallSelectedSupplierName; }
    public void setOverallSelectedSupplierName(String overallSelectedSupplierName) { this.overallSelectedSupplierName = overallSelectedSupplierName; }
    public Boolean getIsManualOverride() { return isManualOverride; }
    public void setIsManualOverride(Boolean isManualOverride) { this.isManualOverride = isManualOverride; }
    public String getOverrideReason() { return overrideReason; }
    public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }
    public Long getPrId() { return prId; }
    public void setPrId(Long prId) { this.prId = prId; }
    public String getPrNo() { return prNo; }
    public void setPrNo(String prNo) { this.prNo = prNo; }
    public Date getPrDate() { return prDate; }
    public void setPrDate(Date prDate) { this.prDate = prDate; }
    public String getAwardedSuppliers() { return awardedSuppliers; }
    public void setAwardedSuppliers(String awardedSuppliers) { this.awardedSuppliers = awardedSuppliers; }
    public String getPoNumbers() { return poNumbers; }
    public void setPoNumbers(String poNumbers) { this.poNumbers = poNumbers; }
    public String getTrackCycle() { return trackCycle; }
    public void setTrackCycle(String trackCycle) { this.trackCycle = trackCycle; }
    public List<QuoteComparisonMatrixDTO> getMatrixItems() { return matrixItems; }
    public void setMatrixItems(List<QuoteComparisonMatrixDTO> matrixItems) { this.matrixItems = matrixItems; }
    public List<QuoteComparisonScoreDTO> getScores() { return scores; }
    public void setScores(List<QuoteComparisonScoreDTO> scores) { this.scores = scores; }
    public List<QuoteComparisonTransDTO> getTransactions() { return transactions; }
    public void setTransactions(List<QuoteComparisonTransDTO> transactions) { this.transactions = transactions; }
}

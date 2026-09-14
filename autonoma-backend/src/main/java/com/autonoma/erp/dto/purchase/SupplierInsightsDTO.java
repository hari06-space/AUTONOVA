package com.autonoma.erp.dto.purchase;

import lombok.Data;

@Data
public class SupplierInsightsDTO {
    private String supplierCode;
    private String supplierName;
    private Double rating;
    private Double onTimeDeliveryPercent;
    private Double qualityScore;
    private Double rejectionRate;
    private Integer averageLeadTimeDays;
    private java.math.BigDecimal totalPurchaseValue;
    private Integer openOrdersCount;
    private java.math.BigDecimal pendingPayments;
    private java.util.Date lastPurchaseDate;
    private Boolean preferredSupplier;
    private String riskIndicator; // e.g. "LOW", "MEDIUM", "HIGH"
    private String performanceTrend; // e.g. "IMPROVING", "STABLE", "DECLINING"
    private String contractStatus;

    public String getSupplierCode() { return supplierCode; }
    public void setSupplierCode(String supplierCode) { this.supplierCode = supplierCode; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public Double getOnTimeDeliveryPercent() { return onTimeDeliveryPercent; }
    public void setOnTimeDeliveryPercent(Double onTimeDeliveryPercent) { this.onTimeDeliveryPercent = onTimeDeliveryPercent; }
    public Double getQualityScore() { return qualityScore; }
    public void setQualityScore(Double qualityScore) { this.qualityScore = qualityScore; }
    public Double getRejectionRate() { return rejectionRate; }
    public void setRejectionRate(Double rejectionRate) { this.rejectionRate = rejectionRate; }
    public Integer getAverageLeadTimeDays() { return averageLeadTimeDays; }
    public void setAverageLeadTimeDays(Integer averageLeadTimeDays) { this.averageLeadTimeDays = averageLeadTimeDays; }
    public java.math.BigDecimal getTotalPurchaseValue() { return totalPurchaseValue; }
    public void setTotalPurchaseValue(java.math.BigDecimal totalPurchaseValue) { this.totalPurchaseValue = totalPurchaseValue; }
    public Integer getOpenOrdersCount() { return openOrdersCount; }
    public void setOpenOrdersCount(Integer openOrdersCount) { this.openOrdersCount = openOrdersCount; }
    public java.math.BigDecimal getPendingPayments() { return pendingPayments; }
    public void setPendingPayments(java.math.BigDecimal pendingPayments) { this.pendingPayments = pendingPayments; }
    public java.util.Date getLastPurchaseDate() { return lastPurchaseDate; }
    public void setLastPurchaseDate(java.util.Date lastPurchaseDate) { this.lastPurchaseDate = lastPurchaseDate; }
    public Boolean getPreferredSupplier() { return preferredSupplier; }
    public void setPreferredSupplier(Boolean preferredSupplier) { this.preferredSupplier = preferredSupplier; }
    public String getRiskIndicator() { return riskIndicator; }
    public void setRiskIndicator(String riskIndicator) { this.riskIndicator = riskIndicator; }
    public String getPerformanceTrend() { return performanceTrend; }
    public void setPerformanceTrend(String performanceTrend) { this.performanceTrend = performanceTrend; }
    public String getContractStatus() { return contractStatus; }
    public void setContractStatus(String contractStatus) { this.contractStatus = contractStatus; }
}

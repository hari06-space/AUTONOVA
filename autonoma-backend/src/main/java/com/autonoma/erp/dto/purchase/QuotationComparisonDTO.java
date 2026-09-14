package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class QuotationComparisonDTO {
    private Long rfqId;
    private String rfqNo;
    private List<SupplierScoreDTO> suppliers;
    private List<ComparisonItemDTO> items;
    
    // Dynamic recommendations based on configured weights
    private Long recommendedSupplierId;
    private String recommendedReason;

    @Data
    public static class SupplierScoreDTO {
        private Long quotationId;
        private Long supplierId;
        private String supplierName;
        private BigDecimal totalAmount;
        private Integer leadTimeDays;
        private String paymentTerms;
        private String warrantyTerms;
        private BigDecimal historicalRating;
        private BigDecimal finalScore; // Dynamically computed
        
        // Highlights
        private Boolean isLowestPrice;
        private Boolean isFastestDelivery;
        private Boolean isBestRating;

        public Long getQuotationId() { return quotationId; }
        public void setQuotationId(Long quotationId) { this.quotationId = quotationId; }
        public Long getSupplierId() { return supplierId; }
        public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
        public String getSupplierName() { return supplierName; }
        public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public Integer getLeadTimeDays() { return leadTimeDays; }
        public void setLeadTimeDays(Integer leadTimeDays) { this.leadTimeDays = leadTimeDays; }
        public String getPaymentTerms() { return paymentTerms; }
        public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
        public String getWarrantyTerms() { return warrantyTerms; }
        public void setWarrantyTerms(String warrantyTerms) { this.warrantyTerms = warrantyTerms; }
        public BigDecimal getHistoricalRating() { return historicalRating; }
        public void setHistoricalRating(BigDecimal historicalRating) { this.historicalRating = historicalRating; }
        public BigDecimal getFinalScore() { return finalScore; }
        public void setFinalScore(BigDecimal finalScore) { this.finalScore = finalScore; }
        public Boolean getIsLowestPrice() { return isLowestPrice; }
        public void setIsLowestPrice(Boolean isLowestPrice) { this.isLowestPrice = isLowestPrice; }
        public Boolean getIsFastestDelivery() { return isFastestDelivery; }
        public void setIsFastestDelivery(Boolean isFastestDelivery) { this.isFastestDelivery = isFastestDelivery; }
        public Boolean getIsBestRating() { return isBestRating; }
        public void setIsBestRating(Boolean isBestRating) { this.isBestRating = isBestRating; }
    }

    @Data
    public static class ComparisonItemDTO {
        private Long itemId;
        private String itemName;
        private String uom;
        private BigDecimal reqQty;
        // supplierId -> details
        private java.util.Map<Long, ItemSupplierDetailDTO> supplierDetails;

        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }
        public String getUom() { return uom; }
        public void setUom(String uom) { this.uom = uom; }
        public BigDecimal getReqQty() { return reqQty; }
        public void setReqQty(BigDecimal reqQty) { this.reqQty = reqQty; }
        public java.util.Map<Long, ItemSupplierDetailDTO> getSupplierDetails() { return supplierDetails; }
        public void setSupplierDetails(java.util.Map<Long, ItemSupplierDetailDTO> supplierDetails) { this.supplierDetails = supplierDetails; }
    }

    @Data
    public static class ItemSupplierDetailDTO {
        private BigDecimal unitPrice;
        private BigDecimal discountPercent;
        private BigDecimal taxPercent;
        private BigDecimal freightAmount;
        private BigDecimal totalAmount;

        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
        public BigDecimal getDiscountPercent() { return discountPercent; }
        public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }
        public BigDecimal getTaxPercent() { return taxPercent; }
        public void setTaxPercent(BigDecimal taxPercent) { this.taxPercent = taxPercent; }
        public BigDecimal getFreightAmount() { return freightAmount; }
        public void setFreightAmount(BigDecimal freightAmount) { this.freightAmount = freightAmount; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    }

    public Long getRfqId() { return rfqId; }
    public void setRfqId(Long rfqId) { this.rfqId = rfqId; }
    public String getRfqNo() { return rfqNo; }
    public void setRfqNo(String rfqNo) { this.rfqNo = rfqNo; }
    public List<SupplierScoreDTO> getSuppliers() { return suppliers; }
    public void setSuppliers(List<SupplierScoreDTO> suppliers) { this.suppliers = suppliers; }
    public List<ComparisonItemDTO> getItems() { return items; }
    public void setItems(List<ComparisonItemDTO> items) { this.items = items; }
    public Long getRecommendedSupplierId() { return recommendedSupplierId; }
    public void setRecommendedSupplierId(Long recommendedSupplierId) { this.recommendedSupplierId = recommendedSupplierId; }
    public String getRecommendedReason() { return recommendedReason; }
    public void setRecommendedReason(String recommendedReason) { this.recommendedReason = recommendedReason; }
}

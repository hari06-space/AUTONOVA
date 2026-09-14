package com.autonoma.erp.modules.inventory.product360.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product360SummaryDto {

    private ProductHeaderDto productHeader;
    private InventoryKpiDto inventoryKpis;
    private List<DivisionStockDto> divisionStocks = new ArrayList<>();
    private DemandSummaryDto demandSummary;
    private List<DemandTrendMonthDto> demandTrends = new ArrayList<>();
    private ForecastSummaryDto forecastSummary;
    private List<ReservationItemDto> reservations = new ArrayList<>();
    private RolSafetyDto rolSafety;
    private List<ProjectedStockPointDto> projectedStocks = new ArrayList<>();
    private DaysOfInventoryDto daysOfInventory;
    private StockHealthDto stockHealth;
    private RoutingCardSummaryDto routingCards;
    private List<ProcessWipItemDto> processWipList = new ArrayList<>();
    private List<MaterialShortageItemDto> materialShortages = new ArrayList<>();
    private PurchasePipelineDto purchasePipeline;
    private ReorderRecommendationDto recommendation;
    private SupplierIntelligenceDto supplierIntelligence;
    private QualityIntelligenceDto qualityIntelligence;
    private PurchaseReturnSummaryDto returnSummary;
    private StockAgingDto stockAging;
    private AbcXyzClassificationDto classification;
    private List<RiskItemDto> riskMatrix = new ArrayList<>();
    private List<BossInsightDto> bossInsights = new ArrayList<>();
    private List<java.util.Map<String, Object>> openBatches = new ArrayList<>();

    // ── Nested Section DTOs ──

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductHeaderDto {
        private Long id;
        private String productCode;
        private String productName;
        private String category;
        private String subCategory;
        private String uom;
        private String productType;
        private String status;
        private BigDecimal currentCost;
        private BigDecimal lastPurchasePrice;
        private String defaultSupplierCode;
        private String defaultSupplierName;
        private String defaultSupplierText;
        private String imagePath;
        @Builder.Default
        private List<String> images = new ArrayList<>();
        private String hsnCode;
        private String drawingNo;
        private String rackName;
        private String binName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryKpiDto {
        private BigDecimal currentStock;
        private BigDecimal availableStock;
        private BigDecimal reservedStock;
        private BigDecimal inTransit;
        private BigDecimal openPoQty;
        private BigDecimal openPrQty;
        private BigDecimal rol;
        private BigDecimal safetyStock;
        private BigDecimal maxStock;
        private Integer daysOfInventory;
        private BigDecimal stockValue;
        private String stockValueFormatted;
        private String uom;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DivisionStockDto {
        private Long divisionId;
        private String divisionName;
        private BigDecimal currentStock;
        private BigDecimal reserved;
        private BigDecimal available;
        private BigDecimal stockValue;
        private String stockValueFormatted;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DemandSummaryDto {
        private BigDecimal totalDemand;
        private BigDecimal customerOrdersQty;
        private Double customerOrdersPct;
        private BigDecimal productionDemandQty;
        private Double productionDemandPct;
        private BigDecimal internalDemandQty;
        private Double internalDemandPct;
        private BigDecimal otherDemandQty;
        private Double otherDemandPct;
        private BigDecimal confirmedDemand;
        private BigDecimal openDemand;
        private BigDecimal reservedDemand;
        private BigDecimal unfulfilledDemand;
        private String uom;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DemandTrendMonthDto {
        private String month;
        private BigDecimal actualDemand;
        private BigDecimal orderQty;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForecastSummaryDto {
        private String periodLabel;
        private String trendDirection; // INCREASING, STABLE, DECREASING, VOLATILE
        private Double trendPercentage;
        private Boolean hasSufficientData;
        private String note;
        private List<ForecastBucketDto> buckets = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForecastBucketDto {
        private String bucketName; // 0-30 Days, 31-60 Days, 61-90 Days
        private BigDecimal historical;
        private BigDecimal forecast;
        private Double confidencePct;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservationItemDto {
        private String reservationType; // Production Reserved, Sales Reserved, Quality Hold, Other Reserved
        private BigDecimal quantity;
        private String uom;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolSafetyDto {
        private BigDecimal rol;
        private BigDecimal safetyStock;
        private BigDecimal currentStock;
        private BigDecimal availableStock;
        private BigDecimal maxStock;
        private String rolStatus; // NORMAL, LOW, REORDER REQUIRED, CRITICAL, BELOW ROL
        private String safetyStatus; // SAFE, LOW BUFFER, BELOW SAFETY STOCK
        private BigDecimal gaugeMin;
        private BigDecimal gaugeMax;
        private BigDecimal gaugeValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectedStockPointDto {
        private String timeLabel; // Today, 30 Days, 60 Days, 90 Days
        private BigDecimal projectedStock;
        private BigDecimal safetyStock;
        private Boolean isShortage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DaysOfInventoryDto {
        private BigDecimal avgDailyConsumption;
        private BigDecimal currentAvailableStock;
        private Integer daysOfInventory;
        private String projectedStockoutDate;
        private String uom;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockHealthDto {
        private String overallStatus; // CRITICAL, WARNING, SAFE, OVERSTOCK, NORMAL
        private String statusTitle; // e.g. "CRITICAL"
        private String statusMessage; // e.g. "Available stock is below ROL"
        private String riskLevel; // HIGH, MEDIUM, LOW
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoutingCardSummaryDto {
        private Integer totalOpen;
        private Integer active;
        private Integer onHold;
        private Integer delayed;
        private Integer completed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcessWipItemDto {
        private Long processId;
        private String processName;
        private BigDecimal wipQty;
        private Integer pendingOrders;
        private Integer delayDays;
        private String uom;
        private Boolean isBottleneck;
        private String barColor;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaterialShortageItemDto {
        private Long materialId;
        private String materialCode;
        private String materialName;
        private BigDecimal requiredQty;
        private BigDecimal availableQty;
        private BigDecimal shortageQty;
        private String uom;
        private String status; // OK, SHORT
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchasePipelineDto {
        private BigDecimal openPrQty;
        private BigDecimal openRfqQty;
        private BigDecimal openPoQty;
        private BigDecimal inTransit;
        private BigDecimal expectedGrn;
        private String uom;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReorderRecommendationDto {
        private BigDecimal recommendedQty;
        private String uom;
        private String explanation;
        private BigDecimal currentAvailable;
        private BigDecimal rol;
        private BigDecimal safetyStock;
        private BigDecimal forecastDemand;
        private BigDecimal openPo;
        private Integer leadTimeDays;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplierIntelligenceDto {
        private String defaultSupplierCode;
        private String defaultSupplierName;
        private BigDecimal lastPurchasePrice;
        private BigDecimal avgPurchasePrice;
        private BigDecimal minPurchasePrice;
        private BigDecimal maxPurchasePrice;
        private String priceTrend; // PRICE INCREASE, PRICE DECREASE, STABLE
        private Double priceChangePct;
        private Integer avgLeadTimeDays;
        private Double qualityScorePct;
        private Double deliveryScorePct;
        private Integer purchaseFrequency;
        private List<SupplierHistoryItemDto> suppliers = new ArrayList<>();
        private List<PriceTrendPointDto> priceHistory = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplierHistoryItemDto {
        private String supplierCode;
        private String supplierName;
        private BigDecimal lastPrice;
        private BigDecimal avgPrice;
        private Integer leadTimeDays;
        private Double qualityScore;
        private Integer totalOrders;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceTrendPointDto {
        private String date;
        private String supplierName;
        private BigDecimal price;
        private BigDecimal poQty;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityIntelligenceDto {
        private BigDecimal inspectedQty;
        private BigDecimal acceptedQty;
        private BigDecimal rejectedQty;
        private Double acceptancePct;
        private Double rejectionPct;
        private List<DefectItemDto> topDefects = new ArrayList<>();
        private List<GrnHistoryItemDto> recentGrns = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DefectItemDto {
        private String defectReason;
        private BigDecimal count;
        private Double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrnHistoryItemDto {
        private Long grnId;
        private String grnNo;
        private String grnDate;
        private String supplierName;
        private BigDecimal receivedQty;
        private BigDecimal acceptedQty;
        private BigDecimal rejectedQty;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseReturnSummaryDto {
        private BigDecimal receivedQty;
        private BigDecimal returnedQty;
        private Double returnPct;
        private List<ReturnReasonItemDto> returnReasons = new ArrayList<>();
        private List<PurchaseReturnRecordDto> recentReturns = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReturnReasonItemDto {
        private String reason;
        private BigDecimal qty;
        private Double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseReturnRecordDto {
        private Long returnId;
        private String returnNo;
        private String returnDate;
        private String supplierName;
        private BigDecimal returnQty;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockAgingDto {
        private BigDecimal bucket0To30Days;
        private BigDecimal bucket31To60Days;
        private BigDecimal bucket61To90Days;
        private BigDecimal bucket90PlusDays;
        private String movementCategory; // FAST MOVING, SLOW MOVING, NON MOVING, EXCESS
        private BigDecimal excessQty;
        private BigDecimal excessValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AbcXyzClassificationDto {
        private String abcCategory; // A, B, C
        private BigDecimal annualConsumptionValue;
        private Double valueContributionPct;
        private String xyzCategory; // X, Y, Z
        private String demandPredictability; // Stable, Variable, Irregular
        private String classificationMethod;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskItemDto {
        private String riskType; // Stock Risk, Demand Risk, Supply Risk, Quality Risk, Production Risk, Price Risk
        private String severity; // LOW, MEDIUM, HIGH, CRITICAL
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BossInsightDto {
        private String id;
        private String severity; // CRITICAL, WARNING, INFO, SUCCESS
        private String icon;
        private String title;
        private String message;
        private String highlightText;
        private String category; // STOCK, PRODUCTION, DEMAND, PROCUREMENT, QUALITY
    }
}

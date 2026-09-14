package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
public class PurchaseRequestLifecycleDTO {
    private Long prId;
    private String prNo;
    private Date prDate;
    private String prStatus;
    private String prCreatedBy;
    private Date prCreatedDate;
    private String prVerifierName;
    private Date prVerifiedDate;
    
    private List<RfqLifecycleDTO> rfqs;
    private List<PurchaseOrderLifecycleDTO> directPurchaseOrders;

    @Data
    public static class RfqLifecycleDTO {
        private Long rfqId;
        private String rfqNo;
        private Date rfqDate;
        private String rfqStatus;
        private String createdBy;
        private Date createdDate;
        
        private List<QuotationLifecycleDTO> quotations;
        private List<NegotiationLifecycleDTO> negotiations;
        private List<ComparisonLifecycleDTO> comparisons;
        private List<PurchaseOrderLifecycleDTO> purchaseOrders;
    }

    @Data
    public static class QuotationLifecycleDTO {
        private Long quotationId;
        private String quotationNo;
        private Date quotationDate;
        private String quotationStatus;
        private String supplierName;
        private String createdBy;
        private Date createdDate;
    }

    @Data
    public static class NegotiationLifecycleDTO {
        private Long negotiationId;
        private String negotiationNo;
        private Date negotiationDate;
        private Integer negotiationRound;
        private String negotiationStatus;
        private String createdBy;
        private Date createdDate;
    }

    @Data
    public static class ComparisonLifecycleDTO {
        private Long comparisonId;
        private String comparisonNo;
        private Date comparisonDate;
        private String comparisonStatus;
        private String createdBy;
        private Date createdDate;
    }

    @Data
    public static class PurchaseOrderLifecycleDTO {
        private Long poId;
        private String poNo;
        private Date poDate;
        private String poStatus;
        private String supplierName;
        private String createdBy;
        private Date createdDate;
        
        private List<GateEntryLifecycleDTO> gateEntries;
    }

    @Data
    public static class GateEntryLifecycleDTO {
        private Long gateEntryId;
        private String gateEntryNo;
        private Date gateEntryDate;
        private String gateEntryStatus;
        private String createdBy;
        private Date createdDate;
        
        private List<GrnLifecycleDTO> grns;
    }


    @Data
    public static class GrnLifecycleDTO {
        private Long grnId;
        private String grnNo;
        private Date grnDate;
        private String grnStatus;
        private String createdBy;
        private Date createdDate;
        
        private List<QualityInspectionLifecycleDTO> qualityInspections;
    }

    @Data
    public static class QualityInspectionLifecycleDTO {
        private Long qualityInspectionId;
        private String qualityInspectionNo;
        private Date qualityInspectionDate;
        private String qualityInspectionStatus;
        private String createdBy;
        private Date createdDate;
    }
}

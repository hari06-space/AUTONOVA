package com.nutech.email.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ReviewDto {

    @Data @AllArgsConstructor @NoArgsConstructor @Builder
    public static class ReviewQueueItemResponse {
        private Long id;
        private Long processingRequestId;
        private String emailSubject;
        private String emailFrom;
        private String unknownPartCode;
        private Integer requestedQuantity;
        private String surroundingContext;
        private String aiSuggestedPartCode;
        private String aiSuggestedPartName;
        private BigDecimal aiConfidence;
        private String aiReasoning;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class ResolveRequest {
        private Long reviewItemId;
        private Long masterPartId;      // existing part to map to
        private NewPartRequest newPart;  // OR create a new part
        private String notes;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class NewPartRequest {
        private String partCode;
        private String partName;
        private String description;
        private String category;
        private BigDecimal unitPrice;
        private String uom;
        private Integer leadTimeDays;
        private String hsnCode;
        private BigDecimal gstRate;
    }
}

package com.nutech.email.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

public class AiDto {

    @Data @AllArgsConstructor @NoArgsConstructor @Builder
    public static class IntentResult {
        private String intent;       // quotation_request, invoice_request, general_inquiry, spam
        private double confidence;
        private String reasoning;
    }

    @Data @AllArgsConstructor @NoArgsConstructor @Builder
    public static class ExtractedPart {
        private String partCode;
        private Integer quantity;
        private String deliveryDate;
        private String specialInstructions;
        private String surroundingContext;
    }

    @Data @AllArgsConstructor @NoArgsConstructor @Builder
    public static class PartMatchSuggestion {
        private String unknownCode;
        private String suggestedPartCode;
        private Long suggestedPartId;
        private double confidence;
        private String reasoning;
    }
}

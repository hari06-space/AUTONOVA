package com.nutech.email.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DashboardDto {

    @Data @AllArgsConstructor @NoArgsConstructor @Builder
    public static class StatsResponse {
        private long totalEmailsProcessed;
        private long pendingReviews;
        private long quotationsSent;
        private long invoicesSent;
        private long totalMasterParts;
        private long totalCustomers;
    }

    @Data @AllArgsConstructor @NoArgsConstructor @Builder
    public static class QuotationResponse {
        private Long id;
        private String quotationNumber;
        private String customerName;
        private String customerEmail;
        private LocalDate quotationDate;
        private LocalDate validUntil;
        private BigDecimal totalAmount;
        private String status;
        private LocalDateTime createdAt;
        private List<LineItem> lines;
    }

    @Data @AllArgsConstructor @NoArgsConstructor @Builder
    public static class LineItem {
        private String partCode;
        private String partName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }

    @Data @AllArgsConstructor @NoArgsConstructor @Builder
    public static class ProcessingRequestResponse {
        private Long id;
        private String emailSubject;
        private String emailFrom;
        private String intent;
        private String status;
        private LocalDateTime emailReceivedAt;
        private LocalDateTime createdAt;
    }
}

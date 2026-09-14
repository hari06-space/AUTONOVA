package com.nutech.email.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "review_queue_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewQueueItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processing_request_id", nullable = false)
    private ProcessingRequest processingRequest;

    @Column(nullable = false, length = 100)
    private String unknownPartCode;

    private Integer requestedQuantity;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String surroundingContext;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_suggested_part_id")
    private MasterPart aiSuggestedPart;

    @Column(precision = 5, scale = 2)
    private BigDecimal aiConfidence;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String aiReasoning;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_master_part_id")
    private MasterPart resolvedMasterPart;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.PENDING;

    private Long resolvedByUserId;
    private LocalDateTime resolvedAt;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ReviewStatus {
        PENDING, RESOLVED, NEW_PART_CREATED, REJECTED
    }
}

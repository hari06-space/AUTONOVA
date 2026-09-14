package com.nutech.email.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "AD_OCR_PROCESSING_REQUEST")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String emailMessageId;

    @Column(length = 500)
    private String emailSubject;

    private String emailFrom;
    
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String emailTo;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String emailCc;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String emailBodyPreview;

    private LocalDateTime emailReceivedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String combinedText;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Intent intent = Intent.UNCLASSIFIED;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String extractedPartsJson;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ProcessingStatus status = ProcessingStatus.RECEIVED;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String errorMessage;

    @Builder.Default
    private Integer retryCount = 0;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "processingRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<EmailProcessingLog> logs = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "processingRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<ReviewQueueItem> reviewQueueItems = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "processingRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<Quotation> quotations = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "processingRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<Invoice> invoices = new java.util.ArrayList<>();

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @Column(name = "COMPANY_ID")
    private Long companyId;

    @Column(name = "DIVISION_ID")
    private Long divisionId;

    @Column(name = "shared_mailbox", length = 255)
    private String sharedMailbox;

    @Builder.Default
    private Integer attachmentCount = 0;

    @Column(name = "parent_enquiry_id")
    private Long parentEnquiryId;

    @Column(name = "conversation_thread_id", length = 500)
    private String conversationThreadId;

    @Column(name = "direction", length = 50)
    private String direction;

    @Column(name = "email_type", length = 100)
    private String emailType;

    @Column(name = "ENQ_ENTRY_NO", length = 50)
    private String enqEntryNo;

    @Column(name = "SM_ENQUIRY_ID")
    private Long smEnquiryId;

    @Column(name = "QUOTE_ENTRY_NO", length = 50)
    private String quoteEntryNo;

    @Column(name = "SALE_ORDER_ENTRY_NO", length = 50)
    private String saleOrderEntryNo;

    @Column(name = "mode", length = 50)
    @Builder.Default
    private String mode = "OCR";

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (createdBy == null) {
            createdBy = "System";
        }
        if (updatedBy == null) {
            updatedBy = "System";
        }
        if (direction == null) {
            direction = "INCOMING";
        }
        if (mode == null || mode.trim().isEmpty()) {
            mode = "OCR";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (updatedBy == null) {
            updatedBy = "System";
        }
    }

    public enum Intent {
        QUOTATION_REQUEST, INVOICE_REQUEST, GENERAL_INQUIRY, SPAM, UNCLASSIFIED, LEDGER
    }

    public enum ProcessingStatus {
        RECEIVED, OCR_IN_PROGRESS, CLASSIFYING, EXTRACTING,
        RESOLVING_PARTS, AWAITING_REVIEW, GENERATING_DOCUMENT,
        SENDING_REPLY, COMPLETED, FAILED, SKIPPED,
        HOLD, LEDGER_REQUEST_MAIL, LEDGER_REQUEST_MAIL_WITH_CC,
        ABANDONED, NOT_RELEVANT
    }
}

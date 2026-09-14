package com.nutech.email.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "AD_OCR_PROCESSING_LOG")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailProcessingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processing_request_id")
    private ProcessingRequest processingRequest;

    @Column(nullable = false, length = 100)
    private String step;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LogStatus status;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String details;

    private Long durationMs;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum LogStatus {
        STARTED, SUCCESS, FAILED
    }
}

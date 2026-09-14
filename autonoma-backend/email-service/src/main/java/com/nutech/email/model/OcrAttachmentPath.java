package com.nutech.email.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "AD_OCR_ATTACHMENTS_PATH")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OcrAttachmentPath {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROCESSING_REQUEST_ID", nullable = false)
    private ProcessingRequest processingRequest;

    @Column(name = "FILE_NAME", nullable = false, length = 255)
    private String fileName;

    @Column(name = "PATH", nullable = false, length = 500)
    private String path;

    @Column(name = "DOC_TYPE", nullable = false, length = 50)
    private String docType;

    @Column(name = "CONTENT_TYPE", length = 150)
    private String contentType;

    @Column(name = "FILE_SIZE", nullable = false)
    private Long fileSize;

    @Column(name = "IS_INLINE", nullable = false)
    private Boolean isInline;

    @Column(name = "ORIGINAL_ATTACHMENT_ID", nullable = false, length = 500)
    private String originalAttachmentId;

    @Column(name = "ATTACHMENT_TYPE", nullable = false, length = 50)
    private String attachmentType; // 'EMAIL', 'DOCUMENT', 'IMAGE'

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    private LocalDateTime createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        if (createdBy == null) {
            createdBy = "System";
        }
        updatedDate = createdDate;
        updatedBy = createdBy;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedDate = LocalDateTime.now();
        if (updatedBy == null) {
            updatedBy = "System";
        }
    }
}

package com.nutech.email.repository;

import com.nutech.email.model.OcrAttachmentPath;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OcrAttachmentPathRepository extends JpaRepository<OcrAttachmentPath, Long> {
    List<OcrAttachmentPath> findByProcessingRequestId(Long processingRequestId);
    Optional<OcrAttachmentPath> findByProcessingRequestIdAndOriginalAttachmentId(Long processingRequestId, String originalAttachmentId);
}

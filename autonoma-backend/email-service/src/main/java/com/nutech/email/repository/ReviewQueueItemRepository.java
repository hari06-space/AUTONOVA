package com.nutech.email.repository;

import com.nutech.email.model.ReviewQueueItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewQueueItemRepository extends JpaRepository<ReviewQueueItem, Long> {
    List<ReviewQueueItem> findByStatusOrderByCreatedAtDesc(ReviewQueueItem.ReviewStatus status);
    List<ReviewQueueItem> findByProcessingRequestIdOrderByCreatedAtAsc(Long processingRequestId);
    long countByStatus(ReviewQueueItem.ReviewStatus status);
}

package com.nutech.email.repository;

import com.nutech.email.model.EmailProcessingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmailProcessingLogRepository extends JpaRepository<EmailProcessingLog, Long> {
    List<EmailProcessingLog> findByProcessingRequestIdOrderByCreatedAtAsc(Long processingRequestId);
}

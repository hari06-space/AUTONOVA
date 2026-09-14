package com.nutech.email.repository;

import com.nutech.email.model.ProcessingRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProcessingRequestRepository extends JpaRepository<ProcessingRequest, Long> {
    Optional<ProcessingRequest> findByEmailMessageId(String emailMessageId);
    boolean existsByEmailMessageId(String emailMessageId);
    List<ProcessingRequest> findByStatusOrderByCreatedAtDesc(ProcessingRequest.ProcessingStatus status);
    List<ProcessingRequest> findTop50ByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Query("SELECT p FROM ProcessingRequest p WHERE p.status IN (com.nutech.email.model.ProcessingRequest.ProcessingStatus.RECEIVED, com.nutech.email.model.ProcessingRequest.ProcessingStatus.AWAITING_REVIEW) AND (p.emailReceivedAt < :cutoff OR (p.emailReceivedAt IS NULL AND p.createdAt < :cutoff))")
    List<ProcessingRequest> findOpenRequestsBefore(@org.springframework.data.repository.query.Param("cutoff") java.time.LocalDateTime cutoff);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM ProcessingRequest p WHERE (p.emailFrom = :emailFrom OR p.emailFrom LIKE CONCAT('%', :emailFrom, '%') OR p.emailTo = :emailFrom OR p.emailTo LIKE CONCAT('%', :emailFrom, '%')) AND p.status IN (com.nutech.email.model.ProcessingRequest.ProcessingStatus.LEDGER_REQUEST_MAIL, com.nutech.email.model.ProcessingRequest.ProcessingStatus.LEDGER_REQUEST_MAIL_WITH_CC) ORDER BY p.createdAt DESC")
    List<ProcessingRequest> findPendingLedgerRequests(@org.springframework.data.repository.query.Param("emailFrom") String emailFrom);

    List<ProcessingRequest> findByCustomerIsNull();
    List<ProcessingRequest> findByConversationThreadId(String conversationThreadId);
    List<ProcessingRequest> findByParentEnquiryId(Long parentEnquiryId);
}

package com.nutech.email.repository;

import com.nutech.email.model.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    Optional<Quotation> findByQuotationNumber(String quotationNumber);
    List<Quotation> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    Optional<Quotation> findByProcessingRequestId(Long processingRequestId);
    List<Quotation> findTop50ByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(q.quotationNumber, 4) AS integer)), 0) FROM Quotation q")
    int findMaxQuotationSequence();
}

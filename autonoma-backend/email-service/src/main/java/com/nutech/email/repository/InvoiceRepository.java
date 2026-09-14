package com.nutech.email.repository;

import com.nutech.email.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findByProcessingRequestId(Long processingRequestId);
    List<Invoice> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Invoice> findTop50ByOrderByCreatedAtDesc();
}

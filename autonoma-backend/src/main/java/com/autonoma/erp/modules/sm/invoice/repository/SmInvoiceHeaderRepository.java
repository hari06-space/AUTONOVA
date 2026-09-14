package com.autonoma.erp.modules.sm.invoice.repository;

import com.autonoma.erp.modules.sm.invoice.entity.SmInvoiceHeader;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SmInvoiceHeaderRepository extends JpaRepository<SmInvoiceHeader, Long> {
    boolean existsByInvoiceNo(String invoiceNo);
    boolean existsByInvoiceNoAndIdNot(String invoiceNo, Long id);
    
    Page<SmInvoiceHeader> findByDocType(String docType, Pageable pageable);
    Page<SmInvoiceHeader> findByDocTypeOrDocTypeIsNull(String docType, Pageable pageable);
    
    boolean existsByInvoiceNoAndDocType(String invoiceNo, String docType);
    boolean existsByInvoiceNoAndDocTypeAndIdNot(String invoiceNo, String docType, Long id);
}

package com.autonoma.erp.repository;

import com.autonoma.erp.model.QuotationHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationHeadRepository extends JpaRepository<QuotationHead, Long>, JpaSpecificationExecutor<QuotationHead> {
    Optional<QuotationHead> findByQuotationNo(String quotationNo);
    boolean existsByQuotationNo(String quotationNo);
    List<QuotationHead> findByRfqHeadId(Long rfqHeadId);
    Optional<QuotationHead> findByRfqHeadIdAndSupplierId(Long rfqHeadId, Long supplierId);
    boolean existsByRfqHeadIdAndSupplierId(Long rfqHeadId, Long supplierId);
}

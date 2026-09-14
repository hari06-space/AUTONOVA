package com.autonoma.erp.repository.purchase;

import com.autonoma.erp.model.QuotationNegotiationHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationNegotiationRepository extends JpaRepository<QuotationNegotiationHead, Long> {
    
    List<QuotationNegotiationHead> findByDivisionId(Long divisionId);
    
    List<QuotationNegotiationHead> findByQuotationHeadId(Long quotationId);
    
    List<QuotationNegotiationHead> findByRfqHeadId(Long rfqId);
}

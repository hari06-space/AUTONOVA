package com.autonoma.erp.repository.purchase;

import com.autonoma.erp.model.QuotationNegotiationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationNegotiationHistoryRepository extends JpaRepository<QuotationNegotiationHistory, Long> {
    
    List<QuotationNegotiationHistory> findByNegotiationHeadIdOrderByActionDateDesc(Long negotiationId);
}

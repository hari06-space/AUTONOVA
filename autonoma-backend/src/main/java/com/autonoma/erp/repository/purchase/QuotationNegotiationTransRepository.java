package com.autonoma.erp.repository.purchase;

import com.autonoma.erp.model.QuotationNegotiationTrans;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationNegotiationTransRepository extends JpaRepository<QuotationNegotiationTrans, Long> {
    
    List<QuotationNegotiationTrans> findByNegotiationHeadId(Long negotiationHeadId);
}

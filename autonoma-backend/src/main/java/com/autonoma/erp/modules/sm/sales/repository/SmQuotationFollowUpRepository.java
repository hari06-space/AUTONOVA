package com.autonoma.erp.modules.sm.sales.repository;

import com.autonoma.erp.modules.sm.sales.entity.SmQuotationFollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmQuotationFollowUpRepository extends JpaRepository<SmQuotationFollowUp, Long> {
    List<SmQuotationFollowUp> findByQuotationId(Long quotationId);
}

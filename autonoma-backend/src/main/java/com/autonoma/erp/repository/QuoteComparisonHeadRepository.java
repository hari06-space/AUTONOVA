package com.autonoma.erp.repository;

import com.autonoma.erp.model.QuoteComparisonHead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuoteComparisonHeadRepository extends JpaRepository<QuoteComparisonHead, Long> {
    List<QuoteComparisonHead> findByDivisionId(Long divisionId);
    List<QuoteComparisonHead> findByRfqId(Long rfqId);
    QuoteComparisonHead findByComparisonNoAndVersion(String comparisonNo, Integer version);
}

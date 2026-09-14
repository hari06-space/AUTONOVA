package com.autonoma.erp.repository;

import com.autonoma.erp.model.QuoteComparisonTrans;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuoteComparisonTransRepository extends JpaRepository<QuoteComparisonTrans, Long> {
    List<QuoteComparisonTrans> findByComparisonHeadId(Long comparisonHeadId);
    void deleteByComparisonHeadId(Long comparisonHeadId);
}

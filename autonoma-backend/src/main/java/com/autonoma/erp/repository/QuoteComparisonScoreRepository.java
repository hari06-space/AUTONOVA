package com.autonoma.erp.repository;

import com.autonoma.erp.model.QuoteComparisonScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuoteComparisonScoreRepository extends JpaRepository<QuoteComparisonScore, Long> {
    List<QuoteComparisonScore> findByComparisonHeadId(Long comparisonHeadId);
}

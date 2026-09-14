package com.autonoma.erp.repository;

import com.autonoma.erp.model.QuoteComparisonLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuoteComparisonLogRepository extends JpaRepository<QuoteComparisonLog, Long> {
    List<QuoteComparisonLog> findByComparisonHeadIdOrderByEventDateDesc(Long comparisonHeadId);
}

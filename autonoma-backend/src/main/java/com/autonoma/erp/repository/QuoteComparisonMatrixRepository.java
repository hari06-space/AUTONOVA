package com.autonoma.erp.repository;

import com.autonoma.erp.model.QuoteComparisonMatrix;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuoteComparisonMatrixRepository extends JpaRepository<QuoteComparisonMatrix, Long> {
    List<QuoteComparisonMatrix> findByComparisonHeadId(Long comparisonHeadId);
}

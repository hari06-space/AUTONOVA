package com.autonoma.erp.repository;

import com.autonoma.erp.model.ComparisonDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComparisonDecisionRepository extends JpaRepository<ComparisonDecision, Long> {
    Optional<ComparisonDecision> findByRfqHeadId(Long rfqHeadId);
    boolean existsByRfqHeadId(Long rfqHeadId);
}

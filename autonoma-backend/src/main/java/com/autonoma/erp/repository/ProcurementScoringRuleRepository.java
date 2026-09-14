package com.autonoma.erp.repository;

import com.autonoma.erp.model.ProcurementScoringRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcurementScoringRuleRepository extends JpaRepository<ProcurementScoringRule, Long> {
    List<ProcurementScoringRule> findByCategoryIdAndActiveStatus(Long categoryId, Integer activeStatus);
}

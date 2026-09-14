package com.autonoma.erp.modules.qmc.aql.repository;

import com.autonoma.erp.modules.qmc.aql.entity.AqlSamplingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AqlSamplingRuleRepository extends JpaRepository<AqlSamplingRule, Long> {
    
    List<AqlSamplingRule> findByAqlMasterId(Long aqlMasterId);
}

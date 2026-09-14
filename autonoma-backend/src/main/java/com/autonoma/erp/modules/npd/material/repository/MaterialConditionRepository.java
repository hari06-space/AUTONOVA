package com.autonoma.erp.modules.npd.material.repository;

import com.autonoma.erp.modules.npd.material.entity.MaterialCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MaterialConditionRepository extends JpaRepository<MaterialCondition, String> {
    java.util.List<MaterialCondition> findByConditionIgnoreCase(String name);
}

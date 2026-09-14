package com.autonoma.erp.repository.ai;

import com.autonoma.erp.model.ai.BosAiKnowledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BosAiKnowledgeRepository extends JpaRepository<BosAiKnowledge, Long> {

    List<BosAiKnowledge> findByIsActiveTrue();

    List<BosAiKnowledge> findByModuleNameIgnoreCaseAndIsActiveTrue(String moduleName);

    List<BosAiKnowledge> findByTableNameIgnoreCaseAndIsActiveTrue(String tableName);
}

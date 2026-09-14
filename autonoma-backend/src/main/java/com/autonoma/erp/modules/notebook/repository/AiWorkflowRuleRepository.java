package com.autonoma.erp.modules.notebook.repository;

import com.autonoma.erp.modules.notebook.entity.AiWorkflowRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AiWorkflowRuleRepository extends JpaRepository<AiWorkflowRule, Long> {
    List<AiWorkflowRule> findByNotebookIdAndActiveStatus(Long notebookId, String activeStatus);
    List<AiWorkflowRule> findByTriggerTypeAndActiveStatus(String triggerType, String activeStatus);
}

package com.autonoma.erp.repository.purchase.workflow;

import com.autonoma.erp.model.purchase.workflow.ProcurementWorkflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcurementWorkflowRepository extends JpaRepository<ProcurementWorkflow, Long> {
    
    List<ProcurementWorkflow> findByDivisionIdOrderBySequenceAsc(Long divisionId);
    
    Optional<ProcurementWorkflow> findByDivisionIdAndStepCode(Long divisionId, String stepCode);
}

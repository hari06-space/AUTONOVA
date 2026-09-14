package com.autonoma.erp.service.purchase.workflow;

import com.autonoma.erp.model.purchase.workflow.ProcurementWorkflow;
import com.autonoma.erp.repository.purchase.workflow.ProcurementWorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProcurementWorkflowEngine {

    private final ProcurementWorkflowRepository workflowRepository;

    @Autowired
    public ProcurementWorkflowEngine(ProcurementWorkflowRepository workflowRepository) {
        this.workflowRepository = workflowRepository;
    }

    /**
     * Retrieves the complete ordered workflow for a specific division.
     */
    public List<ProcurementWorkflow> getWorkflow(Long divisionId) {
        return workflowRepository.findByDivisionIdOrderBySequenceAsc(divisionId);
    }

    /**
     * Gets a specific workflow step by division and step code.
     */
    public ProcurementWorkflow getStep(Long divisionId, String stepCode) {
        return workflowRepository.findByDivisionIdAndStepCode(divisionId, stepCode)
                .orElseThrow(() -> new IllegalArgumentException("Workflow step not configured: " + stepCode));
    }

    /**
     * Determines the next step dynamically based on conditions and skips.
     * Currently a simple linear implementation. To be enhanced with expression language for CONDITION_EXPRESSION.
     */
    public ProcurementWorkflow getNextStep(Long divisionId, String currentStepCode, boolean isSuccess) {
        ProcurementWorkflow currentStep = getStep(divisionId, currentStepCode);
        
        String nextStepCode = isSuccess ? currentStep.getOnSuccess() : currentStep.getOnFailure();
        
        if (nextStepCode == null) {
            nextStepCode = currentStep.getNextStep(); // Fallback to linear next step
        }
        
        if (nextStepCode == null || nextStepCode.isEmpty()) {
            return null; // End of workflow
        }

        ProcurementWorkflow nextStep = getStep(divisionId, nextStepCode);

        // If the next step is not enabled, we recursively find the next one
        if (nextStep.getEnabled() == 0) {
            return getNextStep(divisionId, nextStepCode, true); 
        }

        return nextStep;
    }

    /**
     * Validates if transition from current to target step is allowed.
     */
    public boolean validateTransition(Long divisionId, String currentStepCode, String targetStepCode) {
        // Validate if target step is reachable from current step
        ProcurementWorkflow nextStep = getNextStep(divisionId, currentStepCode, true);
        if (nextStep != null && nextStep.getStepCode().equalsIgnoreCase(targetStepCode)) {
            return true;
        }

        // Check failure path
        ProcurementWorkflow failStep = getNextStep(divisionId, currentStepCode, false);
        if (failStep != null && failStep.getStepCode().equalsIgnoreCase(targetStepCode)) {
            return true;
        }

        // Allow skips if configured
        ProcurementWorkflow currentStep = getStep(divisionId, currentStepCode);
        if (currentStep.getSkipAllowed() == 1) {
            ProcurementWorkflow skipNextStep = getNextStep(divisionId, nextStep.getStepCode(), true);
            if (skipNextStep != null && skipNextStep.getStepCode().equalsIgnoreCase(targetStepCode)) {
                return true;
            }
        }
        
        return false;
    }
}

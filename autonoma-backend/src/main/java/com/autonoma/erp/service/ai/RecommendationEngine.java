package com.autonoma.erp.service.ai;

import org.springframework.stereotype.Service;

@Service
public class RecommendationEngine {

    /**
     * Level 5 AI Intelligence.
     * Takes the final answer generated and appends actionable ERP links or suggestions.
     * Example: "How can I improve revenue?" -> Returns text + "Suggested Action: Review Open Invoices [Link]"
     */
    public String appendRecommendations(String aiAnswer, String module, String intent) {
        if ("ACTION".equalsIgnoreCase(intent)) {
            return aiAnswer; // Don't append if user already requested an action
        }
        
        // Pseudo-code implementation. In reality, uses RAG or LLM structure.
        StringBuilder recommendations = new StringBuilder(aiAnswer);
        
        if ("SALES".equalsIgnoreCase(module)) {
            recommendations.append("\n\n**AURA Recommendation:** You have 5 high-value quotations pending approval. Reviewing them could accelerate revenue capture.");
        } else if ("INVENTORY".equalsIgnoreCase(module)) {
            recommendations.append("\n\n**AURA Recommendation:** Several fast-moving items are below reorder level. Would you like me to generate a Purchase Request draft?");
        }
        
        return recommendations.toString();
    }
}

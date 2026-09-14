package com.autonoma.erp.service.ai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ConversationMemoryManager {

    @Autowired
    private AiConversationService conversationService;

    /**
     * Retrieves recent conversation history and applies coreference resolution to understand context.
     * e.g., "Why did it drop?" -> "Why did sales drop?"
     */
    public String resolveContextualQuery(String userId, String sessionId, String currentQuestion) {
        List<Map<String, String>> history = conversationService.getHistoryForContext(userId, sessionId);
        
        if (history.isEmpty()) {
            return currentQuestion;
        }

        // Logic for Coreference Resolution using LLM
        // In a full implementation, we pass the history + current question to an LLM to rewrite the query.
        // For this architectural scaffolding, we append the last context module.
        String lastModule = history.get(history.size() - 1).getOrDefault("module", "");
        
        if (currentQuestion.toLowerCase().contains("it") || currentQuestion.toLowerCase().contains("they") || currentQuestion.toLowerCase().contains("why")) {
            return "[Context: " + lastModule + "] " + currentQuestion;
        }
        
        return currentQuestion;
    }
}

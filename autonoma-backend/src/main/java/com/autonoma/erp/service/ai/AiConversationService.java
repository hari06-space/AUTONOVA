package com.autonoma.erp.service.ai;

import com.autonoma.erp.model.ai.BosAiConversation;
import com.autonoma.erp.repository.ai.BosAiConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Manages AI conversation history: saving, retrieving, and clearing.
 */
@Service
public class AiConversationService {

    @Autowired
    private BosAiConversationRepository conversationRepository;

    private static final int MAX_HISTORY_FOR_CONTEXT = 10; // last N turns

    /**
     * Save a completed conversation turn.
     */
    public BosAiConversation saveConversation(
            String userId,
            String sessionId,
            String question,
            String answer,
            String languageCode,
            String intentType,
            String modulesAccessed,
            String queryExecuted,
            boolean reportGenerated,
            boolean forecastGenerated,
            String responseType) {

        BosAiConversation conv = new BosAiConversation();
        conv.setUserId(userId != null ? userId : "UNKNOWN");
        conv.setSessionId(sessionId != null ? sessionId : "UNKNOWN_SESSION");
        conv.setQuestion(question);
        conv.setAnswer(answer);
        conv.setLanguageCode(languageCode != null ? languageCode : "EN");
        conv.setIntentType(intentType);
        conv.setModulesAccessed(modulesAccessed);
        conv.setQueryExecuted(queryExecuted);
        conv.setReportGenerated(reportGenerated);
        conv.setForecastGenerated(forecastGenerated);
        conv.setResponseType(responseType != null ? responseType : "TEXT");

        return conversationRepository.save(conv);
    }

    /**
     * Get recent conversation history formatted as Groq message list.
     */
    public List<Map<String, String>> getHistoryForContext(String userId, String sessionId) {
        List<BosAiConversation> history;
        if (sessionId != null && !sessionId.isBlank()) {
            history = conversationRepository.findByUserIdAndSessionIdOrderByCreatedDateAsc(userId, sessionId);
        } else {
            // Fall back to recent user history
            List<BosAiConversation> all = conversationRepository.findByUserIdOrderByCreatedDateDesc(userId);
            history = new ArrayList<>(all.subList(0, Math.min(MAX_HISTORY_FOR_CONTEXT, all.size())));
            Collections.reverse(history);
        }

        List<Map<String, String>> messages = new ArrayList<>();
        int startIdx = Math.max(0, history.size() - MAX_HISTORY_FOR_CONTEXT);
        for (BosAiConversation conv : history.subList(startIdx, history.size())) {
            messages.add(Map.of("role", "user", "content", conv.getQuestion()));
            if (conv.getAnswer() != null && !conv.getAnswer().isBlank()) {
                messages.add(Map.of("role", "assistant", "content", conv.getAnswer()));
            }
        }
        return messages;
    }

    /**
     * Get full conversation history for display in the UI.
     */
    public List<BosAiConversation> getConversationHistory(String userId) {
        return conversationRepository.findByUserIdOrderByCreatedDateDesc(userId);
    }

    /**
     * Clear all conversations for a user.
     */
    @Transactional
    public void clearHistory(String userId) {
        conversationRepository.deleteByUserId(userId);
    }
}

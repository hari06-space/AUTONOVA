package com.autonoma.erp.service.ai.agent;

import com.autonoma.erp.service.ai.AiQueryBuilderService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class SalesAgent extends BaseAiAgent {

    @Override
    public boolean canHandle(String intent, String module) {
        return "SALES".equalsIgnoreCase(module) || "CRM".equalsIgnoreCase(module);
    }

    @Override
    protected Map<String, Object> handleIntent(String userId, String tenantId, String sessionId, String question, String intent, String module, String languageCode) {
        List<Map<String, String>> history = conversationService.getHistoryForContext(userId, sessionId);
        String systemPrompt = buildSystemPrompt(userId, module, intent, languageCode, "Sales & CRM Agent");
        
        AiQueryBuilderService.QueryResult queryResult = null;
        String enrichedQuestion = question;
        String responseType = "TEXT";

        if ("QUERY".equals(intent) || "REPORT".equals(intent)) {
            queryResult = queryBuilder.buildAndExecute(question, module, userId);
            if (!queryResult.success()) {
                String errorMsg = queryResult.errorMessage();
                return buildResponse(errorMsg != null ? errorMsg : "Error processing sales data", "TEXT", languageCode, intent, module, null, false, false);
            } else if (!queryResult.rows().isEmpty()) {
                enrichedQuestion = buildEnrichedQuestion(question, queryResult);
                responseType = "TABLE";
            }
        }

        String aiAnswer = geminiService.generateResponseWithHistory(systemPrompt, history, enrichedQuestion, 0.7, 1500);

        conversationService.saveConversation(
            userId, sessionId, question, aiAnswer, languageCode,
            intent, null, queryResult != null && queryResult.success() ? "NativeQuery:" + queryResult.tableName() : null,
            "REPORT".equals(intent), false, responseType
        );

        return buildResponse(aiAnswer, responseType, languageCode, intent, module, queryResult, "REPORT".equals(intent), false);
    }
}

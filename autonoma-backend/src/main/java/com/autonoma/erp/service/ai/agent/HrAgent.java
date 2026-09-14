package com.autonoma.erp.service.ai.agent;

import com.autonoma.erp.service.ai.AiQueryBuilderService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class HrAgent extends BaseAiAgent {

    @Override
    public boolean canHandle(String intent, String module) {
        return "HR".equalsIgnoreCase(module) || "ATTENDANCE".equalsIgnoreCase(module) || "PAYROLL".equalsIgnoreCase(module);
    }

    @Override
    protected Map<String, Object> handleIntent(String userId, String tenantId, String sessionId, String question, String intent, String module, String languageCode) {
        
        // ── Step 1: Load conversation history ─────────────────────────────
        List<Map<String, String>> history = conversationService.getHistoryForContext(userId, sessionId);

        // ── Step 2: Build AI system prompt ────────────────────────────────
        String systemPrompt = buildSystemPrompt(userId, module, intent, languageCode, "HR & Payroll Agent");

        // ── Step 3: Query data if needed ──────────────────────────────────
        AiQueryBuilderService.QueryResult queryResult = null;
        String enrichedQuestion = question;
        String responseType = "TEXT";

        if ("QUERY".equals(intent) || "REPORT".equals(intent)) {
            queryResult = queryBuilder.buildAndExecute(question, module, userId);
            if (!queryResult.success()) {
                String errorMsg = queryResult.errorMessage();
                // Show the raw error message to help debug
                return buildResponse("Error: " + errorMsg, "TEXT", languageCode, intent, module, null, false, false);
            } else if (queryResult.rows().isEmpty()) {
                enrichedQuestion = "The user asked: '" + question + "'. You executed the query successfully, but no matching records were found in the database. Please inform the user politely that there is no data matching their request.";
                responseType = "TEXT";
            } else {
                enrichedQuestion = buildEnrichedQuestion(question, queryResult);
                responseType = "TABLE";
            }
        }

        // ── Step 4: Generate AI response ──────────────────────────────────
        String aiAnswer = geminiService.generateResponseWithHistory(systemPrompt, history, enrichedQuestion, 0.7, 1500);

        // ── Step 5: Save conversation ──────────────────────────────────────
        String pageCodes = null;
        try {
            pageCodes = String.join(",", accessService.validateAccess(userId, module).grantedPageCodes());
        } catch (Exception ignored) {}

        conversationService.saveConversation(
            userId, sessionId, question, aiAnswer, languageCode,
            intent, pageCodes,
            queryResult != null && queryResult.success() ? "NativeQuery:" + queryResult.tableName() : null,
            "REPORT".equals(intent), false, responseType
        );

        // ── Step 6: Build response ─────────────────────────────────────────
        return buildResponse(aiAnswer, responseType, languageCode, intent, module, queryResult, "REPORT".equals(intent), false);
    }
}

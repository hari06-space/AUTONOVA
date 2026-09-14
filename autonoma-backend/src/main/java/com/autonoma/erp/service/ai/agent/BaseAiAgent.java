package com.autonoma.erp.service.ai.agent;

import com.autonoma.erp.service.ai.AiAccessValidationService;
import com.autonoma.erp.service.ai.AiQueryBuilderService;
import com.autonoma.erp.service.ai.GeminiService;
import com.autonoma.erp.service.ai.AiConversationService;
import com.autonoma.erp.service.ai.InsightEngine;
import com.autonoma.erp.service.ai.BusinessAnalyzer;
import com.autonoma.erp.service.ai.RecommendationEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public abstract class BaseAiAgent implements AiAgent {

    @Autowired
    protected AiAccessValidationService accessService;

    @Autowired
    protected AiQueryBuilderService queryBuilder;

    @Autowired
    protected GeminiService geminiService;
    
    @Autowired
    protected AiConversationService conversationService;
    
    @Autowired
    protected InsightEngine insightEngine;
    
    @Autowired
    protected BusinessAnalyzer businessAnalyzer;
    
    @Autowired
    protected RecommendationEngine recommendationEngine;

    @Override
    public Map<String, Object> process(String userId, String tenantId, String sessionId, String question, String intent, String module, String languageCode) {
        // Validation check
        if (!intent.equals("GREETING") && !intent.equals("UNKNOWN")) {
            AiAccessValidationService.AccessResult access = accessService.validateAccess(userId, module);
            if (!access.allowed()) {
                return buildResponse(access.message(), "TEXT", languageCode, intent, module, null, false, false);
            }
        }

        return handleIntent(userId, tenantId, sessionId, question, intent, module, languageCode);
    }

    protected abstract Map<String, Object> handleIntent(String userId, String tenantId, String sessionId, String question, String intent, String module, String languageCode);

    protected String buildSystemPrompt(String userId, String module, String intent, String languageCode, String agentName) {
        return """
            You are AURA (Autonoma Unified Response Assistant), acting as the %s.
            You help users retrieve ERP data, generate reports, provide business insights, and answer questions.

            LANGUAGE RULES:
            - If Detected language is TA (Tamil), you MUST respond ONLY in proper Tamil script (e.g., தமிழ் எழுத்துக்களில்).
            - ABSOLUTELY DO NOT use Tanglish (Tamil written in English alphabets). Even if the user types in Tanglish, reply back in pure Tamil script.
            - ALL your responses (whether explaining data, answering queries, or casual chat) must be warm, natural, sweet, and conversational (like a friendly human colleague). Use appropriate emojis like 😊.
            - If the user asks casual greetings like "eppadi irukka" or "how are you", reply warmly and naturally in Tamil script using the User ID (e.g. "நான் நன்றாக இருக்கிறேன் [User ID] 😊 நீங்கள் எப்படி இருக்கிறீர்கள்?").
            - If Detected language is EN, respond in English with a similarly warm and helpful tone.
            - It is acceptable to mix common English ERP terms naturally, but the core sentences must follow the script of the detected language.
            - Detected language: %s

            CURRENT CONTEXT:
            - User ID: %s
            - Detected Module: %s
            - Intent: %s

            DATA RULES:
            - Only share data you have been provided in this conversation.
            - If data is empty, say so politely and suggest checking filters.
            - Format tables clearly. Numbers should be formatted with commas.

            RESPONSE FORMAT:
            - Keep responses concise (under 300 words unless showing a table).
            - For table data: present it clearly with proper headings.
            - End with a relevant follow-up suggestion ONLY if the user asked a business/ERP question. For casual greetings (How are you, Hi), just respond naturally and conversationally without any menus or suggestions.
            """.formatted(agentName, languageCode, userId, module, intent);
    }

    protected String buildEnrichedQuestion(String question, AiQueryBuilderService.QueryResult queryResult) {
        StringBuilder sb = new StringBuilder(question);
        sb.append("\n\n[DATA FROM ERP SYSTEM]\n");
        sb.append("Table: ").append(queryResult.tableName()).append("\n");
        sb.append("Records found: ").append(queryResult.rowCount()).append("\n");

        sb.append(String.join(" | ", queryResult.headers())).append("\n");
        sb.append("-".repeat(60)).append("\n");

        List<List<Object>> rows = queryResult.rows();
        int limit = Math.min(10, rows.size());
        for (int i = 0; i < limit; i++) {
            List<Object> row = rows.get(i);
            sb.append(row.stream()
                .map(v -> v != null ? v.toString() : "-")
                .collect(Collectors.joining(" | ")));
            sb.append("\n");
        }
        if (rows.size() > limit) {
            sb.append("... and ").append(rows.size() - limit).append(" more records.\n");
        }
        
        // Level 2 Intelligence: Analytics
        String analytics = insightEngine.generateAnalyticsSummary(rows, queryResult.headers(), "GENERAL");
        sb.append(analytics);

        sb.append("\nUsing the data above, please answer the user's original question directly and concisely. Do not summarize the entire table unless explicitly asked. Focus only on the information requested.");
        return sb.toString();
    }

    protected Map<String, Object> buildResponse(
            String answer, String responseType, String languageCode,
            String intent, String module,
            AiQueryBuilderService.QueryResult queryResult,
            boolean reportAvailable, boolean forecastAvailable) {

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("answer", answer);
        response.put("responseType", responseType);
        response.put("languageCode", languageCode);
        response.put("intent", intent);
        response.put("module", module);
        response.put("reportAvailable", reportAvailable);
        response.put("forecastAvailable", forecastAvailable);
        response.put("timestamp", new Date().toString());

        if (queryResult != null && queryResult.success()) {
            Map<String, Object> tableData = new LinkedHashMap<>();
            tableData.put("headers", queryResult.headers());
            tableData.put("rows", queryResult.rows());
            tableData.put("rowCount", queryResult.rowCount());
            tableData.put("tableName", queryResult.tableName());
            response.put("tableData", tableData);
        }

        return response;
    }
}

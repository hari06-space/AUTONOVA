package com.autonoma.erp.controller.ai;

import com.autonoma.erp.service.ai.AiAccessValidationService;
import com.autonoma.erp.service.ai.AiConversationService;
import com.autonoma.erp.service.ai.AiQueryBuilderService;
import com.autonoma.erp.service.ai.ForecastEngineService;
import com.autonoma.erp.service.ai.GeminiService;
import com.autonoma.erp.service.ai.IntentDetectionService;
import com.autonoma.erp.service.ai.LanguageDetectionService;
import com.autonoma.erp.service.ai.agent.AgentOrchestrator;

import com.autonoma.erp.model.ai.BosAiConversation;
import com.autonoma.erp.service.ai.*;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Main Autonoma AI Chat API Controller.
 *
 * Endpoints:
 *   POST   /api/ai/chat                  – Send a message to Autonoma AI
 *   GET    /api/ai/conversations         – Retrieve conversation history
 *   DELETE /api/ai/conversations         – Clear conversation history
 *   GET    /api/ai/suggestions           – Get suggested prompts for the user
 *   GET    /api/ai/health                – Health check
 */
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    @Autowired private GeminiService geminiService;
    @Autowired private LanguageDetectionService languageService;
    @Autowired private IntentDetectionService intentService;
    @Autowired private AiAccessValidationService accessService;
    @Autowired private AiQueryBuilderService queryBuilder;
    @Autowired private AiConversationService conversationService;
    @Autowired private ForecastEngineService forecastEngineService;
    @Autowired private com.autonoma.erp.service.ai.agent.AgentOrchestrator agentOrchestrator;

    // ============================|| MAIN CHAT ||============================

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> request) {
        String userId    = SecurityUtils.getCurrentUserId();
        String question  = (String) request.getOrDefault("question", "");
        String sessionId = (String) request.getOrDefault("sessionId", null);

        if (question == null || question.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question cannot be empty"));
        }

        // Delegate entire execution to the Agent Orchestrator
        Map<String, Object> response = agentOrchestrator.routeRequest(userId, sessionId, question);

        return ResponseEntity.ok(response);
    }

    // ============================|| VOICE ||============================

    @PostMapping(value = "/transcribe", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> transcribeAudio(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "language", required = false) String language) {
        try {
            byte[] audioBytes = file.getBytes();
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "audio.webm";
            String transcript = geminiService.transcribeAudio(audioBytes, filename, language);
            return ResponseEntity.ok(Map.of("transcript", transcript));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Transcription failed: " + e.getMessage()));
        }
    }

    // ============================|| HISTORY ||============================

    @GetMapping("/conversations")
    public ResponseEntity<List<BosAiConversation>> getConversations() {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(conversationService.getConversationHistory(userId));
    }

    @DeleteMapping("/conversations")
    public ResponseEntity<Map<String, String>> clearConversations() {
        String userId = SecurityUtils.getCurrentUserId();
        conversationService.clearHistory(userId);
        return ResponseEntity.ok(Map.of("message", "Conversation history cleared."));
    }

    // ============================|| SUGGESTIONS ||============================

    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> getSuggestions() {
        String userId = SecurityUtils.getCurrentUserId();
        List<String> accessible = accessService.getAccessibleModules(userId);

        List<String> suggestions = new ArrayList<>();

        // Module-specific suggestions based on access
        Map<String, List<String>> moduleSuggestions = Map.of(
            "HR",      List.of("Show active employees", "Show department wise employee count", "Show employees who joined this month"),
            "QMS",     List.of("Show pending checklists", "Show open NCR items", "Show upcoming audit schedules"),
            "SALES",   List.of("Show recent enquiries", "Show pending quotations", "Show top customers"),
            "TASK",    List.of("Show my pending tasks", "Show overdue tasks", "Show high priority tasks"),
            "CRM",     List.of("Show customer list", "Show recent customer contacts"),
            "VENDOR",  List.of("Show vendor list"),
            "HRA",     List.of("Show pending induction assignments"),
            "FORECAST",List.of("Predict next month sales", "Forecast inventory shortages", "Predict attrition risk")
        );

        // Get recent conversation history to prioritize suggestions
        List<BosAiConversation> history = conversationService.getConversationHistory(userId);
        List<String> recentModules = history.stream()
            .map(BosAiConversation::getModulesAccessed)
            .filter(m -> m != null && !m.isBlank() && accessible.contains(m))
            .distinct()
            .limit(3)
            .collect(Collectors.toList());

        // 1. Add suggestions from recently used modules
        for (String module : recentModules) {
            List<String> moduleSugg = moduleSuggestions.get(module);
            if (moduleSugg != null) {
                suggestions.addAll(moduleSugg);
            }
        }

        // 2. Backfill with other accessible modules
        for (String module : accessible) {
            if (!recentModules.contains(module)) {
                List<String> moduleSugg = moduleSuggestions.get(module);
                if (moduleSugg != null && !moduleSugg.isEmpty()) {
                    suggestions.add(moduleSugg.get(0)); // Add just the first suggestion from other modules
                }
            }
        }

        // 3. Always include forecast and general suggestions as fallback
        if (suggestions.size() < 6) {
            suggestions.add("Predict next month revenue");
            suggestions.add("Generate sales summary report");
            suggestions.add("Show my pending approvals");
        }

        return ResponseEntity.ok(suggestions.stream().distinct().limit(8).collect(Collectors.toList()));
    }

    // ============================|| HEALTH ||============================

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "OK",
            "service", "Autonoma AI",
            "version", "1.0"
        ));
    }

    // ============================|| HELPERS ||============================

    private String buildSystemPrompt(String userId, IntentDetectionService.IntentResult intent,
                                     String languageCode, String bcp47) {
        return """
            You are AURA (Autonoma Unified Response Assistant), the intelligent AI assistant for BOSS ERP (Business Operating System).
            You help users retrieve ERP data, generate reports, provide business insights, and answer questions.

            PERSONALITY:
            - Professional, friendly, and concise.
            - Always helpful and proactive in suggesting next steps.

            LANGUAGE RULES:
            - Respond in the SAME language as the user's message.
            - Detected language: %s (BCP-47: %s)
            - If responding in Tamil, provide highly fluent, natural, and grammatically correct Tamil. Avoid robotic or literal translations. Write exactly like a professional native speaker.
            - It is acceptable to mix common English ERP terms (Task, Dashboard, Employee) naturally within the Tamil text.

            CURRENT CONTEXT:
            - User ID: %s
            - Detected Module: %s
            - Intent: %s

            DATA RULES:
            - Only share data you have been provided in this conversation.
            - If data is empty, say so politely and suggest checking filters.
            - Format tables clearly. Numbers should be formatted with commas.
            - For dates, use DD-MMM-YYYY format.

            RESPONSE FORMAT:
            - Keep responses concise (under 300 words unless showing a table).
            - For table data: present it clearly with proper headings.
            - End with a relevant follow-up suggestion when helpful.
            """.formatted(languageCode, bcp47, userId, intent.module(), intent.intent());
    }

    private String buildEnrichedQuestion(String question, AiQueryBuilderService.QueryResult queryResult) {
        StringBuilder sb = new StringBuilder(question);
        sb.append("\n\n[DATA FROM ERP SYSTEM]\n");
        sb.append("Table: ").append(queryResult.tableName()).append("\n");
        sb.append("Records found: ").append(queryResult.rowCount()).append("\n");

        // Headers
        sb.append(String.join(" | ", queryResult.headers())).append("\n");
        sb.append("-".repeat(60)).append("\n");

        // Data rows (limit to 20 for prompt size)
        List<List<Object>> rows = queryResult.rows();
        int limit = Math.min(20, rows.size());
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

        sb.append("\nUsing the data above, please answer the user's original question directly and concisely. Do not summarize the entire table unless explicitly asked. Focus only on the information requested.");
        return sb.toString();
    }

    private Map<String, Object> buildResponse(
            String answer, String responseType, String languageCode,
            String intent, String module,
            AiQueryBuilderService.QueryResult queryResult,
            ForecastEngineService.ForecastResult forecastResult,
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

        if (forecastResult != null && forecastResult.success()) {
            response.put("forecastData", forecastResult);
            response.put("forecastAvailable", true);
        }

        return response;
    }
}

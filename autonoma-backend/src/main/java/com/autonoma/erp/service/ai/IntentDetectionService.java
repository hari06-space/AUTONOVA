package com.autonoma.erp.service.ai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Detects the user's intent from their natural-language query.
 *
 * Intent types:
 *   QUERY       – retrieve/show data
 *   REPORT      – generate a file (Excel/PDF/Word)
 *   FORECAST    – predictive analytics
 *   RECOMMENDATION – suggest actions
 *   ACTION      – create/update/approve records (Phase 5)
 *   GREETING    – hello/hi/general conversation
 *   UNKNOWN     – cannot classify
 */
@Service
public class IntentDetectionService {

    @Autowired
    private GeminiService geminiService;

    private static final String SYSTEM_PROMPT =
        "You are an ERP assistant intent classifier. Analyze the user's message and return ONLY a JSON object:\n" +
        "{\n" +
        "  \"intent\": \"QUERY|REPORT|FORECAST|RECOMMENDATION|ACTION|GREETING|KNOWLEDGE_QUERY|UNKNOWN\",\n" +
        "  \"module\": \"HR|QMS|SALES|FINANCE|INVENTORY|TASK|CRM|VENDOR|NPD|GENERAL\",\n" +
        "  \"confidence\": 0.0-1.0,\n" +
        "  \"keywords\": [\"keyword1\",\"keyword2\"]\n" +
        "}\n\n" +
        "Rules:\n" +
        "- 'show', 'list', 'get', 'display', 'tell me', 'how many', 'evalvu', 'paathu sollu', 'kaattu', 'iruku', 'irukku' → QUERY\n" +
        "- 'audit', 'audits', 'checklist', 'ncr', 'meeting', 'mom', 'inspection' → QMS module\n" +
        "- 'employee', 'staff', 'salary', 'attendance', 'leave', 'joining' → HR module\n" +
        "- 'sales', 'quotation', 'enquiry', 'customer', 'order' → SALES module\n" +
        "- 'task', 'velai', 'ticket' → TASK module\n" +
        "- 'inventory', 'stock', 'item', 'material' → INVENTORY module\n" +
        "- 'vendor', 'supplier' → VENDOR module\n" +
        "- 'generate report', 'download', 'export', 'create report' → REPORT\n" +
        "- 'predict', 'forecast', 'estimate', 'next month', 'trend' → FORECAST\n" +
        "- 'recommend', 'suggest', 'advise', 'what should' → RECOMMENDATION\n" +
        "- 'create', 'add', 'approve', 'assign', 'update' → ACTION\n" +
        "- 'how to', 'explain', 'what is the flow', 'how does', 'page pathi', 'flow pathi', 'how do i', 'details about', 'project', 'application', 'about the project', 'எக்ஸ்பிளைன்', 'விளக்கு', 'explain pannu', 'summary', 'page' → KNOWLEDGE_QUERY\n" +
        "- 'hello', 'hi', 'hii', 'hey', 'help', 'vanakkam', 'namaste', 'how are you', 'good morning', 'what can you do' → GREETING\n" +
        "Return ONLY the JSON object.";

    public IntentResult detectIntent(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return new IntentResult("UNKNOWN", "GENERAL", 0.0);
        }

        String lower = userMessage.trim().toLowerCase();
        // Fast path for simple greetings
        if (lower.equals("hi") || lower.equals("hello") || lower.equals("hey") || lower.equals("hii") ||
            lower.equals("vanakkam") || lower.contains("how are you") || lower.contains("eppadi iruk") ||
            lower.equals("good morning") || lower.equals("good afternoon") || lower.equals("good evening")) {
            return new IntentResult("GREETING", "GENERAL", 0.99);
        }

        // Fast path for module detection
        String fastModule = null;
        if (lower.contains("audit") || lower.contains("ncr") || lower.contains("checklist") || lower.contains("mom") || lower.contains("meeting")) {
            fastModule = "QMS";
        } else if (lower.contains("employee") || lower.contains("staff") || lower.contains("salary") || lower.contains("attendance") || lower.contains("leave")) {
            fastModule = "HR";
        } else if (lower.contains("sales") || lower.contains("quotation") || lower.contains("enquiry") || lower.contains("customer") || lower.contains("order")) {
            fastModule = "SALES";
        } else if (lower.contains("task") || lower.contains("ticket") || lower.contains("velai")) {
            fastModule = "TASK";
        } else if (lower.contains("stock") || lower.contains("inventory") || lower.contains("item") || lower.contains("material")) {
            fastModule = "INVENTORY";
        } else if (lower.contains("vendor") || lower.contains("supplier")) {
            fastModule = "VENDOR";
        }

        try {
            String raw = geminiService.generateStructuredResponse(SYSTEM_PROMPT, userMessage);
            IntentResult result = parseIntentResult(raw);
            if (fastModule != null && "GENERAL".equalsIgnoreCase(result.module())) {
                return new IntentResult(result.intent(), fastModule, Math.max(result.confidence(), 0.85));
            }
            return result;
        } catch (Exception e) {
            String module = fastModule != null ? fastModule : "GENERAL";
            return new IntentResult("QUERY", module, 0.5);
        }
    }

    private IntentResult parseIntentResult(String json) {
        try {
            String cleaned = json.trim();
            if (cleaned.contains("```json")) {
                int start = cleaned.indexOf("```json") + 7;
                int end = cleaned.lastIndexOf("```");
                if (end > start) cleaned = cleaned.substring(start, end).trim();
            } else if (cleaned.contains("```")) {
                int start = cleaned.indexOf("```") + 3;
                int end = cleaned.lastIndexOf("```");
                if (end > start) cleaned = cleaned.substring(start, end).trim();
            }

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(cleaned);
            
            String intent = root.has("intent") ? root.get("intent").asText("QUERY").toUpperCase() : "QUERY";
            String module = root.has("module") ? root.get("module").asText("GENERAL").toUpperCase() : "GENERAL";
            double confidence = root.has("confidence") ? root.get("confidence").asDouble(0.5) : 0.5;

            return new IntentResult(intent, module, confidence);
        } catch (Exception e) {
            System.err.println("Intent parsing failed for: " + json);
            return new IntentResult("QUERY", "GENERAL", 0.5);
        }
    }

    private String extractJsonString(String json, String key) {
        int keyIdx = json.indexOf("\"" + key + "\"");
        if (keyIdx < 0) return null;
        int colon = json.indexOf(':', keyIdx);
        int q1 = json.indexOf('"', colon + 1);
        int q2 = json.indexOf('"', q1 + 1);
        if (q1 < 0 || q2 <= q1) return null;
        return json.substring(q1 + 1, q2);
    }

    private double extractJsonDouble(String json, String key) {
        int keyIdx = json.indexOf("\"" + key + "\"");
        if (keyIdx < 0) return 0.5;
        int colon = json.indexOf(':', keyIdx);
        int end = json.indexOf(',', colon);
        if (end < 0) end = json.indexOf('}', colon);
        if (colon < 0 || end < 0) return 0.5;
        try {
            return Double.parseDouble(json.substring(colon + 1, end).trim());
        } catch (NumberFormatException e) {
            return 0.5;
        }
    }

    /**
     * Result DTO for intent detection.
     */
    public record IntentResult(String intent, String module, double confidence) {}
}

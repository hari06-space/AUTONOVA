package com.autonoma.erp.service.ai;

import com.autonoma.erp.model.ai.BosAiForecastHistory;
import com.autonoma.erp.repository.ai.BosAiForecastHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Orchestrates AI-driven forecasting and predictive analytics.
 *
 * Supported forecast types:
 *   SALES      – Revenue, enquiry, quotation trends
 *   INVENTORY  – Stock movement, reorder prediction
 *   FINANCE    – Cash flow, receivables, payables
 *   HR         – Attrition risk, workforce trends
 *   TASK       – Project completion, overdue risk
 *   CUSTOM     – Dynamic user-defined forecasts
 */
@Service
public class ForecastEngineService {

    @Autowired private EntityManager entityManager;
    @Autowired private GeminiService geminiService;
    @Autowired private BosAiForecastHistoryRepository forecastRepo;
    @Autowired private AiAccessValidationService accessService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Run a forecast for the given type and user question.
     *
     * @param userId    Authenticated user
     * @param question  User's natural language forecast request
     * @param forecastType SALES / INVENTORY / FINANCE / HR / TASK / CUSTOM
     * @return ForecastResult with values, trend narrative, and confidence
     */
    public ForecastResult runForecast(String userId, String question, String forecastType) {
        // 1. Validate access
        String module = mapForecastTypeToModule(forecastType);
        AiAccessValidationService.AccessResult access = accessService.validateAccess(userId, module);
        if (!access.allowed()) {
            return ForecastResult.accessDenied(access.message());
        }

        // 2. Fetch historical data
        List<Map<String, Object>> historicalData = fetchHistoricalData(forecastType, userId);

        // 3. Build forecast prompt
        String forecastPrompt = buildForecastPrompt(question, forecastType, historicalData);

        // 4. Call AI for prediction
        String aiResponse = geminiService.generateResponseWithHistory(
            buildForecastSystemPrompt(),
            List.of(),
            forecastPrompt,
            0.3, // low temperature for more deterministic forecasts
            2000
        );

        // 5. Extract structured forecast data
        ForecastResult result = parseForecastResponse(aiResponse, forecastType, historicalData);

        // 6. Save to history
        saveForecastHistory(userId, forecastType, question, result);

        return result;
    }

    // ── Data fetchers ────────────────────────────────────────────────────

    private List<Map<String, Object>> fetchHistoricalData(String forecastType, String userId) {
        try {
            return switch (forecastType.toUpperCase()) {
                case "SALES"     -> fetchSalesData();
                case "INVENTORY" -> fetchInventoryData();
                case "HR"        -> fetchHrData();
                case "TASK"      -> fetchTaskData();
                default          -> List.of();
            };
        } catch (Exception e) {
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchSalesData() {
        String sql = """
            SELECT TOP 24
                YEAR(ENQ_DATE) as yr,
                MONTH(ENQ_DATE) as mo,
                COUNT(*) as enquiry_count,
                SUM(CASE WHEN ENQ_STATUS = 'CONVERTED' THEN 1 ELSE 0 END) as converted
            FROM SM_ENQUIRY
            WHERE ENQ_DATE >= DATEADD(MONTH, -24, GETDATE())
            GROUP BY YEAR(ENQ_DATE), MONTH(ENQ_DATE)
            ORDER BY yr, mo
            """;
        return executeToMapList(sql);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchInventoryData() {
        // Placeholder: inventory table not fully defined yet
        return List.of(Map.of("message", "Inventory module coming soon."));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchHrData() {
        String sql = """
            SELECT TOP 24
                YEAR(s.DATE_OF_JOINING) as yr,
                MONTH(s.DATE_OF_JOINING) as mo,
                COUNT(*) as new_hires,
                SUM(CASE WHEN e.IS_ACTIVE = 0 OR e.STATUS = (SELECT ID FROM AD_STATUS_MASTER WHERE UPPER(TRIM(NAME)) = 'INACTIVE') THEN 1 ELSE 0 END) as inactive
            FROM HR_EMPLOYEE e
            LEFT JOIN HR_EMPLOYEE_SCHEDULING s ON e.ID = s.EMPLOYEE_ID
            WHERE s.DATE_OF_JOINING >= DATEADD(MONTH, -24, GETDATE())
            GROUP BY YEAR(s.DATE_OF_JOINING), MONTH(s.DATE_OF_JOINING)
            ORDER BY yr, mo
            """;
        return executeToMapList(sql);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchTaskData() {
        String sql = """
            SELECT TOP 12
                YEAR(CREATED_DATE) as yr,
                MONTH(CREATED_DATE) as mo,
                COUNT(*) as total_tasks,
                SUM(CASE WHEN TASK_STATUS = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN DUE_DATE < GETDATE() AND TASK_STATUS != 'COMPLETED' THEN 1 ELSE 0 END) as overdue
            FROM BOS_TICKET_TRACEABILITY_CENTER
            WHERE CREATED_DATE >= DATEADD(MONTH, -12, GETDATE())
            GROUP BY YEAR(CREATED_DATE), MONTH(CREATED_DATE)
            ORDER BY yr, mo
            """;
        return executeToMapList(sql);
    }

    // ── Prompt builders ──────────────────────────────────────────────────

    private String buildForecastSystemPrompt() {
        return """
            You are Autonoma, an expert business intelligence and forecasting AI for BOSS ERP.
            You analyze historical ERP data and provide actionable predictive insights.

            FORECAST RESPONSE FORMAT (always return JSON):
            {
              "forecastTitle": "string",
              "summary": "2-3 sentence business summary",
              "trend": "UPWARD|DOWNWARD|STABLE|VOLATILE",
              "trendDescription": "detailed trend explanation",
              "predictions": [
                {"period": "Month-Year", "predicted_value": number, "confidence": 0.0-1.0}
              ],
              "insights": ["insight1", "insight2", "insight3"],
              "recommendations": ["action1", "action2"],
              "confidence_score": 0.0-1.0,
              "data_quality": "HIGH|MEDIUM|LOW"
            }
            Return ONLY the JSON. No markdown, no code fences.
            """;
    }

    private String buildForecastPrompt(String question, String forecastType, List<Map<String, Object>> data) {
        StringBuilder sb = new StringBuilder();
        sb.append("User request: ").append(question).append("\n");
        sb.append("Forecast type: ").append(forecastType).append("\n\n");

        if (!data.isEmpty()) {
            sb.append("Historical data from BOSS ERP (last 24 months):\n");
            try {
                sb.append(objectMapper.writeValueAsString(data));
            } catch (Exception e) {
                sb.append(data.toString());
            }
        } else {
            sb.append("Limited historical data available. Provide general business trend analysis.\n");
        }

        sb.append("\n\nProvide a 3-month forward forecast with trend analysis and business recommendations.");
        return sb.toString();
    }

    // ── Response parser ──────────────────────────────────────────────────

    private ForecastResult parseForecastResponse(String aiResponse, String forecastType,
                                                   List<Map<String, Object>> historicalData) {
        try {
            // Try to parse as JSON
            @SuppressWarnings("unchecked")
            Map<String, Object> parsed = objectMapper.readValue(aiResponse, Map.class);

            String title = (String) parsed.getOrDefault("forecastTitle", forecastType + " Forecast");
            String summary = (String) parsed.getOrDefault("summary", aiResponse);
            String trend = (String) parsed.getOrDefault("trend", "STABLE");
            String trendDesc = (String) parsed.getOrDefault("trendDescription", "");
            Double confidence = parsed.get("confidence_score") instanceof Number n
                ? n.doubleValue() : 0.7;

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> predictions =
                (List<Map<String, Object>>) parsed.getOrDefault("predictions", List.of());

            @SuppressWarnings("unchecked")
            List<String> insights = (List<String>) parsed.getOrDefault("insights", List.of());

            @SuppressWarnings("unchecked")
            List<String> recommendations = (List<String>) parsed.getOrDefault("recommendations", List.of());

            return new ForecastResult(true, title, summary, trend, trendDesc,
                predictions, insights, recommendations, confidence, historicalData, null);

        } catch (Exception e) {
            // AI returned plain text instead of JSON – wrap it
            return new ForecastResult(true, forecastType + " Analysis", aiResponse,
                "STABLE", "", List.of(), List.of(), List.of(), 0.6, historicalData, null);
        }
    }

    // ── Persistence ──────────────────────────────────────────────────────

    private void saveForecastHistory(String userId, String forecastType,
                                      String question, ForecastResult result) {
        try {
            BosAiForecastHistory history = new BosAiForecastHistory();
            history.setUserId(userId);
            history.setForecastType(forecastType);
            history.setInputParameters(question);
            history.setOutputJson(objectMapper.writeValueAsString(result));
            history.setConfidenceScore(result.confidenceScore());
            forecastRepo.save(history);
        } catch (Exception ignored) {}
    }

    private List<Map<String, Object>> executeToMapList(String sql) {
        try {
            @SuppressWarnings("unchecked")
            var results = entityManager.createNativeQuery(sql).getResultList();
            // Return as simple list of maps (column-named)
            return results.stream().map(row -> {
                Map<String, Object> map = new LinkedHashMap<>();
                if (row instanceof Object[] arr) {
                    map.put("data", Arrays.asList(arr));
                } else {
                    map.put("value", row);
                }
                return map;
            }).toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    private String mapForecastTypeToModule(String forecastType) {
        return switch (forecastType.toUpperCase()) {
            case "SALES"     -> "SALES";
            case "INVENTORY" -> "INVENTORY";
            case "FINANCE"   -> "FINANCE";
            case "HR"        -> "HR";
            case "TASK"      -> "TASK";
            default          -> "GENERAL";
        };
    }

    // ── Result DTO ───────────────────────────────────────────────────────

    public record ForecastResult(
        boolean success,
        String forecastTitle,
        String summary,
        String trend,
        String trendDescription,
        List<Map<String, Object>> predictions,
        List<String> insights,
        List<String> recommendations,
        double confidenceScore,
        List<Map<String, Object>> historicalData,
        String errorMessage
    ) {
        static ForecastResult accessDenied(String message) {
            return new ForecastResult(false, null, null, null, null,
                List.of(), List.of(), List.of(), 0.0, List.of(), message);
        }
    }
}

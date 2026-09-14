package com.autonoma.erp.controller.ai;

import com.autonoma.erp.model.ai.BosAiForecastHistory;
import com.autonoma.erp.repository.ai.BosAiForecastHistoryRepository;
import com.autonoma.erp.service.ai.ForecastEngineService;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Autonoma AI Forecast Controller.
 *
 * Endpoints:
 *   POST /api/ai/forecast         – Run a forecast
 *   GET  /api/ai/forecast/history – Get past forecasts
 *   GET  /api/ai/forecast/types   – Get available forecast types
 */
@RestController
@RequestMapping("/api/ai/forecast")
public class AiForecastController {

    @Autowired private ForecastEngineService forecastEngine;
    @Autowired private BosAiForecastHistoryRepository forecastRepo;

    /**
     * Run a forecast.
     *
     * Request body:
     * {
     *   "question": "Predict next month sales",
     *   "forecastType": "SALES"
     * }
     */
    @PostMapping
    public ResponseEntity<ForecastEngineService.ForecastResult> runForecast(
            @RequestBody Map<String, String> request) {

        String userId = SecurityUtils.getCurrentUserId();
        String question = request.getOrDefault("question", "Provide a business forecast");
        String forecastType = request.getOrDefault("forecastType", "SALES").toUpperCase();

        ForecastEngineService.ForecastResult result =
            forecastEngine.runForecast(userId, question, forecastType);

        if (!result.success() && result.errorMessage() != null) {
            return ResponseEntity.status(403).body(result);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Get past forecast history for the current user.
     */
    @GetMapping("/history")
    public ResponseEntity<List<BosAiForecastHistory>> getForecastHistory() {
        String userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(forecastRepo.findByUserIdOrderByCreatedDateDesc(userId));
    }

    /**
     * Get available forecast types (for UI display).
     */
    @GetMapping("/types")
    public ResponseEntity<List<Map<String, String>>> getForecastTypes() {
        List<Map<String, String>> types = List.of(
            Map.of("type", "SALES",     "label", "Sales Forecast",     "icon", "trending_up",    "description", "Predict revenue, enquiry and quotation trends"),
            Map.of("type", "INVENTORY", "label", "Inventory Forecast", "icon", "inventory_2",    "description", "Forecast stock shortages and reorder points"),
            Map.of("type", "FINANCE",   "label", "Finance Forecast",   "icon", "account_balance", "description", "Predict cash flow, receivables and payables"),
            Map.of("type", "HR",        "label", "HR Forecast",        "icon", "people",          "description", "Predict attrition risk and workforce trends"),
            Map.of("type", "TASK",      "label", "Task Forecast",      "icon", "task_alt",        "description", "Estimate project completion and overdue risk"),
            Map.of("type", "CUSTOM",    "label", "Custom Forecast",    "icon", "auto_graph",      "description", "Ask anything — Autonoma will find the right data")
        );
        return ResponseEntity.ok(types);
    }
}

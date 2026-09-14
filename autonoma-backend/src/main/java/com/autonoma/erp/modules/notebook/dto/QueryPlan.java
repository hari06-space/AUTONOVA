package com.autonoma.erp.modules.notebook.dto;

import java.util.List;
import java.util.Map;

/**
 * Output of AiQueryPlanner. Describes which tools to invoke.
 * Gemini never decides what data to fetch — the planner does.
 */
public record QueryPlan(
    List<ToolInvocation> toolCalls,
    List<String> securityNotices,
    String planSummary,
    boolean requiresDisambiguation,
    boolean isBlocked
) {
    public record ToolInvocation(String toolName, Map<String, Object> parameters, OperationType operation) {}

    public static QueryPlan blocked(String reason) {
        return new QueryPlan(List.of(), List.of(reason), "BLOCKED: " + reason, false, true);
    }
    public static QueryPlan injectionRefusal() {
        return blocked("I cannot comply with that request. Please ask a valid business question.");
    }
    public boolean isEmpty() { return toolCalls == null || toolCalls.isEmpty(); }
}

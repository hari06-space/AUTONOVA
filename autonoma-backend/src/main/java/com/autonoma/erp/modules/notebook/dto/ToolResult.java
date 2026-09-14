package com.autonoma.erp.modules.notebook.dto;

import java.util.Map;

/**
 * Structured result from every BosEntitySkill execution.
 *
 * Gemini receives this as a formatted JSON block — never raw text.
 * This prevents hallucination of counts, statuses, and trends.
 *
 * Status values:
 *  - PERMISSION_GRANTED  — data returned successfully
 *  - PERMISSION_DENIED   — user lacks access; errorMessage contains human-readable reason
 *  - NO_DATA             — access granted but no records matched query
 *  - ERROR               — unexpected execution error
 */
public record ToolResult(
    boolean success,
    String entity,           // "CHECKLIST", "EMPLOYEE", etc.
    String operation,        // "COUNT", "LIST", "PENDING", etc.
    String status,           // PERMISSION_GRANTED | PERMISSION_DENIED | NO_DATA | ERROR
    String summary,          // Human-readable label for the result set
    Long count,              // Populated for COUNT operations (e.g. 20437)
    Object data,             // Tabular or structured detail rows (String or Map)
    Map<String, Object> filters,  // Filters applied: {"company": 1, "status": "ALL", "empId": 42}
    String executionTime,
    String errorMessage
) {

    // ─── Factory Methods ──────────────────────────────────────────────────────

    /** COUNT result — e.g. "20,437 checklists in company" */
    public static ToolResult count(String entity, String operation, long n, Map<String, Object> filters) {
        return new ToolResult(true, entity, operation, "PERMISSION_GRANTED",
            entity + " Count", n, null, filters, "0ms", null);
    }

    /** LIST / DETAIL / SUMMARY result with tabular data */
    public static ToolResult of(String entity, String operation, String summary, Object data) {
        return new ToolResult(true, entity, operation, "PERMISSION_GRANTED",
            summary, null, data, Map.of(), "0ms", null);
    }

    /** LIST / DETAIL result with filters applied */
    public static ToolResult of(String entity, String operation, String summary, Object data, Map<String, Object> filters) {
        return new ToolResult(true, entity, operation, "PERMISSION_GRANTED",
            summary, null, data, filters, "0ms", null);
    }

    /**
     * Permission denied — clearly different from "no data".
     * errorMessage is shown to the user via Gemini.
     */
    public static ToolResult denied(String entity, String module) {
        return new ToolResult(false, entity, "BLOCKED", "PERMISSION_DENIED",
            "Access denied to " + module, null, null, Map.of(), "0ms",
            "You don't currently have permission to access " + module +
            ". Please contact your administrator if this is required for your role.");
    }

    /**
     * Access granted but no records matched the query.
     * This is explicitly different from PERMISSION_DENIED.
     */
    public static ToolResult noData(String entity, String operation) {
        return new ToolResult(true, entity, operation, "NO_DATA",
            "No records found", 0L, null, Map.of(), "0ms",
            "No " + entity.toLowerCase() + " records matched your query. " +
            "Try broadening your search or checking the filters.");
    }

    /** Unexpected execution error */
    public static ToolResult error(String message) {
        return new ToolResult(false, null, null, "ERROR",
            null, null, null, Map.of(), "0ms", message);
    }

    // ─── Legacy compatibility (for skills using old ToolResult.of(summary, data)) ──

    /** @deprecated Use of(entity, operation, summary, data) instead */
    @Deprecated
    public static ToolResult of(String summary, Object data) {
        return new ToolResult(true, "UNKNOWN", "LIST", "PERMISSION_GRANTED",
            summary, null, data, Map.of(), "0ms", null);
    }
}

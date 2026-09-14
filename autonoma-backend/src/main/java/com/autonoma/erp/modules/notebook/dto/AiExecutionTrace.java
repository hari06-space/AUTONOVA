package com.autonoma.erp.modules.notebook.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

/**
 * Built up incrementally during a queryNotebook() call.
 * Serialized into EXPLAINABILITY_JSON in the audit log.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiExecutionTrace {
    private String intentCategory;
    private String detectedModules;
    private String requestedScope;
    private boolean injectionDetected;
    private boolean permissionDenied;
    private final List<ToolExecution> toolExecutions = new ArrayList<>();
    private int notebookSourcesUsed;
    private int enterpriseKnowledgeItemsUsed;
    private int notesUsed;
    private int totalSqlQueries;
    private int totalRowsReturned;
    private long dbLatencyMs;
    private long llmLatencyMs;
    private long totalLatencyMs;
    private int promptTokensEstimate;
    private String llmModel;
    private double trustScore = 1.0;
    private final List<String> permissionChecks = new ArrayList<>();
    private String planSummary;

    public String getIntentCategory() { return intentCategory; }
    public void setIntentCategory(String v) { this.intentCategory = v; }
    public String getDetectedModules() { return detectedModules; }
    public void setDetectedModules(String v) { this.detectedModules = v; }
    public String getRequestedScope() { return requestedScope; }
    public void setRequestedScope(String v) { this.requestedScope = v; }
    public boolean isInjectionDetected() { return injectionDetected; }
    public void setInjectionDetected(boolean v) { this.injectionDetected = v; }
    public boolean isPermissionDenied() { return permissionDenied; }
    public void setPermissionDenied(boolean v) { this.permissionDenied = v; }
    public List<ToolExecution> getToolExecutions() { return toolExecutions; }
    public void addToolExecution(ToolExecution te) { this.toolExecutions.add(te); }
    public int getNotebookSourcesUsed() { return notebookSourcesUsed; }
    public void setNotebookSourcesUsed(int v) { this.notebookSourcesUsed = v; }
    public int getEnterpriseKnowledgeItemsUsed() { return enterpriseKnowledgeItemsUsed; }
    public void setEnterpriseKnowledgeItemsUsed(int v) { this.enterpriseKnowledgeItemsUsed = v; }
    public int getNotesUsed() { return notesUsed; }
    public void setNotesUsed(int v) { this.notesUsed = v; }
    public int getTotalSqlQueries() { return totalSqlQueries; }
    public void incrementSqlQueries() { this.totalSqlQueries++; }
    public int getTotalRowsReturned() { return totalRowsReturned; }
    public void addRowsReturned(int rows) { this.totalRowsReturned += rows; }
    public long getDbLatencyMs() { return dbLatencyMs; }
    public void addDbLatencyMs(long ms) { this.dbLatencyMs += ms; }
    public long getLlmLatencyMs() { return llmLatencyMs; }
    public void setLlmLatencyMs(long v) { this.llmLatencyMs = v; }
    public long getTotalLatencyMs() { return totalLatencyMs; }
    public void setTotalLatencyMs(long v) { this.totalLatencyMs = v; }
    public int getPromptTokensEstimate() { return promptTokensEstimate; }
    public void setPromptTokensEstimate(int v) { this.promptTokensEstimate = v; }
    public String getLlmModel() { return llmModel; }
    public void setLlmModel(String v) { this.llmModel = v; }
    public double getTrustScore() { return trustScore; }
    public void reduceTrustScore(double by) { this.trustScore = Math.max(0, this.trustScore - by); }
    public List<String> getPermissionChecks() { return permissionChecks; }
    public void addPermissionCheck(String check) { this.permissionChecks.add(check); }
    public String getPlanSummary() { return planSummary; }
    public void setPlanSummary(String v) { this.planSummary = v; }

    public record ToolExecution(String toolName, int rowsReturned, long durationMs, boolean succeeded) {}
}

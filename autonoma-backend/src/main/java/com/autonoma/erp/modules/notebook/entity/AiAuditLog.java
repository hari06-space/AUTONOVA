package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;
import java.util.Date;

/**
 * JPA entity for SYS_AI_AUDIT_LOG.
 * Records every AI query: intent, permissions evaluated, tools invoked,
 * latency breakdown, and full explainability trace.
 */
@Entity
@Table(name = "SYS_AI_AUDIT_LOG")
public class AiAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false, length = 50)
    private String userId;

    @Column(name = "NOTEBOOK_ID")
    private Long notebookId;

    @Column(name = "PROMPT", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String prompt;

    @Column(name = "INTENT_CLASS", nullable = false, length = 100)
    private String intentClass;

    @Column(name = "INTENT_CATEGORY", length = 50)
    private String intentCategory;

    @Column(name = "DETECTED_MODULES", length = 255)
    private String detectedModules;

    @Column(name = "MODULES_ACCESSED", length = 255)
    private String modulesAccessed;

    @Column(name = "TOOLS_INVOKED", length = 500)
    private String toolsInvoked;

    @Column(name = "APIS_TRIGGERED", length = 500)
    private String apisTriggered;

    @Column(name = "SQL_QUERIES_COUNT")
    private Integer sqlQueriesCount;

    @Column(name = "ROWS_RETURNED")
    private Integer rowsReturned;

    @Column(name = "NOTEBOOK_SOURCES")
    private Integer notebookSources;

    @Column(name = "PERMISSION_CHECKS", columnDefinition = "NVARCHAR(MAX)")
    private String permissionChecks;

    @Column(name = "PERMISSION_DENIED")
    private Boolean permissionDenied;

    @Column(name = "INJECTION_DETECTED")
    private Boolean injectionDetected;

    @Column(name = "COMPANY_ID")
    private Long companyId;

    @Column(name = "DIVISION_ID")
    private Long divisionId;

    @Column(name = "DATA_SCOPE", length = 20)
    private String dataScope;

    @Column(name = "SENSITIVITY_MAX", length = 20)
    private String sensitivityMax;

    @Column(name = "LLM_MODEL", length = 50)
    private String llmModel;

    @Column(name = "PROMPT_TOKENS")
    private Integer promptTokens;

    @Column(name = "RESPONSE_TIME_MS", nullable = false)
    private Integer responseTimeMs = 0;

    @Column(name = "TOKENS_USED")
    private Integer tokensUsed;

    @Column(name = "TOTAL_LATENCY_MS")
    private Integer totalLatencyMs;

    @Column(name = "LLM_LATENCY_MS")
    private Integer llmLatencyMs;

    @Column(name = "DB_LATENCY_MS")
    private Integer dbLatencyMs;

    @Column(name = "TRUST_SCORE")
    private Double trustScore;

    @Column(name = "TRACE_LOG", columnDefinition = "NVARCHAR(MAX)")
    private String traceLog;

    @Column(name = "EXPLAINABILITY_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String explainabilityJson;

    /** GRANTED | DENIED | PARTIAL */
    @Column(name = "PERMISSION_STATUS", length = 20)
    private String permissionStatus;

    /** Resolved entity name e.g. CHECKLIST, EMPLOYEE */
    @Column(name = "ENTITY_RESOLVED", length = 50)
    private String entityResolved;

    /** Resolved operation e.g. COUNT, PENDING, ANALYTICS */
    @Column(name = "OPERATION_RESOLVED", length = 50)
    private String operationResolved;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @Column(name = "ACTIVE_STATUS", length = 1)
    private String activeStatus = "Y";

    @PrePersist
    protected void onCreate() {
        this.createdDate = new Date();
        if (this.activeStatus == null) this.activeStatus = "Y";
        if (this.intentClass == null) this.intentClass = "INFORMATION";
        if (this.responseTimeMs == null) this.responseTimeMs = 0;
    }

    // ─── Getters & Setters ─────────────────────────────────────────────────────

    public Long getId() { return id; }
    public String getUserId() { return userId; }
    public void setUserId(String v) { this.userId = v; }
    public Long getNotebookId() { return notebookId; }
    public void setNotebookId(Long v) { this.notebookId = v; }
    public String getPrompt() { return prompt; }
    public void setPrompt(String v) { this.prompt = v; }
    public String getIntentClass() { return intentClass; }
    public void setIntentClass(String v) { this.intentClass = v; }
    public String getIntentCategory() { return intentCategory; }
    public void setIntentCategory(String v) { this.intentCategory = v; }
    public String getDetectedModules() { return detectedModules; }
    public void setDetectedModules(String v) { this.detectedModules = v; }
    public String getModulesAccessed() { return modulesAccessed; }
    public void setModulesAccessed(String v) { this.modulesAccessed = v; }
    public String getToolsInvoked() { return toolsInvoked; }
    public void setToolsInvoked(String v) { this.toolsInvoked = v; }
    public String getApisTriggered() { return apisTriggered; }
    public void setApisTriggered(String v) { this.apisTriggered = v; }
    public Integer getSqlQueriesCount() { return sqlQueriesCount; }
    public void setSqlQueriesCount(Integer v) { this.sqlQueriesCount = v; }
    public Integer getRowsReturned() { return rowsReturned; }
    public void setRowsReturned(Integer v) { this.rowsReturned = v; }
    public Integer getNotebookSources() { return notebookSources; }
    public void setNotebookSources(Integer v) { this.notebookSources = v; }
    public String getPermissionChecks() { return permissionChecks; }
    public void setPermissionChecks(String v) { this.permissionChecks = v; }
    public Boolean getPermissionDenied() { return permissionDenied; }
    public void setPermissionDenied(Boolean v) { this.permissionDenied = v; }
    public Boolean getInjectionDetected() { return injectionDetected; }
    public void setInjectionDetected(Boolean v) { this.injectionDetected = v; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long v) { this.companyId = v; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long v) { this.divisionId = v; }
    public String getDataScope() { return dataScope; }
    public void setDataScope(String v) { this.dataScope = v; }
    public String getSensitivityMax() { return sensitivityMax; }
    public void setSensitivityMax(String v) { this.sensitivityMax = v; }
    public String getLlmModel() { return llmModel; }
    public void setLlmModel(String v) { this.llmModel = v; }
    public Integer getPromptTokens() { return promptTokens; }
    public void setPromptTokens(Integer v) { this.promptTokens = v; }
    public Integer getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(Integer v) { this.responseTimeMs = v; }
    public Integer getTokensUsed() { return tokensUsed; }
    public void setTokensUsed(Integer v) { this.tokensUsed = v; }
    public Integer getTotalLatencyMs() { return totalLatencyMs; }
    public void setTotalLatencyMs(Integer v) { this.totalLatencyMs = v; }
    public Integer getLlmLatencyMs() { return llmLatencyMs; }
    public void setLlmLatencyMs(Integer v) { this.llmLatencyMs = v; }
    public Integer getDbLatencyMs() { return dbLatencyMs; }
    public void setDbLatencyMs(Integer v) { this.dbLatencyMs = v; }
    public Double getTrustScore() { return trustScore; }
    public void setTrustScore(Double v) { this.trustScore = v; }
    public String getTraceLog() { return traceLog; }
    public void setTraceLog(String v) { this.traceLog = v; }
    public String getExplainabilityJson() { return explainabilityJson; }
    public void setExplainabilityJson(String v) { this.explainabilityJson = v; }
    public String getPermissionStatus() { return permissionStatus; }
    public void setPermissionStatus(String v) { this.permissionStatus = v; }
    public String getEntityResolved() { return entityResolved; }
    public void setEntityResolved(String v) { this.entityResolved = v; }
    public String getOperationResolved() { return operationResolved; }
    public void setOperationResolved(String v) { this.operationResolved = v; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String v) { this.createdBy = v; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date v) { this.createdDate = v; }
    public String getActiveStatus() { return activeStatus; }
    public void setActiveStatus(String v) { this.activeStatus = v; }
}

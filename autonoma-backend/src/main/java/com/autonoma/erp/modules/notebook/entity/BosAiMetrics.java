package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "BOS_AI_METRICS")
public class BosAiMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "SESSION_ID", nullable = false, length = 100)
    private String sessionId;

    @Column(name = "PROMPT_TOKENS", nullable = false)
    private Integer promptTokens;

    @Column(name = "COMPLETION_TOKENS", nullable = false)
    private Integer completionTokens;

    @Column(name = "DB_LATENCY_MS", nullable = false)
    private Integer dbLatencyMs;

    @Column(name = "LLM_LATENCY_MS", nullable = false)
    private Integer llmLatencyMs;

    @Column(name = "CACHE_HIT", length = 1)
    private String cacheHit;

    @Column(name = "SKILLS_TRIGGERED", length = 500)
    private String skillsTriggered;

    @Column(name = "STATUS", length = 20)
    private String status;

    @Column(name = "ERROR_MSG", columnDefinition = "NVARCHAR(MAX)")
    private String errorMsg;

    @Column(name = "COST", precision = 10, scale = 5)
    private BigDecimal cost;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "CREATED_DATE")
    private Date createdDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = new Date();
        if (this.cacheHit == null) {
            this.cacheHit = "N";
        }
        if (this.status == null) {
            this.status = "SUCCESS";
        }
        if (this.cost == null) {
            this.cost = BigDecimal.ZERO;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public Integer getPromptTokens() { return promptTokens; }
    public void setPromptTokens(Integer promptTokens) { this.promptTokens = promptTokens; }

    public Integer getCompletionTokens() { return completionTokens; }
    public void setCompletionTokens(Integer completionTokens) { this.completionTokens = completionTokens; }

    public Integer getDbLatencyMs() { return dbLatencyMs; }
    public void setDbLatencyMs(Integer dbLatencyMs) { this.dbLatencyMs = dbLatencyMs; }

    public Integer getLlmLatencyMs() { return llmLatencyMs; }
    public void setLlmLatencyMs(Integer llmLatencyMs) { this.llmLatencyMs = llmLatencyMs; }

    public String getCacheHit() { return cacheHit; }
    public void setCacheHit(String cacheHit) { this.cacheHit = cacheHit; }

    public String getSkillsTriggered() { return skillsTriggered; }
    public void setSkillsTriggered(String skillsTriggered) { this.skillsTriggered = skillsTriggered; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorMsg() { return errorMsg; }
    public void setErrorMsg(String errorMsg) { this.errorMsg = errorMsg; }

    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }

    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
}

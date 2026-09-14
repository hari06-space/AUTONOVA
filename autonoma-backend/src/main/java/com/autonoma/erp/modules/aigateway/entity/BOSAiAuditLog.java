package com.autonoma.erp.modules.aigateway.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "SYS_AI_AUDIT_LOG", indexes = {
    @Index(name = "idx_saal_user", columnList = "USER_ID"),
    @Index(name = "idx_saal_class", columnList = "INTENT_CLASS")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BOSAiAuditLog extends BaseAuditEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private String userId;

    @Column(name = "PROMPT", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String prompt;

    @Column(name = "INTENT_CLASS", nullable = false, length = 100)
    private String intentClass;

    @Column(name = "MODULES_ACCESSED", length = 255)
    private String modulesAccessed;

    @Column(name = "APIS_TRIGGERED", length = 500)
    private String apisTriggered;

    @Column(name = "RESPONSE_TIME_MS", nullable = false)
    private Integer responseTimeMs;

    @Column(name = "TOKENS_USED")
    private Integer tokensUsed;

    @Column(name = "TRACE_LOG", columnDefinition = "NVARCHAR(MAX)")
    private String traceLog;

    @Column(name = "ACTIVE_STATUS", nullable = false, length = 1)
    private String activeStatus = "Y";

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public String getIntentClass() { return intentClass; }
    public void setIntentClass(String intentClass) { this.intentClass = intentClass; }
    public String getModulesAccessed() { return modulesAccessed; }
    public void setModulesAccessed(String modulesAccessed) { this.modulesAccessed = modulesAccessed; }
    public String getApisTriggered() { return apisTriggered; }
    public void setApisTriggered(String apisTriggered) { this.apisTriggered = apisTriggered; }
    public Integer getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(Integer responseTimeMs) { this.responseTimeMs = responseTimeMs; }
    public Integer getTokensUsed() { return tokensUsed; }
    public void setTokensUsed(Integer tokensUsed) { this.tokensUsed = tokensUsed; }
    public String getTraceLog() { return traceLog; }
    public void setTraceLog(String traceLog) { this.traceLog = traceLog; }
    public String getActiveStatus() { return activeStatus; }
    public void setActiveStatus(String activeStatus) { this.activeStatus = activeStatus; }
}

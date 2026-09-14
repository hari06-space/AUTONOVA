package com.autonoma.erp.model.ai;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "BOS_AI_AUDIT_LOG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BosAiAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false, columnDefinition = "NVARCHAR(50)")
    private String userId;
    
    @Column(name = "TENANT_ID", nullable = false, columnDefinition = "NVARCHAR(50)")
    private String tenantId;

    @Column(name = "QUESTION", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String question;

    @Column(name = "RESPONSE", columnDefinition = "NVARCHAR(MAX)")
    private String response;

    @Column(name = "GENERATED_QUERY", columnDefinition = "NVARCHAR(MAX)")
    private String generatedQuery;

    @Column(name = "MODULES_ACCESSED", columnDefinition = "NVARCHAR(500)")
    private String modulesAccessed;
    
    @Column(name = "FORECAST_GENERATED")
    private Boolean forecastGenerated = false;
    
    @Column(name = "REPORTS_GENERATED", columnDefinition = "NVARCHAR(MAX)")
    private String reportsGenerated;
    
    @Column(name = "ERP_ACTIONS_EXECUTED", columnDefinition = "NVARCHAR(MAX)")
    private String erpActionsExecuted;

    @Column(name = "EXECUTION_TIME_MS")
    private Long executionTimeMs;

    public void setUserId(String userId) { this.userId = userId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public void setQuestion(String question) { this.question = question; }
    public void setResponse(String response) { this.response = response; }
    public void setGeneratedQuery(String generatedQuery) { this.generatedQuery = generatedQuery; }
    public void setModulesAccessed(String modulesAccessed) { this.modulesAccessed = modulesAccessed; }
    public void setForecastGenerated(Boolean forecastGenerated) { this.forecastGenerated = forecastGenerated; }
    public void setReportsGenerated(String reportsGenerated) { this.reportsGenerated = reportsGenerated; }
    public void setErpActionsExecuted(String erpActionsExecuted) { this.erpActionsExecuted = erpActionsExecuted; }
    public void setExecutionTimeMs(Long executionTimeMs) { this.executionTimeMs = executionTimeMs; }

    @Column(name = "CREATED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = new Date();
    }
}

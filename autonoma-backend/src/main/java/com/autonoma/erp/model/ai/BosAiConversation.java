package com.autonoma.erp.model.ai;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "BOS_AI_CONVERSATION")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BosAiConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false, columnDefinition = "NVARCHAR(50)")
    private String userId;

    @Column(name = "SESSION_ID", columnDefinition = "NVARCHAR(100)")
    private String sessionId;

    @Column(name = "QUESTION", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String question;

    @Column(name = "ANSWER", columnDefinition = "NVARCHAR(MAX)")
    private String answer;

    @Column(name = "LANGUAGE_CODE", length = 20)
    private String languageCode = "EN";

    @Column(name = "INTENT_TYPE", length = 50)
    private String intentType;

    @Column(name = "MODULES_ACCESSED", columnDefinition = "NVARCHAR(500)")
    private String modulesAccessed;

    public String getModulesAccessed() { return modulesAccessed; }

    @Column(name = "QUERY_EXECUTED", columnDefinition = "NVARCHAR(MAX)")
    private String queryExecuted;

    @Column(name = "REPORT_GENERATED")
    private Boolean reportGenerated = false;

    @Column(name = "FORECAST_GENERATED")
    private Boolean forecastGenerated = false;

    @Column(name = "RESPONSE_TYPE", length = 50)
    private String responseType = "TEXT";

    public void setUserId(String userId) { this.userId = userId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public void setLanguageCode(String languageCode) { this.languageCode = languageCode; }
    public void setIntentType(String intentType) { this.intentType = intentType; }
    public void setModulesAccessed(String modulesAccessed) { this.modulesAccessed = modulesAccessed; }
    public void setQueryExecuted(String queryExecuted) { this.queryExecuted = queryExecuted; }
    public void setReportGenerated(Boolean reportGenerated) { this.reportGenerated = reportGenerated; }
    public void setForecastGenerated(Boolean forecastGenerated) { this.forecastGenerated = forecastGenerated; }
    public void setResponseType(String responseType) { this.responseType = responseType; }

    @Column(name = "CREATED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = new Date();
    }
}

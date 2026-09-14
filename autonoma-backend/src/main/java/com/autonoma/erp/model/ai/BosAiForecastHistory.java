package com.autonoma.erp.model.ai;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "BOS_AI_FORECAST_HISTORY")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BosAiForecastHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false, columnDefinition = "NVARCHAR(50)")
    private String userId;

    @Column(name = "FORECAST_TYPE", nullable = false, length = 100)
    private String forecastType;

    @Column(name = "INPUT_PARAMETERS", columnDefinition = "NVARCHAR(MAX)")
    private String inputParameters;

    @Column(name = "OUTPUT_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String outputJson;

    @Column(name = "CONFIDENCE_SCORE")
    private Double confidenceScore;

    public void setUserId(String userId) { this.userId = userId; }
    public void setForecastType(String forecastType) { this.forecastType = forecastType; }
    public void setInputParameters(String inputParameters) { this.inputParameters = inputParameters; }
    public void setOutputJson(String outputJson) { this.outputJson = outputJson; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    @Column(name = "CREATED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = new Date();
    }
}

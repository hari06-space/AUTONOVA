package com.autonoma.erp.modules.platform.epm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "epm_employee_score_summary")
@Data
@NoArgsConstructor
public class EpmEmployeeScoreSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "total_score")
    private Long totalScore = 0L;

    @Column(name = "monthly_score")
    private Long monthlyScore = 0L;

    @Column(name = "yearly_score")
    private Long yearlyScore = 0L;

    @Column(name = "productivity_pct")
    private Double productivityPct = 0.0;

    @Column(name = "quality_pct")
    private Double qualityPct = 0.0;

    @Column(name = "accuracy_pct")
    private Double accuracyPct = 0.0;

    @Column(name = "level_id")
    private Long levelId;

    @Column(name = "last_updated", insertable = false, updatable = false)
    private LocalDateTime lastUpdated;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getTotalScore() { return totalScore; }
    public void setTotalScore(Long totalScore) { this.totalScore = totalScore; }
    public Long getMonthlyScore() { return monthlyScore; }
    public void setMonthlyScore(Long monthlyScore) { this.monthlyScore = monthlyScore; }
    public Long getYearlyScore() { return yearlyScore; }
    public void setYearlyScore(Long yearlyScore) { this.yearlyScore = yearlyScore; }
    public Double getProductivityPct() { return productivityPct; }
    public void setProductivityPct(Double productivityPct) { this.productivityPct = productivityPct; }
    public Double getQualityPct() { return qualityPct; }
    public void setQualityPct(Double qualityPct) { this.qualityPct = qualityPct; }
    public Double getAccuracyPct() { return accuracyPct; }
    public void setAccuracyPct(Double accuracyPct) { this.accuracyPct = accuracyPct; }
    public Long getLevelId() { return levelId; }
    public void setLevelId(Long levelId) { this.levelId = levelId; }
    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}

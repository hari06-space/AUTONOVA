package com.autonoma.erp.modules.platform.epm.dto;

import com.autonoma.erp.modules.platform.epm.entity.EpmEmployeeScoreSummary;
import com.autonoma.erp.modules.platform.epm.entity.EpmScoreTransaction;
import lombok.Data;
import java.util.List;

@Data
public class EpmDashboardResponse {
    private EpmEmployeeScoreSummary summary;
    private List<EpmScoreTransaction> recentTransactions;
    private String levelName;
    private String levelIcon;
    private Long pointsToNextLevel;

    public EpmEmployeeScoreSummary getSummary() { return summary; }
    public void setSummary(EpmEmployeeScoreSummary summary) { this.summary = summary; }
    public List<EpmScoreTransaction> getRecentTransactions() { return recentTransactions; }
    public void setRecentTransactions(List<EpmScoreTransaction> recentTransactions) { this.recentTransactions = recentTransactions; }
    public String getLevelName() { return levelName; }
    public void setLevelName(String levelName) { this.levelName = levelName; }
    public String getLevelIcon() { return levelIcon; }
    public void setLevelIcon(String levelIcon) { this.levelIcon = levelIcon; }
    public Long getPointsToNextLevel() { return pointsToNextLevel; }
    public void setPointsToNextLevel(Long pointsToNextLevel) { this.pointsToNextLevel = pointsToNextLevel; }
}

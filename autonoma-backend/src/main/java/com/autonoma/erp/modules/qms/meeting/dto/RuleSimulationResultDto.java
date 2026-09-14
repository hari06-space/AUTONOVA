package com.autonoma.erp.modules.qms.meeting.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RuleSimulationResultDto {

    private LocalDate startDate;
    private LocalDate endDate;
    private int totalCandidates;
    private int totalScheduled;
    private List<SimulationRow> results = new ArrayList<>();

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public int getTotalCandidates() { return totalCandidates; }
    public void setTotalCandidates(int totalCandidates) { this.totalCandidates = totalCandidates; }
    public int getTotalScheduled() { return totalScheduled; }
    public void setTotalScheduled(int totalScheduled) { this.totalScheduled = totalScheduled; }
    public List<SimulationRow> getResults() { return results; }
    public void setResults(List<SimulationRow> results) { this.results = results; }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulationRow {
        private LocalDate candidateDate;
        private boolean isHoliday;
        private boolean isWeekend;
        private String matchedRuleName;
        private Long matchedRuleId;
        private String conditionsCheckedSummary;
        private String actionApplied;
        private String fallbackUsed;
        private LocalDate finalScheduledDate;
        private String status; // MATCHED, SKIPPED, FALLBACK_APPLIED, NO_MATCH
        private String message;

        public LocalDate getCandidateDate() { return candidateDate; }
        public void setCandidateDate(LocalDate candidateDate) { this.candidateDate = candidateDate; }
        public boolean isHoliday() { return isHoliday; }
        public void setHoliday(boolean isHoliday) { this.isHoliday = isHoliday; }
        public boolean isWeekend() { return isWeekend; }
        public void setWeekend(boolean isWeekend) { this.isWeekend = isWeekend; }
        public String getMatchedRuleName() { return matchedRuleName; }
        public void setMatchedRuleName(String matchedRuleName) { this.matchedRuleName = matchedRuleName; }
        public Long getMatchedRuleId() { return matchedRuleId; }
        public void setMatchedRuleId(Long matchedRuleId) { this.matchedRuleId = matchedRuleId; }
        public String getConditionsCheckedSummary() { return conditionsCheckedSummary; }
        public void setConditionsCheckedSummary(String conditionsCheckedSummary) { this.conditionsCheckedSummary = conditionsCheckedSummary; }
        public String getActionApplied() { return actionApplied; }
        public void setActionApplied(String actionApplied) { this.actionApplied = actionApplied; }
        public String getFallbackUsed() { return fallbackUsed; }
        public void setFallbackUsed(String fallbackUsed) { this.fallbackUsed = fallbackUsed; }
        public LocalDate getFinalScheduledDate() { return finalScheduledDate; }
        public void setFinalScheduledDate(LocalDate finalScheduledDate) { this.finalScheduledDate = finalScheduledDate; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}

package com.autonoma.erp.modules.qms.meeting.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QmsMomSummaryReportDto {
    private int slNo;
    private String employeeCode;
    private String employeeName;
    // Points Summary
    private int totalPoints;
    private int closed;
    private int cancelled;
    private int pendingApproval;
    private int unresolved;
    private int open;
    // Overdue Summary
    private int overduePendingApproval;
    private int overdueUnresolved;
    private int overdueOpen;
    private int totalOverdueCount;
    private double avgOverdueDays;
    // Score Summary
    private double rewardScore;
    private double penaltyScore;
    private double finalScore;

    public int getSlNo() { return slNo; }
    public void setSlNo(int slNo) { this.slNo = slNo; }
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }
    public int getClosed() { return closed; }
    public void setClosed(int closed) { this.closed = closed; }
    public int getCancelled() { return cancelled; }
    public void setCancelled(int cancelled) { this.cancelled = cancelled; }
    public int getPendingApproval() { return pendingApproval; }
    public void setPendingApproval(int pendingApproval) { this.pendingApproval = pendingApproval; }
    public int getUnresolved() { return unresolved; }
    public void setUnresolved(int unresolved) { this.unresolved = unresolved; }
    public int getOpen() { return open; }
    public void setOpen(int open) { this.open = open; }
    public int getOverduePendingApproval() { return overduePendingApproval; }
    public void setOverduePendingApproval(int overduePendingApproval) { this.overduePendingApproval = overduePendingApproval; }
    public int getOverdueUnresolved() { return overdueUnresolved; }
    public void setOverdueUnresolved(int overdueUnresolved) { this.overdueUnresolved = overdueUnresolved; }
    public int getOverdueOpen() { return overdueOpen; }
    public void setOverdueOpen(int overdueOpen) { this.overdueOpen = overdueOpen; }
    public int getTotalOverdueCount() { return totalOverdueCount; }
    public void setTotalOverdueCount(int totalOverdueCount) { this.totalOverdueCount = totalOverdueCount; }
    public double getAvgOverdueDays() { return avgOverdueDays; }
    public void setAvgOverdueDays(double avgOverdueDays) { this.avgOverdueDays = avgOverdueDays; }
    public double getRewardScore() { return rewardScore; }
    public void setRewardScore(double rewardScore) { this.rewardScore = rewardScore; }
    public double getPenaltyScore() { return penaltyScore; }
    public void setPenaltyScore(double penaltyScore) { this.penaltyScore = penaltyScore; }
    public double getFinalScore() { return finalScore; }
    public void setFinalScore(double finalScore) { this.finalScore = finalScore; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private int slNo; private String employeeCode; private String employeeName;
        private int totalPoints; private int closed; private int cancelled;
        private int pendingApproval; private int unresolved; private int open;
        private int overduePendingApproval; private int overdueUnresolved; private int overdueOpen;
        private int totalOverdueCount; private double avgOverdueDays;
        private double rewardScore; private double penaltyScore; private double finalScore;

        public Builder slNo(int v) { this.slNo = v; return this; }
        public Builder employeeCode(String v) { this.employeeCode = v; return this; }
        public Builder employeeName(String v) { this.employeeName = v; return this; }
        public Builder totalPoints(int v) { this.totalPoints = v; return this; }
        public Builder closed(int v) { this.closed = v; return this; }
        public Builder cancelled(int v) { this.cancelled = v; return this; }
        public Builder pendingApproval(int v) { this.pendingApproval = v; return this; }
        public Builder unresolved(int v) { this.unresolved = v; return this; }
        public Builder open(int v) { this.open = v; return this; }
        public Builder overduePendingApproval(int v) { this.overduePendingApproval = v; return this; }
        public Builder overdueUnresolved(int v) { this.overdueUnresolved = v; return this; }
        public Builder overdueOpen(int v) { this.overdueOpen = v; return this; }
        public Builder totalOverdueCount(int v) { this.totalOverdueCount = v; return this; }
        public Builder avgOverdueDays(double v) { this.avgOverdueDays = v; return this; }
        public Builder rewardScore(double v) { this.rewardScore = v; return this; }
        public Builder penaltyScore(double v) { this.penaltyScore = v; return this; }
        public Builder finalScore(double v) { this.finalScore = v; return this; }

        public QmsMomSummaryReportDto build() {
            QmsMomSummaryReportDto d = new QmsMomSummaryReportDto();
            d.slNo = this.slNo; d.employeeCode = this.employeeCode; d.employeeName = this.employeeName;
            d.totalPoints = this.totalPoints; d.closed = this.closed; d.cancelled = this.cancelled;
            d.pendingApproval = this.pendingApproval; d.unresolved = this.unresolved; d.open = this.open;
            d.overduePendingApproval = this.overduePendingApproval; d.overdueUnresolved = this.overdueUnresolved;
            d.overdueOpen = this.overdueOpen; d.totalOverdueCount = this.totalOverdueCount;
            d.avgOverdueDays = this.avgOverdueDays; d.rewardScore = this.rewardScore;
            d.penaltyScore = this.penaltyScore; d.finalScore = this.finalScore;
            return d;
        }
    }
}

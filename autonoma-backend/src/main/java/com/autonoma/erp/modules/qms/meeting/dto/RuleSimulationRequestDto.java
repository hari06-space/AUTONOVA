package com.autonoma.erp.modules.qms.meeting.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RuleSimulationRequestDto {
    private Long configId;
    private Long meetingId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String frequency = "MONTHLY";
    private List<Long> ruleIds;

    public Long getConfigId() { return configId; }
    public void setConfigId(Long configId) { this.configId = configId; }
    public Long getMeetingId() { return meetingId; }
    public void setMeetingId(Long meetingId) { this.meetingId = meetingId; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public List<Long> getRuleIds() { return ruleIds; }
    public void setRuleIds(List<Long> ruleIds) { this.ruleIds = ruleIds; }
}

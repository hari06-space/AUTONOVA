package com.autonoma.erp.modules.qms.meeting.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "QMS_SCHEDULE_RULE_FALLBACK")
@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class QmsScheduleRuleFallback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RULE_ID")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private QmsScheduleRule rule;

    @Column(name = "FALLBACK_ACTION_TYPE", nullable = false, length = 50)
    private String fallbackActionType; // MOVE_TO_NEXT_WORKING_DAY, TRY_ANOTHER_CANDIDATE, APPLY_ANOTHER_RULE, etc.

    @Column(name = "TARGET_RULE_ID")
    private Long targetRuleId;

    @Column(name = "PRIORITY", nullable = false)
    private Integer priority = 1;

    @Column(name = "ACTION_PARAMS", columnDefinition = "NVARCHAR(MAX)")
    private String actionParams;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public QmsScheduleRule getRule() { return rule; }
    public void setRule(QmsScheduleRule rule) { this.rule = rule; }
    public String getFallbackActionType() { return fallbackActionType; }
    public void setFallbackActionType(String fallbackActionType) { this.fallbackActionType = fallbackActionType; }
    public Long getTargetRuleId() { return targetRuleId; }
    public void setTargetRuleId(Long targetRuleId) { this.targetRuleId = targetRuleId; }
    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }
    public String getActionParams() { return actionParams; }
    public void setActionParams(String actionParams) { this.actionParams = actionParams; }
}

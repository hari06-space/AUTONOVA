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
@Table(name = "QMS_SCHEDULE_RULE_ACTION")
@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class QmsScheduleRuleAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RULE_ID")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private QmsScheduleRule rule;

    @Column(name = "ACTION_TYPE", nullable = false, length = 50)
    private String actionType; // SCHEDULE_MEETING, SKIP_DATE, MOVE_TO_PREVIOUS_WORKING_DAY, MOVE_TO_NEXT_WORKING_DAY, etc.

    @Column(name = "ACTION_PARAMS", columnDefinition = "NVARCHAR(MAX)")
    private String actionParams; // JSON string for action parameters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public QmsScheduleRule getRule() { return rule; }
    public void setRule(QmsScheduleRule rule) { this.rule = rule; }
    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }
    public String getActionParams() { return actionParams; }
    public void setActionParams(String actionParams) { this.actionParams = actionParams; }
}

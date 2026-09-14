package com.autonoma.erp.modules.qms.meeting.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "QMS_SCHEDULE_RULE_GROUP")
@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class QmsScheduleRuleGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RULE_ID")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private QmsScheduleRule rule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PARENT_GROUP_ID")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private QmsScheduleRuleGroup parentGroup;

    @Column(name = "LOGICAL_OPERATOR", nullable = false, length = 10)
    private String logicalOperator = "ALL"; // ALL = AND, ANY = OR

    @OneToMany(mappedBy = "parentGroup", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<QmsScheduleRuleGroup> childGroups = new ArrayList<>();

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private List<QmsScheduleRuleCondition> conditions = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public QmsScheduleRule getRule() { return rule; }
    public void setRule(QmsScheduleRule rule) { this.rule = rule; }
    public QmsScheduleRuleGroup getParentGroup() { return parentGroup; }
    public void setParentGroup(QmsScheduleRuleGroup parentGroup) { this.parentGroup = parentGroup; }
    public String getLogicalOperator() { return logicalOperator; }
    public void setLogicalOperator(String logicalOperator) { this.logicalOperator = logicalOperator; }
    public List<QmsScheduleRuleGroup> getChildGroups() { return childGroups; }
    public void setChildGroups(List<QmsScheduleRuleGroup> childGroups) { this.childGroups = childGroups; }
    public List<QmsScheduleRuleCondition> getConditions() { return conditions; }
    public void setConditions(List<QmsScheduleRuleCondition> conditions) { this.conditions = conditions; }
}

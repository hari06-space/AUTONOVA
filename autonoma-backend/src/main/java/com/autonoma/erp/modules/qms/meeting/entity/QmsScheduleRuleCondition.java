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
@Table(name = "QMS_SCHEDULE_RULE_CONDITION")
@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class QmsScheduleRuleCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GROUP_ID")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private QmsScheduleRuleGroup group;

    @Column(name = "FIELD_CODE", nullable = false, length = 50)
    private String fieldCode;

    @Column(name = "OPERATOR_CODE", nullable = false, length = 50)
    private String operatorCode;

    @Column(name = "CONDITION_VALUE", columnDefinition = "NVARCHAR(MAX)")
    private String conditionValue;

    @Column(name = "DATA_TYPE", nullable = false, length = 20)
    private String dataType = "TEXT"; // TEXT, NUMBER, DATE, BOOLEAN, LIST

    @Column(name = "LOGICAL_OPERATOR", length = 10)
    private String logicalOperator = "AND"; // AND / OR / NOT

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public QmsScheduleRuleGroup getGroup() { return group; }
    public void setGroup(QmsScheduleRuleGroup group) { this.group = group; }
    public String getFieldCode() { return fieldCode; }
    public void setFieldCode(String fieldCode) { this.fieldCode = fieldCode; }
    public String getOperatorCode() { return operatorCode; }
    public void setOperatorCode(String operatorCode) { this.operatorCode = operatorCode; }
    public String getConditionValue() { return conditionValue; }
    public void setConditionValue(String conditionValue) { this.conditionValue = conditionValue; }
    public String getDataType() { return dataType; }
    public void setDataType(String dataType) { this.dataType = dataType; }
    public String getLogicalOperator() { return logicalOperator; }
    public void setLogicalOperator(String logicalOperator) { this.logicalOperator = logicalOperator; }
}

package com.autonoma.erp.modules.qms.meeting.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "QMS_SCHEDULE_RULE")
@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class QmsScheduleRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "RULE_NAME", nullable = false, length = 200)
    private String ruleName;

    @Column(name = "DESCRIPTION", length = 500)
    private String description;

    @Column(name = "CONFIG_ID")
    private Long configId;

    @Column(name = "MEETING_ID")
    private Long meetingId;

    @Column(name = "BASE_DATE_GENERATOR", nullable = false, length = 50)
    private String baseDateGenerator = "FREQUENCY_DATE";

    @Column(name = "BASE_DATE_PARAMS", columnDefinition = "NVARCHAR(MAX)")
    private String baseDateParams;

    @Column(name = "PRIORITY", nullable = false)
    private Integer priority = 1;

    @Column(name = "STATUS", length = 20)
    private String status = "ACTIVE";

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    private LocalDateTime createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;

    @OneToMany(mappedBy = "rule", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @org.hibernate.annotations.SQLRestriction("PARENT_GROUP_ID IS NULL")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<QmsScheduleRuleGroup> conditionGroups = new ArrayList<>();

    @OneToMany(mappedBy = "rule", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<QmsScheduleRuleAction> actions = new ArrayList<>();

    @OneToMany(mappedBy = "rule", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<QmsScheduleRuleFallback> fallbacks = new ArrayList<>();

    // Explicit getters/setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getConfigId() { return configId; }
    public void setConfigId(Long configId) { this.configId = configId; }
    public Long getMeetingId() { return meetingId; }
    public void setMeetingId(Long meetingId) { this.meetingId = meetingId; }
    public String getBaseDateGenerator() { return baseDateGenerator; }
    public void setBaseDateGenerator(String baseDateGenerator) { this.baseDateGenerator = baseDateGenerator; }
    public String getBaseDateParams() { return baseDateParams; }
    public void setBaseDateParams(String baseDateParams) { this.baseDateParams = baseDateParams; }
    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(LocalDateTime updatedDate) { this.updatedDate = updatedDate; }
    public List<QmsScheduleRuleGroup> getConditionGroups() { return conditionGroups; }
    public void setConditionGroups(List<QmsScheduleRuleGroup> conditionGroups) { this.conditionGroups = conditionGroups; }
    public List<QmsScheduleRuleAction> getActions() { return actions; }
    public void setActions(List<QmsScheduleRuleAction> actions) { this.actions = actions; }
    public List<QmsScheduleRuleFallback> getFallbacks() { return fallbacks; }
    public void setFallbacks(List<QmsScheduleRuleFallback> fallbacks) { this.fallbacks = fallbacks; }
}

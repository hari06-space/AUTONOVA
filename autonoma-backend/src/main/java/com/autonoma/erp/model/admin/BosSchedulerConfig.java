package com.autonoma.erp.model.admin;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "BOS_SCHEDULER_CONFIG")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BosSchedulerConfig extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "CONFIG_NAME", nullable = false, length = 150)
    private String configName;

    @Column(name = "CONFIG_CODE", nullable = false, unique = true, length = 50)
    private String configCode;

    @Column(name = "DESCRIPTION", length = 500)
    private String description;

    @Column(name = "CATEGORY", nullable = false, length = 50)
    private String category;

    @Column(name = "TRIGGER_TYPE", nullable = false, length = 50)
    private String triggerType;

    @Builder.Default
    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    @Column(name = "SOURCE_TYPE", nullable = false, length = 50)
    private String sourceType;

    @Column(name = "SOURCE_NAME", nullable = false, length = 150)
    private String sourceName;

    @Column(name = "SELECTED_FIELDS", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String selectedFields;

    @Column(name = "FILTER_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String filterJson;

    @Column(name = "RECIPIENT_JSON", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String recipientJson;

    @Column(name = "SCHEDULER_JSON", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String schedulerJson;

    @Column(name = "OUTPUT_JSON", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String outputJson;

    @Column(name = "LAYOUT_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String layoutJson;

    @Column(name = "ACTIVATED_USER", length = 100)
    private String activatedUser;

    @Column(name = "ACTIVATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date activatedDate;

    @Column(name = "DEACTIVATED_USER", length = 100)
    private String deactivatedUser;

    @Column(name = "DEACTIVATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date deactivatedDate;

    public Long getRowId() { return rowId; }
    public String getConfigName() { return configName; }
    public void setConfigName(String configName) { this.configName = configName; }
    public String getConfigCode() { return configCode; }
    public void setConfigCode(String configCode) { this.configCode = configCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getTriggerType() { return triggerType; }
    public void setTriggerType(String triggerType) { this.triggerType = triggerType; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    public String getSelectedFields() { return selectedFields; }
    public void setSelectedFields(String selectedFields) { this.selectedFields = selectedFields; }
    public String getFilterJson() { return filterJson; }
    public void setFilterJson(String filterJson) { this.filterJson = filterJson; }
    public String getRecipientJson() { return recipientJson; }
    public void setRecipientJson(String recipientJson) { this.recipientJson = recipientJson; }
    public String getSchedulerJson() { return schedulerJson; }
    public void setSchedulerJson(String schedulerJson) { this.schedulerJson = schedulerJson; }
    public String getOutputJson() { return outputJson; }
    public void setOutputJson(String outputJson) { this.outputJson = outputJson; }
    public String getLayoutJson() { return layoutJson; }
    public void setLayoutJson(String layoutJson) { this.layoutJson = layoutJson; }
    public void setActivatedUser(String activatedUser) { this.activatedUser = activatedUser; }
    public void setActivatedDate(Date activatedDate) { this.activatedDate = activatedDate; }
    public void setDeactivatedUser(String deactivatedUser) { this.deactivatedUser = deactivatedUser; }
    public void setDeactivatedDate(Date deactivatedDate) { this.deactivatedDate = deactivatedDate; }
}

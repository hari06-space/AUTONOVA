package com.autonoma.erp.model.admin;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "BOS_SCHEDULER_TEMPLATE")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BosSchedulerTemplate extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "TEMPLATE_NAME", nullable = false, length = 150)
    private String templateName;

    @Column(name = "TEMPLATE_TYPE", nullable = false, length = 50)
    private String templateType;

    @Column(name = "SUBJECT", length = 250)
    private String subject;

    @Column(name = "TEMPLATE_JSON", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String templateJson;

    @Builder.Default
    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "VERSION", nullable = false)
    private Integer version = 1;

    public Long getRowId() { return rowId; }
    public String getTemplateName() { return templateName; }
    public void setTemplateName(String templateName) { this.templateName = templateName; }
    public String getTemplateType() { return templateType; }
    public void setTemplateType(String templateType) { this.templateType = templateType; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getTemplateJson() { return templateJson; }
    public void setTemplateJson(String templateJson) { this.templateJson = templateJson; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
}

package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "SYS_AI_WORKFLOW_RULE")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiWorkflowRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NOTEBOOK_ID", nullable = false)
    private Long notebookId;

    @Column(name = "RULE_NAME", nullable = false, length = 255)
    private String ruleName;

    @Column(name = "TRIGGER_TYPE", nullable = false, length = 100)
    private String triggerType;

    @Column(name = "TRIGGER_CONDITION", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String triggerCondition;

    @Column(name = "ACTION_TYPE", nullable = false, length = 100)
    private String actionType;

    @Column(name = "ACTION_PAYLOAD", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String actionPayload;

    @Column(name = "PRIORITY", nullable = false)
    private Integer priority = 0;

    @Column(name = "EXECUTION_COUNT", nullable = false)
    private Integer executionCount = 0;

    @Column(name = "LAST_EXECUTED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastExecutedDate;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @Column(name = "ACTIVE_STATUS", nullable = false, length = 1)
    private String activeStatus = "Y";

    @PrePersist
    protected void onCreate() {
        String user = resolveCurrentUser();
        this.createdBy = user;
        this.createdDate = new Date();
        this.updatedBy = null;
        this.updatedDate = null;
        if (this.activeStatus == null) this.activeStatus = "Y";
        if (this.priority == null) this.priority = 0;
        if (this.executionCount == null) this.executionCount = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.createdDate != null && (new Date().getTime() - this.createdDate.getTime() < 5000)) {
            return;
        }
        String user = resolveCurrentUser();
        this.updatedBy = user;
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = user;
        }
        this.updatedDate = new Date();
    }

    @PostLoad
    protected void onPostLoad() {
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = "Admin";
        }
    }

    private static String resolveCurrentUser() {
        String user = null;
        try { user = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception ignored) {}
        return (user != null && !user.trim().isEmpty()) ? user : "Admin";
    }
}

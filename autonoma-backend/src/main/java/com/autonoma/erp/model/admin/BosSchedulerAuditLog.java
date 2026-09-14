package com.autonoma.erp.model.admin;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "BOS_SCHEDULER_AUDIT_LOG")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BosSchedulerAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "CONFIG_ID", nullable = false)
    private Long configId;

    @Column(name = "ACTION_TYPE", nullable = false, length = 50)
    private String actionType; // CREATE, UPDATE, CLONE, ACTIVATE, DEACTIVATE, DELETE

    @Column(name = "CHANGED_BY", nullable = false, length = 100)
    private String changedBy;

    @Builder.Default
    @Column(name = "CHANGED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date changedDate = new Date();

    @Column(name = "PREVIOUS_STATE", columnDefinition = "NVARCHAR(MAX)")
    private String previousState;

    @Column(name = "NEW_STATE", columnDefinition = "NVARCHAR(MAX)")
    private String newState;

    @Column(name = "COMMENTS", length = 500)
    private String comments;

    public void setConfigId(Long configId) { this.configId = configId; }
    public void setActionType(String actionType) { this.actionType = actionType; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }
    public void setChangedDate(Date changedDate) { this.changedDate = changedDate; }
    public void setPreviousState(String previousState) { this.previousState = previousState; }
    public void setNewState(String newState) { this.newState = newState; }
    public void setComments(String comments) { this.comments = comments; }
}

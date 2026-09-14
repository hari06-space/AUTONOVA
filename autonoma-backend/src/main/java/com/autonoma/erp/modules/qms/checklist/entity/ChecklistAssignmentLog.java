package com.autonoma.erp.modules.qms.checklist.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.Date;

@Entity
@Table(name = "QMS_CHECKLIST_ASSIGNMENT_LOG")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistAssignmentLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ASSIGNMENT_LOG_ID")
    private Long assignmentLogId;

    @Column(name = "CHECKLIST_ID", nullable = false)
    private Long checklistId;

    @Column(name = "OLD_ASSIGNEE_ID")
    private Long oldAssigneeId;

    @Column(name = "NEW_ASSIGNEE_ID")
    private Long newAssigneeId;

    @Column(name = "ASSIGNMENT_TYPE", length = 50)
    private String assignmentType;

    @Column(name = "REASON", length = 255)
    private String reason;

    @Column(name = "ASSIGNED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date assignedDate;

    @Column(name = "ASSIGNED_BY_SYSTEM")
    private Boolean assignedBySystem = true;

    public Long getAssignmentLogId() { return assignmentLogId; }
    public void setAssignmentLogId(Long assignmentLogId) { this.assignmentLogId = assignmentLogId; }
    public Long getChecklistId() { return checklistId; }
    public void setChecklistId(Long checklistId) { this.checklistId = checklistId; }
    public Long getOldAssigneeId() { return oldAssigneeId; }
    public void setOldAssigneeId(Long oldAssigneeId) { this.oldAssigneeId = oldAssigneeId; }
    public Long getNewAssigneeId() { return newAssigneeId; }
    public void setNewAssigneeId(Long newAssigneeId) { this.newAssigneeId = newAssigneeId; }
    public String getAssignmentType() { return assignmentType; }
    public void setAssignmentType(String assignmentType) { this.assignmentType = assignmentType; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Date getAssignedDate() { return assignedDate; }
    public void setAssignedDate(Date assignedDate) { this.assignedDate = assignedDate; }
    public Boolean getAssignedBySystem() { return assignedBySystem; }
    public void setAssignedBySystem(Boolean assignedBySystem) { this.assignedBySystem = assignedBySystem; }
}

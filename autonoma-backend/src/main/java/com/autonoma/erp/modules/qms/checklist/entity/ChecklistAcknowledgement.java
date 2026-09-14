package com.autonoma.erp.modules.qms.checklist.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "QMS_CHECKLIST_ACKNOWLEDGEMENT", indexes = {
    @Index(name = "idx_qca_checklist_id", columnList = "CHECKLIST_ID"),
    @Index(name = "idx_qca_new_assignee", columnList = "NEW_ASSIGNEE_ID"),
    @Index(name = "idx_qca_ack_status", columnList = "ACK_STATUS")
})
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class ChecklistAcknowledgement extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CHECKLIST_ID", nullable = false)
    private Long checklistId;

    @Column(name = "ASSIGNMENT_LOG_ID")
    private Long assignmentLogId;

    @Column(name = "OLD_ASSIGNEE_ID")
    private Long oldAssigneeId;

    @Column(name = "NEW_ASSIGNEE_ID", nullable = false)
    private Long newAssigneeId;

    @Column(name = "MEMBER_TYPE", length = 50, nullable = false)
    private String memberType; // PRIMARY, SECONDARY, TERTIARY

    @Column(name = "REASSIGNED_BY", length = 50, nullable = false)
    private String reassignedBy;

    @Column(name = "REASSIGNED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(timezone = "Asia/Kolkata")
    private Date reassignedDate;

    @Column(name = "REASSIGNMENT_REASON", columnDefinition = "NVARCHAR(MAX)")
    private String reassignmentReason;

    @Column(name = "ACK_STATUS", length = 30, nullable = false)
    private String ackStatus = "PENDING"; // PENDING, ACCEPTED, REJECTED, INACTIVE

    @Column(name = "REJECTION_REASON", columnDefinition = "NVARCHAR(MAX)")
    private String rejectionReason;

    @Column(name = "ACKNOWLEDGED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(timezone = "Asia/Kolkata")
    private Date acknowledgedDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getChecklistId() { return checklistId; }
    public void setChecklistId(Long checklistId) { this.checklistId = checklistId; }

    public Long getAssignmentLogId() { return assignmentLogId; }
    public void setAssignmentLogId(Long assignmentLogId) { this.assignmentLogId = assignmentLogId; }

    public Long getOldAssigneeId() { return oldAssigneeId; }
    public void setOldAssigneeId(Long oldAssigneeId) { this.oldAssigneeId = oldAssigneeId; }

    public Long getNewAssigneeId() { return newAssigneeId; }
    public void setNewAssigneeId(Long newAssigneeId) { this.newAssigneeId = newAssigneeId; }

    public String getMemberType() { return memberType; }
    public void setMemberType(String memberType) { this.memberType = memberType; }

    public String getReassignedBy() { return reassignedBy; }
    public void setReassignedBy(String reassignedBy) { this.reassignedBy = reassignedBy; }

    public Date getReassignedDate() { return reassignedDate; }
    public void setReassignedDate(Date reassignedDate) { this.reassignedDate = reassignedDate; }

    public String getReassignmentReason() { return reassignmentReason; }
    public void setReassignmentReason(String reassignmentReason) { this.reassignmentReason = reassignmentReason; }

    public String getAckStatus() { return ackStatus; }
    public void setAckStatus(String ackStatus) { this.ackStatus = ackStatus; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Date getAcknowledgedDate() { return acknowledgedDate; }
    public void setAcknowledgedDate(Date acknowledgedDate) { this.acknowledgedDate = acknowledgedDate; }
}

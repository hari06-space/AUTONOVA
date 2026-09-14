package com.autonoma.erp.modules.qms.meeting.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "QMS_CLOSE_MOM_AND_VERIFY")
@Data
@NoArgsConstructor
public class QmsCloseMomAndVerify {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ACTION_ITEM_ID", nullable = false)
    private Long actionItemId;

    @Column(name = "MOM_NO", length = 50)
    private String momNo;

    @Column(name = "MEETING_DATE")
    private LocalDate meetingDate;

    @Column(name = "DISCUSSED_POINT", columnDefinition = "NVARCHAR(MAX)")
    private String discussedPoint;

    @Column(name = "RESPONSIBILITY", length = 100)
    private String responsibility;

    @Column(name = "ASSIGNED_TO_ID")
    private Long assignedToId;

    @Column(name = "ASSIGNED_BY_ID")
    private Long assignedById;

    @Column(name = "TARGET_DATE")
    private LocalDate targetDate;

    @Column(name = "PREVIOUS_STATUS", length = 50)
    private String previousStatus;

    @Column(name = "NEW_STATUS", length = 50, nullable = false)
    private String newStatus;

    @Column(name = "ACTION", length = 50, nullable = false)
    private String action;

    @Column(name = "PERFORMED_BY", length = 100, nullable = false)
    private String performedBy;

    @Column(name = "PERFORMED_DATE", nullable = false)
    private LocalDateTime performedDate;

    @Column(name = "ACTION_TAKEN", columnDefinition = "NVARCHAR(MAX)")
    private String actionTaken;

    @Column(name = "ACTION_OBSERVATION", columnDefinition = "NVARCHAR(MAX)")
    private String actionObservation;

    @Column(name = "ATTACHMENT_INFO", columnDefinition = "NVARCHAR(MAX)")
    private String attachmentInfo;

    @Column(name = "VERIFIED_BY", length = 100)
    private String verifiedBy;

    @Column(name = "VERIFIED_DATE")
    private LocalDateTime verifiedDate;

    @Column(name = "REJECTED_BY", length = 100)
    private String rejectedBy;

    @Column(name = "REJECTED_DATE")
    private LocalDateTime rejectedDate;

    @Column(name = "REJECTION_REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String rejectionRemarks;

    @Column(name = "COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getActionItemId() { return actionItemId; }
    public void setActionItemId(Long actionItemId) { this.actionItemId = actionItemId; }
    public String getMomNo() { return momNo; }
    public void setMomNo(String momNo) { this.momNo = momNo; }
    public LocalDate getMeetingDate() { return meetingDate; }
    public void setMeetingDate(LocalDate meetingDate) { this.meetingDate = meetingDate; }
    public String getDiscussedPoint() { return discussedPoint; }
    public void setDiscussedPoint(String discussedPoint) { this.discussedPoint = discussedPoint; }
    public String getResponsibility() { return responsibility; }
    public void setResponsibility(String responsibility) { this.responsibility = responsibility; }
    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }
    public Long getAssignedById() { return assignedById; }
    public void setAssignedById(Long assignedById) { this.assignedById = assignedById; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }
    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
    public LocalDateTime getPerformedDate() { return performedDate; }
    public void setPerformedDate(LocalDateTime performedDate) { this.performedDate = performedDate; }
    public String getActionTaken() { return actionTaken; }
    public void setActionTaken(String actionTaken) { this.actionTaken = actionTaken; }
    public String getActionObservation() { return actionObservation; }
    public void setActionObservation(String actionObservation) { this.actionObservation = actionObservation; }
    public String getAttachmentInfo() { return attachmentInfo; }
    public void setAttachmentInfo(String attachmentInfo) { this.attachmentInfo = attachmentInfo; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public LocalDateTime getVerifiedDate() { return verifiedDate; }
    public void setVerifiedDate(LocalDateTime verifiedDate) { this.verifiedDate = verifiedDate; }
    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }
    public LocalDateTime getRejectedDate() { return rejectedDate; }
    public void setRejectedDate(LocalDateTime rejectedDate) { this.rejectedDate = rejectedDate; }
    public String getRejectionRemarks() { return rejectionRemarks; }
    public void setRejectionRemarks(String rejectionRemarks) { this.rejectionRemarks = rejectionRemarks; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
}

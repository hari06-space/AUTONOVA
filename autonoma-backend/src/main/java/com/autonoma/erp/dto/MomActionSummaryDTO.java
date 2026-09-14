package com.autonoma.erp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MomActionSummaryDTO {
    private Long id;
    private Long momId;
    private String momNo;
    private LocalDate momDate;
    private String scheduleNo;
    private String minNo;
    private String meetNo;
    private String amendMeetNo;
    private String discussedPoint;
    private String pointType;
    private String materialList;
    private String processType;
    private String assignedBy;
    private String assignedTo;
    private Long assignedToId;
    private Long assignedById;
    private LocalDate targetDate;
    private LocalDate reviewDate;
    private String attachmentRequired;
    private String status;
    private String actionTaken;
    private String actionObservation;
    private String cancelRemarks;
    private String attachmentInfo;
    private LocalDateTime createdAt;
    private String createdBy;
    private String actionStatus;
    private String submittedBy;
    private LocalDateTime submittedDate;
    private String verifiedBy;
    private LocalDateTime verifiedDate;
    private String rejectedBy;
    private LocalDateTime rejectedDate;
    private String rejectionRemarks;
    private LocalDateTime lastResubmittedDate;
    private Integer revNo;
    private Integer rejectedCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getMomId() { return momId; }
    public void setMomId(Long momId) { this.momId = momId; }
    public String getMomNo() { return momNo; }
    public void setMomNo(String momNo) { this.momNo = momNo; }
    public LocalDate getMomDate() { return momDate; }
    public void setMomDate(LocalDate momDate) { this.momDate = momDate; }
    public String getScheduleNo() { return scheduleNo; }
    public void setScheduleNo(String scheduleNo) { this.scheduleNo = scheduleNo; }
    public String getMinNo() { return minNo; }
    public void setMinNo(String minNo) { this.minNo = minNo; }
    public String getMeetNo() { return meetNo != null ? meetNo : minNo; }
    public void setMeetNo(String meetNo) { this.meetNo = meetNo; }
    public String getAmendMeetNo() { return amendMeetNo; }
    public void setAmendMeetNo(String amendMeetNo) { this.amendMeetNo = amendMeetNo; }
    public String getDiscussedPoint() { return discussedPoint; }
    public void setDiscussedPoint(String discussedPoint) { this.discussedPoint = discussedPoint; }
    public String getPointType() { return pointType; }
    public void setPointType(String pointType) { this.pointType = pointType; }
    public String getMaterialList() { return materialList; }
    public void setMaterialList(String materialList) { this.materialList = materialList; }
    public String getProcessType() { return processType; }
    public void setProcessType(String processType) { this.processType = processType; }
    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }
    public Long getAssignedById() { return assignedById; }
    public void setAssignedById(Long assignedById) { this.assignedById = assignedById; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public LocalDate getReviewDate() { return reviewDate; }
    public void setReviewDate(LocalDate reviewDate) { this.reviewDate = reviewDate; }
    public String getAttachmentRequired() { return attachmentRequired; }
    public void setAttachmentRequired(String attachmentRequired) { this.attachmentRequired = attachmentRequired; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getActionTaken() { return actionTaken; }
    public void setActionTaken(String actionTaken) { this.actionTaken = actionTaken; }
    public String getActionObservation() { return actionObservation; }
    public void setActionObservation(String actionObservation) { this.actionObservation = actionObservation; }
    public String getCancelRemarks() { return cancelRemarks; }
    public void setCancelRemarks(String cancelRemarks) { this.cancelRemarks = cancelRemarks; }
    public String getAttachmentInfo() { return attachmentInfo; }
    public void setAttachmentInfo(String attachmentInfo) { this.attachmentInfo = attachmentInfo; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getActionStatus() { return actionStatus; }
    public void setActionStatus(String actionStatus) { this.actionStatus = actionStatus; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public LocalDateTime getSubmittedDate() { return submittedDate; }
    public void setSubmittedDate(LocalDateTime submittedDate) { this.submittedDate = submittedDate; }
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
    public LocalDateTime getLastResubmittedDate() { return lastResubmittedDate; }
    public void setLastResubmittedDate(LocalDateTime lastResubmittedDate) { this.lastResubmittedDate = lastResubmittedDate; }
    public Integer getRevNo() { return revNo; }
    public void setRevNo(Integer revNo) { this.revNo = revNo; }
    public Integer getRejectedCount() { return rejectedCount; }
    public void setRejectedCount(Integer rejectedCount) { this.rejectedCount = rejectedCount; }
}

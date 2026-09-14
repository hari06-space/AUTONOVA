package com.autonoma.erp.modules.hra.recruitment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_APPLICANT_INTERVIEW")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HraApplicantInterview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @Column(name = "SCREENING_LEVEL", length = 50)
    private String screeningLevel;

    @Column(name = "ROUND", length = 50)
    private String round;

    @Column(name = "INTERVIEW_DATE", length = 50)
    private String interviewDate;

    @Column(name = "START_TIME", length = 20)
    private String startTime;

    @Column(name = "END_TIME", length = 20)
    private String endTime;

    @Column(name = "INTERVIEW_PERSON", length = 255)
    private String interviewPerson;

    @Column(name = "INTERVIEWER_ID")
    private Long interviewerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "INTERVIEW_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster interviewStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "INTERVIEW_RESULT")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster interviewResult;

    @Column(name = "CREATED_BY", length = 255)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    @Column(name = "STATUS", length = 50)
    private String status = "ACTIVE";

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Column(name = "EXP_SALARY", length = 100)
    private String expSalary;

    @Column(name = "SUGGESTED_SALARY", length = 100)
    private String suggestedSalary;

    @Column(name = "COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    @Column(name = "ATTACHMENT_REQUIRED", length = 20)
    private String attachmentRequired;

    @Column(name = "ATTACHMENT_PATH", length = 1000)
    private String attachmentPath;

    @Column(name = "FEEDBACK_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String feedbackJson;

    @Column(name = "REMINDER_SENT", nullable = false)
    private Boolean reminderSent = false;

    @Column(name = "READY_NOTIFICATION_SENT", nullable = false)
    private Boolean readyNotificationSent = false;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getScreeningLevel() { return screeningLevel; }
    public void setScreeningLevel(String screeningLevel) { this.screeningLevel = screeningLevel; }
    public String getRound() { return round; }
    public void setRound(String round) { this.round = round; }
    public String getInterviewDate() { return interviewDate; }
    public void setInterviewDate(String interviewDate) { this.interviewDate = interviewDate; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public String getInterviewPerson() { return interviewPerson; }
    public void setInterviewPerson(String interviewPerson) { this.interviewPerson = interviewPerson; }
    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getInterviewStatus() { return interviewStatus; }
    public void setInterviewStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster interviewStatus) { this.interviewStatus = interviewStatus; }
    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getInterviewResult() { return interviewResult; }
    public void setInterviewResult(com.autonoma.erp.modules.platform.common.entity.StatusMaster interviewResult) { this.interviewResult = interviewResult; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getAttachmentRequired() { return attachmentRequired; }
    public void setAttachmentRequired(String attachmentRequired) { this.attachmentRequired = attachmentRequired; }
    public String getAttachmentPath() { return attachmentPath; }
    public void setAttachmentPath(String attachmentPath) { this.attachmentPath = attachmentPath; }
    public String getFeedbackJson() { return feedbackJson; }
    public void setFeedbackJson(String feedbackJson) { this.feedbackJson = feedbackJson; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getExpSalary() { return expSalary; }
    public void setExpSalary(String expSalary) { this.expSalary = expSalary; }
    public String getSuggestedSalary() { return suggestedSalary; }
    public void setSuggestedSalary(String suggestedSalary) { this.suggestedSalary = suggestedSalary; }
    public Long getInterviewerId() { return interviewerId; }
    public void setInterviewerId(Long interviewerId) { this.interviewerId = interviewerId; }
    public Boolean getReminderSent() { return reminderSent != null ? reminderSent : false; }
    public void setReminderSent(Boolean reminderSent) { this.reminderSent = reminderSent; }
    public Boolean getReadyNotificationSent() { return readyNotificationSent != null ? readyNotificationSent : false; }
    public void setReadyNotificationSent(Boolean readyNotificationSent) { this.readyNotificationSent = readyNotificationSent; }
}

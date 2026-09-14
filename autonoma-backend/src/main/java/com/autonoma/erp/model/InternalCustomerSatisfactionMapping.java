package com.autonoma.erp.model;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "INTERNAL_CUSTOMER_SATISFACTION_MAPPING")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class InternalCustomerSatisfactionMapping extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", nullable = false)
    private EmployeeMaster employee;

    @Column(name = "FEEDBACK_CYCLE", nullable = false, length = 50)
    private String feedbackCycle;

    @Column(name = "ELIGIBILITY_DATE", nullable = false)
    private LocalDate eligibilityDate;

    @Column(name = "FEEDBACK_START_DATE")
    private LocalDate feedbackStartDate;

    @Column(name = "FEEDBACK_END_DATE")
    private LocalDate feedbackEndDate;

    @Column(name = "IS_CLOSED", nullable = false, length = 1)
    private String isClosed = "N";

    @Column(name = "STATUS", nullable = false, length = 50)
    private String status = "Pending";

    @Column(name = "REMINDER_COUNT", nullable = false)
    private Integer reminderCount = 0;

    @Column(name = "LAST_REMINDER_DATE")
    private LocalDate lastReminderDate;

    @Column(name = "NEXT_REMINDER_DATE")
    private LocalDate nextReminderDate;

    @Column(name = "TOTAL_SCORE")
    private Integer totalScore;

    @Column(name = "AVERAGE_SCORE")
    private Double averageScore;

    public Long getId() { return id; }
    public EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(EmployeeMaster employee) { this.employee = employee; }
    public String getFeedbackCycle() { return feedbackCycle; }
    public void setFeedbackCycle(String feedbackCycle) { this.feedbackCycle = feedbackCycle; }
    public LocalDate getEligibilityDate() { return eligibilityDate; }
    public void setEligibilityDate(LocalDate eligibilityDate) { this.eligibilityDate = eligibilityDate; }
    public LocalDate getFeedbackStartDate() { return feedbackStartDate; }
    public void setFeedbackStartDate(LocalDate feedbackStartDate) { this.feedbackStartDate = feedbackStartDate; }
    public LocalDate getFeedbackEndDate() { return feedbackEndDate; }
    public void setFeedbackEndDate(LocalDate feedbackEndDate) { this.feedbackEndDate = feedbackEndDate; }
    public String getIsClosed() { return isClosed; }
    public void setIsClosed(String isClosed) { this.isClosed = isClosed; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getReminderCount() { return reminderCount; }
    public void setReminderCount(Integer reminderCount) { this.reminderCount = reminderCount; }
    public LocalDate getLastReminderDate() { return lastReminderDate; }
    public void setLastReminderDate(LocalDate lastReminderDate) { this.lastReminderDate = lastReminderDate; }
    public LocalDate getNextReminderDate() { return nextReminderDate; }
    public void setNextReminderDate(LocalDate nextReminderDate) { this.nextReminderDate = nextReminderDate; }

    @Column(name = "SUBMITTED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedDate;

    @Column(name = "SUGGESTIONS", columnDefinition = "NVARCHAR(MAX)")
    private String suggestions;

    @Column(name = "GENERAL_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String generalComments;

    public Date getSubmittedDate() { return submittedDate; }
    public void setSubmittedDate(Date submittedDate) { this.submittedDate = submittedDate; }
    public Integer getTotalScore() { return totalScore; }
    public void setTotalScore(Integer totalScore) { this.totalScore = totalScore; }
    public Double getAverageScore() { return averageScore; }
    public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }
    public String getGeneralComments() { return generalComments; }
    public void setGeneralComments(String generalComments) { this.generalComments = generalComments; }
    public String getSuggestions() { return suggestions; }
    public void setSuggestions(String suggestions) { this.suggestions = suggestions; }
}

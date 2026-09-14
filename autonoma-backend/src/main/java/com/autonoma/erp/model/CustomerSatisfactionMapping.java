package com.autonoma.erp.model;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "CUSTOMER_SATISFACTION_MAPPING")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSatisfactionMapping extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "CUSTOMER_ID", nullable = false)
    private AccountLedger customer;

    public Long getId() { return id; }
    public AccountLedger getCustomer() { return customer; }

    @Column(name = "FEEDBACK_CYCLE", nullable = false, length = 50)
    private String feedbackCycle;

    @Column(name = "ELIGIBILITY_DATE", nullable = false)
    private LocalDate eligibilityDate;

    @Column(name = "SEND_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date sendDate;

    @Column(name = "SUBMIT_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date submitDate;

    @Column(name = "STATUS", nullable = false, length = 50)
    private String status = "Pending"; // Pending, Completed, Overdue, Closed

    @Column(name = "DISMISSED_COUNT", nullable = false)
    private Integer dismissedCount = 0;

    @Column(name = "TOTAL_SCORE")
    private Integer totalScore;

    @Column(name = "AVERAGE_SCORE")
    private Double averageScore;

    @Column(name = "GENERAL_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String generalComments;

    public String getFeedbackCycle() { return feedbackCycle; }
    public void setFeedbackCycle(String feedbackCycle) { this.feedbackCycle = feedbackCycle; }
    public LocalDate getEligibilityDate() { return eligibilityDate; }
    public LocalDate getFeedbackStartDate() { return feedbackStartDate; }
    public void setEligibilityDate(LocalDate eligibilityDate) { this.eligibilityDate = eligibilityDate; }
    public Date getSendDate() { return sendDate; }
    public void setSendDate(Date sendDate) { this.sendDate = sendDate; }
    public Date getSubmitDate() { return submitDate; }
    public void setSubmitDate(Date submitDate) { this.submitDate = submitDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getDismissedCount() { return dismissedCount; }
    public void setDismissedCount(Integer dismissedCount) { this.dismissedCount = dismissedCount; }
    public void setCustomer(AccountLedger customer) { this.customer = customer; }
    public Integer getTotalScore() { return totalScore; }
    public void setTotalScore(Integer totalScore) { this.totalScore = totalScore; }
    public Double getAverageScore() { return averageScore; }
    public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }
    public String getGeneralComments() { return generalComments; }
    public void setGeneralComments(String generalComments) { this.generalComments = generalComments; }
    public LocalDate getFeedbackEndDate() { return feedbackEndDate; }
    public void setFeedbackEndDate(LocalDate feedbackEndDate) { this.feedbackEndDate = feedbackEndDate; }
    public String getIsClosed() { return isClosed; }
    public void setIsClosed(String isClosed) { this.isClosed = isClosed; }
    public Integer getReminderCount() { return reminderCount; }
    public void setReminderCount(Integer reminderCount) { this.reminderCount = reminderCount; }
    public LocalDate getLastReminderDate() { return lastReminderDate; }
    public void setLastReminderDate(LocalDate lastReminderDate) { this.lastReminderDate = lastReminderDate; }
    public LocalDate getNextReminderDate() { return nextReminderDate; }
    public void setNextReminderDate(LocalDate nextReminderDate) { this.nextReminderDate = nextReminderDate; }

    @Column(name = "FEEDBACK_START_DATE")
    private LocalDate feedbackStartDate;

    @Column(name = "FEEDBACK_END_DATE")
    private LocalDate feedbackEndDate;

    @Column(name = "IS_CLOSED", nullable = false, length = 1)
    private String isClosed = "N";

    @Column(name = "REMINDER_COUNT", nullable = false)
    private Integer reminderCount = 0;

    @Column(name = "LAST_REMINDER_DATE")
    private LocalDate lastReminderDate;

    @Column(name = "NEXT_REMINDER_DATE")
    private LocalDate nextReminderDate;
}

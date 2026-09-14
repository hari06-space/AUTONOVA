package com.autonoma.erp.modules.qms.satisfaction.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "EMPLOYEE_SATISFACTION_TRACKING")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class EmployeeSatisfactionTracking extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", nullable = false)
    private EmployeeMaster employee;

    @Column(name = "FEEDBACK_CYCLE", length = 50, nullable = false)
    private String feedbackCycle; // e.g. "June 2026"

    @Column(name = "STATUS", length = 50, nullable = false)
    private String status; // Pending, Completed, Overdue

    @Column(name = "REMINDER_COUNT", nullable = false)
    private Integer reminderCount = 0;

    @Column(name = "FIRST_REMINDER_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date firstReminderDate;

    @Column(name = "LAST_REMINDER_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastReminderDate;

    @Column(name = "NEXT_REMINDER_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date nextReminderDate;

    @Column(name = "EMAIL_STATUS", length = 100)
    private String emailStatus;

    @Column(name = "SUBMITTED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedDate;

    @Column(name = "ELIGIBILITY_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date eligibilityDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(EmployeeMaster employee) { this.employee = employee; }
    public String getFeedbackCycle() { return feedbackCycle; }
    public void setFeedbackCycle(String feedbackCycle) { this.feedbackCycle = feedbackCycle; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getReminderCount() { return reminderCount; }
    public void setReminderCount(Integer reminderCount) { this.reminderCount = reminderCount; }
    public Date getFirstReminderDate() { return firstReminderDate; }
    public void setFirstReminderDate(Date firstReminderDate) { this.firstReminderDate = firstReminderDate; }
    public Date getLastReminderDate() { return lastReminderDate; }
    public void setLastReminderDate(Date lastReminderDate) { this.lastReminderDate = lastReminderDate; }
    public Date getNextReminderDate() { return nextReminderDate; }
    public void setNextReminderDate(Date nextReminderDate) { this.nextReminderDate = nextReminderDate; }
    public String getEmailStatus() { return emailStatus; }
    public void setEmailStatus(String emailStatus) { this.emailStatus = emailStatus; }
    public Date getSubmittedDate() { return submittedDate; }
    public void setSubmittedDate(Date submittedDate) { this.submittedDate = submittedDate; }
    public Date getEligibilityDate() { return eligibilityDate; }
    public void setEligibilityDate(Date eligibilityDate) { this.eligibilityDate = eligibilityDate; }
}

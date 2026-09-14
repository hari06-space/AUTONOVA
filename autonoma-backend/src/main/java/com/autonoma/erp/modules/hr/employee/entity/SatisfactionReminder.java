package com.autonoma.erp.modules.hr.employee.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_SATISFACTION_REMINDER")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SatisfactionReminder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ENTITY_ID", nullable = false, length = 50)
    private String entityId;

    @Column(name = "ENTITY_NAME", nullable = false, length = 200)
    private String entityName;

    @Column(name = "SATISFACTION_TYPE", nullable = false, length = 50)
    private String satisfactionType; // Employee, Vendor, Customer, Internal Customer

    @Column(name = "REMINDER_COUNT", nullable = false)
    private Integer reminderCount = 0;

    @Column(name = "LAST_REMINDER_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastReminderDate;

    @Column(name = "NEXT_REMINDER_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date nextReminderDate;

    @Column(name = "FEEDBACK_STATUS", nullable = false, length = 50)
    private String feedbackStatus; // Assigned, Completed, Pending, Overdue, Closed

    @Column(name = "EMAIL_STATUS", nullable = false, length = 50)
    private String emailStatus; // Sent, Failed, Pending, Bounced

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

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    public String getFeedbackStatus() { return feedbackStatus; }
    public void setFeedbackStatus(String feedbackStatus) { this.feedbackStatus = feedbackStatus; }
    public String getSatisfactionType() { return satisfactionType; }
    public void setSatisfactionType(String satisfactionType) { this.satisfactionType = satisfactionType; }

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
        this.createdDate = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        this.updatedDate = new Date();
    }
}


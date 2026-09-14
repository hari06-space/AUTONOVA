package com.autonoma.erp.modules.qms.checklist.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "QMS_CHECKLIST_RENEWAL_AUDIT_LOG")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QmsChecklistRenewalAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "MASTER_CHECKLIST_ID", nullable = false)
    private Long masterChecklistId;

    @Column(name = "RENEWAL_CHECKLIST_ID")
    private Long renewalChecklistId;

    @Column(name = "REMINDER_DATE")
    @Temporal(TemporalType.DATE)
    private Date reminderDate;

    @Column(name = "PREV_REMINDER_DATE")
    @Temporal(TemporalType.DATE)
    private Date prevReminderDate;

    @Column(name = "UPDATED_REMINDER_DATE")
    @Temporal(TemporalType.DATE)
    private Date updatedReminderDate;

    @Column(name = "FREQUENCY", length = 50)
    private String frequency;

    @Column(name = "TRIGGER_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date triggerTime;

    @Column(name = "STATUS", length = 20)
    private String status;

    @Column(name = "ERROR_MESSAGE", columnDefinition = "NVARCHAR(MAX)")
    private String errorMessage;

    public Long getMasterChecklistId() { return masterChecklistId; }
    public Date getReminderDate() { return reminderDate; }

    public void setMasterChecklistId(Long masterChecklistId) { this.masterChecklistId = masterChecklistId; }
    public void setRenewalChecklistId(Long renewalChecklistId) { this.renewalChecklistId = renewalChecklistId; }
    public void setReminderDate(Date reminderDate) { this.reminderDate = reminderDate; }
    public void setPrevReminderDate(Date prevReminderDate) { this.prevReminderDate = prevReminderDate; }
    public void setUpdatedReminderDate(Date updatedReminderDate) { this.updatedReminderDate = updatedReminderDate; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public void setTriggerTime(Date triggerTime) { this.triggerTime = triggerTime; }
    public void setStatus(String status) { this.status = status; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}

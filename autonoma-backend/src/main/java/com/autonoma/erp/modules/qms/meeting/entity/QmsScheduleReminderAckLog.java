package com.autonoma.erp.modules.qms.meeting.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "QMS_SCHEDULE_REMINDER_ACK_LOG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QmsScheduleReminderAckLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SCHEDULE_ID", nullable = false)
    private Long scheduleId;

    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @Column(name = "USER_ID", columnDefinition = "NVARCHAR(100)")
    private String userId;

    @Column(name = "REMINDER_DATE", nullable = false)
    private LocalDate reminderDate;

    @Column(name = "ACKNOWLEDGED_AT", nullable = false)
    private LocalDateTime acknowledgedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDate getReminderDate() { return reminderDate; }
    public void setReminderDate(LocalDate reminderDate) { this.reminderDate = reminderDate; }

    public LocalDateTime getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getStatusObj() { return statusObj; }
    public void setStatusObj(com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj) { this.statusObj = statusObj; }

    @com.fasterxml.jackson.annotation.JsonProperty("status")
    public String getStatus() {
        return statusObj != null ? statusObj.getName() : "ACKNOWLEDGED";
    }
}

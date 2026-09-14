package com.autonoma.erp.modules.qms.meeting.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "MEETING_EXECUTION_LOG")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "CONFIG_ID", nullable = false)
    private Long configId;

    @Column(name = "SCHEDULER_NAME", nullable = false, length = 150)
    private String schedulerName;

    @Builder.Default
    @Column(name = "TRIGGER_TIME", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date triggerTime = new Date();

    @Builder.Default
    @Column(name = "DURATION_MS", nullable = false)
    private Long durationMs = 0L;

    @Builder.Default
    @Column(name = "SUCCESS_COUNT", nullable = false)
    private Integer successCount = 0;

    @Builder.Default
    @Column(name = "FAILURE_COUNT", nullable = false)
    private Integer failureCount = 0;

    @Column(name = "STATUS", nullable = false, length = 50)
    private String status;

    @Column(name = "ERROR_DETAILS", columnDefinition = "NVARCHAR(MAX)")
    private String errorDetails;

    @Builder.Default
    @Column(name = "CREATED_DATE", nullable = false, updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    public void setConfigId(Long configId) { this.configId = configId; }
    public void setSchedulerName(String schedulerName) { this.schedulerName = schedulerName; }
    public void setStatus(String status) { this.status = status; }
    public void setTriggerTime(Date triggerTime) { this.triggerTime = triggerTime; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }
    public void setSuccessCount(Integer successCount) { this.successCount = successCount; }
    public void setFailureCount(Integer failureCount) { this.failureCount = failureCount; }
    public void setErrorDetails(String errorDetails) { this.errorDetails = errorDetails; }
    public Long getRowId() { return rowId; }
    public String getStatus() { return status; }
    public String getErrorDetails() { return errorDetails; }
}

package com.autonoma.erp.model.admin;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "BOS_SCHEDULER_EXECUTION_LOG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BosSchedulerExecutionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long rowId;

    @Column(name = "CONFIG_ID", nullable = false)
    private Long configId;

    @Column(name = "SCHEDULER_NAME", nullable = false, length = 150)
    private String schedulerName;

    @Column(name = "TRIGGER_TIME", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date triggerTime = new Date();

    @Column(name = "DURATION_MS", nullable = false)
    private Long durationMs = 0L;

    @Column(name = "SUCCESS_COUNT", nullable = false)
    private Integer successCount = 0;

    @Column(name = "FAILURE_COUNT", nullable = false)
    private Integer failureCount = 0;

    @Column(name = "STATUS", nullable = false, length = 50)
    private String status; // SCHEDULED, RUNNING, COMPLETED, FAILED, CANCELLED

    @Column(name = "ERROR_DETAILS", columnDefinition = "NVARCHAR(MAX)")
    private String errorDetails;

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

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long configId; private String schedulerName; private Date triggerTime = new Date();
        private Long durationMs = 0L; private Integer successCount = 0; private Integer failureCount = 0;
        private String status; private String errorDetails; private Date createdDate = new Date();
        public Builder configId(Long v) { this.configId = v; return this; }
        public Builder schedulerName(String v) { this.schedulerName = v; return this; }
        public Builder triggerTime(Date v) { this.triggerTime = v; return this; }
        public Builder durationMs(Long v) { this.durationMs = v; return this; }
        public Builder successCount(Integer v) { this.successCount = v; return this; }
        public Builder failureCount(Integer v) { this.failureCount = v; return this; }
        public Builder status(String v) { this.status = v; return this; }
        public Builder errorDetails(String v) { this.errorDetails = v; return this; }
        public Builder createdDate(Date v) { this.createdDate = v; return this; }
        public BosSchedulerExecutionLog build() {
            BosSchedulerExecutionLog l = new BosSchedulerExecutionLog();
            l.configId = this.configId; l.schedulerName = this.schedulerName; l.triggerTime = this.triggerTime;
            l.durationMs = this.durationMs; l.successCount = this.successCount; l.failureCount = this.failureCount;
            l.status = this.status; l.errorDetails = this.errorDetails; l.createdDate = this.createdDate;
            return l;
        }
    }
}

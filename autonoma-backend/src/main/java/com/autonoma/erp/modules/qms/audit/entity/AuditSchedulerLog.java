package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "QMS_AUDIT_SCHEDULER_LOG")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class AuditSchedulerLog extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CONFIG_ID", nullable = false)
    private Long configId;

    @Column(name = "TRIGGER_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date triggerTime;

    @Column(name = "STATUS", length = 50)
    private String status;

    @Column(name = "SUCCESS_COUNT")
    private Integer successCount;

    @Column(name = "FAILURE_COUNT")
    private Integer failureCount;

    @Column(name = "DURATION_MS")
    private Long durationMs;

    @Column(name = "ERROR_DETAILS", columnDefinition = "NVARCHAR(MAX)")
    private String errorDetails;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getConfigId() { return configId; }
    public void setConfigId(Long configId) { this.configId = configId; }
    public Date getTriggerTime() { return triggerTime; }
    public void setTriggerTime(Date triggerTime) { this.triggerTime = triggerTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getSuccessCount() { return successCount; }
    public void setSuccessCount(Integer successCount) { this.successCount = successCount; }
    public Integer getFailureCount() { return failureCount; }
    public void setFailureCount(Integer failureCount) { this.failureCount = failureCount; }
    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }
    public String getErrorDetails() { return errorDetails; }
    public void setErrorDetails(String errorDetails) { this.errorDetails = errorDetails; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long configId; private Date triggerTime; private String status;
        private Integer successCount; private Integer failureCount; private Long durationMs; private String errorDetails;
        public Builder configId(Long v) { this.configId = v; return this; }
        public Builder triggerTime(Date v) { this.triggerTime = v; return this; }
        public Builder status(String v) { this.status = v; return this; }
        public Builder successCount(Integer v) { this.successCount = v; return this; }
        public Builder failureCount(Integer v) { this.failureCount = v; return this; }
        public Builder durationMs(Long v) { this.durationMs = v; return this; }
        public Builder errorDetails(String v) { this.errorDetails = v; return this; }
        public AuditSchedulerLog build() {
            AuditSchedulerLog log = new AuditSchedulerLog();
            log.configId = this.configId; log.triggerTime = this.triggerTime; log.status = this.status;
            log.successCount = this.successCount; log.failureCount = this.failureCount;
            log.durationMs = this.durationMs; log.errorDetails = this.errorDetails;
            return log;
        }
    }
}

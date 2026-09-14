package com.autonoma.erp.modules.qms.checklist.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "QMS_CHECKLIST_EOD_AUDIT_LOG")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QmsChecklistEodAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CHECKLIST_CLOSED_ID", nullable = false)
    private Long checklistClosedId;

    @Column(name = "PROCESSING_DATE")
    @Temporal(TemporalType.DATE)
    private Date processingDate;

    @Column(name = "PREVIOUS_STATUS", length = 50)
    private String previousStatus;

    @Column(name = "UPDATED_STATUS", length = 50)
    private String updatedStatus;

    @Column(name = "TRIGGER_TYPE", length = 50)
    private String triggerType;

    @Column(name = "EXECUTION_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date executionTime;

    @Column(name = "STATUS", length = 20)
    private String status;

    @Column(name = "ERROR_MESSAGE", columnDefinition = "NVARCHAR(MAX)")
    private String errorMessage;

    public void setChecklistClosedId(Long checklistClosedId) { this.checklistClosedId = checklistClosedId; }
    public void setProcessingDate(Date processingDate) { this.processingDate = processingDate; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }
    public void setUpdatedStatus(String updatedStatus) { this.updatedStatus = updatedStatus; }
    public void setTriggerType(String triggerType) { this.triggerType = triggerType; }
    public void setExecutionTime(Date executionTime) { this.executionTime = executionTime; }
    public void setStatus(String status) { this.status = status; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}

package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "QMS_NCR_OFI_MASTER")
@Data
public class NcrOfiMaster extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "NCR_OFI_NO", unique = true, nullable = false)
    private String ncrOfiNo;

    @Column(name = "OBSERVATION_ID", nullable = false)
    private Long observationId;

    @Column(name = "OBSERVATION_DETAIL_ID", nullable = false)
    private Long observationDetailId;

    @Column(name = "TYPE", nullable = false)
    private String type; // NCR or OFI

    @Column(name = "OBSERVATION_DATE", nullable = false)
    private LocalDate observationDate;

    @Column(name = "TARGET_DATE", nullable = false)
    private LocalDate targetDate;

    @Column(name = "NCR_APPROVER_ID")
    private Integer ncrApproverId;

    @Column(name = "AUDITEE_NAME")
    private String auditeeName;

    @Column(name = "NCR_APPROVER_NAME")
    private String ncrApproverName;

    @Column(name = "ROOT_CAUSE")
    private String rootCause;

    @Column(name = "CORRECTIVE_ACTION")
    private String correctiveAction;

    @Column(name = "PREVENTIVE_ACTION")
    private String preventiveAction;

    @Column(name = "STATUS")
    private String status = "OPEN";

    @Column(name = "APPROVAL_STATUS")
    private String approvalStatus = "PENDING";

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getNcrOfiNo() { return ncrOfiNo; }
    public void setNcrOfiNo(String ncrOfiNo) { this.ncrOfiNo = ncrOfiNo; }
    public Long getObservationId() { return observationId; }
    public void setObservationId(Long observationId) { this.observationId = observationId; }
    public Long getObservationDetailId() { return observationDetailId; }
    public void setObservationDetailId(Long observationDetailId) { this.observationDetailId = observationDetailId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public LocalDate getObservationDate() { return observationDate; }
    public void setObservationDate(LocalDate observationDate) { this.observationDate = observationDate; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public Integer getNcrApproverId() { return ncrApproverId; }
    public void setNcrApproverId(Integer ncrApproverId) { this.ncrApproverId = ncrApproverId; }
    public String getAuditeeName() { return auditeeName; }
    public void setAuditeeName(String auditeeName) { this.auditeeName = auditeeName; }
    public String getNcrApproverName() { return ncrApproverName; }
    public void setNcrApproverName(String ncrApproverName) { this.ncrApproverName = ncrApproverName; }
    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }
    public String getCorrectiveAction() { return correctiveAction; }
    public void setCorrectiveAction(String correctiveAction) { this.correctiveAction = correctiveAction; }
    public String getPreventiveAction() { return preventiveAction; }
    public void setPreventiveAction(String preventiveAction) { this.preventiveAction = preventiveAction; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
}

package com.autonoma.erp.modules.qms.audit.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "QMS_NCR_REWORK_LOG")
@Data
public class NcrReworkLog {

    // ── Primary Key ──────────────────────────────────────────────────────────
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // ── Legacy observation-detail link (rework action tracking) ──────────────
    @Column(name = "OBSERVATION_DETAIL_ID")
    private Long observationDetailId;

    @Column(name = "NCR_NO", columnDefinition = "NVARCHAR(100)")
    private String ncrNo;

    @Column(name = "REWORK_NO")
    private Integer reworkNo;

    @Column(name = "SUBMITTED_BY")
    private String submittedBy;

    @Column(name = "SUBMITTED_AT")
    private LocalDateTime submittedAt;

    @Column(name = "ROOT_CAUSE")
    private String rootCause;

    @Column(name = "CORRECTIVE_ACTION")
    private String correctiveAction;

    @Column(name = "PREVENTIVE_ACTION")
    private String preventiveAction;

    @Column(name = "NCR_STATUS")
    private String ncrStatus;

    @Column(name = "VERIFY_STATUS")
    private String verifyStatus;

    @Column(name = "VERIFIED_BY")
    private String verifiedBy;

    @Column(name = "VERIFY_DATE")
    private LocalDateTime verifyDate;

    // ── Audit observation context (V380) ─────────────────────────────────────

    /** FK → QMS_AUDIT_OBSERVATION.ID */
    @Column(name = "OBSERVATION_ID")
    private Long observationId;

    /** FK → QMS_AUDIT_SCHEDULE.ID */
    @Column(name = "AUDIT_SCHEDULE_ID")
    private Long auditScheduleId;

    /** Denormalised schedule no / audit identifier for reporting */
    @Column(name = "AUDIT_ID")
    private String auditId;

    /** Checklist item ID (nullable – not always available from observation detail) */
    @Column(name = "CHECKLIST_ID")
    private Long checklistId;

    @Column(name = "CLAUSE")
    private String clause;

    @Column(name = "CRITERIA")
    private String criteria;

    /** Observation status value: NC or OFI */
    @Column(name = "STATUS")
    private String status;

    /** Observation comments / remarks */
    @Column(name = "REMARKS")
    private String remarks;

    /** Evidence attachment path */
    @Column(name = "ATTACHMENT")
    private String attachment;

    // ── Workflow fields (V380, initial values set on first insert) ────────────

    /** Overall workflow state – initial value: Pending */
    @Column(name = "WORKFLOW_STATUS")
    private String workflowStatus;

    /** Approval state – initial value: Open */
    @Column(name = "APPROVAL_STATUS")
    private String approvalStatus;

    /** User assigned to rework this finding – initial value: null */
    @Column(name = "ASSIGNED_USER")
    private String assignedUser;

    /** Rework completion state – initial value: Pending */
    @Column(name = "REWORK_STATUS")
    private String reworkStatus;

    /** Date the rework was completed – initial value: null */
    @Column(name = "COMPLETED_DATE")
    private LocalDateTime completedDate;

    /** Date the finding was formally closed – initial value: null */
    @Column(name = "CLOSED_DATE")
    private LocalDateTime closedDate;

    // ── Multi-tenancy (V380) ─────────────────────────────────────────────────

    @Column(name = "COMPANY_ID")
    private Long companyId;

    @Column(name = "BRANCH_ID")
    private Long branchId;

    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    // ── Standard audit columns ───────────────────────────────────────────────

    @Column(name = "CREATED_BY")
    private String createdBy;

    @Column(name = "CREATED_DATE")
    private LocalDateTime createdDate;

    @Column(name = "UPDATED_BY")
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Long getObservationDetailId() { return observationDetailId; }
    public void setObservationDetailId(Long observationDetailId) { this.observationDetailId = observationDetailId; }
    public Integer getReworkNo() { return reworkNo; }
    public void setReworkNo(Integer reworkNo) { this.reworkNo = reworkNo; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }
    public String getCorrectiveAction() { return correctiveAction; }
    public void setCorrectiveAction(String correctiveAction) { this.correctiveAction = correctiveAction; }
    public String getPreventiveAction() { return preventiveAction; }
    public void setPreventiveAction(String preventiveAction) { this.preventiveAction = preventiveAction; }
    public String getNcrStatus() { return ncrStatus; }
    public void setNcrStatus(String ncrStatus) { this.ncrStatus = ncrStatus; }
    public String getVerifyStatus() { return verifyStatus; }
    public void setVerifyStatus(String verifyStatus) { this.verifyStatus = verifyStatus; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public LocalDateTime getVerifyDate() { return verifyDate; }
    public void setVerifyDate(LocalDateTime verifyDate) { this.verifyDate = verifyDate; }
    public Long getObservationId() { return observationId; }
    public void setObservationId(Long observationId) { this.observationId = observationId; }
    public Long getAuditScheduleId() { return auditScheduleId; }
    public void setAuditScheduleId(Long auditScheduleId) { this.auditScheduleId = auditScheduleId; }
    public String getAuditId() { return auditId; }
    public void setAuditId(String auditId) { this.auditId = auditId; }
    public Long getChecklistId() { return checklistId; }
    public void setChecklistId(Long checklistId) { this.checklistId = checklistId; }
    public String getClause() { return clause; }
    public void setClause(String clause) { this.clause = clause; }
    public String getCriteria() { return criteria; }
    public void setCriteria(String criteria) { this.criteria = criteria; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getAttachment() { return attachment; }
    public void setAttachment(String attachment) { this.attachment = attachment; }
    public String getWorkflowStatus() { return workflowStatus; }
    public void setWorkflowStatus(String workflowStatus) { this.workflowStatus = workflowStatus; }
    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
    public String getAssignedUser() { return assignedUser; }
    public void setAssignedUser(String assignedUser) { this.assignedUser = assignedUser; }
    public String getReworkStatus() { return reworkStatus; }
    public void setReworkStatus(String reworkStatus) { this.reworkStatus = reworkStatus; }
    public LocalDateTime getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDateTime completedDate) { this.completedDate = completedDate; }
    public LocalDateTime getClosedDate() { return closedDate; }
    public void setClosedDate(LocalDateTime closedDate) { this.closedDate = closedDate; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(LocalDateTime updatedDate) { this.updatedDate = updatedDate; }
}

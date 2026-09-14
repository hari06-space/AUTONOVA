package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "QMS_AUDIT_OBSERVATION_DETAIL")
public class AuditObservationDetail extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OBSERVATION_ID")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private AuditObservation auditObservation;

    @com.fasterxml.jackson.annotation.JsonProperty("observationNo")
    public String getObservationNo() {
        return auditObservation != null ? auditObservation.getObservationNo() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("auditScheduleNo")
    public String getAuditScheduleNo() {
        return auditObservation != null ? auditObservation.getAuditScheduleNo() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("observationDate")
    public java.util.Date getObservationDate() {
        return auditObservation != null ? auditObservation.getObservationDate() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("auditType")
    public String getAuditType() {
        return auditObservation != null ? auditObservation.getAuditType() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("auditArea")
    public String getAuditArea() {
        return auditObservation != null ? auditObservation.getAuditArea() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("auditor")
    public String getAuditor() {
        return auditObservation != null ? auditObservation.getAuditor() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("auditee")
    public String getAuditee() {
        return auditObservation != null ? auditObservation.getAuditee() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("ncrApprovedBy")
    public String getNcrApprovedBy() {
        return auditObservation != null ? auditObservation.getNcrApprovedBy() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("departmentName")
    public String getDepartmentName() {
        return auditObservation != null ? auditObservation.getDepartmentName() : null;
    }

    @Size(max = 50, message = "NCR No cannot exceed 50 characters")
    @Column(name = "NCR_NO", columnDefinition = "NVARCHAR(50)")
    private String ncrNo;

    @Size(max = 50, message = "Seq No cannot exceed 50 characters")
    @Column(name = "SEQ_NO", columnDefinition = "NVARCHAR(50)")
    private String seqNo;

    @Size(max = 100, message = "Clause cannot exceed 100 characters")
    @Column(name = "CLAUSE", columnDefinition = "NVARCHAR(100)")
    private String clause;

    @Column(name = "CRITERIA_DETAILS", columnDefinition = "NVARCHAR(MAX)")
    private String criteriaDetails;

    @Column(name = "ATTACHMENT_REQ")
    private Boolean attachmentReq = false;

    @com.fasterxml.jackson.annotation.JsonSetter("attachmentReq")
    public void setAttachmentReq(Object attachmentReq) {
        if (attachmentReq instanceof Boolean) {
            this.attachmentReq = (Boolean) attachmentReq;
        } else if (attachmentReq instanceof String) {
            this.attachmentReq = "YES".equalsIgnoreCase((String) attachmentReq)
                    || "true".equalsIgnoreCase((String) attachmentReq);
        } else {
            this.attachmentReq = false;
        }
    }

    @Transient
    private String attachmentPath;

    @Size(max = 50, message = "Observation Status cannot exceed 50 characters")
    @Column(name = "OBSERVATION_STATUS", columnDefinition = "NVARCHAR(50)")
    private String observationStatus;

    @Size(max = 50, message = "Approval Status cannot exceed 50 characters")
    @Column(name = "APPROVAL_STATUS", columnDefinition = "NVARCHAR(50)")
    private String approvalStatus;

    @Column(name = "COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    @Column(name = "ROOT_CAUSE", columnDefinition = "NVARCHAR(MAX)")
    private String rootCause;

    @Column(name = "CORRECTIVE_ACTION", columnDefinition = "NVARCHAR(MAX)")
    private String correctiveAction;

    @Column(name = "PREVENTIVE_ACTION", columnDefinition = "NVARCHAR(MAX)")
    private String preventiveAction;

    @Column(name = "TARGET_DATE")
    @Temporal(TemporalType.DATE)
    private java.util.Date targetDate;

    @Column(name = "CLOSED_DATE")
    @Temporal(TemporalType.DATE)
    private java.util.Date closedDate;

    @Size(max = 255, message = "Closed By cannot exceed 255 characters")
    @Column(name = "CLOSED_BY", columnDefinition = "NVARCHAR(255)")
    private String closedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "NCR_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster ncrStatusObj;

    @Transient
    private String ncrStatus;

    @Column(name = "CANCEL_REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String cancelRemarks;

    @Column(name = "REV_NO")
    private Integer revNo = 0;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    // Helper method for bi-directional sync
    public void setAuditObservation(AuditObservation observation) {
        this.auditObservation = observation;
    }

    public AuditObservation getAuditObservation() {
        return this.auditObservation;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNcrNo() {
        return ncrNo;
    }

    public void setNcrNo(String ncrNo) {
        this.ncrNo = ncrNo;
    }

    public String getSeqNo() {
        return seqNo;
    }

    public void setSeqNo(String seqNo) {
        this.seqNo = seqNo;
    }

    public String getClause() {
        return clause;
    }

    public void setClause(String clause) {
        this.clause = clause;
    }

    public String getCriteriaDetails() {
        return criteriaDetails;
    }

    public void setCriteriaDetails(String criteriaDetails) {
        this.criteriaDetails = criteriaDetails;
    }

    public Boolean getAttachmentReq() {
        return attachmentReq;
    }

    public String getObservationStatus() {
        return observationStatus;
    }

    public void setObservationStatus(String observationStatus) {
        this.observationStatus = observationStatus;
    }

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public String getRootCause() {
        return rootCause;
    }

    public void setRootCause(String rootCause) {
        this.rootCause = rootCause;
    }

    public String getCorrectiveAction() {
        return correctiveAction;
    }

    public void setCorrectiveAction(String correctiveAction) {
        this.correctiveAction = correctiveAction;
    }

    public String getPreventiveAction() {
        return preventiveAction;
    }

    public void setPreventiveAction(String preventiveAction) {
        this.preventiveAction = preventiveAction;
    }

    public java.util.Date getTargetDate() {
        return targetDate;
    }

    public void setTargetDate(java.util.Date targetDate) {
        this.targetDate = targetDate;
    }

    public java.util.Date getClosedDate() {
        return closedDate;
    }

    public void setClosedDate(java.util.Date closedDate) {
        this.closedDate = closedDate;
    }

    public String getClosedBy() {
        return closedBy;
    }

    public void setClosedBy(String closedBy) {
        this.closedBy = closedBy;
    }

    public String getNcrStatus() {
        if (ncrStatusObj != null) {
            return ncrStatusObj.getName();
        }
        return ncrStatus;
    }

    public void setNcrStatus(String ncrStatus) {
        this.ncrStatus = ncrStatus;
        if (ncrStatus != null && !ncrStatus.trim().isEmpty()) {
            try {
                com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository repo = com.autonoma.erp.util.SpringContext
                        .getBean(com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository.class);
                if (repo != null) {
                    String normName = ncrStatus.trim();
                    java.util.Optional<com.autonoma.erp.modules.platform.common.entity.StatusMaster> existing = repo
                            .findByName(normName);
                    if (existing.isPresent()) {
                        this.ncrStatusObj = existing.get();
                    } else {
                        com.autonoma.erp.modules.platform.common.entity.StatusMaster newStatus = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                        newStatus.setName(normName);
                        this.ncrStatusObj = repo.save(newStatus);
                    }
                }
            } catch (Exception e) {
                System.err.println(
                        "Failed to resolve StatusMaster for status: " + ncrStatus + ", error: " + e.getMessage());
            }
        } else {
            this.ncrStatusObj = null;
        }
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getNcrStatusObj() {
        return ncrStatusObj;
    }

    public void setNcrStatusObj(com.autonoma.erp.modules.platform.common.entity.StatusMaster ncrStatusObj) {
        this.ncrStatusObj = ncrStatusObj;
    }

    public String getCancelRemarks() {
        return cancelRemarks;
    }

    public void setCancelRemarks(String cancelRemarks) {
        this.cancelRemarks = cancelRemarks;
    }

    public Integer getRevNo() {
        return revNo;
    }

    public void setRevNo(Integer revNo) {
        this.revNo = revNo;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getAttachmentPath() {
        return this.attachmentPath;
    }

    public void setAttachmentPath(String attachmentPath) {
        this.attachmentPath = attachmentPath;
    }

    @Override
    protected void onCreate() {
        super.onCreate();
        trimFields();
    }

    @Override
    protected void onUpdate() {
        super.onUpdate();
        trimFields();
    }

    private void trimFields() {
        if (ncrNo != null)
            ncrNo = ncrNo.trim();
        if (seqNo != null)
            seqNo = seqNo.trim();
        if (clause != null)
            clause = clause.trim();
        if (criteriaDetails != null)
            criteriaDetails = criteriaDetails.trim();
        if (attachmentPath != null)
            attachmentPath = attachmentPath.trim();
        if (observationStatus != null)
            observationStatus = observationStatus.trim();
        if (approvalStatus != null)
            approvalStatus = approvalStatus.trim();
        if (comments != null)
            comments = comments.trim();
        if (rootCause != null)
            rootCause = rootCause.trim();
        if (correctiveAction != null)
            correctiveAction = correctiveAction.trim();
        if (preventiveAction != null)
            preventiveAction = preventiveAction.trim();
        if (closedBy != null)
            closedBy = closedBy.trim();
        if (ncrStatus != null)
            ncrStatus = ncrStatus.trim();
        if (cancelRemarks != null)
            cancelRemarks = cancelRemarks.trim();
    }
}

package com.autonoma.erp.dto;

import lombok.Data;
import java.util.Date;

@Data
public class NcrOfiDto {
    private Long id;
    private Long observationDetailId;
    private String ncrNo;
    private String observationNo;
    private Date observationDate;
    private Date createdDate;
    private String auditType;
    private String auditScheduleNo;
    private String departmentName;
    private String auditArea;
    private String auditAreaDetail;
    private String auditee;
    private String auditor;
    private String ncrApprovedBy;
    private Long auditeeId;
    private Long auditorId;
    private Long ncrApprovedById;
    private Long criteriaId;
    private String criteriaDetails;
    private String clause;
    private Integer observationId;
    private String observationStatus;
    private String attachmentReq;
    private String seqNo;
    private String rootCause;
    private String correctiveAction;
    private String preventiveAction;
    private Date targetDate;
    private Date closedDate;
    private String ncrStatus;
    private String ncrStatusName;
    private String remarks;
    private String cancelRemarks;
    private Integer revNo;
    private String attachmentPath;
    private String approvalStatus;
    private String externalAuditorImage;

    public String getExternalAuditorImage() { return externalAuditorImage; }
    public void setExternalAuditorImage(String externalAuditorImage) { this.externalAuditorImage = externalAuditorImage; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getObservationDetailId() { return observationDetailId; }
    public void setObservationDetailId(Long observationDetailId) { this.observationDetailId = observationDetailId; }
    public String getNcrNo() { return ncrNo; }
    public void setNcrNo(String ncrNo) { this.ncrNo = ncrNo; }
    public String getObservationNo() { return observationNo; }
    public void setObservationNo(String observationNo) { this.observationNo = observationNo; }
    public Date getObservationDate() { return observationDate; }
    public void setObservationDate(Date observationDate) { this.observationDate = observationDate; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getAuditType() { return auditType; }
    public void setAuditType(String auditType) { this.auditType = auditType; }
    public String getAuditScheduleNo() { return auditScheduleNo; }
    public void setAuditScheduleNo(String auditScheduleNo) { this.auditScheduleNo = auditScheduleNo; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public String getAuditArea() { return auditArea; }
    public void setAuditArea(String auditArea) { this.auditArea = auditArea; }
    public String getAuditAreaDetail() { return auditAreaDetail; }
    public void setAuditAreaDetail(String auditAreaDetail) { this.auditAreaDetail = auditAreaDetail; }
    public String getAuditee() { return auditee; }
    public void setAuditee(String auditee) { this.auditee = auditee; }
    public String getAuditor() { return auditor; }
    public void setAuditor(String auditor) { this.auditor = auditor; }
    public String getNcrApprovedBy() { return ncrApprovedBy; }
    public void setNcrApprovedBy(String ncrApprovedBy) { this.ncrApprovedBy = ncrApprovedBy; }
    public Long getAuditeeId() { return auditeeId; }
    public void setAuditeeId(Long auditeeId) { this.auditeeId = auditeeId; }
    public Long getAuditorId() { return auditorId; }
    public void setAuditorId(Long auditorId) { this.auditorId = auditorId; }
    public Long getNcrApprovedById() { return ncrApprovedById; }
    public void setNcrApprovedById(Long ncrApprovedById) { this.ncrApprovedById = ncrApprovedById; }
    public Long getCriteriaId() { return criteriaId; }
    public void setCriteriaId(Long criteriaId) { this.criteriaId = criteriaId; }
    public String getCriteriaDetails() { return criteriaDetails; }
    public void setCriteriaDetails(String criteriaDetails) { this.criteriaDetails = criteriaDetails; }
    public String getClause() { return clause; }
    public void setClause(String clause) { this.clause = clause; }
    public Integer getObservationId() { return observationId; }
    public void setObservationId(Integer observationId) { this.observationId = observationId; }
    public String getObservationStatus() { return observationStatus; }
    public void setObservationStatus(String observationStatus) { this.observationStatus = observationStatus; }
    public String getAttachmentReq() { return attachmentReq; }
    public void setAttachmentReq(String attachmentReq) { this.attachmentReq = attachmentReq; }
    public String getSeqNo() { return seqNo; }
    public void setSeqNo(String seqNo) { this.seqNo = seqNo; }
    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }
    public String getCorrectiveAction() { return correctiveAction; }
    public void setCorrectiveAction(String correctiveAction) { this.correctiveAction = correctiveAction; }
    public String getPreventiveAction() { return preventiveAction; }
    public void setPreventiveAction(String preventiveAction) { this.preventiveAction = preventiveAction; }
    public Date getTargetDate() { return targetDate; }
    public void setTargetDate(Date targetDate) { this.targetDate = targetDate; }
    public Date getClosedDate() { return closedDate; }
    public void setClosedDate(Date closedDate) { this.closedDate = closedDate; }
    public String getNcrStatus() { return ncrStatus; }
    public void setNcrStatus(String ncrStatus) { this.ncrStatus = ncrStatus; }
    public String getNcrStatusName() { return ncrStatusName; }
    public void setNcrStatusName(String ncrStatusName) { this.ncrStatusName = ncrStatusName; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getCancelRemarks() { return cancelRemarks; }
    public void setCancelRemarks(String cancelRemarks) { this.cancelRemarks = cancelRemarks; }
    public Integer getRevNo() { return revNo; }
    public void setRevNo(Integer revNo) { this.revNo = revNo; }
    public String getAttachmentPath() { return attachmentPath; }
    public void setAttachmentPath(String attachmentPath) { this.attachmentPath = attachmentPath; }
    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
}

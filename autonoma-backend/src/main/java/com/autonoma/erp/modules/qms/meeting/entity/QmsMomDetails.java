package com.autonoma.erp.modules.qms.meeting.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "QMS_MOM_DETAILS")
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class QmsMomDetails extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MOM_ID", nullable = false)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private QmsMomMaster mom;

    @Column(name = "DISCUSSED_POINT", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String discussedPoint;

    @Column(name = "MIN_NO", length = 100)
    private String minNo;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDiscussedPoint() { return discussedPoint; }
    public String getMinNo() { return minNo; }
    public void setMinNo(String minNo) { this.minNo = minNo; }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "POINT_TYPE_ID")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private QmsPointTypeMaster pointTypeObj;

    @Transient
    @JsonProperty("type")
    private String pointType;

    public String getPointType() {
        if (pointTypeObj != null) {
            return pointTypeObj.getCode();
        }
        return pointType;
    }

    public void setPointType(String pointType) {
        this.pointType = pointType;
        this.pointTypeObj = null;
    }

    @Transient
    private String materialList;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "MOM_DETAIL_ID")
    private List<QmsMomDetailsMaterialMapping> materialMappings = new ArrayList<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "PROCESS_TYPE_ID")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private QmsProcessTypeMaster processTypeObj;

    @Transient
    private String processType; // INFO / ACTION

    public String getProcessType() {
        if (processTypeObj != null) {
            return processTypeObj.getCode();
        }
        if (processType != null) {
            return processType;
        }
        return assignedTo != null ? "ACTION" : "INFO";
    }

    public void setProcessType(String processType) {
        this.processType = processType;
        this.processTypeObj = null;
    }

    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ASSIGNED_BY_ID")
    private EmployeeMaster assignedBy;

    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ASSIGNED_TO_ID")
    private EmployeeMaster assignedTo;

    @Column(name = "TARGET_DATE")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate targetDate;

    @Column(name = "REVIEW_DATE")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate reviewDate;

    @Column(name = "ATTACHMENT_REQUIRED")
    private String attachmentRequired = "NO";

    public String getAttachmentRequired() {
        return attachmentRequired;
    }

    public void setAttachmentRequired(String attachmentRequired) {
        this.attachmentRequired = attachmentRequired;
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj;

    @Transient
    private String status = "Open"; // Open, Pending for Verified, Accepted, Rejected, Closed

    @com.fasterxml.jackson.annotation.JsonProperty("status")
    public String getStatus() {
        if (statusObj != null) {
            return statusObj.getName();
        }
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        // Only clear statusObj if the new status does not match current statusObj name
        if (this.statusObj != null && status != null && !status.equalsIgnoreCase(this.statusObj.getName())) {
            this.statusObj = null;
        }
    }

    @Column(name = "ACTION_TAKEN", columnDefinition = "NVARCHAR(MAX)")
    private String actionTaken;

    @Column(name = "ACTION_OBSERVATION", columnDefinition = "NVARCHAR(MAX)")
    private String actionObservation;

    @Column(name = "CANCEL_REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String cancelRemarks;

    @Column(name = "REV_NO")
    private Integer revNo = 0;

    @Column(name = "AMENDMENT_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String amendmentComments;

    @Column(name = "REASSIGN_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String reassignComments;

    @Column(name = "REASSIGN_HISTORY", columnDefinition = "NVARCHAR(MAX)")
    private String reassignHistory;

    @Column(name = "ACTION_STATUS", length = 50)
    private String actionStatus;

    @Column(name = "SUBMITTED_BY", length = 100)
    private String submittedBy;

    @Column(name = "SUBMITTED_DATE")
    private java.time.LocalDateTime submittedDate;

    @Column(name = "VERIFIED_BY", length = 100)
    private String verifiedBy;

    @Column(name = "VERIFIED_DATE")
    private java.time.LocalDateTime verifiedDate;

    @Column(name = "REJECTED_BY", length = 100)
    private String rejectedBy;

    @Column(name = "REJECTED_DATE")
    private java.time.LocalDateTime rejectedDate;

    @Column(name = "REJECTION_REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String rejectionRemarks;

    @Column(name = "LAST_RESUBMITTED_DATE")
    private java.time.LocalDateTime lastResubmittedDate;

    @Column(name = "REJECTED_COUNT")
    private Integer rejectedCount = 0;

    @Column(name = "ATTACHMENT_INFO", columnDefinition = "NVARCHAR(MAX)")
    private String attachmentInfo;

    @Transient
    private List<QmsAttachmentPath> attachments = new ArrayList<>();

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getMaterialList() {
        if (materialMappings == null || materialMappings.isEmpty()) {
            return null;
        }
        List<String> list = new ArrayList<>();
        for (QmsMomDetailsMaterialMapping mapping : materialMappings) {
            if (mapping.getMaterialId() != null) {
                list.add(mapping.getMaterialId());
            }
        }
        return String.join(",", list);
    }

    public void setMaterialList(String materialList) {
        this.materialList = materialList;
        if (this.materialMappings == null) {
            this.materialMappings = new java.util.ArrayList<>();
        } else {
            this.materialMappings.clear();
        }
        if (materialList != null && !materialList.trim().isEmpty()) {
            for (String part : materialList.split(",")) {
                QmsMomDetailsMaterialMapping mapping = new QmsMomDetailsMaterialMapping();
                mapping.setMaterialId(part.trim());
                if (this.id != null) {
                    mapping.setMomDetailId(this.id);
                }
                this.materialMappings.add(mapping);
            }
        }
    }

    public void setMaterialMappings(List<QmsMomDetailsMaterialMapping> materialMappings) {
        if (this.materialMappings == null) {
            this.materialMappings = new java.util.ArrayList<>();
        } else {
            this.materialMappings.clear();
        }
        if (materialMappings != null) {
            this.materialMappings.addAll(materialMappings);
        }
    }

    @PostLoad
    private void onLoad() {
        if (materialMappings != null && !materialMappings.isEmpty()) {
            List<String> list = new ArrayList<>();
            for (QmsMomDetailsMaterialMapping mapping : materialMappings) {
                if (mapping.getMaterialId() != null) {
                    list.add(mapping.getMaterialId());
                }
            }
            this.materialList = String.join(",", list);
        }
    }

    public QmsMomMaster getMom() { return mom; }
    public void setMom(QmsMomMaster mom) { this.mom = mom; }
    public void setDiscussedPoint(String discussedPoint) { this.discussedPoint = discussedPoint; }
    public QmsPointTypeMaster getPointTypeObj() { return pointTypeObj; }
    public void setPointTypeObj(QmsPointTypeMaster pointTypeObj) { this.pointTypeObj = pointTypeObj; }
    public List<QmsMomDetailsMaterialMapping> getMaterialMappings() { return materialMappings; }
    public QmsProcessTypeMaster getProcessTypeObj() { return processTypeObj; }
    public void setProcessTypeObj(QmsProcessTypeMaster processTypeObj) { this.processTypeObj = processTypeObj; }
    public EmployeeMaster getAssignedBy() { return assignedBy; }
    public void setAssignedBy(EmployeeMaster assignedBy) { this.assignedBy = assignedBy; }
    public EmployeeMaster getAssignedTo() { return assignedTo; }
    public void setAssignedTo(EmployeeMaster assignedTo) { this.assignedTo = assignedTo; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public LocalDate getReviewDate() { return reviewDate; }
    public void setReviewDate(LocalDate reviewDate) { this.reviewDate = reviewDate; }
    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getStatusObj() { return statusObj; }
    public void setStatusObj(com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj) { this.statusObj = statusObj; }
    public String getActionTaken() { return actionTaken; }
    public void setActionTaken(String actionTaken) { this.actionTaken = actionTaken; }
    public String getActionObservation() { return actionObservation; }
    public void setActionObservation(String actionObservation) { this.actionObservation = actionObservation; }
    public String getCancelRemarks() { return cancelRemarks; }
    public void setCancelRemarks(String cancelRemarks) { this.cancelRemarks = cancelRemarks; }
    public Integer getRevNo() { return revNo; }
    public void setRevNo(Integer revNo) { this.revNo = revNo; }
    public String getAmendmentComments() { return amendmentComments; }
    public void setAmendmentComments(String amendmentComments) { this.amendmentComments = amendmentComments; }
    public String getActionStatus() { return actionStatus; }
    public void setActionStatus(String actionStatus) { this.actionStatus = actionStatus; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public java.time.LocalDateTime getSubmittedDate() { return submittedDate; }
    public void setSubmittedDate(java.time.LocalDateTime submittedDate) { this.submittedDate = submittedDate; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public java.time.LocalDateTime getVerifiedDate() { return verifiedDate; }
    public void setVerifiedDate(java.time.LocalDateTime verifiedDate) { this.verifiedDate = verifiedDate; }
    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }
    public java.time.LocalDateTime getRejectedDate() { return rejectedDate; }
    public void setRejectedDate(java.time.LocalDateTime rejectedDate) { this.rejectedDate = rejectedDate; }
    public String getRejectionRemarks() { return rejectionRemarks; }
    public void setRejectionRemarks(String rejectionRemarks) { this.rejectionRemarks = rejectionRemarks; }
    public java.time.LocalDateTime getLastResubmittedDate() { return lastResubmittedDate; }
    public void setLastResubmittedDate(java.time.LocalDateTime lastResubmittedDate) { this.lastResubmittedDate = lastResubmittedDate; }
    public Integer getRejectedCount() { return rejectedCount; }
    public void setRejectedCount(Integer rejectedCount) { this.rejectedCount = rejectedCount; }
    public String getAttachmentInfo() { return attachmentInfo; }
    public void setAttachmentInfo(String attachmentInfo) { this.attachmentInfo = attachmentInfo; }
    public List<QmsAttachmentPath> getAttachments() { return attachments; }
    public void setAttachments(List<QmsAttachmentPath> attachments) { this.attachments = attachments; }
}

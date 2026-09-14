package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "QMS_AUDIT_SCHEDULE_CRITERIA")
@Getter
@Setter
public class AuditScheduleCriteria extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AUDIT_SCHEDULE_ID")
    @JsonIgnore
    private AuditSchedule auditSchedule;

    @Column(name = "SEQ_NO")
    private String seqNo;

    @Column(name = "CLAUSE", columnDefinition = "NVARCHAR(255)")
    private String clause;

    @Column(name = "CRITERIA_DETAILS", columnDefinition = "NVARCHAR(MAX)")
    private String criteriaDetails;

    @Column(name = "ATTACHMENT_REQ")
    private Boolean attachmentReq = false;

    public void setAttachmentReq(Object attachmentReq) {
        if (attachmentReq instanceof Boolean) {
            this.attachmentReq = (Boolean) attachmentReq;
        } else if (attachmentReq instanceof String) {
            this.attachmentReq = "YES".equalsIgnoreCase((String) attachmentReq) || "true".equalsIgnoreCase((String) attachmentReq);
        } else {
            this.attachmentReq = false;
        }
    }

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public AuditSchedule getAuditSchedule() { return auditSchedule; }
    public void setAuditSchedule(AuditSchedule auditSchedule) { this.auditSchedule = auditSchedule; }
    public String getSeqNo() { return seqNo; }
    public void setSeqNo(String seqNo) { this.seqNo = seqNo; }
    public String getClause() { return clause; }
    public void setClause(String clause) { this.clause = clause; }
    public String getCriteriaDetails() { return criteriaDetails; }
    public void setCriteriaDetails(String criteriaDetails) { this.criteriaDetails = criteriaDetails; }
    public Boolean getAttachmentReq() { return attachmentReq; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

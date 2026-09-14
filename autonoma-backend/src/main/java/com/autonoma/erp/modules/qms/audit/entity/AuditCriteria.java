package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "QMS_AUDIT_CRITERIA")
public class AuditCriteria extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SEQ_NO", columnDefinition = "NVARCHAR(50)")
    private String seqNo;

    @OneToMany(mappedBy = "auditCriteria", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<AuditCriteriaType> auditCriteriaTypes = new ArrayList<>();

    @Column(name = "CLAUSE", columnDefinition = "NVARCHAR(255)")
    private String clause;
    
    @Column(name = "CRITERIA_TEXT", columnDefinition = "NVARCHAR(MAX)")
    private String criteriaText;
    
    @Transient
    private List<Long> departmentIds;

    @Transient
    private List<AuditDepartment> departments;

    @Column(name = "ATTACHMENT_REQUIRED")
    private Boolean attachmentRequired = false;

    @Column(name = "MANDATORY_CRITERIA", columnDefinition = "BIT")
    private Integer mandatoryCriteria = 0;

    @Transient
    private String attachmentInfo; // JSON string of file metadata, loaded dynamically

    @Column(name = "LEVEL", columnDefinition = "NVARCHAR(100)")
    private String level; // L1,L2...

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    // Explicit Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getSeqNo() { return seqNo; }
    public void setSeqNo(String seqNo) { this.seqNo = seqNo; }

    public List<AuditCriteriaType> getAuditCriteriaTypes() {
        return auditCriteriaTypes;
    }

    public void setAuditCriteriaTypes(List<AuditCriteriaType> auditCriteriaTypes) {
        this.auditCriteriaTypes = auditCriteriaTypes;
    }

    public String getAuditType() {
        if (this.auditCriteriaTypes == null || this.auditCriteriaTypes.isEmpty()) {
            return null;
        }
        return this.auditCriteriaTypes.stream()
                .map(AuditCriteriaType::getAuditTypeName)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.joining(","));
    }

    public void setAuditType(String auditType) {
        if (auditType == null || auditType.trim().isEmpty()) {
            if (this.auditCriteriaTypes != null) {
                this.auditCriteriaTypes.clear();
            } else {
                this.auditCriteriaTypes = new ArrayList<>();
            }
        } else {
            if (this.auditCriteriaTypes == null) {
                this.auditCriteriaTypes = new ArrayList<>();
            }
            List<String> types = java.util.Arrays.stream(auditType.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            // Remove types not in the incoming list or where auditType is null
            this.auditCriteriaTypes.removeIf(existing -> existing.getAuditType() == null || !types.contains(existing.getAuditTypeName()));
            // Add new types
            List<String> existingNames = this.auditCriteriaTypes.stream()
                    .map(AuditCriteriaType::getAuditTypeName)
                    .filter(java.util.Objects::nonNull)
                    .toList();
            for (String name : types) {
                if (!existingNames.contains(name)) {
                    AuditCriteriaType child = new AuditCriteriaType();
                    child.setAuditCriteria(this);
                    child.setAuditTypeName(name);
                    if (child.getAuditType() != null) {
                        this.auditCriteriaTypes.add(child);
                    }
                }
            }
        }
    }

    public String getClause() { return clause; }
    public void setClause(String clause) { this.clause = clause; }
    public String getCriteriaText() { return criteriaText; }
    public void setCriteriaText(String criteriaText) { this.criteriaText = criteriaText; }
    public List<Long> getDepartmentIds() { return departmentIds; }
    public void setDepartmentIds(List<Long> departmentIds) { this.departmentIds = departmentIds; }
    public List<AuditDepartment> getDepartments() { return departments; }
    public void setDepartments(List<AuditDepartment> departments) { this.departments = departments; }
    public Boolean getAttachmentRequired() { return attachmentRequired; }
    public void setAttachmentRequired(Boolean attachmentRequired) { this.attachmentRequired = attachmentRequired; }

    public String getAttachmentInfo() { return attachmentInfo; }
    public void setAttachmentInfo(String attachmentInfo) { this.attachmentInfo = attachmentInfo; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Integer getMandatoryCriteria() { return mandatoryCriteria; }
    public void setMandatoryCriteria(Integer mandatoryCriteria) { this.mandatoryCriteria = mandatoryCriteria; }
}

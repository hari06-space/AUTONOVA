package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "QMS_AUDIT_CRITERIA_TYPE")
public class AuditCriteriaType extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AUDIT_CRITERIA_ID", nullable = false)
    @JsonIgnore
    private AuditCriteria auditCriteria;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUDIT_TYPE_ID", nullable = false)
    private AuditType auditType;

    // Explicit Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AuditCriteria getAuditCriteria() {
        return auditCriteria;
    }

    public void setAuditCriteria(AuditCriteria auditCriteria) {
        this.auditCriteria = auditCriteria;
    }

    public AuditType getAuditType() {
        return auditType;
    }

    public void setAuditType(AuditType auditType) {
        this.auditType = auditType;
    }

    public String getAuditTypeName() {
        return auditType != null ? auditType.getAuditType() : null;
    }

    public void setAuditTypeName(String name) {
        if (name == null || name.trim().isEmpty()) {
            this.auditType = null;
            return;
        }
        String trimmedName = name.trim();
        com.autonoma.erp.modules.qms.audit.repository.AuditTypeRepository repo = com.autonoma.erp.util.SpringContext
                .getBean(com.autonoma.erp.modules.qms.audit.repository.AuditTypeRepository.class);
        if (repo != null) {
            this.auditType = repo.findByAuditTypeIgnoreCase(trimmedName).orElseGet(() -> {
                try {
                    AuditType newType = new AuditType();
                    newType.setAuditType(trimmedName);
                    newType.setIsActive(true);
                    newType.setCreatedBy("SUPER BOSS");
                    newType.setCreatedAt(new java.util.Date());
                    return repo.save(newType);
                } catch (Exception e) {
                    return null;
                }
            });
        }
    }
}

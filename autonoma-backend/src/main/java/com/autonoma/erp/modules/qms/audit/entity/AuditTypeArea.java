package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "QMS_AUDIT_TYPE_AREA")
public class AuditTypeArea extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AUDIT_TYPE_ID", nullable = false)
    @JsonIgnore
    private AuditType auditType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AUDIT_AREA_ID", nullable = false)
    private AuditArea auditArea;

    // Explicit Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public AuditType getAuditType() { return auditType; }
    public void setAuditType(AuditType auditType) { this.auditType = auditType; }

    public AuditArea getAuditAreaEntity() { return auditArea; }
    public void setAuditAreaEntity(AuditArea auditArea) { this.auditArea = auditArea; }

    public String getAuditArea() {
        return auditArea != null ? auditArea.getDescription() : null;
    }

    public void setAuditArea(String name) {
        if (name == null || name.trim().isEmpty()) {
            this.auditArea = null;
            return;
        }
        com.autonoma.erp.modules.qms.audit.repository.AuditAreaRepository repo =
            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.qms.audit.repository.AuditAreaRepository.class);
        if (repo != null) {
            this.auditArea = repo.findFirstByDescriptionIgnoreCase(name)
                .orElseThrow(() -> new IllegalArgumentException("Audit Area not found: " + name));
        }
    }
}

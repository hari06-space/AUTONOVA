package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;

@Entity
@Table(name = "QMS_AUDIT_TYPE")
public class AuditType extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "AUDIT_TYPE", columnDefinition = "NVARCHAR(255)")
    private String auditType;

    @Column(name = "STANDARD", columnDefinition = "NVARCHAR(255)")
    private String standard;
    
    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;
    
    @Column(name = "CRITERIA_MIN_COUNT")
    private Integer criteriaMinCount;

    @Column(name = "CUSTOMER_AUDIT_AREA", columnDefinition = "NVARCHAR(255)")
    private String customerAuditArea;

    @Transient
    private String auditArea;

    @OneToMany(mappedBy = "auditType", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private java.util.List<AuditTypeArea> auditTypeAreas = new java.util.ArrayList<>();

    @Column(name = "CRITERIA_TYPE", columnDefinition = "NVARCHAR(10)")
    private String criteriaType;



    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    // Explicit Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAuditType() { return auditType; }
    public void setAuditType(String auditType) { this.auditType = auditType; }
    public String getStandard() { return standard; }
    public void setStandard(String standard) { this.standard = standard; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getCriteriaMinCount() { return criteriaMinCount; }
    public void setCriteriaMinCount(Integer criteriaMinCount) { this.criteriaMinCount = criteriaMinCount; }
    public String getCustomerAuditArea() { return customerAuditArea; }
    public void setCustomerAuditArea(String customerAuditArea) { this.customerAuditArea = customerAuditArea; }

    public String getAuditArea() {
        if (this.auditTypeAreas == null || this.auditTypeAreas.isEmpty()) {
            return null;
        }
        return this.auditTypeAreas.stream()
                .map(AuditTypeArea::getAuditArea)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.joining(", "));
    }

    public void setAuditArea(String auditArea) {
        this.auditArea = auditArea;
        if (auditArea == null || auditArea.trim().isEmpty()) {
            if (this.auditTypeAreas != null) {
                this.auditTypeAreas.clear();
            } else {
                this.auditTypeAreas = new java.util.ArrayList<>();
            }
        } else {
            if (this.auditTypeAreas == null) {
                this.auditTypeAreas = new java.util.ArrayList<>();
            }
            java.util.List<String> areas = java.util.Arrays.stream(auditArea.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            // Remove areas not in the incoming list
            this.auditTypeAreas.removeIf(existing -> !areas.contains(existing.getAuditArea()));
            // Add new areas
            java.util.List<String> existingNames = this.auditTypeAreas.stream().map(AuditTypeArea::getAuditArea).toList();
            for (String name : areas) {
                if (!existingNames.contains(name)) {
                    AuditTypeArea child = new AuditTypeArea();
                    child.setAuditType(this);
                    try {
                        child.setAuditArea(name);
                        if (child.getAuditAreaEntity() != null) {
                            this.auditTypeAreas.add(child);
                        }
                    } catch (IllegalArgumentException e) {
                        System.err.println("Skipping invalid audit area during mapping: " + e.getMessage());
                    }
                }
            }
        }
    }

    public java.util.List<AuditTypeArea> getAuditTypeAreas() { return auditTypeAreas; }
    public void setAuditTypeAreas(java.util.List<AuditTypeArea> auditTypeAreas) { this.auditTypeAreas = auditTypeAreas; }

    public String getCriteriaType() { return criteriaType; }
    public void setCriteriaType(String criteriaType) { this.criteriaType = criteriaType; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

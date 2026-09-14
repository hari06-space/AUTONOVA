package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "BOS_AI_OPERATIONS")
public class BosAiOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ENTITY_CODE", nullable = false, length = 50)
    private String entityCode;

    @Column(name = "OPERATION_CODE", nullable = false, length = 50)
    private String operationCode;

    @Column(name = "DISPLAY_NAME", nullable = false, length = 100)
    private String displayName;

    @Column(name = "REQUIRED_SCOPE", nullable = false, length = 20)
    private String requiredScope = "SELF";

    @Column(name = "KEYWORDS", columnDefinition = "NVARCHAR(MAX)")
    private String keywords;

    @Column(name = "DISPLAY_ORDER", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "ACTIVE_STATUS", nullable = false, length = 1)
    private String activeStatus = "Y";

    @PrePersist
    protected void onCreate() {
        if (this.requiredScope == null) this.requiredScope = "SELF";
        if (this.displayOrder == null) this.displayOrder = 0;
        if (this.activeStatus == null) this.activeStatus = "Y";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEntityCode() { return entityCode; }
    public void setEntityCode(String entityCode) { this.entityCode = entityCode; }

    public String getOperationCode() { return operationCode; }
    public void setOperationCode(String operationCode) { this.operationCode = operationCode; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getRequiredScope() { return requiredScope; }
    public void setRequiredScope(String requiredScope) { this.requiredScope = requiredScope; }

    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public String getActiveStatus() { return activeStatus; }
    public void setActiveStatus(String activeStatus) { this.activeStatus = activeStatus; }
}

package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "BOS_AI_ENTITY_FIELDS")
public class BosAiEntityField {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ENTITY_CODE", nullable = false, length = 50)
    private String entityCode;

    @Column(name = "FIELD_CODE", nullable = false, length = 50)
    private String fieldCode;

    @Column(name = "DISPLAY_NAME", nullable = false, length = 100)
    private String displayName;

    @Column(name = "DB_COLUMN", length = 100)
    private String dbColumn;

    @Column(name = "FIELD_TYPE", nullable = false, length = 20)
    private String fieldType = "TEXT";

    @Column(name = "SEARCHABLE", nullable = false, length = 1)
    private String searchable = "Y";

    @Column(name = "VISIBLE", nullable = false, length = 1)
    private String visible = "Y";

    @Column(name = "SENSITIVE", nullable = false, length = 1)
    private String sensitive = "N";

    @Column(name = "REQUIRED_PAGE", length = 100)
    private String requiredPage;

    @Column(name = "DESCRIPTION", length = 500)
    private String description;

    @Column(name = "DISPLAY_ORDER", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "ACTIVE_STATUS", nullable = false, length = 1)
    private String activeStatus = "Y";

    @PrePersist
    protected void onCreate() {
        if (this.fieldType == null) this.fieldType = "TEXT";
        if (this.searchable == null) this.searchable = "Y";
        if (this.visible == null) this.visible = "Y";
        if (this.sensitive == null) this.sensitive = "N";
        if (this.displayOrder == null) this.displayOrder = 0;
        if (this.activeStatus == null) this.activeStatus = "Y";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEntityCode() { return entityCode; }
    public void setEntityCode(String entityCode) { this.entityCode = entityCode; }

    public String getFieldCode() { return fieldCode; }
    public void setFieldCode(String fieldCode) { this.fieldCode = fieldCode; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getDbColumn() { return dbColumn; }
    public void setDbColumn(String dbColumn) { this.dbColumn = dbColumn; }

    public String getFieldType() { return fieldType; }
    public void setFieldType(String fieldType) { this.fieldType = fieldType; }

    public String getSearchable() { return searchable; }
    public void setSearchable(String searchable) { this.searchable = searchable; }

    public String getVisible() { return visible; }
    public void setVisible(String visible) { this.visible = visible; }

    public String getSensitive() { return sensitive; }
    public void setSensitive(String sensitive) { this.sensitive = sensitive; }

    public String getRequiredPage() { return requiredPage; }
    public void setRequiredPage(String requiredPage) { this.requiredPage = requiredPage; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public String getActiveStatus() { return activeStatus; }
    public void setActiveStatus(String activeStatus) { this.activeStatus = activeStatus; }
}

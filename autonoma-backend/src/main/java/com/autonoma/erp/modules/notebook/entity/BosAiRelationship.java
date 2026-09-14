package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "BOS_AI_RELATIONSHIPS")
public class BosAiRelationship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "FROM_ENTITY", nullable = false, length = 50)
    private String fromEntity;

    @Column(name = "TO_ENTITY", nullable = false, length = 50)
    private String toEntity;

    @Column(name = "CARDINALITY", nullable = false, length = 10)
    private String cardinality; // "1:N" | "N:M" | "1:1"

    @Column(name = "JOIN_COLUMN", length = 100)
    private String joinColumn;

    @Column(name = "PARENT_COLUMN", length = 100)
    private String parentColumn = "ID";

    @Column(name = "EXPAND_NAME", length = 50)
    private String expandName;

    @Column(name = "LABEL", length = 100)
    private String label;

    @Column(name = "EAGER_LOAD", nullable = false, length = 1)
    private String eagerLoad = "N";

    @Column(name = "MAX_ROWS", nullable = false)
    private Integer maxRows = 50;

    @Column(name = "ACTIVE_STATUS", nullable = false, length = 1)
    private String activeStatus = "Y";

    @PrePersist
    protected void onCreate() {
        if (this.parentColumn == null) this.parentColumn = "ID";
        if (this.eagerLoad == null) this.eagerLoad = "N";
        if (this.maxRows == null) this.maxRows = 50;
        if (this.activeStatus == null) this.activeStatus = "Y";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFromEntity() { return fromEntity; }
    public void setFromEntity(String fromEntity) { this.fromEntity = fromEntity; }

    public String getToEntity() { return toEntity; }
    public void setToEntity(String toEntity) { this.toEntity = toEntity; }

    public String getCardinality() { return cardinality; }
    public void setCardinality(String cardinality) { this.cardinality = cardinality; }

    public String getJoinColumn() { return joinColumn; }
    public void setJoinColumn(String joinColumn) { this.joinColumn = joinColumn; }

    public String getParentColumn() { return parentColumn; }
    public void setParentColumn(String parentColumn) { this.parentColumn = parentColumn; }

    public String getExpandName() { return expandName; }
    public void setExpandName(String expandName) { this.expandName = expandName; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getEagerLoad() { return eagerLoad; }
    public void setEagerLoad(String eagerLoad) { this.eagerLoad = eagerLoad; }

    public Integer getMaxRows() { return maxRows; }
    public void setMaxRows(Integer maxRows) { this.maxRows = maxRows; }

    public String getActiveStatus() { return activeStatus; }
    public void setActiveStatus(String activeStatus) { this.activeStatus = activeStatus; }
}

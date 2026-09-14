package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "BOS_AI_ENTITY")
public class BosAiEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ENTITY_CODE", nullable = false, unique = true, length = 50)
    private String entityCode;

    @Column(name = "DISPLAY_NAME", nullable = false, length = 100)
    private String displayName;

    @Column(name = "ERP_MODULE", nullable = false, length = 50)
    private String erpModule;

    @Column(name = "DB_TABLE", length = 100)
    private String dbTable;

    @Column(name = "ID_COLUMN", length = 50)
    private String idColumn;

    @Column(name = "IDENTIFIER_COL", length = 50)
    private String identifierCol;

    @Column(name = "PAGE_CODES", length = 500)
    private String pageCodes;

    @Column(name = "SYNONYMS", columnDefinition = "NVARCHAR(MAX)")
    private String synonyms;

    @Column(name = "DESCRIPTION", length = 500)
    private String description;

    @Column(name = "DEFAULT_SCOPE", nullable = false, length = 20)
    private String defaultScope = "SELF";

    @Column(name = "MAX_HOPS", nullable = false)
    private Integer maxHops = 2;

    @Column(name = "ACTIVE_STATUS", nullable = false, length = 1)
    private String activeStatus = "Y";

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy = "SYSTEM";

    @Column(name = "CREATED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = new Date();
        if (this.activeStatus == null) this.activeStatus = "Y";
        if (this.defaultScope == null) this.defaultScope = "SELF";
        if (this.maxHops == null) this.maxHops = 2;
        if (this.createdBy == null) this.createdBy = "SYSTEM";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEntityCode() { return entityCode; }
    public void setEntityCode(String entityCode) { this.entityCode = entityCode; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getErpModule() { return erpModule; }
    public void setErpModule(String erpModule) { this.erpModule = erpModule; }

    public String getDbTable() { return dbTable; }
    public void setDbTable(String dbTable) { this.dbTable = dbTable; }

    public String getIdColumn() { return idColumn; }
    public void setIdColumn(String idColumn) { this.idColumn = idColumn; }

    public String getIdentifierCol() { return identifierCol; }
    public void setIdentifierCol(String identifierCol) { this.identifierCol = identifierCol; }

    public String getPageCodes() { return pageCodes; }
    public void setPageCodes(String pageCodes) { this.pageCodes = pageCodes; }

    public String getSynonyms() { return synonyms; }
    public void setSynonyms(String synonyms) { this.synonyms = synonyms; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDefaultScope() { return defaultScope; }
    public void setDefaultScope(String defaultScope) { this.defaultScope = defaultScope; }

    public Integer getMaxHops() { return maxHops; }
    public void setMaxHops(Integer maxHops) { this.maxHops = maxHops; }

    public String getActiveStatus() { return activeStatus; }
    public void setActiveStatus(String activeStatus) { this.activeStatus = activeStatus; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}

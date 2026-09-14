package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "BOS_AI_METADATA_AUDIT")
public class BosAiMetadataAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "METADATA_TABLE", nullable = false, length = 50)
    private String metadataTable;

    @Column(name = "RECORD_ID", nullable = false)
    private Long recordId;

    @Column(name = "ACTION_TYPE", nullable = false, length = 10)
    private String actionType;

    @Column(name = "OLD_VALUE_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String oldValueJson;

    @Column(name = "NEW_VALUE_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String newValueJson;

    @Column(name = "CHANGED_BY", nullable = false, length = 50)
    private String changedBy;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "CHANGED_DATE")
    private Date changedDate;

    @Column(name = "VERSION_NO")
    private Integer versionNo;

    @PrePersist
    protected void onCreate() {
        this.changedDate = new Date();
        if (this.versionNo == null) {
            this.versionNo = 1;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMetadataTable() { return metadataTable; }
    public void setMetadataTable(String metadataTable) { this.metadataTable = metadataTable; }

    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getOldValueJson() { return oldValueJson; }
    public void setOldValueJson(String oldValueJson) { this.oldValueJson = oldValueJson; }

    public String getNewValueJson() { return newValueJson; }
    public void setNewValueJson(String newValueJson) { this.newValueJson = newValueJson; }

    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }

    public Date getChangedDate() { return changedDate; }
    public void setChangedDate(Date changedDate) { this.changedDate = changedDate; }

    public Integer getVersionNo() { return versionNo; }
    public void setVersionNo(Integer versionNo) { this.versionNo = versionNo; }
}

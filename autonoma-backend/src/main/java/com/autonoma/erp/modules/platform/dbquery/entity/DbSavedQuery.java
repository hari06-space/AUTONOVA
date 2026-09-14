package com.autonoma.erp.modules.platform.dbquery.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import com.autonoma.erp.model.BaseAuditEntity;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "DB_SAVED_QUERY")
public class DbSavedQuery extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "QUERY_NAME", nullable = false)
    private String queryName;

    @Column(name = "QUERY_TEXT", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String queryText;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getQueryName() { return queryName; }
    public void setQueryName(String queryName) { this.queryName = queryName; }
    public String getQueryText() { return queryText; }
    public void setQueryText(String queryText) { this.queryText = queryText; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

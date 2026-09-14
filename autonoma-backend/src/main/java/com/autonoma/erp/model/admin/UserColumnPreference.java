package com.autonoma.erp.model.admin;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.Date;

@Entity
@Table(name = "AD_USER_COLUMN_PREFERENCE")
@Getter
@Setter
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class UserColumnPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", columnDefinition = "VARCHAR(50)", nullable = false)
    private String userId;

    @Column(name = "page_key", columnDefinition = "VARCHAR(255)", nullable = false)
    private String pageKey;

    @Column(name = "preference_value", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String preferenceValue;

    @Column(name = "created_by", columnDefinition = "VARCHAR(50)", nullable = false)
    private String createdBy = "System";

    @Column(name = "CREATED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt = new Date();

    @Column(name = "updated_by", columnDefinition = "VARCHAR(50)", nullable = false)
    private String updatedBy = "System";

    @Column(name = "UPDATED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt = new Date();

    public String getPageKey() { return pageKey; }
    public void setPageKey(String pageKey) { this.pageKey = pageKey; }
    public String getPreferenceValue() { return preferenceValue; }
    public void setPreferenceValue(String preferenceValue) { this.preferenceValue = preferenceValue; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}

package com.autonoma.erp.model.admin;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Formula;
import java.util.Date;

@Entity
@Table(name = "AD_AUDIT_TRAIL")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditTrail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;

    @Formula("(SELECT u.img_name FROM ad_user_credential u WHERE u.user_id = user_id)")
    private String userImage;

    @Column(name = "page_name")
    private String pageName;

    @Column(name = "action_type")
    private String actionType;

    @Column(name = "table_name")
    private String tableName;

    @Column(name = "record_id")
    private String recordId;

    @Column(name = "previous_value", columnDefinition = "NVARCHAR(MAX)")
    private String previousValue;

    @Column(name = "current_value", columnDefinition = "NVARCHAR(MAX)")
    private String currentValue;

    @Column(name = "comments", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    @Column(name = "CREATED_DATE", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    private Date createdAt;

    @Builder.Default
    @Column(name = "is_restored")
    @com.fasterxml.jackson.annotation.JsonProperty("isRestored")
    private Boolean isRestored = false;

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public String getPreviousValue() { return previousValue; }
    public void setPreviousValue(String previousValue) { this.previousValue = previousValue; }
    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public void setRestoredAt(Date restoredAt) { }

    @Column(name = "restored_at")
    @Temporal(TemporalType.TIMESTAMP)
    @com.fasterxml.jackson.annotation.JsonProperty("restoredAt")
    private Date restoredAt;

    public Boolean getIsRestored() {
        return isRestored;
    }

    public void setIsRestored(Boolean isRestored) {
        this.isRestored = isRestored;
    }

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }

        createdAt = new Date();
    }
}

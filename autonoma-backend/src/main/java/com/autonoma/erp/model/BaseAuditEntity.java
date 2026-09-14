package com.autonoma.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;
import com.autonoma.erp.util.SecurityUtils;

@MappedSuperclass
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public abstract class BaseAuditEntity {

    @Column(name = "CREATED_BY", length = 50, updatable = false)
    private String createdUser;

    @Column(name = "CREATED_DATE", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedUser;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    // Explicit Getters and Setters
    public String getCreatedUser() {
        return createdUser;
    }

    public void setCreatedUser(String createdUser) {
        this.createdUser = createdUser;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getUpdatedUser() {
        return updatedUser;
    }

    public void setUpdatedUser(String updatedUser) {
        this.updatedUser = updatedUser;
    }

    public Date getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(Date updatedDate) {
        this.updatedDate = updatedDate;
    }

    // Backward compatibility aliases
    @com.fasterxml.jackson.annotation.JsonProperty("createdBy")
    public String getCreatedBy() {
        return getCreatedUser();
    }

    public void setCreatedBy(String createdBy) {
        setCreatedUser(createdBy);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedBy")
    public String getUpdatedBy() {
        return getUpdatedUser();
    }

    public void setUpdatedBy(String updatedBy) {
        setUpdatedUser(updatedBy);
    }

    @jakarta.persistence.Transient
    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public Date getCreatedAt() {
        return getCreatedDate();
    }

    public void setCreatedAt(Date createdAt) {
        setCreatedDate(createdAt);
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        if (createdAt != null) {
            setCreatedDate(java.sql.Timestamp.valueOf(createdAt));
        } else {
            setCreatedDate(null);
        }
    }

    @jakarta.persistence.Transient
    @com.fasterxml.jackson.annotation.JsonProperty("updatedAt")
    public Date getUpdatedAt() {
        return getUpdatedDate();
    }

    public void setUpdatedAt(Date updatedAt) {
        setUpdatedDate(updatedAt);
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public void setUpdatedAt(java.time.LocalDateTime updatedAt) {
        if (updatedAt != null) {
            setUpdatedDate(java.sql.Timestamp.valueOf(updatedAt));
        } else {
            setUpdatedDate(null);
        }
    }

    @Transient
    private boolean skipAuditUpdate = false;

    @Transient
    private transient boolean isNew = true;

    @Transient
    private boolean preserveUpdateAudit = false;

    public boolean isSkipAuditUpdate() {
        return skipAuditUpdate;
    }

    public void setSkipAuditUpdate(boolean skipAuditUpdate) {
        this.skipAuditUpdate = skipAuditUpdate;
    }

    public boolean isPreserveUpdateAudit() {
        return preserveUpdateAudit;
    }

    public void setPreserveUpdateAudit(boolean preserveUpdateAudit) {
        this.preserveUpdateAudit = preserveUpdateAudit;
    }

    @PostLoad
    protected void onPostLoad() {
        this.isNew = false;
    }

    @PrePersist
    protected void onCreate() {
        this.isNew = true;
        if (this.createdDate == null) {
            this.createdDate = new Date();
        }
        if (org.springframework.web.context.request.RequestContextHolder.getRequestAttributes() != null) {
            String userId = null;
            try {
                userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }
            if (userId != null && !userId.trim().isEmpty()) {
                this.createdUser = userId;
            }
        }

        if (!this.preserveUpdateAudit) {
            this.updatedUser = null;
            this.updatedDate = null;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.isNew) {
            return;
        }
        if (this.skipAuditUpdate) {
            return;
        }

        this.updatedDate = new Date();

        if (org.springframework.web.context.request.RequestContextHolder.getRequestAttributes() != null) {
            String userId = null;
            try {
                userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }
            if (userId != null && !userId.trim().isEmpty()) {
                this.updatedUser = userId;
            }
        }

        if (this.createdUser != null && this.createdUser.trim().isEmpty()) {
            this.createdUser = null;
        }
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public boolean isNewEntity() {
        return this.isNew;
    }
}

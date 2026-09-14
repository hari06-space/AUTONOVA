package com.autonoma.erp.modules.qmt.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "QMT_MACHINE_CATEGORY")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MachineCategory {

    @Id
    @Column(name = "ID")
    @JsonProperty("id")
    private Long id;

    @Column(name = "CATEGORY_NAME", nullable = false, unique = true, length = 100)
    @JsonProperty("category_name")
    private String categoryName;

    @Column(name = "OEE_REQUIRED", nullable = false)
    @lombok.Getter(lombok.AccessLevel.NONE)
    @lombok.Setter(lombok.AccessLevel.NONE)
    private Boolean oeeRequired = false;

    @Column(name = "SEQ_NO", nullable = false)
    @JsonProperty("seq_no")
    private Integer seqNo;

    @Column(name = "CATEGORY_PREFIX", nullable = false, unique = true, length = 50)
    @JsonProperty("category_prefix")
    private String categoryPrefix;

    @Column(name = "STATUS", nullable = false)
    @lombok.Getter(lombok.AccessLevel.NONE)
    @lombok.Setter(lombok.AccessLevel.NONE)
    private Boolean status = true;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    @JsonProperty("created_by")
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonProperty("created_date")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+5:30")
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    @JsonProperty("updated_by")
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonProperty("updated_date")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+5:30")
    private Date updatedDate;

    @JsonProperty("oee_required")
    public String getOeeRequired() {
        return (this.oeeRequired != null && this.oeeRequired) ? "Yes" : "No";
    }

    @JsonProperty("oee_required")
    public void setOeeRequired(String value) {
        this.oeeRequired = "Yes".equalsIgnoreCase(value) || "true".equalsIgnoreCase(value);
    }

    @JsonProperty("status")
    public String getStatus() {
        return (this.status != null && this.status) ? "Active" : "Inactive";
    }

    @JsonProperty("status")
    public void setStatus(String value) {
        this.status = "Active".equalsIgnoreCase(value) || "true".equalsIgnoreCase(value) || "1".equalsIgnoreCase(value);
    }

    @PrePersist
    protected void onCreate() {
        String user = resolveCurrentUser();
        this.createdBy = user;
        this.updatedBy = null;
        this.updatedDate = null;
        this.createdDate = new Date();
        if (this.status == null) this.status = true;
        if (this.oeeRequired == null) this.oeeRequired = false;
        if (this.categoryPrefix != null) {
            this.categoryPrefix = this.categoryPrefix.trim().toUpperCase();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.createdDate != null && (new Date().getTime() - this.createdDate.getTime() < 5000)) {
            return;
        }
        String user = resolveCurrentUser();
        this.updatedBy = user;
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = user;
        }
        this.updatedDate = new Date();
        if (this.categoryPrefix != null) {
            this.categoryPrefix = this.categoryPrefix.trim().toUpperCase();
        }
    }

    @PostLoad
    protected void onPostLoad() {
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = "Admin";
        }
    }

    // Keep compatibility getters/setters for standard properties
    @JsonIgnore
    public Date getCreatedAt() { return createdDate; }
    public void setCreatedAt(Date d) { this.createdDate = d; }

    @JsonIgnore
    public Date getUpdatedAt() { return updatedDate; }
    public void setUpdatedAt(Date d) { this.updatedDate = d; }

    @JsonIgnore
    public String getCreatedUser() { return this.createdBy; }
    public void setCreatedUser(String u) { this.createdBy = u; }

    @JsonIgnore
    public String getUpdatedUser() { return this.updatedBy; }
    public void setUpdatedUser(String u) { this.updatedBy = u; }

    private static String resolveCurrentUser() {
        String user = null;
        try { user = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception ignored) {}
        return (user != null && !user.trim().isEmpty()) ? user : "Admin";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public Integer getSeqNo() { return seqNo; }
    public void setSeqNo(Integer seqNo) { this.seqNo = seqNo; }
    public String getCategoryPrefix() { return categoryPrefix; }
    public void setCategoryPrefix(String categoryPrefix) { this.categoryPrefix = categoryPrefix; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}

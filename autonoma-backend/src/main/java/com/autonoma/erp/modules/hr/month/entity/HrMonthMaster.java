package com.autonoma.erp.modules.hr.month.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "HR_MONTH_MASTER")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrMonthMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long id;

    /** 'REGULAR' for standard calendar months; 'HR' for dual-month spans (e.g. Jan-Feb) */
    @Column(name = "MONTH_TYPE", nullable = false, length = 20)
    private String monthType;

    @Column(name = "MONTH_NAME", nullable = false, length = 100)
    private String monthName;

    /** User-defined sort order so companies can set custom fiscal-year sequences */
    @Column(name = "SEQ_NO", nullable = false)
    private Integer seqNo = 0;

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    // ── Lifecycle hooks ──────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        String user = resolveCurrentUser();
        this.createdBy   = user;
        this.updatedBy   = null;
        this.createdDate = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        String user = resolveCurrentUser();
        this.updatedBy   = user;
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = user;
        }
        this.updatedDate = new Date();
    }

    @PostLoad
    protected void onPostLoad() {
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = "Admin";
        }
    }

    // ── Backward-compatible JSON aliases (mirrors HrLoanMaster pattern) ──────

    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public Date getCreatedAt()             { return createdDate; }
    public void setCreatedAt(Date d)       { this.createdDate = d; }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedAt")
    public Date getUpdatedAt()             { return updatedDate; }
    public void setUpdatedAt(Date d)       { this.updatedDate = d; }

    @com.fasterxml.jackson.annotation.JsonProperty("createdUser")
    public String getCreatedUser()         { return this.createdBy; }
    public void setCreatedUser(String u)   { this.createdBy = u; }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedUser")
    public String getUpdatedUser()         { return this.updatedBy; }
    public void setUpdatedUser(String u)   { this.updatedBy = u; }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static String resolveCurrentUser() {
        String user = null;
        try { user = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception ignored) {}
        return (user != null && !user.trim().isEmpty()) ? user : "Admin";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMonthType() { return monthType; }
    public void setMonthType(String monthType) { this.monthType = monthType; }
    public String getMonthName() { return monthName; }
    public void setMonthName(String monthName) { this.monthName = monthName; }
    public Integer getSeqNo() { return seqNo; }
    public void setSeqNo(Integer seqNo) { this.seqNo = seqNo; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}

package com.autonoma.erp.modules.qms.audit.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "QMS_AUDIT_SCHEDULE_LOG")
public class AuditScheduleLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SCHEDULE_ID", nullable = false)
    private Long scheduleId;

    @Column(name = "SCHEDULE_NO", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String scheduleNo;

    @Column(name = "PREV_AUDIT_DATE")
    @Temporal(TemporalType.DATE)
    private Date prevAuditDate;

    @Column(name = "NEW_AUDIT_DATE")
    @Temporal(TemporalType.DATE)
    private Date newAuditDate;

    @Column(name = "PREV_START_TIME", columnDefinition = "NVARCHAR(50)")
    private String prevStartTime;

    @Column(name = "NEW_START_TIME", columnDefinition = "NVARCHAR(50)")
    private String newStartTime;

    @Column(name = "PREV_END_TIME", columnDefinition = "NVARCHAR(50)")
    private String prevEndTime;

    @Column(name = "NEW_END_TIME", columnDefinition = "NVARCHAR(50)")
    private String newEndTime;

    @Column(name = "PREV_AUDITOR", columnDefinition = "NVARCHAR(255)")
    private String prevAuditor;

    @Column(name = "NEW_AUDITOR", columnDefinition = "NVARCHAR(255)")
    private String newAuditor;

    @Column(name = "PREV_AUDITEE", columnDefinition = "NVARCHAR(255)")
    private String prevAuditee;

    @Column(name = "NEW_AUDITEE", columnDefinition = "NVARCHAR(255)")
    private String newAuditee;

    @Column(name = "MODIFIED_BY", columnDefinition = "NVARCHAR(255)")
    private String modifiedBy;

    @Column(name = "MODIFIED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date modifiedDate;

    @Column(name = "ACTION", columnDefinition = "NVARCHAR(50)")
    private String action;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public String getScheduleNo() {
        return scheduleNo;
    }

    public void setScheduleNo(String scheduleNo) {
        this.scheduleNo = scheduleNo;
    }

    public Date getPrevAuditDate() {
        return prevAuditDate;
    }

    public void setPrevAuditDate(Date prevAuditDate) {
        this.prevAuditDate = prevAuditDate;
    }

    public Date getNewAuditDate() {
        return newAuditDate;
    }

    public void setNewAuditDate(Date newAuditDate) {
        this.newAuditDate = newAuditDate;
    }

    public String getPrevStartTime() {
        return prevStartTime;
    }

    public void setPrevStartTime(String prevStartTime) {
        this.prevStartTime = prevStartTime;
    }

    public String getNewStartTime() {
        return newStartTime;
    }

    public void setNewStartTime(String newStartTime) {
        this.newStartTime = newStartTime;
    }

    public String getPrevEndTime() {
        return prevEndTime;
    }

    public void setPrevEndTime(String prevEndTime) {
        this.prevEndTime = prevEndTime;
    }

    public String getNewEndTime() {
        return newEndTime;
    }

    public void setNewEndTime(String newEndTime) {
        this.newEndTime = newEndTime;
    }

    public String getPrevAuditor() {
        return prevAuditor;
    }

    public void setPrevAuditor(String prevAuditor) {
        this.prevAuditor = prevAuditor;
    }

    public String getNewAuditor() {
        return newAuditor;
    }

    public void setNewAuditor(String newAuditor) {
        this.newAuditor = newAuditor;
    }

    public String getPrevAuditee() {
        return prevAuditee;
    }

    public void setPrevAuditee(String prevAuditee) {
        this.prevAuditee = prevAuditee;
    }

    public String getNewAuditee() {
        return newAuditee;
    }

    public void setNewAuditee(String newAuditee) {
        this.newAuditee = newAuditee;
    }

    public String getModifiedBy() {
        return modifiedBy;
    }

    public void setModifiedBy(String modifiedBy) {
        this.modifiedBy = modifiedBy;
    }

    public Date getModifiedDate() {
        return modifiedDate;
    }

    public void setModifiedDate(Date modifiedDate) {
        this.modifiedDate = modifiedDate;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }
}

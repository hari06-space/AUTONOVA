package com.autonoma.erp.modules.qms.checklist.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import com.autonoma.erp.modules.platform.common.entity.StatusMaster;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "QMS_CHECKLIST_ASSIGNMENT", indexes = {
    @Index(name = "idx_qca_checklist_id", columnList = "CHECKLIST_ID"),
    @Index(name = "idx_qca_assigned_to", columnList = "ASSIGNED_TO"),
    @Index(name = "idx_qca_status_id", columnList = "STATUS_ID")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class ChecklistAssignment extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CHECKLIST_ID")
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private MasterChecklist checklist;

    @Column(name = "ASSIGNED_TO")
    private String assignedTo;

    @Column(name = "ASSIGNED_BY")
    private String assignedBy;

    @Column(name = "ASSIGNED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(timezone = "Asia/Kolkata")
    private Date assignedDate;

    @ManyToOne
    @JoinColumn(name = "STATUS_ID")
    private StatusMaster status;

    @ManyToOne
    @JoinColumn(name = "VERIFY_STATUS_ID")
    private StatusMaster verifyStatus;

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @Column(name = "CHECKLIST_DATE")
    @Temporal(TemporalType.DATE)
    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Kolkata")
    private Date checklistDate;

    @Column(name = "CARRY_FORWARD")
    private String carryForward;

    @Column(name = "CARRY_FORWARD_COUNT")
    private Integer carryForwardCount = 0;

    @Column(name = "ASSIGN_TYPE")
    private String assignType;

    @Column(name = "GROUP_NAME", length = 100)
    private String groupName;

    @Column(name = "VERIFIED_BY")
    private String verifiedBy;

    @Transient
    private Date verifiedDate;

    @Transient
    private String comments;

    @Transient
    private String filePaths;

    @Transient
    private List<String> filePathsList = new java.util.ArrayList<>();

    @Transient
    private String rejectedRemarks;

    @Transient
    private String rejectedBy;

    @Transient
    private Date rejectedDate;

    @Transient
    private String assignedToName;

    @Column(name = "ACTIVE")
    private Boolean isActive = true;

    @Column(name = "SCHEDULER_RUN_COUNT")
    private Integer schedulerRunCount = 0;

    @Column(name = "LAST_SCHEDULER_RUN")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastSchedulerRun;

    @Column(name = "REASSIGNED_FROM_TYPE", length = 20)
    private String reassignedFromType;

    @Column(name = "DUAL_CHECK")
    private String dualCheck;

    @Column(name = "EXECUTION_TYPE", length = 10)
    private String executionType = "AUTO";

    @Column(name = "SCHEDULER_NAME", length = 100)
    private String schedulerName;

    @Column(name = "TRIGGER_ID")
    private Long triggerId;

    @Column(name = "DUE_DATE")
    @Temporal(TemporalType.DATE)
    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Kolkata")
    private Date dueDate;

    @Column(name = "NEXT_RENEWAL_DATE")
    @Temporal(TemporalType.DATE)
    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Kolkata")
    private Date nextRenewalDate;

    @Column(name = "PENDING_ACTIVATION")
    private Boolean pendingActivation = false;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MasterChecklist getChecklist() {
        return checklist;
    }

    public void setChecklist(MasterChecklist checklist) {
        this.checklist = checklist;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
    }

    public Date getAssignedDate() {
        return assignedDate;
    }

    public void setAssignedDate(Date assignedDate) {
        this.assignedDate = assignedDate;
    }

    public StatusMaster getStatus() {
        return status;
    }

    public void setStatus(StatusMaster status) {
        this.status = status;
    }

    public StatusMaster getVerifyStatus() {
        return verifyStatus;
    }

    public void setVerifyStatus(StatusMaster verifyStatus) {
        this.verifyStatus = verifyStatus;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public Date getLastSchedulerRun() { return lastSchedulerRun; }
    public void setLastSchedulerRun(Date lastSchedulerRun) { this.lastSchedulerRun = lastSchedulerRun; }
    public Integer getSchedulerRunCount() { return schedulerRunCount; }
    public void setSchedulerRunCount(Integer schedulerRunCount) { this.schedulerRunCount = schedulerRunCount; }
    public String getReassignedFromType() { return reassignedFromType; }
    public void setReassignedFromType(String reassignedFromType) { this.reassignedFromType = reassignedFromType; }
    public String getDualCheck() { return dualCheck; }
    public void setDualCheck(String dualCheck) { this.dualCheck = dualCheck; }
    public String getExecutionType() { return executionType; }
    public void setExecutionType(String executionType) { this.executionType = executionType; }
    public String getSchedulerName() { return schedulerName; }
    public void setSchedulerName(String schedulerName) { this.schedulerName = schedulerName; }
    public Long getTriggerId() { return triggerId; }
    public void setTriggerId(Long triggerId) { this.triggerId = triggerId; }
    public Date getDueDate() { return dueDate; }
    public void setDueDate(Date dueDate) { this.dueDate = dueDate; }
    public Date getNextRenewalDate() { return nextRenewalDate; }
    public void setNextRenewalDate(Date nextRenewalDate) { this.nextRenewalDate = nextRenewalDate; }
    public String getRejectedRemarks() { return rejectedRemarks; }
    public void setRejectedRemarks(String rejectedRemarks) { this.rejectedRemarks = rejectedRemarks; }
    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }
    public Date getRejectedDate() { return rejectedDate; }
    public void setRejectedDate(Date rejectedDate) { this.rejectedDate = rejectedDate; }

    public Date getChecklistDate() {
        return checklistDate;
    }

    public void setChecklistDate(Date checklistDate) {
        if (checklistDate == null) {
            this.checklistDate = null;
            return;
        }
        try {
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
            sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            String formatted = sdf.format(checklistDate);
            
            java.text.SimpleDateFormat defaultSdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
            this.checklistDate = defaultSdf.parse(formatted);
        } catch (Exception e) {
            this.checklistDate = checklistDate;
        }
    }

    public String getCarryForward() {
        return carryForward;
    }

    public void setCarryForward(String carryForward) {
        this.carryForward = carryForward;
    }

    public Integer getCarryForwardCount() {
        return carryForwardCount;
    }

    public void setCarryForwardCount(Integer carryForwardCount) {
        this.carryForwardCount = carryForwardCount;
    }

    public String getAssignType() {
        return assignType;
    }

    public void setAssignType(String assignType) {
        this.assignType = assignType;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(String verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public Date getVerifiedDate() {
        return verifiedDate;
    }

    public void setVerifiedDate(Date verifiedDate) {
        this.verifiedDate = verifiedDate;
    }

    public String getAssignedToName() {
        return assignedToName;
    }

    public void setAssignedToName(String assignedToName) {
        this.assignedToName = assignedToName;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public String getFilePaths() {
        if (filePathsList == null || filePathsList.isEmpty()) {
            return null;
        }
        return String.join(",", filePathsList);
    }

    public void setFilePaths(String filePaths) {
        this.filePaths = filePaths;
        if (filePaths == null || filePaths.trim().isEmpty()) {
            this.filePathsList = new java.util.ArrayList<>();
        } else {
            this.filePathsList = new java.util.ArrayList<>(java.util.Arrays.asList(filePaths.split(",")));
        }
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public List<String> getActualFiles() {
        return filePathsList != null ? filePathsList : new java.util.ArrayList<>();
    }

    public void setActualFiles(List<String> files) {
        if (files == null || files.isEmpty()) {
            this.filePaths = null;
            this.filePathsList = new java.util.ArrayList<>();
        } else {
            this.filePathsList = files;
            this.filePaths = String.join(",", files);
        }
    }

    @PostLoad
    private void onLoad() {
        if (filePathsList != null && !filePathsList.isEmpty()) {
            this.filePaths = String.join(",", filePathsList);
        }
    }

    public Boolean getPendingActivation() {
        return pendingActivation;
    }

    public void setPendingActivation(Boolean pendingActivation) {
        this.pendingActivation = pendingActivation;
    }

    @PrePersist
    @PreUpdate
    private void propagateDualCheck() {
        if (this.checklist != null && this.dualCheck == null) {
            this.dualCheck = this.checklist.getDualCheck();
        }
        if (this.dualCheck != null) {
            String trimmed = this.dualCheck.trim().toUpperCase();
            if ("YES".equals(trimmed) || "1".equals(trimmed) || "TRUE".equals(trimmed)) {
                this.dualCheck = "1";
            } else {
                this.dualCheck = "0";
            }
        } else {
            this.dualCheck = "0";
        }
    }
}

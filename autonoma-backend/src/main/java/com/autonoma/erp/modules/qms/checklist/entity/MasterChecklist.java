package com.autonoma.erp.modules.qms.checklist.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.Date;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "QMS_CHECKLIST_MASTER")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(value = { "hibernateLazyInitializer", "handler" }, ignoreUnknown = true)
public class MasterChecklist extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SEQ_NO")
    private String seqNo;

    @Column(name = "CHECKING_POINT")
    private String checkingPoint;

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "CATEGORY")
    private String category; // RENEWAL or CHECK LIST

    @Column(name = "FREQUENCY")
    private String frequency;

    @Column(name = "WEEK_DAYS")
    private String weekDays;

    @Column(name = "REPEAT_EVERY_VALUE")
    private Integer repeatEveryValue;

    @Column(name = "REPEAT_EVERY_UNIT")
    private String repeatEveryUnit;

    @Column(name = "EFFECTIVE_FROM")
    @Temporal(TemporalType.DATE)
    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Kolkata")
    private Date effectiveFrom;

    @Column(name = "EXPIRY_DATE")
    @Temporal(TemporalType.DATE)
    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Kolkata")
    private Date expiryDate;

    @Column(name = "REMINDER_DAYS")
    private Long reminderDays;

    @Column(name = "REMINDER_DATE")
    @Temporal(TemporalType.DATE)
    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Kolkata")
    private Date reminderDate;

    @Column(name = "STOCK_LINK")
    private String stockLink;

    @Column(name = "PHOTO_REQUIRED")
    private String photoRequired;

    @Column(name = "VERIFICATION_REQUIRED")
    private String verificationRequired;

    @Transient
    private Date lastCompletedDate;

    @Column(name = "NEXT_DUE_DATE")
    @Temporal(TemporalType.DATE)
    private Date nextDueDate;

    @Column(name = "DUAL_CHECK")
    private String dualCheck;

    @Column(name = "CARRY_FORWARD")
    private String carryForward;

    @Transient
    private String carryForwardStatus;

    @Column(name = "AMENDMENT_REASON", columnDefinition = "NVARCHAR(MAX)")
    private String amendmentReason;

    @Transient
    private String levelIds;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "QMS_CHECKLIST_MASTER_LEVEL_MAPPING", joinColumns = @JoinColumn(name = "CHECKLIST_MASTER_ID"))
    @Column(name = "LEVEL_ID")
    private List<Integer> levelIdsList = new java.util.ArrayList<>();

    @Transient
    private String uploadedFiles;

    @Transient
    private String scannedFiles;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STATUS")
    private StatusMaster statusObj;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "TASK_STATUS")
    private StatusMaster taskStatusObj;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "VERIFY_STATUS")
    private StatusMaster verifyStatusObj;

    @Transient
    private String status;

    @Transient
    private String taskStatus;

    @Transient
    private String verifyStatus;

    @Column(name = "VERIFIED_BY")
    private String verifiedBy;

    @Column(name = "VERIFIED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date verifiedDate;

    @Column(name = "REJ_REASON")
    private String rejReason;

    @Transient
    private String assignTo;

    @Transient
    private Date assignDate;

    @Column(name = "ITEM_CODE")
    private String itemCode;

    @Column(name = "QTY")
    private String qty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PRIMARY_EMPLOYEE_ID", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private EmployeeMaster primaryEmployee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SECONDARY_EMPLOYEE_ID", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private EmployeeMaster secondaryEmployee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TERTIARY_EMPLOYEE_ID", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private EmployeeMaster tertiaryEmployee;

    @Transient
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private EmployeeMaster currentAssignee;

    @Column(name = "ASSIGNMENT_TYPE")
    private String assignmentType;

    @Column(name = "ADDITIONAL_EMPLOYEE_IDS", length = 1000)
    private String additionalEmployeeIds;

    @Transient
    private Boolean autoAssignedFlag = false;

    @Transient
    private Date lastAssignmentDate;

    public EmployeeMaster getPrimaryEmployee() { return primaryEmployee; }
    public void setPrimaryEmployee(EmployeeMaster primaryEmployee) { this.primaryEmployee = primaryEmployee; }
    public EmployeeMaster getSecondaryEmployee() { return secondaryEmployee; }
    public void setSecondaryEmployee(EmployeeMaster secondaryEmployee) { this.secondaryEmployee = secondaryEmployee; }
    public EmployeeMaster getTertiaryEmployee() { return tertiaryEmployee; }
    public void setTertiaryEmployee(EmployeeMaster tertiaryEmployee) { this.tertiaryEmployee = tertiaryEmployee; }
    public EmployeeMaster getCurrentAssignee() { return currentAssignee; }
    public void setCurrentAssignee(EmployeeMaster currentAssignee) { this.currentAssignee = currentAssignee; }
    public String getAssignmentType() { return assignmentType; }
    public void setAssignmentType(String assignmentType) { this.assignmentType = assignmentType; }
    public String getAdditionalEmployeeIds() { return additionalEmployeeIds; }
    public void setAdditionalEmployeeIds(String additionalEmployeeIds) { this.additionalEmployeeIds = additionalEmployeeIds; }
    public Boolean getAutoAssignedFlag() { return autoAssignedFlag; }
    public void setAutoAssignedFlag(Boolean autoAssignedFlag) { this.autoAssignedFlag = autoAssignedFlag; }
    public Date getLastAssignmentDate() { return lastAssignmentDate; }
    public void setLastAssignmentDate(Date lastAssignmentDate) { this.lastAssignmentDate = lastAssignmentDate; }
    public String getWeekDays() { return weekDays; }
    public void setWeekDays(String weekDays) { this.weekDays = weekDays; }
    public Integer getRepeatEveryValue() { return repeatEveryValue; }
    public void setRepeatEveryValue(Integer repeatEveryValue) { this.repeatEveryValue = repeatEveryValue; }
    public String getRepeatEveryUnit() { return repeatEveryUnit; }
    public void setRepeatEveryUnit(String repeatEveryUnit) { this.repeatEveryUnit = repeatEveryUnit; }

    @Column(name = "DYNAMIC_RULE_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String dynamicRuleJson;

    @Column(name = "PAGE_ID")
    private Integer pageId;

    @Column(name = "EVENT_TRIGGER")
    private String eventTrigger;

    @Column(name = "OFFSET_DAYS")
    private Integer offsetDays;

    @Column(name = "OFFSET_TYPE")
    private String offsetType;

    @Column(name = "ACTIVE")
    private Boolean isActive = true;

    @Transient
    private Boolean autoClosedFlag = false;

    @Transient
    private String autoClosedReason;

    @Transient
    private Date autoClosedDate;

    @Transient
    private Boolean closedBySystem = false;

    @OneToMany(mappedBy = "checklist", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 50)
    @JsonIgnoreProperties({ "checklist", "hibernateLazyInitializer" })
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private List<ChecklistDepartment> departments;

    @Column(name = "SEARCH_TEXT", length = 1000)
    private String searchText;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSearchText() {
        return searchText;
    }

    public void setSearchText(String searchText) {
        this.searchText = searchText;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("status")
    public String getStatus() {
        if (statusObj != null) {
            return statusObj.getName();
        }
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        if (status != null && !status.trim().isEmpty()) {
            try {
                com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository repo = com.autonoma.erp.util.SpringContext
                        .getBean(com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository.class);
                if (repo != null) {
                    // Normalize only true synonyms — preserve all other distinct values
                    String normName = status.trim().toUpperCase();
                    if ("IN ACTIVE".equals(normName) || "EXPIRED".equals(normName)
                            || "CANCELLED".equals(normName) || "CANCELED".equals(normName)) {
                        normName = "INACTIVE";
                    } else if ("APPROVED".equals(normName) || "DONE".equals(normName)) {
                        normName = "VERIFIED";
                    } else if ("REJECT".equals(normName)) {
                        normName = "REJECTED";
                    } else if ("NA".equals(normName)) {
                        normName = "N/A";
                    } else if ("UNASSIGNED".equals(normName)) {
                        normName = "UN ASSIGNED";
                    } else if ("PENDING FOR VERIFIED".equals(normName)) {
                        normName = "PENDING FOR VERIFY";
                    } else if ("PENDING FOR ACCEPT".equals(normName)) {
                        normName = "PENDING FOR ACCEPTED";
                    } else if ("ACCEPT".equals(normName)) {
                        normName = "ACCEPTED";
                    }
                    // All other values (ACTIVE, INACTIVE, PENDING, COMPLETED, STARTED,
                    // 25%, 50%, 75%, CLOSED, MISSED, UNRESOLVED, RENEWAL PENDING,
                    // RENEWAL VERIFIED, TO BE VERIFIED, etc.) are stored as-is.
                    java.util.Optional<com.autonoma.erp.modules.platform.common.entity.StatusMaster> existing = repo
                            .findByNameIgnoreCase(normName);
                    if (existing.isPresent()) {
                        this.statusObj = existing.get();
                    } else {
                        com.autonoma.erp.modules.platform.common.entity.StatusMaster newStatus = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                        newStatus.setName(normName);
                        this.statusObj = repo.save(newStatus);
                    }
                }
            } catch (Exception e) {
                // Ignore context not ready
            }
        } else {
            this.statusObj = null;
        }
    }

    public String getSeqNo() {
        return seqNo;
    }

    public void setSeqNo(String seqNo) {
        this.seqNo = seqNo;
    }

    public String getCheckingPoint() {
        return checkingPoint;
    }

    public void setCheckingPoint(String checkingPoint) {
        this.checkingPoint = checkingPoint;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public Date getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(Date effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public Date getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(Date expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Long getReminderDays() {
        if (reminderDays != null) {
            return reminderDays;
        }
        if (this.expiryDate != null && this.reminderDate != null) {
            long diff = this.expiryDate.getTime() - this.reminderDate.getTime();
            return Math.max(0L, diff / (1000 * 60 * 60 * 24));
        }
        return null;
    }

    public void setReminderDays(Long reminderDays) {
        this.reminderDays = reminderDays;
    }

    public Date getReminderDate() {
        return reminderDate;
    }

    public void setReminderDate(Date reminderDate) {
        this.reminderDate = reminderDate;
    }

    public String getStockLink() {
        return stockLink;
    }

    public void setStockLink(String stockLink) {
        this.stockLink = stockLink;
    }

    public String getPhotoRequired() {
        return photoRequired;
    }

    public void setPhotoRequired(String photoRequired) {
        this.photoRequired = photoRequired;
    }

    public String getVerificationRequired() {
        if (verificationRequired == null) {
            return "No";
        }
        if ("YES".equalsIgnoreCase(verificationRequired) || "Yes".equalsIgnoreCase(verificationRequired)) {
            return "Yes";
        }
        return "No";
    }

    public void setVerificationRequired(String verificationRequired) {
        if (verificationRequired == null) {
            this.verificationRequired = "No";
        } else if ("YES".equalsIgnoreCase(verificationRequired) || "Yes".equalsIgnoreCase(verificationRequired)) {
            this.verificationRequired = "Yes";
        } else {
            this.verificationRequired = "No";
        }
    }

    public Date getLastCompletedDate() {
        return lastCompletedDate;
    }

    public void setLastCompletedDate(Date lastCompletedDate) {
        this.lastCompletedDate = lastCompletedDate;
    }

    public Date getNextDueDate() {
        return nextDueDate;
    }

    public void setNextDueDate(Date nextDueDate) {
        this.nextDueDate = nextDueDate;
    }

    public String getDualCheck() {
        return dualCheck;
    }

    public void setDualCheck(String dualCheck) {
        this.dualCheck = dualCheck;
    }

    public String getAmendmentReason() {
        return amendmentReason;
    }

    public void setAmendmentReason(String amendmentReason) {
        this.amendmentReason = amendmentReason;
    }

    public String getLevelIds() {
        if (levelIdsList == null || levelIdsList.isEmpty()) {
            return null;
        }
        List<String> list = new java.util.ArrayList<>();
        for (Integer id : levelIdsList) {
            if (id != null)
                list.add(String.valueOf(id));
        }
        return String.join(",", list);
    }

    public void setLevelIds(String levelIds) {
        this.levelIds = levelIds;
        if (levelIds == null || levelIds.trim().isEmpty()) {
            this.levelIdsList = new java.util.ArrayList<>();
        } else {
            List<Integer> list = new java.util.ArrayList<>();
            for (String part : levelIds.split(",")) {
                try {
                    list.add(Integer.parseInt(part.trim()));
                } catch (NumberFormatException e) {
                    // Ignore non-integers
                }
            }
            this.levelIdsList = list;
        }
    }

    public String getUploadedFiles() {
        return uploadedFiles;
    }

    public void setUploadedFiles(String uploadedFiles) {
        this.uploadedFiles = uploadedFiles;
    }

    public String getScannedFiles() {
        return scannedFiles;
    }

    public void setScannedFiles(String scannedFiles) {
        this.scannedFiles = scannedFiles;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("taskStatus")
    public String getTaskStatus() {
        if (taskStatusObj != null) {
            return taskStatusObj.getName();
        }
        return taskStatus;
    }

    public void setTaskStatus(String taskStatus) {
        this.taskStatus = taskStatus;
        if (taskStatus != null && !taskStatus.trim().isEmpty()) {
            try {
                com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository repo = com.autonoma.erp.util.SpringContext
                        .getBean(com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository.class);
                if (repo != null) {
                    String normName = taskStatus.trim().toUpperCase();
                    if ("ACTIVE".equals(normName)) {
                        normName = "ACTIVE";
                    } else if ("INACTIVE".equals(normName) || "IN ACTIVE".equals(normName) || "EXPIRED".equals(normName)
                            || "CANCELLED".equals(normName) || "CLOSED".equals(normName)
                            || "CANCELED".equals(normName)) {
                        normName = "INACTIVE";
                    } else if ("VERIFIED".equals(normName) || "APPROVED".equals(normName) || "ACCEPT".equals(normName)
                            || "ACCEPTED".equals(normName) || "COMPLETED".equals(normName) || "DONE".equals(normName)) {
                        normName = "VERIFIED";
                    } else if ("REJECTED".equals(normName) || "REJECT".equals(normName)
                            || "UNRESOLVED".equals(normName)) {
                        normName = "REJECTED";
                    } else if ("UN ASSIGNED".equals(normName) || "UNASSIGNED".equals(normName)) {
                        normName = "UN ASSIGNED";
                    } else if ("ASSIGNED".equals(normName) || "IN PROGRESS".equals(normName)
                            || "INPROGRESS".equals(normName) || "OVERDUE".equals(normName)
                            || "STARTED".equals(normName)) {
                        normName = "ASSIGNED";
                    } else {
                        normName = "TO BE VERIFIED";
                    }
                    java.util.Optional<com.autonoma.erp.modules.platform.common.entity.StatusMaster> existing = repo
                            .findByNameIgnoreCase(normName);
                    if (existing.isPresent()) {
                        this.taskStatusObj = existing.get();
                    } else {
                        com.autonoma.erp.modules.platform.common.entity.StatusMaster newStatus = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                        newStatus.setName(normName);
                        this.taskStatusObj = repo.save(newStatus);
                    }
                }
            } catch (Exception e) {
                // Ignore context not ready
            }
        } else {
            this.taskStatusObj = null;
        }
    }

    @com.fasterxml.jackson.annotation.JsonProperty("verifyStatus")
    public String getVerifyStatus() {
        if (verifyStatusObj != null) {
            return verifyStatusObj.getName();
        }
        return verifyStatus;
    }

    public void setVerifyStatus(String verifyStatus) {
        this.verifyStatus = verifyStatus;
        if (verifyStatus != null && !verifyStatus.trim().isEmpty()) {
            try {
                com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository repo = com.autonoma.erp.util.SpringContext
                        .getBean(com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository.class);
                if (repo != null) {
                    String normName = verifyStatus.trim().toUpperCase();
                    if ("ACTIVE".equals(normName)) {
                        normName = "ACTIVE";
                    } else if ("INACTIVE".equals(normName) || "IN ACTIVE".equals(normName) || "EXPIRED".equals(normName)
                            || "CANCELLED".equals(normName) || "CLOSED".equals(normName)
                            || "CANCELED".equals(normName)) {
                        normName = "INACTIVE";
                    } else if ("VERIFIED".equals(normName) || "APPROVED".equals(normName) || "ACCEPT".equals(normName)
                            || "ACCEPTED".equals(normName) || "COMPLETED".equals(normName) || "DONE".equals(normName)) {
                        normName = "VERIFIED";
                    } else if ("REJECTED".equals(normName) || "REJECT".equals(normName)
                            || "UNRESOLVED".equals(normName)) {
                        normName = "REJECTED";
                    } else if ("UN ASSIGNED".equals(normName) || "UNASSIGNED".equals(normName)) {
                        normName = "UN ASSIGNED";
                    } else if ("ASSIGNED".equals(normName) || "IN PROGRESS".equals(normName)
                            || "INPROGRESS".equals(normName) || "OVERDUE".equals(normName)
                            || "STARTED".equals(normName)) {
                        normName = "ASSIGNED";
                    } else {
                        normName = "TO BE VERIFIED";
                    }
                    java.util.Optional<com.autonoma.erp.modules.platform.common.entity.StatusMaster> existing = repo
                            .findByNameIgnoreCase(normName);
                    if (existing.isPresent()) {
                        this.verifyStatusObj = existing.get();
                    } else {
                        com.autonoma.erp.modules.platform.common.entity.StatusMaster newStatus = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                        newStatus.setName(normName);
                        this.verifyStatusObj = repo.save(newStatus);
                    }
                }
            } catch (Exception e) {
                // Ignore context not ready
            }
        } else {
            this.verifyStatusObj = null;
        }
    }

    public StatusMaster getStatusObj() {
        return statusObj;
    }

    public void setStatusObj(StatusMaster statusObj) {
        this.statusObj = statusObj;
    }

    public StatusMaster getTaskStatusObj() {
        return taskStatusObj;
    }

    public void setTaskStatusObj(StatusMaster taskStatusObj) {
        this.taskStatusObj = taskStatusObj;
    }

    public StatusMaster getVerifyStatusObj() {
        return verifyStatusObj;
    }

    public void setVerifyStatusObj(StatusMaster verifyStatusObj) {
        this.verifyStatusObj = verifyStatusObj;
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

    public String getRejReason() {
        return rejReason;
    }

    public void setRejReason(String rejReason) {
        this.rejReason = rejReason;
    }

    public String getAssignTo() {
        return assignTo;
    }

    public void setAssignTo(String assignTo) {
        this.assignTo = assignTo;
    }

    public Date getAssignDate() {
        return assignDate;
    }

    public void setAssignDate(Date assignDate) {
        this.assignDate = assignDate;
    }

    public String getItemCode() {
        return itemCode;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public String getQty() {
        return qty;
    }

    public void setQty(String qty) {
        this.qty = qty;
    }

    public List<ChecklistDepartment> getDepartments() {
        return departments;
    }

    public void setDepartments(List<ChecklistDepartment> departments) {
        this.departments = departments;
    }

    public String getCarryForward() {
        return carryForward;
    }

    public void setCarryForward(String carryForward) {
        this.carryForward = carryForward;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getAutoClosedFlag() {
        return autoClosedFlag;
    }

    public void setAutoClosedFlag(Boolean autoClosedFlag) {
        this.autoClosedFlag = autoClosedFlag;
    }

    public String getAutoClosedReason() {
        return autoClosedReason;
    }

    public void setAutoClosedReason(String autoClosedReason) {
        this.autoClosedReason = autoClosedReason;
    }

    public Date getAutoClosedDate() {
        return autoClosedDate;
    }

    public void setAutoClosedDate(Date autoClosedDate) {
        this.autoClosedDate = autoClosedDate;
    }

    public Integer getPageId() {
        return pageId;
    }

    public void setPageId(Integer pageId) {
        this.pageId = pageId;
    }

    public String getDynamicRuleJson() {
        return dynamicRuleJson;
    }

    public void setDynamicRuleJson(String dynamicRuleJson) {
        this.dynamicRuleJson = dynamicRuleJson;
    }

    public String getEventTrigger() {
        return eventTrigger;
    }

    public void setEventTrigger(String eventTrigger) {
        this.eventTrigger = eventTrigger;
    }

    public Integer getOffsetDays() {
        return offsetDays;
    }

    public void setOffsetDays(Integer offsetDays) {
        this.offsetDays = offsetDays;
    }

    public String getOffsetType() {
        return offsetType;
    }

    public void setOffsetType(String offsetType) {
        this.offsetType = offsetType;
    }

    public Boolean getClosedBySystem() {
        return closedBySystem;
    }

    public void setClosedBySystem(Boolean closedBySystem) {
        this.closedBySystem = closedBySystem;
    }

    @PrePersist
    @PreUpdate
    private void normalizeDualCheck() {
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

    @PostLoad
    private void onLoad() {
        if (levelIdsList != null && !levelIdsList.isEmpty()) {
            List<String> list = new java.util.ArrayList<>();
            for (Integer id : levelIdsList) {
                if (id != null)
                    list.add(String.valueOf(id));
            }
            this.levelIds = String.join(",", list);
        }
    }
}

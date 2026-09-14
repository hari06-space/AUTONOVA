package com.autonoma.erp.modules.platform.ticketing.entity;

import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Collections;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "TICKET_TRACEABILITY_CENTER")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketTraceabilityCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "row_id")
    private Integer rowId;

    @Column(name = "ticket_id", nullable = false, unique = true, length = 50)
    private String ticketId;

    @Column(name = "ticket_type", nullable = false, length = 50)
    private String ticketType;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "page_id")
    private Integer pageId;

    @Column(name = "employee_code", length = 50)
    private String employeeCode;

    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    @Transient
    private String employeeName;

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getEmployeeName() {
        return employee != null ? employee.getEmployeeName() : this.employeeName;
    }

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "mobile_no", length = 50)
    private String mobileNo;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "additional_requirement", columnDefinition = "NVARCHAR(MAX)")
    private String additionalRequirement;

    @Column(name = "priority_level", length = 50)
    private String priorityLevel;

    @Column(name = "severity_level", length = 50)
    private String severityLevel;

    @Column(name = "ticket_status", nullable = false, length = 50)
    private String ticketStatus;

    @Column(name = "assigned_to", length = 100)
    private String assignedTo;

    @Column(name = "assigned_by", length = 100)
    private String assignedBy;

    @Column(name = "developer_name", length = 100)
    private String developerName;

    @Column(name = "developer_email", length = 100)
    private String developerEmail;

    @Column(name = "developer_mobile_no", length = 50)
    private String developerMobileNo;

    public Integer getRowId() { return rowId; }
    public void setRowId(Integer rowId) { this.rowId = rowId; }
    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getTicketStatus() { return ticketStatus; }
    public void setTicketStatus(String ticketStatus) { this.ticketStatus = ticketStatus; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    public String getDeveloperName() { return developerName; }
    public void setDeveloperName(String developerName) { this.developerName = developerName; }
    public String getDeveloperEmail() { return developerEmail; }
    public void setDeveloperEmail(String developerEmail) { this.developerEmail = developerEmail; }
    public String getDeveloperMobileNo() { return developerMobileNo; }
    public void setDeveloperMobileNo(String developerMobileNo) { this.developerMobileNo = developerMobileNo; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getMobileNo() { return mobileNo; }
    public void setMobileNo(String mobileNo) { this.mobileNo = mobileNo; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getAdditionalRequirement() { return additionalRequirement; }
    public void setAdditionalRequirement(String additionalRequirement) { this.additionalRequirement = additionalRequirement; }
    public String getPriorityLevel() { return priorityLevel; }
    public void setPriorityLevel(String priorityLevel) { this.priorityLevel = priorityLevel; }
    public String getSeverityLevel() { return severityLevel; }
    public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }
    public String getReassignReason() { return reassignReason; }
    public void setReassignReason(String reassignReason) { this.reassignReason = reassignReason; }
    public String getReassignComment() { return reassignComment; }
    public void setReassignComment(String reassignComment) { this.reassignComment = reassignComment; }
    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }
    public Date getDueDate() { return dueDate; }
    public void setDueDate(Date dueDate) { this.dueDate = dueDate; }
    public Date getTargetDate() { return targetDate; }
    public void setTargetDate(Date targetDate) { this.targetDate = targetDate; }
    public String getTakenTime() { return takenTime; }
    public void setTakenTime(String takenTime) { this.takenTime = takenTime; }
    public String getReworkTime() { return reworkTime; }
    public void setReworkTime(String reworkTime) { this.reworkTime = reworkTime; }
    public String getDueDateReason() { return dueDateReason; }
    public void setDueDateReason(String dueDateReason) { this.dueDateReason = dueDateReason; }
    public String getAssignedHours() { return assignedHours; }
    public void setAssignedHours(String assignedHours) { this.assignedHours = assignedHours; }
    public String getResolutionSummary() { return resolutionSummary; }
    public void setResolutionSummary(String resolutionSummary) { this.resolutionSummary = resolutionSummary; }
    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public Date getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Date resolvedAt) { this.resolvedAt = resolvedAt; }
    public Date getClosedAt() { return closedAt; }
    public void setClosedAt(Date closedAt) { this.closedAt = closedAt; }
    public Integer getReopenedCount() { return reopenedCount; }
    public void setReopenedCount(int reopenedCount) { this.reopenedCount = reopenedCount; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public String getTestedBy() { return testedBy; }
    public void setTestedBy(String testedBy) { this.testedBy = testedBy; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getAttachmentPath() { return attachmentPath; }
    public void setAttachmentPath(String attachmentPath) { this.attachmentPath = attachmentPath; }
    public List<String> getTempAttachments() { return tempAttachments != null ? tempAttachments : Collections.emptyList(); }
    public void setTempAttachments(List<String> tempAttachments) { this.tempAttachments = tempAttachments; }
    public List<String> getTempAdditionalAttachments() { return tempAdditionalAttachments != null ? tempAdditionalAttachments : Collections.emptyList(); }
    public void setTempAdditionalAttachments(List<String> tempAdditionalAttachments) { this.tempAdditionalAttachments = tempAdditionalAttachments; }
    public List<String> getTempVoiceRecordings() { return tempVoiceRecordings != null ? tempVoiceRecordings : Collections.emptyList(); }
    public void setTempVoiceRecordings(List<String> tempVoiceRecordings) { this.tempVoiceRecordings = tempVoiceRecordings; }
    public List<String> getTempAdditionalVoiceRecordings() { return tempAdditionalVoiceRecordings != null ? tempAdditionalVoiceRecordings : Collections.emptyList(); }
    public void setTempAdditionalVoiceRecordings(List<String> tempAdditionalVoiceRecordings) { this.tempAdditionalVoiceRecordings = tempAdditionalVoiceRecordings; }

    @Column(name = "due_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date dueDate;

    @Column(name = "target_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date targetDate;

    @Column(name = "taken_time", length = 100)
    private String takenTime;

    @Column(name = "rework_time", length = 100)
    private String reworkTime;

    @Column(name = "assigned_hours", length = 50)
    private String assignedHours;

    @Column(name = "due_date_reason", columnDefinition = "NVARCHAR(MAX)")
    private String dueDateReason;

    @Column(name = "resolved_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date resolvedAt;

    @Column(name = "closed_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date closedAt;

    @Column(name = "reopened_count", nullable = false)
    private int reopenedCount;

    @Column(name = "resolution_summary", columnDefinition = "NVARCHAR(MAX)")
    private String resolutionSummary;

    @Column(name = "root_cause", columnDefinition = "NVARCHAR(MAX)")
    private String rootCause;

    @Column(name = "source_type", length = 100)
    private String sourceType;

    @Column(name = "attachment_path", length = 500)
    private String attachmentPath;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "verified_by", length = 100)
    private String verifiedBy;

    @Column(name = "tested_by", length = 100)
    private String testedBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @Transient
    private List<String> tempAttachments;

    @Transient
    private List<String> tempVoiceRecordings;

    @Transient
    private List<String> tempAdditionalAttachments;

    @Transient
    private List<String> tempAdditionalVoiceRecordings;

    @Transient
    private String reassignComment;

    @Transient
    private String reassignReason;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.createdBy = currentUserId;
        this.updatedBy = null;

        this.createdAt = new Date();
        if (this.ticketStatus == null || this.ticketStatus.trim().isEmpty()) {
            this.ticketStatus = "Open";
        }

    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        this.updatedAt = new Date();

    }
}

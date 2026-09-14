package com.autonoma.erp.modules.qms.meeting.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.ArrayList;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "QMS_MEETING_MASTER")
public class QmsMeetingMaster extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "MEETING_NAME", nullable = false)
    private String meetingName;

    public String getMeetingName() { return meetingName; }

    @Column(name = "MEETING_DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String meetingDescription;

    @Column(name = "MEETING_PREFIX", nullable = false)
    private String meetingPrefix;

    @Column(name = "MEETING_AGENDA", columnDefinition = "NVARCHAR(MAX)")
    private String meetingAgenda;

    @Transient
    private String employeeId;

    @com.fasterxml.jackson.annotation.JsonProperty("employeeId")
    public String getEmployeeId() {
        if (employeeId != null && !employeeId.trim().isEmpty()) {
            return employeeId;
        }
        if (employeeMappings != null && !employeeMappings.isEmpty()) {
            String mappedIds = employeeMappings.stream()
                    .filter(e -> e != null && e.getEmployee() != null)
                    .map(e -> String.valueOf(e.getEmployee().getId()))
                    .collect(java.util.stream.Collectors.joining(","));
            if (mappedIds != null && !mappedIds.trim().isEmpty()) {
                return mappedIds;
            }
        }
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    @Transient
    private String employeeName;

    @com.fasterxml.jackson.annotation.JsonProperty("employeeName")
    public String getEmployeeName() {
        if (employeeName != null && !employeeName.trim().isEmpty()) {
            return employeeName;
        }
        if (employeeMappings != null && !employeeMappings.isEmpty()) {
            String mappedNames = employeeMappings.stream()
                    .filter(e -> e != null && e.getEmployee() != null)
                    .map(e -> e.getEmployee().getEmployeeName())
                    .collect(java.util.stream.Collectors.joining(", "));
            if (mappedNames != null && !mappedNames.trim().isEmpty()) {
                return mappedNames;
            }
        }
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj;

    @Transient
    private String status = "ACTIVE";
    @com.fasterxml.jackson.annotation.JsonProperty("status")
    public String getStatus() {
        if (statusObj != null) {
            return statusObj.getName();
        }
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        this.statusObj = null;
    }

    @Transient
    private String attachmentName;

    @com.fasterxml.jackson.annotation.JsonProperty("attachmentName")
    public String getAttachmentName() {
        if (attachments != null && !attachments.isEmpty()) {
            return attachments.stream()
                    .map(QmsAttachmentPath::getFileName)
                    .collect(java.util.stream.Collectors.joining(", "));
        }
        return attachmentName;
    }

    public void setAttachmentName(String attachmentName) {
        this.attachmentName = attachmentName;
    }

    @Transient
    private String attachmentUrl;

    @com.fasterxml.jackson.annotation.JsonProperty("attachmentUrl")
    public String getAttachmentUrl() {
        if (attachments != null && !attachments.isEmpty()) {
            return attachments.stream()
                    .map(QmsAttachmentPath::getPath)
                    .collect(java.util.stream.Collectors.joining(","));
        }
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<QmsMeetingEmployeeMapping> employeeMappings = new ArrayList<>();

    @Transient
    private List<QmsAttachmentPath> attachments = new ArrayList<>();

    @Transient
    private String attachmentsRequired;

    @com.fasterxml.jackson.annotation.JsonProperty("attachmentsRequired")
    public String getAttachmentsRequired() {
        return (attachments != null && !attachments.isEmpty()) ? "Yes" : "No";
    }

    public void setAttachmentsRequired(String attachmentsRequired) {
        this.attachmentsRequired = attachmentsRequired;
    }

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Column(name = "REMAINDER_DAYS")
    private Integer reminderDays = 0;

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getReminderDays() {
        return reminderDays != null ? reminderDays : 0;
    }

    public void setReminderDays(Integer reminderDays) {
        if (reminderDays != null) {
            if (reminderDays < 0) reminderDays = 0;
            if (reminderDays > 15) reminderDays = 15;
        }
        this.reminderDays = reminderDays != null ? reminderDays : 0;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("remainderDays")
    public Integer getRemainderDays() {
        return getReminderDays();
    }

    @com.fasterxml.jackson.annotation.JsonProperty("remainderDays")
    public void setRemainderDays(Integer remainderDays) {
        setReminderDays(remainderDays);
    }

    // ── Explicit getters/setters (Lombok fallback for Java 21) ──
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public void setMeetingName(String meetingName) { this.meetingName = meetingName; }

    public String getMeetingDescription() { return meetingDescription; }
    public void setMeetingDescription(String meetingDescription) { this.meetingDescription = meetingDescription; }

    public String getMeetingPrefix() { return meetingPrefix; }
    public void setMeetingPrefix(String meetingPrefix) { this.meetingPrefix = meetingPrefix; }

    public String getMeetingAgenda() { return meetingAgenda; }
    public void setMeetingAgenda(String meetingAgenda) { this.meetingAgenda = meetingAgenda; }

    public java.util.List<QmsMeetingEmployeeMapping> getEmployeeMappings() { return employeeMappings; }
    public void setEmployeeMappings(java.util.List<QmsMeetingEmployeeMapping> employeeMappings) { this.employeeMappings = employeeMappings; }

    public java.util.List<QmsAttachmentPath> getAttachments() { return attachments; }
    public void setAttachments(java.util.List<QmsAttachmentPath> attachments) { this.attachments = attachments; }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getTitle() { return meetingName; }
    @com.fasterxml.jackson.annotation.JsonIgnore
    public void setTitle(String title) { /* no-op to prevent overwriting meetingName */ }
    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getComponentName() { return meetingName; }
    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getStatusObj() { return statusObj; }
    public void setStatusObj(com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj) { this.statusObj = statusObj; }
}

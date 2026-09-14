package com.autonoma.erp.modules.qms.meeting.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "QMS_MOM_MASTER")
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class QmsMomMaster extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "MOM_NO", nullable = false, unique = true)
    private String momNo;

    public String getMomNo() { return momNo; }
    public void setMomNo(String momNo) { this.momNo = momNo; }

    @Column(name = "MOM_DATE", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate momDate = LocalDate.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "SCHEDULE_ID", nullable = false)
    private QmsMeetingSchedule schedule;

    @Column(name = "AGENDA", columnDefinition = "NVARCHAR(MAX)")
    private String agenda;

    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "CHAIRED_BY_ID")
    private EmployeeMaster chairedBy;

    @Column(name = "START_TIME")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @Column(name = "END_TIME")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj;

    @Transient
    private String status = "OPEN"; // OPEN, CLOSED

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

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "mom", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 100)
    @JsonIgnoreProperties("mom")
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<QmsMomAttendance> attendanceList;

    @OneToMany(mappedBy = "mom", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 100)
    @JsonIgnoreProperties("mom")
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<QmsMomDetails> details;

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    @Transient
    private List<QmsAttachmentPath> attachments = new java.util.ArrayList<>();

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

    public List<QmsAttachmentPath> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<QmsAttachmentPath> attachments) {
        this.attachments = attachments;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getMomDate() { return momDate; }
    public void setMomDate(LocalDate momDate) { this.momDate = momDate; }
    public QmsMeetingSchedule getSchedule() { return schedule; }
    public void setSchedule(QmsMeetingSchedule schedule) { this.schedule = schedule; }
    public String getAgenda() { return agenda; }
    public void setAgenda(String agenda) { this.agenda = agenda; }
    public EmployeeMaster getChairedBy() { return chairedBy; }
    public void setChairedBy(EmployeeMaster chairedBy) { this.chairedBy = chairedBy; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public List<QmsMomAttendance> getAttendanceList() { return attendanceList; }
    public void setAttendanceList(List<QmsMomAttendance> attendanceList) { this.attendanceList = attendanceList; }
    public List<QmsMomDetails> getDetails() { return details; }
    public void setDetails(List<QmsMomDetails> details) { this.details = details; }
    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getStatusObj() { return statusObj; }
    public void setStatusObj(com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj) { this.statusObj = statusObj; }
}


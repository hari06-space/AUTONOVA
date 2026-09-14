package com.autonoma.erp.modules.qms.meeting.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "QMS_MEETING_SCHEDULE")
@Data
@NoArgsConstructor
public class QmsMeetingSchedule extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SCHEDULE_NO", nullable = false, unique = true)
    private String scheduleNo;

    @Column(name = "REV_SOURCE_SCHEDULE_NO")
    private String revSourceScheduleNo;

    @Column(name = "REV_NO")
    private Integer revNo = 0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "MEETING_TYPE_ID", nullable = false)
    private QmsMeetingMaster meetingType;

    public QmsMeetingMaster getMeetingType() {
        return meetingType;
    }

    @NotNull(message = "Schedule Date is required")
    @Column(name = "MEETING_DATE", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate meetingDate;

    @NotNull(message = "Schedule Time is required")
    @Column(name = "START_TIME", nullable = false)
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    public String getScheduleNo() {
        return scheduleNo;
    }

    public LocalDate getMeetingDate() {
        return meetingDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    @Column(name = "END_TIME")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    @Column(name = "INTERVAL_TIME")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime intervalTime;

    @NotBlank(message = "frequency is required")
    @Column(name = "FREQUENCY")
    private String frequency = "NONE";

    @Column(name = "WEEKDAYS", length = 100)
    private String weekdays;

    @OneToMany(mappedBy = "scheduleId", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<QmsMeetingScheduleWeekdayMapping> weekdayMappings;

    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "CHAIRED_BY_ID", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private EmployeeMaster chairedBy;

    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "HOST_BY_ID", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private EmployeeMaster hostBy;

    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "SECONDARY_HOST_ID", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private EmployeeMaster secondaryHost;

    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "TERTIARY_HOST_ID", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private EmployeeMaster tertiaryHost;

    @Column(name = "CANCEL_REASON")
    private String cancelReason;

    @Column(name = "RESCHEDULE_REASON")
    private String rescheduleReason;

    @Column(name = "COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    @Column(name = "SUBJECT")
    private String subject;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj;

    @Transient
    private String status = "OPEN";

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
    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    private Boolean isActive = true;

    @Column(name = "AUTO_SCHEDULE")
    private Boolean autoSchedule = true;

    @Column(name = "PARENT_SCHEDULE_ID")
    private Long parentScheduleId;

    @Column(name = "CONFIG_ID")
    private Long configId;

    @Transient
    private Boolean updateConfig;

    @Column(name = "MEETING_STATUS")
    private String meetingStatus = "Scheduled";

    @Column(name = "ATTENDANCE_STATUS")
    private String attendanceStatus = "Pending";

    @Column(name = "MOM_STATUS")
    private String momStatus = "Not Started";

    @Column(name = "SEARCH_TEXT", length = 1000)
    private String searchText;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("schedule")
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<QmsMeetingDepartmentMapping> departments;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("schedule")
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<QmsMeetingParticipantMapping> participants;

    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    public Boolean getIsActive() {
        return isActive;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getSearchText() {
        return searchText;
    }

    public void setSearchText(String searchText) {
        this.searchText = searchText;
    }

    public EmployeeMaster getTertiaryHost() {
        return tertiaryHost;
    }

    public void setTertiaryHost(EmployeeMaster tertiaryHost) {
        this.tertiaryHost = tertiaryHost;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public List<QmsMeetingParticipantMapping> getParticipants() {
        return participants;
    }

    public void setParticipants(List<QmsMeetingParticipantMapping> participants) {
        this.participants = participants;
    }

    public List<QmsMeetingDepartmentMapping> getDepartments() {
        return departments;
    }

    public void setDepartments(List<QmsMeetingDepartmentMapping> departments) {
        this.departments = departments;
    }

    public List<QmsMeetingScheduleWeekdayMapping> getWeekdayMappings() {
        return weekdayMappings;
    }

    public void setWeekdayMappings(List<QmsMeetingScheduleWeekdayMapping> weekdayMappings) {
        this.weekdayMappings = weekdayMappings;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getParentScheduleId() {
        return parentScheduleId;
    }

    public void setParentScheduleId(Long parentScheduleId) {
        this.parentScheduleId = parentScheduleId;
    }

    public void setMeetingType(QmsMeetingMaster meetingType) {
        this.meetingType = meetingType;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public LocalTime getIntervalTime() {
        return intervalTime;
    }

    public void setIntervalTime(LocalTime intervalTime) {
        this.intervalTime = intervalTime;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public String getWeekdays() {
        return weekdays;
    }

    public void setWeekdays(String weekdays) {
        this.weekdays = weekdays;
    }

    public EmployeeMaster getChairedBy() {
        return chairedBy;
    }

    public void setChairedBy(EmployeeMaster chairedBy) {
        this.chairedBy = chairedBy;
    }

    public EmployeeMaster getHostBy() {
        return hostBy;
    }

    public void setHostBy(EmployeeMaster hostBy) {
        this.hostBy = hostBy;
    }

    public EmployeeMaster getSecondaryHost() {
        return secondaryHost;
    }

    public void setSecondaryHost(EmployeeMaster secondaryHost) {
        this.secondaryHost = secondaryHost;
    }

    public void setScheduleNo(String scheduleNo) {
        this.scheduleNo = scheduleNo;
    }

    public void setMeetingDate(LocalDate meetingDate) {
        this.meetingDate = meetingDate;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public Boolean getAutoSchedule() {
        return autoSchedule;
    }

    public void setAutoSchedule(Boolean autoSchedule) {
        this.autoSchedule = autoSchedule;
    }

    public Long getConfigId() {
        return configId;
    }

    public void setConfigId(Long configId) {
        this.configId = configId;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updateConfig")
    public Boolean getUpdateConfig() {
        return updateConfig;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updateConfig")
    public void setUpdateConfig(Boolean updateConfig) {
        this.updateConfig = updateConfig;
    }

    public String getMeetingStatus() {
        return meetingStatus;
    }

    public void setMeetingStatus(String meetingStatus) {
        this.meetingStatus = meetingStatus;
    }

    public String getAttendanceStatus() {
        return attendanceStatus;
    }

    public void setAttendanceStatus(String attendanceStatus) {
        this.attendanceStatus = attendanceStatus;
    }

    public String getMomStatus() {
        return momStatus;
    }

    public void setMomStatus(String momStatus) {
        this.momStatus = momStatus;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getStatusObj() {
        return statusObj;
    }

    public void setStatusObj(com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj) {
        this.statusObj = statusObj;
    }

    public Integer getRevNo() {
        return revNo;
    }

    public void setRevNo(Integer revNo) {
        this.revNo = revNo;
    }

    public String getRevSourceScheduleNo() {
        return revSourceScheduleNo;
    }

    public void setRevSourceScheduleNo(String revSourceScheduleNo) {
        this.revSourceScheduleNo = revSourceScheduleNo;
    }
}

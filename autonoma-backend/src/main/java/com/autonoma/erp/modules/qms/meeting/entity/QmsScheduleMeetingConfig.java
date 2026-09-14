package com.autonoma.erp.modules.qms.meeting.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "QMS_SCHEDULE_MEETING_CONFIG")
@Data
@NoArgsConstructor
public class QmsScheduleMeetingConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "MEETING_ID", nullable = false)
    private Long meetingId;

    @Column(name = "MEETING_TYPE_ID", nullable = false)
    private Long meetingTypeId;

    @Column(name = "MEETING_START_DATE", nullable = false)
    private LocalDate meetingStartDate;

    @Column(name = "START_TIME", nullable = false)
    private LocalTime startTime;

    @Column(name = "END_TIME", nullable = false)
    private LocalTime endTime;

    @Column(name = "INTERVAL_TIME", nullable = false)
    private LocalTime intervalTime;

    @Column(name = "FREQUECY", nullable = false) // Mapped as FREQUECY based on user input
    private String frequency;

    @Column(name = "STATUS")
    private Boolean status = true;

    @Column(name = "WEEK_DAYS", length = 100)
    private String weekdays;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    private LocalDateTime createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;

    public LocalTime getIntervalTime() { return intervalTime; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public String getFrequency() { return frequency; }
    public Boolean getStatus() { return status; }
    public String getWeekdays() { return weekdays; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getMeetingId() { return meetingId; }
    public void setMeetingId(Long meetingId) { this.meetingId = meetingId; }
    public Long getMeetingTypeId() { return meetingTypeId; }
    public void setMeetingTypeId(Long meetingTypeId) { this.meetingTypeId = meetingTypeId; }
    public LocalDate getMeetingStartDate() { return meetingStartDate; }
    public void setMeetingStartDate(LocalDate meetingStartDate) { this.meetingStartDate = meetingStartDate; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public void setIntervalTime(LocalTime intervalTime) { this.intervalTime = intervalTime; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public void setStatus(Boolean status) { this.status = status; }
    public void setWeekdays(String weekdays) { this.weekdays = weekdays; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(LocalDateTime updatedDate) { this.updatedDate = updatedDate; }
}

package com.autonoma.erp.modules.qms.meeting.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeetingConfigSummaryDTO {
    private Long id; // Config ID
    private String scheduleId; // Schedule No of OPEN schedule
    private String meetingType; // Meeting name
    private String subject; // Schedule subject
    private String agenda; // Meeting agenda
    private String description; // Meeting description
    private String host;
    private String head;
    private String participants;
    private String time;
    private String department;
    private Boolean status; // 1/true = Enable, 0/false = Disable

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getScheduleId() { return scheduleId; }
    public void setScheduleId(String scheduleId) { this.scheduleId = scheduleId; }
    public String getMeetingType() { return meetingType; }
    public void setMeetingType(String meetingType) { this.meetingType = meetingType; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getAgenda() { return agenda; }
    public void setAgenda(String agenda) { this.agenda = agenda; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
    public String getHead() { return head; }
    public void setHead(String head) { this.head = head; }
    public String getParticipants() { return participants; }
    public void setParticipants(String participants) { this.participants = participants; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
}

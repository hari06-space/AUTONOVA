package com.autonoma.erp.modules.qms.meeting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingMeetingReminderDto {
    private Long scheduleId;
    private String scheduleNo;
    private Integer meetingTypeId;
    private String meetingName;
    private String meetingPrefix;
    private String meetingDescription;
    private String subject;
    private String meetingAgenda;
    private LocalDate meetingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer reminderDays;
    private String hostName;
    private String userRole; // e.g. "HOST" or "PARTICIPANT"
}

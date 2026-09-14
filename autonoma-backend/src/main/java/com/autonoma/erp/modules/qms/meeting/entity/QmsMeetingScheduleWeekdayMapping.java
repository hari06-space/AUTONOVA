package com.autonoma.erp.modules.qms.meeting.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "QMS_MEETING_SCHEDULE_WEEKDAY_MAPPING")
public class QmsMeetingScheduleWeekdayMapping extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SCHEDULE_ID")
    private Long scheduleId;

    @Column(name = "WEEKDAY_ID", length = 50)
    private String weekdayId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }
    public String getWeekdayId() { return weekdayId; }
    public void setWeekdayId(String weekdayId) { this.weekdayId = weekdayId; }
}

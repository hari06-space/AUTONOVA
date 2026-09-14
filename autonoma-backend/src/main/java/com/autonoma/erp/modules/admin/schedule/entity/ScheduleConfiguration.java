package com.autonoma.erp.modules.admin.schedule.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "SCHEDULE_CONFIGURATION")
@Data
@EqualsAndHashCode(callSuper = true)
public class ScheduleConfiguration extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "SCHEDULAR_NAME", length = 50)
    private String schedularName;

    @Column(name = "SCHEDULAR_TIME")
    private LocalDateTime schedularTime;

    @Column(name = "FREQUENCY", length = 50)
    private String frequency;

    @Column(name = "STATUS")
    private Boolean status;

    @Column(name = "ACTIVE_STATUS", length = 20)
    private String activeStatus = "Active";

    @Column(name = "HOLIDAY_STRATEGY", length = 20)
    private String holidayStrategy = "NEXT";

    @jakarta.persistence.Transient
    private Boolean isRunning = false;

    public String getSchedularName() { return schedularName; }
    public String getHolidayStrategy() { return holidayStrategy; }
    public Long getId() { return id; }
    public LocalDateTime getSchedularTime() { return schedularTime; }
    public void setSchedularTime(LocalDateTime schedularTime) { this.schedularTime = schedularTime; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
    public Boolean getIsRunning() { return isRunning; }
    public void setIsRunning(Boolean isRunning) { this.isRunning = isRunning; }
}

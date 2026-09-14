package com.autonoma.erp.modules.qms.meeting.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "QMS_MEETING_USER_ATTENDANCE",
       uniqueConstraints = @UniqueConstraint(columnNames = {"SCHEDULE_ID", "EMPLOYEE_ID"}))
@Data
@NoArgsConstructor
public class QmsMeetingUserAttendance extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "SCHEDULE_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"weekdayMappings", "departments", "participants", "chairedBy", "hostBy", "statusObj"})
    private QmsMeetingSchedule schedule;

    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"organization", "reference", "scheduling", "induction", "operations", "statutory", "ability", "selfAssessment", "ats"})
    private EmployeeMaster employee;

    @Column(name = "IN_TIME")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime inTime;

    @Column(name = "OUT_TIME")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime outTime;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj;

    @Transient
    private String status = "PRESENT"; // PRESENT, LATE, ABSENT

    @com.fasterxml.jackson.annotation.JsonProperty("status")
    public String getStatus() {
        if (statusObj != null) {
            return statusObj.getName();
        }
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public QmsMeetingSchedule getSchedule() { return schedule; }
    public void setSchedule(QmsMeetingSchedule schedule) { this.schedule = schedule; }
    public EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(EmployeeMaster employee) { this.employee = employee; }
    public LocalTime getInTime() { return inTime; }
    public void setInTime(LocalTime inTime) { this.inTime = inTime; }
    public LocalTime getOutTime() { return outTime; }
    public void setOutTime(LocalTime outTime) { this.outTime = outTime; }
    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getStatusObj() { return statusObj; }
    public void setStatusObj(com.autonoma.erp.modules.platform.common.entity.StatusMaster statusObj) { this.statusObj = statusObj; }
}

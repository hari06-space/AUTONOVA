package com.autonoma.erp.modules.hr.attendance.entity;

import com.autonoma.erp.util.SpringContext;

import com.autonoma.erp.modules.qms.checklist.service.ChecklistAutoAssignmentService;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "HR_DAILY_ATTENDANCE",
        uniqueConstraints = @UniqueConstraint(columnNames = {"EMP_ID", "ATTENDANCE_DATE"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrDailyAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ATTENDANCE_ID")
    private Long attendanceId;

    @Column(name = "EMP_ID", nullable = false)
    private Long empId;

    @Column(name = "ATTENDANCE_DATE", nullable = false)
    private LocalDate attendanceDate;

    // Allowed values: PRESENT, ABSENT, WFH, LEAVE, HOLIDAY, HALF_DAY
    @Column(name = "STATUS", nullable = false, length = 30)
    private String status;

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = new Date();
        if (this.status == null) this.status = "PRESENT";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = new Date();
    }

    public Long getAttendanceId() { return attendanceId; }
    public void setAttendanceId(Long attendanceId) { this.attendanceId = attendanceId; }
    public Long getEmpId() { return empId; }
    public void setEmpId(Long empId) { this.empId = empId; }
    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}

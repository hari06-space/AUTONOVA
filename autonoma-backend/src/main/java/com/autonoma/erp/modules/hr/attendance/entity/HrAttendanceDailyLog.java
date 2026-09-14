package com.autonoma.erp.modules.hr.attendance.entity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Date;

@Entity
@Table(name = "HR_ATTENDANCE_DAILY_LOG", uniqueConstraints = @UniqueConstraint(
    name = "UQ_HR_ATT_DAILY_LOG_EMP_DATE", columnNames = {"EMP_ID", "ATTENDANCE_DATE"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrAttendanceDailyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "EMP_ID", nullable = false)
    private Long empId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EMP_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    @Column(name = "SHIFT_ID")
    private Long shiftId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SHIFT_ID", insertable = false, updatable = false)
    private ShiftMaster shift;

    @Column(name = "ATTENDANCE_DATE", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "IN_TIME")
    private LocalTime inTime;

    @Column(name = "OUT_TIME")
    private LocalTime outTime;

    @Column(name = "EARLY_IN", nullable = false)
    private Integer earlyIn = 0;

    @Column(name = "EARLY_OUT", nullable = false)
    private Integer earlyOut = 0;

    @Column(name = "DURATION", nullable = false)
    private Integer duration = 0;

    @Column(name = "LOM", nullable = false)
    private Integer lom = 0;

    @Column(name = "OT", nullable = false)
    private Integer ot = 0;

    @Column(name = "ATT_TYPE", nullable = false, length = 30)
    private String attType = "Absent";

    @Column(name = "REMARKS", length = 30)
    private String remarks;

    @Column(name = "FROM_WHERE", nullable = false, length = 30)
    private String fromWhere = "MANUAL";

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    // === Audit Fields ===
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
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) { /* ignore */ }
        if (currentUserId != null) {
            this.createdBy = currentUserId;
        } else if (this.createdBy == null) {
            this.createdBy = "SYSTEM";
        }
        if (this.createdDate == null) {
            this.createdDate = new Date();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) { /* ignore */ }
        if (currentUserId != null) {
            this.updatedBy = currentUserId;
        } else if (this.updatedBy == null) {
            this.updatedBy = "SYSTEM";
        }
        this.updatedDate = new Date();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmpId() { return empId; }
    public void setEmpId(Long empId) { this.empId = empId; }
    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }
    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }
    public LocalTime getInTime() { return inTime; }
    public void setInTime(LocalTime inTime) { this.inTime = inTime; }
    public LocalTime getOutTime() { return outTime; }
    public void setOutTime(LocalTime outTime) { this.outTime = outTime; }
    public Integer getEarlyIn() { return earlyIn; }
    public void setEarlyIn(Integer earlyIn) { this.earlyIn = earlyIn; }
    public Integer getEarlyOut() { return earlyOut; }
    public void setEarlyOut(Integer earlyOut) { this.earlyOut = earlyOut; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public Integer getLom() { return lom; }
    public void setLom(Integer lom) { this.lom = lom; }
    public Integer getOt() { return ot; }
    public void setOt(Integer ot) { this.ot = ot; }
    public String getAttType() { return attType; }
    public void setAttType(String attType) { this.attType = attType; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getFromWhere() { return fromWhere; }
    public void setFromWhere(String fromWhere) { this.fromWhere = fromWhere; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
    public EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(EmployeeMaster employee) { this.employee = employee; }
    public ShiftMaster getShift() { return shift; }
    public void setShift(ShiftMaster shift) { this.shift = shift; }
}

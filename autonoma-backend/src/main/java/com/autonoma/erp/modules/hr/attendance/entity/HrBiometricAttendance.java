package com.autonoma.erp.modules.hr.attendance.entity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "HR_BIOMETRIC_ATTENDANCE", uniqueConstraints = @UniqueConstraint(columnNames = { "EMP_ID",
        "ATTENDANCE_DATE" }))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrBiometricAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EMP_ID", nullable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMP_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    @Column(name = "ATTENDANCE_DATE", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "PUNCH_IN")
    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "hh:mm a")
    private java.time.LocalTime punchIn;

    @Column(name = "PUNCH_OUT")
    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "hh:mm a")
    private java.time.LocalTime punchOut;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "PRESENT";

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    // === eSSL Integration Fields ===

    @Column(name = "SHIFT_ID")
    private Long shiftId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "SHIFT_ID", insertable = false, updatable = false)
    private ShiftMaster shift;

    @Column(name = "ESSL_IN_TIME", precision = 10, scale = 2)
    private BigDecimal esslInTime;

    @Column(name = "ESSL_OUT_TIME", precision = 10, scale = 2)
    private BigDecimal esslOutTime;

    @Column(name = "TOTAL_HOURS_WORKED", precision = 10, scale = 2)
    private BigDecimal totalHoursWorked;

    @Column(name = "OVERTIME_HOURS", precision = 5, scale = 2)
    private BigDecimal overtimeHours;

    @JsonProperty("isLate")
    @Column(name = "IS_LATE")
    private Integer isLate = 0;

    @JsonProperty("isEarlyExit")
    @Column(name = "IS_EARLY_EXIT")
    private Integer isEarlyExit = 0;

    @Transient
    @JsonProperty("wagesType")
    private String wagesType;

    public String getWagesType() {
        return wagesType;
    }

    public void setWagesType(String wagesType) {
        this.wagesType = wagesType;
    }

    @Column(name = "LATITUDE_IN", length = 50)
    private String latitudeIn;

    @Column(name = "LONGITUDE_IN", length = 50)
    private String longitudeIn;

    @Column(name = "LATITUDE_OUT", length = 50)
    private String latitudeOut;

    @Column(name = "LONGITUDE_OUT", length = 50)
    private String longitudeOut;

    @Column(name = "LOCATION_IN", length = 500)
    private String locationIn;

    @Column(name = "LOCATION_OUT", length = 500)
    private String locationOut;

    @Lob
    @Column(name = "DEVICE_IMAGE")
    private byte[] deviceImage;

    @JsonProperty("isActive")
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
        if (this.createdBy == null || this.createdBy.trim().isEmpty() || "Created By".equalsIgnoreCase(this.createdBy.trim())) {
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {}
            this.createdBy = (currentUserId != null && !currentUserId.trim().isEmpty()) ? currentUserId : "admin";
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
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        this.updatedDate = new Date();
    }

    public Boolean getIsActive() {
        return this.isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Integer getIsLate() {
        return this.isLate;
    }

    public void setIsLate(Integer isLate) {
        this.isLate = isLate;
    }

    public Integer getIsEarlyExit() {
        return this.isEarlyExit;
    }

    public void setIsEarlyExit(Integer isEarlyExit) {
        this.isEarlyExit = isEarlyExit;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }
    public java.time.LocalTime getPunchIn() { return punchIn; }
    public void setPunchIn(java.time.LocalTime punchIn) { this.punchIn = punchIn; }
    public java.time.LocalTime getPunchOut() { return punchOut; }
    public void setPunchOut(java.time.LocalTime punchOut) { this.punchOut = punchOut; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLatitudeIn() { return latitudeIn; }
    public void setLatitudeIn(String latitudeIn) { this.latitudeIn = latitudeIn; }
    public String getLongitudeIn() { return longitudeIn; }
    public void setLongitudeIn(String longitudeIn) { this.longitudeIn = longitudeIn; }
    public String getLatitudeOut() { return latitudeOut; }
    public void setLatitudeOut(String latitudeOut) { this.latitudeOut = latitudeOut; }
    public String getLongitudeOut() { return longitudeOut; }
    public void setLongitudeOut(String longitudeOut) { this.longitudeOut = longitudeOut; }
    public String getLocationIn() { return locationIn; }
    public void setLocationIn(String locationIn) { this.locationIn = locationIn; }
    public String getLocationOut() { return locationOut; }
    public void setLocationOut(String locationOut) { this.locationOut = locationOut; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }
    public BigDecimal getTotalHoursWorked() { return totalHoursWorked; }
    public void setTotalHoursWorked(BigDecimal totalHoursWorked) { this.totalHoursWorked = totalHoursWorked; }
    public BigDecimal getOvertimeHours() { return overtimeHours; }
    public void setOvertimeHours(BigDecimal overtimeHours) { this.overtimeHours = overtimeHours; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
    public BigDecimal getEsslInTime() { return esslInTime; }
    public void setEsslInTime(BigDecimal esslInTime) { this.esslInTime = esslInTime; }
    public BigDecimal getEsslOutTime() { return esslOutTime; }
    public void setEsslOutTime(BigDecimal esslOutTime) { this.esslOutTime = esslOutTime; }
    public byte[] getDeviceImage() { return deviceImage; }
    public void setDeviceImage(byte[] deviceImage) { this.deviceImage = deviceImage; }
    public ShiftMaster getShift() { return shift; }
    public void setShift(ShiftMaster shift) { this.shift = shift; }
    public EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(EmployeeMaster employee) { this.employee = employee; }
}

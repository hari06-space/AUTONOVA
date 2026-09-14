package com.autonoma.erp.modules.hr.attendance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_ATTENDANCE_AUDIT_LOG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrAttendanceAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @Column(name = "ATTENDANCE_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date attendanceDate;

    @Column(name = "ORIGINAL_VALUE", columnDefinition = "NVARCHAR(MAX)")
    private String originalValue;

    @Column(name = "UPDATED_VALUE", columnDefinition = "NVARCHAR(MAX)")
    private String updatedValue;

    @Column(name = "MODIFIED_BY", length = 100)
    private String modifiedBy;

    @Column(name = "MODIFICATION_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date modificationDate;

    @Column(name = "REASON_FOR_CHANGE", columnDefinition = "NVARCHAR(MAX)")
    private String reasonForChange;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Date getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(Date attendanceDate) { this.attendanceDate = attendanceDate; }
    public String getOriginalValue() { return originalValue; }
    public void setOriginalValue(String originalValue) { this.originalValue = originalValue; }
    public String getUpdatedValue() { return updatedValue; }
    public void setUpdatedValue(String updatedValue) { this.updatedValue = updatedValue; }
    public String getModifiedBy() { return modifiedBy; }
    public void setModifiedBy(String modifiedBy) { this.modifiedBy = modifiedBy; }
    public Date getModificationDate() { return modificationDate; }
    public void setModificationDate(Date modificationDate) { this.modificationDate = modificationDate; }
    public String getReasonForChange() { return reasonForChange; }
    public void setReasonForChange(String reasonForChange) { this.reasonForChange = reasonForChange; }
}

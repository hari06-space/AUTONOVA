package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "QMS_AUDIT_ATTENDANCE")
public class AuditAttendance extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "AUDIT_SCH_ID")
    private Long auditSchId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUDIT_SCH_ID", insertable = false, updatable = false)
    private com.autonoma.erp.modules.qms.audit.entity.AuditSchedule auditSchedule;

    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", insertable = false, updatable = false)
    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster employee;

    @Column(name = "IN_TIME", columnDefinition = "NVARCHAR(50)")
    private String inTime;

    @Column(name = "OUT_TIME", columnDefinition = "NVARCHAR(50)")
    private String outTime;

    @Column(name = "ATTENDANCE_STATUS", columnDefinition = "NVARCHAR(50)")
    private String attendanceStatus;

    @Column(name = "EXTERNAL_NAME", columnDefinition = "NVARCHAR(200)")
    private String externalName;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Transient
    private String auditScheduleNo;

    @Transient
    private String name;

    @Transient
    private String employeeCode;

    // Explicit Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAuditSchId() { return auditSchId; }
    public void setAuditSchId(Long auditSchId) { this.auditSchId = auditSchId; }

    public com.autonoma.erp.modules.qms.audit.entity.AuditSchedule getAuditSchedule() { return auditSchedule; }
    public void setAuditSchedule(com.autonoma.erp.modules.qms.audit.entity.AuditSchedule auditSchedule) { this.auditSchedule = auditSchedule; }

    public String getAuditScheduleNo() {
        if (auditSchedule != null) {
            return auditSchedule.getScheduleNo();
        }
        return auditScheduleNo;
    }

    public void setAuditScheduleNo(String auditScheduleNo) {
        this.auditScheduleNo = auditScheduleNo;
        if (auditScheduleNo == null || auditScheduleNo.trim().isEmpty()) {
            this.auditSchId = null;
            return;
        }
        com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository repo = 
            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository.class);
        if (repo != null) {
            repo.findByScheduleNo(auditScheduleNo.trim()).ifPresent(sch -> this.auditSchId = sch.getId());
        }
    }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster employee) { this.employee = employee; }

    public String getInTime() { return inTime; }
    public void setInTime(String inTime) { this.inTime = inTime; }

    public String getOutTime() { return outTime; }
    public void setOutTime(String outTime) { this.outTime = outTime; }

    public String getAttendanceStatus() { return attendanceStatus; }
    public void setAttendanceStatus(String attendanceStatus) { this.attendanceStatus = attendanceStatus; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    // Backward compatibility wrappers
    public String getEmployeeCode() {
        if (employee != null) {
            return employee.getEmpCode();
        }
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
        if (employeeCode == null || employeeCode.trim().isEmpty()) {
            this.employeeId = null;
            return;
        }
        com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository repo = 
            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository.class);
        if (repo != null) {
            repo.findByEmpCodeOrName(employeeCode.trim()).ifPresent(emp -> this.employeeId = emp.getId());
        }
    }

    public String getExternalName() { return externalName; }
    public void setExternalName(String externalName) { this.externalName = externalName; }

    public String getName() {
        if (employee != null) {
            String fullName = employee.getEmployeeName();
            if (fullName == null || fullName.trim().isEmpty()) {
                fullName = ((employee.getFirstName() != null ? employee.getFirstName() : "") + " " + (employee.getLastName() != null ? employee.getLastName() : "")).trim();
            }
            return fullName;
        }
        if (externalName != null && !externalName.trim().isEmpty()) {
            return externalName;
        }
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

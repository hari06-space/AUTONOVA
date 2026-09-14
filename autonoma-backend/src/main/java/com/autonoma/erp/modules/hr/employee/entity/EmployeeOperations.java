package com.autonoma.erp.modules.hr.employee.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_OPERATIONS")
public class EmployeeOperations {

    @Id
    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "EMPLOYEE_ID")
    private EmployeeMaster employee;

    @Column(name = "GRACE_MINUTES")
    private Integer graceMinutes;

    @Column(name = "PETROL_MODE", length = 50)
    private String petrolMode = "NA";

    @Column(name = "PETROL_ALLOWANCE", precision = 18, scale = 2)
    private BigDecimal petrolAllowance;

    @Column(name = "SHIFT", length = 50)
    private String shift = "Yes";

    @Column(name = "SHIFT_NAME", length = 50)
    private String shiftName = "GENERAL";

    @Column(name = "SHIFT_DURATION", length = 50)
    private String shiftDuration = "480";

    @Column(name = "SEGMENT", length = 100)
    private String segment;

    @Column(name = "SUB_SEGMENT", length = 100)
    private String subSegment;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    public EmployeeOperations() {
    }

    public EmployeeOperations(Long employeeId, EmployeeMaster employee, Integer graceMinutes, String petrolMode,
            BigDecimal petrolAllowance, String shift, String shiftName, String shiftDuration, String segment,
            String subSegment, String createdBy, Date createdDate, String updatedBy, Date updatedDate) {
        this.employeeId = employeeId;
        this.employee = employee;
        this.graceMinutes = graceMinutes;
        this.petrolMode = petrolMode;
        this.petrolAllowance = petrolAllowance;
        this.shift = shift;
        this.shiftName = shiftName;
        this.shiftDuration = shiftDuration;
        this.segment = segment;
        this.subSegment = subSegment;
        this.createdBy = createdBy;
        this.createdDate = createdDate;
        this.updatedBy = updatedBy;
        this.updatedDate = updatedDate;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public EmployeeMaster getEmployee() {
        return employee;
    }

    public void setEmployee(EmployeeMaster employee) {
        this.employee = employee;
    }

    public Integer getGraceMinutes() {
        return graceMinutes;
    }

    public void setGraceMinutes(Integer graceMinutes) {
        this.graceMinutes = graceMinutes;
    }

    public String getPetrolMode() {
        return petrolMode;
    }

    public void setPetrolMode(String petrolMode) {
        this.petrolMode = petrolMode;
    }

    public BigDecimal getPetrolAllowance() {
        return petrolAllowance;
    }

    public void setPetrolAllowance(BigDecimal petrolAllowance) {
        this.petrolAllowance = petrolAllowance;
    }

    public String getShift() {
        return shift;
    }

    public void setShift(String shift) {
        this.shift = shift;
    }

    public String getShiftName() {
        return shiftName;
    }

    public void setShiftName(String shiftName) {
        this.shiftName = shiftName;
    }

    public String getShiftDuration() {
        return shiftDuration;
    }

    public void setShiftDuration(String shiftDuration) {
        this.shiftDuration = shiftDuration;
    }

    public String getSegment() {
        return segment;
    }

    public void setSegment(String segment) {
        this.segment = segment;
    }

    public String getSubSegment() {
        return subSegment;
    }

    public void setSubSegment(String subSegment) {
        this.subSegment = subSegment;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Date getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(Date updatedDate) {
        this.updatedDate = updatedDate;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }
            if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
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
}


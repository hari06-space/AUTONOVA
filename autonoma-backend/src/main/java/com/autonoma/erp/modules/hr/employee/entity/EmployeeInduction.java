package com.autonoma.erp.modules.hr.employee.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_INDUCTION")
public class EmployeeInduction {

    @Id
    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "EMPLOYEE_ID")
    private EmployeeMaster employee;

    @Column(name = "INDUCTION_STATUS", length = 50)
    private String inductionStatus = "PENDING";

    @Column(name = "IS_INDUCTION_ELIGIBLE", length = 10)
    private String isInductionEligible = "NO";

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

    public EmployeeInduction() {
    }

    public EmployeeInduction(Long employeeId, EmployeeMaster employee, String inductionStatus,
            String isInductionEligible, String createdBy, Date createdDate, String updatedBy, Date updatedDate) {
        this.employeeId = employeeId;
        this.employee = employee;
        this.inductionStatus = inductionStatus;
        this.isInductionEligible = isInductionEligible;
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

    public String getInductionStatus() {
        return inductionStatus;
    }

    public void setInductionStatus(String inductionStatus) {
        this.inductionStatus = inductionStatus;
    }

    public String getIsInductionEligible() {
        return isInductionEligible;
    }

    public void setIsInductionEligible(String isInductionEligible) {
        this.isInductionEligible = isInductionEligible;
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


package com.autonoma.erp.modules.hr.employee.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_SCHEDULING")
public class EmployeeScheduling {

    @Id
    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "EMPLOYEE_ID")
    private EmployeeMaster employee;

    @Column(name = "DATE_OF_JOINING")
    @Temporal(TemporalType.DATE)
    private Date dateOfJoining;

    @Column(name = "PROBATION_PERIOD", length = 50)
    private String probationPeriod;

    @Column(name = "CONFIRMATION_DATE")
    @Temporal(TemporalType.DATE)
    private Date confirmationDate;

    @Column(name = "EXIT_DATE")
    @Temporal(TemporalType.DATE)
    private Date exitDate;

    @Column(name = "EXIT_REASON", length = 255)
    private String exitReason;

    @Column(name = "EXIT_COMMENTS", length = 1000)
    private String exitComments;

    @Column(name = "REJOINING_DATE")
    @Temporal(TemporalType.DATE)
    private Date rejoiningDate;

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

    public EmployeeScheduling() {
    }

    public EmployeeScheduling(Long employeeId, EmployeeMaster employee, Date dateOfJoining, String probationPeriod,
            Date confirmationDate, Date exitDate, String exitReason, String exitComments, Date rejoiningDate,
            String createdBy, Date createdDate, String updatedBy, Date updatedDate) {
        this.employeeId = employeeId;
        this.employee = employee;
        this.dateOfJoining = dateOfJoining;
        this.probationPeriod = probationPeriod;
        this.confirmationDate = confirmationDate;
        this.exitDate = exitDate;
        this.exitReason = exitReason;
        this.exitComments = exitComments;
        this.rejoiningDate = rejoiningDate;
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

    public Date getDateOfJoining() {
        return dateOfJoining;
    }

    public void setDateOfJoining(Date dateOfJoining) {
        this.dateOfJoining = dateOfJoining;
    }

    public String getProbationPeriod() {
        return probationPeriod;
    }

    public void setProbationPeriod(String probationPeriod) {
        this.probationPeriod = probationPeriod;
    }

    public Date getConfirmationDate() {
        return confirmationDate;
    }

    public void setConfirmationDate(Date confirmationDate) {
        this.confirmationDate = confirmationDate;
    }

    public Date getExitDate() {
        return exitDate;
    }

    public void setExitDate(Date exitDate) {
        this.exitDate = exitDate;
    }

    public String getExitReason() {
        return exitReason;
    }

    public void setExitReason(String exitReason) {
        this.exitReason = exitReason;
    }

    public String getExitComments() {
        return exitComments;
    }

    public void setExitComments(String exitComments) {
        this.exitComments = exitComments;
    }

    public Date getRejoiningDate() {
        return rejoiningDate;
    }

    public void setRejoiningDate(Date rejoiningDate) {
        this.rejoiningDate = rejoiningDate;
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


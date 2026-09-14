package com.autonoma.erp.modules.hr.leave.entity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.util.SecurityUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Table(name = "HR_LEAVE_ENCASHMENT_ENTRY")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LeaveEncashmentEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    @Column(name = "FROM_DATE")
    @Temporal(TemporalType.DATE)
    private Date fromDate;

    @Column(name = "TO_DATE")
    @Temporal(TemporalType.DATE)
    private Date toDate;

    @Column(name = "EL")
    private Double el = 0.0;

    @Column(name = "CL")
    private Double cl = 0.0;

    @Column(name = "PREV_YRS_EL")
    private Double prevYrsEl = 0.0;

    @Column(name = "PREV_YRS_CL")
    private Double prevYrsCl = 0.0;

    @Column(name = "TOTAL_EL")
    private Double totalEl = 0.0;

    @Column(name = "TOTAL_CL")
    private Double totalCl = 0.0;

    @Column(name = "ENCASH_EL")
    private Double encashEl = 0.0;

    @Column(name = "ENCASH_CL")
    private Double encashCl = 0.0;

    @Column(name = "TOTAL_LEAVE_ENCASH")
    private Double totalLeaveEncash = 0.0;

    @Column(name = "TOTAL_AMT")
    private Double totalAmt = 0.0;

    @Column(name = "STATUS", length = 50)
    private String status = "Pending";

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

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

    @PrePersist
    protected void onCreate() {
        this.createdDate = new Date();
        this.createdBy = SecurityUtils.getCurrentUserId() != null ? SecurityUtils.getCurrentUserId() : "System";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = new Date();
        this.updatedBy = SecurityUtils.getCurrentUserId() != null ? SecurityUtils.getCurrentUserId() : "System";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Double getEl() { return el; }
    public void setEl(Double el) { this.el = el; }
    public Double getCl() { return cl; }
    public void setCl(Double cl) { this.cl = cl; }
    public Double getPrevYrsEl() { return prevYrsEl; }
    public void setPrevYrsEl(Double prevYrsEl) { this.prevYrsEl = prevYrsEl; }
    public Double getPrevYrsCl() { return prevYrsCl; }
    public void setPrevYrsCl(Double prevYrsCl) { this.prevYrsCl = prevYrsCl; }
    public Double getTotalCl() { return totalCl; }
    public void setTotalCl(Double totalCl) { this.totalCl = totalCl; }
    public Double getEncashEl() { return encashEl; }
    public void setEncashEl(Double encashEl) { this.encashEl = encashEl; }
    public Double getTotalEl() { return totalEl; }
    public void setTotalEl(Double totalEl) { this.totalEl = totalEl; }
    public Double getEncashCl() { return encashCl; }
    public void setEncashCl(Double encashCl) { this.encashCl = encashCl; }
    public Double getTotalLeaveEncash() { return totalLeaveEncash; }
    public void setTotalLeaveEncash(Double totalLeaveEncash) { this.totalLeaveEncash = totalLeaveEncash; }
    public Double getTotalAmt() { return totalAmt; }
    public void setTotalAmt(Double totalAmt) { this.totalAmt = totalAmt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

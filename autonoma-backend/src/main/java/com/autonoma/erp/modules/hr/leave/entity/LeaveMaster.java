package com.autonoma.erp.modules.hr.leave.entity;

import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "HR_LEAVE_MASTER")
public class LeaveMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false, unique = true)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    @Column(name = "REF_NO", length = 50)
    private String refNo;

    // Current year/month leave balances
    @Column(name = "EL", nullable = false)
    private BigDecimal el = BigDecimal.ZERO;

    @Column(name = "CL", nullable = false)
    private BigDecimal cl = BigDecimal.ZERO;

    @Column(name = "SL", nullable = false)
    private BigDecimal sl = BigDecimal.ZERO;

    @Column(name = "AL", nullable = false)
    private BigDecimal al = BigDecimal.ZERO;

    @Column(name = "PL", nullable = false)
    private BigDecimal pl = BigDecimal.ZERO;

    // System / Audit
    @Column(name = "STATUS")
    private Boolean status = true;

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

    public LeaveMaster() {
    }

    public LeaveMaster(Long id, Long employeeId, EmployeeMaster employee, String refNo, BigDecimal el, BigDecimal cl,
            BigDecimal sl, BigDecimal al, BigDecimal pl, Boolean status,
            String createdBy, Date createdDate, String updatedBy, Date updatedDate) {
        this.id = id;
        this.employeeId = employeeId;
        this.employee = employee;
        this.refNo = refNo;
        this.el = el;
        this.cl = cl;
        this.sl = sl;
        this.al = al;
        this.pl = pl;
        this.status = status;
        this.createdBy = createdBy;
        this.createdDate = createdDate;
        this.updatedBy = updatedBy;
        this.updatedDate = updatedDate;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getRefNo() {
        return refNo;
    }

    public void setRefNo(String refNo) {
        this.refNo = refNo;
    }

    public BigDecimal getEl() {
        return el;
    }

    public void setEl(BigDecimal el) {
        this.el = el;
    }

    public BigDecimal getCl() {
        return cl;
    }

    public void setCl(BigDecimal cl) {
        this.cl = cl;
    }

    public BigDecimal getSl() {
        return sl;
    }

    public void setSl(BigDecimal sl) {
        this.sl = sl;
    }

    public BigDecimal getAl() {
        return al;
    }

    public void setAl(BigDecimal al) {
        this.al = al;
    }

    public BigDecimal getPl() {
        return pl;
    }

    public void setPl(BigDecimal pl) {
        this.pl = pl;
    }





    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Object status) {
        if (status instanceof Boolean) {
            this.status = (Boolean) status;
        } else if (status instanceof String) {
            this.status = "Active".equalsIgnoreCase((String) status) || "1".equals(status) || "true".equalsIgnoreCase((String) status);
        } else if (status instanceof Number) {
            this.status = ((Number) status).intValue() == 1;
        }
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
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.createdBy = currentUserId;
        this.updatedBy = null;
        this.createdDate = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = currentUserId;
        }
        this.updatedDate = new Date();
    }

    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public Date getCreatedAt() {
        return this.createdDate;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("createdUser")
    public String getCreatedUser() {
        return this.createdBy;
    }
}

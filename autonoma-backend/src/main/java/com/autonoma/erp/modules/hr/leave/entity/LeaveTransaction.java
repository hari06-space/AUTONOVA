package com.autonoma.erp.modules.hr.leave.entity;

import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "HR_LEAVE_TRANSACTION")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LeaveTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    @Column(name = "TRANSACTION_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date transactionDate;

    @Column(name = "TRANSACTION_TYPE", nullable = false, length = 50)
    private String transactionType; // 'CREDIT' or 'DEBIT'

    @Column(name = "LEAVE_TYPE", nullable = false, length = 50)
    private String leaveType; // 'EL', 'CL', 'SL', 'AL', 'PL', 'SO', 'WFH', 'C_OFF'

    @Column(name = "CR_QTY", nullable = false)
    private BigDecimal crQty = BigDecimal.ZERO;

    @Column(name = "DR_QTY", nullable = false)
    private BigDecimal drQty = BigDecimal.ZERO;

    @Column(name = "AVL_QTY", nullable = false)
    private BigDecimal avlQty = BigDecimal.ZERO;

    @Column(name = "REMARKS", length = 500)
    private String remarks;

    // System / Audit
    @Column(name = "STATUS", length = 50)
    private String status = "Active";

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
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.createdBy = currentUserId;
        this.updatedBy = null;
        this.createdDate = new Date();
        if (this.transactionDate == null) {
            this.transactionDate = new Date();
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Date getTransactionDate() { return transactionDate; }
    public void setTransactionDate(Date transactionDate) { this.transactionDate = transactionDate; }
    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }
    public String getLeaveType() { return leaveType; }
    public void setLeaveType(String leaveType) { this.leaveType = leaveType; }
    public BigDecimal getCrQty() { return crQty; }
    public void setCrQty(BigDecimal crQty) { this.crQty = crQty; }
    public BigDecimal getDrQty() { return drQty; }
    public void setDrQty(BigDecimal drQty) { this.drQty = drQty; }
    public BigDecimal getAvlQty() { return avlQty; }
    public void setAvlQty(BigDecimal avlQty) { this.avlQty = avlQty; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

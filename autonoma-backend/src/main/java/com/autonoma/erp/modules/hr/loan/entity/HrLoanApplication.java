package com.autonoma.erp.modules.hr.loan.entity;

import com.autonoma.erp.util.SecurityUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_LOAN_APPLICATION")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrLoanApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long id;

    @org.hibernate.annotations.Nationalized
    @Column(name = "EMP_CODE", nullable = false, length = 50)
    private String empCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EMP_CODE", referencedColumnName = "EMP_CODE", insertable = false, updatable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster employee;

    @Transient
    private String employeeName;

    public String getEmployeeName() {
        if (this.employeeName != null && !this.employeeName.trim().isEmpty()) {
            return this.employeeName;
        }
        return (this.employee != null) ? this.employee.getEmployeeName() : null;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    @Column(name = "LOAN_CODE", nullable = false, length = 50)
    private String loanCode;

    @Column(name = "LOAN_AMT", nullable = false)
    private Double loanAmt;

    @Column(name = "REPAY_LOAN_AMT", nullable = false)
    private Double repayLoanAmt;

    @Column(name = "ISSUE_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date issueDate;

    @Column(name = "REQUEST_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date requestDate;

    @Column(name = "NO_OF_MONTHS", nullable = false)
    private Integer noOfMonths;

    @Column(name = "INSTALLMENT_AMT", nullable = false)
    private Double installmentAmt;

    @Column(name = "START_YEAR", nullable = false)
    private Integer startYear;

    @Column(name = "START_MONTH", nullable = false, length = 20)
    private String startMonth;

    @Column(name = "END_YEAR", nullable = false)
    private Integer endYear;

    @Column(name = "END_MONTH", nullable = false, length = 20)
    private String endMonth;

    @Column(name = "STATUS", nullable = false, length = 50)
    private String status = "PENDING";

    @Column(name = "REASON", length = 500)
    private String reason;

    @Column(name = "REJECT_REASON", length = 500)
    private String rejectReason;

    @Column(name = "REQUESTED_DETAILS", nullable = false, length = 500)
    private String requestedDetails;

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

    @Column(name = "CURRENCY_CODE", length = 10)
    private String currencyCode = "INR";

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

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

    @PostLoad
    protected void onPostLoad() {
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = "Admin";
        }
    }

    // Backward-compatible JSON properties
    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public Date getCreatedAt() {
        return createdDate;
    }

    public void setCreatedAt(Date d) {
        this.createdDate = d;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedAt")
    public Date getUpdatedAt() {
        return updatedDate;
    }

    public void setUpdatedAt(Date d) {
        this.updatedDate = d;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("createdUser")
    public String getCreatedUser() {
        return this.createdBy;
    }

    public void setCreatedUser(String createdUser) {
        this.createdBy = createdUser;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedUser")
    public String getUpdatedUser() {
        return this.updatedBy;
    }

    public void setUpdatedUser(String updatedUser) {
        this.updatedBy = updatedUser;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmpCode() { return empCode; }
    public void setEmpCode(String empCode) { this.empCode = empCode; }
    public String getLoanCode() { return loanCode; }
    public void setLoanCode(String loanCode) { this.loanCode = loanCode; }
    public Double getLoanAmt() { return loanAmt; }
    public void setLoanAmt(Double loanAmt) { this.loanAmt = loanAmt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getRepayLoanAmt() { return repayLoanAmt; }
    public void setRepayLoanAmt(Double repayLoanAmt) { this.repayLoanAmt = repayLoanAmt; }
    public Date getIssueDate() { return issueDate; }
    public void setIssueDate(Date issueDate) { this.issueDate = issueDate; }
    public Date getRequestDate() { return requestDate; }
    public void setRequestDate(Date requestDate) { this.requestDate = requestDate; }
    public Integer getNoOfMonths() { return noOfMonths; }
    public void setNoOfMonths(Integer noOfMonths) { this.noOfMonths = noOfMonths; }
    public Double getInstallmentAmt() { return installmentAmt; }
    public void setInstallmentAmt(Double installmentAmt) { this.installmentAmt = installmentAmt; }
    public Integer getStartYear() { return startYear; }
    public void setStartYear(Integer startYear) { this.startYear = startYear; }
    public String getStartMonth() { return startMonth; }
    public void setStartMonth(String startMonth) { this.startMonth = startMonth; }
    public Integer getEndYear() { return endYear; }
    public void setEndYear(Integer endYear) { this.endYear = endYear; }
    public String getEndMonth() { return endMonth; }
    public void setEndMonth(String endMonth) { this.endMonth = endMonth; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }
    public String getRequestedDetails() { return requestedDetails; }
    public void setRequestedDetails(String requestedDetails) { this.requestedDetails = requestedDetails; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

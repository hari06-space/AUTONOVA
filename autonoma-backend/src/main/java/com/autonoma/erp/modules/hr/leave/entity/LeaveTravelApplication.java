package com.autonoma.erp.modules.hr.leave.entity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "HR_LEAVE_TRAVEL_DETAILS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LeaveTravelApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    @Column(name = "DESCRIPTION", nullable = false, length = 500)
    private String description;

    @Column(name = "FROM_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date fromDate;

    @Column(name = "TO_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date toDate;

    @Column(name = "TOTAL_DAYS", nullable = false)
    private BigDecimal totalDays;

    @Column(name = "AMOUNT", nullable = false)
    private BigDecimal amount;

    @Column(name = "NO_OF_BILLS")
    private Integer noOfBills = 1;

    @Column(name = "VERIFIED_BY", length = 50)
    private String verifiedBy;

    @Column(name = "VERIFIED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date verifiedDate;

    @Column(name = "REJECT_REASON", length = 500)
    private String rejectReason;

    @Column(name = "FROM_WHERE", length = 25)
    private String whereFrom = "Employee Self Care";

    @Transient
    private String filePaths;

    @org.hibernate.annotations.Formula("1")
    private Boolean isActive = true;

    // Status ID referencing AD_STATUS_MASTER (Integer Status ID)
    @Column(name = "STATUS_ID")
    private Long statusId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STATUS_ID", insertable = false, updatable = false)
    private StatusMaster statusMaster;

    // Audit columns (matching HR_LEAVE_DETAILS)
    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    /**
     * Returns the human-readable status name from Status Master.
     * Falls back to computed value from verifiedBy/rejectReason for backward compatibility.
     */
    @com.fasterxml.jackson.annotation.JsonProperty("status")
    public String getStatus() {
        if (statusMaster != null && statusMaster.getName() != null) {
            return statusMaster.getName();
        }
        if (rejectReason != null && !rejectReason.trim().isEmpty()) {
            return "Rejected";
        }
        if (verifiedBy != null) {
            return "Verified";
        }
        return "Pending to Verify";
    }

    public void setStatus(String status) {
        // No-op for JSON deserialization compatibility
    }

    public Boolean getIsActive() {
        return this.isActive;
    }

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.createdBy = currentUserId;
        this.createdDate = new Date();
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = currentUserId;
        }
    }

    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public Date getCreatedAt() {
        return this.createdDate;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("createdUser")
    public String getCreatedUser() {
        return this.createdBy;
    }

    @PostLoad
    protected void onLoad() {
        try {
            if (this.id != null) {
                com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository attachmentRepo = 
                    com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository.class);
                if (attachmentRepo != null) {
                    List<com.autonoma.erp.modules.induction.entity.HrAttachmentPath> paths = 
                        attachmentRepo.findAllByPageCodeAndRefIdAndDocType("ESC1020", this.id, "LTA_ATTACHMENT");
                    if (paths != null && !paths.isEmpty()) {
                        java.util.List<String> pathStrings = new java.util.ArrayList<>();
                        for (com.autonoma.erp.modules.induction.entity.HrAttachmentPath p : paths) {
                            pathStrings.add(p.getPath());
                        }
                        this.filePaths = String.join(",", pathStrings);
                    } else {
                        this.filePaths = null;
                    }
                }
            }
        } catch (Exception e) {
            // SpringContext or DB not ready
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Date getFromDate() { return fromDate; }
    public void setFromDate(Date fromDate) { this.fromDate = fromDate; }
    public Date getToDate() { return toDate; }
    public void setToDate(Date toDate) { this.toDate = toDate; }
    public BigDecimal getTotalDays() { return totalDays; }
    public void setTotalDays(BigDecimal totalDays) { this.totalDays = totalDays; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Integer getNoOfBills() { return noOfBills; }
    public void setNoOfBills(Integer noOfBills) { this.noOfBills = noOfBills; }
    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }
    public String getWhereFrom() { return whereFrom; }
    public void setWhereFrom(String whereFrom) { this.whereFrom = whereFrom; }
    public String getFilePaths() { return filePaths; }
    public void setFilePaths(String filePaths) { this.filePaths = filePaths; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public Date getVerifiedDate() { return verifiedDate; }
    public void setVerifiedDate(Date verifiedDate) { this.verifiedDate = verifiedDate; }
    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }
}

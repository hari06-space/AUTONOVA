package com.autonoma.erp.modules.hra.leaveencashment.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * HRA Leave Encashment Verified Entity
 * Maps to: HRA_LEAVE_ENCASHMENT_VERIFIED
 * Module : HRA > Payroll > Leave Encashment Verified (Page: HA1295)
 */
@Entity
@Table(name = "HRA_LEAVE_ENCASHMENT_VERIFIED")
@Data
@lombok.Getter
@lombok.Setter
@NoArgsConstructor
public class HraLeaveEncashmentVerified extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Reference & Year ─────────────────────────────────────────


    @Column(name = "ENCASHMENT_YEAR", nullable = false)
    private Integer encashmentYear;

    // ── Employee link ─────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID")
    @JsonIgnoreProperties({"departments", "designations"})
    private EmployeeMaster employee;

    /** Denormalised employee code snapshot (for fast reporting) */
    @Column(name = "EMP_ID", length = 50)
    private String empId;

    /** Denormalised employee name snapshot */
    @Column(name = "EMP_NAME", length = 200)
    private String empName;

    // ── Current year leave balances ───────────────────────────────
    @Column(name = "CURRENT_EL", precision = 10, scale = 2, nullable = false)
    private BigDecimal currentEl = BigDecimal.ZERO;

    @Column(name = "CURRENT_CL", precision = 10, scale = 2, nullable = false)
    private BigDecimal currentCl = BigDecimal.ZERO;

    // ── Additional leave categories ──────────────────────────────
    @Column(name = "SL", precision = 10, scale = 2)
    private BigDecimal sl = BigDecimal.ZERO;

    @Column(name = "AL", precision = 10, scale = 2)
    private BigDecimal al = BigDecimal.ZERO;

    @Column(name = "PL", precision = 10, scale = 2)
    private BigDecimal pl = BigDecimal.ZERO;

    // ── Previous years carry-forward ──────────────────────────────
    @Column(name = "PREV_YRS_EL", precision = 10, scale = 2, nullable = false)
    private BigDecimal prevYrsEl = BigDecimal.ZERO;

    @Column(name = "PREV_YRS_CL", precision = 10, scale = 2, nullable = false)
    private BigDecimal prevYrsCl = BigDecimal.ZERO;

    // ── Computed totals (read from DB; not set by JPA) ───────────
    /** TOT_EL = CURRENT_EL + PREV_YRS_EL (persisted computed column) */
    @Transient
    private BigDecimal totEl;

    /** TOT_CL = CURRENT_CL + PREV_YRS_CL (persisted computed column) */
    @Transient
    private BigDecimal totCl;

    // ── Encashment days ───────────────────────────────────────────
    @Column(name = "EL_ENCASHMENT", precision = 10, scale = 2, nullable = false)
    private BigDecimal elEncashment = BigDecimal.ZERO;

    @Column(name = "CL_ENCASHMENT", precision = 10, scale = 2, nullable = false)
    private BigDecimal clEncashment = BigDecimal.ZERO;

    /** TOT_ENCASHMENT = EL_ENCASHMENT + CL_ENCASHMENT (persisted computed column) */
    @Transient
    private BigDecimal totEncashment;

    // ── Financial details ─────────────────────────────────────────
    @Column(name = "BASIC_SALARY", precision = 18, scale = 2, nullable = false)
    private BigDecimal basicSalary = BigDecimal.ZERO;

    @Column(name = "PER_DAY_SALARY", precision = 18, scale = 2, nullable = false)
    private BigDecimal perDaySalary = BigDecimal.ZERO;

    @Column(name = "ENCASHMENT_AMOUNT", precision = 18, scale = 2, nullable = false)
    private BigDecimal encashmentAmount = BigDecimal.ZERO;

    // ── Workflow ──────────────────────────────────────────────────
    @Column(name = "STATUS", length = 50, nullable = false)
    private String status = "PENDING";

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @Column(name = "VERIFIED_BY", length = 100)
    private String verifiedBy;

    @Column(name = "VERIFIED_DATE")
    private LocalDateTime verifiedDate;

    @Column(name = "REJECTED_BY", length = 100)
    private String rejectedBy;

    @Column(name = "REJECTED_DATE")
    private LocalDateTime rejectedDate;

    @Column(name = "REJECTION_COMMENT", columnDefinition = "NVARCHAR(MAX)")
    private String rejectionComment;

    @Column(name = "REV_NO")
    private Integer revNo = 0;

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getEncashmentYear() { return encashmentYear; }
    public void setEncashmentYear(Integer encashmentYear) { this.encashmentYear = encashmentYear; }

    public EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(EmployeeMaster employee) { this.employee = employee; }

    public String getEmpId() { return empId; }
    public void setEmpId(String empId) { this.empId = empId; }

    public String getEmpName() { return empName; }
    public void setEmpName(String empName) { this.empName = empName; }

    public BigDecimal getCurrentEl() { return currentEl; }
    public void setCurrentEl(BigDecimal currentEl) { this.currentEl = currentEl; }

    public BigDecimal getCurrentCl() { return currentCl; }
    public void setCurrentCl(BigDecimal currentCl) { this.currentCl = currentCl; }

    public BigDecimal getSl() { return sl; }
    public void setSl(BigDecimal sl) { this.sl = sl; }

    public BigDecimal getAl() { return al; }
    public void setAl(BigDecimal al) { this.al = al; }

    public BigDecimal getPl() { return pl; }
    public void setPl(BigDecimal pl) { this.pl = pl; }

    public BigDecimal getPrevYrsEl() { return prevYrsEl; }
    public void setPrevYrsEl(BigDecimal prevYrsEl) { this.prevYrsEl = prevYrsEl; }

    public BigDecimal getPrevYrsCl() { return prevYrsCl; }
    public void setPrevYrsCl(BigDecimal prevYrsCl) { this.prevYrsCl = prevYrsCl; }

    public BigDecimal getElEncashment() { return elEncashment; }
    public void setElEncashment(BigDecimal elEncashment) { this.elEncashment = elEncashment; }

    public BigDecimal getClEncashment() { return clEncashment; }
    public void setClEncashment(BigDecimal clEncashment) { this.clEncashment = clEncashment; }

    public BigDecimal getBasicSalary() { return basicSalary; }
    public void setBasicSalary(BigDecimal basicSalary) { this.basicSalary = basicSalary; }

    public BigDecimal getPerDaySalary() { return perDaySalary; }
    public void setPerDaySalary(BigDecimal perDaySalary) { this.perDaySalary = perDaySalary; }

    public BigDecimal getEncashmentAmount() { return encashmentAmount; }
    public void setEncashmentAmount(BigDecimal encashmentAmount) { this.encashmentAmount = encashmentAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public LocalDateTime getVerifiedDate() { return verifiedDate; }
    public void setVerifiedDate(LocalDateTime verifiedDate) { this.verifiedDate = verifiedDate; }

    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }

    public LocalDateTime getRejectedDate() { return rejectedDate; }
    public void setRejectedDate(LocalDateTime rejectedDate) { this.rejectedDate = rejectedDate; }

    public String getRejectionComment() { return rejectionComment; }
    public void setRejectionComment(String rejectionComment) { this.rejectionComment = rejectionComment; }

    public Integer getRevNo() { return revNo; }
    public void setRevNo(Integer revNo) { this.revNo = revNo; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public BigDecimal getTotEl() {
        return (currentEl != null ? currentEl : BigDecimal.ZERO).add(prevYrsEl != null ? prevYrsEl : BigDecimal.ZERO);
    }

    public void setTotEl(BigDecimal totEl) { this.totEl = totEl; }

    public BigDecimal getTotCl() {
        return (currentCl != null ? currentCl : BigDecimal.ZERO).add(prevYrsCl != null ? prevYrsCl : BigDecimal.ZERO);
    }

    public void setTotCl(BigDecimal totCl) { this.totCl = totCl; }

    public BigDecimal getTotEncashment() {
        return (elEncashment != null ? elEncashment : BigDecimal.ZERO).add(clEncashment != null ? clEncashment : BigDecimal.ZERO);
    }

    public void setTotEncashment(BigDecimal totEncashment) { this.totEncashment = totEncashment; }
}

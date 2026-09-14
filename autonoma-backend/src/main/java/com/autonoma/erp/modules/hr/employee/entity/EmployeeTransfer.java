package com.autonoma.erp.modules.hr.employee.entity;

import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.entity.Designation;
import com.autonoma.erp.modules.master.organization.entity.Division;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_TRANSFER")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    // --- Employee Type ---
    @Column(name = "OLD_EMPLOYEE_TYPE_ID")
    private Long oldEmployeeTypeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "OLD_EMPLOYEE_TYPE_ID", insertable = false, updatable = false)
    private EmployeeTypeMaster oldEmployeeType;

    @Column(name = "TRANSFER_EMPLOYEE_TYPE_ID")
    private Long transferEmployeeTypeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "TRANSFER_EMPLOYEE_TYPE_ID", insertable = false, updatable = false)
    private EmployeeTypeMaster transferEmployeeType;

    // --- Department ---
    @Column(name = "OLD_DEPARTMENT_ID")
    private Long oldDepartmentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "OLD_DEPARTMENT_ID", insertable = false, updatable = false)
    private Department oldDepartment;

    @Column(name = "TRANSFER_DEPARTMENT_ID")
    private Long transferDepartmentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "TRANSFER_DEPARTMENT_ID", insertable = false, updatable = false)
    private Department transferDepartment;

    // --- Designation ---
    @Column(name = "OLD_DESIGNATION_ID")
    private Long oldDesignationId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "OLD_DESIGNATION_ID", insertable = false, updatable = false)
    private Designation oldDesignation;

    @Column(name = "TRANSFER_DESIGNATION_ID")
    private Long transferDesignationId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "TRANSFER_DESIGNATION_ID", insertable = false, updatable = false)
    private Designation transferDesignation;

    // --- Division / Unit ---
    @Column(name = "OLD_UNIT_ID")
    private Long oldUnitId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "OLD_UNIT_ID", insertable = false, updatable = false)
    private Division oldUnit;

    @Column(name = "TRANSFER_UNIT_ID")
    private Long transferUnitId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "TRANSFER_UNIT_ID", insertable = false, updatable = false)
    private Division transferUnit;

    // --- Codes ---
    @Column(name = "OLD_EMP_CODE", length = 50)
    private String oldEmpCode;

    @Column(name = "TRANS_OLD_EMP_CODE", length = 50)
    private String transOldEmpCode;

    // --- Dates ---
    @Column(name = "EXPECT_REV_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date expectRevDate;

    @Column(name = "FROM_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date fromDate;

    @Column(name = "TO_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date toDate;

    @Column(name = "REMARKS", length = 500)
    private String remarks;

    // --- System / Audit ---
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
        if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
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
            if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
        }
        this.updatedDate = new Date();
    }

    // Backward-compatible alias methods for frontend consistency
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
    public Date getExpectRevDate() { return expectRevDate; }
    public void setExpectRevDate(Date expectRevDate) { this.expectRevDate = expectRevDate; }
    public Date getFromDate() { return fromDate; }
    public void setFromDate(Date fromDate) { this.fromDate = fromDate; }
    public Date getToDate() { return toDate; }
    public void setToDate(Date toDate) { this.toDate = toDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getOldEmployeeTypeId() { return oldEmployeeTypeId; }
    public void setOldEmployeeTypeId(Long oldEmployeeTypeId) { this.oldEmployeeTypeId = oldEmployeeTypeId; }
    public Long getTransferEmployeeTypeId() { return transferEmployeeTypeId; }
    public void setTransferEmployeeTypeId(Long transferEmployeeTypeId) { this.transferEmployeeTypeId = transferEmployeeTypeId; }
    public Long getOldDepartmentId() { return oldDepartmentId; }
    public void setOldDepartmentId(Long oldDepartmentId) { this.oldDepartmentId = oldDepartmentId; }
    public Long getTransferDepartmentId() { return transferDepartmentId; }
    public void setTransferDepartmentId(Long transferDepartmentId) { this.transferDepartmentId = transferDepartmentId; }
    public Long getOldDesignationId() { return oldDesignationId; }
    public void setOldDesignationId(Long oldDesignationId) { this.oldDesignationId = oldDesignationId; }
    public Long getTransferDesignationId() { return transferDesignationId; }
    public void setTransferDesignationId(Long transferDesignationId) { this.transferDesignationId = transferDesignationId; }
    public Long getOldUnitId() { return oldUnitId; }
    public void setOldUnitId(Long oldUnitId) { this.oldUnitId = oldUnitId; }
    public Long getTransferUnitId() { return transferUnitId; }
    public void setTransferUnitId(Long transferUnitId) { this.transferUnitId = transferUnitId; }
    public String getOldEmpCode() { return oldEmpCode; }
    public void setOldEmpCode(String oldEmpCode) { this.oldEmpCode = oldEmpCode; }
    public String getTransOldEmpCode() { return transOldEmpCode; }
    public void setTransOldEmpCode(String transOldEmpCode) { this.transOldEmpCode = transOldEmpCode; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}


/*
 * Organization: Nutech Wind Parts Pvt Ltd
 * Owner: Yuvanesh M
 * Created At: 2026-08-30
 * Updated By: Yuvanesh M
 * Updated At: 2026-09-01
 * Description: Normalized persistence entity for HRA_OFFER_LETTERS. Maps noticePeriod,
 *              optimistic locking, status FK to AD_STATUS_MASTER, and provides dual
 *              accessors for offerNo/refNo and employeeId/applicantId.
 */
package com.autonoma.erp.modules.hra.letters.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.entity.Designation;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "HRA_OFFER_LETTERS")
@Data
@NoArgsConstructor
public class HraLetter extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "LETTER_TYPE", nullable = false, length = 50)
    private String letterType = "OFFER_LETTER";

    @Column(name = "REF_NO", nullable = false, length = 100)
    private String refNo;

    @Column(name = "LETTER_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date letterDate;

    // --- Candidate Relational Identity & Contact ---
    @Column(name = "APPLICANT_ID")
    private Long applicantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "APPLICANT_ID", insertable = false, updatable = false)
    private EmployeeMaster applicant;

    @Column(name = "EMPLOYEE_CODE", length = 100)
    private String employeeCode;

    @Column(name = "EMPLOYEE_NAME", length = 200)
    private String employeeName;

    @Column(name = "EMAIL", length = 150)
    private String email;

    @Column(name = "PHONE", length = 50)
    private String phone;

    // --- Job Offer Parameters & Snapshots ---
    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID", insertable = false, updatable = false)
    private Department departmentObj;

    @Column(name = "DEPARTMENT", length = 100)
    private String department;

    @Column(name = "DESIGNATION_ID")
    private Long designationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DESIGNATION_ID", insertable = false, updatable = false)
    private Designation designationObj;

    @Column(name = "DESIGNATION", length = 100)
    private String designation;

    @Column(name = "EMPLOYMENT_TYPE", length = 50)
    private String employmentType;

    @Column(name = "WORK_LOCATION", length = 100)
    private String workLocation;

    @Column(name = "GRADE", length = 50)
    private String grade;

    @Column(name = "JOINING_DATE")
    @Temporal(TemporalType.DATE)
    private Date joiningDate;

    @Column(name = "PROBATION_PERIOD_MONTHS")
    private Integer probationPeriodMonths;

    @Column(name = "NOTICE_PERIOD", length = 50)
    private String noticePeriod;

    // --- Financial Totals (Typed for SQL OLAP) ---
    @Column(name = "GROSS_SALARY", precision = 18, scale = 2)
    private BigDecimal grossSalary;

    @Column(name = "ANNUAL_CTC", precision = 18, scale = 2)
    private BigDecimal annualCtc;

    @Column(name = "NET_SALARY", precision = 18, scale = 2)
    private BigDecimal netSalary;

    @Column(name = "MONTHLY_CTC", precision = 18, scale = 2)
    private BigDecimal monthlyCtc;

    // --- Compact Component Snapshot & Overrides ---
    @Column(name = "FORM_DATA", columnDefinition = "NVARCHAR(MAX)")
    private String formData;

    // --- Authoritative Workflow Status (AD_STATUS_MASTER.ID) ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS", nullable = false)
    private StatusMaster status;

    // --- Optimistic Locking ---
    @Version
    @Column(name = "LOCK_VERSION", nullable = false)
    private Long lockVersion = 0L;

    public Long getStatusId() {
        return status != null ? status.getId() : null;
    }

    public String getOfferNo() {
        return this.refNo;
    }

    public void setOfferNo(String offerNo) {
        this.refNo = offerNo;
    }

    public Long getEmployeeId() {
        return this.applicantId;
    }

    public void setEmployeeId(Long employeeId) {
        this.applicantId = employeeId;
    }

    public EmployeeMaster getEmployee() {
        return this.applicant;
    }

    public void setEmployee(EmployeeMaster employee) {
        this.applicant = employee;
    }
}

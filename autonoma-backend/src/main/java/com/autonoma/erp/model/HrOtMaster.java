package com.autonoma.erp.model;

import jakarta.persistence.*;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.model.admin.UserCredential;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_OT_MASTER")
@Access(AccessType.FIELD)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HrOtMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "COMPANY_ID", nullable = false)
    private Long companyId;

    @Column(name = "DIVISION_ID")
    private Long divisionId;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EMPLOYEE_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    @Column(name = "OT_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date otDate;

    @Column(name = "DURATION_MINUTES", nullable = false)
    private Integer durationMinutes;

    @Column(name = "STATUS_ID", nullable = false)
    private Integer statusId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS_ID", insertable = false, updatable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private StatusMaster statusMaster;

    @Column(name = "VERIFICATION_STATUS", length = 50)
    private String verificationStatus;

    @Column(name = "VERTICAL_HEAD_ID")
    private Long verticalHeadId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VERTICAL_HEAD_ID", insertable = false, updatable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private EmployeeMaster verticalHeadUser;

    @Column(name = "VERIFIED_BY", length = 50)
    private String verifiedBy;

    @Column(name = "VERIFIED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date verifiedDate;

    @Column(name = "REJECT_REASON", length = 500)
    private String rejectReason;

    @Column(name = "REMARKS", length = 500)
    private String remarks;

    @Column(name = "FROM_WHERE", length = 25)
    private String fromWhere = "OT Master";

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Boolean activeStatus = true;

    @com.fasterxml.jackson.annotation.JsonProperty("employeeName")
    public String getEmployeeName() {
        return this.employee != null ? this.employee.getEmployeeName() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("employeeCode")
    public String getEmployeeCode() {
        return this.employee != null ? this.employee.getEmpCode() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("verticalHeadName")
    public String getVerticalHeadName() {
        return this.verticalHeadUser != null ? this.verticalHeadUser.getEmployeeName() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("statusName")
    public String getStatusName() {
        if (this.statusMaster != null && this.statusMaster.getName() != null) {
            return this.statusMaster.getName();
        }
        return this.verificationStatus;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Date getOtDate() { return otDate; }
    public void setOtDate(Date otDate) { this.otDate = otDate; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Integer getStatusId() { return statusId; }
    public void setStatusId(Integer statusId) { this.statusId = statusId; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public Long getVerticalHeadId() { return verticalHeadId; }
    public void setVerticalHeadId(Long verticalHeadId) { this.verticalHeadId = verticalHeadId; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public Date getVerifiedDate() { return verifiedDate; }
    public void setVerifiedDate(Date verifiedDate) { this.verifiedDate = verifiedDate; }
    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getFromWhere() { return fromWhere; }
    public void setFromWhere(String fromWhere) { this.fromWhere = fromWhere; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
    public Boolean getActiveStatus() { return activeStatus; }
    public void setActiveStatus(Boolean activeStatus) { this.activeStatus = activeStatus; }

    @com.fasterxml.jackson.annotation.JsonProperty("durationFormatted")
    public String getDurationFormatted() {
        if (this.durationMinutes == null || this.durationMinutes == 0) return "00:00";
        int hrs = this.durationMinutes / 60;
        int mins = this.durationMinutes % 60;
        return String.format("%02d:%02d", hrs, mins);
    }
}

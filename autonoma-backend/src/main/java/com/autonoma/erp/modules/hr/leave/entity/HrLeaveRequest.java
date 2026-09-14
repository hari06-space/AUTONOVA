package com.autonoma.erp.modules.hr.leave.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "HR_LEAVE_REQUEST")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrLeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LEAVE_REQUEST_ID")
    private Long leaveRequestId;

    @Column(name = "REQUEST_NO", nullable = false, unique = true, length = 50)
    private String requestNo;

    @Column(name = "EMP_ID", nullable = false)
    private Long empId;

    @Column(name = "EMP_CODE", length = 50)
    private String empCode;

    @Column(name = "EMP_NAME", length = 200)
    private String empName;

    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    @Transient
    private String departmentName;

    @Column(name = "LEAVE_TYPE_ID", nullable = false)
    private Long leaveTypeId;

    @Column(name = "LEAVE_TYPE_NAME", length = 100)
    private String leaveTypeName;

    @Column(name = "HOLIDAY_ID")
    private Long holidayId;

    @Column(name = "START_DATE", nullable = false)
    private LocalDate startDate;

    @Column(name = "END_DATE", nullable = false)
    private LocalDate endDate;

    @Column(name = "NUMBER_OF_DAYS", nullable = false)
    private Double numberOfDays = 1.0;

    public String getRequestNo() { return requestNo; }
    public Double getNumberOfDays() { return numberOfDays; }
    public LocalDate getStartDate() { return startDate; }

    @Column(name = "REASON", columnDefinition = "NVARCHAR(MAX)")
    private String reason;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "DRAFT";

    @Column(name = "REQUEST_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date requestDate;

    @Column(name = "SUBMITTED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedDate;

    @Column(name = "MANAGER_ID")
    private Long managerId;

    @Column(name = "MANAGER_NAME", length = 200)
    private String managerName;

    @Column(name = "MANAGER_REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String managerRemarks;

    @Column(name = "MANAGER_ACTION_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date managerActionDate;

    @Column(name = "HR_ID")
    private Long hrId;

    @Column(name = "HR_NAME", length = 200)
    private String hrName;

    @Column(name = "HR_REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String hrRemarks;

    @Column(name = "HR_ACTION_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date hrActionDate;

    @Column(name = "REJECTION_REASON", columnDefinition = "NVARCHAR(MAX)")
    private String rejectionReason;

    @Column(name = "APPROVED_BY", length = 200)
    private String approvedBy;

    @Column(name = "APPROVED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date approvedDate;

    @Column(name = "REJECTED_BY", length = 200)
    private String rejectedBy;

    @Column(name = "REJECTED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date rejectedDate;

    @Column(name = "APPROVAL_REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String approvalRemarks;

    @Column(name = "ATTENDANCE_MARKED", nullable = false)
    private Boolean attendanceMarked = false;

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
        if (this.requestDate == null)
            this.requestDate = this.createdDate;
        if (this.status == null)
            this.status = "DRAFT";
        if (this.attendanceMarked == null)
            this.attendanceMarked = false;
        if (this.numberOfDays == null)
            this.numberOfDays = 1.0;
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

    public Long getLeaveRequestId() { return leaveRequestId; }
    public void setLeaveRequestId(Long leaveRequestId) { this.leaveRequestId = leaveRequestId; }
    public void setRequestNo(String requestNo) { this.requestNo = requestNo; }
    public Long getEmpId() { return empId; }
    public void setEmpId(Long empId) { this.empId = empId; }
    public String getEmpCode() { return empCode; }
    public void setEmpCode(String empCode) { this.empCode = empCode; }
    public String getEmpName() { return empName; }
    public void setEmpName(String empName) { this.empName = empName; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }
    public String getLeaveTypeName() { return leaveTypeName; }
    public void setLeaveTypeName(String leaveTypeName) { this.leaveTypeName = leaveTypeName; }
    public Long getHolidayId() { return holidayId; }
    public void setHolidayId(Long holidayId) { this.holidayId = holidayId; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public void setNumberOfDays(Double numberOfDays) { this.numberOfDays = numberOfDays; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Date getRequestDate() { return requestDate; }
    public void setRequestDate(Date requestDate) { this.requestDate = requestDate; }
    public Date getSubmittedDate() { return submittedDate; }
    public void setSubmittedDate(Date submittedDate) { this.submittedDate = submittedDate; }
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }
    public String getManagerRemarks() { return managerRemarks; }
    public void setManagerRemarks(String managerRemarks) { this.managerRemarks = managerRemarks; }
    public Date getManagerActionDate() { return managerActionDate; }
    public void setManagerActionDate(Date managerActionDate) { this.managerActionDate = managerActionDate; }
    public Long getHrId() { return hrId; }
    public void setHrId(Long hrId) { this.hrId = hrId; }
    public String getHrName() { return hrName; }
    public void setHrName(String hrName) { this.hrName = hrName; }
    public String getHrRemarks() { return hrRemarks; }
    public void setHrRemarks(String hrRemarks) { this.hrRemarks = hrRemarks; }
    public Date getHrActionDate() { return hrActionDate; }
    public void setHrActionDate(Date hrActionDate) { this.hrActionDate = hrActionDate; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public Date getApprovedDate() { return approvedDate; }
    public void setApprovedDate(Date approvedDate) { this.approvedDate = approvedDate; }
    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }
    public Date getRejectedDate() { return rejectedDate; }
    public void setRejectedDate(Date rejectedDate) { this.rejectedDate = rejectedDate; }
    public String getApprovalRemarks() { return approvalRemarks; }
    public void setApprovalRemarks(String approvalRemarks) { this.approvalRemarks = approvalRemarks; }
    public Boolean getAttendanceMarked() { return attendanceMarked; }
    public void setAttendanceMarked(Boolean attendanceMarked) { this.attendanceMarked = attendanceMarked; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
    public String getLeaveType() { return leaveTypeName; }
}

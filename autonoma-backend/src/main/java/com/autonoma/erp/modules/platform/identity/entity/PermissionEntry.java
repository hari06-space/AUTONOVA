package com.autonoma.erp.modules.platform.identity.entity;

import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "HR_PERMISSION_DETAILS")
public class PermissionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    @Transient
    private String employeeName;

    @Column(name = "PERMISSION_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date permissionDate;

    @Column(name = "FROM_TIME", nullable = false, length = 50)
    private String fromTime;

    @Column(name = "TO_TIME", nullable = false, length = 50)
    private String toTime;

    @Column(name = "ACTUAL_DURATION", nullable = false, length = 100)
    private String actualDuration;

    @Column(name = "CONSIDERED_DURATION", nullable = false, precision = 10, scale = 2)
    private BigDecimal consideredDuration;

    @Column(name = "REASON", columnDefinition = "NVARCHAR(MAX)")
    private String reason;

    @Column(name = "STATUS_ID")
    private Long statusId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STATUS_ID", insertable = false, updatable = false)
    private StatusMaster statusMaster;

    @Column(name = "REJECTION_REASON", columnDefinition = "NVARCHAR(MAX)")
    private String rejectionReason;

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

    @Column(name = "MONTH", length = 50)
    private String month;

    @Column(name = "YEAR")
    private Integer year;

    @Column(name = "FROM_WHERE", length = 25)
    private String fromWhere;

    @Column(name = "REQUEST_TYPE", length = 50)
    private String requestType;

    @Transient
    private String employeeCode;

    @Transient
    private String rejectionComment;

    @Transient
    private String filePaths;

    @Transient
    private java.util.List<java.util.Map<String, Object>> documents;

    @Column(name = "VERIFIED_BY", length = 50)
    private String verifiedBy;

    @Column(name = "VERIFIED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date verifiedDate;

    public PermissionEntry() {
    }

    public PermissionEntry(Long id, Long employeeId, EmployeeMaster employee, String employeeName, Date permissionDate, String fromTime, String toTime, String actualDuration, BigDecimal consideredDuration, String reason, Long statusId, String rejectionReason, String createdBy, Date createdDate, String updatedBy, Date updatedDate, String month, Integer year, String requestType, String employeeCode, String rejectionComment, String verifiedBy, Date verifiedDate) {
        this.id = id;
        this.employeeId = employeeId;
        this.employee = employee;
        this.employeeName = employeeName;
        this.permissionDate = permissionDate;
        this.fromTime = fromTime;
        this.toTime = toTime;
        this.actualDuration = actualDuration;
        this.consideredDuration = consideredDuration;
        this.reason = reason;
        this.statusId = statusId;
        this.rejectionReason = rejectionReason;
        this.createdBy = createdBy;
        this.createdDate = createdDate;
        this.updatedBy = updatedBy;
        this.updatedDate = updatedDate;
        this.month = month;
        this.year = year;
        this.requestType = requestType;
        this.employeeCode = employeeCode;
        this.rejectionComment = rejectionComment;
        this.verifiedBy = verifiedBy;
        this.verifiedDate = verifiedDate;
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

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public Date getPermissionDate() {
        return permissionDate;
    }

    public void setPermissionDate(Date permissionDate) {
        this.permissionDate = permissionDate;
    }

    public String getFromTime() {
        return fromTime;
    }

    public void setFromTime(String fromTime) {
        this.fromTime = fromTime;
    }

    public String getToTime() {
        return toTime;
    }

    public void setToTime(String toTime) {
        this.toTime = toTime;
    }

    public String getActualDuration() {
        return actualDuration;
    }

    public void setActualDuration(String actualDuration) {
        this.actualDuration = actualDuration;
    }

    public BigDecimal getConsideredDuration() {
        return consideredDuration;
    }

    public void setConsideredDuration(BigDecimal consideredDuration) {
        this.consideredDuration = consideredDuration;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("status")
    public String getStatus() {
        if (statusMaster != null && statusMaster.getName() != null) {
            return statusMaster.getName();
        }
        return null;
    }

    public Long getStatusId() {
        return statusId;
    }

    public void setStatusId(Long statusId) {
        this.statusId = statusId;
    }

    public StatusMaster getStatusMaster() {
        return statusMaster;
    }

    public void setStatusMaster(StatusMaster statusMaster) {
        this.statusMaster = statusMaster;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
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

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }



    public String getRejectionComment() {
        return rejectionComment;
    }

    public void setRejectionComment(String rejectionComment) {
        this.rejectionComment = rejectionComment;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(String verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public Date getVerifiedDate() {
        return verifiedDate;
    }

    public void setVerifiedDate(Date verifiedDate) {
        this.verifiedDate = verifiedDate;
    }

    @PrePersist
    protected void onCreate() {
        // Only set audit fields if not already populated by the service layer
        if (this.createdDate == null) {
            this.createdDate = new Date();
        }
        if (this.updatedDate == null) {
            this.updatedDate = new Date();
        }
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            try {
                String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                if (currentUserId != null && !currentUserId.trim().isEmpty()) {
                    this.createdBy = currentUserId;
                    this.updatedBy = currentUserId;
                }
            } catch (Exception e) {
                // SecurityUtils may not be available in all JPA contexts
            }
        }
        if (this.updatedBy == null || this.updatedBy.trim().isEmpty()) {
            this.updatedBy = this.createdBy;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = new Date();
        if (this.updatedBy == null || this.updatedBy.trim().isEmpty()) {
            try {
                String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                if (currentUserId != null && !currentUserId.trim().isEmpty()) {
                    this.updatedBy = currentUserId;
                }
            } catch (Exception e) {
                // SecurityUtils may not be available in all JPA contexts
            }
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

    @com.fasterxml.jackson.annotation.JsonProperty("employeeCode")
    public String getEmployeeCode() {
        return this.employeeCode != null ? this.employeeCode : (this.employee != null ? this.employee.getEmpCode() : null);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("employee_code")
    public String getEmployeeCodeUnderscore() {
        return this.employeeCode != null ? this.employeeCode : (this.employee != null ? this.employee.getEmpCode() : null);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("employee_name")
    public String getEmployeeNameUnderscore() {
        return this.employeeName != null ? this.employeeName : (this.employee != null ? this.employee.getEmployeeName() : null);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("created_by")
    public String getCreatedByUnderscore() {
        return this.createdBy;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("created_date")
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Kolkata")
    public Date getCreatedDateUnderscore() {
        return this.createdDate;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updated_by")
    public String getUpdatedByUnderscore() {
        return this.updatedBy;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updated_datetime")
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Kolkata")
    public Date getUpdatedDatetime() {
        return this.updatedDate;
    }

    public String getFromWhere() {
        return this.fromWhere;
    }

    public void setFromWhere(String fromWhere) {
        this.fromWhere = fromWhere;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("whereFrom")
    public String getWhereFrom() {
        return this.fromWhere;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("whereFrom")
    public void setWhereFrom(String whereFrom) {
        this.fromWhere = whereFrom;
    }

    public String getFilePaths() {
        return filePaths;
    }

    public void setFilePaths(String filePaths) {
        this.filePaths = filePaths;
    }

    public java.util.List<java.util.Map<String, Object>> getDocuments() {
        return documents;
    }

    public void setDocuments(java.util.List<java.util.Map<String, Object>> documents) {
        this.documents = documents;
    }

    @PostLoad
    public void loadAttachments() {
        if (this.id != null) {
            try {
                com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository attachmentRepo = 
                    com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository.class);
                if (attachmentRepo != null) {
                    java.util.List<com.autonoma.erp.modules.induction.entity.HrAttachmentPath> paths = 
                        attachmentRepo.findAllByPageCodeAndRefIdAndDocType("HA1310", this.id, "PERMISSION_ATTACHMENT");
                    if (paths != null && !paths.isEmpty()) {
                        java.util.StringJoiner sj = new java.util.StringJoiner(",");
                        java.util.List<java.util.Map<String, Object>> docList = new java.util.ArrayList<>();
                        for (com.autonoma.erp.modules.induction.entity.HrAttachmentPath p : paths) {
                            if (p.getPath() != null) {
                                sj.add(p.getPath());
                                java.util.Map<String, Object> docMap = new java.util.HashMap<>();
                                docMap.put("id", p.getId());
                                docMap.put("name", p.getFileName());
                                docMap.put("fileName", p.getFileName());
                                docMap.put("serverFileName", p.getPath());
                                docMap.put("isServer", true);
                                docList.add(docMap);
                            }
                        }
                        this.filePaths = sj.toString();
                        this.documents = docList;
                    }
                }
            } catch (Exception e) {
                // Ignore Context issues during boot / testing
            }
        }
    }
}

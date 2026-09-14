package com.autonoma.erp.modules.hr.employee.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_REFERENCE")
public class EmployeeReference {

    @Id
    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "EMPLOYEE_ID")
    private EmployeeMaster employee;

    @Column(name = "VENDOR_NAME", length = 100)
    private String vendorName;

    @Column(name = "REFER_MODE", length = 50)
    private String referMode;

    @Column(name = "REFERENCE_COMMENTS")
    private String referenceComments;

    @Column(name = "HOME_MANAGER", length = 100)
    private String homeManager;

    @Column(name = "BUSINESS_MANAGER", length = 100)
    private String businessManager;

    @Column(name = "SUPPLIER_NAME", length = 100)
    private String supplierName;

    @Column(name = "BGV_REMARK", columnDefinition = "NVARCHAR(MAX)")
    private String bgvRemark;

    @Column(name = "FINAL_FEEDBACK", columnDefinition = "NVARCHAR(MAX)")
    private String finalFeedback;

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

    public EmployeeReference() {
    }

    public EmployeeReference(Long employeeId, EmployeeMaster employee, String vendorName, String referMode,
            String referenceComments, String homeManager, String businessManager, String supplierName, String createdBy,
            Date createdDate, String updatedBy, Date updatedDate) {
        this.employeeId = employeeId;
        this.employee = employee;
        this.vendorName = vendorName;
        this.referMode = referMode;
        this.referenceComments = referenceComments;
        this.homeManager = homeManager;
        this.businessManager = businessManager;
        this.supplierName = supplierName;
        this.createdBy = createdBy;
        this.createdDate = createdDate;
        this.updatedBy = updatedBy;
        this.updatedDate = updatedDate;
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

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

    public String getReferMode() {
        return referMode;
    }

    public void setReferMode(String referMode) {
        this.referMode = referMode;
    }

    public String getReferenceComments() {
        return referenceComments;
    }

    public void setReferenceComments(String referenceComments) {
        this.referenceComments = referenceComments;
    }

    public String getHomeManager() {
        return homeManager;
    }

    public void setHomeManager(String homeManager) {
        this.homeManager = homeManager;
    }

    public String getBusinessManager() {
        return businessManager;
    }

    public void setBusinessManager(String businessManager) {
        this.businessManager = businessManager;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getBgvRemark() {
        return bgvRemark;
    }

    public void setBgvRemark(String bgvRemark) {
        this.bgvRemark = bgvRemark;
    }

    public String getFinalFeedback() {
        return finalFeedback;
    }

    public void setFinalFeedback(String finalFeedback) {
        this.finalFeedback = finalFeedback;
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
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }
            if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
        }
        if (this.createdDate == null) {
            this.createdDate = new Date();
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
        this.updatedDate = new Date();
    }
}


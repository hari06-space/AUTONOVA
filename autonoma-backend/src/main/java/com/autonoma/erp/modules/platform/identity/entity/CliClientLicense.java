package com.autonoma.erp.modules.platform.identity.entity;

import com.autonoma.erp.model.admin.CompanyCredential;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "CLI_CLIENT_LICENSE", indexes = {
    @Index(name = "IDX_CLI_LICENSE_CLIENT_ID", columnList = "CLIENT_ID"),
    @Index(name = "IDX_CLI_LICENSE_EXPIRY", columnList = "EXPIRY_DATE")
})
public class CliClientLicense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CLIENT_ID", nullable = false)
    private Long clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CLIENT_ID", referencedColumnName = "id", insertable = false, updatable = false, foreignKey = @ForeignKey(name = "FK_CLI_LICENSE_COMPANY"))
    private CompanyCredential companyCredential;

    @Column(name = "LICENSE_KEY", unique = true, length = 128)
    private String licenseKey;

    @Column(name = "IMPLEMENTED_DATE", nullable = false)
    private LocalDate implementedDate;

    @Column(name = "EXPIRY_DATE", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "MAX_USERS", nullable = false)
    private Integer maxUsers = 5;

    @Column(name = "MAX_BRANCHES", nullable = false)
    private Integer maxBranches = 1;

    @Column(name = "MAX_COMPANIES", nullable = false)
    private Integer maxCompanies = 1;

    @Column(name = "MAX_CONCURRENT_LOGIN", nullable = false)
    private Integer maxConcurrentLogin = 5;

    @Column(name = "MAX_STORAGE_MB", nullable = false)
    private Integer maxStorageMb = 1024;

    @Column(name = "API_ACCESS")
    private Boolean apiAccess = false;

    @Column(name = "MOBILE_APP_ACCESS")
    private Boolean mobileAppAccess = false;

    @Column(name = "BACKUP_ENABLED")
    private Boolean backupEnabled = true;

    @Column(name = "STATUS_ID")
    private Long statusId;

    @Transient
    private String status;

    @Column(name = "IS_DELETED")
    private Boolean isDeleted = false;

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public CompanyCredential getCompanyCredential() { return companyCredential; }
    public void setCompanyCredential(CompanyCredential companyCredential) { this.companyCredential = companyCredential; }

    public String getLicenseKey() { return licenseKey; }
    public void setLicenseKey(String licenseKey) { this.licenseKey = licenseKey; }

    public LocalDate getImplementedDate() { return implementedDate; }
    public void setImplementedDate(LocalDate implementedDate) { this.implementedDate = implementedDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public Integer getMaxUsers() { return maxUsers; }
    public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }

    public Integer getMaxBranches() { return maxBranches; }
    public void setMaxBranches(Integer maxBranches) { this.maxBranches = maxBranches; }

    public Integer getMaxCompanies() { return maxCompanies; }
    public void setMaxCompanies(Integer maxCompanies) { this.maxCompanies = maxCompanies; }

    public Integer getMaxConcurrentLogin() { return maxConcurrentLogin; }
    public void setMaxConcurrentLogin(Integer maxConcurrentLogin) { this.maxConcurrentLogin = maxConcurrentLogin; }

    public Integer getMaxStorageMb() { return maxStorageMb; }
    public void setMaxStorageMb(Integer maxStorageMb) { this.maxStorageMb = maxStorageMb; }

    public Boolean getApiAccess() { return apiAccess; }
    public void setApiAccess(Boolean apiAccess) { this.apiAccess = apiAccess; }

    public Boolean getMobileAppAccess() { return mobileAppAccess; }
    public void setMobileAppAccess(Boolean mobileAppAccess) { this.mobileAppAccess = mobileAppAccess; }

    public Boolean getBackupEnabled() { return backupEnabled; }
    public void setBackupEnabled(Boolean backupEnabled) { this.backupEnabled = backupEnabled; }



    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Long getStatusId() { return statusId; }
    public void setStatusId(Long statusId) { this.statusId = statusId; }

    public String getStatus() {
        if (this.status != null) {
            return this.status;
        }
        return this.statusId != null ? String.valueOf(this.statusId) : "ACTIVE";
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

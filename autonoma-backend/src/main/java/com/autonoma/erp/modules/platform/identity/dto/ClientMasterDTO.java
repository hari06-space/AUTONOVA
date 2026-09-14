package com.autonoma.erp.modules.platform.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ClientMasterDTO {

    private Long id;
    private String clientCode;

    @NotBlank(message = "Client Name is required")
    private String clientName;

    @NotBlank(message = "Company Name is required")
    private String companyName;

    private String shortName;
    private String gstNumber;
    private String panNumber;
    private String cinNumber;
    private String contactPerson;
    private String mobileNumber;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String website;
    private String address;
    private String country;
    private String state;
    private String city;
    private String pincode;
    private String timeZone;
    private String currency;
    private String companyLogo;
    private Long statusId;
    private String status;

    // License Details
    private String licenseType;
    private String licenseKey;

    private LocalDate implementedDate;

    @NotNull(message = "License Expiry Date is required")
    private LocalDate licenseExpiryDate;

    private Long daysRemaining;

    @NotNull(message = "Maximum Users limit is required")
    private Integer maxUsers;

    @NotNull(message = "Maximum Branches limit is required")
    private Integer maxBranches;

    @NotNull(message = "Maximum Companies limit is required")
    private Integer maxCompanies;

    @NotNull(message = "Maximum Concurrent Login limit is required")
    private Integer maxConcurrentLogin;

    @NotNull(message = "Maximum Storage (MB) limit is required")
    private Integer maxStorageMb;

    private Boolean apiAccess;
    private Boolean mobileAppAccess;
    private Boolean backupEnabled;
    private String licenseStatus;

    // Health Configuration
    private Boolean healthMonitoringEnabled;
    private String serverName;
    private String serverIp;
    private Integer serverPort;
    private String windowsUsername;
    private String windowsPassword;

    // Database Connection Configuration
    private String dbType;
    private String dbHost;
    private Integer dbPort;
    private String dbName;
    private String dbUsername;
    private String dbPassword;

    // Metrics / Counts
    private Integer currentUsers;
    private Integer currentBranches;
    private Integer currentCompanies;
    private Integer currentStorageMb;

    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Getters and Setters for Database Config
    public String getDbType() { return dbType; }
    public void setDbType(String dbType) { this.dbType = dbType; }

    public String getDbHost() { return dbHost; }
    public void setDbHost(String dbHost) { this.dbHost = dbHost; }

    public Integer getDbPort() { return dbPort; }
    public void setDbPort(Integer dbPort) { this.dbPort = dbPort; }

    public String getDbName() { return dbName; }
    public void setDbName(String dbName) { this.dbName = dbName; }

    public String getDbUsername() { return dbUsername; }
    public void setDbUsername(String dbUsername) { this.dbUsername = dbUsername; }

    public String getDbPassword() { return dbPassword; }
    public void setDbPassword(String dbPassword) { this.dbPassword = dbPassword; }

    // Getters and Setters
    public Boolean getHealthMonitoringEnabled() { return healthMonitoringEnabled; }
    public void setHealthMonitoringEnabled(Boolean healthMonitoringEnabled) { this.healthMonitoringEnabled = healthMonitoringEnabled; }

    public String getServerName() { return serverName; }
    public void setServerName(String serverName) { this.serverName = serverName; }

    public String getServerIp() { return serverIp; }
    public void setServerIp(String serverIp) { this.serverIp = serverIp; }

    public Integer getServerPort() { return serverPort; }
    public void setServerPort(Integer serverPort) { this.serverPort = serverPort; }

    public String getWindowsUsername() { return windowsUsername; }
    public void setWindowsUsername(String windowsUsername) { this.windowsUsername = windowsUsername; }

    public String getWindowsPassword() { return windowsPassword; }
    public void setWindowsPassword(String windowsPassword) { this.windowsPassword = windowsPassword; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getClientCode() { return clientCode; }
    public void setClientCode(String clientCode) { this.clientCode = clientCode; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }

    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }

    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public String getCinNumber() { return cinNumber; }
    public void setCinNumber(String cinNumber) { this.cinNumber = cinNumber; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getTimeZone() { return timeZone; }
    public void setTimeZone(String timeZone) { this.timeZone = timeZone; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getCompanyLogo() { return companyLogo; }
    public void setCompanyLogo(String companyLogo) { this.companyLogo = companyLogo; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLicenseType() { return licenseType; }
    public void setLicenseType(String licenseType) { this.licenseType = licenseType; }

    public String getLicenseKey() { return licenseKey; }
    public void setLicenseKey(String licenseKey) { this.licenseKey = licenseKey; }

    public LocalDate getImplementedDate() { return implementedDate; }
    public void setImplementedDate(LocalDate implementedDate) { this.implementedDate = implementedDate; }

    public LocalDate getLicenseExpiryDate() { return licenseExpiryDate; }
    public void setLicenseExpiryDate(LocalDate licenseExpiryDate) { this.licenseExpiryDate = licenseExpiryDate; }

    public Long getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(Long daysRemaining) { this.daysRemaining = daysRemaining; }

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

    public String getLicenseStatus() { return licenseStatus; }
    public void setLicenseStatus(String licenseStatus) { this.licenseStatus = licenseStatus; }

    public Integer getCurrentUsers() { return currentUsers; }
    public void setCurrentUsers(Integer currentUsers) { this.currentUsers = currentUsers; }

    public Integer getCurrentBranches() { return currentBranches; }
    public void setCurrentBranches(Integer currentBranches) { this.currentBranches = currentBranches; }

    public Integer getCurrentCompanies() { return currentCompanies; }
    public void setCurrentCompanies(Integer currentCompanies) { this.currentCompanies = currentCompanies; }

    public Integer getCurrentStorageMb() { return currentStorageMb; }
    public void setCurrentStorageMb(Integer currentStorageMb) { this.currentStorageMb = currentStorageMb; }

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
}

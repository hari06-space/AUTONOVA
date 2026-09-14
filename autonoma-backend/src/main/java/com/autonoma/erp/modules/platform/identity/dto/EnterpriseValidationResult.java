package com.autonoma.erp.modules.platform.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnterpriseValidationResult implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * True if all critical validations passed and login/access is allowed.
     */
    private boolean valid;

    /**
     * True if validation passed but a non-blocking warning exists (e.g. nearing expiry).
     */
    private boolean warning;

    /**
     * Machine-readable error code if validation failed.
     */
    private String errorCode;

    /**
     * User-facing validation message.
     */
    private String message;

    /**
     * User-facing warning message.
     */
    private String warningMessage;

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }
    public boolean isWarning() { return warning; }
    public void setWarning(boolean warning) { this.warning = warning; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getWarningMessage() { return warningMessage; }
    public void setWarningMessage(String warningMessage) { this.warningMessage = warningMessage; }
    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
    public Integer getDaysRemaining() { return (int) daysRemaining; }
    public void setDaysRemaining(long daysRemaining) { this.daysRemaining = daysRemaining; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getClientCode() { return clientCode; }
    public void setClientCode(String clientCode) { this.clientCode = clientCode; }
    public java.time.LocalDate getLicenseExpiryDate() { return licenseExpiryDate; }
    public void setLicenseExpiryDate(java.time.LocalDate licenseExpiryDate) { this.licenseExpiryDate = licenseExpiryDate; }
    public String getLicenseStatus() { return licenseStatus; }
    public void setLicenseStatus(String licenseStatus) { this.licenseStatus = licenseStatus; }
    public Integer getMaxUsers() { return maxUsers; }
    public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }
    public Integer getMaxBranches() { return maxBranches; }
    public void setMaxBranches(Integer maxBranches) { this.maxBranches = maxBranches; }
    public Integer getMaxCompanies() { return maxCompanies; }
    public void setMaxCompanies(Integer maxCompanies) { this.maxCompanies = maxCompanies; }
    public Integer getMaxStorageMb() { return maxStorageMb; }
    public void setMaxStorageMb(Integer maxStorageMb) { this.maxStorageMb = maxStorageMb; }
    public Long getCurrentActiveUsers() { return currentActiveUsers; }
    public void setCurrentActiveUsers(Long currentActiveUsers) { this.currentActiveUsers = currentActiveUsers; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private boolean valid; private boolean warning; private String errorCode;
        private String message; private String warningMessage; private long daysRemaining;
        private String clientCode; private String clientName; private java.time.LocalDate licenseExpiryDate;
        private String licenseStatus; private Integer maxUsers; private Integer maxBranches;
        private Integer maxCompanies; private Integer maxStorageMb; private Long currentActiveUsers;
        public Builder valid(boolean v) { this.valid = v; return this; }
        public Builder warning(boolean v) { this.warning = v; return this; }
        public Builder errorCode(String v) { this.errorCode = v; return this; }
        public Builder message(String v) { this.message = v; return this; }
        public Builder warningMessage(String v) { this.warningMessage = v; return this; }
        public Builder daysRemaining(long v) { this.daysRemaining = v; return this; }
        public Builder clientCode(String v) { this.clientCode = v; return this; }
        public Builder clientName(String v) { this.clientName = v; return this; }
        public Builder licenseExpiryDate(java.time.LocalDate v) { this.licenseExpiryDate = v; return this; }
        public Builder licenseStatus(String v) { this.licenseStatus = v; return this; }
        public Builder maxUsers(Integer v) { this.maxUsers = v; return this; }
        public Builder maxBranches(Integer v) { this.maxBranches = v; return this; }
        public Builder maxCompanies(Integer v) { this.maxCompanies = v; return this; }
        public Builder maxStorageMb(Integer v) { this.maxStorageMb = v; return this; }
        public Builder currentActiveUsers(Long v) { this.currentActiveUsers = v; return this; }
        public EnterpriseValidationResult build() {
            EnterpriseValidationResult r = new EnterpriseValidationResult();
            r.valid = this.valid; r.warning = this.warning; r.errorCode = this.errorCode;
            r.message = this.message; r.warningMessage = this.warningMessage;
            r.daysRemaining = this.daysRemaining; r.clientCode = this.clientCode;
            r.clientName = this.clientName; r.licenseExpiryDate = this.licenseExpiryDate;
            r.licenseStatus = this.licenseStatus; r.maxUsers = this.maxUsers;
            r.maxBranches = this.maxBranches; r.maxCompanies = this.maxCompanies;
            r.maxStorageMb = this.maxStorageMb; r.currentActiveUsers = this.currentActiveUsers;
            return r;
        }
    }

    /**
     * Remaining days before license expiry.
     */
    private long daysRemaining;

    /**
     * Client code evaluated.
     */
    private String clientCode;

    /**
     * Client name retrieved from Master DB.
     */
    private String clientName;

    /**
     * Expiry date retrieved from Master DB.
     */
    private LocalDate licenseExpiryDate;

    /**
     * License status retrieved from Master DB.
     */
    private String licenseStatus;

    /**
     * Maximum allowed users.
     */
    private Integer maxUsers;

    /**
     * Maximum allowed branches/divisions.
     */
    private Integer maxBranches;

    /**
     * Maximum allowed companies.
     */
    private Integer maxCompanies;

    /**
     * Maximum allowed storage in MB.
     */
    private Integer maxStorageMb;

    /**
     * Current active users count.
     */
    private Long currentActiveUsers;

    /**
     * Static helper for critical failure.
     */
    public static EnterpriseValidationResult fail(String errorCode, String message) {
        EnterpriseValidationResult r = new EnterpriseValidationResult();
        r.valid = false;
        r.warning = false;
        r.errorCode = errorCode;
        r.message = message;
        return r;
    }

    public static EnterpriseValidationResult success(String clientCode, String clientName, LocalDate expiryDate, long daysRemaining) {
        EnterpriseValidationResult r = new EnterpriseValidationResult();
        r.valid = true;
        r.warning = false;
        r.clientCode = clientCode;
        r.clientName = clientName;
        r.licenseExpiryDate = expiryDate;
        r.daysRemaining = daysRemaining;
        r.message = "Validation successful.";
        return r;
    }

    public static EnterpriseValidationResult warning(String clientCode, String clientName, LocalDate expiryDate, long daysRemaining, String warningMessage) {
        EnterpriseValidationResult r = new EnterpriseValidationResult();
        r.valid = true;
        r.warning = true;
        r.clientCode = clientCode;
        r.clientName = clientName;
        r.licenseExpiryDate = expiryDate;
        r.daysRemaining = daysRemaining;
        r.message = "Validation passed with warning.";
        r.warningMessage = warningMessage;
        return r;
    }
}

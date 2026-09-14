package com.autonoma.erp.model.admin;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_COMPANY_CREDENTIAL")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "COMPANY_NAME", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String companyName;

    @Column(name = "SHORT_NAME", columnDefinition = "NVARCHAR(50)")
    private String shortName;

    @Column(name = "ADDRESS", columnDefinition = "NVARCHAR(500)")
    private String address;

    @Column(name = "CITY", columnDefinition = "NVARCHAR(50)")
    private String city;

    @Column(name = "STATE", columnDefinition = "NVARCHAR(50)")
    private String state;

    @Column(name = "STATE_CODE")
    private Integer stateCode;

    @Column(name = "COUNTRY", columnDefinition = "NVARCHAR(50)")
    private String country;

    @Column(name = "PINCODE", columnDefinition = "NVARCHAR(10)")
    private String pincode;

    @Column(name = "GST_IN", columnDefinition = "NVARCHAR(15)")
    private String gstIn;

    @Column(name = "CLIENT_CODE", columnDefinition = "NVARCHAR(50)")
    private String clientCode;

    @Column(name = "DB_SOURCE_NAME", columnDefinition = "NVARCHAR(50)")
    private String dbSourceName;

    @Column(name = "LIC_RENEWAL_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date licRenewalDate;

    @Column(name = "LIC_EXPIRY_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date licExpiryDate;

    @Column(name = "LOGO_FILE_NAME", columnDefinition = "NVARCHAR(500)")
    private String logoFileName;

    @Column(name = "LOGIN_BG_FILE_NAME", columnDefinition = "NVARCHAR(500)")
    private String logInBgFileName;

    @Column(name = "DIRECTORY_PATH", columnDefinition = "NVARCHAR(1000)")
    private String directoryPath;

    @Column(name = "LIC_EXP_REMAINDER_DAYS")
    private Long licExpRemainderDays = 30L;

    @Column(name = "restore_enable_days")
    private Integer restoreEnableDays;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    @Column(name = "INPUT_CASE_STYLE", columnDefinition = "NVARCHAR(50)")
    private String inputCaseStyle;

    @Column(name = "REGISTRATION_NO", columnDefinition = "NVARCHAR(100)")
    private String registrationNo;

    @Column(name = "PAN_NO", columnDefinition = "NVARCHAR(50)")
    private String panNo;

    @Column(name = "MOBILE_NO", columnDefinition = "NVARCHAR(20)")
    private String mobileNo;

    @Column(name = "PHONE_NO", columnDefinition = "NVARCHAR(20)")
    private String phoneNo;

    @Column(name = "EMAIL_ID", columnDefinition = "NVARCHAR(100)")
    private String emailId;

    @Column(name = "WEBSITE", columnDefinition = "NVARCHAR(100)")
    private String website;

    @Column(name = "GMAPLINK", columnDefinition = "NVARCHAR(500)")
    private String gmaplink;

    @Column(name = "DECIMAL_PLACES")
    private Integer decimalPlaces;

    @Column(name = "CURRENCY_CODE", columnDefinition = "NVARCHAR(10)")
    private String currencyCode;

    @Column(name = "SMTP_HOST", columnDefinition = "NVARCHAR(100)")
    private String smtpHost;

    @Column(name = "SMTP_PORT")
    private Integer smtpPort;

    @Column(name = "SMTP_USERNAME", columnDefinition = "NVARCHAR(100)")
    private String smtpUsername;

    @Column(name = "SMTP_PASSWORD", columnDefinition = "NVARCHAR(255)")
    private String smtpPassword;

    @Column(name = "SMTP_SSL_ENABLED")
    private Boolean smtpSslEnabled;

    @Column(name = "SUPPORT_EMAIL", columnDefinition = "NVARCHAR(100)")
    private String supportEmail;

    @Column(name = "SUPPORT_PHONE", columnDefinition = "NVARCHAR(20)")
    private String supportPhone;

    @Column(name = "AUDIT_LOG_ENABLED")
    private Boolean auditLogEnabled;

    @Column(name = "DEFAULT_ROWS_PER_PAGE")
    private Integer defaultRowsPerPage = 50;

    @Column(name = "DEFAULT_MAX_RECORDS")
    private Integer defaultMaxRecords = 100;

    @Column(name = "AUTO_LOGOUT_SECONDS")
    private Integer autoLogoutSeconds = 30;

    @Column(name = "ALLOW_DUPLICATE_SCREENS")
    private Boolean allowDuplicateScreens = false;

    @Column(name = "ALLOW_RIGHT_CLICK")
    private Boolean allowRightClick = true;

    @Column(name = "SINGLE_ACTIVE_SESSION")
    private Boolean singleActiveSession = false;

    public Boolean getSingleActiveSession() { return singleActiveSession != null ? singleActiveSession : false; }
    public void setSingleActiveSession(Boolean singleActiveSession) { this.singleActiveSession = singleActiveSession; }

    @Column(name = "TIME_FORMAT", columnDefinition = "NVARCHAR(10)")
    private String timeFormat = "H24"; // 'H24' (24-hour) or 'H12' (12-hour AM/PM)

    @Column(name = "DATE_FORMAT", columnDefinition = "NVARCHAR(20)")
    private String dateFormat = "DD/MM/YYYY"; // 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

    @Column(name = "WEEK_STARTS_ON", columnDefinition = "NVARCHAR(10)")
    private String weekStartsOn = "MONDAY"; // 'MONDAY' | 'SUNDAY' | 'SATURDAY'

    @Column(name = "APP_TIMEZONE", columnDefinition = "NVARCHAR(50)")
    private String appTimezone = "Asia/Kolkata";

    @Column(name = "ESSL_CONFIG_NAME", columnDefinition = "NVARCHAR(100)")
    private String esslConfigName;

    @Column(name = "ESSL_ATTENDANCE_SOURCE", columnDefinition = "NVARCHAR(50)")
    private String esslAttendanceSource;

    @Column(name = "ESSL_CONNECTION_TYPE", columnDefinition = "NVARCHAR(50)")
    private String esslConnectionType;

    @Column(name = "ESSL_DATABASE_TYPE", columnDefinition = "NVARCHAR(50)")
    private String esslDatabaseType;

    @Column(name = "ESSL_SERVER_IP", columnDefinition = "NVARCHAR(100)")
    private String esslServerIp;

    @Column(name = "ESSL_PORT")
    private Integer esslPort;

    @Column(name = "ESSL_DB_NAME", columnDefinition = "NVARCHAR(100)")
    private String esslDbName;

    @Column(name = "ESSL_USERNAME", columnDefinition = "NVARCHAR(100)")
    private String esslUsername;

    @Column(name = "ESSL_PASSWORD", columnDefinition = "NVARCHAR(255)")
    private String esslPassword;

    public String getEsslServerIp() { return esslServerIp; }
    public void setEsslServerIp(String esslServerIp) { this.esslServerIp = esslServerIp; }
    public Integer getEsslPort() { return esslPort; }
    public void setEsslPort(Integer esslPort) { this.esslPort = esslPort; }
    public String getEsslDbName() { return esslDbName; }
    public void setEsslDbName(String esslDbName) { this.esslDbName = esslDbName; }
    public String getEsslUsername() { return esslUsername; }
    public void setEsslUsername(String esslUsername) { this.esslUsername = esslUsername; }
    public String getEsslPassword() { return esslPassword; }
    public void setEsslPassword(String esslPassword) { this.esslPassword = esslPassword; }
    public String getClientCode() { return clientCode; }
    public void setClientCode(String clientCode) { this.clientCode = clientCode; }
    public String getEsslConfigName() { return esslConfigName; }
    public void setEsslConfigName(String esslConfigName) { this.esslConfigName = esslConfigName; }
    public String getEsslAttendanceSource() { return esslAttendanceSource; }
    public void setEsslAttendanceSource(String esslAttendanceSource) { this.esslAttendanceSource = esslAttendanceSource; }
    public String getEsslConnectionType() { return esslConnectionType; }
    public void setEsslConnectionType(String esslConnectionType) { this.esslConnectionType = esslConnectionType; }
    public String getEsslDatabaseType() { return esslDatabaseType; }
    public void setEsslDatabaseType(String esslDatabaseType) { this.esslDatabaseType = esslDatabaseType; }
    public String getEsslStatus() { return esslStatus; }
    public void setEsslStatus(String esslStatus) { this.esslStatus = esslStatus; }
    public String getEsslApiBaseUrl() { return esslApiBaseUrl; }
    public void setEsslApiBaseUrl(String esslApiBaseUrl) { this.esslApiBaseUrl = esslApiBaseUrl; }
    public String getEsslApiKey() { return esslApiKey; }
    public void setEsslApiKey(String esslApiKey) { this.esslApiKey = esslApiKey; }
    public String getEsslSecretKey() { return esslSecretKey; }
    public void setEsslSecretKey(String esslSecretKey) { this.esslSecretKey = esslSecretKey; }
    public String getEsslClientId() { return esslClientId; }
    public void setEsslClientId(String esslClientId) { this.esslClientId = esslClientId; }
    public String getEsslClientSecret() { return esslClientSecret; }
    public void setEsslClientSecret(String esslClientSecret) { this.esslClientSecret = esslClientSecret; }
    public String getEsslAccessToken() { return esslAccessToken; }
    public void setEsslAccessToken(String esslAccessToken) { this.esslAccessToken = esslAccessToken; }
    public String getEsslRefreshToken() { return esslRefreshToken; }
    public void setEsslRefreshToken(String esslRefreshToken) { this.esslRefreshToken = esslRefreshToken; }

    @Column(name = "ESSL_STATUS", columnDefinition = "NVARCHAR(50)")
    private String esslStatus;

    @Column(name = "ESSL_API_BASE_URL", columnDefinition = "NVARCHAR(500)")
    private String esslApiBaseUrl;

    @Column(name = "ESSL_API_KEY", columnDefinition = "NVARCHAR(255)")
    private String esslApiKey;

    @Column(name = "ESSL_SECRET_KEY", columnDefinition = "NVARCHAR(255)")
    private String esslSecretKey;

    @Column(name = "ESSL_CLIENT_ID", columnDefinition = "NVARCHAR(100)")
    private String esslClientId;

    @Column(name = "ESSL_CLIENT_SECRET", columnDefinition = "NVARCHAR(255)")
    private String esslClientSecret;

    @Column(name = "ESSL_ACCESS_TOKEN", columnDefinition = "NVARCHAR(MAX)")
    private String esslAccessToken;

    @Column(name = "ESSL_REFRESH_TOKEN", columnDefinition = "NVARCHAR(MAX)")
    private String esslRefreshToken;

    @Column(name = "ESSL_SYNC_INTERVAL_MINUTES")
    private Integer esslSyncIntervalMinutes = 15;

    public Integer getEsslSyncIntervalMinutes() {
        return (esslSyncIntervalMinutes == null || esslSyncIntervalMinutes < 10) ? 10 : esslSyncIntervalMinutes;
    }
    public void setEsslSyncIntervalMinutes(Integer esslSyncIntervalMinutes) {
        if (esslSyncIntervalMinutes != null && esslSyncIntervalMinutes < 10) {
            this.esslSyncIntervalMinutes = 10;
        } else {
            this.esslSyncIntervalMinutes = esslSyncIntervalMinutes;
        }
    }

    @OneToOne(mappedBy = "companyCredential", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private OcrConfig ocrConfig;

    @PrePersist
    protected void onCreate() {
        if (isActive == null)
            isActive = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Integer getStateCode() {
        return stateCode;
    }

    public void setStateCode(Integer stateCode) {
        this.stateCode = stateCode;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String getGstIn() {
        return gstIn;
    }

    public void setGstIn(String gstIn) {
        this.gstIn = gstIn;
    }

    public String getDbSourceName() {
        return dbSourceName;
    }

    public void setDbSourceName(String dbSourceName) {
        this.dbSourceName = dbSourceName;
    }

    public Date getLicRenewalDate() {
        return licRenewalDate;
    }

    public void setLicRenewalDate(Date licRenewalDate) {
        this.licRenewalDate = licRenewalDate;
    }

    public Date getLicExpiryDate() {
        return licExpiryDate;
    }

    public void setLicExpiryDate(Date licExpiryDate) {
        this.licExpiryDate = licExpiryDate;
    }

    public String getLogoFileName() {
        return logoFileName;
    }

    public void setLogoFileName(String logoFileName) {
        this.logoFileName = logoFileName;
    }

    public String getLogInBgFileName() {
        return logInBgFileName;
    }

    public void setLogInBgFileName(String logInBgFileName) {
        this.logInBgFileName = logInBgFileName;
    }



    public String getDirectoryPath() {
        return directoryPath;
    }

    public void setDirectoryPath(String directoryPath) {
        this.directoryPath = directoryPath;
    }

    public Long getLicExpRemainderDays() {
        return licExpRemainderDays;
    }

    public void setLicExpRemainderDays(Long licExpRemainderDays) {
        this.licExpRemainderDays = licExpRemainderDays;
    }

    public Integer getRestoreEnableDays() {
        return restoreEnableDays;
    }

    public void setRestoreEnableDays(Integer restoreEnableDays) {
        this.restoreEnableDays = restoreEnableDays;
    }

    public String getInputCaseStyle() {
        return inputCaseStyle;
    }

    public void setInputCaseStyle(String inputCaseStyle) {
        this.inputCaseStyle = inputCaseStyle;
    }

    public String getRegistrationNo() {
        return registrationNo;
    }

    public void setRegistrationNo(String registrationNo) {
        this.registrationNo = registrationNo;
    }

    public String getPanNo() {
        return panNo;
    }

    public void setPanNo(String panNo) {
        this.panNo = panNo;
    }

    public String getMobileNo() {
        return mobileNo;
    }

    public void setMobileNo(String mobileNo) {
        this.mobileNo = mobileNo;
    }

    public String getPhoneNo() {
        return phoneNo;
    }

    public void setPhoneNo(String phoneNo) {
        this.phoneNo = phoneNo;
    }

    public String getEmailId() {
        return emailId;
    }

    public void setEmailId(String emailId) {
        this.emailId = emailId;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getGmaplink() {
        return gmaplink;
    }

    public void setGmaplink(String gmaplink) {
        this.gmaplink = gmaplink;
    }

    public Integer getDecimalPlaces() {
        return decimalPlaces;
    }

    public void setDecimalPlaces(Integer decimalPlaces) {
        this.decimalPlaces = decimalPlaces;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public String getSmtpHost() {
        return smtpHost;
    }

    public void setSmtpHost(String smtpHost) {
        this.smtpHost = smtpHost;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("smtpServer")
    public String getSmtpServer() {
        return smtpHost;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("smtpServer")
    public void setSmtpServer(String smtpServer) {
        this.smtpHost = smtpServer;
    }


    public Integer getSmtpPort() {
        return smtpPort;
    }

    public void setSmtpPort(Integer smtpPort) {
        this.smtpPort = smtpPort;
    }

    public String getSmtpUsername() {
        return smtpUsername;
    }

    public void setSmtpUsername(String smtpUsername) {
        this.smtpUsername = smtpUsername;
    }

    public String getSmtpPassword() {
        return smtpPassword;
    }

    public void setSmtpPassword(String smtpPassword) {
        this.smtpPassword = smtpPassword;
    }

    public Boolean getSmtpSslEnabled() {
        return smtpSslEnabled;
    }

    public void setSmtpSslEnabled(Boolean smtpSslEnabled) {
        this.smtpSslEnabled = smtpSslEnabled;
    }

    public String getSupportEmail() {
        return supportEmail;
    }

    public void setSupportEmail(String supportEmail) {
        this.supportEmail = supportEmail;
    }

    public String getSupportPhone() {
        return supportPhone;
    }

    public void setSupportPhone(String supportPhone) {
        this.supportPhone = supportPhone;
    }

    public Boolean getAuditLogEnabled() {
        return auditLogEnabled;
    }

    public void setAuditLogEnabled(Boolean auditLogEnabled) {
        this.auditLogEnabled = auditLogEnabled;
    }

    public Integer getDefaultRowsPerPage() {
        return defaultRowsPerPage;
    }

    public void setDefaultRowsPerPage(Integer defaultRowsPerPage) {
        this.defaultRowsPerPage = defaultRowsPerPage;
    }

    public Integer getDefaultMaxRecords() {
        return defaultMaxRecords;
    }

    public void setDefaultMaxRecords(Integer defaultMaxRecords) {
        this.defaultMaxRecords = defaultMaxRecords;
    }

    public Integer getAutoLogoutSeconds() {
        return autoLogoutSeconds;
    }

    public void setAutoLogoutSeconds(Integer autoLogoutSeconds) {
        this.autoLogoutSeconds = autoLogoutSeconds;
    }

    public Boolean getAllowDuplicateScreens() {
        return allowDuplicateScreens;
    }

    public void setAllowDuplicateScreens(Boolean allowDuplicateScreens) {
        this.allowDuplicateScreens = allowDuplicateScreens;
    }

    private void ensureOcrConfigExists() {
        if (ocrConfig == null) {
            ocrConfig = new OcrConfig();
            ocrConfig.setCompanyCredential(this);
        }
    }

    public Boolean getAllowRightClick() {
        return allowRightClick;
    }

    public void setAllowRightClick(Boolean allowRightClick) {
        this.allowRightClick = allowRightClick;
    }

    public String getTimeFormat() {
        return timeFormat;
    }

    public void setTimeFormat(String timeFormat) {
        // Validate — only accept H24 or H12
        if (timeFormat != null && !timeFormat.equals("H24") && !timeFormat.equals("H12")) {
            throw new IllegalArgumentException("Invalid timeFormat: '" + timeFormat + "'. Accepted values: H24, H12");
        }
        this.timeFormat = (timeFormat == null) ? "H24" : timeFormat;
    }

    public String getDateFormat() {
        return dateFormat;
    }

    public void setDateFormat(String dateFormat) {
        // Validate — only accept known date format patterns
        if (dateFormat != null &&
            !dateFormat.equals("DD/MM/YYYY") &&
            !dateFormat.equals("MM/DD/YYYY") &&
            !dateFormat.equals("YYYY-MM-DD")) {
            throw new IllegalArgumentException("Invalid dateFormat: '" + dateFormat + "'. Accepted values: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD");
        }
        this.dateFormat = (dateFormat == null) ? "DD/MM/YYYY" : dateFormat;
    }

    public String getWeekStartsOn() {
        return weekStartsOn;
    }

    public void setWeekStartsOn(String weekStartsOn) {
        if (weekStartsOn != null &&
            !weekStartsOn.equals("MONDAY") &&
            !weekStartsOn.equals("SUNDAY") &&
            !weekStartsOn.equals("SATURDAY")) {
            throw new IllegalArgumentException("Invalid weekStartsOn: '" + weekStartsOn + "'. Accepted values: MONDAY, SUNDAY, SATURDAY");
        }
        this.weekStartsOn = (weekStartsOn == null) ? "MONDAY" : weekStartsOn;
    }

    public String getAppTimezone() {
        return appTimezone;
    }

    public void setAppTimezone(String appTimezone) {
        this.appTimezone = (appTimezone == null) ? "Asia/Kolkata" : appTimezone;
    }


    public String getOcrTenantId() {
        return ocrConfig != null ? ocrConfig.getOcrTenantId() : null;
    }

    public void setOcrTenantId(String ocrTenantId) {
        if (ocrTenantId == null && ocrConfig == null) return;
        ensureOcrConfigExists();
        ocrConfig.setOcrTenantId(ocrTenantId);
    }

    public String getOcrClientId() {
        return ocrConfig != null ? ocrConfig.getOcrClientId() : null;
    }

    public void setOcrClientId(String ocrClientId) {
        if (ocrClientId == null && ocrConfig == null) return;
        ensureOcrConfigExists();
        ocrConfig.setOcrClientId(ocrClientId);
    }

    public String getOcrClientSecret() {
        return ocrConfig != null ? ocrConfig.getOcrClientSecret() : null;
    }

    public void setOcrClientSecret(String ocrClientSecret) {
        if (ocrClientSecret == null && ocrConfig == null) return;
        ensureOcrConfigExists();
        ocrConfig.setOcrClientSecret(ocrClientSecret);
    }

    public String getOcrSharedMailbox() {
        return ocrConfig != null ? ocrConfig.getOcrSharedMailbox() : null;
    }

    public void setOcrSharedMailbox(String ocrSharedMailbox) {
        if (ocrSharedMailbox == null && ocrConfig == null) return;
        ensureOcrConfigExists();
        ocrConfig.setOcrSharedMailbox(ocrSharedMailbox);
    }

    public String getOcrProcessedFolder() {
        return ocrConfig != null ? ocrConfig.getOcrProcessedFolder() : null;
    }

    public void setOcrProcessedFolder(String ocrProcessedFolder) {
        if (ocrProcessedFolder == null && ocrConfig == null) return;
        ensureOcrConfigExists();
        ocrConfig.setOcrProcessedFolder(ocrProcessedFolder);
    }

    public String getAccessToken() {
        return ocrConfig != null ? ocrConfig.getAccessToken() : null;
    }

    public void setAccessToken(String accessToken) {
        if (accessToken == null && ocrConfig == null) return;
        ensureOcrConfigExists();
        ocrConfig.setAccessToken(accessToken);
    }

    public String getRefreshToken() {
        return ocrConfig != null ? ocrConfig.getRefreshToken() : null;
    }

    public void setRefreshToken(String refreshToken) {
        if (refreshToken == null && ocrConfig == null) return;
        ensureOcrConfigExists();
        ocrConfig.setRefreshToken(refreshToken);
    }

    public java.util.Date getExpiresAt() {
        return ocrConfig != null ? ocrConfig.getExpiresAt() : null;
    }

    public void setExpiresAt(java.util.Date expiresAt) {
        if (expiresAt == null && ocrConfig == null) return;
        ensureOcrConfigExists();
        ocrConfig.setExpiresAt(expiresAt);
    }

    public String getActiveEmailProvider() {
        return ocrConfig != null ? ocrConfig.getActiveEmailProvider() : "OUTLOOK";
    }

    public void setActiveEmailProvider(String activeEmailProvider) {
        ensureOcrConfigExists();
        ocrConfig.setActiveEmailProvider(activeEmailProvider);
    }

    public String getProviderConfigsJson() {
        return ocrConfig != null ? ocrConfig.getProviderConfigsJson() : null;
    }

    public void setProviderConfigsJson(String providerConfigsJson) {
        ensureOcrConfigExists();
        ocrConfig.setProviderConfigsJson(providerConfigsJson);
    }
}

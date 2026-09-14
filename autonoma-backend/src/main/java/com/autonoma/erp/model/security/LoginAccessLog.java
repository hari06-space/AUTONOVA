package com.autonoma.erp.model.security;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_LOGIN_ACCESS_LOG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", length = 50)
    private String userId;

    @Column(name = "USERNAME", length = 100)
    private String username;

    @Column(name = "COMPANY_ID")
    private Long companyId;

    @Column(name = "LOGIN_DATE_TIME", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date loginDateTime = new Date();

    @Column(name = "SOURCE_IP", length = 100)
    private String sourceIp;

    @Column(name = "DEVICE_IDENTIFIER", length = 255)
    private String deviceIdentifier;

    @Column(name = "MAC_ADDRESS", length = 100)
    private String macAddress;

    @Column(name = "ACCESS_CONTROL_METHOD", length = 50)
    private String accessControlMethod;

    /**
     * 'ALLOWED' or 'BLOCKED'
     */
    @Column(name = "LOGIN_STATUS", nullable = false, length = 50)
    private String loginStatus;

    @Column(name = "FAILURE_REASON", length = 100)
    private String failureReason;

    @Column(name = "USER_AGENT", length = 500)
    private String userAgent;

    @Column(name = "CREATED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Date getLoginDateTime() { return loginDateTime; }
    public void setLoginDateTime(Date loginDateTime) { this.loginDateTime = loginDateTime; }
    public String getSourceIp() { return sourceIp; }
    public void setSourceIp(String sourceIp) { this.sourceIp = sourceIp; }
    public String getDeviceIdentifier() { return deviceIdentifier; }
    public void setDeviceIdentifier(String deviceIdentifier) { this.deviceIdentifier = deviceIdentifier; }
    public String getMacAddress() { return macAddress; }
    public void setMacAddress(String macAddress) { this.macAddress = macAddress; }
    public String getAccessControlMethod() { return accessControlMethod; }
    public void setAccessControlMethod(String accessControlMethod) { this.accessControlMethod = accessControlMethod; }
    public String getLoginStatus() { return loginStatus; }
    public void setLoginStatus(String loginStatus) { this.loginStatus = loginStatus; }
    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
}

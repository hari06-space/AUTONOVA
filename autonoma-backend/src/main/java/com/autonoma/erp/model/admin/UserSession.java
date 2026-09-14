package com.autonoma.erp.model.admin;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_USER_SESSION_AUDIT")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class UserSession extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "USER_ID", columnDefinition = "NVARCHAR(50)")
    private String userId;

    @Column(name = "IP_ADDRESS", columnDefinition = "NVARCHAR(50)")
    private String ipAddress;

    @Column(name = "LOGIN_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date loginTime;

    @Column(name = "LOGOUT_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date logoutTime;

    @Column(name = "USER_AGENT", columnDefinition = "NVARCHAR(255)")
    private String userAgent;

    @Column(name = "SESSION_STATUS", columnDefinition = "NVARCHAR(20)")
    private String status; // ACTIVE, LOGGED_OUT, EXPIRED, REVOKED

    @Column(name = "SESSION_ID", columnDefinition = "NVARCHAR(100)")
    private String sessionId;

    @Column(name = "DEVICE_ID", columnDefinition = "NVARCHAR(100)")
    private String deviceId;

    @Column(name = "DEVICE_NAME", columnDefinition = "NVARCHAR(100)")
    private String deviceName;

    @Column(name = "LAST_ACTIVITY")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastActivity;

    @Column(name = "LOGOUT_REASON", columnDefinition = "NVARCHAR(50)")
    private String logoutReason;

    @Column(name = "FORCED_BY_USER_ID", columnDefinition = "NVARCHAR(50)")
    private String forcedByUserId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public Date getLoginTime() { return loginTime; }
    public void setLoginTime(Date loginTime) { this.loginTime = loginTime; }
    public Date getLogoutTime() { return logoutTime; }
    public void setLogoutTime(Date logoutTime) { this.logoutTime = logoutTime; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
    public Date getLastActivity() { return lastActivity; }
    public void setLastActivity(Date lastActivity) { this.lastActivity = lastActivity; }
    public String getLogoutReason() { return logoutReason; }
    public void setLogoutReason(String logoutReason) { this.logoutReason = logoutReason; }
    public String getForcedByUserId() { return forcedByUserId; }
    public void setForcedByUserId(String forcedByUserId) { this.forcedByUserId = forcedByUserId; }
}

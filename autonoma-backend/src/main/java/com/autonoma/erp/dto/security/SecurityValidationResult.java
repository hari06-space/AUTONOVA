package com.autonoma.erp.dto.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class SecurityValidationResult {
    private boolean allowed;
    private String reason;
    private String userMessage;
    private String resolvedIp;
    private String resolvedDeviceId;
    private String resolvedMac;

    public SecurityValidationResult() {}

    public SecurityValidationResult(boolean allowed, String reason, String userMessage, String resolvedIp, String resolvedDeviceId, String resolvedMac) {
        this.allowed = allowed;
        this.reason = reason;
        this.userMessage = userMessage;
        this.resolvedIp = resolvedIp;
        this.resolvedDeviceId = resolvedDeviceId;
        this.resolvedMac = resolvedMac;
    }

    public boolean isAllowed() { return allowed; }
    public void setAllowed(boolean allowed) { this.allowed = allowed; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getUserMessage() { return userMessage; }
    public void setUserMessage(String userMessage) { this.userMessage = userMessage; }
    public String getResolvedIp() { return resolvedIp; }
    public void setResolvedIp(String resolvedIp) { this.resolvedIp = resolvedIp; }
    public String getResolvedDeviceId() { return resolvedDeviceId; }
    public void setResolvedDeviceId(String resolvedDeviceId) { this.resolvedDeviceId = resolvedDeviceId; }
    public String getResolvedMac() { return resolvedMac; }
    public void setResolvedMac(String resolvedMac) { this.resolvedMac = resolvedMac; }

    public static SecurityValidationResult allowed(String reason, String ip, String deviceId, String mac) {
        return new SecurityValidationResult(true, reason, "ACCESS GRANTED", ip, deviceId, mac);
    }

    public static SecurityValidationResult blocked(String reason, String ip, String deviceId, String mac) {
        return new SecurityValidationResult(false, reason, "ACCESS DENIED: This device or network is not authorized to access BOSS ERP. Please contact your BOSS Administrator.", ip, deviceId, mac);
    }
}

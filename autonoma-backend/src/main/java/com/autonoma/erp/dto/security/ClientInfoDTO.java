package com.autonoma.erp.dto.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientInfoDTO {
    private String clientIp;
    private String userAgent;
    private String suggestedDeviceCode;
    private String suggestedDeviceName;

    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public String getSuggestedDeviceCode() { return suggestedDeviceCode; }
    public void setSuggestedDeviceCode(String suggestedDeviceCode) { this.suggestedDeviceCode = suggestedDeviceCode; }
    public String getSuggestedDeviceName() { return suggestedDeviceName; }
    public void setSuggestedDeviceName(String suggestedDeviceName) { this.suggestedDeviceName = suggestedDeviceName; }
}

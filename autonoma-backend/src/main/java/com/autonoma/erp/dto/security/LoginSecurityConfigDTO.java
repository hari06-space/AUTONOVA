package com.autonoma.erp.dto.security;

import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginSecurityConfigDTO {
    private Long id;
    private Long companyId;
    private Boolean securityEnabled;
    private String accessControlMethod; // 'IP', 'DEVICE', 'IP_DEVICE'
    private Boolean status;
    private Long activeIpCount;
    private Long activeDeviceCount;
    private Long recentBlockedCount;
    private String createdBy;
    private Date createdDate;
    private String updatedBy;
    private Date updatedDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Boolean getSecurityEnabled() { return securityEnabled; }
    public void setSecurityEnabled(Boolean securityEnabled) { this.securityEnabled = securityEnabled; }
    public String getAccessControlMethod() { return accessControlMethod; }
    public void setAccessControlMethod(String accessControlMethod) { this.accessControlMethod = accessControlMethod; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
    public Long getActiveIpCount() { return activeIpCount; }
    public void setActiveIpCount(Long activeIpCount) { this.activeIpCount = activeIpCount; }
    public Long getActiveDeviceCount() { return activeDeviceCount; }
    public void setActiveDeviceCount(Long activeDeviceCount) { this.activeDeviceCount = activeDeviceCount; }
    public Long getRecentBlockedCount() { return recentBlockedCount; }
    public void setRecentBlockedCount(Long recentBlockedCount) { this.recentBlockedCount = recentBlockedCount; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }

    @JsonSetter("status")
    public void setStatusValue(Object val) {
        if (val == null) {
            this.status = true;
        } else if (val instanceof Boolean b) {
            this.status = b;
        } else if (val instanceof Number n) {
            this.status = n.intValue() == 1;
        } else if (val instanceof String s) {
            this.status = "ACTIVE".equalsIgnoreCase(s.trim()) || "1".equals(s.trim()) || "TRUE".equalsIgnoreCase(s.trim());
        } else {
            this.status = true;
        }
    }
}

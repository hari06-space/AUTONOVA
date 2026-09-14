package com.autonoma.erp.model.security;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_LOGIN_ACCESS_CONFIG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginAccessConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "COMPANY_ID", nullable = false, unique = true)
    private Long companyId;

    @Column(name = "SECURITY_ENABLED", nullable = false)
    private Boolean securityEnabled = false;

    /**
     * Access Control Method: 'IP', 'DEVICE', 'IP_DEVICE'
     */
    @Column(name = "ACCESS_CONTROL_METHOD", nullable = false, length = 50)
    private String accessControlMethod = "IP";

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
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
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}

package com.autonoma.erp.modules.platform.identity.entity;

import com.autonoma.erp.model.admin.CompanyCredential;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "CLI_CLIENT_SERVER_CONFIG", indexes = {
    @Index(name = "IDX_CLI_SERVER_CLIENT_ID", columnList = "CLIENT_ID")
})
public class CliClientServerConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CLIENT_ID", nullable = false)
    private Long clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CLIENT_ID", referencedColumnName = "id", insertable = false, updatable = false, foreignKey = @ForeignKey(name = "FK_CLI_SERVER_COMPANY"))
    private CompanyCredential companyCredential;

    @Column(name = "HEALTH_MONITORING_ENABLED")
    private Boolean healthMonitoringEnabled = false;

    @Column(name = "SERVER_NAME", length = 150)
    private String serverName;

    @Column(name = "SERVER_IP", length = 50)
    private String serverIp;

    @Column(name = "SERVER_PORT")
    private Integer serverPort;

    @Column(name = "WINDOWS_USERNAME", length = 100)
    private String windowsUsername;

    @Column(name = "WINDOWS_PASSWORD", length = 500)
    private String windowsPassword;

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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public CompanyCredential getCompanyCredential() { return companyCredential; }
    public void setCompanyCredential(CompanyCredential companyCredential) { this.companyCredential = companyCredential; }

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

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

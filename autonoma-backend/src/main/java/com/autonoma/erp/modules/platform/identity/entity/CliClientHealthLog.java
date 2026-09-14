package com.autonoma.erp.modules.platform.identity.entity;

import com.autonoma.erp.model.admin.CompanyCredential;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "CLI_CLIENT_HEALTH_LOG", indexes = {
    @Index(name = "IDX_CLI_HEALTH_CLIENT_ID", columnList = "CLIENT_ID"),
    @Index(name = "IDX_CLI_HEALTH_LOGGED_AT", columnList = "LOGGED_AT")
})
public class CliClientHealthLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CLIENT_ID", nullable = false)
    private Long clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CLIENT_ID", referencedColumnName = "id", insertable = false, updatable = false, foreignKey = @ForeignKey(name = "FK_CLI_HEALTH_COMPANY"))
    private CompanyCredential companyCredential;

    @Column(name = "SERVER_NAME", length = 150)
    private String serverName;

    @Column(name = "SERVER_IP", length = 50)
    private String serverIp;

    @Column(name = "CPU_USAGE_PCT")
    private Double cpuUsagePct;

    @Column(name = "MEMORY_USAGE_PCT")
    private Double memoryUsagePct;

    @Column(name = "DISK_USAGE_PCT")
    private Double diskUsagePct;

    @Column(name = "SQL_SERVER_STATUS", length = 20)
    private String sqlServerStatus = "ONLINE"; // ONLINE, OFFLINE

    @Column(name = "APPLICATION_STATUS", length = 20)
    private String applicationStatus = "ONLINE"; // ONLINE, OFFLINE

    @Column(name = "NETWORK_STATUS", length = 20)
    private String networkStatus = "ONLINE"; // ONLINE, OFFLINE

    @Column(name = "NETWORK_LATENCY_MS")
    private Long networkLatencyMs;

    @Column(name = "SERVER_UPTIME_SECONDS")
    private Long serverUptimeSeconds;

    @Column(name = "OVERALL_STATUS", length = 20)
    private String overallStatus = "HEALTHY"; // HEALTHY, WARNING, CRITICAL

    @Column(name = "LOGGED_AT", nullable = false)
    private LocalDateTime loggedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public CompanyCredential getCompanyCredential() { return companyCredential; }
    public void setCompanyCredential(CompanyCredential companyCredential) { this.companyCredential = companyCredential; }

    public String getServerName() { return serverName; }
    public void setServerName(String serverName) { this.serverName = serverName; }

    public String getServerIp() { return serverIp; }
    public void setServerIp(String serverIp) { this.serverIp = serverIp; }

    public Double getCpuUsagePct() { return cpuUsagePct; }
    public void setCpuUsagePct(Double cpuUsagePct) { this.cpuUsagePct = cpuUsagePct; }

    public Double getMemoryUsagePct() { return memoryUsagePct; }
    public void setMemoryUsagePct(Double memoryUsagePct) { this.memoryUsagePct = memoryUsagePct; }

    public Double getDiskUsagePct() { return diskUsagePct; }
    public void setDiskUsagePct(Double diskUsagePct) { this.diskUsagePct = diskUsagePct; }

    public String getSqlServerStatus() { return sqlServerStatus; }
    public void setSqlServerStatus(String sqlServerStatus) { this.sqlServerStatus = sqlServerStatus; }

    public String getApplicationStatus() { return applicationStatus; }
    public void setApplicationStatus(String applicationStatus) { this.applicationStatus = applicationStatus; }

    public String getNetworkStatus() { return networkStatus; }
    public void setNetworkStatus(String networkStatus) { this.networkStatus = networkStatus; }

    public Long getNetworkLatencyMs() { return networkLatencyMs; }
    public void setNetworkLatencyMs(Long networkLatencyMs) { this.networkLatencyMs = networkLatencyMs; }

    public Long getServerUptimeSeconds() { return serverUptimeSeconds; }
    public void setServerUptimeSeconds(Long serverUptimeSeconds) { this.serverUptimeSeconds = serverUptimeSeconds; }

    public String getOverallStatus() { return overallStatus; }
    public void setOverallStatus(String overallStatus) { this.overallStatus = overallStatus; }

    public LocalDateTime getLoggedAt() { return loggedAt; }
    public void setLoggedAt(LocalDateTime loggedAt) { this.loggedAt = loggedAt; }
}

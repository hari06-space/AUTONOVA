package com.autonoma.erp.modules.platform.identity.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ClientHealthDTO {

    private String clientCode;
    private String clientName;
    private String serverName;
    private String serverIp;

    private Boolean healthMonitoringEnabled;

    // Overall Status
    private String overallStatus; // HEALTHY, WARNING, CRITICAL

    // Modern KPI Cards
    private String serverStatus; // ONLINE, OFFLINE
    private Double cpuUsagePct;
    private Double memoryUsagePct;
    private Double diskUsagePct;

    private String sqlServerStatus; // ONLINE, OFFLINE
    private String applicationStatus; // ONLINE, OFFLINE
    private String networkStatus; // ONLINE, OFFLINE
    private Long networkLatencyMs;
    private String serverUptime; // e.g. "14 Days 6 Hours"
    private String systemConfig; // e.g. "Win 11 x64 | 8 Cores | 16 GB RAM"

    private LocalDateTime lastUpdated;

    // Active Alerts List
    private List<ClientAlertDTO> activeAlerts;

    // Historical Trend Data Points
    private List<HealthTrendPointDTO> trendPoints;

    public static class ClientAlertDTO {
        private String severity; // WARNING, CRITICAL, INFO
        private String title;
        private String description;
        private LocalDateTime timestamp;

        public ClientAlertDTO() {}

        public ClientAlertDTO(String severity, String title, String description, LocalDateTime timestamp) {
            this.severity = severity;
            this.title = title;
            this.description = description;
            this.timestamp = timestamp;
        }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }

    public static class HealthTrendPointDTO {
        private String timestampStr;
        private Double cpuUsagePct;
        private Double memoryUsagePct;
        private Double diskUsagePct;

        public HealthTrendPointDTO() {}

        public HealthTrendPointDTO(String timestampStr, Double cpuUsagePct, Double memoryUsagePct, Double diskUsagePct) {
            this.timestampStr = timestampStr;
            this.cpuUsagePct = cpuUsagePct;
            this.memoryUsagePct = memoryUsagePct;
            this.diskUsagePct = diskUsagePct;
        }

        public String getTimestampStr() { return timestampStr; }
        public void setTimestampStr(String timestampStr) { this.timestampStr = timestampStr; }

        public Double getCpuUsagePct() { return cpuUsagePct; }
        public void setCpuUsagePct(Double cpuUsagePct) { this.cpuUsagePct = cpuUsagePct; }

        public Double getMemoryUsagePct() { return memoryUsagePct; }
        public void setMemoryUsagePct(Double memoryUsagePct) { this.memoryUsagePct = memoryUsagePct; }

        public Double getDiskUsagePct() { return diskUsagePct; }
        public void setDiskUsagePct(Double diskUsagePct) { this.diskUsagePct = diskUsagePct; }
    }

    // Getters and Setters
    public String getClientCode() { return clientCode; }
    public void setClientCode(String clientCode) { this.clientCode = clientCode; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getServerName() { return serverName; }
    public void setServerName(String serverName) { this.serverName = serverName; }

    public String getServerIp() { return serverIp; }
    public void setServerIp(String serverIp) { this.serverIp = serverIp; }

    public Boolean getHealthMonitoringEnabled() { return healthMonitoringEnabled; }
    public void setHealthMonitoringEnabled(Boolean healthMonitoringEnabled) { this.healthMonitoringEnabled = healthMonitoringEnabled; }

    public String getOverallStatus() { return overallStatus; }
    public void setOverallStatus(String overallStatus) { this.overallStatus = overallStatus; }

    public String getServerStatus() { return serverStatus; }
    public void setServerStatus(String serverStatus) { this.serverStatus = serverStatus; }

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

    public String getServerUptime() { return serverUptime; }
    public void setServerUptime(String serverUptime) { this.serverUptime = serverUptime; }

    public String getSystemConfig() { return systemConfig; }
    public void setSystemConfig(String systemConfig) { this.systemConfig = systemConfig; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }

    public List<ClientAlertDTO> getActiveAlerts() { return activeAlerts; }
    public void setActiveAlerts(List<ClientAlertDTO> activeAlerts) { this.activeAlerts = activeAlerts; }

    public List<HealthTrendPointDTO> getTrendPoints() { return trendPoints; }
    public void setTrendPoints(List<HealthTrendPointDTO> trendPoints) { this.trendPoints = trendPoints; }
}

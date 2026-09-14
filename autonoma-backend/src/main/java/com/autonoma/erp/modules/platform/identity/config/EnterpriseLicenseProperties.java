package com.autonoma.erp.modules.platform.identity.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "autonoma.license.server")
@Data
public class EnterpriseLicenseProperties {

    /**
     * Domain name of the License Server (e.g. nutech.autonoma-system.com)
     */
    private String domain;

    /**
     * Database Port (default 1433)
     */
    private int port = 1433;

    /**
     * Database Name (default NUTECH_LIVE)
     */
    private String databaseName = "NUTECH_LIVE";

    /**
     * JDBC URL for the Source Database (License / Master Server).
     */
    private String url;

    /**
     * Username for Source Database connection.
     */
    private String username;

    /**
     * Password for Source Database connection.
     */
    private String password;

    /**
     * Fallback Domain Name (e.g. license-backup.autonoma-system.com)
     */
    private String fallbackDomain;

    /**
     * Fallback JDBC URL if primary domain lookup fails.
     */
    private String fallbackUrl;

    /**
     * JDBC Driver Class Name.
     */
    private String driverClassName = "com.microsoft.sqlserver.jdbc.SQLServerDriver";

    /**
     * Cache TTL for validation results in minutes.
     */
    private int cacheTtlMinutes = 10;

    /**
     * Max retry attempts for Source Database connection.
     */
    private int maxRetries = 3;

    /**
     * Delay between retry attempts in milliseconds.
     */
    private long retryDelayMs = 1500;

    /**
     * Warning threshold in days before license expiration.
     */
    private int warningDays = 30;

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }
    public String getDatabaseName() { return databaseName; }
    public void setDatabaseName(String databaseName) { this.databaseName = databaseName; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFallbackDomain() { return fallbackDomain; }
    public void setFallbackDomain(String fallbackDomain) { this.fallbackDomain = fallbackDomain; }
    public String getFallbackUrl() { return fallbackUrl; }
    public void setFallbackUrl(String fallbackUrl) { this.fallbackUrl = fallbackUrl; }
    public String getDriverClassName() { return driverClassName; }
    public void setDriverClassName(String driverClassName) { this.driverClassName = driverClassName; }
    public int getCacheTtlMinutes() { return cacheTtlMinutes; }
    public void setCacheTtlMinutes(int cacheTtlMinutes) { this.cacheTtlMinutes = cacheTtlMinutes; }
    public int getMaxRetries() { return maxRetries; }
    public void setMaxRetries(int maxRetries) { this.maxRetries = maxRetries; }
    public long getRetryDelayMs() { return retryDelayMs; }
    public void setRetryDelayMs(long retryDelayMs) { this.retryDelayMs = retryDelayMs; }
    public int getWarningDays() { return warningDays; }
    public void setWarningDays(int warningDays) { this.warningDays = warningDays; }
}

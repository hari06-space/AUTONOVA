package com.autonoma.erp.modules.platform.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class DatabaseConnectionRequestDTO {

    @NotBlank(message = "Database Type is required")
    private String dbType;

    @NotBlank(message = "Server / Host is required")
    private String dbHost;

    @NotNull(message = "Port is required")
    private Integer dbPort;

    @NotBlank(message = "Username is required")
    private String dbUsername;

    @NotBlank(message = "Password is required")
    private String dbPassword;

    private String dbName;

    public String getDbType() { return dbType; }
    public void setDbType(String dbType) { this.dbType = dbType; }

    public String getDbHost() { return dbHost; }
    public void setDbHost(String dbHost) { this.dbHost = dbHost; }

    public Integer getDbPort() { return dbPort; }
    public void setDbPort(Integer dbPort) { this.dbPort = dbPort; }

    public String getDbUsername() { return dbUsername; }
    public void setDbUsername(String dbUsername) { this.dbUsername = dbUsername; }

    public String getDbPassword() { return dbPassword; }
    public void setDbPassword(String dbPassword) { this.dbPassword = dbPassword; }

    public String getDbName() { return dbName; }
    public void setDbName(String dbName) { this.dbName = dbName; }

    private String backupFolder;
    private Boolean download;

    public String getBackupFolder() { return backupFolder; }
    public void setBackupFolder(String backupFolder) { this.backupFolder = backupFolder; }

    public Boolean getDownload() { return download; }
    public void setDownload(Boolean download) { this.download = download; }
}

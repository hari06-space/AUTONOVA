package com.autonoma.erp.modules.platform.datamigration.dto;

import lombok.Data;

/**
 * Secure request body DTO for data migration operations.
 * Credentials are accepted via request body (not URL params) to avoid
 * exposure in server access logs, browser history, and HTTP caches.
 */
@Data
public class MigrationRequest {
    private String secondaryDbName;
    private String oldAttachmentPath;
    private String path;

    // SQL Server credentials (not stored, only used per-request)
    private String sqlIp;
    private String sqlUsername;
    private String sqlPassword;

    // File server / SMB credentials (not stored, only used per-request)
    private String fileIp;
    private String fileUsername;
    private String filePassword;

    private Boolean skipAttachments;

    public String getSecondaryDbName() { return secondaryDbName; }
    public void setSecondaryDbName(String secondaryDbName) { this.secondaryDbName = secondaryDbName; }
    public String getOldAttachmentPath() { return oldAttachmentPath; }
    public void setOldAttachmentPath(String oldAttachmentPath) { this.oldAttachmentPath = oldAttachmentPath; }
    public String getPath() { return path != null ? path : oldAttachmentPath; }
    public void setPath(String path) { this.path = path; }
    public String getSqlIp() { return sqlIp; }
    public void setSqlIp(String sqlIp) { this.sqlIp = sqlIp; }
    public String getSqlUsername() { return sqlUsername; }
    public void setSqlUsername(String sqlUsername) { this.sqlUsername = sqlUsername; }
    public String getSqlPassword() { return sqlPassword; }
    public void setSqlPassword(String sqlPassword) { this.sqlPassword = sqlPassword; }
    public String getFileIp() { return fileIp; }
    public void setFileIp(String fileIp) { this.fileIp = fileIp; }
    public String getFileUsername() { return fileUsername; }
    public void setFileUsername(String fileUsername) { this.fileUsername = fileUsername; }
    public String getFilePassword() { return filePassword; }
    public void setFilePassword(String filePassword) { this.filePassword = filePassword; }
    public Boolean getSkipAttachments() { return skipAttachments; }
    public void setSkipAttachments(Boolean skipAttachments) { this.skipAttachments = skipAttachments; }
}

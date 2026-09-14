package com.autonoma.erp.modules.platform.datamigration.dto;

import lombok.Data;

@Data
public class MigrationProgress {
    private int totalRecords;
    private int migratedRecords;
    private int pendingRecords;
    private int failedRecords;
    private String status; // "IN_PROGRESS", "COMPLETED", "FAILED", "NOT_STARTED"
    private String message;
    private long startTime;

    public MigrationProgress() {
        this.status = "NOT_STARTED";
        this.startTime = System.currentTimeMillis();
    }

    public MigrationProgress(int totalRecords, int migratedRecords, int pendingRecords, String status) {
        this.totalRecords = totalRecords;
        this.migratedRecords = migratedRecords;
        this.pendingRecords = pendingRecords;
        this.failedRecords = 0;
        this.status = status;
        this.startTime = System.currentTimeMillis();
    }

    public MigrationProgress(int totalRecords, int migratedRecords, int pendingRecords, int failedRecords, String status) {
        this.totalRecords = totalRecords;
        this.migratedRecords = migratedRecords;
        this.pendingRecords = pendingRecords;
        this.failedRecords = failedRecords;
        this.status = status;
    }
    
    public void update(int migrated) {
        this.migratedRecords = migrated;
        this.pendingRecords = Math.max(0, this.totalRecords - (this.migratedRecords + this.failedRecords));
    }

    public void update(int migrated, int failed) {
        this.migratedRecords = migrated;
        this.failedRecords = failed;
        this.pendingRecords = Math.max(0, this.totalRecords - (this.migratedRecords + this.failedRecords));
    }

    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }
    public int getMigratedRecords() { return migratedRecords; }
    public void setMigratedRecords(int migratedRecords) { this.migratedRecords = migratedRecords; }
    public int getPendingRecords() { return pendingRecords; }
    public void setPendingRecords(int pendingRecords) { this.pendingRecords = pendingRecords; }
    public int getFailedRecords() { return failedRecords; }
    public void setFailedRecords(int failedRecords) { this.failedRecords = failedRecords; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public long getStartTime() { return startTime; }
    public void setStartTime(long startTime) { this.startTime = startTime; }
    public long getElapsedSeconds() {
        if (startTime <= 0) return 0;
        return Math.max(0, (System.currentTimeMillis() - startTime) / 1000);
    }
}


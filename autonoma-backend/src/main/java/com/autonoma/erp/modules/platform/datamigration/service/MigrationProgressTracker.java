package com.autonoma.erp.modules.platform.datamigration.service;

import com.autonoma.erp.modules.platform.datamigration.dto.MigrationProgress;
import java.util.concurrent.ConcurrentHashMap;

public class MigrationProgressTracker {
    public static final ConcurrentHashMap<String, MigrationProgress> progressMap = new ConcurrentHashMap<>();
    public static final ConcurrentHashMap<String, Boolean> stopFlags = new ConcurrentHashMap<>();
    public static volatile boolean globalStopFlag = false;

    public static void start(String migrationId, int totalRecords) {
        if (migrationId != null) {
            stopFlags.put(migrationId, false);
        }
        globalStopFlag = false;
        progressMap.put(migrationId, new MigrationProgress(totalRecords, 0, totalRecords, 0, "IN_PROGRESS"));
    }

    public static void requestStop() {
        globalStopFlag = true;
        for (String key : stopFlags.keySet()) {
            stopFlags.put(key, true);
        }
        for (MigrationProgress p : progressMap.values()) {
            if ("IN_PROGRESS".equals(p.getStatus())) {
                p.setStatus("STOPPED");
            }
        }
    }

    public static void requestStop(String migrationId) {
        if (migrationId != null && !migrationId.trim().isEmpty()) {
            stopFlags.put(migrationId, true);
            MigrationProgress p = progressMap.get(migrationId);
            if (p != null && "IN_PROGRESS".equals(p.getStatus())) {
                p.setStatus("STOPPED");
            }
        } else {
            requestStop();
        }
    }

    public static boolean isStopRequested(String migrationId) {
        if (globalStopFlag) return true;
        if (migrationId == null) return false;
        return Boolean.TRUE.equals(stopFlags.get(migrationId));
    }

    public static void resetStop(String migrationId) {
        if (migrationId != null) {
            stopFlags.put(migrationId, false);
        }
        globalStopFlag = false;
    }

    public static void stop(String migrationId, int migratedRecords, int failedRecords, String message) {
        MigrationProgress progress = progressMap.get(migrationId);
        if (progress != null) {
            progress.setMigratedRecords(migratedRecords);
            progress.setFailedRecords(failedRecords);
            progress.setStatus("STOPPED");
            progress.setMessage(message);
        } else {
            MigrationProgress newProg = new MigrationProgress(migratedRecords + failedRecords, migratedRecords, 0, failedRecords, "STOPPED");
            newProg.setMessage(message);
            progressMap.put(migrationId, newProg);
        }
    }

    public static void update(String migrationId, int migratedRecords) {
        MigrationProgress progress = progressMap.get(migrationId);
        if (progress != null) {
            progress.update(migratedRecords);
        }
    }

    public static void update(String migrationId, int migratedRecords, int failedRecords) {
        MigrationProgress progress = progressMap.get(migrationId);
        if (progress != null) {
            progress.update(migratedRecords, failedRecords);
        }
    }

    public static void complete(String migrationId) {
        MigrationProgress progress = progressMap.get(migrationId);
        if (progress != null) {
            progress.setStatus("COMPLETED");
            progress.setPendingRecords(0);
        }
    }

    public static void complete(String migrationId, int migratedRecords, int failedRecords, String message) {
        MigrationProgress progress = progressMap.get(migrationId);
        if (progress != null) {
            progress.setMigratedRecords(migratedRecords);
            progress.setFailedRecords(failedRecords);
            progress.setPendingRecords(0);
            progress.setStatus("COMPLETED");
            progress.setMessage(message);
        } else {
            MigrationProgress newProg = new MigrationProgress(migratedRecords + failedRecords, migratedRecords, 0, failedRecords, "COMPLETED");
            newProg.setMessage(message);
            progressMap.put(migrationId, newProg);
        }
    }

    public static void fail(String migrationId) {
        MigrationProgress progress = progressMap.get(migrationId);
        if (progress != null) {
            progress.setStatus("FAILED");
        } else {
            progressMap.put(migrationId, new MigrationProgress(0, 0, 0, 0, "FAILED"));
        }
    }

    public static void fail(String migrationId, String message) {
        MigrationProgress progress = progressMap.get(migrationId);
        if (progress != null) {
            progress.setStatus("FAILED");
            progress.setMessage(message);
        } else {
            MigrationProgress newProg = new MigrationProgress(0, 0, 0, 0, "FAILED");
            newProg.setMessage(message);
            progressMap.put(migrationId, newProg);
        }
    }

    public static MigrationProgress getProgress(String migrationId) {
        return progressMap.get(migrationId);
    }
}


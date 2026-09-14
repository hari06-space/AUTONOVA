package com.autonoma.erp.service.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientDbSyncResult implements Serializable {
    private boolean success;
    private boolean skipped;
    private String action; // "UPDATED", "OVERWRITTEN_DEFAULT", "INSERTED", "SKIPPED", "FAILED"
    private String message;
    private String clientCode;
    private String dbName;
    private String dbHost;

    @Builder.Default
    private java.util.List<String> pushedFields = new java.util.ArrayList<>();
    @Builder.Default
    private java.util.List<String> pulledFields = new java.util.ArrayList<>();
    private boolean reverseSyncExecuted;
    private boolean seedRecordDetected;

    public static ClientDbSyncResult skipped(String reason) {
        return ClientDbSyncResult.builder()
                .success(true)
                .skipped(true)
                .action("SKIPPED")
                .message(reason)
                .build();
    }

    public static ClientDbSyncResult success(String action, String message, String clientCode, String dbName, String dbHost) {
        return ClientDbSyncResult.builder()
                .success(true)
                .skipped(false)
                .action(action)
                .message(message)
                .clientCode(clientCode)
                .dbName(dbName)
                .dbHost(dbHost)
                .build();
    }

    public static ClientDbSyncResult failed(String message, String clientCode, String dbName, String dbHost) {
        return ClientDbSyncResult.builder()
                .success(false)
                .skipped(false)
                .action("FAILED")
                .message(message)
                .clientCode(clientCode)
                .dbName(dbName)
                .dbHost(dbHost)
                .build();
    }
}

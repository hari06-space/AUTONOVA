package com.autonoma.erp.modules.hr.attendance.service;

import com.autonoma.erp.config.essl.EsslDataSourceContextHolder;
import com.autonoma.erp.config.essl.EsslDataSourceService;
import com.autonoma.erp.modules.hr.attendance.entity.ClientEsslConfig;
import com.autonoma.erp.modules.hr.attendance.repository.ClientEsslConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;

/**
 * Multi-tenant orchestrator for ESSL biometric attendance migration.
 * Iterates configured clients, sets the ESSL datasource context, and delegates to {@link EsslSyncService}.
 */
@Service
public class AttendanceMigrationService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceMigrationService.class);

    @Autowired
    private ClientEsslConfigRepository configRepository;

    @Autowired
    private EsslSyncService esslSyncService;

    /**
     * Runs migration for every active client in CLIENT_ESSL_CONFIG.
     * Falls back to the DEFAULT datasource (from application.properties) when no DB configs exist.
     */
    public Map<String, Object> runMigrationForAllClients() {
        List<ClientEsslConfig> clients = configRepository.findByIsActiveTrue();
        Map<String, Object> summary = new LinkedHashMap<>();
        List<Map<String, Object>> clientResults = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        if (clients.isEmpty()) {
            log.info("No CLIENT_ESSL_CONFIG rows found; running migration against DEFAULT datasource");
            Map<String, Object> defaultResult = runMigrationForClientId(EsslDataSourceService.DEFAULT_CLIENT_ID, null);
            summary.put("totalClients", 1);
            summary.put("successCount", Boolean.TRUE.equals(defaultResult.get("success")) ? 1 : 0);
            summary.put("failureCount", Boolean.TRUE.equals(defaultResult.get("success")) ? 0 : 1);
            summary.put("clientResults", List.of(defaultResult));
            summary.put("success", Boolean.TRUE.equals(defaultResult.get("success")));
            return summary;
        }

        for (ClientEsslConfig client : clients) {
            Map<String, Object> result = runMigrationForClient(client);
            clientResults.add(result);
            if (Boolean.TRUE.equals(result.get("success"))) {
                successCount++;
            } else {
                failureCount++;
            }
        }

        summary.put("totalClients", clients.size());
        summary.put("successCount", successCount);
        summary.put("failureCount", failureCount);
        summary.put("clientResults", clientResults);
        summary.put("success", failureCount == 0);
        summary.put("message", String.format("Migration completed for %d client(s): %d succeeded, %d failed.",
                clients.size(), successCount, failureCount));
        return summary;
    }

    public Map<String, Object> runMigrationForClient(ClientEsslConfig client) {
        return runMigrationForClientId(client.getClientId(), client);
    }

    public Map<String, Object> runMigrationForClientId(String clientId, ClientEsslConfig configOverride) {
        String normalizedId = clientId != null ? clientId.trim().toUpperCase() : EsslDataSourceService.DEFAULT_CLIENT_ID;
        ClientEsslConfig config = configOverride;

        if (config == null && !EsslDataSourceService.DEFAULT_CLIENT_ID.equals(normalizedId)) {
            config = configRepository.findByClientIdAndIsActiveTrue(normalizedId).orElse(null);
            if (config == null) {
                Map<String, Object> err = new HashMap<>();
                err.put("clientId", normalizedId);
                err.put("success", false);
                err.put("message", "No active ESSL config found for client: " + normalizedId);
                return err;
            }
        }

        try {
            EsslDataSourceContextHolder.setClientId(normalizedId);
            log.info("Starting ESSL migration for client: {}", normalizedId);

            Map<String, Object> result;
            if (config != null && "POLLING".equalsIgnoreCase(config.getSyncMode())) {
                result = esslSyncService.syncRecentFromEssl(
                        config.getEsslTableName(),
                        config.getEmpCdColumn(),
                        config.getDateColumn(),
                        config.getInTimeColumn(),
                        config.getOutTimeColumn()
                );
            } else {
                LocalDate today = LocalDate.now();
                String month = today.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
                int year = today.getYear();

                String tableName = config != null ? config.getEsslTableName() : "ESSL_ATTENDANCE_LOG";
                String empCol = config != null ? config.getEmpCdColumn() : "EMP_CD";
                String dateCol = config != null ? config.getDateColumn() : "ATTENDANCE_DATE";
                String inCol = config != null ? config.getInTimeColumn() : "IN_TIME";
                String outCol = config != null ? config.getOutTimeColumn() : "OUT_TIME";

                result = esslSyncService.syncFromEssl(
                        tableName, empCol, dateCol, inCol, outCol, month, year
                );
            }

            result.put("clientId", normalizedId);
            if (config != null) {
                result.put("clientName", config.getClientName());
            }
            return result;
        } catch (Exception e) {
            log.error("ESSL migration failed for client {}: {}", normalizedId, e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("clientId", normalizedId);
            err.put("success", false);
            err.put("message", "Migration failed: " + e.getMessage());
            return err;
        } finally {
            EsslDataSourceContextHolder.clear();
        }
    }
}

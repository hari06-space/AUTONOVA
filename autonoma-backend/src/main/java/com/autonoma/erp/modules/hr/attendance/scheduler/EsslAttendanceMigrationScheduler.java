package com.autonoma.erp.modules.hr.attendance.scheduler;

import com.autonoma.erp.modules.hr.attendance.service.AttendanceMigrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

import com.autonoma.erp.service.admin.AppPreferenceService;
import java.time.Instant;
import java.time.Duration;

/**
 * Scheduled trigger for multi-tenant ESSL attendance migration.
 * Reads dynamic interval in minutes from App Preference Master (ESSL_SYNC_INTERVAL_MINUTES).
 */
@Component
@ConditionalOnProperty(name = "essl.migration.enabled", havingValue = "true", matchIfMissing = true)
public class EsslAttendanceMigrationScheduler {

    private static final Logger log = LoggerFactory.getLogger(EsslAttendanceMigrationScheduler.class);

    @Autowired
    private AttendanceMigrationService attendanceMigrationService;

    @Autowired
    private AppPreferenceService appPreferenceService;

    private Instant lastRunTime = null;

    @Scheduled(cron = "0 * * * * *", zone = "${essl.migration.zone:Asia/Kolkata}")
    public void scheduledMigration() {
        int dynamicIntervalMins = appPreferenceService.getEsslSyncIntervalMinutes();
        Instant now = Instant.now();

        if (lastRunTime != null) {
            long elapsedMins = Duration.between(lastRunTime, now).toMinutes();
            if (elapsedMins < dynamicIntervalMins) {
                return;
            }
        }

        lastRunTime = now;
        log.info("Starting dynamic ESSL attendance migration (Configured Interval: {} mins from App Preference Master)", dynamicIntervalMins);
        try {
            Map<String, Object> summary = attendanceMigrationService.runMigrationForAllClients();
            log.info("Dynamic ESSL attendance migration finished: {}", summary.get("message"));
        } catch (Exception e) {
            log.error("Dynamic ESSL attendance migration failed: {}", e.getMessage(), e);
        }
    }
}

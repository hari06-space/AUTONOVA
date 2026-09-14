package com.autonoma.erp.modules.qmt.machineintegration.service;

import com.autonoma.erp.modules.qmt.machineintegration.entity.MachineIntegration;
import com.autonoma.erp.modules.qmt.machineintegration.repository.MachineIntegrationRepository;
import com.autonoma.erp.security.EncryptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Date;
import java.util.List;

@Component
public class MachineIntegrationScheduler {

    private static final Logger log = LoggerFactory.getLogger(MachineIntegrationScheduler.class);

    @Autowired
    private MachineIntegrationRepository repository;

    @Autowired
    private MachineIntegrationService service;

    @Autowired
    private EncryptionService encryptionService;

    /** Runs every 5 seconds. Checks all SEND jobs. */
    @Scheduled(fixedDelay = 5000)
    public void runScheduledSendJobs() {
        List<MachineIntegration> scheduled = service.getAllScheduledSendConfigs();
        for (MachineIntegration config : scheduled) {
            try {
                long intervalMs = (config.getScheduleIntervalSeconds() != null ? config.getScheduleIntervalSeconds() : 60) * 1000L;
                Date lastRun = config.getLastRunDate();
                boolean isDue = (lastRun == null) || (Instant.now().toEpochMilli() - lastRun.getTime() >= intervalMs);
                if (isDue) {
                    log.info("[SEND Scheduler] Machine {}", config.getMachineIdRef());
                    String pwd = encryptionService.decrypt(config.getDbPassword());
                    String result = service.executeJob(config, pwd);
                    log.info("[SEND Scheduler] Machine {} done: {}", config.getMachineIdRef(), result);
                    config.setLastRunDate(new Date());
                    config.setLastRunMessage(result);
                    repository.save(config);
                }
            } catch (Exception e) {
                log.error("[SEND Scheduler] Machine {} failed: {}", config.getMachineIdRef(), e.getMessage());
            }
        }
    }

    /** Runs every 5 seconds. Checks all READ jobs. */
    @Scheduled(fixedDelay = 5000)
    public void runScheduledReadJobs() {
        List<MachineIntegration> scheduled = service.getAllScheduledReadConfigs();
        for (MachineIntegration config : scheduled) {
            try {
                long intervalMs = (config.getReadScheduleIntervalSeconds() != null ? config.getReadScheduleIntervalSeconds() : 60) * 1000L;
                Date lastRun = config.getReadLastRunDate();
                boolean isDue = (lastRun == null) || (Instant.now().toEpochMilli() - lastRun.getTime() >= intervalMs);
                if (isDue) {
                    log.info("[READ Scheduler] Machine {}", config.getMachineIdRef());
                    String pwd = encryptionService.decrypt(config.getDbPassword());
                    String result = service.executeReadJob(config, pwd);
                    log.info("[READ Scheduler] Machine {} done: {}", config.getMachineIdRef(), result);
                    config.setReadLastRunDate(new Date());
                    config.setReadLastRunMessage(result);
                    repository.save(config);
                }
            } catch (Exception e) {
                log.error("[READ Scheduler] Machine {} failed: {}", config.getMachineIdRef(), e.getMessage());
            }
        }
    }
}

package com.autonoma.erp.scheduler;

import com.autonoma.erp.service.admin.ClientNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ClientNotificationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ClientNotificationScheduler.class);

    private final ClientNotificationService notificationService;

    public ClientNotificationScheduler(ClientNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Executes every minute to activate scheduled notifications and expire active notifications.
     */
    @Scheduled(cron = "0 * * * * *")
    public void runNotificationStatusScheduler() {
        try {
            logger.debug("Running Client Notification Status Scheduler...");
            notificationService.processAutomatedStatusTransitions();
        } catch (Exception e) {
            logger.error("Error executing Client Notification Status Scheduler: {}", e.getMessage(), e);
        }
    }
}

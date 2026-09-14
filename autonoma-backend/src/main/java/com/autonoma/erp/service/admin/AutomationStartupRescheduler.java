package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.BosSchedulerConfig;
import com.autonoma.erp.repository.admin.BosSchedulerConfigRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@Slf4j
public class AutomationStartupRescheduler implements ApplicationListener<ApplicationReadyEvent> {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AutomationStartupRescheduler.class);

    @Autowired
    private BosSchedulerConfigRepository configRepository;

    @Autowired
    private AutomationSchedulerEngine schedulerEngine;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("===== Application Ready: Rescheduling Active Business Automations =====");
        try {
            List<BosSchedulerConfig> activeConfigs = configRepository.findByIsActive(true);
            log.info("Found {} active configurations to schedule in Quartz.", activeConfigs.size());
            for (BosSchedulerConfig config : activeConfigs) {
                schedulerEngine.scheduleJob(config);
            }
            log.info("===== Finished Rescheduling Active Business Automations =====");
        } catch (Exception e) {
            log.error("Failed to reschedule automations on application startup: {}", e.getMessage(), e);
        }
    }
}

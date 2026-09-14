package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.BosSchedulerConfig;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@Slf4j
public class AutomationSchedulerEngine {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AutomationSchedulerEngine.class);

    @Autowired
    private Scheduler scheduler;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public void scheduleJob(BosSchedulerConfig config) {
        if (config == null || config.getRowId() == null) return;
        
        try {
            if (scheduler.isShutdown()) {
                log.warn("Quartz scheduler is shutdown. Skipping job schedule for config ID: {}", config.getRowId());
                return;
            }
            unscheduleJob(config.getRowId());
            
            if (Boolean.FALSE.equals(config.getIsActive())) {
                log.info("Automation config '{}' is inactive. Skipping Quartz schedule registration.", config.getConfigName());
                return;
            }
            
            // Parse trigger settings
            Map<String, Object> schedConfig = objectMapper.readValue(config.getSchedulerJson(), 
                    new TypeReference<Map<String, Object>>() {});
            
            String triggerType = config.getTriggerType().toUpperCase();
            String timeStr = (String) schedConfig.get("time"); // format HH:mm
            String cronExp = (String) schedConfig.get("cronExpression");
            
            JobDetail jobDetail = JobBuilder.newJob(AutomationJobExecutor.class)
                    .withIdentity("autoJob_" + config.getRowId(), "BOS_AUTOMATION")
                    .usingJobData("configId", config.getRowId())
                    .build();
            
            TriggerBuilder<Trigger> triggerBuilder = TriggerBuilder.newTrigger()
                    .withIdentity("autoTrigger_" + config.getRowId(), "BOS_AUTOMATION");
            
            ScheduleBuilder<? extends Trigger> scheduleBuilder;
            
            if ("CRON".equalsIgnoreCase(triggerType)) {
                if (cronExp == null || cronExp.trim().isEmpty()) {
                    cronExp = "0 0 9 * * ?"; // Default daily 9:00 AM
                }
                scheduleBuilder = CronScheduleBuilder.cronSchedule(cronExp)
                        .inTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));
            } else if ("DAILY".equalsIgnoreCase(triggerType)) {
                int hour = 9;
                int minute = 0;
                if (timeStr != null && timeStr.contains(":")) {
                    String[] parts = timeStr.split(":");
                    hour = Integer.parseInt(parts[0]);
                    minute = Integer.parseInt(parts[1]);
                }
                scheduleBuilder = CronScheduleBuilder.dailyAtHourAndMinute(hour, minute)
                        .inTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));
            } else if ("WEEKLY".equalsIgnoreCase(triggerType)) {
                int hour = 9;
                int minute = 0;
                if (timeStr != null && timeStr.contains(":")) {
                    String[] parts = timeStr.split(":");
                    hour = Integer.parseInt(parts[0]);
                    minute = Integer.parseInt(parts[1]);
                }
                // Runs weekly on Monday at the selected time
                scheduleBuilder = CronScheduleBuilder.cronSchedule(String.format("0 %d %d ? * MON", minute, hour))
                        .inTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));
            } else if ("MONTHLY".equalsIgnoreCase(triggerType)) {
                int hour = 9;
                int minute = 0;
                if (timeStr != null && timeStr.contains(":")) {
                    String[] parts = timeStr.split(":");
                    hour = Integer.parseInt(parts[0]);
                    minute = Integer.parseInt(parts[1]);
                }
                // Runs monthly on the 1st day at the selected time
                scheduleBuilder = CronScheduleBuilder.cronSchedule(String.format("0 %d %d 1 * ?", minute, hour))
                        .inTimeZone(TimeZone.getTimeZone("Asia/Kolkata"));
            } else {
                // Fallback for interval repetition (e.g. repeat every 30 minutes)
                int interval = 30;
                if (schedConfig.containsKey("repeatInterval") && schedConfig.get("repeatInterval") != null) {
                    interval = ((Number) schedConfig.get("repeatInterval")).intValue();
                }
                scheduleBuilder = SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInMinutes(interval)
                        .repeatForever();
            }
            
            Trigger trigger = triggerBuilder.withSchedule(scheduleBuilder).build();
            
            scheduler.scheduleJob(jobDetail, trigger);
            log.info("Successfully registered Quartz schedule for automation config: {} ({}) - Trigger: {}", 
                    config.getConfigName(), config.getConfigCode(), triggerType);
            
        } catch (Exception e) {
            log.error("Failed to register Quartz schedule for config ID {}: {}", config.getRowId(), e.getMessage(), e);
        }
    }
    
    public void unscheduleJob(Long configId) {
        try {
            if (scheduler.isShutdown()) {
                log.warn("Quartz scheduler is shutdown. Skipping unschedule for config ID: {}", configId);
                return;
            }
            TriggerKey triggerKey = new TriggerKey("autoTrigger_" + configId, "BOS_AUTOMATION");
            JobKey jobKey = new JobKey("autoJob_" + configId, "BOS_AUTOMATION");
            
            if (scheduler.checkExists(triggerKey)) {
                scheduler.unscheduleJob(triggerKey);
            }
            if (scheduler.checkExists(jobKey)) {
                scheduler.deleteJob(jobKey);
            }
            log.info("Successfully removed Quartz schedule for config ID: {}", configId);
        } catch (Exception e) {
            log.error("Failed to unschedule automation job for ID {}: {}", configId, e.getMessage());
        }
    }
}

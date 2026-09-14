package com.autonoma.erp.modules.admin.schedule.service;

import com.autonoma.erp.modules.admin.schedule.entity.ScheduleConfiguration;
import com.autonoma.erp.modules.admin.schedule.repository.ScheduleConfigurationRepository;
import com.autonoma.erp.modules.qms.audit.entity.AuditExecutionLog;
import com.autonoma.erp.modules.qms.audit.repository.AuditExecutionLogRepository;
import com.autonoma.erp.modules.qms.audit.service.AuditNotificationScheduler;
import com.autonoma.erp.modules.qms.checklist.entity.QmsChecklistExecutionLog;
import com.autonoma.erp.modules.qms.checklist.repository.QmsChecklistExecutionLogRepository;
import com.autonoma.erp.modules.qms.checklist.service.ChecklistSchedulerService;
import com.autonoma.erp.modules.qms.meeting.entity.MeetingExecutionLog;
import com.autonoma.erp.modules.qms.meeting.repository.MeetingExecutionLogRepository;
import com.autonoma.erp.modules.qms.meeting.service.MeetingSchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class DynamicScheduleTriggerService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DynamicScheduleTriggerService.class);

    private final ScheduleConfigurationRepository scheduleConfigurationRepository;
    private final ChecklistSchedulerService checklistSchedulerService;
    private final MeetingSchedulerService meetingSchedulerService;
    private final AuditNotificationScheduler auditNotificationScheduler;
    private final com.autonoma.erp.modules.qms.audit.service.AuditScheduleService auditScheduleService;
    private final com.autonoma.erp.repository.admin.AppPreferenceRepository appPreferenceRepository;
    private final com.autonoma.erp.repository.admin.BosSchedulerExecutionLogRepository bosSchedulerExecutionLogRepository;
    private final QmsChecklistExecutionLogRepository qmsChecklistExecutionLogRepository;
    private final MeetingExecutionLogRepository meetingExecutionLogRepository;
    private final AuditExecutionLogRepository auditExecutionLogRepository;
    private final java.util.Set<String> runningSchedulers = java.util.concurrent.ConcurrentHashMap.newKeySet();

    public boolean isSchedulerRunning(String schedularName) {
        if (schedularName == null) return false;
        return runningSchedulers.contains(schedularName.trim().toUpperCase());
    }

    public java.util.Set<String> getRunningSchedulers() {
        return new java.util.HashSet<>(runningSchedulers);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public DynamicScheduleTriggerService(
            ScheduleConfigurationRepository scheduleConfigurationRepository,
            ChecklistSchedulerService checklistSchedulerService,
            MeetingSchedulerService meetingSchedulerService,
            AuditNotificationScheduler auditNotificationScheduler,
            com.autonoma.erp.modules.qms.audit.service.AuditScheduleService auditScheduleService,
            com.autonoma.erp.repository.admin.AppPreferenceRepository appPreferenceRepository,
            com.autonoma.erp.repository.admin.BosSchedulerExecutionLogRepository bosSchedulerExecutionLogRepository,
            QmsChecklistExecutionLogRepository qmsChecklistExecutionLogRepository,
            MeetingExecutionLogRepository meetingExecutionLogRepository,
            AuditExecutionLogRepository auditExecutionLogRepository) {
        this.scheduleConfigurationRepository = scheduleConfigurationRepository;
        this.checklistSchedulerService = checklistSchedulerService;
        this.meetingSchedulerService = meetingSchedulerService;
        this.auditNotificationScheduler = auditNotificationScheduler;
        this.auditScheduleService = auditScheduleService;
        this.appPreferenceRepository = appPreferenceRepository;
        this.bosSchedulerExecutionLogRepository = bosSchedulerExecutionLogRepository;
        this.qmsChecklistExecutionLogRepository = qmsChecklistExecutionLogRepository;
        this.meetingExecutionLogRepository = meetingExecutionLogRepository;
        this.auditExecutionLogRepository = auditExecutionLogRepository;
    }

    /**
     * Polling mechanism that runs every minute to check if any active schedule
     * configuration's time has arrived or passed (Catch-up Mechanism).
     */
    @Scheduled(cron = "0 * * * * *", zone = "Asia/Kolkata")
    public void runDynamicSchedules() {
        LocalTime now = LocalTime.now(ZoneId.of("Asia/Kolkata"));
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        String todayStr = today.toString();
        
        List<ScheduleConfiguration> configs = scheduleConfigurationRepository.findAll();

        for (ScheduleConfiguration config : configs) {
            if (config.getStatus() != null && config.getStatus() && config.getSchedularTime() != null) {
                LocalTime scheduledTime = config.getSchedularTime().toLocalTime();
                
                // Catch-up logic: If current time is on or after scheduled time
                if (!now.isBefore(scheduledTime)) {
                    String prefKey = "BOS_TRIGGER_LAST_RUN_" + config.getSchedularName().toUpperCase();
                    java.util.Optional<com.autonoma.erp.model.admin.AppPreference> prefOpt = appPreferenceRepository.findByPrefName(prefKey);
                    String lastRunDateStr = prefOpt.isPresent() ? prefOpt.get().getPrefValue() : null;
                    
                    // Run it only if it is due to run today based on configured frequency
                    if (isTriggerDue(config, lastRunDateStr, todayStr)) {
                        log.info("Dynamic Trigger activated for: {} (Catch-up)", config.getSchedularName());
                        try {
                            executeTrigger(config.getSchedularName());
                        } catch (Exception e) {
                            log.error("Exception during execution of dynamic trigger for {}: {}", config.getSchedularName(), e.getMessage(), e);
                        }
                        
                        // Mark as executed for today in AppPreference
                        com.autonoma.erp.model.admin.AppPreference pref = prefOpt.orElseGet(() -> {
                            com.autonoma.erp.model.admin.AppPreference p = new com.autonoma.erp.model.admin.AppPreference();
                            p.setPrefName(prefKey);
                            String modType = "SCHEDULER";
                            if (prefKey.contains("AUDIT")) modType = "AUDIT";
                            else if (prefKey.contains("MEETING")) modType = "MEETINGS";
                            p.setPrefType(modType);
                            p.setCreatedBy("SYSTEM");
                            p.setCreatedDate(new java.util.Date());
                            return p;
                        });
                        pref.setPrefValue(todayStr);
                        pref.setUpdatedBy("SYSTEM");
                        pref.setUpdatedDate(new java.util.Date());
                        appPreferenceRepository.save(pref);
                    }
                }
            }
        }
    }

    public void executeTrigger(String schedularName) {
        executeTrigger(schedularName, new java.util.Date(), false);
    }

    public void executeTrigger(String schedularName, boolean isManual) {
        java.util.Date targetDate = new java.util.Date();
        executeTrigger(schedularName, targetDate, isManual);
    }

    /**
     * Executes the corresponding service logic based on the scheduler name, target date, and closePast toggle.
     */
    public void executeTrigger(String schedularName, java.util.Date targetDate, boolean closePast) {
        if (schedularName == null) return;
        System.out.println("[DynamicScheduleTriggerService] executeTrigger started for scheduler: " + schedularName + " at " + new java.util.Date());
        String trimmedName = schedularName.trim().toUpperCase();
        if (!runningSchedulers.add(trimmedName)) {
            log.warn("Scheduler {} is already running, skipping trigger execution.", schedularName);
            throw new IllegalStateException("Scheduler " + schedularName + " is already running.");
        }
        
        try {
            // Find configuration to get its ID
            ScheduleConfiguration config = scheduleConfigurationRepository.findAll().stream()
                .filter(c -> schedularName.equalsIgnoreCase(c.getSchedularName()))
                .findFirst()
                .orElse(null);
            Long configId = config != null ? config.getId() : 0L;
            
            boolean isChecklist = trimmedName.startsWith("CHECKLIST");
            if (isChecklist) {
                com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext ctx = com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext.get();
                if (ctx.getTriggerId() == null) {
                    ctx.setExecutionType("AUTO");
                    ctx.setSchedulerName(schedularName);
                    ctx.setTriggerId(configId);
                    ctx.setDueDate(targetDate);
                }
            }
            boolean isMeeting = "MEETING".equals(trimmedName);
            boolean isAudit = "AUDIT".equals(trimmedName);
    
            QmsChecklistExecutionLog checklistLog = null;
            MeetingExecutionLog meetingLog = null;
            AuditExecutionLog auditLog = null;
            com.autonoma.erp.model.admin.BosSchedulerExecutionLog fallbackLog = null;
    
            if (isChecklist) {
                checklistLog = new QmsChecklistExecutionLog();
                checklistLog.setConfigId(configId);
                checklistLog.setSchedulerName(schedularName);
                checklistLog.setStatus("RUNNING");
                checklistLog.setTriggerTime(new java.util.Date());
                try {
                    checklistLog = qmsChecklistExecutionLogRepository.save(checklistLog);
                } catch (Exception e) {
                    log.error("Failed to save initial checklist execution log", e);
                }
            } else if (isMeeting) {
                meetingLog = new MeetingExecutionLog();
                meetingLog.setConfigId(configId);
                meetingLog.setSchedulerName(schedularName);
                meetingLog.setStatus("RUNNING");
                meetingLog.setTriggerTime(new java.util.Date());
                try {
                    meetingLog = meetingExecutionLogRepository.save(meetingLog);
                } catch (Exception e) {
                    log.error("Failed to save initial meeting execution log", e);
                }
            } else if (isAudit) {
                auditLog = new AuditExecutionLog();
                auditLog.setConfigId(configId);
                auditLog.setSchedulerName(schedularName);
                auditLog.setStatus("RUNNING");
                auditLog.setTriggerTime(new java.util.Date());
                try {
                    auditLog = auditExecutionLogRepository.save(auditLog);
                } catch (Exception e) {
                    log.error("Failed to save initial audit execution log", e);
                }
            } else {
                fallbackLog = new com.autonoma.erp.model.admin.BosSchedulerExecutionLog();
                fallbackLog.setConfigId(configId);
                fallbackLog.setSchedulerName(schedularName);
                fallbackLog.setStatus("RUNNING");
                fallbackLog.setTriggerTime(new java.util.Date());
                try {
                    fallbackLog = bosSchedulerExecutionLogRepository.save(fallbackLog);
                } catch (Exception e) {
                    log.error("Failed to save initial fallback execution log", e);
                }
            }
            
            long startTime = System.currentTimeMillis();
            String errorMsg = null;
            String finalStatus = "COMPLETED";
            
            try {
                switch (trimmedName) {
                    case "CHECKLIST":
                        log.info("Triggering Checklist Generation targeting date: {}, closePast: {}...", targetDate, closePast);
                        if (closePast) {
                            java.util.Calendar cal = java.util.Calendar.getInstance();
                            cal.setTime(targetDate);
                            cal.add(java.util.Calendar.DATE, -1);
                            java.util.Date previousDate = cal.getTime();
                            log.info("Auto-closing uncompleted checklists on or before: {}", previousDate);
                            checklistSchedulerService.processUncompletedChecklists(previousDate);
                        }
                        int checkCount = checklistSchedulerService.executeChecklistGeneration(targetDate);
                        if (checklistLog != null) {
                            checklistLog.setSuccessCount(checkCount);
                        }
                        break;
                    case "CHECKLIST_RENEWAL":
                        log.info("Triggering Checklist Renewal Generation targeting date: {}, closePast: {}...", targetDate, closePast);
                        if (closePast) {
                            java.util.Calendar cal = java.util.Calendar.getInstance();
                            cal.setTime(targetDate);
                            cal.add(java.util.Calendar.DATE, -1);
                            java.util.Date previousDate = cal.getTime();
                            log.info("Auto-closing uncompleted checklists on or before: {}", previousDate);
                            checklistSchedulerService.processUncompletedChecklists(previousDate);
                        }
                        int renewCount = checklistSchedulerService.executeChecklistRenewalGeneration(targetDate);
                        if (checklistLog != null) {
                            checklistLog.setSuccessCount(renewCount);
                        }
                        break;
                    case "CHECKLIST_DYNAMIC":
                        log.info("Triggering Dynamic Checklist Generation targeting date: {}...", targetDate);
                        int dynamicCount = checklistSchedulerService.executeChecklistDynamicGeneration(targetDate);
                        if (checklistLog != null) {
                            checklistLog.setSuccessCount(dynamicCount);
                        }
                        break;
                    case "CHECKLIST_REASSIGN_1":
                    case "CHECKLIST_REASSIGN_2":
                    case "CHECKLIST_REASSIGN_3":
                        log.info("Manually/Dynamically triggering Checklist Reassignment check: {}...", schedularName);
                        checklistSchedulerService.runReassignmentScheduler();
                        break;
                    case "CHECKLIST_EOD":
                        log.info("Manually/Dynamically triggering Checklist End-Of-Day processor targeting date: {}...", targetDate);
                        checklistSchedulerService.processUncompletedChecklists(targetDate);
                        break;
                    case "AUDIT":
                        log.info("Manually/Dynamically triggering Audit Schedule generation & notifications...");
                        auditScheduleService.generateScheduledAudits(targetDate);
                        auditNotificationScheduler.checkAndSendAuditReminders();
                        auditNotificationScheduler.cancelExpiredAuditsWithoutAttendance();
                        try {
                            com.autonoma.erp.service.realtime.RealtimeDataSyncPublisher publisher = 
                                com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.service.realtime.RealtimeDataSyncPublisher.class);
                            if (publisher != null) {
                                publisher.publishMutation("AuditSchedule", "TRIGGERED");
                            }
                        } catch (Exception ignored) {}
                        break;
                    case "MEETING":
                        log.info("Manually/Dynamically triggering Meeting Maintenance targeting date: {}...", targetDate);
                        java.time.LocalDate meetingTargetDate = null;
                        if (targetDate != null) {
                            meetingTargetDate = targetDate.toInstant().atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
                        }
                        meetingSchedulerService.dailyMeetingMaintenance(true, meetingTargetDate);
                        break;
                    default:
                        log.warn("Unknown schedular name for trigger: {}", schedularName);
                }
            } catch (Exception e) {
                finalStatus = "FAILED";
                errorMsg = e.getMessage();
                log.error("Exception during execution of scheduler trigger for {}: {}", schedularName, e.getMessage(), e);
                throw e;
            } finally {
                long duration = System.currentTimeMillis() - startTime;
                if (checklistLog != null && checklistLog.getRowId() != null) {
                    checklistLog.setDurationMs(duration);
                    checklistLog.setStatus(finalStatus);
                    checklistLog.setErrorDetails(errorMsg);
                    try {
                        qmsChecklistExecutionLogRepository.save(checklistLog);
                    } catch (Exception ex) {
                        log.error("Failed to update final checklist execution log", ex);
                    }
                } else if (meetingLog != null && meetingLog.getRowId() != null) {
                    meetingLog.setDurationMs(duration);
                    meetingLog.setStatus(finalStatus);
                    meetingLog.setErrorDetails(errorMsg);
                    try {
                        meetingExecutionLogRepository.save(meetingLog);
                    } catch (Exception ex) {
                        log.error("Failed to update final meeting execution log", ex);
                    }
                } else if (auditLog != null && auditLog.getRowId() != null) {
                    auditLog.setDurationMs(duration);
                    auditLog.setStatus(finalStatus);
                    auditLog.setErrorDetails(errorMsg);
                    try {
                        auditExecutionLogRepository.save(auditLog);
                    } catch (Exception ex) {
                        log.error("Failed to update final audit execution log", ex);
                    }
                } else if (fallbackLog != null && fallbackLog.getRowId() != null) {
                    fallbackLog.setDurationMs(duration);
                    fallbackLog.setStatus(finalStatus);
                    fallbackLog.setErrorDetails(errorMsg);
                    try {
                        bosSchedulerExecutionLogRepository.save(fallbackLog);
                    } catch (Exception ex) {
                        log.error("Failed to update final fallback execution log", ex);
                    }
                }
            }
        } finally {
            com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext.clear();
            runningSchedulers.remove(trimmedName);
            System.out.println("[DynamicScheduleTriggerService] executeTrigger finished for scheduler: " + schedularName + " at " + new java.util.Date());
        }
    }

    private boolean isTriggerDue(ScheduleConfiguration config, String lastRunDateStr, String todayStr) {
        if (lastRunDateStr == null || lastRunDateStr.trim().isEmpty()) {
            return true; // Never run before, so it's due
        }
        if (todayStr.equals(lastRunDateStr)) {
            return false; // Already run today, never run twice in the same day
        }
        
        String freq = config.getFrequency();
        if (freq == null || freq.trim().isEmpty() || "DAILY".equalsIgnoreCase(freq)) {
            return true; // Daily frequency is due since last run was not today
        }
        
        try {
            LocalDate lastRun = LocalDate.parse(lastRunDateStr);
            LocalDate today = LocalDate.parse(todayStr);
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(lastRun, today);
            
            switch (freq.trim().toUpperCase()) {
                case "WEEKLY":
                    return daysBetween >= 7;
                case "FORTNIGHTLY":
                    return daysBetween >= 14;
                case "MONTHLY":
                    return daysBetween >= 30;
                case "QUARTERLY":
                    return daysBetween >= 90;
                case "HALF YEARLY":
                case "BI-ANNUAL":
                    return daysBetween >= 180;
                case "YEARLY":
                case "ANNUAL":
                    return daysBetween >= 365;
                default:
                    return true; // Fallback
            }
        } catch (Exception e) {
            log.error("Error parsing date for trigger due check: lastRun={}, today={}", lastRunDateStr, todayStr, e);
            return true;
        }
    }
}

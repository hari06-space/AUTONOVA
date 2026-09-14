package com.autonoma.erp.modules.qms.checklist.service;

import com.autonoma.erp.modules.qms.checklist.entity.QmsChecklistExecutionLog;
import com.autonoma.erp.modules.qms.checklist.repository.QmsChecklistExecutionLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Orchestrates manual invocation of the checklist generation job.
 * Writes to the module-specific checklist execution log table QMS_CHECKLIST_EXECUTION_LOG.
 */
@Service
public class ChecklistManualTriggerService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChecklistManualTriggerService.class);

    private final ChecklistSchedulerService schedulerService;
    private final QmsChecklistExecutionLogRepository qmsChecklistExecutionLogRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public ChecklistManualTriggerService(
            ChecklistSchedulerService schedulerService,
            QmsChecklistExecutionLogRepository qmsChecklistExecutionLogRepository) {
        this.schedulerService = schedulerService;
        this.qmsChecklistExecutionLogRepository = qmsChecklistExecutionLogRepository;
    }

    /**
     * Manually triggers the checklist generation process and logs the result in QMS_CHECKLIST_EXECUTION_LOG.
     *
     * @param triggeredBy the username of the admin who invoked the trigger
     * @return the mapped log entry as a Map for frontend compatibility
     */
    public Map<String, Object> triggerManually(String triggeredBy) {
        log.info("[ManualTrigger] Triggered by: {}", triggeredBy);

        long startTime = System.currentTimeMillis();
        int checklistCount = 0;
        String status = "SUCCESS";
        String failureReason = null;

        try {
            java.util.Date today = new java.util.Date();
            
            // Step 1: Checklist Trigger (Standard & Renewal)
            log.info("[ManualTrigger] Step 1: Running standard checklist generation...");
            int fixedCount = schedulerService.executeChecklistGeneration(today);
            log.info("[ManualTrigger] Step 1: Running renewal checklist generation...");
            int renewalCount = schedulerService.executeChecklistRenewalGeneration(today);

            // Step 2: Checklist Reschedule / Re-validation
            log.info("[ManualTrigger] Step 2: Running checklist reschedule and re-validation...");
            int revalidatedCount = schedulerService.reValidateExistingAssignments(today);
            try {
                schedulerService.runReassignmentScheduler();
            } catch (Exception reassignEx) {
                log.warn("[ManualTrigger] Reassignment scheduler warning: {}", reassignEx.getMessage());
            }

            // Step 3: Dynamic Checklist Trigger
            log.info("[ManualTrigger] Step 3: Running dynamic checklist generation...");
            int dynamicCount = schedulerService.executeChecklistDynamicGeneration(today);

            checklistCount = fixedCount + renewalCount + dynamicCount;
            log.info("[ManualTrigger] Completed sequence. Standard: {}, Renewal: {}, Revalidated: {}, Dynamic: {}, Total Generated: {}",
                    fixedCount, renewalCount, revalidatedCount, dynamicCount, checklistCount);
        } catch (Exception e) {
            status = "FAILED";
            failureReason = e.getMessage() != null ? e.getMessage() : e.getClass().getName();
            log.error("[ManualTrigger] Failed with error: {}", failureReason, e);
        }

        long duration = System.currentTimeMillis() - startTime;

        QmsChecklistExecutionLog logEntry = new QmsChecklistExecutionLog();
        logEntry.setConfigId(1L);
        logEntry.setSchedulerName("CHECKLIST");
        logEntry.setTriggerTime(new java.util.Date());
        logEntry.setDurationMs(duration);
        logEntry.setSuccessCount(checklistCount);
        logEntry.setFailureCount(status.equals("FAILED") ? 1 : 0);
        logEntry.setStatus(status.equals("SUCCESS") ? "COMPLETED" : "FAILED");
        logEntry.setErrorDetails(failureReason);

        logEntry = qmsChecklistExecutionLogRepository.save(logEntry);

        return mapToFrontend(logEntry, triggeredBy);
    }

    /**
     * Returns the 50 most recent manual trigger log entries mapped to frontend model, newest first.
     */
    public List<Map<String, Object>> getLogs() {
        List<QmsChecklistExecutionLog> dbLogs = qmsChecklistExecutionLogRepository.findTop100ByOrderByTriggerTimeDesc();
        return dbLogs.stream()
                .filter(l -> "CHECKLIST".equalsIgnoreCase(l.getSchedulerName()))
                .limit(50)
                .map(l -> mapToFrontend(l, "SYSTEM"))
                .collect(Collectors.toList());
    }

    private Map<String, Object> mapToFrontend(QmsChecklistExecutionLog logEntry, String triggeredBy) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", logEntry.getRowId());
        map.put("triggeredBy", triggeredBy);
        
        java.time.LocalDateTime ldt = logEntry.getTriggerTime().toInstant()
                .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                .toLocalDateTime();
        map.put("triggerDate", ldt.toLocalDate().toString());
        map.put("triggerTime", ldt.toLocalTime().toString());
        map.put("status", "COMPLETED".equals(logEntry.getStatus()) ? "SUCCESS" : "FAILED");
        map.put("checklistCount", logEntry.getSuccessCount());
        map.put("failureReason", logEntry.getErrorDetails());
        return map;
    }
}

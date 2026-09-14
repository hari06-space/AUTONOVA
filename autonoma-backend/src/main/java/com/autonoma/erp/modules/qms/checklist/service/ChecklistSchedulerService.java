package com.autonoma.erp.modules.qms.checklist.service;

import com.autonoma.erp.modules.qms.checklist.entity.MasterChecklist;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignment;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistClosed;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.qms.checklist.repository.MasterChecklistRepository;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistAssignmentRepository;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.qms.checklist.repository.ChecklistClosedRepository;
import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.qms.checklist.entity.QmsChecklistRenewalAuditLog;
import com.autonoma.erp.modules.qms.checklist.entity.QmsChecklistEodAuditLog;
import com.autonoma.erp.modules.qms.checklist.repository.QmsChecklistRenewalAuditLogRepository;
import com.autonoma.erp.modules.qms.checklist.repository.QmsChecklistEodAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Service
public class ChecklistSchedulerService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChecklistSchedulerService.class);

    private final MasterChecklistRepository masterRepo;
    private final ChecklistService checklistService;
    private final ChecklistAssignmentRepository assignRepo;
    private final StatusMasterRepository statusRepo;
    private final ChecklistClosedRepository closedRepo;
    private final ChecklistAutoAssignmentService checklistAutoAssignmentService;
    private final HrHolidayMasterRepository hrHolidayMasterRepository;
    private final EmployeeMasterRepository employeeMasterRepository;
    private final com.autonoma.erp.modules.admin.schedule.repository.ScheduleConfigurationRepository scheduleConfigurationRepository;
    private final com.autonoma.erp.modules.qms.checklist.repository.QmsChecklistExecutionLogRepository qmsChecklistExecutionLogRepository;
    private final QmsChecklistRenewalAuditLogRepository qmsChecklistRenewalAuditLogRepository;
    private final QmsChecklistEodAuditLogRepository qmsChecklistEodAuditLogRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public ChecklistSchedulerService(
            MasterChecklistRepository masterRepo,
            ChecklistService checklistService,
            ChecklistAssignmentRepository assignRepo,
            StatusMasterRepository statusRepo,
            ChecklistClosedRepository closedRepo,
            ChecklistAutoAssignmentService checklistAutoAssignmentService,
            HrHolidayMasterRepository hrHolidayMasterRepository,
            EmployeeMasterRepository employeeMasterRepository,
            com.autonoma.erp.modules.admin.schedule.repository.ScheduleConfigurationRepository scheduleConfigurationRepository,
            com.autonoma.erp.modules.qms.checklist.repository.QmsChecklistExecutionLogRepository qmsChecklistExecutionLogRepository,
            QmsChecklistRenewalAuditLogRepository qmsChecklistRenewalAuditLogRepository,
            QmsChecklistEodAuditLogRepository qmsChecklistEodAuditLogRepository) {
        this.masterRepo = masterRepo;
        this.checklistService = checklistService;
        this.assignRepo = assignRepo;
        this.statusRepo = statusRepo;
        this.closedRepo = closedRepo;
        this.checklistAutoAssignmentService = checklistAutoAssignmentService;
        this.hrHolidayMasterRepository = hrHolidayMasterRepository;
        this.employeeMasterRepository = employeeMasterRepository;
        this.scheduleConfigurationRepository = scheduleConfigurationRepository;
        this.qmsChecklistExecutionLogRepository = qmsChecklistExecutionLogRepository;
        this.qmsChecklistRenewalAuditLogRepository = qmsChecklistRenewalAuditLogRepository;
        this.qmsChecklistEodAuditLogRepository = qmsChecklistEodAuditLogRepository;
    }

    /**
     * Now invoked by DynamicScheduleTriggerService instead of hardcoded cron.
     * Delegates to {@link #executeChecklistGeneration()} so the same logic
     * can also be invoked via the manual trigger endpoint.
     *
     * Step 5 (Re-Validation): After generating new assignments, re-checks all
     * already-generated tasks for today. This catches the scenario where a leave
     * was entered after a previous scheduler run pre-generated the task (e.g.,
     * yesterday's 4AM job created today's task but the employee raised leave
     * before today's 4AM run).
     */
    // @Scheduled(cron = "0 0 4 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void generateRecurringAssignments() {
        System.out.println("[ChecklistSchedulerService] generateRecurringAssignments started");
        try {
            ChecklistAutoAssignmentService.startCache();

            // 1. Double-Run Protection / Concurrency Check
            java.util.List<com.autonoma.erp.modules.qms.checklist.entity.QmsChecklistExecutionLog> logs = qmsChecklistExecutionLogRepository
                    .findTop100ByOrderByTriggerTimeDesc();

            long tenMinutesAgo = System.currentTimeMillis() - (10 * 60 * 1000);
            boolean isAlreadyRunning = logs.stream()
                    .anyMatch(l -> "RUNNING".equalsIgnoreCase(l.getStatus())
                            && "CHECKLIST".equalsIgnoreCase(l.getSchedulerName())
                            && l.getTriggerTime().getTime() > tenMinutesAgo);

            if (isAlreadyRunning) {
                log.warn(
                        "[Scheduler Concurrency] Checklist scheduler is already running in another node or thread. Skipping execution to prevent duplicate generations.");
                return;
            }

            // 2. Recovery / Downtime Catch-Up Loop
            java.util.Optional<com.autonoma.erp.modules.qms.checklist.entity.QmsChecklistExecutionLog> lastCompletedLog = logs
                    .stream()
                    .filter(l -> "COMPLETED".equalsIgnoreCase(l.getStatus())
                            && "CHECKLIST".equalsIgnoreCase(l.getSchedulerName()))
                    .findFirst();

            java.time.LocalDate todayLocal = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));

            if (lastCompletedLog.isPresent()) {
                java.time.LocalDate lastRunLocal = java.time.Instant
                        .ofEpochMilli(lastCompletedLog.get().getTriggerTime().getTime())
                        .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                        .toLocalDate();

                java.time.LocalDate startCheck = lastRunLocal.plusDays(1);
                while (startCheck.isBefore(todayLocal)) {
                    java.util.Date targetDate = java.util.Date
                            .from(startCheck.atStartOfDay(java.time.ZoneId.of("Asia/Kolkata")).toInstant());
                    log.info("[Scheduler Recovery] Running catch-up cycle for missed date: {}", startCheck);
                    try {
                        // Catch-up Step 1: EOD cleanup for the previous day
                        java.util.Calendar cal = java.util.Calendar
                                .getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                        cal.setTime(targetDate);
                        cal.add(java.util.Calendar.DATE, -1);
                        processUncompletedChecklists(cal.getTime());

                        // Catch-up Step 2: Checklist Trigger (Standard & Renewal)
                        executeChecklistGeneration(targetDate);
                        executeChecklistRenewalGeneration(targetDate);

                        // Catch-up Step 3: Reschedule / Re-validation
                        reValidateExistingAssignments(targetDate);
                        try {
                            runReassignmentScheduler();
                        } catch (Exception ex) {
                            log.warn("[Scheduler Recovery] Reassignment warning: {}", ex.getMessage());
                        }

                        // Catch-up Step 4: Dynamic Checklist Trigger
                        executeChecklistDynamicGeneration(targetDate);
                    } catch (Exception e) {
                        log.error("[Scheduler Recovery] Failed catch-up run for date {}: {}", startCheck,
                                e.getMessage());
                    }
                    startCheck = startCheck.plusDays(1);
                }
            }

            // 3. Execution for Today
            Date today = new Date();

            // STEP 1 (EOD for yesterday): Close out uncompleted tasks from yesterday
            Calendar yesterdayCal = Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            yesterdayCal.setTime(today);
            yesterdayCal.add(Calendar.DATE, -1);
            Date yesterday = yesterdayCal.getTime();
            log.info("[Scheduler] 4 AM – Step 1: Running EOD cleanup for previous day ({})", yesterday);
            try {
                processUncompletedChecklists(yesterday);
                log.info("[Scheduler] 4 AM – Step 1: EOD cleanup for yesterday completed.");
            } catch (Exception e) {
                log.error("[Scheduler] 4 AM – Step 1: EOD cleanup failed: {}", e.getMessage(), e);
            }

            // STEP 2: Checklist Trigger (Standard + Renewal)
            log.info("[Scheduler] 4 AM – Step 2: Generating today's standard checklist assignments");
            int count = executeChecklistGeneration(today);
            log.info("[Scheduler] 4 AM – Step 2: Standard generation completed – {} checklist(s) generated.", count);

            log.info("[Scheduler] 4 AM – Step 2.1: Generating today's renewal checklist assignments");
            int renewCount = executeChecklistRenewalGeneration(today);
            log.info("[Scheduler] 4 AM – Step 2.1: Renewal generation completed – {} renewal checklist(s) generated.", renewCount);

            // STEP 3: Reschedule & Re-Validation (Re-check today's assignments & run reassignment)
            log.info("[Scheduler] 4 AM – Step 3: Running reschedule and re-validation pass");
            int reValidated = reValidateExistingAssignments(today);
            try {
                runReassignmentScheduler();
            } catch (Exception reassignEx) {
                log.warn("[Scheduler] 4 AM – Step 3: Reassignment scheduler warning: {}", reassignEx.getMessage());
            }
            log.info("[Scheduler] 4 AM – Step 3: Reschedule/re-validation completed – {} task(s) re-evaluated.", reValidated);

            // STEP 4: Dynamic Checklist Trigger
            log.info("[Scheduler] 4 AM – Step 4: Generating today's dynamic checklist assignments");
            int dynamicCount = executeChecklistDynamicGeneration(today);
            log.info("[Scheduler] 4 AM – Step 4: Dynamic generation completed – {} dynamic checklist(s) generated.", dynamicCount);
        } finally {
            ChecklistAutoAssignmentService.clearCache();
        }
        System.out.println("[ChecklistSchedulerService] generateRecurringAssignments finished");
    }

    /**
     * Step 5 — Re-validates assignments already generated for today.
     *
     * Delegates to
     * {@link ChecklistAutoAssignmentService#reValidateAssignmentsForDate(Date)},
     * which reuses the same hierarchy cascade + notification + QMS_CHECKLIST_CLOSED
     * sync
     * logic as the mid-day (10AM / 2PM / 4PM) reassignment scheduler.
     *
     * @param today the target date (typically {@code new Date()} at 4AM)
     * @return the number of assignments processed
     */
    @Transactional
    public int reValidateExistingAssignments(Date today) {
        log.info("[Scheduler] Starting 4AM re-validation pass for date: {}", today);
        try {
            return checklistAutoAssignmentService.reValidateAssignmentsForDate(today);
        } catch (Exception e) {
            log.error("[Scheduler] 4AM re-validation encountered an error: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Core checklist-generation logic shared by the 4 AM scheduler and the
     * manual trigger endpoint.
     *
     * @return the number of checklist assignments generated in this run
     */
    public int executeChecklistRenewalGeneration() {
        return executeChecklistRenewalGeneration(new Date());
    }

    @Transactional
    public int executeChecklistRenewalGeneration(Date today) {
        System.out.println("[ChecklistSchedulerService] executeChecklistRenewalGeneration started");
        log.info("Starting Renewal Checklist Auto Trigger process for target date: {}", today);
        int generatedCount = 0;

        java.time.LocalDate targetLocal = java.time.Instant.ofEpochMilli(today.getTime())
                .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                .toLocalDate();

        List<MasterChecklist> eligibleChecklists = masterRepo.findEligibleRenewalChecklists();
        log.info("Found {} potential renewal master checklists to evaluate.", eligibleChecklists.size());

        List<Long> masterIds = eligibleChecklists.stream().map(MasterChecklist::getId)
                .collect(java.util.stream.Collectors.toList());
        java.util.Map<String, Boolean> processedMap = new java.util.HashMap<>();
        if (!masterIds.isEmpty()) {
            List<QmsChecklistRenewalAuditLog> successLogs = qmsChecklistRenewalAuditLogRepository
                    .findSuccessLogsByMasterChecklistIds(masterIds);
            for (QmsChecklistRenewalAuditLog logEntry : successLogs) {
                if (logEntry.getReminderDate() != null) {
                    processedMap.put(logEntry.getMasterChecklistId() + "_" + logEntry.getReminderDate().getTime(),
                            true);
                }
            }
        }

        for (MasterChecklist checklist : eligibleChecklists) {
            Date prevReminderDate = checklist.getReminderDate();
            if (prevReminderDate == null) {
                if (checklist.getExpiryDate() != null) {
                    Long remDays = checklist.getReminderDays();
                    java.util.Calendar cal = java.util.Calendar.getInstance();
                    cal.setTime(checklist.getExpiryDate());
                    if (remDays != null) {
                        cal.add(java.util.Calendar.DAY_OF_MONTH, -remDays.intValue());
                    }
                    prevReminderDate = cal.getTime();
                    checklist.setReminderDate(prevReminderDate);
                    checklist.setSkipAuditUpdate(true);
                    masterRepo.save(checklist);
                    log.info("Auto-calculated null reminder date for Master Checklist ID {} to {}", checklist.getId(), prevReminderDate);
                } else {
                    log.warn("Master Checklist ID {} has null reminder date and null expiry date. Skipping.", checklist.getId());
                    continue;
                }
            }

            java.time.LocalDate reminderLocal = java.time.Instant.ofEpochMilli(prevReminderDate.getTime())
                    .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                    .toLocalDate();

            // 3. Reminder Date Validation — fire on the reminder date OR if overdue
            // (reminder date <= today)
            if (reminderLocal.isAfter(targetLocal)) {
                log.debug(
                        "Master Checklist ID {} reminder date {} is in the future relative to target date {}. Skipping.",
                        checklist.getId(), reminderLocal, targetLocal);
                continue;
            }

            // 6. Duplicate Prevention
            String checkKey = checklist.getId() + "_" + prevReminderDate.getTime();
            if (processedMap.containsKey(checkKey)) {
                log.info(
                        "Renewal Checklist for Master Checklist ID {} and Reminder Date {} has already been successfully generated. Skipping.",
                        checklist.getId(), prevReminderDate);
                continue;
            }

            // Process individually (7. Error Handling)
            try {
                // Generate checklist using existing auto assignment flow
                checklistAutoAssignmentService.processAutoAssignment(checklist.getId(), today);

                // Retrieve created assignment ID
                Long renewalChecklistId = null;
                java.util.List<ChecklistAssignment> assignments = assignRepo.findByChecklistId(checklist.getId());
                for (ChecklistAssignment a : assignments) {
                    if (a.getChecklistDate() != null) {
                        java.time.LocalDate taskDate = java.time.Instant.ofEpochMilli(a.getChecklistDate().getTime())
                                .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
                        if (taskDate.equals(targetLocal)) {
                            renewalChecklistId = a.getId();
                            break;
                        }
                    }
                }

                if (renewalChecklistId == null) {
                    java.util.List<ChecklistClosed> closedAssignments = closedRepo.findByChecklistId(checklist.getId());
                    for (ChecklistClosed c : closedAssignments) {
                        if (c.getChecklistDate() != null) {
                            java.time.LocalDate taskDate = java.time.Instant.ofEpochMilli(c.getChecklistDate().getTime())
                                    .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
                            if (taskDate.equals(targetLocal)) {
                                renewalChecklistId = c.getId();
                                break;
                            }
                        }
                    }
                }

                if (renewalChecklistId == null) {
                    log.warn("Assignment task was not created for target date {} for Master Checklist ID {}. Updating next reminder date to prevent stuck scheduling loop.", targetLocal, checklist.getId());

                    Date nextReminderDate = calculateNextReminderDate(prevReminderDate, checklist.getFrequency());
                    if (nextReminderDate != null) {
                        checklist.setReminderDate(nextReminderDate);
                        masterRepo.save(checklist);
                    }

                    // Audit Logging (Skipped)
                    QmsChecklistRenewalAuditLog auditLog = new QmsChecklistRenewalAuditLog();
                    auditLog.setMasterChecklistId(checklist.getId());
                    auditLog.setReminderDate(prevReminderDate);
                    auditLog.setPrevReminderDate(prevReminderDate);
                    if (nextReminderDate != null) {
                        auditLog.setUpdatedReminderDate(nextReminderDate);
                    }
                    auditLog.setFrequency(checklist.getFrequency());
                    auditLog.setTriggerTime(new Date());
                    auditLog.setStatus("Skipped");
                    auditLog.setErrorMessage("Assignment task was not created for the target date.");
                    qmsChecklistRenewalAuditLogRepository.save(auditLog);

                    continue;
                }

                // 5. Update Reminder Date
                Date nextReminderDate = calculateNextReminderDate(prevReminderDate, checklist.getFrequency());
                checklist.setReminderDate(nextReminderDate);
                masterRepo.save(checklist);

                // 8. Audit Logging (Success)
                QmsChecklistRenewalAuditLog auditLog = new QmsChecklistRenewalAuditLog();
                auditLog.setMasterChecklistId(checklist.getId());
                auditLog.setRenewalChecklistId(renewalChecklistId);
                auditLog.setReminderDate(prevReminderDate);
                auditLog.setPrevReminderDate(prevReminderDate);
                auditLog.setUpdatedReminderDate(nextReminderDate);
                auditLog.setFrequency(checklist.getFrequency());
                auditLog.setTriggerTime(new Date());
                auditLog.setStatus("Success");
                qmsChecklistRenewalAuditLogRepository.save(auditLog);

                generatedCount++;
                log.info("Successfully triggered renewal for Master Checklist ID {}. Next Reminder Date: {}",
                        checklist.getId(), nextReminderDate);

            } catch (Exception e) {
                log.error("Failed to process renewal checklist for Master Checklist ID {}: {}", checklist.getId(),
                        e.getMessage(), e);

                // 8. Audit Logging (Failed)
                QmsChecklistRenewalAuditLog auditLog = new QmsChecklistRenewalAuditLog();
                auditLog.setMasterChecklistId(checklist.getId());
                auditLog.setReminderDate(prevReminderDate);
                auditLog.setPrevReminderDate(prevReminderDate);
                auditLog.setFrequency(checklist.getFrequency());
                auditLog.setTriggerTime(new Date());
                auditLog.setStatus("Failed");
                auditLog.setErrorMessage(e.getMessage() != null ? e.getMessage() : e.toString());
                qmsChecklistRenewalAuditLogRepository.save(auditLog);
            }
        }
        System.out.println("[ChecklistSchedulerService] executeChecklistRenewalGeneration finished");
        return generatedCount;
    }

    private Date calculateNextReminderDate(Date currentReminderDate, String frequency) {
        if (currentReminderDate == null || frequency == null) {
            return null;
        }
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        java.time.LocalDate localDate = java.time.Instant.ofEpochMilli(currentReminderDate.getTime())
                .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                .toLocalDate();
        java.time.LocalDate nextLocalDate;
        String normalizedFrequency = frequency.trim().toUpperCase();

        switch (normalizedFrequency) {
            case "DAILY":
                nextLocalDate = localDate.plusDays(1);
                break;
            case "WEEKLY":
                nextLocalDate = localDate.plusWeeks(1);
                break;
            case "BIWEEKLY":
            case "BI-WEEKLY":
            case "BI WEEKLY":
            case "FORTNIGHTLY":
                nextLocalDate = localDate.plusWeeks(2);
                break;
            case "MONTHLY":
                nextLocalDate = localDate.plusMonths(1);
                break;
            case "QUARTERLY":
                nextLocalDate = localDate.plusMonths(3);
                break;
            case "HALF YEARLY":
            case "HALF-YEARLY":
            case "HALF_YEARLY":
            case "SEMI ANNUAL":
            case "SEMI-ANNUAL":
                nextLocalDate = localDate.plusMonths(6);
                break;
            case "YEARLY":
            case "ANNUALLY":
            case "ANNUAL":
                nextLocalDate = localDate.plusYears(1);
                break;
            case "ONCE EVERY 2 YEARS":
            case "ONCE_EVERY_2_YEARS":
            case "EVERY 2 YEARS":
            case "2 YEARS":
                nextLocalDate = localDate.plusYears(2);
                break;
            case "ONCE EVERY 3 YEARS":
            case "ONCE_EVERY_3_YEARS":
            case "EVERY 3 YEARS":
            case "3 YEARS":
                nextLocalDate = localDate.plusYears(3);
                break;
            default:
                log.warn("Unknown frequency '{}' for reminder date calculation. Defaulting to MONTHLY.", frequency);
                nextLocalDate = localDate.plusMonths(1);
        }

        // Safety guard: if the computed next date is still in the past (e.g.
        // long-overdue master),
        // keep advancing by one period until the next reminder is strictly in the
        // future.
        while (!nextLocalDate.isAfter(today)) {
            log.warn("Calculated next reminder date {} is not in the future. Advancing one more period (frequency={}).",
                    nextLocalDate, frequency);
            switch (normalizedFrequency) {
                case "DAILY":
                    nextLocalDate = nextLocalDate.plusDays(1);
                    break;
                case "WEEKLY":
                    nextLocalDate = nextLocalDate.plusWeeks(1);
                    break;
                case "BIWEEKLY":
                case "BI-WEEKLY":
                case "BI WEEKLY":
                case "FORTNIGHTLY":
                    nextLocalDate = nextLocalDate.plusWeeks(2);
                    break;
                case "MONTHLY":
                    nextLocalDate = nextLocalDate.plusMonths(1);
                    break;
                case "QUARTERLY":
                    nextLocalDate = nextLocalDate.plusMonths(3);
                    break;
                case "HALF YEARLY":
                case "HALF-YEARLY":
                case "HALF_YEARLY":
                case "SEMI ANNUAL":
                case "SEMI-ANNUAL":
                    nextLocalDate = nextLocalDate.plusMonths(6);
                    break;
                case "YEARLY":
                case "ANNUALLY":
                case "ANNUAL":
                    nextLocalDate = nextLocalDate.plusYears(1);
                    break;
                case "ONCE EVERY 2 YEARS":
                case "ONCE_EVERY_2_YEARS":
                case "EVERY 2 YEARS":
                case "2 YEARS":
                    nextLocalDate = nextLocalDate.plusYears(2);
                    break;
                case "ONCE EVERY 3 YEARS":
                case "ONCE_EVERY_3_YEARS":
                case "EVERY 3 YEARS":
                case "3 YEARS":
                    nextLocalDate = nextLocalDate.plusYears(3);
                    break;
                default:
                    nextLocalDate = nextLocalDate.plusMonths(1);
            }
        }

        return java.util.Date.from(nextLocalDate.atStartOfDay(java.time.ZoneId.of("Asia/Kolkata")).toInstant());
    }

    public int executeChecklistGeneration() {
        return executeChecklistGeneration(new Date());
    }

    @Transactional
    public int executeChecklistGeneration(Date today) {
        System.out.println("[ChecklistSchedulerService] executeChecklistGeneration started");
        log.info("Starting recurring checklist assignment generation for target date: {}...", today);

        int generatedCount = 0;
        try {
            ChecklistAutoAssignmentService.startCache();

            log.info("Processing pending checklist assignments for activation...");
            try {
                List<ChecklistAssignment> pendingAssignments = assignRepo.findByPendingActivationTrue();
                java.time.LocalDate localToday = java.time.Instant.ofEpochMilli(today.getTime())
                        .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();

                // Group pending assignments by Checklist ID, Group Name, and Checklist Date
                java.util.Map<String, List<ChecklistAssignment>> grouped = pendingAssignments.stream()
                        .filter(a -> a.getChecklist() != null && a.getChecklistDate() != null)
                        .collect(java.util.stream.Collectors.groupingBy(a -> {
                            java.time.LocalDate localDate = java.time.Instant.ofEpochMilli(a.getChecklistDate().getTime())
                                    .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
                            String g = a.getGroupName();
                            String normGroup = (g == null || g.trim().isEmpty() || "-".equals(g.trim())) ? "-" : g.trim().toUpperCase();
                            return a.getChecklist().getId() + "_" + normGroup + "_" + localDate.toString();
                        }));

                for (java.util.Map.Entry<String, List<ChecklistAssignment>> entry : grouped.entrySet()) {
                    List<ChecklistAssignment> group = entry.getValue();
                    if (group.isEmpty())
                        continue;

                    // Check if the date is due
                    ChecklistAssignment first = group.get(0);
                    java.time.LocalDate localEffective = java.time.Instant.ofEpochMilli(first.getChecklistDate().getTime())
                            .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
                    if (localToday.isBefore(localEffective)) {
                        continue; // Not due yet
                    }

                    // Resolve Primary, Secondary, Tertiary
                    ChecklistAssignment primaryAssign = group.stream()
                            .filter(a -> "PRIMARY".equalsIgnoreCase(a.getAssignType()))
                            .findFirst().orElse(null);
                    ChecklistAssignment secondaryAssign = group.stream()
                            .filter(a -> "SECONDARY".equalsIgnoreCase(a.getAssignType()))
                            .findFirst().orElse(null);
                    ChecklistAssignment tertiaryAssign = group.stream()
                            .filter(a -> "TERTIARY".equalsIgnoreCase(a.getAssignType()))
                            .findFirst().orElse(null);

                    ChecklistAssignment selected = null;

                    // 1. Check Primary availability
                    if (primaryAssign != null) {
                        Long empId = resolveEmployeeId(primaryAssign.getAssignedTo());
                        if (empId != null
                                && checklistAutoAssignmentService.isEmployeeAvailable(empId, localEffective).available) {
                            selected = primaryAssign;
                        }
                    }

                    // 2. Check Secondary availability
                    if (selected == null && secondaryAssign != null) {
                        Long empId = resolveEmployeeId(secondaryAssign.getAssignedTo());
                        if (empId != null
                                && checklistAutoAssignmentService.isEmployeeAvailable(empId, localEffective).available) {
                            selected = secondaryAssign;
                        }
                    }

                    // 3. Check Tertiary availability
                    if (selected == null && tertiaryAssign != null) {
                        Long empId = resolveEmployeeId(tertiaryAssign.getAssignedTo());
                        if (empId != null
                                && checklistAutoAssignmentService.isEmployeeAvailable(empId, localEffective).available) {
                            selected = tertiaryAssign;
                        }
                    }

                    // Fallback: Default to Primary if all are on leave
                    if (selected == null) {
                        selected = primaryAssign != null ? primaryAssign
                                : (secondaryAssign != null ? secondaryAssign : tertiaryAssign);
                    }

                    if (selected != null) {
                        // Activate the selected assignment
                        selected.setPendingActivation(false);
                        selected.setIsActive(true);
                        selected.setStatus(getOrCreateStatus("Active"));
                        assignRepo.save(selected);
                        checklistService.saveToFrequencyTable(selected);
                        log.info("Activated pending checklist assignment ID {} of type {} for checklist ID {}",
                                selected.getId(), selected.getAssignType(), selected.getChecklist().getId());
                    }
                }

                // Process any pending assignments that have null checklist or checklistDate
                // individually
                List<ChecklistAssignment> individualPendings = pendingAssignments.stream()
                        .filter(a -> a.getChecklist() == null || a.getChecklistDate() == null)
                        .collect(java.util.stream.Collectors.toList());
                for (ChecklistAssignment a : individualPendings) {
                    a.setPendingActivation(false);
                    a.setIsActive(true);
                    a.setStatus(getOrCreateStatus("Active"));
                    assignRepo.save(a);
                    checklistService.saveToFrequencyTable(a);
                }
            } catch (Exception e) {
                log.error("Error in pending assignments activation: {}", e.getMessage(), e);
            }

            java.util.Calendar todayCalNorm = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            todayCalNorm.setTime(today != null ? today : new Date());
            todayCalNorm.set(java.util.Calendar.HOUR_OF_DAY, 0);
            todayCalNorm.set(java.util.Calendar.MINUTE, 0);
            todayCalNorm.set(java.util.Calendar.SECOND, 0);
            todayCalNorm.set(java.util.Calendar.MILLISECOND, 0);
            Date todayMidnight = todayCalNorm.getTime();

            if (isDateHoliday(todayMidnight)) {
                log.info("Today is a company holiday. Skipping recurring checklist assignment generation.");
                return generatedCount;
            }

            // Bulk pre-fetch all today's assignments in 1 query to prevent N+1 DB duplicate checks
            List<ChecklistAssignment> todayAssignments = assignRepo.findByChecklistDate(todayMidnight);
            java.util.Set<Long> generatedChecklistIds = todayAssignments.stream()
                    .filter(a -> a.getChecklist() != null)
                    .map(a -> a.getChecklist().getId())
                    .collect(java.util.stream.Collectors.toSet());

            List<MasterChecklist> activeChecklists = masterRepo.findActiveTemplatesForGeneration();
            Calendar cal = Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
            cal.setTime(todayMidnight);

            int dayOfWeek = cal.get(Calendar.DAY_OF_WEEK); // 1 = Sunday, 2 = Monday...
            int dayOfMonth = cal.get(Calendar.DAY_OF_MONTH);

            for (MasterChecklist checklist : activeChecklists) {
                if ("RENEWAL".equalsIgnoreCase(checklist.getCategory())) {
                    continue; // RENEWAL category checklists are generated by executeChecklistRenewalGeneration
                }

                // Skip if not active or not verified
                if (checklist.getIsActive() == null || !checklist.getIsActive()
                        || !"VERIFIED".equalsIgnoreCase(checklist.getVerifyStatus())) {
                    continue;
                }

                // If verified today, skip today's generation to avoid generating tasks for
                // the next day's 4:00 AM scheduler
                if (checklist.getVerifiedDate() != null) {
                    java.time.LocalDate localVerifiedDate = java.time.Instant
                            .ofEpochMilli(checklist.getVerifiedDate().getTime())
                            .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                            .toLocalDate();
                    java.time.LocalDate todayLocalDate = java.time.Instant.ofEpochMilli(today.getTime())
                            .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                            .toLocalDate();
                    if (!localVerifiedDate.isBefore(todayLocalDate)) {
                        log.info("Skipping checklist {} as it was verified today. Activation will run next day at 4:00 AM.",
                                checklist.getSeqNo());
                        continue;
                    }
                }

                if (checklist.getEffectiveFrom() != null) {
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyyMMdd");
                    sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                    String todayStr = sdf.format(today);
                    String effectiveStr = sdf.format(checklist.getEffectiveFrom());
                    if (effectiveStr.compareTo(todayStr) > 0) {
                        continue; // Skip generating if today is before the effective date
                    }
                }

                String frequency = checklist.getFrequency();
                if (frequency == null)
                    continue;

                boolean shouldGenerate = false;

                // Anchoring logic: Recurrence is based on the components of the 'Effective
                // From' date
                Calendar effectiveCal = Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                if (checklist.getEffectiveFrom() != null) {
                    effectiveCal.setTime(checklist.getEffectiveFrom());
                } else {
                    effectiveCal.setTime(checklist.getCreatedDate() != null ? checklist.getCreatedDate() : today);
                }

                int effectiveDayOfWeek = effectiveCal.get(Calendar.DAY_OF_WEEK);
                int effectiveDayOfMonth = effectiveCal.get(Calendar.DAY_OF_MONTH);
                int effectiveMonth = effectiveCal.get(Calendar.MONTH);

                switch (frequency.toUpperCase()) {
                    case "DAILY":
                        shouldGenerate = true;
                        break;
                    case "WEEKLY":
                        // If a specific weekday is configured, use it. Otherwise, fall back to the
                        // Effective From weekday.
                        if (checklist.getWeekDays() != null && !checklist.getWeekDays().trim().isEmpty()) {
                            String configuredDay = checklist.getWeekDays().trim().toUpperCase();
                            int targetDayOfWeek = -1;
                            if (configuredDay.contains("SUN"))
                                targetDayOfWeek = Calendar.SUNDAY;
                            else if (configuredDay.contains("MON"))
                                targetDayOfWeek = Calendar.MONDAY;
                            else if (configuredDay.contains("TUE"))
                                targetDayOfWeek = Calendar.TUESDAY;
                            else if (configuredDay.contains("WED"))
                                targetDayOfWeek = Calendar.WEDNESDAY;
                            else if (configuredDay.contains("THU"))
                                targetDayOfWeek = Calendar.THURSDAY;
                            else if (configuredDay.contains("FRI"))
                                targetDayOfWeek = Calendar.FRIDAY;
                            else if (configuredDay.contains("SAT"))
                                targetDayOfWeek = Calendar.SATURDAY;

                            if (targetDayOfWeek != -1) {
                                if (dayOfWeek == targetDayOfWeek) {
                                    shouldGenerate = true;
                                }
                            } else {
                                if (dayOfWeek == effectiveDayOfWeek) {
                                    shouldGenerate = true;
                                }
                            }
                        } else {
                            // Generate on the same weekday as the Effective From date
                            if (dayOfWeek == effectiveDayOfWeek) {
                                shouldGenerate = true;
                            }
                        }
                        break;
                    case "FORTNIGHTLY":
                        // Strictly every 14 days from the anchor Effective From date
                        Calendar todayCal = Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                        todayCal.setTime(today);
                        todayCal.set(Calendar.HOUR_OF_DAY, 0);
                        todayCal.set(Calendar.MINUTE, 0);
                        todayCal.set(Calendar.SECOND, 0);
                        todayCal.set(Calendar.MILLISECOND, 0);

                        Calendar startCal = Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                        startCal.setTime(checklist.getEffectiveFrom() != null ? checklist.getEffectiveFrom()
                                : (checklist.getCreatedDate() != null ? checklist.getCreatedDate() : today));
                        startCal.set(Calendar.HOUR_OF_DAY, 0);
                        startCal.set(Calendar.MINUTE, 0);
                        startCal.set(Calendar.SECOND, 0);
                        startCal.set(Calendar.MILLISECOND, 0);

                        long diffMs = todayCal.getTimeInMillis() - startCal.getTimeInMillis();
                        long diffDays = diffMs / (24 * 60 * 60 * 1000);
                        if (diffDays >= 0 && diffDays % 14 == 0) {
                            shouldGenerate = true;
                        }
                        break;
                    case "MONTHLY": {
                        // Canonical target: same day-of-month as effectiveFrom, this current month
                        java.time.LocalDate todayLocal = java.time.Instant.ofEpochMilli(today.getTime())
                                .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
                        java.time.LocalDate canonicalTarget;
                        try {
                            canonicalTarget = java.time.LocalDate.of(todayLocal.getYear(), todayLocal.getMonth(),
                                    effectiveDayOfMonth);
                        } catch (java.time.DateTimeException e) {
                            // effectiveDayOfMonth doesn't exist in this month (e.g. 31st in April) – use
                            // last day
                            canonicalTarget = todayLocal.withDayOfMonth(todayLocal.lengthOfMonth());
                        }
                        java.time.LocalDate resolvedMonthly = resolveEffectiveGenerationDate(canonicalTarget);
                        if (todayLocal.equals(resolvedMonthly)) {
                            shouldGenerate = true;
                        }
                        break;
                    }
                    case "QUARTERLY": {
                        // Every 3 months on the same date, accounting for year boundary
                        java.time.LocalDate todayLocalQ = java.time.Instant.ofEpochMilli(today.getTime())
                                .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
                        int mDiff = (cal.get(Calendar.YEAR) - effectiveCal.get(Calendar.YEAR)) * 12
                                + (cal.get(Calendar.MONTH) - effectiveMonth);
                        if (mDiff >= 0 && mDiff % 3 == 0) {
                            java.time.LocalDate canonicalTargetQ;
                            try {
                                canonicalTargetQ = java.time.LocalDate.of(todayLocalQ.getYear(), todayLocalQ.getMonth(),
                                        effectiveDayOfMonth);
                            } catch (java.time.DateTimeException e) {
                                canonicalTargetQ = todayLocalQ.withDayOfMonth(todayLocalQ.lengthOfMonth());
                            }
                            java.time.LocalDate resolvedQ = resolveEffectiveGenerationDate(canonicalTargetQ);
                            if (todayLocalQ.equals(resolvedQ)) {
                                shouldGenerate = true;
                            }
                        }
                        break;
                    }
                    case "HALF YEARLY": {
                        // Every 6 months on the same date, accounting for year boundary
                        java.time.LocalDate todayLocalH = java.time.Instant.ofEpochMilli(today.getTime())
                                .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
                        int mDiff = (cal.get(Calendar.YEAR) - effectiveCal.get(Calendar.YEAR)) * 12
                                + (cal.get(Calendar.MONTH) - effectiveMonth);
                        if (mDiff >= 0 && mDiff % 6 == 0) {
                            java.time.LocalDate canonicalTargetH;
                            try {
                                canonicalTargetH = java.time.LocalDate.of(todayLocalH.getYear(), todayLocalH.getMonth(),
                                        effectiveDayOfMonth);
                            } catch (java.time.DateTimeException e) {
                                canonicalTargetH = todayLocalH.withDayOfMonth(todayLocalH.lengthOfMonth());
                            }
                            java.time.LocalDate resolvedH = resolveEffectiveGenerationDate(canonicalTargetH);
                            if (todayLocalH.equals(resolvedH)) {
                                shouldGenerate = true;
                            }
                        }
                        break;
                    }
                    case "YEARLY": {
                        // Once per year on the same date and month as effectiveFrom
                        java.time.LocalDate todayLocalY = java.time.Instant.ofEpochMilli(today.getTime())
                                .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
                        if (cal.get(Calendar.MONTH) == effectiveMonth) {
                            java.time.LocalDate canonicalTargetY;
                            try {
                                canonicalTargetY = java.time.LocalDate.of(todayLocalY.getYear(), todayLocalY.getMonth(),
                                        effectiveDayOfMonth);
                            } catch (java.time.DateTimeException e) {
                                canonicalTargetY = todayLocalY.withDayOfMonth(todayLocalY.lengthOfMonth());
                            }
                            java.time.LocalDate resolvedY = resolveEffectiveGenerationDate(canonicalTargetY);
                            if (todayLocalY.equals(resolvedY)) {
                                shouldGenerate = true;
                            }
                        }
                        break;
                    }
                    case "CUSTOM": {
                        Integer val = checklist.getRepeatEveryValue();
                        String unit = checklist.getRepeatEveryUnit();
                        if (val != null && val > 0 && unit != null) {
                            Calendar customStartCal = Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                            customStartCal.setTime(checklist.getEffectiveFrom() != null ? checklist.getEffectiveFrom()
                                    : (checklist.getCreatedDate() != null ? checklist.getCreatedDate() : today));
                            customStartCal.set(Calendar.HOUR_OF_DAY, 0);
                            customStartCal.set(Calendar.MINUTE, 0);
                            customStartCal.set(Calendar.SECOND, 0);
                            customStartCal.set(Calendar.MILLISECOND, 0);

                            Calendar customTodayCal = Calendar.getInstance(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
                            customTodayCal.setTime(today);
                            customTodayCal.set(Calendar.HOUR_OF_DAY, 0);
                            customTodayCal.set(Calendar.MINUTE, 0);
                            customTodayCal.set(Calendar.SECOND, 0);
                            customTodayCal.set(Calendar.MILLISECOND, 0);

                            if ("DAYS".equalsIgnoreCase(unit)) {
                                long customDiffMs = customTodayCal.getTimeInMillis() - customStartCal.getTimeInMillis();
                                long customDiffDays = customDiffMs / (24 * 60 * 60 * 1000);
                                if (customDiffDays >= 0 && customDiffDays % val == 0) {
                                    shouldGenerate = true;
                                }
                            } else if ("WEEKS".equalsIgnoreCase(unit)) {
                                long customDiffMs = customTodayCal.getTimeInMillis() - customStartCal.getTimeInMillis();
                                long customDiffDays = customDiffMs / (24 * 60 * 60 * 1000);
                                if (customDiffDays >= 0 && customDiffDays % 7 == 0) {
                                    long customDiffWeeks = customDiffDays / 7;
                                    if (customDiffWeeks % val == 0) {
                                        shouldGenerate = true;
                                    }
                                }
                            } else if ("MONTHS".equalsIgnoreCase(unit)) {
                                int mDiff = (cal.get(Calendar.YEAR) - customStartCal.get(Calendar.YEAR)) * 12
                                        + (cal.get(Calendar.MONTH) - customStartCal.get(Calendar.MONTH));
                                if (mDiff >= 0 && mDiff % val == 0
                                        && cal.get(Calendar.DAY_OF_MONTH) == customStartCal.get(Calendar.DAY_OF_MONTH)) {
                                    shouldGenerate = true;
                                }
                            } else if ("YEARS".equalsIgnoreCase(unit)) {
                                int yDiff = cal.get(Calendar.YEAR) - customStartCal.get(Calendar.YEAR);
                                if (yDiff >= 0 && yDiff % val == 0
                                        && cal.get(Calendar.MONTH) == customStartCal.get(Calendar.MONTH)
                                        && cal.get(Calendar.DAY_OF_MONTH) == customStartCal.get(Calendar.DAY_OF_MONTH)) {
                                    shouldGenerate = true;
                                }
                            }
                        }
                        break;
                    }
                }

                if (shouldGenerate) {
                    java.time.LocalDate targetGenerationDate = java.time.Instant.ofEpochMilli(todayMidnight.getTime())
                            .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();
                    
                    if (generatedChecklistIds.contains(checklist.getId())) {
                        log.info(
                                "Checklist {} has already been generated for target date {}. Skipping generation to prevent duplicates.",
                                checklist.getSeqNo(), targetGenerationDate);
                        continue;
                    }

                    try {
                        log.info("Generating auto-assignment for Checklist: {} on {}", checklist.getSeqNo(), todayMidnight);
                        checklistAutoAssignmentService.processAutoAssignment(checklist.getId(), todayMidnight);
                        generatedCount++;
                        generatedChecklistIds.add(checklist.getId());
                    } catch (Exception e) {
                        log.error("Failed to auto-assign checklist {}: {}", checklist.getSeqNo(), e.getMessage());
                    }
                }
            }

            log.info("Recurring checklist assignment generation completed. Total generated: {}", generatedCount);
            System.out.println("[ChecklistSchedulerService] executeChecklistGeneration finished");
            return generatedCount;
        } finally {
            ChecklistAutoAssignmentService.clearCache();
        }
    }

    private Long resolveEmployeeId(String assignedTo) {
        if (assignedTo == null || assignedTo.trim().isEmpty())
            return null;
        try {
            return Long.parseLong(assignedTo.trim());
        } catch (NumberFormatException ignored) {
        }
        String cacheKey = "emp_resolve_" + assignedTo.trim();
        java.util.Map<String, Object> cache = ChecklistAutoAssignmentService.getCache();
        if (cache != null && cache.containsKey(cacheKey)) {
            return (Long) cache.get(cacheKey);
        }
        Long id = employeeMasterRepository.findByEmpCodeOrName(assignedTo.trim())
                .map(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster::getId)
                .orElse(null);
        if (cache != null) {
            cache.put(cacheKey, id);
        }
        return id;
    }

    /**
     * Runs every day at 11:59 PM IST to process uncompleted checklists
     * Cron: "0 59 23 * * *" in Asia/Kolkata
     */
    @Scheduled(cron = "0 59 23 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void processUncompletedChecklists() {
        processUncompletedChecklists(new Date());
    }

    @Transactional
    public void processUncompletedChecklists(Date targetDate) {
        System.out.println("[ChecklistSchedulerService] processUncompletedChecklists started");
        log.info("Starting Checklist EOD Trigger process targeting date: {}", targetDate);

        try {
            ChecklistAutoAssignmentService.startCache();

            // Resolve trigger type from context
            String triggerType = "Automatic";
            com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext ctx = com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext
                    .get();
            if (ctx != null && "MANUAL".equalsIgnoreCase(ctx.getExecutionType())) {
                triggerType = "Manual";
            }

            // Get Missed status
            StatusMaster missedStatus = getOrCreateStatus("Missed");

            // 4. Eligibility Criteria: Category = Checklist, Carry Forward = No, Status IN
            // (Open, Pending), Checklist Date <= targetDate
            List<ChecklistClosed> eligibleChecklists = closedRepo.findEligibleEodChecklists(targetDate);
            log.info("Found {} eligible checklist records to mark as MISSED.", eligibleChecklists.size());

            java.util.Set<Long> processedIds = qmsChecklistEodAuditLogRepository
                    .findChecklistClosedIdsByProcessingDateAndStatus(targetDate, "Success");

            for (ChecklistClosed closed : eligibleChecklists) {
                String prevStatusName = closed.getStatus() != null ? closed.getStatus().getName() : "Unknown";

                // 6. Duplicate Prevention/Idempotency
                if (processedIds.contains(closed.getId()) || "Missed".equalsIgnoreCase(prevStatusName)) {
                    log.info(
                            "Checklist closed ID {} has already been successfully processed/updated for processing date {}. Skipping.",
                            closed.getId(), targetDate);
                    continue;
                }

                // 7. Error Handling: Process each record independently
                try {
                    closed.setStatus(missedStatus);
                    closed.setUpdatedAt(new Date());
                    closed.setUpdatedBy("SUPER BOSS");
                    closedRepo.save(closed);

                    // 8. Audit Logging (Success)
                    QmsChecklistEodAuditLog auditLog = new QmsChecklistEodAuditLog();
                    auditLog.setChecklistClosedId(closed.getId());
                    auditLog.setProcessingDate(targetDate);
                    auditLog.setPreviousStatus(prevStatusName);
                    auditLog.setUpdatedStatus("Missed");
                    auditLog.setTriggerType(triggerType);
                    auditLog.setExecutionTime(new Date());
                    auditLog.setStatus("Success");
                    qmsChecklistEodAuditLogRepository.save(auditLog);

                    log.info("Successfully marked Checklist Closed ID {} as MISSED.", closed.getId());

                } catch (Exception e) {
                    log.error("Failed to update Checklist Closed ID {}: {}", closed.getId(), e.getMessage(), e);

                    // 8. Audit Logging (Failed)
                    QmsChecklistEodAuditLog auditLog = new QmsChecklistEodAuditLog();
                    auditLog.setChecklistClosedId(closed.getId());
                    auditLog.setProcessingDate(targetDate);
                    auditLog.setPreviousStatus(prevStatusName);
                    auditLog.setTriggerType(triggerType);
                    auditLog.setExecutionTime(new Date());
                    auditLog.setStatus("Failed");
                    auditLog.setErrorMessage(e.getMessage() != null ? e.getMessage() : e.toString());
                    qmsChecklistEodAuditLogRepository.save(auditLog);
                }
            }

            log.info("Completed processing of uncompleted checklists.");
            System.out.println("[ChecklistSchedulerService] processUncompletedChecklists finished");
        } finally {
            ChecklistAutoAssignmentService.clearCache();
        }
    }

    /**
     * Runs daily at 10:00 AM, 2:00 PM, and 4:00 PM IST to run reassignment check
     * Cron: "0 0 10,14,16 * * *" in Asia/Kolkata
     */
    // @Scheduled(cron = "0 0 10,14,16 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void runReassignmentScheduler() {
        System.out.println("[ChecklistSchedulerService] runReassignmentScheduler started");
        log.info("Starting scheduled auto-reassignment check...");
        Date today = new Date();
        if (isDateHoliday(today)) {
            log.info("Today is a company holiday. Skipping scheduled auto-reassignment check.");
            System.out.println("[ChecklistSchedulerService] runReassignmentScheduler finished");
            return;
        }
        try {
            ChecklistAutoAssignmentService.startCache();
            checklistAutoAssignmentService.runReassignmentCheckForOpenAssignments();
        } finally {
            ChecklistAutoAssignmentService.clearCache();
        }
        log.info("Scheduled auto-reassignment check completed.");
        System.out.println("[ChecklistSchedulerService] runReassignmentScheduler finished");
    }

    /**
     * Returns true if the given date is a Sunday or a mandatory (non-optional)
     * company holiday.
     */
    private boolean isDateHoliday(Date date) {
        java.time.LocalDate localDate = java.time.Instant.ofEpochMilli(date.getTime())
                .atZone(java.time.ZoneId.of("Asia/Kolkata"))
                .toLocalDate();
        return isNonWorkingDay(localDate);
    }

    /**
     * Returns true if the given LocalDate is a Sunday or a mandatory (non-optional)
     * company holiday.
     */
    private boolean isNonWorkingDay(java.time.LocalDate localDate) {
        // Sunday is always non-working
        if (localDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            return true;
        }
        // Check mandatory company holidays
        List<HrHolidayMaster> holidays = hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(localDate);
        for (HrHolidayMaster holiday : holidays) {
            if (holiday.getIsOptional() == null || !holiday.getIsOptional()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Given a target scheduled date (e.g. the 11th for a monthly checklist),
     * resolves
     * the actual generation date following the weekend/holiday fallback rules.
     */
    private String getHolidayStrategySetting() {
        try {
            return scheduleConfigurationRepository.findAll().stream()
                    .filter(c -> "CHECKLIST".equalsIgnoreCase(c.getSchedularName()))
                    .findFirst()
                    .map(com.autonoma.erp.modules.admin.schedule.entity.ScheduleConfiguration::getHolidayStrategy)
                    .orElse("NEXT");
        } catch (Exception e) {
            return "NEXT";
        }
    }

    private java.time.LocalDate resolveEffectiveGenerationDate(java.time.LocalDate targetDate) {
        if (!isNonWorkingDay(targetDate)) {
            // Normal working day – generate on the target date itself
            return targetDate;
        }

        String strategy = getHolidayStrategySetting();

        if ("PREVIOUS".equalsIgnoreCase(strategy)) {
            // Strategy A: Move to the working day BEFORE the block starts
            java.time.LocalDate beforeBlock = targetDate.minusDays(1);
            while (isNonWorkingDay(beforeBlock)) {
                beforeBlock = beforeBlock.minusDays(1);
            }
            return beforeBlock;
        } else {
            // Strategy B: Move to the NEXT working day after the block ends
            java.time.LocalDate afterBlock = targetDate.plusDays(1);
            while (isNonWorkingDay(afterBlock)) {
                afterBlock = afterBlock.plusDays(1);
            }
            return afterBlock;
        }
    }

    private StatusMaster getOrCreateStatus(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        String trimmedName = name.trim();
        return statusRepo.findByNameIgnoreCase(trimmedName).orElseGet(() -> {
            StatusMaster sm = new StatusMaster();
            sm.setName(trimmedName);
            return statusRepo.save(sm);
        });
    }

    @Transactional
    public int executeChecklistDynamicGeneration(Date today) {
        log.info("Starting dynamic checklist assignment generation for target date: {}...", today);
        int generatedCount = 0;

        if (isDateHoliday(today)) {
            log.info("Today is a holiday. Skipping dynamic checklist generation.");
            return generatedCount;
        }

        try {
            List<MasterChecklist> activeChecklists = masterRepo.findActiveTemplatesForGeneration();
            java.time.LocalDate localToday = java.time.Instant.ofEpochMilli(today.getTime())
                    .atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate();

            for (MasterChecklist checklist : activeChecklists) {
                // We only care about checklists where eventTrigger is 'Default'
                if (checklist.getEventTrigger() == null
                        || !"Default".equalsIgnoreCase(checklist.getEventTrigger().trim())) {
                    continue;
                }

                // Check verification status
                if (checklist.getVerifyStatus() == null || !"Verified".equalsIgnoreCase(checklist.getVerifyStatus())) {
                    continue;
                }

                // Evaluate dynamic rules and find all matching employees
                List<Long> matchedEmpIds = checklistService.getMatchedEmployeeIds(checklist.getDynamicRuleJson(), null);

                for (Long matchedEmpId : matchedEmpIds) {
                    // Calculate offset date if specified
                    Date targetDate = today;
                    if (checklist.getOffsetDays() != null) {
                        int days = checklist.getOffsetDays();
                        Calendar cal = Calendar.getInstance();
                        cal.setTime(targetDate);
                        if ("BEFORE".equalsIgnoreCase(checklist.getOffsetType())) {
                            cal.add(Calendar.DATE, -days);
                        } else {
                            cal.add(Calendar.DATE, days);
                        }
                        targetDate = cal.getTime();
                    }

                    log.info("Dynamic Scheduler triggering assignment for checklist ID {} on date {} for employee ID {}",
                            checklist.getId(), targetDate, matchedEmpId);
                    
                    // Set thread local context to inject dynamic assignee and triggerId into assignment engine
                    com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext ctx = 
                        com.autonoma.erp.modules.qms.checklist.context.ChecklistSchedulerContext.get();
                    ctx.setDynamicPrimaryEmployeeId(matchedEmpId);
                    ctx.setTriggerId(matchedEmpId);
                    ctx.setDueDate(targetDate);
                    
                    try {
                        checklistAutoAssignmentService.processAutoAssignment(checklist.getId(), targetDate);
                        generatedCount++;
                    } finally {
                        ctx.setDynamicPrimaryEmployeeId(null);
                        ctx.setTriggerId(null);
                        ctx.setDueDate(null);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in dynamic checklist generation: {}", e.getMessage(), e);
        }

        return generatedCount;
    }

    private boolean evaluateSchedulerRules(String ruleJson, java.time.LocalDate localDate) {
        if (ruleJson == null || ruleJson.trim().isEmpty()) {
            return true; // No conditions means always run
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> rules = mapper.readValue(ruleJson,
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {
                    });
            int day = localDate.getDayOfMonth();
            int month = localDate.getMonthValue();
            int year = localDate.getYear();
            String dayOfWeekName = localDate.getDayOfWeek().name();
            int weekOfMonth = localDate.get(java.time.temporal.ChronoField.ALIGNED_WEEK_OF_MONTH);
            int weekOfYear = localDate.get(java.time.temporal.ChronoField.ALIGNED_WEEK_OF_YEAR);

            for (java.util.Map.Entry<String, Object> entry : rules.entrySet()) {
                String key = entry.getKey().trim().toLowerCase();
                String valStr = String.valueOf(entry.getValue()).trim();

                boolean match = false;
                if (key.contains("dayofmonth") || key.equals("day") || key.equals("currentday")) {
                    match = compareNumericCondition(day, valStr);
                } else if (key.contains("month") || key.equals("currentmonth")) {
                    match = compareNumericCondition(month, valStr);
                } else if (key.contains("year") || key.equals("currentyear")) {
                    match = compareNumericCondition(year, valStr);
                } else if (key.contains("weekday") || key.contains("dayofweek")) {
                    match = dayOfWeekName.equalsIgnoreCase(valStr)
                            || valStr.toUpperCase().contains(dayOfWeekName.substring(0, 3));
                } else if (key.contains("weekofmonth") || key.equals("week") || key.equals("currentweek")) {
                    match = compareNumericCondition(weekOfMonth, valStr) || compareNumericCondition(weekOfYear, valStr);
                } else {
                    match = false;
                }

                if (!match) {
                    return false;
                }
            }
            return true;
        } catch (Exception e) {
            log.error("Error evaluating dynamic scheduler rules: " + e.getMessage(), e);
            return false;
        }
    }

    private boolean compareNumericCondition(int actual, String expected) {
        expected = expected.trim();
        if (expected.startsWith(">=")) {
            try {
                return actual >= Integer.parseInt(expected.substring(2).trim());
            } catch (Exception e) {
                return false;
            }
        } else if (expected.startsWith("<=")) {
            try {
                return actual <= Integer.parseInt(expected.substring(2).trim());
            } catch (Exception e) {
                return false;
            }
        } else if (expected.startsWith(">")) {
            try {
                return actual > Integer.parseInt(expected.substring(1).trim());
            } catch (Exception e) {
                return false;
            }
        } else if (expected.startsWith("<")) {
            try {
                return actual < Integer.parseInt(expected.substring(1).trim());
            } catch (Exception e) {
                return false;
            }
        } else if (expected.startsWith("!=") || expected.startsWith("<>")) {
            try {
                return actual != Integer.parseInt(expected.substring(2).trim());
            } catch (Exception e) {
                return false;
            }
        } else {
            try {
                return actual == Integer.parseInt(expected);
            } catch (Exception e) {
                return false;
            }
        }
    }
}

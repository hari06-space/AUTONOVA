package com.autonoma.erp.modules.qms.meeting.service;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMomMaster;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMomMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Meeting Scheduler Service — Runs daily at 04:00 AM IST.
 * 
 * Responsibilities:
 * 1. Auto-close expired OPEN meeting schedules (past end time)
 * 2. Mark overdue MOM ACTION items where target date has passed
 * 3. Generate recurrence schedules for DAILY/WEEKLY meetings
 */
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;

@Service
@Slf4j
public class MeetingSchedulerService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MeetingSchedulerService.class);

    private final QmsMeetingScheduleRepository scheduleRepository;
    private final QmsMomMasterRepository momRepository;
    private final com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusRepo;
    private final AppNotificationRepository notificationRepo;
    private final com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository hrHolidayMasterRepository;
    private final com.autonoma.erp.modules.admin.schedule.repository.ScheduleConfigurationRepository scheduleConfigurationRepository;
    private final com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingMasterRepository qmsMeetingMasterRepository;
    private final com.autonoma.erp.modules.qms.meeting.repository.QmsScheduleMeetingConfigRepository qmsScheduleMeetingConfigRepository;
    private final com.autonoma.erp.service.admin.EmailSendingService emailSendingService;
    private final com.autonoma.erp.repository.admin.AppPreferenceRepository appPreferenceRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository leaveEntryRepository;
    private final com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepository;
    private final DynamicRuleEngineService dynamicRuleEngineService;

    @org.springframework.beans.factory.annotation.Autowired
    public MeetingSchedulerService(
            QmsMeetingScheduleRepository scheduleRepository,
            QmsMomMasterRepository momRepository,
            com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository statusRepo,
            AppNotificationRepository notificationRepo,
            com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository hrHolidayMasterRepository,
            com.autonoma.erp.modules.admin.schedule.repository.ScheduleConfigurationRepository scheduleConfigurationRepository,
            com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingMasterRepository qmsMeetingMasterRepository,
            com.autonoma.erp.modules.qms.meeting.repository.QmsScheduleMeetingConfigRepository qmsScheduleMeetingConfigRepository,
            com.autonoma.erp.service.admin.EmailSendingService emailSendingService,
            com.autonoma.erp.repository.admin.AppPreferenceRepository appPreferenceRepository,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate,
            com.autonoma.erp.modules.hr.leave.repository.LeaveEntryRepository leaveEntryRepository,
            com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepository,
            DynamicRuleEngineService dynamicRuleEngineService) {
        this.scheduleRepository = scheduleRepository;
        this.momRepository = momRepository;
        this.statusRepo = statusRepo;
        this.notificationRepo = notificationRepo;
        this.hrHolidayMasterRepository = hrHolidayMasterRepository;
        this.scheduleConfigurationRepository = scheduleConfigurationRepository;
        this.qmsMeetingMasterRepository = qmsMeetingMasterRepository;
        this.qmsScheduleMeetingConfigRepository = qmsScheduleMeetingConfigRepository;
        this.emailSendingService = emailSendingService;
        this.appPreferenceRepository = appPreferenceRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.leaveEntryRepository = leaveEntryRepository;
        this.employeeJobProfileRepository = employeeJobProfileRepository;
        this.dynamicRuleEngineService = dynamicRuleEngineService;
    }

    // Self-injection: allows internal method calls to go through the Spring proxy
    // so @Transactional(REQUIRES_NEW) annotations work correctly.
    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private MeetingSchedulerService self;

    private volatile long lastAutoCloseRun = 0;
    private volatile long lastOverdueRun = 0;
    private volatile long lastMaintenanceRun = 0;

    /**
     * Daily job at 4:00 AM IST.
     * Cron: second minute hour dayOfMonth month dayOfWeek
     * 
     * Note: Hardcoded schedule removed. Now invoked dynamically via
     * DynamicScheduleTriggerService according to Trigger Configuration UI.
     */
    @Scheduled(cron = "0 0 4 * * ?", zone = "Asia/Kolkata")
    @Transactional(isolation = Isolation.READ_UNCOMMITTED)
    public void dailyMeetingMaintenance() {
        dailyMeetingMaintenance(false);
    }

    @Transactional(isolation = Isolation.READ_UNCOMMITTED)
    public void dailyMeetingMaintenance(boolean force) {
        dailyMeetingMaintenance(force, null);
    }

    @Transactional(isolation = Isolation.READ_UNCOMMITTED)
    public void dailyMeetingMaintenance(boolean force, LocalDate targetDate) {
        long nowMs = System.currentTimeMillis();
        // Cooldown: entire maintenance block runs at most once per hour to avoid OOM
        if (!force && (nowMs - lastMaintenanceRun < 3600000)) {
            return;
        }
        lastMaintenanceRun = nowMs;

        if (!force) {
            // 1. Check BOS Trigger config
            java.util.Optional<com.autonoma.erp.modules.admin.schedule.entity.ScheduleConfiguration> configOpt = scheduleConfigurationRepository
                    .findAll().stream()
                    .filter(c -> "MEETING".equalsIgnoreCase(c.getSchedularName()))
                    .findFirst();
            if (configOpt.isPresent()) {
                com.autonoma.erp.modules.admin.schedule.entity.ScheduleConfiguration config = configOpt.get();
                if (config.getStatus() != null && !config.getStatus()) {
                    log.info("===== Meeting Scheduler Trigger is DISABLED in BOS Trigger. Skipping execution. =====");
                    return;
                }
            }
        }

        LocalDate effectiveDate = targetDate != null ? targetDate : LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        log.info("===== Meeting Scheduler START — {} =====", effectiveDate);
        // Call through 'self' proxy so @Transactional(REQUIRES_NEW) is respected:
        // autoClose commits first → promoteDraft -> generateRecurring reads fresh committed data.
        self.autoCloseExpiredSchedules(true);
        self.markOverdueMomActions();
        self.promoteDraftSchedulesForToday(effectiveDate);
        self.generateRecurringMeetings(force, effectiveDate);
        log.info("===== Meeting Scheduler END =====");
    }

    private boolean isHolidayOrWeekend(LocalDate date) {
        if (date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            return true;
        }
        List<com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster> holidays = hrHolidayMasterRepository
                .findByHolidayDateAndIsActiveTrue(date);
        return holidays != null && !holidays.isEmpty();
    }

    private LocalDate getNextWorkingDay(LocalDate date) {
        LocalDate candidate = date;
        while (isHolidayOrWeekend(candidate)) {
            candidate = candidate.plusDays(1);
        }
        return candidate;
    }

    private synchronized String generateScheduleNo(QmsMeetingSchedule schedule) {
        String prefix = "MEET";
        if (schedule.getMeetingType() != null) {
            Integer mtId = schedule.getMeetingType().getId();
            if (mtId != null) {
                com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingMaster fullType = qmsMeetingMasterRepository
                        .findById(mtId).orElse(null);
                if (fullType != null) {
                    schedule.setMeetingType(fullType);
                    if (fullType.getMeetingPrefix() != null && !fullType.getMeetingPrefix().trim().isEmpty()) {
                        prefix = fullType.getMeetingPrefix().trim();
                    } else if (fullType.getMeetingName() != null && !fullType.getMeetingName().trim().isEmpty()) {
                        String name = fullType.getMeetingName().trim();
                        StringBuilder sb = new StringBuilder();
                        for (String word : name.split("\\s+")) {
                            if (!word.isEmpty()) {
                                sb.append(Character.toUpperCase(word.charAt(0)));
                            }
                        }
                        prefix = sb.toString();
                        if (prefix.isEmpty()) {
                            prefix = name.substring(0, Math.min(name.length(), 4)).toUpperCase();
                        }
                    }
                }
            }
        }
        LocalDate meetingDate = schedule.getMeetingDate() != null ? schedule.getMeetingDate()
                : LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        int year = meetingDate.getYear();
        int month = meetingDate.getMonthValue();
        int startYear = (month >= 4) ? year : (year - 1);
        int endYear = startYear + 1;
        String yearRange = startYear + "-" + endYear;
        String prefixPath = prefix + "/" + yearRange + "/";

        List<String> existing = scheduleRepository.findScheduleNosStartingWith(prefixPath);
        long maxSeq = 0L;
        for (String sNo : existing) {
            if (sNo != null) {
                try {
                    String[] parts = sNo.split("/");
                    long seq = Long.parseLong(parts[parts.length - 1]);
                    if (seq > maxSeq) {
                        maxSeq = seq;
                    }
                } catch (Exception e) {
                    // Ignore parse errors
                }
            }
        }

        long nextSeq = maxSeq + 1;
        return prefixPath + nextSeq;
    }

    private LocalDate getPreviousWorkingDay(LocalDate date) {
        LocalDate candidate = date.minusDays(1);
        while (isHolidayOrWeekend(candidate)) {
            candidate = candidate.minusDays(1);
        }
        return candidate;
    }

    private boolean getPreferenceValueBool(String prefName) {
        java.util.Optional<com.autonoma.erp.model.admin.AppPreference> pref = appPreferenceRepository
                .findByPrefName(prefName);
        if (pref.isPresent()) {
            String val = pref.get().getPrefValue();
            return "YES".equalsIgnoreCase(val) || "Y".equalsIgnoreCase(val) || "TRUE".equalsIgnoreCase(val)
                    || "1".equalsIgnoreCase(val);
        }
        return false;
    }

    private String getPreferenceValueStr(String prefName) {
        java.util.Optional<com.autonoma.erp.model.admin.AppPreference> pref = appPreferenceRepository
                .findByPrefName(prefName);
        return pref.isPresent() ? pref.get().getPrefValue() : null;
    }

    private List<String> getParticipantNames(QmsMeetingSchedule schedule) {
        List<String> names = new java.util.ArrayList<>();
        if (schedule.getParticipants() != null) {
            for (com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping p : schedule
                    .getParticipants()) {
                if (p.getEmployee() != null) {
                    names.add(p.getEmployee().getEmployeeName());
                }
            }
        }
        return names;
    }

    private String getParticipantNamesStr(QmsMeetingSchedule schedule) {
        return String.join(", ", getParticipantNames(schedule));
    }

    private List<String> getRecipients(QmsMeetingSchedule schedule) {
        List<String> emails = new java.util.ArrayList<>();
        if (schedule.getHostBy() != null) {
            java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile> jpOpt = 
                employeeJobProfileRepository.findByEmployeeId(schedule.getHostBy().getId());
            if (jpOpt.isPresent() && jpOpt.get().getOfficeEmail() != null && !jpOpt.get().getOfficeEmail().trim().isEmpty()) {
                emails.add(jpOpt.get().getOfficeEmail().trim());
            }
        }
        if (schedule.getParticipants() != null) {
            for (com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping p : schedule
                    .getParticipants()) {
                if (p.getEmployee() != null) {
                    java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile> jpOpt = 
                        employeeJobProfileRepository.findByEmployeeId(p.getEmployee().getId());
                    if (jpOpt.isPresent() && jpOpt.get().getOfficeEmail() != null && !jpOpt.get().getOfficeEmail().trim().isEmpty()) {
                        emails.add(jpOpt.get().getOfficeEmail().trim());
                    }
                }
            }
        }
        return emails;
    }

    private void sendMeetingAutoSchNotification(QmsMeetingSchedule schedule) {
        if (!getPreferenceValueBool("MINUTES_OF_MEETING_AUTO_MAIL")) {
            return;
        }
        try {
            List<String> recipients = getRecipients(schedule);
            if (recipients.isEmpty())
                return;

            String to = String.join(",", recipients);
            String cc = getPreferenceValueStr("CC_IN_ALL_MAILS_FROM_SUKIERP");

            String subject = "MEETING SCHEDULE NOTIFICATION " + schedule.getScheduleNo();

            StringBuilder html = new StringBuilder();
            html.append("<h2>Dear All,</h2><br/>");
            html.append("<h3>Greetings of the day!</h3>");
            html.append("<p>We are pleased to inform you that the below meeting is Scheduled for you...</p>");
            html.append("<br/>");
            html.append("Meeting Type : ")
                    .append(schedule.getMeetingType() != null ? schedule.getMeetingType().getMeetingName() : "-")
                    .append("<br/>");
            html.append("Description : ")
                    .append(schedule.getMeetingType() != null ? schedule.getMeetingType().getMeetingDescription() : "-")
                    .append("<br/>");
            html.append("Agenda: ")
                    .append(schedule.getMeetingType() != null ? schedule.getMeetingType().getMeetingAgenda() : "-")
                    .append("<br/>");
            if (schedule.getSubject() != null) {
                html.append("Subject: ").append(schedule.getSubject()).append("<br/>");
            }
            html.append("<br/>");
            html.append("Frequency Level: ").append(schedule.getFrequency()).append("<br/>");
            html.append("Schedule No : ").append(schedule.getScheduleNo()).append("<br/>");
            html.append("Meeting Date : ").append(schedule.getMeetingDate()).append("<br/>");
            html.append("Start Time : ").append(schedule.getStartTime()).append("<br/>");
            html.append("End Time: ").append(schedule.getEndTime()).append("<br/>");
            html.append("Chaired By : ")
                    .append(schedule.getChairedBy() != null ? schedule.getChairedBy().getEmployeeName() : "-")
                    .append("<br/>");
            html.append("Host By : ")
                    .append(schedule.getHostBy() != null ? schedule.getHostBy().getEmployeeName() : "-")
                    .append("<br/>");
            html.append("Participants: ").append(getParticipantNamesStr(schedule)).append("<br/>");
            html.append("<br/><p>Thanks & Regards,</p>");
            html.append("<p>ERP System</p>");

            // Commented out to disable QMS scheduler emails
            // emailSendingService.sendEmailWithAttachments(to, cc, null, subject,
            // html.toString(), null);
            log.info("Skipped sending meeting auto schedule notification email for {} (QMS emails disabled)",
                    schedule.getScheduleNo());
        } catch (Exception e) {
            log.error("Failed to process meeting auto schedule notification", e);
        }
    }

    private void sendMeetingAutoSchReminMail(QmsMeetingSchedule schedule, LocalDate scheduledDate) {
        if (!getPreferenceValueBool("MINUTES_OF_MEETING_AUTO_MAIL")) {
            return;
        }
        try {
            List<String> recipients = getRecipients(schedule);
            if (recipients.isEmpty())
                return;

            String to = String.join(",", recipients);
            String cc = getPreferenceValueStr("CC_IN_ALL_MAILS_FROM_SUKIERP");

            String subject = "MEETING SCHEDULE REMAINDER MAIL";

            StringBuilder html = new StringBuilder();
            html.append("<h2>Dear All,</h2><br/>");
            html.append("<h3>Greetings of the day!</h3>");
            html.append(
                    "<p>I am pleased to inform you that the MEETING SCHEDULE was assigned to you. This mail is a reminder for you.</p>");
            html.append("<br/>");
            html.append("Schedule No : ").append(schedule.getScheduleNo()).append("<br/>");
            html.append("Meeting Date : ").append(scheduledDate).append("<br/>");
            html.append("Start Time : ").append(schedule.getStartTime()).append("<br/>");
            html.append("End Time: ").append(schedule.getEndTime()).append("<br/>");
            html.append("Chaired By : ")
                    .append(schedule.getChairedBy() != null ? schedule.getChairedBy().getEmployeeName() : "-")
                    .append("<br/>");
            html.append("Host By : ")
                    .append(schedule.getHostBy() != null ? schedule.getHostBy().getEmployeeName() : "-")
                    .append("<br/>");
            html.append("Participants: ").append(getParticipantNamesStr(schedule)).append("<br/>");
            html.append("<br/><p>Thanks & Regards,</p>");
            html.append("<p>ERP System</p>");

            // Commented out to disable QMS scheduler emails
            // emailSendingService.sendEmailWithAttachments(to, cc, null, subject,
            // html.toString(), null);
            log.info("Skipped sending meeting auto schedule reminder email for {} (QMS emails disabled)",
                    schedule.getScheduleNo());
        } catch (Exception e) {
            log.error("Failed to process meeting auto schedule reminder", e);
        }
    }

    private LocalDate getPreviousWorkingDayOrDay(LocalDate date) {
        LocalDate candidate = date;
        while (isHolidayOrWeekend(candidate)) {
            candidate = candidate.minusDays(1);
        }
        return candidate;
    }

    private void checkAndSendRemainderMail(QmsMeetingSchedule schedule, int remainderDays, LocalDate scheduledDate) {
        LocalDate remainderDate = scheduledDate.plusDays(remainderDays);
        remainderDate = getPreviousWorkingDayOrDay(remainderDate);
        LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));

        if (today.isEqual(remainderDate) || (today.isAfter(remainderDate) && today.isBefore(scheduledDate))) {
            sendMeetingAutoSchReminMail(schedule, scheduledDate);
        }
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void promoteDraftSchedulesForToday(LocalDate today) {
        if (today == null) {
            today = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        }
        List<QmsMeetingSchedule> draftSchedules = scheduleRepository.findDraftSchedulesForPromotion(today);
        if (draftSchedules == null || draftSchedules.isEmpty()) {
            log.info("No DRAFT meeting schedules found for promotion on date {}", today);
            return;
        }
        int promotedCount = 0;
        com.autonoma.erp.modules.platform.common.entity.StatusMaster openStatus = statusRepo.findByNameIgnoreCase("OPEN").orElse(null);
        for (QmsMeetingSchedule schedule : draftSchedules) {
            schedule.setStatus("OPEN");
            if (openStatus != null) {
                schedule.setStatusObj(openStatus);
            }
            schedule.setMeetingStatus("Scheduled");
            QmsMeetingSchedule saved = scheduleRepository.save(schedule);
            promotedCount++;
            log.info("Promoted DRAFT meeting schedule {} (ID: {}) to OPEN for date {}", saved.getScheduleNo(), saved.getId(), saved.getMeetingDate());

            final QmsMeetingSchedule finalSched = saved;
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    sendMeetingAutoSchNotification(finalSched);
                } catch (Exception ex) {
                    log.warn("[Notification] Failed to send email for promoted schedule {}: {}", finalSched.getScheduleNo(), ex.getMessage());
                }
            });
        }
        log.info("Promoted {} DRAFT meeting schedules to OPEN for date {}", promotedCount, today);
    }

    public void generateRecurringMeetings() {
        self.generateRecurringMeetings(false);
    }

    public void generateRecurringMeetings(boolean force) {
        generateRecurringMeetings(force, null);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void generateRecurringMeetings(boolean force, LocalDate targetDateParam) {
        String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (currentUser == null) {
            currentUser = "SYSTEM";
        }
        LocalDate today = targetDateParam != null ? targetDateParam : LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));

        List<com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleMeetingConfig> configs = qmsScheduleMeetingConfigRepository
                .findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getStatus()))
                .collect(java.util.stream.Collectors.toList());

        int generated = 0;

        for (com.autonoma.erp.modules.qms.meeting.entity.QmsScheduleMeetingConfig config : configs) {
            String freq = config.getFrequency();
            if (freq == null || "NONE".equalsIgnoreCase(freq))
                continue;

            // Find all generated meeting schedules for this config ordered by ID desc to pick the latest saved schedule
            List<QmsMeetingSchedule> schedules = scheduleRepository
                    .findByConfigIdOrderByIdDesc(config.getId());

            // Check if there's already a pre-generated DRAFT schedule for this config
            boolean hasFutureDraft = schedules != null && schedules.stream()
                    .anyMatch(s -> {
                        if (!Boolean.TRUE.equals(s.getIsActive()) || s.getMeetingDate() == null) {
                            return false;
                        }
                        String sName = s.getStatusObj() != null ? s.getStatusObj().getName() : s.getStatus();
                        String stUpper = (sName != null ? sName : "").toUpperCase().trim();
                        return "DRAFT".equals(stUpper);
                    });

            // Skip generating if we already have a pre-generated DRAFT meeting ahead
            if (hasFutureDraft) {
                continue;
            }

            QmsMeetingSchedule latest = null;
            LocalDate latestDate = config.getMeetingStartDate();

            if (schedules != null && !schedules.isEmpty()) {
                latest = schedules.get(0);
                for (QmsMeetingSchedule s : schedules) {
                    if (s.getMeetingDate() != null && s.getMeetingDate().isAfter(latestDate)) {
                        latestDate = s.getMeetingDate();
                    }
                }
            }

            LocalDate candidateDate = null;
            int remainderDays = 0;

            LocalDate baseDate = latestDate;
            do {
                candidateDate = null;
                if ("DAILY".equalsIgnoreCase(freq)) {
                    candidateDate = baseDate.plusDays(1);
                } else if ("WEEKLY".equalsIgnoreCase(freq)) {
                    // weekly specific day
                    if (config.getWeekdays() != null && !config.getWeekdays().trim().isEmpty()) {
                        String rawWeekdays = config.getWeekdays().trim();
                        java.time.DayOfWeek targetDow = null;
                        for (String part : rawWeekdays.split(",")) {
                            String targetDayStr = part.trim().toUpperCase();
                            if (targetDayStr.startsWith("MON")) targetDow = java.time.DayOfWeek.MONDAY;
                            else if (targetDayStr.startsWith("TUE")) targetDow = java.time.DayOfWeek.TUESDAY;
                            else if (targetDayStr.startsWith("WED")) targetDow = java.time.DayOfWeek.WEDNESDAY;
                            else if (targetDayStr.startsWith("THU")) targetDow = java.time.DayOfWeek.THURSDAY;
                            else if (targetDayStr.startsWith("FRI")) targetDow = java.time.DayOfWeek.FRIDAY;
                            else if (targetDayStr.startsWith("SAT")) targetDow = java.time.DayOfWeek.SATURDAY;
                            else if (targetDayStr.startsWith("SUN")) targetDow = java.time.DayOfWeek.SUNDAY;
                            if (targetDow != null) break;
                        }
                        if (targetDow != null) {
                            candidateDate = baseDate.plusDays(1);
                            while (candidateDate.getDayOfWeek() != targetDow) {
                                candidateDate = candidateDate.plusDays(1);
                            }
                        }
                    }
                    if (candidateDate == null) {
                        candidateDate = baseDate.plusDays(7);
                    }
                    remainderDays = -2;
                } else if ("MONTHLY".equalsIgnoreCase(freq)) {
                    candidateDate = baseDate.plusMonths(1);
                    // Keep the same day of month as start date
                    int targetDay = config.getMeetingStartDate().getDayOfMonth();
                    int maxDays = candidateDate.lengthOfMonth();
                    candidateDate = candidateDate.withDayOfMonth(Math.min(targetDay, maxDays));
                    remainderDays = -4;
                } else if ("QUARTERLY".equalsIgnoreCase(freq)) {
                    candidateDate = baseDate.plusMonths(3);
                    int targetDay = config.getMeetingStartDate().getDayOfMonth();
                    candidateDate = candidateDate.withDayOfMonth(Math.min(targetDay, candidateDate.lengthOfMonth()));
                    remainderDays = -4;
                } else if ("HALF YEARLY".equalsIgnoreCase(freq) || "BI-ANNUAL".equalsIgnoreCase(freq)) {
                    candidateDate = baseDate.plusMonths(6);
                    int targetDay = config.getMeetingStartDate().getDayOfMonth();
                    candidateDate = candidateDate.withDayOfMonth(Math.min(targetDay, candidateDate.lengthOfMonth()));
                    remainderDays = -6;
                } else if ("YEARLY".equalsIgnoreCase(freq) || "ANNUAL".equalsIgnoreCase(freq)) {
                    candidateDate = baseDate.plusYears(1);
                    int targetDay = config.getMeetingStartDate().getDayOfMonth();
                    candidateDate = candidateDate.withDayOfMonth(Math.min(targetDay, candidateDate.lengthOfMonth()));
                    remainderDays = -9;
                }

                if (candidateDate != null) {
                    baseDate = candidateDate;
                }
            } while (candidateDate != null && candidateDate.isBefore(today));

            if (candidateDate != null) {
                boolean hasCustomRules = dynamicRuleEngineService != null && dynamicRuleEngineService.hasActiveRules(config.getId(), config.getMeetingId(), config.getMeetingTypeId());
                LocalDate actualDate = candidateDate;

                if (hasCustomRules) {
                    // Custom rules exist -> evaluate candidate date through Dynamic Rule Engine
                    actualDate = dynamicRuleEngineService.evaluateCandidateDate(config.getId(), config.getMeetingId(), config.getMeetingTypeId(), candidateDate, java.util.Map.of("FREQUENCY", freq != null ? freq : "NONE"));
                    if (actualDate == null) {
                        // Rule engine evaluated date to null (skipped / invalid by rule)
                        continue;
                    }
                }

                // If latest is null, we can't clone. But as per system design, the first
                // schedule is always created.
                if (latest == null) {
                    continue;
                }

                // Duplicate prevention check: configId + meetingDate
                final LocalDate finalActualDate = actualDate;
                boolean exists = schedules != null && schedules.stream().anyMatch(
                        s -> finalActualDate.equals(s.getMeetingDate()) && Boolean.TRUE.equals(s.getIsActive()));

                if (!exists) {
                    QmsMeetingSchedule next = new QmsMeetingSchedule();
                    // Copy fields (use config for time/frequency to ignore one-off amendments)
                    next.setMeetingType(latest.getMeetingType());
                    next.setStartTime(config.getStartTime() != null ? config.getStartTime() : latest.getStartTime());
                    next.setEndTime(config.getEndTime() != null ? config.getEndTime() : latest.getEndTime());
                    next.setIntervalTime(
                            config.getIntervalTime() != null ? config.getIntervalTime() : latest.getIntervalTime());
                    next.setFrequency(config.getFrequency() != null ? config.getFrequency() : latest.getFrequency());
                    next.setWeekdays(config.getWeekdays() != null ? config.getWeekdays() : latest.getWeekdays());
                    next.setChairedBy(latest.getChairedBy());
                    next.setHostBy(latest.getHostBy());
                    next.setSecondaryHost(latest.getSecondaryHost());
                    next.setTertiaryHost(latest.getTertiaryHost());
                    next.setComments(latest.getComments());
                    next.setSubject(latest.getSubject());
                    next.setSearchText(latest.getSearchText());
                    next.setIsActive(true);
                    next.setAutoSchedule(true);
                    next.setParentScheduleId(
                            latest.getParentScheduleId() != null ? latest.getParentScheduleId() : latest.getId());
                    next.setConfigId(config.getId());

                    next.setMeetingDate(actualDate);

                    // Generate next schedule number using sequence logic
                    next.setScheduleNo(generateScheduleNo(next));

                    // Default values for newly pre-generated draft schedule
                    next.setStatus("DRAFT");
                    statusRepo.findByNameIgnoreCase("DRAFT").ifPresentOrElse(
                        next::setStatusObj,
                        () -> {
                            com.autonoma.erp.modules.platform.common.entity.StatusMaster dStatus = new com.autonoma.erp.modules.platform.common.entity.StatusMaster();
                            dStatus.setName("DRAFT");
                            next.setStatusObj(statusRepo.save(dStatus));
                        }
                    );
                    next.setMeetingStatus("Draft");
                    next.setAttendanceStatus("Pending");
                    next.setMomStatus("Not Started");
                    next.setCreatedBy(currentUser);

                    // Copy departments mapping
                    if (latest.getDepartments() != null) {
                        List<com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingDepartmentMapping> nextDepts = new java.util.ArrayList<>();
                        for (com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingDepartmentMapping d : latest
                                .getDepartments()) {
                            com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingDepartmentMapping nd = new com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingDepartmentMapping();
                            nd.setDepartment(d.getDepartment());
                            nd.setSchedule(next);
                            nextDepts.add(nd);
                        }
                        next.setDepartments(nextDepts);
                    }

                    // Copy participants mapping
                    if (latest.getParticipants() != null) {
                        List<com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping> nextParts = new java.util.ArrayList<>();
                        for (com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping p : latest
                                .getParticipants()) {
                            com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping np = new com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingParticipantMapping();
                            np.setEmployee(p.getEmployee());
                            np.setSecondaryEmployee(p.getSecondaryEmployee());
                            np.setTertiaryEmployee(p.getTertiaryEmployee());
                            np.setSchedule(next);
                            nextParts.add(np);
                        }
                        next.setParticipants(nextParts);
                    }

                    QmsMeetingSchedule savedNext = scheduleRepository.save(next);

                    // Copy weekday mappings if present
                    if (latest.getWeekdayMappings() != null) {
                        List<com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingScheduleWeekdayMapping> nextWeekdays = new java.util.ArrayList<>();
                        for (com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingScheduleWeekdayMapping w : latest
                                .getWeekdayMappings()) {
                            com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingScheduleWeekdayMapping nw = new com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingScheduleWeekdayMapping();
                            nw.setWeekdayId(w.getWeekdayId());
                            nw.setScheduleId(savedNext.getId());
                            nextWeekdays.add(nw);
                        }
                        savedNext.setWeekdayMappings(nextWeekdays);
                        scheduleRepository.save(savedNext);
                    }

                    generated++;
                    log.info("Pre-generated DRAFT recurring meeting: {} for date: {}", savedNext.getScheduleNo(), actualDate);
                }
            }
        }
        log.info("Generated {} recurring meetings", generated);
    }

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Kolkata")
    public void autoCloseMeetingsWithoutAttendanceJob() {
        self.autoCloseMeetingsWithoutAttendance();
    }

    @Transactional
    public void autoCloseMeetingsWithoutAttendance() {
        try {
            String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            if (currentUser == null) {
                currentUser = "SYSTEM";
            }
            java.time.LocalDateTime graceCutoff = java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")).minusMinutes(10);
            LocalDate cutoffDate = graceCutoff.toLocalDate();
            LocalTime cutoffTime = graceCutoff.toLocalTime();

            // Fetch AD_STATUS_MASTER ID for 'AUTO CLOSED'
            List<Long> autoClosedStatusIds = jdbcTemplate.query(
                    "SELECT ID FROM AD_STATUS_MASTER WHERE NAME = 'AUTO CLOSED'", 
                    (rs, rowNum) -> rs.getLong("ID"));
            Long autoClosedStatusId = autoClosedStatusIds.isEmpty() ? null : autoClosedStatusIds.get(0);

            if (autoClosedStatusId == null) {
                log.error("[MeetingScheduler] Status 'AUTO CLOSED' not found in AD_STATUS_MASTER");
                return;
            }

            // Run bulk SQL update to auto close schedules past grace period without
            // attendance
            int updatedCount = jdbcTemplate.update(
                    "UPDATE QMS_MEETING_SCHEDULE " +
                            "SET STATUS = ?, UPDATED_BY = ?, UPDATED_DATE = CURRENT_TIMESTAMP " +
                            "WHERE IS_ACTIVE = 1 " +
                            "AND STATUS IN (SELECT ID FROM AD_STATUS_MASTER WHERE NAME IN ('OPEN', 'RESCHEDULE', 'AMENDED')) " +
                            "AND (CAST(MEETING_DATE AS DATE) < ? OR (CAST(MEETING_DATE AS DATE) = ? AND START_TIME IS NOT NULL AND CAST(START_TIME AS TIME) <> '00:00:00' AND CAST(START_TIME AS TIME) <= CAST(? AS TIME))) "
                            +
                            "AND NOT EXISTS (" +
                            "    SELECT 1 FROM QMS_MEETING_USER_ATTENDANCE a " +
                            "    JOIN AD_STATUS_MASTER s ON a.STATUS = s.id " +
                            "    WHERE a.SCHEDULE_ID = QMS_MEETING_SCHEDULE.id " +
                            "      AND s.NAME IN ('PRESENT', 'LATE')" +
                            ")",
                    autoClosedStatusId,
                    currentUser,
                    java.sql.Date.valueOf(cutoffDate),
                    java.sql.Date.valueOf(cutoffDate),
                    java.sql.Time.valueOf(cutoffTime));

            if (updatedCount > 0) {
                // Bulk mark notifications as read
                jdbcTemplate.update(
                        "UPDATE SYS_APP_NOTIFICATION " +
                                "SET is_read = 1 " +
                                "WHERE is_read = 0 " +
                                "AND EXISTS (" +
                                "    SELECT 1 FROM QMS_MEETING_SCHEDULE s " +
                                "    WHERE s.STATUS = ? " +
                                "      AND SYS_APP_NOTIFICATION.title LIKE '%' + s.SCHEDULE_NO + '%'" +
                                ")",
                        autoClosedStatusId);
                log.info("[MeetingScheduler] Grace-period check complete. Auto closed {} meetings in bulk.",
                        updatedCount);
            }
        } catch (Exception ex) {
            log.error("[MeetingScheduler] Error running auto-close grace period job", ex);
        }
    }

    /**
     * 1. Auto-close meeting schedules where:
     * - Status is OPEN
     * - Meeting date is before today (or today but past end time)
     */
    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Kolkata")
    public void autoCloseExpiredSchedulesJob() {
        self.autoCloseExpiredSchedules(true);
    }

    public void autoCloseExpiredSchedules() {
        self.autoCloseExpiredSchedules(false);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void autoCloseExpiredSchedules(boolean force) {
        long nowMs = System.currentTimeMillis();
        // Cooldown: Run at most once every 1 hour unless forced by the cron job
        if (!force && (nowMs - lastAutoCloseRun < 3600000)) {
            return;
        }
        lastAutoCloseRun = nowMs;

        // Run synchronously to ensure expired schedules are closed BEFORE recurrence
        // logic runs
        try {
            String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            if (currentUser == null) {
                currentUser = "SYSTEM";
            }
            log.info("[MeetingScheduler] Starting auto-close scan (1-hour grace period from END_TIME)...");
            java.time.LocalDateTime graceCutoff = java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")).minusHours(1);
            LocalDate cutoffDate = graceCutoff.toLocalDate();
            LocalTime cutoffTime = graceCutoff.toLocalTime();

            List<Long> autoClosedStatusIds = jdbcTemplate.query(
                    "SELECT ID FROM AD_STATUS_MASTER WHERE NAME = 'AUTO CLOSED'", 
                    (rs, rowNum) -> rs.getLong("ID"));
            Long autoClosedStatusId = autoClosedStatusIds.isEmpty() ? null : autoClosedStatusIds.get(0);

            if (autoClosedStatusId == null) {
                log.error("[MeetingScheduler] Status 'AUTO CLOSED' not found in AD_STATUS_MASTER");
                return;
            }

            int updatedCount = jdbcTemplate.update(
                    "UPDATE QMS_MEETING_SCHEDULE " +
                            "SET STATUS = ?, UPDATED_BY = ?, UPDATED_DATE = CURRENT_TIMESTAMP " +
                            "WHERE IS_ACTIVE = 1 " +
                            "AND STATUS IN (SELECT ID FROM AD_STATUS_MASTER WHERE NAME IN ('OPEN', 'RESCHEDULE', 'AMENDED')) " +
                            "AND (CAST(MEETING_DATE AS DATE) < ? OR (CAST(MEETING_DATE AS DATE) = ? AND END_TIME IS NOT NULL AND CAST(END_TIME AS TIME) <> '00:00:00' AND CAST(END_TIME AS TIME) <= CAST(? AS TIME)))",
                    autoClosedStatusId,
                    currentUser,
                    java.sql.Date.valueOf(cutoffDate),
                    java.sql.Date.valueOf(cutoffDate),
                    java.sql.Time.valueOf(cutoffTime));

            if (updatedCount > 0) {
                // Bulk mark notifications as read
                jdbcTemplate.update(
                        "UPDATE SYS_APP_NOTIFICATION " +
                                "SET is_read = 1 " +
                                "WHERE is_read = 0 " +
                                "AND EXISTS (" +
                                "    SELECT 1 FROM QMS_MEETING_SCHEDULE s " +
                                "    WHERE s.STATUS = ? " +
                                "      AND SYS_APP_NOTIFICATION.title LIKE '%' + s.SCHEDULE_NO + '%'" +
                                ")",
                        autoClosedStatusId);
                log.info("[MeetingScheduler] Finished auto-close. Closed {} schedules in bulk.", updatedCount);
            }
        } catch (Exception ex) {
            log.error("[MeetingScheduler] Error in auto-close task", ex);
        }
    }

    /**
     * 2. Mark overdue MOM action items where:
     * - Process type is ACTION
     * - Status is OPEN
     * - Target date is before today
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void markOverdueMomActions() {
        long nowMs = System.currentTimeMillis();
        // Cooldown: run at most once every 1 hour to avoid loading all MOMs every
        // minute
        if (nowMs - lastOverdueRun < 3600000) {
            return;
        }
        lastOverdueRun = nowMs;

        try {
            String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            if (currentUser == null) {
                currentUser = "SYSTEM";
            }
            LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));

            // Retrieve status IDs and process type IDs safely to avoid EmptyResultDataAccessException
            List<Long> overdueStatusIds = jdbcTemplate.query(
                    "SELECT ID FROM AD_STATUS_MASTER WHERE NAME = 'OVERDUE'", 
                    (rs, rowNum) -> rs.getLong("ID"));
            Long overdueStatusId = overdueStatusIds.isEmpty() ? null : overdueStatusIds.get(0);
            
            List<Long> openStatusIds = jdbcTemplate.query(
                    "SELECT ID FROM AD_STATUS_MASTER WHERE NAME = 'OPEN'", 
                    (rs, rowNum) -> rs.getLong("ID"));
            Long openStatusId = openStatusIds.isEmpty() ? null : openStatusIds.get(0);
            
            List<Long> actionProcessTypeIds = jdbcTemplate.query(
                    "SELECT ID FROM QMS_PROCESS_TYPE_MASTER WHERE CODE = 'ACTION'", 
                    (rs, rowNum) -> rs.getLong("ID"));
            Long actionProcessTypeId = actionProcessTypeIds.isEmpty() ? null : actionProcessTypeIds.get(0);

            if (overdueStatusId == null || openStatusId == null || actionProcessTypeId == null) {
                log.error("[MeetingScheduler] Missing database master records for overdue MOM action processing");
                return;
            }

            int updatedCount = jdbcTemplate.update(
                    "UPDATE QMS_MOM_DETAILS " +
                            "SET STATUS = ?, UPDATED_BY = ?, UPDATED_DATE = CURRENT_TIMESTAMP " +
                            "WHERE IS_ACTIVE = 1 " +
                            "AND PROCESS_TYPE_ID = ? " +
                            "AND STATUS = ? " +
                            "AND TARGET_DATE < ?",
                    overdueStatusId,
                    currentUser,
                    actionProcessTypeId,
                    openStatusId,
                    java.sql.Date.valueOf(today));

            if (updatedCount > 0) {
                log.info("[MeetingScheduler] Finished marking overdue MOM actions. Updated {} items in bulk.",
                        updatedCount);
            }
        } catch (Exception ex) {
            log.error("[MeetingScheduler] Error marking overdue MOM actions", ex);
        }
    }

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Kolkata")
    public void reassignHostsBasedOnLeaveJob() {
        self.reassignHostsBasedOnLeave();
    }

    @Transactional
    public void reassignHostsBasedOnLeave() {
        try {
            String currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            if (currentUser == null) {
                currentUser = "SYSTEM";
            }
            LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
            LocalTime now = LocalTime.now(java.time.ZoneId.of("Asia/Kolkata"));
            
            // Check for meetings that start between now and 21 minutes from now
            LocalTime targetStart = now;
            LocalTime targetEnd = now.plusMinutes(21);

            // Fetch open, reschedule and amended statuses
            List<Long> openStatusIds = jdbcTemplate.query(
                    "SELECT ID FROM AD_STATUS_MASTER WHERE NAME IN ('OPEN', 'RESCHEDULE', 'AMENDED')", 
                    (rs, rowNum) -> rs.getLong("ID"));
            if (openStatusIds.isEmpty()) return;

            // Fetch meetings happening today within the 20-21 min window
            String statuses = openStatusIds.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(","));
            
            String query = "SELECT * FROM QMS_MEETING_SCHEDULE WHERE IS_ACTIVE = 1 AND STATUS IN (" + statuses + ") " +
                           "AND MEETING_DATE = ? AND CAST(START_TIME AS TIME) >= CAST(? AS TIME) AND CAST(START_TIME AS TIME) < CAST(? AS TIME)";
            
            List<java.util.Map<String, Object>> upcomingMeetings = jdbcTemplate.queryForList(query, 
                new Object[]{java.sql.Date.valueOf(today), java.sql.Time.valueOf(targetStart), java.sql.Time.valueOf(targetEnd)});
            
            if (upcomingMeetings.isEmpty()) {
                return; // Nothing to check
            }

            // Fetch employee IDs on leave today
            List<Long> employeesOnLeave = leaveEntryRepository.findEmployeeIdsOnLeaveOnDate(java.sql.Date.valueOf(today));
            if (employeesOnLeave == null) {
                employeesOnLeave = new java.util.ArrayList<>();
            }

            for (java.util.Map<String, Object> schedule : upcomingMeetings) {
                Long meetingId = ((Number) schedule.get("ID")).longValue();
                String scheduleNo = (String) schedule.get("SCHEDULE_NO");
                Long primaryHost = schedule.get("HOST_BY_ID") != null ? ((Number) schedule.get("HOST_BY_ID")).longValue() : null;
                Long secondaryHost = schedule.get("SECONDARY_HOST_ID") != null ? ((Number) schedule.get("SECONDARY_HOST_ID")).longValue() : null;
                Long tertiaryHost = schedule.get("TERTIARY_HOST_ID") != null ? ((Number) schedule.get("TERTIARY_HOST_ID")).longValue() : null;
                
                if (primaryHost != null && employeesOnLeave.contains(primaryHost)) {
                    log.info("[MeetingScheduler] Meeting {} primary host {} is on leave.", scheduleNo, primaryHost);
                    
                    Long newHostId = null;
                    if (secondaryHost != null && !employeesOnLeave.contains(secondaryHost)) {
                        newHostId = secondaryHost;
                        log.info("[MeetingScheduler] Assigning secondary host {} as primary for meeting {}.", newHostId, scheduleNo);
                    } else if (tertiaryHost != null && !employeesOnLeave.contains(tertiaryHost)) {
                        newHostId = tertiaryHost;
                        log.info("[MeetingScheduler] Assigning tertiary host {} as primary for meeting {}.", newHostId, scheduleNo);
                    }
                    
                    if (newHostId != null) {
                        jdbcTemplate.update(
                                "UPDATE QMS_MEETING_SCHEDULE SET HOST_BY_ID = ?, UPDATED_BY = ?, UPDATED_DATE = CURRENT_TIMESTAMP WHERE ID = ?",
                                newHostId, currentUser, meetingId);
                    } else {
                        log.warn("[MeetingScheduler] All designated hosts for meeting {} are on leave. Cancelling meeting.", scheduleNo);
                        // Fetch CANCELLED status ID
                        List<Long> cancelledStatusIds = jdbcTemplate.query(
                                "SELECT ID FROM AD_STATUS_MASTER WHERE NAME = 'CANCELLED'", 
                                (rs, rowNum) -> rs.getLong("ID"));
                        Long cancelledStatusId = cancelledStatusIds.isEmpty() ? null : cancelledStatusIds.get(0);
                        
                        if (cancelledStatusId != null) {
                            jdbcTemplate.update(
                                    "UPDATE QMS_MEETING_SCHEDULE SET STATUS = ?, MEETING_STATUS = 'Cancelled', CANCEL_REASON = 'All designated hosts are on leave today', UPDATED_BY = ?, UPDATED_DATE = CURRENT_TIMESTAMP WHERE ID = ?",
                                    cancelledStatusId, currentUser, meetingId);
                        }
                    }
                }
            }

            // Mark attendance as inactive for all participants who are on leave
            if (!employeesOnLeave.isEmpty() && !upcomingMeetings.isEmpty()) {
                String empIdsStr = employeesOnLeave.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(","));
                String meetingIdsStr = upcomingMeetings.stream().map(m -> String.valueOf(m.get("ID"))).collect(java.util.stream.Collectors.joining(","));
                
                jdbcTemplate.update(
                        "UPDATE QMS_MEETING_USER_ATTENDANCE SET IS_ACTIVE = 0, UPDATED_BY = ?, UPDATED_DATE = CURRENT_TIMESTAMP WHERE SCHEDULE_ID IN (" + meetingIdsStr + ") AND EMPLOYEE_ID IN (" + empIdsStr + ") AND IS_ACTIVE = 1",
                        currentUser);
            }
        } catch (Exception ex) {
            log.error("[MeetingScheduler] Error in reassignHostsBasedOnLeave", ex);
        }
    }
}

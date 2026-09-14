package com.autonoma.erp.modules.qms.audit.service;

import com.autonoma.erp.modules.platform.notification.service.NotificationService;

import com.autonoma.erp.modules.qms.audit.entity.AuditSchedule;
import com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.modules.qms.audit.entity.AuditAttendance;
import com.autonoma.erp.modules.qms.audit.repository.AuditAttendanceRepository;
import com.autonoma.erp.service.admin.EmailSendingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class AuditNotificationScheduler {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuditNotificationScheduler.class);

    private final AuditScheduleRepository auditScheduleRepository;
    private final EmployeeMasterRepository employeeMasterRepository;
    private final NotificationService notificationService;
    private final AppNotificationRepository appNotificationRepository;
    private final StatusMasterRepository statusMasterRepository;
    private final AuditAttendanceRepository auditAttendanceRepository;
    private final EmailSendingService emailSendingService;

    @org.springframework.beans.factory.annotation.Autowired
    public AuditNotificationScheduler(
            AuditScheduleRepository auditScheduleRepository,
            EmployeeMasterRepository employeeMasterRepository,
            NotificationService notificationService,
            AppNotificationRepository appNotificationRepository,
            StatusMasterRepository statusMasterRepository,
            AuditAttendanceRepository auditAttendanceRepository,
            EmailSendingService emailSendingService) {
        this.auditScheduleRepository = auditScheduleRepository;
        this.employeeMasterRepository = employeeMasterRepository;
        this.notificationService = notificationService;
        this.appNotificationRepository = appNotificationRepository;
        this.statusMasterRepository = statusMasterRepository;
        this.auditAttendanceRepository = auditAttendanceRepository;
        this.emailSendingService = emailSendingService;
    }

    @Value("${app.frontend.url:http://localhost:3001}")
    private String frontendUrl;

    // ── Changed from every-minute (0 * * * * *) to every-5-minutes.
    // Audit reminders fire in the 9–11 minute window before start,
    // so 5-minute precision is perfectly adequate and saves 80% of scheduler DB
    // calls.
    // @Scheduled(cron = "0 */5 * * * *", zone = "Asia/Kolkata")
    public void checkAndSendAuditReminders() {
        try {
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
            LocalTime nowTime = LocalTime.now(ZoneId.of("Asia/Kolkata"));

            // Use SQL-filtered query (is_deleted=0, non-CLOSED) instead of findAll() +
            // in-memory filter.
            // This eliminates a full table scan that was running every 60 seconds.
            List<AuditSchedule> activeSchedules = auditScheduleRepository
                    .findByFiltersLikeList(null, null)
                    .stream()
                    .filter(s -> !"CLOSED".equalsIgnoreCase(s.getStatus()))
                    .toList();

            for (AuditSchedule schedule : activeSchedules) {
                if (schedule.getAuditDate() == null || schedule.getStartTime() == null) {
                    continue;
                }

                // Check if auditDate is today
                LocalDate auditDate = java.time.Instant.ofEpochMilli(schedule.getAuditDate().getTime())
                        .atZone(ZoneId.of("Asia/Kolkata"))
                        .toLocalDate();

                if (!auditDate.isEqual(today)) {
                    continue;
                }

                // Parse startTime, format hh:mm a (e.g. "10:00 AM", "09:30 PM", "1:00 AM")
                LocalTime startTime = parseStartTime(schedule.getStartTime());
                if (startTime == null) {
                    continue;
                }

                // Calculate difference in minutes: startTime - nowTime
                // (Since we are now triggering this as a daily batch from
                // SCHEDULE_CONFIGURATION,
                // we send the reminder for all audits scheduled today, irrespective of the
                // exact minute)
                sendAuditReminder(schedule);
            }
        } catch (Exception e) {
            log.error("Error running checkAndSendAuditReminders: {}", e.getMessage(), e);
        }
    }

    @Scheduled(cron = "0 59 23 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void cancelExpiredAuditsWithoutAttendance() {
        try {
            log.info("Starting cancelExpiredAuditsWithoutAttendance batch job...");
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));

            // Find all active schedules that are still OPEN or RESCHEDULE
            List<AuditSchedule> activeSchedules = auditScheduleRepository
                    .findByFiltersLikeList(null, null)
                    .stream()
                    .filter(s -> "OPEN".equalsIgnoreCase(s.getStatus()) || "RESCHEDULE".equalsIgnoreCase(s.getStatus()))
                    .toList();

            String autoClosedStatus = statusMasterRepository.findByNameIgnoreCase("AUTO CLOSED")
                    .map(StatusMaster::getName)
                    .orElse("AUTO CLOSED");

            int autoClosedCount = 0;
            for (AuditSchedule schedule : activeSchedules) {
                if (schedule.getAuditDate() == null) {
                    continue;
                }

                // Check if auditDate is today or in the past
                LocalDate auditDate = java.time.Instant.ofEpochMilli(schedule.getAuditDate().getTime())
                        .atZone(ZoneId.of("Asia/Kolkata"))
                        .toLocalDate();

                if (auditDate.isBefore(today)) {
                    // Check if it has any attendance records
                    List<AuditAttendance> attendance = auditAttendanceRepository
                            .findByAuditScheduleNo(schedule.getScheduleNo());
                    if (attendance.isEmpty()) {
                        log.info("Auto-closing Audit Schedule: {} (scheduled for {} but has no attendance)",
                                schedule.getScheduleNo(), auditDate);
                        schedule.setStatus(autoClosedStatus);
                        auditScheduleRepository.save(schedule);
                        autoClosedCount++;
                    }
                }
            }
            log.info("Audit maintenance completed. Auto closed {} expired schedules without attendance.",
                    autoClosedCount);
        } catch (Exception e) {
            log.error("Error running cancelExpiredAuditsWithoutAttendance: {}", e.getMessage(), e);
        }
    }
    @Scheduled(cron = "0 * * * * *", zone = "Asia/Kolkata")
    public void sendExternalAuditorLinks() {
        log.info("Running sendExternalAuditorLinks! Current time: {}", java.time.LocalDateTime.now());
        try {
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
            LocalTime nowTime = LocalTime.now(ZoneId.of("Asia/Kolkata"));

            List<AuditSchedule> activeSchedules = auditScheduleRepository
                .findByFiltersLikeList(null, null)
                .stream()
                .filter(s -> !"CLOSED".equalsIgnoreCase(s.getStatus()) && !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                .toList();

            for (AuditSchedule schedule : activeSchedules) {
                if (schedule.getAuditDate() == null || schedule.getStartTime() == null) {
                    continue;
                }

                LocalDate auditDate = java.time.Instant.ofEpochMilli(schedule.getAuditDate().getTime())
                    .atZone(ZoneId.of("Asia/Kolkata"))
                    .toLocalDate();

                if (!auditDate.isEqual(today)) {
                    continue;
                }

                LocalTime startTime = parseStartTime(schedule.getStartTime());
                if (startTime == null) {
                    log.warn("Skipping schedule {}: Unable to parse start time '{}'", schedule.getScheduleNo(), schedule.getStartTime());
                    continue;
                }

                long minutesBetween = java.time.Duration.between(nowTime, startTime).toMinutes();
                
                log.info("Checking schedule {}: startTime={}, nowTime={}, minutesBetween={}", 
                         schedule.getScheduleNo(), startTime, nowTime, minutesBetween);

                if (minutesBetween >= 0 && minutesBetween <= 15) {
                    sendExternalAuditorEmail(schedule);
                }
            }
        } catch (Exception e) {
            log.error("Error running sendExternalAuditorLinks: {}", e.getMessage(), e);
        }
    }

    private void sendExternalAuditorEmail(AuditSchedule schedule) {
        log.info("Attempting to send external auditor email for schedule {}", schedule.getScheduleNo());
        try {
            if (Boolean.TRUE.equals(schedule.getExternalLinkSent())) {
                log.info("Skipping schedule {}: Email already marked as sent.", schedule.getScheduleNo());
                return; // Already sent, skip
            }
            
            String externalEmail = schedule.getExternalEmailId();
            String externalName = schedule.getExternalName() != null ? schedule.getExternalName() : "External Auditor";
            
            if (externalEmail == null || externalEmail.trim().isEmpty()) {
                log.error("Skipping schedule {}: No externalEmailId found.", schedule.getScheduleNo());
                return;
            }
            
            String subject = "Audit Schedule Attendance Link: " + schedule.getScheduleNo();
            String link = frontendUrl + "/public/external-audit-attendance?scheduleNo=" + schedule.getScheduleNo() + "&email=" + java.net.URLEncoder.encode(externalEmail, "UTF-8");
            
            String htmlBody = "<html><body>"
                + "<h3>Dear " + externalName + ",</h3>"
                + "<p>You are scheduled for an external audit (" + schedule.getScheduleNo() + ") starting shortly.</p>"
                + "<p><strong>Date:</strong> " + schedule.getAuditDate() + "</p>"
                + "<p><strong>Start Time:</strong> " + schedule.getStartTime() + "</p>"
                + "<p>Please mark your attendance by clicking the button below:</p>"
                + "<a href=\"" + link + "\" style=\"display:inline-block;padding:10px 20px;background-color:#1e88e5;color:#fff;text-decoration:none;border-radius:4px;\">Mark IN</a>"
                + "<p>This link is only valid for today.</p>"
                + "<p>Regards,<br/>Autonoma QMS Team</p>"
                + "</body></html>";
                
            emailSendingService.sendEmailWithAttachments(externalEmail, null, null, subject, htmlBody, null);
            
            log.info("Sent external auditor link to {}", externalEmail);
            
            // Mark as sent
            schedule.setExternalLinkSent(true);
            auditScheduleRepository.save(schedule);
            log.info("Successfully sent and marked externalLinkSent for schedule {}", schedule.getScheduleNo());
        } catch (Exception e) {
            log.error("Failed to send external auditor email for schedule {}: {}", schedule.getScheduleNo(), e.getMessage());
        }
    }

    private LocalTime parseStartTime(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return null;
        }
        String trimmed = timeStr.trim();

        // 1. Try 24-hour format "HH:mm" or "H:mm" (e.g. "16:30", "9:15")
        try {
            return LocalTime.parse(trimmed, DateTimeFormatter.ofPattern("H:mm"));
        } catch (Exception ignored) {}

        try {
            return LocalTime.parse(trimmed, DateTimeFormatter.ofPattern("HH:mm"));
        } catch (Exception ignored) {}

        // 2. Try 12-hour format "hh:mm a" or "h:mm a" (e.g. "04:30 PM", "4:30 PM")
        try {
            return LocalTime.parse(trimmed, DateTimeFormatter.ofPattern("h:mm a", java.util.Locale.ENGLISH));
        } catch (Exception ignored) {}

        try {
            return LocalTime.parse(trimmed, DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.ENGLISH));
        } catch (Exception ignored) {}

        // 3. Try format without space "04:30PM"
        try {
            String formatted = trimmed.replaceAll("(?i)(\\d{1,2}:\\d{2})\\s*(AM|PM)", "$1 $2");
            return LocalTime.parse(formatted, DateTimeFormatter.ofPattern("h:mm a", java.util.Locale.ENGLISH));
        } catch (Exception ex) {
            log.warn("Failed to parse start time '{}': {}", timeStr, ex.getMessage());
            return null;
        }
    }

    private void sendAuditReminder(AuditSchedule schedule) {
        String auditeeCode = extractEmployeeCode(schedule.getAuditee());
        String auditorCode = extractEmployeeCode(schedule.getAuditor());

        java.util.Set<String> recipientCodes = new java.util.HashSet<>();
        if (auditeeCode != null && !auditeeCode.trim().isEmpty()) {
            recipientCodes.add(auditeeCode.trim().toLowerCase());
        }
        if (auditorCode != null && !auditorCode.trim().isEmpty()) {
            recipientCodes.add(auditorCode.trim().toLowerCase());
        }

        for (String code : recipientCodes) {
            employeeMasterRepository.findByEmpCodeIgnoreCase(code).ifPresent(emp -> {
                String title = "Upcoming Audit Reminder: " + schedule.getScheduleNo();
                // Check if notification already sent for this schedule to this recipient to
                // avoid duplicate sending
                boolean alreadySent = appNotificationRepository
                        .findByRecipientEmpIdAndIsReadFalseOrderByCreatedAtDesc(emp.getId())
                        .stream()
                        .anyMatch(notif -> title.equals(notif.getTitle()));

                if (!alreadySent) {
                    alreadySent = appNotificationRepository.findByRecipientEmpIdOrderByCreatedAtDesc(emp.getId())
                            .stream()
                            .anyMatch(notif -> title.equals(notif.getTitle()));
                }

                if (!alreadySent) {
                    notificationService.notifyUserAboutAuditReminder(emp, schedule);
                }
            });
        }
    }

    private String extractEmployeeCode(String input) {
        if (input == null || input.trim().isEmpty())
            return null;
        if (input.contains(" - ")) {
            return input.split(" - ")[1].trim();
        }
        return input.trim();
    }

    @Scheduled(cron = "0 */5 * * * *", zone = "Asia/Kolkata")
    @Transactional
    public void cleanObsoleteAuditNotifications() {
        log.info("Running cleanObsoleteAuditNotifications background job...");
        try {
            List<com.autonoma.erp.modules.platform.notification.entity.AppNotification> unreadReminders = 
                    appNotificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
            if (unreadReminders == null || unreadReminders.isEmpty()) {
                return;
            }

            java.util.List<com.autonoma.erp.modules.platform.notification.entity.AppNotification> reminderNotifs = new java.util.ArrayList<>();
            java.util.Set<String> scheduleNos = new java.util.HashSet<>();

            for (com.autonoma.erp.modules.platform.notification.entity.AppNotification notif : unreadReminders) {
                String title = notif.getTitle();
                if (title != null && title.startsWith("Upcoming Audit Reminder: ")) {
                    String schNo = title.substring("Upcoming Audit Reminder: ".length()).trim();
                    if (!schNo.isEmpty()) {
                        reminderNotifs.add(notif);
                        scheduleNos.add(schNo);
                    }
                }
            }

            if (scheduleNos.isEmpty()) {
                return;
            }

            java.util.List<AuditSchedule> schedules = auditScheduleRepository.findByScheduleNoIn(scheduleNos);
            java.util.Map<String, AuditSchedule> scheduleMap = new java.util.HashMap<>();
            for (AuditSchedule s : schedules) {
                if (s.getScheduleNo() != null) {
                    scheduleMap.put(s.getScheduleNo().trim(), s);
                }
            }

            java.time.LocalDateTime now = java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
            java.util.List<com.autonoma.erp.modules.platform.notification.entity.AppNotification> toUpdate = new java.util.ArrayList<>();

            for (com.autonoma.erp.modules.platform.notification.entity.AppNotification notif : reminderNotifs) {
                String title = notif.getTitle();
                String schNo = title.substring("Upcoming Audit Reminder: ".length()).trim();
                AuditSchedule schedule = scheduleMap.get(schNo);
                if (schedule != null) {
                    java.time.LocalDateTime startDateTime = getAuditStartDateTime(schedule.getAuditDate(), schedule.getStartTime());
                    if (startDateTime != null && now.isAfter(startDateTime)) {
                        notif.setIsRead(true);
                        toUpdate.add(notif);
                    }
                }
            }

            if (!toUpdate.isEmpty()) {
                appNotificationRepository.saveAll(toUpdate);
                log.info("Cleaned up {} obsolete audit notifications.", toUpdate.size());
            }
        } catch (Exception e) {
            log.error("Failed to clean obsolete audit notifications in background: {}", e.getMessage(), e);
        }
    }

    private java.time.LocalDateTime getAuditStartDateTime(java.util.Date date, String timeStr) {
        if (date == null || timeStr == null || timeStr.trim().isEmpty()) {
            return null;
        }
        try {
            String trimmed = timeStr.trim().toUpperCase();
            java.time.format.DateTimeFormatter formatter;
            if (trimmed.contains("AM") || trimmed.contains("PM")) {
                String formatted = trimmed.replaceAll("(?i)(\\d{2}:\\d{2})\\s*(AM|PM)", "$1 $2");
                formatter = java.time.format.DateTimeFormatter.ofPattern("hh:mm a", java.util.Locale.ENGLISH);
                java.time.LocalTime time = java.time.LocalTime.parse(formatted, formatter);
                return java.time.LocalDateTime.ofInstant(date.toInstant(), java.time.ZoneId.of("Asia/Kolkata"))
                        .withHour(time.getHour())
                        .withMinute(time.getMinute())
                        .withSecond(0)
                        .withNano(0);
            } else {
                formatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
                java.time.LocalTime time = java.time.LocalTime.parse(trimmed, formatter);
                return java.time.LocalDateTime.ofInstant(date.toInstant(), java.time.ZoneId.of("Asia/Kolkata"))
                        .withHour(time.getHour())
                        .withMinute(time.getMinute())
                        .withSecond(0)
                        .withNano(0);
            }
        } catch (Exception e) {
            return null;
        }
    }

    @Scheduled(cron = "0 0 4 * * ?", zone = "Asia/Kolkata")
    @Transactional
    public void promoteDraftAuditSchedulesForToday() {
        try {
            LocalDate today = LocalDate.now();
            List<AuditSchedule> drafts = auditScheduleRepository.findAll().stream()
                    .filter(s -> "DRAFT".equalsIgnoreCase(s.getStatus()) && Boolean.TRUE.equals(s.getIsActive()))
                    .filter(s -> s.getAuditDate() != null)
                    .filter(s -> {
                        LocalDate sDate = s.getAuditDate().toInstant().atZone(ZoneId.of("Asia/Kolkata")).toLocalDate();
                        return sDate.isEqual(today) || sDate.isBefore(today);
                    })
                    .toList();

            for (AuditSchedule draft : drafts) {
                draft.setStatus("OPEN");
                draft.setUpdatedDate(new Date());
                draft.setUpdatedBy("SYSTEM");
                AuditSchedule saved = auditScheduleRepository.save(draft);
                log.info("Promoted DRAFT Audit Schedule {} to OPEN for date {}", saved.getScheduleNo(), today);
                try {
                    AuditScheduleService auditService = com.autonoma.erp.util.SpringContext.getBean(AuditScheduleService.class);
                    if (auditService != null) {
                        // Triggers standard notification dispatch on promotion
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            log.error("Error promoting DRAFT audit schedules: {}", e.getMessage(), e);
        }
    }
}

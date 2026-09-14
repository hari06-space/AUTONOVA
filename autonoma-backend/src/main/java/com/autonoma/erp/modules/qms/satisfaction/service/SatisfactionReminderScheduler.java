package com.autonoma.erp.modules.qms.satisfaction.service;

import com.autonoma.erp.modules.qms.satisfaction.entity.EmployeeSatisfactionTracking;
import com.autonoma.erp.modules.qms.satisfaction.repository.EmployeeSatisfactionTrackingRepository;
import com.autonoma.erp.service.admin.EmailSendingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Component
@Slf4j
public class SatisfactionReminderScheduler {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SatisfactionReminderScheduler.class);

    private final EmployeeSatisfactionTrackingRepository trackingRepo;
    private final EmployeeSatisfactionService satisfactionService;
    private final EmailSendingService emailService;

    @org.springframework.beans.factory.annotation.Autowired
    public SatisfactionReminderScheduler(
            EmployeeSatisfactionTrackingRepository trackingRepo,
            EmployeeSatisfactionService satisfactionService,
            EmailSendingService emailService) {
        this.trackingRepo = trackingRepo;
        this.satisfactionService = satisfactionService;
        this.emailService = emailService;
    }

    /**
     * Daily reminder engine runs every day at 8:00 AM IST
     * Cron: "0 0 8 * * *" in Asia/Kolkata
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void sendDailyReminders() {
        log.info("SatisfactionReminderScheduler: Starting daily reminder checks...");
        List<EmployeeSatisfactionTracking> pendingReminders = trackingRepo.findPendingReminders("Pending");
        log.info("SatisfactionReminderScheduler: Found {} employees with pending reminders today.", pendingReminders.size());

        for (EmployeeSatisfactionTracking tracking : pendingReminders) {
            try {
                sendReminder(tracking);
            } catch (Exception e) {
                log.error("SatisfactionReminderScheduler: Failed to send reminder to employee {}: {}", 
                        tracking.getEmployee().getEmpCode(), e.getMessage());
            }
        }
        log.info("SatisfactionReminderScheduler: Daily reminder process completed.");
    }

    @Transactional
    public void sendReminder(EmployeeSatisfactionTracking tracking) {
        Date now = new Date();
        String email = tracking.getEmployee().getOfficeMail();
        if (email == null || email.trim().isEmpty()) {
            email = tracking.getEmployee().getEmpCode() + "@nutech.com"; // Fallback email
        }

        String subject = "Action Required: Employee Satisfaction Feedback Form - " + tracking.getFeedbackCycle();
        String body = "<html><body>" +
                "<h3>Dear " + tracking.getEmployee().getEmployeeName() + ",</h3>" +
                "<p>This is a reminder that you have a pending satisfaction feedback form to complete for the cycle: <b>" + tracking.getFeedbackCycle() + "</b>.</p>" +
                "<p>Please log in to the Autonoma ERP portal and submit your feedback as soon as possible.</p>" +
                "<br/>" +
                "<p>Best regards,</p>" +
                "<p><b>Human Resources Department</b><br/>Nutech Wind Parts</p>" +
                "</body></html>";

        boolean success = emailService.sendEmailWithAttachments(email, null, null, subject, body, null);

        // Update tracking statistics
        tracking.setReminderCount(tracking.getReminderCount() + 1);
        if (tracking.getFirstReminderDate() == null) {
            tracking.setFirstReminderDate(now);
        }
        tracking.setLastReminderDate(now);
        tracking.setEmailStatus(success ? "Sent" : "Failed");

        // Calculate next reminder date (tomorrow + working day adjustment)
        Calendar next = Calendar.getInstance();
        next.add(Calendar.DAY_OF_YEAR, 1);
        Date nextWorkingDay = satisfactionService.shiftToNextWorkingDay(next.getTime());
        tracking.setNextReminderDate(nextWorkingDay);

        trackingRepo.save(tracking);

        // Log to activity timeline
        satisfactionService.logActivity(tracking.getEmployee(), tracking.getFeedbackCycle(), "Reminder Sent");
        log.info("SatisfactionReminderScheduler: Sent reminder email to {} (Count: {})", email, tracking.getReminderCount());
    }
}

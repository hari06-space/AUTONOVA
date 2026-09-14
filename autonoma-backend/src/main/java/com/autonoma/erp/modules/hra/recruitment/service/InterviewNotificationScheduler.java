package com.autonoma.erp.modules.hra.recruitment.service;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType;
import com.autonoma.erp.modules.hra.recruitment.entity.HraApplicantInterview;
import com.autonoma.erp.modules.hra.recruitment.repository.HraApplicantInterviewRepository;
import com.autonoma.erp.modules.platform.notification.service.NotificationService;
import com.autonoma.erp.repository.admin.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Dedicated 1-minute scheduler for sending ATS Interview Reminder notifications.
 * Kept completely independent from QMS or other business domains.
 */
@Service
public class InterviewNotificationScheduler {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(InterviewNotificationScheduler.class);

    private final HraApplicantInterviewRepository interviewRepository;
    private final EmployeeMasterRepository employeeRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public InterviewNotificationScheduler(
            HraApplicantInterviewRepository interviewRepository,
            EmployeeMasterRepository employeeRepository,
            NotificationService notificationService,
            UserRepository userRepository) {
        this.interviewRepository = interviewRepository;
        this.employeeRepository = employeeRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    /**
     * Checks active pending interviews starting within 15 minutes and fires reminder notifications.
     */
    @Scheduled(cron = "0 * * * * *", zone = "Asia/Kolkata")
    public void checkAndSendInterviewReminders() {
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");

            LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
            LocalDateTime futureLimit = now.plusMinutes(16);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            String nowStr = now.format(formatter);
            String futureStr = futureLimit.format(formatter);

            // 1. Fetch upcoming interviews from SQL database (already filtered in DB)
            List<HraApplicantInterview> upcoming = interviewRepository.findUpcomingInterviewsForReminder(nowStr, futureStr);
            if (upcoming == null || upcoming.isEmpty()) {
                return;
            }

            logger.info("Found {} upcoming interviews for reminder notifications", upcoming.size());

            // 2. Filter using concurrency database update lock (exactly-once reminder delivery)
            List<HraApplicantInterview> toProcess = new ArrayList<>();
            for (HraApplicantInterview interview : upcoming) {
                int locked = interviewRepository.lockAndMarkReminderSent(interview.getId());
                if (locked > 1) {
                    logger.warn("Concurrently locked more than 1 row? ID: {}", interview.getId());
                    toProcess.add(interview);
                } else if (locked == 1) {
                    toProcess.add(interview);
                } else {
                    logger.info("Interview ID: {} already locked/processed by another scheduler instance", interview.getId());
                }
            }

            if (toProcess.isEmpty()) {
                return;
            }

            // 3. Performance: Batch load Candidate and Interviewer EmployeeMaster details
            Set<Long> empIds = toProcess.stream()
                    .flatMap(i -> Stream.of(i.getEmployeeId(), i.getInterviewerId()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            // Also batch load ATS Super Users (User Level = 5)
            List<Long> superEmpIds = userRepository.findEmpIdsByUserLevel(5);
            if (superEmpIds != null) {
                empIds.addAll(superEmpIds);
            }

            Map<Long, EmployeeMaster> employeeMap = new HashMap<>();
            if (!empIds.isEmpty()) {
                employeeMap = employeeRepository.findAllById(empIds).stream()
                        .collect(Collectors.toMap(EmployeeMaster::getId, Function.identity(), (a, b) -> a));
            }

            // 4. Send reminders to interviewers and super users safely
            for (HraApplicantInterview interview : toProcess) {
                EmployeeMaster interviewer = employeeMap.get(interview.getInterviewerId());
                if (interviewer != null) {
                    notificationService.notifyUserAboutInterviewSafe(interviewer, interview, AtsNotificationType.ATS_INTERVIEW_REMINDER);
                } else {
                    logger.warn("Interviewer not found for ID: {} on interview: {}", interview.getInterviewerId(), interview.getId());
                }

                // Notify Super Users
                if (superEmpIds != null && !superEmpIds.isEmpty()) {
                    for (Long superId : superEmpIds) {
                        // Skip duplicate reminder to interviewer
                        if (interview.getInterviewerId() != null && interview.getInterviewerId().equals(superId)) {
                            continue;
                        }
                        EmployeeMaster superUser = employeeMap.get(superId);
                        if (superUser != null) {
                            notificationService.notifyUserAboutInterviewSafe(superUser, interview, AtsNotificationType.ATS_INTERVIEW_REMINDER);
                        }
                    }
                }
            }

        } catch (Exception e) {
            logger.error("Failed to run checkAndSendInterviewReminders scheduler", e);
        } finally {
            com.autonoma.erp.config.TenantContextHolder.clear();
        }
    }
}

package com.autonoma.erp.service;

import com.autonoma.erp.model.*;
import com.autonoma.erp.repository.EmployeeSatisfactionConfigRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;
import com.autonoma.erp.modules.platform.notification.entity.AppNotification;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.repository.*;
import com.autonoma.erp.service.admin.EmailSendingService;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.env.Environment;
import jakarta.annotation.PostConstruct;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service("hraEmployeeSatisfactionService")
@Slf4j
public class EmployeeSatisfactionService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EmployeeSatisfactionService.class);

    private final EmployeeSatisfactionMappingRepository mappingRepository;
    private final EmployeeSatisfactionResponseRepository responseRepository;
    private final EmployeeSatisfactionReminderLogRepository reminderLogRepository;
    private final EmployeeMasterRepository employeeMasterRepository;
    private final SatisfactionCriteriaRepository satisfactionCriteriaRepository;
    private final HrHolidayMasterRepository hrHolidayMasterRepository;
    private final AppNotificationRepository appNotificationRepository;
    private final EmailSendingService emailSendingService;
    private final EmployeeSatisfactionConfigRepository configRepository;
    private final Environment env;
    private final com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepository;

@Value("${app.base-url:http://localhost:3001}")
    private String baseUrl;

    @org.springframework.beans.factory.annotation.Autowired
    public EmployeeSatisfactionService(
            EmployeeSatisfactionMappingRepository mappingRepository,
            EmployeeSatisfactionResponseRepository responseRepository,
            EmployeeSatisfactionReminderLogRepository reminderLogRepository,
            EmployeeMasterRepository employeeMasterRepository,
            SatisfactionCriteriaRepository satisfactionCriteriaRepository,
            HrHolidayMasterRepository hrHolidayMasterRepository,
            AppNotificationRepository appNotificationRepository,
            EmailSendingService emailSendingService,
            EmployeeSatisfactionConfigRepository configRepository,
            Environment env,
            com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepository) {
        this.mappingRepository = mappingRepository;
        this.responseRepository = responseRepository;
        this.reminderLogRepository = reminderLogRepository;
        this.employeeMasterRepository = employeeMasterRepository;
        this.satisfactionCriteriaRepository = satisfactionCriteriaRepository;
        this.hrHolidayMasterRepository = hrHolidayMasterRepository;
        this.appNotificationRepository = appNotificationRepository;
        this.emailSendingService = emailSendingService;
        this.configRepository = configRepository;
        this.env = env;
        this.employeeJobProfileRepository = employeeJobProfileRepository;
    }

    @PostConstruct
    public void validateBaseUrl() {
        // Enforce proper base URL in production profile
        if (env != null && env.acceptsProfiles("prod")) {
            if (baseUrl == null || baseUrl.isBlank() || baseUrl.contains("localhost")) {
                throw new IllegalStateException("app.base-url must be configured for production and cannot be localhost.");
            }
            log.info("Production base URL set to {}", baseUrl);
        }
    }

    // Retrieve active configuration or return defaults
    public EmployeeSatisfactionConfig getConfig() {
        EmployeeSatisfactionConfig config = configRepository.findById(1L)
            .orElseGet(() -> {
                EmployeeSatisfactionConfig defaultConfig = new EmployeeSatisfactionConfig();
                defaultConfig.setId(1L);
                defaultConfig.setCycleIntervalMonths("6");
                defaultConfig.setCompletionPeriodDays("14");
                defaultConfig.setCreatedUser("System");
                defaultConfig.setCreatedDate(new Date());
                return configRepository.save(defaultConfig);
            });

        boolean needsUpdate = false;
        if (config.getCycleIntervalMonths() == null) {
            config.setCycleIntervalMonths("6");
            needsUpdate = true;
        }
        if (config.getCompletionPeriodDays() == null) {
            config.setCompletionPeriodDays("14");
            needsUpdate = true;
        }
        if (needsUpdate) {
            config = configRepository.save(config);
        }
        return config;
    }

    // Save configuration settings
    public EmployeeSatisfactionConfig saveConfig(EmployeeSatisfactionConfig config) {
        EmployeeSatisfactionConfig existing = getConfig();
        existing.setCycleIntervalMonths(config.getCycleIntervalMonths());
        existing.setCompletionPeriodDays(config.getCompletionPeriodDays());
        existing.setUpdatedUser(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        existing.setUpdatedDate(new Date());
        return configRepository.save(existing);
    }

    // Scan and update expired pending feedback mappings to Overdue status
    public void updatePendingToOverdueRealtime() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));

        // Use indexed status queries instead of findAll() + in-memory filter
        List<EmployeeSatisfactionMapping> active = new java.util.ArrayList<>();
        active.addAll(mappingRepository.findByStatus("Pending"));
        active.addAll(mappingRepository.findByStatus("Overdue"));

        for (EmployeeSatisfactionMapping m : active) {
            LocalDate endDate = m.getFeedbackEndDate();
            if (endDate == null) {
                endDate = m.getEligibilityDate().plusDays(7);
                m.setFeedbackStartDate(m.getEligibilityDate());
                m.setFeedbackEndDate(endDate);
            }
            if (today.isAfter(endDate)) {
                m.setStatus("Closed");
                m.setIsClosed("Y");
                mappingRepository.save(m);
                log.info("Auto-closed Employee Feedback Mapping ID: {} (7-day window expired)", m.getId());
            } else if ("Pending".equals(m.getStatus()) && today.isAfter(m.getEligibilityDate().plusDays(5))) {
                m.setStatus("Overdue");
                mappingRepository.save(m);
            }
        }
    }

    // Daily at 12:30 AM: Check and assign satisfaction feedback
    @Scheduled(cron = "0 30 0 * * *", zone = "Asia/Kolkata")
    public void runDailyAutoAssignment() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        String cycle = today.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        log.info("Running daily employee satisfaction auto-assignment for: {}", today);
        autoAssignForDate(today, cycle);
    }

    // Daily at 9:00 AM: Check and send reminders
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Kolkata")
    public void runDailyReminders() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        log.info("Running daily employee satisfaction reminder engine for: {}", today);

        updatePendingToOverdueRealtime();

        // Use indexed status queries instead of findAll() + in-memory filter
        List<EmployeeSatisfactionMapping> pendingMappings = new java.util.ArrayList<>();
        pendingMappings.addAll(mappingRepository.findByStatus("Pending"));
        pendingMappings.addAll(mappingRepository.findByStatus("Overdue"));

        for (EmployeeSatisfactionMapping mapping : pendingMappings) {
            if (mapping.getNextReminderDate() == null) {
                mapping.setNextReminderDate(today);
            }
            if (mapping.getNextReminderDate().isAfter(today)) {
                continue;
            }

            // Shift reminder next date if today is a non-working day
            if (!isWorkingDay(today)) {
                LocalDate nextWorking = calculateNextWorkingDay(today);
                mapping.setNextReminderDate(nextWorking);
                mappingRepository.save(mapping);
                log.info("Deferred reminder for {} because {} is weekend/holiday. Next: {}", 
                    mapping.getEmployee().getEmpCode(), today, nextWorking);
                continue;
            }

            sendReminderEmail(mapping, today);
        }
    }

    // Core mapping auto-assignment logic
    public void autoAssignForDate(LocalDate today, String cycle) {
        EmployeeSatisfactionConfig config = getConfig();
        int cycleInterval = Integer.parseInt(config.getCycleIntervalMonths());

        List<EmployeeMaster> employees = employeeMasterRepository.findByStatus("Active");
        for (EmployeeMaster emp : employees) {
            if (emp.getDateOfJoining() == null || !Boolean.TRUE.equals(emp.getIsActive())) {
                continue;
            }

            LocalDate joiningDate = new java.sql.Date(emp.getDateOfJoining().getTime()).toLocalDate();
            if (joiningDate.isAfter(today)) {
                continue;
            }

            int monthsDiff = (today.getYear() - joiningDate.getYear()) * 12 + (today.getMonthValue() - joiningDate.getMonthValue());
            if (monthsDiff < 0 || monthsDiff % cycleInterval != 0) {
                continue; // Not their cycle month
            }

            int joiningDay = joiningDate.getDayOfMonth();
            int todayDay = today.getDayOfMonth();
            boolean dayMatches = (joiningDay == todayDay);
            if (!dayMatches && todayDay == today.lengthOfMonth() && joiningDay > today.lengthOfMonth()) {
                dayMatches = true; // Handle month end variations
            }

            if (!dayMatches) {
                continue;
            }

            Optional<EmployeeSatisfactionMapping> existing = mappingRepository.findByEmployeeIdAndFeedbackCycle(emp.getId(), cycle);
            if (existing.isPresent()) {
                continue;
            }

            EmployeeSatisfactionMapping mapping = new EmployeeSatisfactionMapping();
            mapping.setEmployee(emp);
            mapping.setFeedbackCycle(cycle);
            mapping.setEligibilityDate(today);
            mapping.setFeedbackStartDate(today);
            mapping.setFeedbackEndDate(today.plusDays(7));
            mapping.setIsClosed("N");
            mapping.setStatus("Pending");
            mapping.setReminderCount("0");
            mapping.setNextReminderDate(today);

            mappingRepository.save(mapping);
            log.info("Auto-assigned satisfaction feedback mapping to employee {} for cycle {}", emp.getEmpCode(), cycle);

            createSystemNotification(emp, mapping, "Feedback Assigned", 
                String.format("You have been assigned a new Employee Satisfaction Feedback for the cycle %s.", cycle));
        }
    }

    // Force trigger auto-assignment for a specific cycle month (e.g. "2026-06")
    public int triggerAutoAssignForMonth(String cycle) {
        String[] parts = cycle.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);
        LocalDate cycleStartDate = LocalDate.of(year, month, 1);

        EmployeeSatisfactionConfig config = getConfig();
        int cycleInterval = Integer.parseInt(config.getCycleIntervalMonths());

        List<EmployeeMaster> employees = employeeMasterRepository.findByStatus("Active");
        int count = 0;

        for (EmployeeMaster emp : employees) {
            if (emp.getDateOfJoining() == null || !Boolean.TRUE.equals(emp.getIsActive())) {
                continue;
            }

            LocalDate joiningDate = new java.sql.Date(emp.getDateOfJoining().getTime()).toLocalDate();
            if (joiningDate.isAfter(cycleStartDate.withDayOfMonth(cycleStartDate.lengthOfMonth()))) {
                continue;
            }

            int monthsDiff = (year - joiningDate.getYear()) * 12 + (month - joiningDate.getMonthValue());
            if (monthsDiff < 0 || monthsDiff % cycleInterval != 0) {
                continue;
            }

            Optional<EmployeeSatisfactionMapping> existing = mappingRepository.findByEmployeeIdAndFeedbackCycle(emp.getId(), cycle);
            if (existing.isPresent()) {
                continue;
            }

            EmployeeSatisfactionMapping mapping = new EmployeeSatisfactionMapping();
            mapping.setEmployee(emp);
            mapping.setFeedbackCycle(cycle);

            int joiningDay = Math.min(joiningDate.getDayOfMonth(), cycleStartDate.lengthOfMonth());
            LocalDate eligDate = LocalDate.of(year, month, joiningDay);

            mapping.setEligibilityDate(eligDate);
            mapping.setFeedbackStartDate(eligDate);
            mapping.setFeedbackEndDate(eligDate.plusDays(7));
            mapping.setIsClosed("N");
            mapping.setStatus("Pending");
            mapping.setReminderCount("0");
            mapping.setNextReminderDate(eligDate);

            mappingRepository.save(mapping);
            count++;

            createSystemNotification(emp, mapping, "Feedback Assigned", 
                String.format("You have been assigned a new Employee Satisfaction Feedback for the cycle %s.", cycle));
        }
        return count;
    }

    // Send email using Dynamically resolved Employee Master properties
    public void sendReminderEmail(EmployeeSatisfactionMapping mapping, LocalDate today) {
        EmployeeMaster emp = mapping.getEmployee();
        String toEmail = null;
        if (emp != null) {
            java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile> jpOpt = 
                employeeJobProfileRepository.findByEmployeeId(emp.getId());
            if (jpOpt.isPresent() && jpOpt.get().getOfficeEmail() != null) {
                toEmail = jpOpt.get().getOfficeEmail().trim();
            }
        }
        if (toEmail == null || toEmail.strip().isEmpty()) {
            log.warn("Skipping reminder for employee {} — no officeMail configured.", emp.getEmpCode());
            return;
        }

        String subject = "Employee Satisfaction Feedback Reminder";
        
        String feedbackLink = baseUrl + "/hra/satisfaction/feedback-form?mappingId=" + mapping.getId();
        
        String htmlBody = String.format(
            "<html><body>" +
            "<p>Dear Employee,</p>" +
            "<p>You have a pending Employee Satisfaction Feedback.</p>" +
            "<p>Please click the link below to complete your feedback.</p>" +
            "<p><a href='%s'>%s</a></p>" +
            "<p>Thank you.</p>" +
            "</body></html>",
            feedbackLink, feedbackLink
        );

        boolean success = emailSendingService.sendEmailWithAttachments(toEmail, null, null, subject, htmlBody, null);

        EmployeeSatisfactionReminderLog logEntry = new EmployeeSatisfactionReminderLog();
        logEntry.setEmployee(emp);
        logEntry.setMapping(mapping);
        int currentCount = Integer.parseInt(mapping.getReminderCount());
        logEntry.setReminderNumber(String.valueOf(currentCount + 1));
        logEntry.setReminderDate(today);
        logEntry.setEmailStatus(success ? "Sent" : "Failed");
        logEntry.setCreatedBy("System");
        logEntry.setUpdatedBy("System");
        reminderLogRepository.save(logEntry);

        mapping.setReminderCount(String.valueOf(currentCount + 1));
        mapping.setLastReminderDate(today);

        // Daily reminder frequency: set next reminder to tomorrow, then shift past weekends/holidays
        LocalDate rawNext = today.plusDays(1);
        if (!isWorkingDay(rawNext)) {
            rawNext = calculateNextWorkingDay(rawNext);
        }
        mapping.setNextReminderDate(rawNext);
        mapping.setSkipAuditUpdate(true);

        mappingRepository.save(mapping);

        createSystemNotification(emp, mapping, "Reminder Sent", 
            String.format("Reminder #%s for satisfaction feedback cycle %s has been sent to your email.", 
                mapping.getReminderCount(), mapping.getFeedbackCycle()));
    }

    public boolean isWorkingDay(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            return false;
        }

        boolean isHoliday = hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(date).stream().anyMatch(h -> !h.getIsOptional());
        if (isHoliday) {
            return false;
        }

        return true;
    }

    public LocalDate calculateNextWorkingDay(LocalDate date) {
        LocalDate temp = date;
        while (true) {
            temp = temp.plusDays(1);
            if (isWorkingDay(temp)) {
                return temp;
            }
        }
    }

    public String calculateScore(String rating) {
        if ("Excellent".equalsIgnoreCase(rating)) return "100";
        if ("Very Good".equalsIgnoreCase(rating)) return "75";
        if ("Good".equalsIgnoreCase(rating)) return "50";
        if ("Moderate".equalsIgnoreCase(rating)) return "25";
        if ("Poor".equalsIgnoreCase(rating)) return "0";
        return "0";
    }

    @Transactional
    public EmployeeSatisfactionMapping submitFeedback(Long mappingId, String generalComments, String suggestions, List<Map<String, Object>> responses) {
        EmployeeSatisfactionMapping mapping = mappingRepository.findById(mappingId)
            .orElseThrow(() -> new RuntimeException("Mapping not found with ID: " + mappingId));

        if ("Completed".equals(mapping.getStatus())) {
            throw new RuntimeException("Feedback has already been submitted for this cycle.");
        }
        if ("Closed".equals(mapping.getStatus()) || "Y".equalsIgnoreCase(mapping.getIsClosed())) {
            throw new RuntimeException("Feedback cycle is closed. No submissions allowed after 7 days.");
        }

        double totalScore = 0;
        int count = 0;

        for (Map<String, Object> resMap : responses) {
            Long questionId = Long.valueOf(resMap.get("questionId").toString());
            String rating = (String) resMap.get("rating");
            String comment = (String) resMap.get("comments");

            SatisfactionCriteria question = satisfactionCriteriaRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));

            String score = calculateScore(rating);

            EmployeeSatisfactionResponse response = new EmployeeSatisfactionResponse();
            response.setEmployee(mapping.getEmployee());
            response.setMapping(mapping);
            response.setQuestion(question);
            response.setRating(rating);
            response.setScore(score);
            response.setComments(comment);

            responseRepository.save(response);

            totalScore += Integer.parseInt(score);
            count++;
        }

        double averageScore = count > 0 ? (totalScore / count) : 0;

        mapping.setStatus("Completed");
        mapping.setSubmittedDate(new Date());
        mapping.setTotalScore(String.valueOf((int) totalScore));
        mapping.setAverageScore(String.valueOf(averageScore));
        mapping.setGeneralComments(generalComments);
        mapping.setSuggestions(suggestions);
        mapping.setNextReminderDate(null);

        EmployeeSatisfactionMapping saved = mappingRepository.save(mapping);

        createSystemNotification(mapping.getEmployee(), mapping, "Feedback Submitted", 
            "Your satisfaction feedback has been successfully submitted. Thank you!");

        if (averageScore < 50) {
            notifyHrAboutLowSatisfaction(mapping);
        }

        return saved;
    }

    private void notifyHrAboutLowSatisfaction(EmployeeSatisfactionMapping mapping) {
        try {
            employeeMasterRepository.findByEmpCode("admin").ifPresent(hr -> {
                AppNotification notification = new AppNotification();
                notification.setRecipientEmpId(hr.getId());
                notification.setTitle("Alert: Low Satisfaction Level");
                notification.setMessage(String.format("Employee %s (%s) submitted low satisfaction feedback (Average: %.1f%%).",
                    mapping.getEmployee().getEmployeeName(), mapping.getEmployee().getEmpCode(), Double.parseDouble(mapping.getAverageScore())));
                notification.setLinkUrl("/hra/satisfaction/dashboard");
                appNotificationRepository.save(notification);
            });
        } catch (Exception e) {
            log.error("Failed to create HR alert: {}", e.getMessage());
        }
    }

    private void createSystemNotification(EmployeeMaster recipient, EmployeeSatisfactionMapping mapping, String action, String msg) {
        try {
            AppNotification notification = new AppNotification();
            notification.setRecipientEmpId(recipient.getId());
            notification.setTitle("Employee Satisfaction: " + action);
            notification.setMessage(msg);
            notification.setLinkUrl("/hra/satisfaction/feedback-form?mappingId=" + mapping.getId());
            appNotificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Failed to create system notification: {}", e.getMessage());
        }
    }

    // Helper for computing risk levels uniformly
    public String computeRiskLevel(EmployeeSatisfactionMapping m) {
        if (!"Completed".equals(m.getStatus()) || m.getAverageScore() == null) {
            return "Low";
        }
        double avg = Double.parseDouble(m.getAverageScore());
        if (avg < 50) {
            return "High";
        } else if (avg < 75) {
            return "Medium";
        } else {
            List<EmployeeSatisfactionResponse> responses = responseRepository.findByMappingId(m.getId());
            long poorOrModerateCount = responses.stream()
                .filter(r -> "Poor".equalsIgnoreCase(r.getRating()) || "Moderate".equalsIgnoreCase(r.getRating()))
                .count();
            if (poorOrModerateCount >= 2) {
                return "Medium";
            }
        }
        return "Low";
    }

    // Unified Advanced Filtering Helper
    public List<EmployeeSatisfactionMapping> getFilteredMappings(
            String cycle, String status, Long departmentId, Long designationId,
            String startDate, String endDate, String joinStartDate, String joinEndDate,
            Integer minScore, Integer maxScore, String riskLevel, String reminderStatus, String search) {
        
        updatePendingToOverdueRealtime();
        
        List<EmployeeSatisfactionMapping> list = mappingRepository.findAll();
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));

        // 1. Filter by Cycle
        if (cycle != null && !cycle.trim().isEmpty() && !"ALL".equalsIgnoreCase(cycle)) {
            list = list.stream().filter(m -> cycle.equalsIgnoreCase(m.getFeedbackCycle())).collect(Collectors.toList());
        }

        // 2. Filter by Status
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            list = list.stream().filter(m -> status.equalsIgnoreCase(m.getStatus())).collect(Collectors.toList());
        }

        // 3. Filter by Department ID
        if (departmentId != null) {
            list = list.stream().filter(m -> m.getEmployee() != null && departmentId.equals(m.getEmployee().getDepartmentId())).collect(Collectors.toList());
        }

        // 4. Filter by Designation ID
        if (designationId != null) {
            list = list.stream().filter(m -> m.getEmployee() != null && designationId.equals(m.getEmployee().getDesignationId())).collect(Collectors.toList());
        }

        // 5. Filter by Eligibility Date Range
        if (startDate != null && !startDate.trim().isEmpty()) {
            LocalDate start = LocalDate.parse(startDate);
            list = list.stream().filter(m -> m.getEligibilityDate() != null && !m.getEligibilityDate().isBefore(start)).collect(Collectors.toList());
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            LocalDate end = LocalDate.parse(endDate);
            list = list.stream().filter(m -> m.getEligibilityDate() != null && !m.getEligibilityDate().isAfter(end)).collect(Collectors.toList());
        }

        // 6. Filter by Joining Date Range
        if (joinStartDate != null && !joinStartDate.trim().isEmpty()) {
            LocalDate start = LocalDate.parse(joinStartDate);
            list = list.stream().filter(m -> {
                if (m.getEmployee() == null || m.getEmployee().getDateOfJoining() == null) return false;
                LocalDate joinDate = new java.sql.Date(m.getEmployee().getDateOfJoining().getTime()).toLocalDate();
                return !joinDate.isBefore(start);
            }).collect(Collectors.toList());
        }
        if (joinEndDate != null && !joinEndDate.trim().isEmpty()) {
            LocalDate end = LocalDate.parse(joinEndDate);
            list = list.stream().filter(m -> {
                if (m.getEmployee() == null || m.getEmployee().getDateOfJoining() == null) return false;
                LocalDate joinDate = new java.sql.Date(m.getEmployee().getDateOfJoining().getTime()).toLocalDate();
                return !joinDate.isAfter(end);
            }).collect(Collectors.toList());
        }

        // 7. Filter by Score Range
        if (minScore != null) {
            list = list.stream().filter(m -> m.getAverageScore() != null && Double.parseDouble(m.getAverageScore()) >= minScore).collect(Collectors.toList());
        }
        if (maxScore != null) {
            list = list.stream().filter(m -> m.getAverageScore() != null && Double.parseDouble(m.getAverageScore()) <= maxScore).collect(Collectors.toList());
        }

        // 8. Filter by Risk Level
        if (riskLevel != null && !riskLevel.trim().isEmpty() && !"ALL".equalsIgnoreCase(riskLevel)) {
            list = list.stream().filter(m -> {
                String computedRisk = computeRiskLevel(m);
                return riskLevel.equalsIgnoreCase(computedRisk);
            }).collect(Collectors.toList());
        }

        // 9. Filter by Reminder Status
        if (reminderStatus != null && !reminderStatus.trim().isEmpty() && !"ALL".equalsIgnoreCase(reminderStatus)) {
            list = list.stream().filter(m -> {
                if ("Completed".equals(m.getStatus())) return false;
                boolean isAwaiting = m.getNextReminderDate() != null && !m.getNextReminderDate().isAfter(today);
                if ("Awaiting Reminder".equalsIgnoreCase(reminderStatus)) {
                    return isAwaiting;
                } else if ("Reminder Sent".equalsIgnoreCase(reminderStatus)) {
                    return Integer.parseInt(m.getReminderCount()) > 0;
                } else if ("No Reminder Sent".equalsIgnoreCase(reminderStatus)) {
                    return Integer.parseInt(m.getReminderCount()) == 0;
                }
                return true;
            }).collect(Collectors.toList());
        }

        // 10. Filter by Search term
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.trim().toLowerCase();
            list = list.stream().filter(m -> 
                (m.getEmployee() != null && m.getEmployee().getEmpCode() != null && m.getEmployee().getEmpCode().toLowerCase().contains(searchLower)) ||
                (m.getEmployee() != null && m.getEmployee().getEmployeeName() != null && m.getEmployee().getEmployeeName().toLowerCase().contains(searchLower))
            ).collect(Collectors.toList());
        }

        return list;
    }

    public Map<String, Object> getDashboardSummaryFiltered(List<EmployeeSatisfactionMapping> filteredMappings) {
        long totalEligible = filteredMappings.size();
        long completed = filteredMappings.stream().filter(m -> "Completed".equals(m.getStatus())).count();
        long pending = filteredMappings.stream().filter(m -> "Pending".equals(m.getStatus())).count();
        long overdue = filteredMappings.stream().filter(m -> "Overdue".equals(m.getStatus())).count();

        double completionPercentage = totalEligible > 0 ? ((double) completed / totalEligible) * 100 : 0.0;

        double totalScoreAvg = 0;
        int completedCount = 0;
        long awaitingReminder = 0;
        long lowSatisfaction = 0;
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));

        for (EmployeeSatisfactionMapping m : filteredMappings) {
            if ("Completed".equals(m.getStatus())) {
                if (m.getAverageScore() != null) {
                    totalScoreAvg += Double.parseDouble(m.getAverageScore());
                    completedCount++;
                }
                if (m.getAverageScore() != null && Double.parseDouble(m.getAverageScore()) < 50.0) {
                    lowSatisfaction++;
                }
            } else {
                if (m.getNextReminderDate() != null && !m.getNextReminderDate().isAfter(today)) {
                    awaitingReminder++;
                }
            }
        }

        double averageSatisfactionScore = completedCount > 0 ? (totalScoreAvg / completedCount) : 0.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalEligibleEmployees", totalEligible);
        summary.put("feedbackCompleted", completed);
        summary.put("feedbackPending", pending);
        summary.put("feedbackOverdue", overdue);
        summary.put("completionPercentage", completionPercentage);
        summary.put("averageSatisfactionScore", averageSatisfactionScore);
        summary.put("employeesAwaitingReminder", awaitingReminder);
        summary.put("lowSatisfactionEmployees", lowSatisfaction);

        return summary;
    }

    public Map<String, Object> getAnalyticsFiltered(List<EmployeeSatisfactionMapping> filteredMappings) {
        List<EmployeeSatisfactionMapping> completed = filteredMappings.stream()
            .filter(m -> "Completed".equals(m.getStatus()))
            .collect(Collectors.toList());

        // 1. Department averages
        Map<String, List<Double>> deptScores = new HashMap<>();
        for (EmployeeSatisfactionMapping m : completed) {
            if (m.getEmployee() != null && m.getEmployee().getDepartment() != null) {
                String deptName = m.getEmployee().getDepartment().getDepartmentName();
                if (deptName != null && m.getAverageScore() != null) {
                    deptScores.computeIfAbsent(deptName, k -> new ArrayList<>()).add(Double.parseDouble(m.getAverageScore()));
                }
            }
        }

        Map<String, Double> deptAverages = new HashMap<>();
        deptScores.forEach((dept, list) -> {
            double avg = list.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            deptAverages.put(dept, avg);
        });

        // 2. Monthly Trend
        Map<String, List<Double>> cycleScores = new HashMap<>();
        for (EmployeeSatisfactionMapping m : completed) {
            if (m.getFeedbackCycle() != null && m.getAverageScore() != null) {
                cycleScores.computeIfAbsent(m.getFeedbackCycle(), k -> new ArrayList<>()).add(Double.parseDouble(m.getAverageScore()));
            }
        }
        Map<String, Double> trend = new TreeMap<>();
        cycleScores.forEach((c, list) -> {
            double avg = list.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            trend.put(c, avg);
        });

        // 3. Distribution Categories
        int excellent = 0;
        int veryGood = 0;
        int good = 0;
        int moderate = 0;
        int poor = 0;

        for (EmployeeSatisfactionMapping m : completed) {
            if (m.getAverageScore() != null) {
                double score = Double.parseDouble(m.getAverageScore());
                if (score >= 90) excellent++;
                else if (score >= 75) veryGood++;
                else if (score >= 50) good++;
                else if (score >= 25) moderate++;
                else poor++;
            }
        }

        Map<String, Integer> distribution = new HashMap<>();
        distribution.put("Excellent (90-100)", excellent);
        distribution.put("Very Good (75-89)", veryGood);
        distribution.put("Good (50-74)", good);
        distribution.put("Moderate (25-49)", moderate);
        distribution.put("Poor (0-24)", poor);

        // Department highlights
        String highestDept = null;
        double highestScore = -1.0;
        String lowestDept = null;
        double lowestScore = 101.0;

        for (Map.Entry<String, Double> entry : deptAverages.entrySet()) {
            if (entry.getValue() > highestScore) {
                highestScore = entry.getValue();
                highestDept = entry.getKey();
            }
            if (entry.getValue() < lowestScore) {
                lowestScore = entry.getValue();
                lowestDept = entry.getKey();
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("departmentAverages", deptAverages);
        data.put("monthlyTrend", trend);
        data.put("scoreDistribution", distribution);
        data.put("highestPerformingDepartment", highestDept != null ? highestDept + " (" + String.format("%.1f", highestScore) + "%)" : "N/A");
        data.put("lowestPerformingDepartment", lowestDept != null ? lowestDept + " (" + String.format("%.1f", lowestScore) + "%)" : "N/A");

        return data;
    }

    public List<Map<String, Object>> getRiskEmployeesFiltered(List<EmployeeSatisfactionMapping> filteredMappings) {
        List<EmployeeSatisfactionMapping> completed = filteredMappings.stream()
            .filter(m -> "Completed".equals(m.getStatus()))
            .collect(Collectors.toList());

        List<Map<String, Object>> riskList = new ArrayList<>();
        for (EmployeeSatisfactionMapping m : completed) {
            String riskLevel = computeRiskLevel(m);
            if (!"Low".equals(riskLevel)) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", m.getId());
                map.put("employeeId", m.getEmployee().getEmpCode());
                map.put("employeeName", m.getEmployee().getEmployeeName());
                map.put("department", m.getEmployee().getDepartment() != null ? m.getEmployee().getDepartment().getDepartmentName() : "N/A");
                map.put("averageScore", m.getAverageScore());
                map.put("riskLevel", riskLevel);
                riskList.add(map);
            }
        }

        // Sort by risk: High first, then Medium
        riskList.sort((r1, r2) -> ((String) r2.get("riskLevel")).compareTo((String) r1.get("riskLevel")));
        return riskList;
    }

    // Retained for backward compatibility
    @Deprecated
    public Map<String, Object> getDashboardSummary(String cycle) {
        updatePendingToOverdueRealtime();
        List<EmployeeSatisfactionMapping> list = getFilteredMappings(cycle, null, null, null, null, null, null, null, null, null, null, null, null);
        return getDashboardSummaryFiltered(list);
    }

    @Deprecated
    public Map<String, Object> getAnalytics(String cycle) {
        List<EmployeeSatisfactionMapping> list = getFilteredMappings(cycle, null, null, null, null, null, null, null, null, null, null, null, null);
        return getAnalyticsFiltered(list);
    }

    @Deprecated
    public List<Map<String, Object>> getRiskEmployees() {
        List<EmployeeSatisfactionMapping> list = mappingRepository.findAll();
        return getRiskEmployeesFiltered(list);
    }
}

package com.autonoma.erp.service;

import com.autonoma.erp.model.*;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.platform.notification.entity.AppNotification;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.repository.*;
import com.autonoma.erp.service.admin.EmailSendingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class InternalCustomerSatisfactionService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(InternalCustomerSatisfactionService.class);

    private final InternalCustomerSatisfactionMappingRepository mappingRepository;
    private final InternalCustomerSatisfactionResponseRepository responseRepository;
    private final EmployeeMasterRepository employeeMasterRepository;
    private final SatisfactionCriteriaRepository criteriaRepository;
    private final AppNotificationRepository appNotificationRepository;
    private final EmailSendingService emailSendingService;
    private final EmployeeSatisfactionService employeeSatisfactionService;
    private final com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public InternalCustomerSatisfactionService(
            InternalCustomerSatisfactionMappingRepository mappingRepository,
            InternalCustomerSatisfactionResponseRepository responseRepository,
            EmployeeMasterRepository employeeMasterRepository,
            SatisfactionCriteriaRepository criteriaRepository,
            AppNotificationRepository appNotificationRepository,
            EmailSendingService emailSendingService,
            EmployeeSatisfactionService employeeSatisfactionService,
            com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepository) {
        this.mappingRepository = mappingRepository;
        this.responseRepository = responseRepository;
        this.employeeMasterRepository = employeeMasterRepository;
        this.criteriaRepository = criteriaRepository;
        this.appNotificationRepository = appNotificationRepository;
        this.emailSendingService = emailSendingService;
        this.employeeSatisfactionService = employeeSatisfactionService;
        this.employeeJobProfileRepository = employeeJobProfileRepository;
    }

    // Scan and update expired pending feedback mappings to Overdue / Closed status
    public void updatePendingToOverdueRealtime() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));

        List<InternalCustomerSatisfactionMapping> active = mappingRepository.findAll().stream()
            .filter(m -> "Pending".equals(m.getStatus()) || "Overdue".equals(m.getStatus()))
            .collect(Collectors.toList());

        int completionPeriodDays = 7;
        try {
            if (employeeSatisfactionService != null && employeeSatisfactionService.getConfig() != null) {
                completionPeriodDays = Integer.parseInt(employeeSatisfactionService.getConfig().getCompletionPeriodDays());
            }
        } catch (Exception e) {
            log.warn("Could not retrieve satisfaction config, defaulting to 7 days. Error: {}", e.getMessage());
        }

        for (InternalCustomerSatisfactionMapping m : active) {
            LocalDate endDate = m.getFeedbackEndDate();
            if (endDate == null) {
                endDate = m.getEligibilityDate().plusDays(completionPeriodDays);
                m.setFeedbackStartDate(m.getEligibilityDate());
                m.setFeedbackEndDate(endDate);
            }
            if (today.isAfter(endDate)) {
                m.setStatus("Closed");
                m.setIsClosed("Y");
                mappingRepository.save(m);
                log.info("Auto-closed Internal Customer Feedback Mapping ID: {} (completion window expired)", m.getId());
            } else if ("Pending".equals(m.getStatus()) && today.isAfter(m.getEligibilityDate().plusDays(5))) {
                m.setStatus("Overdue");
                mappingRepository.save(m);
            }
        }
    }

    // Force trigger auto-assignment for a specific cycle month (e.g. "2026-06")
    public int triggerAutoAssignForMonth(String cycle) {
        List<EmployeeMaster> employees = employeeMasterRepository.findByStatus("Active").stream()
            .filter(emp -> Boolean.TRUE.equals(emp.getIsActive()))
            .collect(Collectors.toList());

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        int count = 0;

        int completionPeriodDays = 7;
        try {
            if (employeeSatisfactionService != null && employeeSatisfactionService.getConfig() != null) {
                completionPeriodDays = Integer.parseInt(employeeSatisfactionService.getConfig().getCompletionPeriodDays());
            }
        } catch (Exception e) {
            log.warn("Could not retrieve satisfaction config, defaulting to 7 days. Error: {}", e.getMessage());
        }

        for (EmployeeMaster emp : employees) {
            Optional<InternalCustomerSatisfactionMapping> existing = mappingRepository.findByEmployeeIdAndFeedbackCycle(emp.getId(), cycle);
            if (existing.isPresent()) {
                continue;
            }

            InternalCustomerSatisfactionMapping mapping = new InternalCustomerSatisfactionMapping();
            mapping.setEmployee(emp);
            mapping.setFeedbackCycle(cycle);
            mapping.setEligibilityDate(today);
            mapping.setFeedbackStartDate(today);
            mapping.setFeedbackEndDate(today.plusDays(completionPeriodDays));
            mapping.setIsClosed("N");
            mapping.setStatus("Pending");
            mapping.setReminderCount(0);
            mapping.setNextReminderDate(today);

            mappingRepository.save(mapping);
            count++;

            createSystemNotification(emp, mapping, "Feedback Assigned", 
                String.format("You have been assigned a new Internal Customer Satisfaction Feedback for the cycle %s.", cycle));
        }
        return count;
    }

    // Daily at 9:00 AM: Internal Customer Reminders
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Kolkata")
    public void runDailyInternalCustomerReminders() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        log.info("Running daily internal customer satisfaction reminder engine for: {}", today);

        updatePendingToOverdueRealtime();

        List<InternalCustomerSatisfactionMapping> pendingMappings = mappingRepository.findAll().stream()
            .filter(m -> "Pending".equals(m.getStatus()) || "Overdue".equals(m.getStatus()))
            .collect(Collectors.toList());

        for (InternalCustomerSatisfactionMapping mapping : pendingMappings) {
            if (mapping.getNextReminderDate() == null || mapping.getNextReminderDate().isAfter(today)) {
                continue;
            }

            sendReminderEmail(mapping, today);
        }
    }

    public void sendReminderEmail(InternalCustomerSatisfactionMapping mapping, LocalDate today) {
        EmployeeMaster emp = mapping.getEmployee();
        String toEmail = null;
        if (emp != null) {
            java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile> jpOpt = 
                employeeJobProfileRepository.findByEmployeeId(emp.getId());
            if (jpOpt.isPresent() && jpOpt.get().getOfficeEmail() != null) {
                toEmail = jpOpt.get().getOfficeEmail().trim();
            }
        }
        if (toEmail == null || toEmail.trim().isEmpty()) {
            log.warn("Skipping internal customer reminder email for {} - no email configured.", emp.getEmpCode());
            mapping.setNextReminderDate(today.plusDays(1));
            mappingRepository.save(mapping);
            return;
        }

        String subject = "Action Required: Internal Customer Satisfaction Feedback (" + mapping.getFeedbackCycle() + ")";
        String htmlBody = String.format(
            "<html><body>" +
            "<h2>Dear %s,</h2>" +
            "<p>This is a reminder to submit your feedback for the <b>%s</b> Internal Customer Satisfaction cycle.</p>" +
            "<p>Your feedback is highly valuable and helps improve our internal services.</p>" +
            "<p>Please click the link below to submit your feedback:</p>" +
            "<p><a href='http://localhost:3001/master/sales/crm/satisfaction/feedback-entry?type=InternalCustomer&mappingId=%d' style='background-color:#00796b;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;'>Complete Feedback Now</a></p>" +
            "<p>Thank you,<br/>QMS & Admin Team</p>" +
            "</body></html>",
            emp.getEmployeeName(), mapping.getFeedbackCycle(), mapping.getId()
        );

        boolean success = emailSendingService.sendEmailWithAttachments(toEmail, null, null, subject, htmlBody, null);

        mapping.setReminderCount(mapping.getReminderCount() + 1);
        mapping.setLastReminderDate(today);
        mapping.setNextReminderDate(today.plusDays(1));
        mappingRepository.save(mapping);

        createSystemNotification(emp, mapping, "Reminder Sent", 
            String.format("Reminder #%d for internal customer satisfaction feedback cycle %s has been sent to your email.", 
                mapping.getReminderCount(), mapping.getFeedbackCycle()));
    }

    @Transactional
    public InternalCustomerSatisfactionMapping submitFeedback(Long mappingId, String generalComments, String suggestions, List<Map<String, Object>> responses) {
        InternalCustomerSatisfactionMapping mapping = mappingRepository.findById(mappingId)
            .orElseThrow(() -> new RuntimeException("Internal Customer Mapping not found with ID: " + mappingId));

        if ("Completed".equals(mapping.getStatus())) {
            throw new RuntimeException("Feedback has already been submitted for this cycle.");
        }
        if ("Closed".equals(mapping.getStatus()) || "Y".equalsIgnoreCase(mapping.getIsClosed())) {
            throw new RuntimeException("Feedback cycle is closed. No submissions allowed after completion window expired.");
        }

        double totalScore = 0;
        int count = 0;

        for (Map<String, Object> resMap : responses) {
            Long questionId = Long.valueOf(resMap.get("questionId").toString());
            String rating = (String) resMap.get("rating");
            String comment = (String) resMap.get("comments");

            int score = calculateScore(rating);

            // Comments mandatory for Poor/Moderate ratings (score <= 25)
            if (score <= 25 && (comment == null || comment.trim().isEmpty())) {
                throw new RuntimeException("Comments are required for ratings of Moderate or Poor.");
            }

            SatisfactionCriteria question = criteriaRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found with ID: " + questionId));

            InternalCustomerSatisfactionResponse response = new InternalCustomerSatisfactionResponse();
            response.setMapping(mapping);
            response.setQuestion(question);
            response.setRating(rating);
            response.setScore(score);
            response.setComments(comment);

            responseRepository.save(response);

            totalScore += score;
            count++;
        }

        double averageScore = count > 0 ? (totalScore / count) : 0;

        mapping.setStatus("Completed");
        mapping.setSubmittedDate(new Date());
        mapping.setTotalScore((int) totalScore);
        mapping.setAverageScore(averageScore);
        mapping.setGeneralComments(generalComments);
        mapping.setSuggestions(suggestions);
        mapping.setNextReminderDate(null);

        InternalCustomerSatisfactionMapping saved = mappingRepository.save(mapping);

        createSystemNotification(mapping.getEmployee(), mapping, "Feedback Submitted", 
            "Your internal customer satisfaction feedback has been successfully submitted. Thank you!");

        if (averageScore < 50) {
            notifyHrAboutLowSatisfaction(mapping);
        }

        return saved;
    }

    private int calculateScore(String rating) {
        if ("Excellent".equalsIgnoreCase(rating)) return 100;
        if ("Very Good".equalsIgnoreCase(rating)) return 75;
        if ("Good".equalsIgnoreCase(rating)) return 50;
        if ("Moderate".equalsIgnoreCase(rating)) return 25;
        if ("Poor".equalsIgnoreCase(rating)) return 0;
        return 0;
    }

    private void notifyHrAboutLowSatisfaction(InternalCustomerSatisfactionMapping mapping) {
        try {
            employeeMasterRepository.findByEmpCode("admin").ifPresent(hr -> {
                AppNotification notification = new AppNotification();
                notification.setRecipientEmpId(hr.getId());
                notification.setTitle("Alert: Low Internal Customer Satisfaction");
                notification.setMessage(String.format("Employee %s (%s) submitted low internal customer satisfaction feedback (Average: %.1f%%).",
                    mapping.getEmployee().getEmployeeName(), mapping.getEmployee().getEmpCode(), mapping.getAverageScore()));
                notification.setLinkUrl("/master/sales/crm/satisfaction");
                appNotificationRepository.save(notification);
            });
        } catch (Exception e) {
            log.error("Failed to create HR alert for low internal customer satisfaction: {}", e.getMessage());
        }
    }

    private void createSystemNotification(EmployeeMaster recipient, InternalCustomerSatisfactionMapping mapping, String action, String msg) {
        try {
            AppNotification notification = new AppNotification();
            notification.setRecipientEmpId(recipient.getId());
            notification.setTitle("Internal Customer Satisfaction: " + action);
            notification.setMessage(msg);
            notification.setLinkUrl("/master/sales/crm/satisfaction/feedback-entry?type=InternalCustomer&mappingId=" + mapping.getId());
            appNotificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Failed to create system notification: {}", e.getMessage());
        }
    }

    public String computeRiskLevel(InternalCustomerSatisfactionMapping m) {
        if (!"Completed".equals(m.getStatus()) || m.getAverageScore() == null) {
            return "Low";
        }
        double avg = m.getAverageScore();
        if (avg < 50) {
            return "High";
        } else if (avg < 75) {
            return "Medium";
        } else {
            List<InternalCustomerSatisfactionResponse> responses = responseRepository.findByMappingId(m.getId());
            long poorOrModerateCount = responses.stream()
                .filter(r -> "Poor".equalsIgnoreCase(r.getRating()) || "Moderate".equalsIgnoreCase(r.getRating()))
                .count();
            if (poorOrModerateCount >= 2) {
                return "Medium";
            }
        }
        return "Low";
    }

    // Dynamic filtering capability
    public List<InternalCustomerSatisfactionMapping> getFilteredMappings(
            String cycle, String status, Long departmentId, Long designationId,
            String startDate, String endDate, Integer minScore, Integer maxScore, String riskLevel, String search) {
        
        updatePendingToOverdueRealtime();
        
        List<InternalCustomerSatisfactionMapping> list = mappingRepository.findAll();
        
        if (cycle != null && !cycle.trim().isEmpty() && !"ALL".equalsIgnoreCase(cycle)) {
            list = list.stream().filter(m -> cycle.equalsIgnoreCase(m.getFeedbackCycle())).collect(Collectors.toList());
        }
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            list = list.stream().filter(m -> status.equalsIgnoreCase(m.getStatus())).collect(Collectors.toList());
        }
        if (departmentId != null) {
            list = list.stream().filter(m -> m.getEmployee() != null && departmentId.equals(m.getEmployee().getDepartmentId())).collect(Collectors.toList());
        }
        if (designationId != null) {
            list = list.stream().filter(m -> m.getEmployee() != null && designationId.equals(m.getEmployee().getDesignationId())).collect(Collectors.toList());
        }
        if (startDate != null && !startDate.trim().isEmpty()) {
            LocalDate start = LocalDate.parse(startDate);
            list = list.stream().filter(m -> m.getEligibilityDate() != null && !m.getEligibilityDate().isBefore(start)).collect(Collectors.toList());
        }
        if (endDate != null && !endDate.trim().isEmpty()) {
            LocalDate end = LocalDate.parse(endDate);
            list = list.stream().filter(m -> m.getEligibilityDate() != null && !m.getEligibilityDate().isAfter(end)).collect(Collectors.toList());
        }
        if (minScore != null) {
            list = list.stream().filter(m -> m.getAverageScore() != null && m.getAverageScore() >= minScore).collect(Collectors.toList());
        }
        if (maxScore != null) {
            list = list.stream().filter(m -> m.getAverageScore() != null && m.getAverageScore() <= maxScore).collect(Collectors.toList());
        }
        if (riskLevel != null && !riskLevel.trim().isEmpty() && !"ALL".equalsIgnoreCase(riskLevel)) {
            list = list.stream().filter(m -> {
                String computedRisk = computeRiskLevel(m);
                return riskLevel.equalsIgnoreCase(computedRisk);
            }).collect(Collectors.toList());
        }
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.trim().toLowerCase();
            list = list.stream().filter(m -> 
                (m.getEmployee() != null && m.getEmployee().getEmpCode() != null && m.getEmployee().getEmpCode().toLowerCase().contains(searchLower)) ||
                (m.getEmployee() != null && m.getEmployee().getEmployeeName() != null && m.getEmployee().getEmployeeName().toLowerCase().contains(searchLower))
            ).collect(Collectors.toList());
        }

        return list;
    }
}

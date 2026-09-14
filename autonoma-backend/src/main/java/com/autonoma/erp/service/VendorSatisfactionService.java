package com.autonoma.erp.service;

import com.autonoma.erp.model.*;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
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
public class VendorSatisfactionService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(VendorSatisfactionService.class);

    private final VendorSatisfactionMappingRepository mappingRepository;
    private final VendorSatisfactionResponseRepository responseRepository;
    private final VendorSatisfactionReminderLogRepository reminderLogRepository;
    private final AccountLedgerRepository supplierRepository;
    private final SatisfactionCriteriaRepository criteriaRepository;
    private final AppNotificationRepository appNotificationRepository;
    private final EmailSendingService emailSendingService;

    @org.springframework.beans.factory.annotation.Autowired
    public VendorSatisfactionService(
            VendorSatisfactionMappingRepository mappingRepository,
            VendorSatisfactionResponseRepository responseRepository,
            VendorSatisfactionReminderLogRepository reminderLogRepository,
            AccountLedgerRepository supplierRepository,
            SatisfactionCriteriaRepository criteriaRepository,
            AppNotificationRepository appNotificationRepository,
            EmailSendingService emailSendingService) {
        this.mappingRepository = mappingRepository;
        this.responseRepository = responseRepository;
        this.reminderLogRepository = reminderLogRepository;
        this.supplierRepository = supplierRepository;
        this.criteriaRepository = criteriaRepository;
        this.appNotificationRepository = appNotificationRepository;
        this.emailSendingService = emailSendingService;
    }

    // Daily at 9:00 AM: Vendor Reminders and Auto-Closure
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Kolkata")
    public void runDailyVendorReminders() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        log.info("Running daily vendor satisfaction reminder and closure engine for: {}", today);

        List<VendorSatisfactionMapping> mappings = mappingRepository.findAll();
        for (VendorSatisfactionMapping mapping : mappings) {
            // Check for Auto-Closure: feedbackEndDate is 7 days from start
            if ("Pending".equals(mapping.getStatus()) || "Overdue".equals(mapping.getStatus())) {
                if (mapping.getFeedbackEndDate() != null && today.isAfter(mapping.getFeedbackEndDate())) {
                    mapping.setStatus("Closed");
                    mapping.setIsClosed("Y");
                    mappingRepository.save(mapping);
                    log.info("Auto-closed Vendor Feedback Mapping ID: {} (7-day window expired)", mapping.getId());
                    continue;
                }

                // Check and send reminder
                if (mapping.getNextReminderDate() != null && !today.isBefore(mapping.getNextReminderDate())) {
                    sendReminderEmail(mapping, today);
                }
            }
        }
    }

    // Assign feedback to all active vendors for a cycle
    public int triggerAutoAssignForMonth(String cycle) {
        List<AccountLedger> vendors = supplierRepository.findAll().stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsSupplier()) && Boolean.TRUE.equals(v.getIsActive()))
                .collect(Collectors.toList());

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        int count = 0;

        for (AccountLedger vendor : vendors) {
            // Check if mapping already exists for this vendor and cycle
            List<VendorSatisfactionMapping> existing = mappingRepository.findByVendorIdAndStatusIn(vendor.getId(), 
                Arrays.asList("Pending", "Completed", "Overdue", "Closed"));
            
            boolean hasCycle = existing.stream().anyMatch(m -> cycle.equalsIgnoreCase(m.getFeedbackCycle()));
            if (hasCycle) {
                continue;
            }

            VendorSatisfactionMapping mapping = new VendorSatisfactionMapping();
            mapping.setVendor(vendor);
            mapping.setFeedbackCycle(cycle);
            mapping.setEligibilityDate(today);
            mapping.setFeedbackStartDate(today);
            mapping.setFeedbackEndDate(today.plusDays(7));
            mapping.setIsClosed("N");
            mapping.setStatus("Pending");
            mapping.setReminderCount(0);
            mapping.setNextReminderDate(today);

            mappingRepository.save(mapping);
            count++;

            // Create notification for admin/procurement
            createSystemNotification(mapping, "Vendor Feedback Assigned", 
                String.format("Vendor Feedback mapping assigned for vendor %s (%s) for cycle %s.", 
                    vendor.getLedgerName(), vendor.getLedgerCode(), cycle));
        }

        return count;
    }

    public void sendReminderEmail(VendorSatisfactionMapping mapping, LocalDate today) {
        AccountLedger vendor = mapping.getVendor();
        String toEmail = vendor.getMailId();
        String vendorName = vendor.getLedgerName();
        if (toEmail == null || toEmail.trim().isEmpty()) {
            log.warn("Skipping vendor reminder email for {} - no email configured.", vendor.getLedgerCode());
            mapping.setNextReminderDate(today.plusDays(1));
            mappingRepository.save(mapping);
            return;
        }

        String subject = "Action Required: Vendor Satisfaction Survey (" + mapping.getFeedbackCycle() + ")";
        String htmlBody = String.format(
            "<html><body>" +
            "<h2>Dear %s,</h2>" +
            "<p>Please help us improve our procurement and collaboration process by completing our Vendor Satisfaction Survey.</p>" +
            "<p>Note: The survey will close after 7 days from assignment.</p>" +
            "<p><a href='http://localhost:3001/master/sales/crm/satisfaction/feedback-entry?type=Vendor&mappingId=%d' style='background-color:#00796b;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;'>Submit Survey Feedback</a></p>" +
            "<p>Thank you,<br/>Procurement & Quality Team</p>" +
            "</body></html>",
            vendor.getLedgerName(), mapping.getId()
        );

        boolean success = emailSendingService.sendEmailWithAttachments(toEmail, null, null, subject, htmlBody, null);

        VendorSatisfactionReminderLog logEntry = new VendorSatisfactionReminderLog();
        logEntry.setVendor(vendor);
        logEntry.setMapping(mapping);
        logEntry.setReminderNumber(mapping.getReminderCount() + 1);
        logEntry.setReminderDate(today);
        logEntry.setEmailStatus(success ? "Sent" : "Failed");
        reminderLogRepository.save(logEntry);

        mapping.setReminderCount(mapping.getReminderCount() + 1);
        mapping.setLastReminderDate(today);
        mapping.setNextReminderDate(today.plusDays(1));
        mappingRepository.save(mapping);
    }

    @Transactional
    public VendorSatisfactionMapping submitFeedback(Long mappingId, String generalComments, String suggestions, List<Map<String, Object>> responses) {
        VendorSatisfactionMapping mapping = mappingRepository.findById(mappingId)
            .orElseThrow(() -> new RuntimeException("Vendor Mapping not found with ID: " + mappingId));

        if ("Completed".equals(mapping.getStatus())) {
            throw new RuntimeException("Feedback has already been submitted for this vendor cycle.");
        }
        if ("Closed".equals(mapping.getStatus()) || "Y".equalsIgnoreCase(mapping.getIsClosed())) {
            throw new RuntimeException("Feedback cycle is closed. No submissions allowed after 7 days.");
        }

        double totalScore = 0;
        int count = 0;

        for (Map<String, Object> resMap : responses) {
            String questionText = (String) resMap.get("questionText");
            String rating = (String) resMap.get("rating");
            String comment = (String) resMap.get("comments");

            int score = calculateScore(rating);

            // Dynamically query question ID if matching SatisfactionCriteria exists
            SatisfactionCriteria question = criteriaRepository.findAll().stream()
                .filter(c -> "Vendor".equalsIgnoreCase(c.getSatisfactionType()) && questionText.equalsIgnoreCase(c.getSatisfactionCriteria()))
                .findFirst()
                .orElseGet(() -> {
                    SatisfactionCriteria sc = new SatisfactionCriteria();
                    sc.setSatisfactionType("Vendor");
                    sc.setSatisfactionCriteria(questionText);
                    sc.setStatus(true);
                    sc.setCreatedBy("System");
                    sc.setCreatedDate(new Date());
                    return criteriaRepository.save(sc);
                });

            VendorSatisfactionResponse response = new VendorSatisfactionResponse();
            response.setVendor(mapping.getVendor());
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

        VendorSatisfactionMapping saved = mappingRepository.save(mapping);

        createSystemNotification(mapping, "Vendor Feedback Submitted", 
            String.format("Vendor satisfaction survey completed for vendor %s.", mapping.getVendor().getLedgerName()));

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

    private void createSystemNotification(VendorSatisfactionMapping mapping, String action, String msg) {
        try {
            AppNotification notification = new AppNotification();
            notification.setRecipientEmpId(1L); // Default Admin Employee ID
            notification.setTitle("Vendor Satisfaction: " + action);
            notification.setMessage(msg);
            notification.setLinkUrl("/master/sales/crm/satisfaction");
            appNotificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Failed to create system notification for vendor: {}", e.getMessage());
        }
    }

    public String computeRiskLevel(VendorSatisfactionMapping m) {
        if (!"Completed".equals(m.getStatus()) || m.getAverageScore() == null) {
            return "Low";
        }
        double avg = m.getAverageScore();
        if (avg < 50) {
            return "High";
        } else if (avg < 75) {
            return "Medium";
        } else {
            List<VendorSatisfactionResponse> responses = responseRepository.findByMappingId(m.getId());
            long poorOrModerateCount = responses.stream()
                .filter(r -> "Poor".equalsIgnoreCase(r.getRating()) || "Moderate".equalsIgnoreCase(r.getRating()))
                .count();
            if (poorOrModerateCount >= 2) {
                return "Medium";
            }
        }
        return "Low";
    }
}

package com.autonoma.erp.service;

import com.autonoma.erp.model.*;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.autonoma.erp.modules.hr.holiday.entity.HrHolidayMaster;
import com.autonoma.erp.modules.hr.holiday.repository.HrHolidayMasterRepository;
import com.autonoma.erp.repository.CustomerSatisfactionMappingRepository;
import com.autonoma.erp.repository.CustomerSatisfactionResponseRepository;
import com.autonoma.erp.repository.SatisfactionCriteriaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CustomerSatisfactionFeedbackService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CustomerSatisfactionFeedbackService.class);

    @org.springframework.beans.factory.annotation.Autowired
    private CustomerSatisfactionMappingRepository mappingRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private CustomerSatisfactionResponseRepository responseRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private AccountLedgerRepository AccountLedgerRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private SatisfactionCriteriaRepository criteriaRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private HrHolidayMasterRepository hrHolidayMasterRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com.autonoma.erp.modules.master.contact.repository.ContactMasterRepository contactMasterRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com.autonoma.erp.service.admin.EmailSendingService emailSendingService;

    // Check if the date is a working day (skips Sundays and recognized holidays)
    public boolean isWorkingDay(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        if (day == DayOfWeek.SUNDAY) {
            return false;
        }

        // Check single holiday date
        boolean isHoliday = hrHolidayMasterRepository.findByHolidayDateAndIsActiveTrue(date).stream()
                .anyMatch(h -> !h.getIsOptional());
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

    // Daily execution at 1:00 AM
    @Scheduled(cron = "0 0 1 * * *", zone = "Asia/Kolkata")
    public void runDailyAutoAssignment() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        log.info("Checking daily customer feedback triggers for date: {}", today);

        if (!isWorkingDay(today)) {
            log.info("Today is a Sunday or Holiday. Skipping daily triggers for today.");
            return;
        }

        String cycle = today.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        triggerAutoAssignForMonth(cycle);
    }

    @Transactional
    public int triggerAutoAssignForMonth(String cycle) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        
        // Fetch all active customers
        List<AccountLedger> activeCustomers = AccountLedgerRepository.findAll().stream()
                .filter(c -> "Active".equalsIgnoreCase((c.getIsActive() != null && c.getIsActive() ? "Active" : "Inactive")) && Boolean.TRUE.equals(c.getIsActive()))
                .collect(Collectors.toList());

        // Sort by initial account creation/registration date (FIFO)
        activeCustomers.sort((c1, c2) -> {
            java.time.LocalDateTime d1 = c1.getCreatedDate();
            java.time.LocalDateTime d2 = c2.getCreatedDate();
            if (d1 == null && d2 == null) return c1.getId().compareTo(c2.getId());
            if (d1 == null) return -1;
            if (d2 == null) return 1;
            int comp = d1.compareTo(d2);
            if (comp != 0) return comp;
            return c1.getId().compareTo(c2.getId());
        });

        // Filter those who do not have a mapping for this cycle month yet
        List<AccountLedger> eligible = new ArrayList<>();
        for (AccountLedger c : activeCustomers) {
            Optional<CustomerSatisfactionMapping> existing = mappingRepository.findByCustomerIdAndFeedbackCycle(c.getId(), cycle);
            if (!existing.isPresent()) {
                eligible.add(c);
            }
        }

        // Apply FIFO Tiered Capping Limit (The 500-User Rule)
        List<AccountLedger> toAssign = eligible.stream().limit(500).collect(Collectors.toList());

        int count = 0;
        for (AccountLedger customer : toAssign) {
            CustomerSatisfactionMapping mapping = new CustomerSatisfactionMapping();
            mapping.setCustomer(customer);
            mapping.setFeedbackCycle(cycle);
            mapping.setEligibilityDate(today);
            mapping.setSendDate(new Date());
            mapping.setStatus("Pending");
            mapping.setDismissedCount(0);
            mapping.setCreatedBy("System");
            mapping.setCreatedDate(new Date());
            
            CustomerSatisfactionMapping saved = mappingRepository.save(mapping);
            try {
                sendFeedbackLink(saved);
            } catch (Exception e) {
                log.error("Failed to send customer feedback link for mapping {}: {}", saved.getId(), e.getMessage());
            }
            count++;
        }

        log.info("Auto-assigned customer feedback surveys for cycle {}. Total count: {}", cycle, count);
        return count;
    }

    private String getCustomerEmail(AccountLedger customer) {
        return contactMasterRepository.findAll().stream()
                .filter(c -> customer.getLedgerName() != null && customer.getLedgerName().equalsIgnoreCase(c.getGroupName()) && c.getEmailId() != null)
                .map(c -> c.getEmailId())
                .findFirst()
                .orElse("thesharmitha17@gmail.com");
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.autonoma.erp.modules.platform.notification.service.EmailContentService emailContentService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine emailTemplateEngine;

    public void sendFeedbackLink(CustomerSatisfactionMapping mapping) {
        AccountLedger customer = mapping.getCustomer();
        String toEmail = getCustomerEmail(customer);
        String subject = "Customer Satisfaction Survey Request";
        String feedbackLink = "http://localhost:3001/hra/satisfaction/feedback-form?mappingId=" + mapping.getId();
        
        Map<String, Object> placeholders = new HashMap<>();
        placeholders.put("customerName", customer != null ? customer.getCustomerName() : "Valued Customer");
        placeholders.put("cycleName", mapping.getFeedbackCycle() != null ? mapping.getFeedbackCycle() : "Current Cycle");
        placeholders.put("surveyLink", feedbackLink);
        placeholders.put("validityDays", "7");
        placeholders.put("companyName", "NUTECH WIND PARTS PVT LTD");
        placeholders.put("supportEmail", "qms@nutechwindparts.com");

        String htmlBody = "";
        if (emailContentService != null && emailTemplateEngine != null) {
            try {
                com.autonoma.erp.modules.platform.notification.entity.EmailContent template = emailContentService.getTemplateOrApplicationDefault("CUSTOMER SATISFACTION");
                com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine.render(
                        subject,
                        template.getBodyContent(),
                        template.getYoursWindfully(),
                        placeholders
                );
                subject = rendered.getSubject();
                htmlBody = rendered.getFullMasterHtml();
            } catch (Exception ex) {
                log.warn("Failed to render CSAT email via EmailTemplateEngine: {}", ex.getMessage());
            }
        }

        if (htmlBody.isBlank()) {
            htmlBody = String.format("<p>Dear %s,</p><p>Please complete our CSAT survey: <a href='%s'>Take Survey</a></p>", customer != null ? customer.getCustomerName() : "Customer", feedbackLink);
        }

        emailSendingService.sendEmailWithAttachments(toEmail, null, null, subject, htmlBody, null);
    }

    @Transactional
    public CustomerSatisfactionMapping submitFeedback(Long mappingId, String generalComments, List<Map<String, Object>> responses) {
        CustomerSatisfactionMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Feedback mapping not found: " + mappingId));

        if ("Completed".equals(mapping.getStatus())) {
            throw new RuntimeException("Feedback has already been submitted for this cycle.");
        }

        int totalScore = 0;
        int count = 0;

        for (Map<String, Object> rMap : responses) {
            Long questionId = Long.valueOf(rMap.get("questionId").toString());
            String rating = (String) rMap.get("rating");
            String comments = (String) rMap.get("comments");

            SatisfactionCriteria question = criteriaRepository.findById(questionId)
                    .orElseThrow(() -> new RuntimeException("Satisfaction question not found: " + questionId));

            int score = calculateScore(rating);

            // Validation Rule: Moderate and Poor Comments are Mandatory
            if (score <= 25) {
                if (comments == null || comments.trim().isEmpty()) {
                    throw new RuntimeException("Comments are mandatory for Moderate and Poor ratings.");
                }
            }

            CustomerSatisfactionResponse resp = new CustomerSatisfactionResponse();
            resp.setMapping(mapping);
            resp.setQuestion(question);
            resp.setRating(rating);
            resp.setScore(score);
            resp.setComments(comments);
            resp.setCreatedBy("Customer");
            resp.setCreatedDate(new Date());

            responseRepository.save(resp);

            totalScore += score;
            count++;
        }

        mapping.setStatus("Completed");
        mapping.setSubmitDate(new Date());
        mapping.setTotalScore(totalScore);
        mapping.setAverageScore(count > 0 ? (double) totalScore / count : 0.0);
        mapping.setGeneralComments(generalComments);
        mapping.setUpdatedBy("Customer");
        mapping.setUpdatedDate(new Date());

        return mappingRepository.save(mapping);
    }

    private int calculateScore(String rating) {
        if ("Excellent".equalsIgnoreCase(rating)) return 100;
        if ("Very Good".equalsIgnoreCase(rating)) return 75;
        if ("Good".equalsIgnoreCase(rating)) return 50;
        if ("Moderate".equalsIgnoreCase(rating)) return 25;
        return 0; // Poor
    }

    public List<CustomerSatisfactionMapping> getFilteredMappings(
            String fromDate, String toDate, Boolean considerDate, String status, String search) {
        
        List<CustomerSatisfactionMapping> list = mappingRepository.findAll();

        if (status != null && !"ALL".equalsIgnoreCase(status)) {
            list = list.stream().filter(m -> status.equalsIgnoreCase(m.getStatus())).collect(Collectors.toList());
        }

        if (considerDate != null && considerDate && fromDate != null && toDate != null) {
            LocalDate start = LocalDate.parse(fromDate);
            LocalDate end = LocalDate.parse(toDate);
            list = list.stream().filter(m -> {
                LocalDate date = m.getEligibilityDate();
                return date != null && !date.isBefore(start) && !date.isAfter(end);
            }).collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase();
            list = list.stream().filter(m -> 
                (m.getCustomer() != null && m.getCustomer().getCustomerName().toLowerCase().contains(q)) ||
                (m.getCustomer() != null && m.getCustomer().getCustomerCode().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        return list;
    }

    public Map<String, Object> getDashboardSummaryFiltered(List<CustomerSatisfactionMapping> filtered) {
        long completed = filtered.stream().filter(m -> "Completed".equals(m.getStatus())).count();
        long pending = filtered.stream().filter(m -> "Pending".equals(m.getStatus())).count();
        long overdue = filtered.stream().filter(m -> "Overdue".equals(m.getStatus())).count();
        long closed = filtered.stream().filter(m -> "Closed".equals(m.getStatus())).count();
        long total = filtered.size();

        double avgScore = filtered.stream()
                .filter(m -> m.getAverageScore() != null)
                .mapToDouble(CustomerSatisfactionMapping::getAverageScore)
                .average()
                .orElse(0.0);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalFeedback", total);
        summary.put("completed", completed);
        summary.put("pending", pending);
        summary.put("overdue", overdue);
        summary.put("closed", closed);
        summary.put("averageScore", avgScore);
        summary.put("satisfactionIndex", avgScore); // Out of 100

        return summary;
    }

    // Daily at 9:00 AM: Customer Reminders and Auto-Closure
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Kolkata")
    public void runDailyCustomerReminders() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        log.info("Running daily customer satisfaction reminder and closure engine for: {}", today);

        List<CustomerSatisfactionMapping> mappings = mappingRepository.findAll();
        for (CustomerSatisfactionMapping mapping : mappings) {
            if ("Pending".equals(mapping.getStatus()) || "Overdue".equals(mapping.getStatus())) {
                // Check for Auto-Closure: feedbackEndDate is 7 days from start
                if (mapping.getFeedbackEndDate() != null && today.isAfter(mapping.getFeedbackEndDate())) {
                    mapping.setStatus("Closed");
                    mapping.setIsClosed("Y");
                    mappingRepository.save(mapping);
                    log.info("Auto-closed Customer Feedback Mapping ID: {} (7-day window expired)", mapping.getId());
                    continue;
                }

                // Check and send reminder
                if (mapping.getNextReminderDate() == null) {
                    mapping.setNextReminderDate(mapping.getEligibilityDate() != null ? mapping.getEligibilityDate() : today);
                }
                if (!today.isBefore(mapping.getNextReminderDate())) {
                    sendReminderEmail(mapping, today);
                }
            }
        }
    }

    public void sendReminderEmail(CustomerSatisfactionMapping mapping, LocalDate today) {
        AccountLedger customer = mapping.getCustomer();
        String toEmail = getCustomerEmail(customer);
        if (toEmail == null || toEmail.trim().isEmpty()) {
            log.warn("Skipping customer reminder email for {} - no email configured.", customer.getCustomerCode());
            mapping.setNextReminderDate(today.plusDays(1));
            mappingRepository.save(mapping);
            return;
        }

        String subject = "Action Required: Customer Satisfaction Survey (" + mapping.getFeedbackCycle() + ")";
        String feedbackLink = "http://localhost:3001/hra/satisfaction/feedback-form?mappingId=" + mapping.getId();

        Map<String, Object> placeholders = new HashMap<>();
        placeholders.put("customerName", customer.getCustomerName() != null ? customer.getCustomerName() : "Valued Customer");
        placeholders.put("cycleName", mapping.getFeedbackCycle() != null ? mapping.getFeedbackCycle() : "Current Cycle");
        placeholders.put("surveyLink", feedbackLink);
        placeholders.put("validityDays", "7");
        placeholders.put("companyName", "NUTECH WIND PARTS PVT LTD");
        placeholders.put("supportEmail", "qms@nutechwindparts.com");

        String htmlBody = "";
        if (emailContentService != null && emailTemplateEngine != null) {
            try {
                com.autonoma.erp.modules.platform.notification.entity.EmailContent template = emailContentService.getTemplateOrApplicationDefault("CUSTOMER SATISFACTION");
                com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine.render(
                        subject,
                        template.getBodyContent(),
                        template.getYoursWindfully(),
                        placeholders
                );
                subject = rendered.getSubject();
                htmlBody = rendered.getFullMasterHtml();
            } catch (Exception ex) {
                log.warn("Failed to render CSAT reminder email via EmailTemplateEngine: {}", ex.getMessage());
            }
        }

        if (htmlBody.isBlank()) {
            htmlBody = String.format("<p>Dear %s,</p><p>Reminder: Please complete our CSAT survey: <a href='%s'>Take Survey</a></p>", customer.getCustomerName(), feedbackLink);
        }

        emailSendingService.sendEmailWithAttachments(toEmail, null, null, subject, htmlBody, null);

        mapping.setReminderCount(mapping.getReminderCount() + 1);
        mapping.setLastReminderDate(today);
        mapping.setNextReminderDate(today.plusDays(1));
        mappingRepository.save(mapping);
    }
}

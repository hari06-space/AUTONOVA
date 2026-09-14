package com.autonoma.erp.service.admin;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeOfficeMailCredentials;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile;
import com.autonoma.erp.modules.hr.employee.service.EmployeeMasterService;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;


@Service
@Slf4j
public class EmailSendingService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EmailSendingService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired(required = false)
    private MailProperties mailProperties;

    @Value("${mail.from.address:no-reply@autonoma.com}")
    private String mailFromAddress;

    @Value("${email.only-ats-enabled:false}")
    private boolean onlyAtsEnabled;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private EmployeeMasterRepository employeeRepo;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository employeeJobProfileRepo;

    @Autowired
    private CompanyCredentialService companyCredentialService;

    @Autowired
    private EmployeeMasterService employeeMasterService;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.notification.service.EmailContentService emailContentService;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine emailTemplateEngine;

    private JavaMailSender getDynamicMailSender(Map<String, String> senderConfig) {
        return getDynamicMailSender(senderConfig, false);
    }

    private JavaMailSender getDynamicMailSender(Map<String, String> senderConfig, boolean useCompanyMail) {
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        String smtpUsername = null;
        String smtpPassword = null;

        // 1. Try logged-in employee first
        if (!useCompanyMail && currentUserId != null) {
            Long empId = com.autonoma.erp.util.SecurityUtils.getCurrentUserEmpId();
            if (empId != null) {
                EmployeeOfficeMailCredentials credentials = employeeMasterService.getOfficeMailCredentials(empId);
                if (credentials.getOfficeEmail() != null && !credentials.getOfficeEmail().trim().isEmpty()) {
                    smtpUsername = credentials.getOfficeEmail();
                    smtpPassword = credentials.getOfficialPassword();
                }
            }
        }

        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);

        // 2. Fallback to company SMTP Settings
        if (smtpUsername == null || smtpPassword == null) {
            if (company != null && company.getSmtpUsername() != null && !company.getSmtpUsername().trim().isEmpty() &&
                company.getSmtpPassword() != null && !company.getSmtpPassword().trim().isEmpty()) {
                smtpUsername = company.getSmtpUsername().trim();
                smtpPassword = company.getSmtpPassword().trim();
            }
        }

        // If we resolved username and password, and we have host configured, configure dynamically
        if (company != null && company.getSmtpHost() != null && !company.getSmtpHost().isEmpty() &&
            smtpUsername != null && smtpPassword != null) {
            
            org.springframework.mail.javamail.JavaMailSenderImpl dynamicSender = new org.springframework.mail.javamail.JavaMailSenderImpl();
            dynamicSender.setHost(company.getSmtpHost());
            if (company.getSmtpPort() != null) {
                dynamicSender.setPort(company.getSmtpPort());
            }
            dynamicSender.setUsername(smtpUsername);
            
            // Normalize password if it's Gmail and contains spaces
            if (smtpPassword != null) {
                smtpPassword = smtpPassword.trim();
                if (company.getSmtpHost().contains("gmail") || smtpUsername.contains("gmail")) {
                    smtpPassword = smtpPassword.replace(" ", "");
                }
            }
            dynamicSender.setPassword(smtpPassword);

            Properties props = dynamicSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
            if (Boolean.TRUE.equals(company.getSmtpSslEnabled())) {
                props.put("mail.smtp.ssl.enable", "true");
            }
            props.put("mail.smtp.connectiontimeout", "15000");
            props.put("mail.smtp.timeout", "15000");
            props.put("mail.smtp.writetimeout", "15000");
            props.put("mail.debug", "true");
            
            String from = smtpUsername.contains("@") ? smtpUsername : mailFromAddress;
            senderConfig.put("from", from);
            return dynamicSender;
        }

        // Fallback to default spring configuration if available and host is explicitly configured
        if (mailSender != null && mailProperties != null && mailProperties.getHost() != null && !mailProperties.getHost().isEmpty() &&
            !"localhost".equalsIgnoreCase(mailProperties.getHost()) &&
            mailProperties.getUsername() != null && !mailProperties.getUsername().trim().isEmpty()) {
            String from = (mailProperties.getUsername() != null && mailProperties.getUsername().contains("@"))
                    ? mailProperties.getUsername().trim()
                    : mailFromAddress;
            senderConfig.put("from", from);
            return mailSender;
        }

        return null;
    }

    private JavaMailSender getDynamicMailSenderForEmail(String trainerEmail, Map<String, String> senderConfig) {
        String smtpUsername = null;
        String smtpPassword = null;

        // 1. Try finding trainer by email to get their password
        if (trainerEmail != null && !trainerEmail.trim().isEmpty() && !"no-reply@autonoma.com".equalsIgnoreCase(trainerEmail.trim())) {
            Optional<EmployeeJobProfile> jpOpt = employeeJobProfileRepo.findByOfficeEmailIgnoreCase(trainerEmail.trim());
            if (jpOpt.isPresent()) {
                EmployeeJobProfile jp = jpOpt.get();
                if (jp.getOfficeEmail() != null && !jp.getOfficeEmail().trim().isEmpty() &&
                    jp.getOfficialPassword() != null && !jp.getOfficialPassword().trim().isEmpty()) {
                    smtpUsername = jp.getOfficeEmail().trim();
                    smtpPassword = jp.getOfficialPassword().trim();
                }
            }
        }

        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);

        // 2. Fallback to company SMTP Settings
        if (smtpUsername == null || smtpPassword == null) {
            if (company != null && company.getSmtpUsername() != null && !company.getSmtpUsername().trim().isEmpty() &&
                company.getSmtpPassword() != null && !company.getSmtpPassword().trim().isEmpty()) {
                smtpUsername = company.getSmtpUsername().trim();
                smtpPassword = company.getSmtpPassword().trim();
            }
        }

        // If we resolved username and password, and we have host configured, configure dynamically
        if (company != null && company.getSmtpHost() != null && !company.getSmtpHost().isEmpty() &&
            smtpUsername != null && smtpPassword != null) {
            
            org.springframework.mail.javamail.JavaMailSenderImpl dynamicSender = new org.springframework.mail.javamail.JavaMailSenderImpl();
            dynamicSender.setHost(company.getSmtpHost());
            if (company.getSmtpPort() != null) {
                dynamicSender.setPort(company.getSmtpPort());
            }
            dynamicSender.setUsername(smtpUsername);
            
            // Normalize password if it's Gmail and contains spaces
            if (smtpPassword != null) {
                smtpPassword = smtpPassword.trim();
                if (company.getSmtpHost().contains("gmail") || smtpUsername.contains("gmail")) {
                    smtpPassword = smtpPassword.replace(" ", "");
                }
            }
            dynamicSender.setPassword(smtpPassword);

            Properties props = dynamicSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            if (Boolean.TRUE.equals(company.getSmtpSslEnabled())) {
                props.put("mail.smtp.ssl.enable", "true");
            }
            props.put("mail.smtp.connectiontimeout", "5000");
            props.put("mail.smtp.timeout", "5000");
            props.put("mail.smtp.writetimeout", "5000");
            props.put("mail.debug", "true");
            
            String from = smtpUsername.contains("@") ? smtpUsername : mailFromAddress;
            senderConfig.put("from", from);
            return dynamicSender;
        }

        // Fallback to default spring configuration if available
        if (mailSender != null && mailProperties != null && mailProperties.getHost() != null && !mailProperties.getHost().isEmpty()) {
            String from = (mailProperties.getUsername() != null && mailProperties.getUsername().contains("@"))
                    ? mailProperties.getUsername().trim()
                    : mailFromAddress;
            senderConfig.put("from", from);
            return mailSender;
        }

        return null;
    }

    private boolean isAtsCall() {
        for (StackTraceElement element : Thread.currentThread().getStackTrace()) {
            String className = element.getClassName();
            if (className.contains(".modules.hra.recruitment.") || 
                className.contains(".modules.ats.") || 
                className.contains(".modules.qms.audit.") ||
                className.contains(".modules.platform.integration.") ||
                className.contains("VisitorGatePass") ||
                className.contains("OcrProxyController")) {
                return true;
            }
        }
        return false;
    }

    public boolean sendEmailWithAttachments(String to, String cc, String bcc, String subject, String htmlBody, 
                                             List<Map<String, Object>> attachments) {
        return sendEmailWithAttachments(to, cc, bcc, subject, htmlBody, attachments, false, null);
    }

    public boolean sendEmailWithAttachments(String to, String cc, String bcc, String subject, String htmlBody, 
                                             List<Map<String, Object>> attachments, boolean useCompanyMail) {
        return sendEmailWithAttachments(to, cc, bcc, subject, htmlBody, attachments, useCompanyMail, null);
    }

    public boolean sendEmailWithAttachments(String to, String cc, String bcc, String subject, String htmlBody, 
                                             List<Map<String, Object>> attachments, boolean useCompanyMail, String sourceModule) {
        if (onlyAtsEnabled) {
            boolean isAllowed = "RFQ".equalsIgnoreCase(sourceModule) || "ATS".equalsIgnoreCase(sourceModule);
            if (!isAllowed) {
                isAllowed = isAtsCall();
            }
            if (!isAllowed) {
                log.warn("[EMAIL_BLOCKED] Non-ATS and Non-RFQ email blocked by configuration. Source: {}, Subject: {}", sourceModule, subject);
                return false;
            }
        }
        log.info("Sending Email to: {}, CC: {}, BCC: {}, Subject: {}, SourceModule: {}", to, cc, bcc, subject, sourceModule);
        
        Map<String, String> senderConfig = new HashMap<>();
        JavaMailSender activeSender = getDynamicMailSender(senderConfig, useCompanyMail);
        
        if (activeSender == null) {
            log.warn("[SMTP_NOT_CONFIGURED] Dynamic or static JavaMailSender not available. Saving email to disk as mock backup.");
            saveEmailToDisk(to, cc, bcc, subject, htmlBody, attachments);
            return false;
        }
        try {
            MimeMessage message = activeSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            
            String from = senderConfig.getOrDefault("from", mailFromAddress);
            
            CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
            String displayName = "NUTECH HR TEAM";
            if (!isAtsCall() && !"ATS".equalsIgnoreCase(sourceModule)) {
                displayName = (company != null && company.getCompanyName() != null && !company.getCompanyName().trim().isEmpty())
                        ? company.getCompanyName().trim()
                        : "NUTECH";
            }

            
            try {
                helper.setFrom(new InternetAddress(from, displayName));
            } catch (Exception e) {
                helper.setFrom(from);
            }
            
            // Set Reply-To to the active sender address (or fallback to mailFromAddress)
            String replyTo = (from != null && from.contains("@")) ? from : mailFromAddress;
            helper.setReplyTo(replyTo);
            
            // Standard transactional email headers to improve deliverability and loop prevention
            message.setHeader("Auto-Submitted", "auto-generated");
            message.setHeader("X-Mailer", "JavaMailSender");
            
            helper.setTo(parseEmails(to));
            if (cc != null && !cc.trim().isEmpty()) {
                helper.setCc(parseEmails(cc));
            }
            if (bcc != null && !bcc.trim().isEmpty()) {
                helper.setBcc(parseEmails(bcc));
            }
            
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            
            if (attachments != null) {
                for (Map<String, Object> attachment : attachments) {
                    String name = (String) attachment.get("fileName");
                    byte[] bytes = (byte[]) attachment.get("content");
                    if (name != null && bytes != null) {
                        helper.addAttachment(name, new ByteArrayResource(bytes));
                    }
                }
            }
            
            activeSender.send(message);
            log.info("[SENT_SUCCESS] Email sent successfully to {}", to);
            return true;
        } catch (Exception e) {
            log.error("[SMTP_FAILED] Failed to send email via SMTP to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException(translateMailException(e));
        }
    }

    /**
     * Sends a test email directly via SMTP, propagating any exception without disk fallback.
     */
    public void sendTestEmail(String to, String subject, String htmlBody) throws Exception {
        Map<String, String> senderConfig = new HashMap<>();
        JavaMailSender activeSender = getDynamicMailSender(senderConfig);
        
        if (activeSender == null) {
            throw new IllegalStateException("SMTP configuration is missing or dynamic JavaMailSender could not be resolved.");
        }
        
        MimeMessage message = activeSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
        
        String from = senderConfig.getOrDefault("from", mailFromAddress);
        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        String displayName = (company != null && company.getCompanyName() != null && !company.getCompanyName().trim().isEmpty())
                ? company.getCompanyName().trim()
                : "NUTECH HR";
        
        try {
            helper.setFrom(new InternetAddress(from, displayName));
        } catch (Exception e) {
            helper.setFrom(from);
        }
        
        helper.setReplyTo((from != null && from.contains("@")) ? from : mailFromAddress);
        message.setHeader("Auto-Submitted", "auto-generated");
        message.setHeader("X-Mailer", "JavaMailSender");
        
        helper.setTo(parseEmails(to));
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        
        activeSender.send(message);
        log.info("[SENT_SUCCESS] Test Email sent successfully via SMTP to {}", to);
    }

    /**
     * Sends a test email directly using custom SMTP parameters from the request payload.
     */
    public void sendTestEmail(String to, String subject, String htmlBody, 
                              String host, Integer port, String username, String password, Boolean sslEnabled) throws Exception {
        org.springframework.mail.javamail.JavaMailSenderImpl dynamicSender = new org.springframework.mail.javamail.JavaMailSenderImpl();
        dynamicSender.setHost(host);
        if (port != null) {
            dynamicSender.setPort(port);
        }
        dynamicSender.setUsername(username);
        
        String normPassword = password;
        if (normPassword != null) {
            normPassword = normPassword.trim();
            if (host.toLowerCase().contains("gmail") || username.toLowerCase().contains("gmail")) {
                normPassword = normPassword.replace(" ", "");
            }
        }
        dynamicSender.setPassword(normPassword);

        Properties props = dynamicSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        if (Boolean.TRUE.equals(sslEnabled)) {
            props.put("mail.smtp.ssl.enable", "true");
        }
        props.put("mail.smtp.connectiontimeout", "15000");
        props.put("mail.smtp.timeout", "15000");
        props.put("mail.smtp.writetimeout", "15000");
        props.put("mail.debug", "true");

        MimeMessage message = dynamicSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

        String from = username != null && username.contains("@") ? username.trim() : mailFromAddress;
        String displayName = "SMTP Test";
        try {
            helper.setFrom(new InternetAddress(from, displayName));
        } catch (Exception e) {
            helper.setFrom(from);
        }

        helper.setReplyTo((from != null && from.contains("@")) ? from : mailFromAddress);
        message.setHeader("Auto-Submitted", "auto-generated");
        message.setHeader("X-Mailer", "JavaMailSender");

        helper.setTo(parseEmails(to));
        helper.setSubject(subject);
        helper.setText(htmlBody, true);

        dynamicSender.send(message);
        log.info("[SENT_SUCCESS] Test Email sent successfully via custom SMTP to {}", to);
    }

    public String sendThreadedEmail(String to, String cc, String bcc, String subject, String htmlBody, 
                                    List<Map<String, Object>> attachments, String inReplyTo) {
        if (onlyAtsEnabled && !isAtsCall()) {
            log.info("[EMAIL_BLOCKED] Non-ATS threaded email blocked. Subject: {}", subject);
            return UUID.randomUUID().toString() + "@autonoma.com";
        }
        log.info("Sending Threaded Email to: {}, Subject: {}, In-Reply-To: {}", to, subject, inReplyTo);
        
        Map<String, String> senderConfig = new HashMap<>();
        JavaMailSender activeSender = getDynamicMailSender(senderConfig);
        
        String generatedMessageId = UUID.randomUUID().toString() + "@autonoma.com";

        if (activeSender == null) {
            log.warn("[LOCAL/MOCK] JavaMailSender not available for threaded email. Saving to disk.");
            saveEmailToDisk(to, cc, bcc, subject, htmlBody, attachments);
            return "<" + generatedMessageId + ">";
        }
        try {
            MimeMessage message = activeSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            
            String from = senderConfig.getOrDefault("from", mailFromAddress);
            CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
            String displayName = (company != null && company.getCompanyName() != null && !company.getCompanyName().trim().isEmpty())
                    ? company.getCompanyName().trim() : "NUTECH HR";
            
            try {
                helper.setFrom(new InternetAddress(from, displayName));
            } catch (Exception e) {
                helper.setFrom(from);
            }
            
            helper.setReplyTo((from != null && from.contains("@")) ? from : mailFromAddress);
            message.setHeader("Auto-Submitted", "auto-generated");
            message.setHeader("X-Mailer", "JavaMailSender");
            message.setHeader("Message-ID", "<" + generatedMessageId + ">");
            
            if (inReplyTo != null && !inReplyTo.trim().isEmpty()) {
                message.setHeader("In-Reply-To", inReplyTo);
                message.setHeader("References", inReplyTo);
            }
            
            helper.setTo(parseEmails(to));
            if (cc != null && !cc.trim().isEmpty()) helper.setCc(parseEmails(cc));
            if (bcc != null && !bcc.trim().isEmpty()) helper.setBcc(parseEmails(bcc));
            
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            
            if (attachments != null) {
                for (Map<String, Object> attachment : attachments) {
                    String name = (String) attachment.get("fileName");
                    byte[] bytes = (byte[]) attachment.get("content");
                    if (name != null && bytes != null) {
                        helper.addAttachment(name, new ByteArrayResource(bytes));
                    }
                }
            }
            
            activeSender.send(message);
            log.info("[SENT_SUCCESS] Threaded Email sent successfully to {}", to);
            return "<" + generatedMessageId + ">";
        } catch (Exception e) {
            log.warn("[SMTP_FAILED] Failed to send threaded email: {}. Saving to disk as fallback.", e.getMessage());
            saveEmailToDisk(to, cc, bcc, subject, htmlBody, attachments);
            return "<" + generatedMessageId + ">";
        }
    }

    
    private String[] parseEmails(String emailCsv) {
        if (emailCsv == null) return new String[0];
        return Arrays.stream(emailCsv.split(","))
                .map(String::trim)
                .filter(email -> !email.isEmpty())
                .toArray(String[]::new);
    }
    
    public boolean sendInductionFeedbackEmail(String fromEmail, String fromName, String to, String subject, String htmlBody) {
        if (onlyAtsEnabled) {
            log.info("[EMAIL_BLOCKED] Induction email blocked. Subject: {}", subject);
            return true;
        }
        log.info("Sending Induction Feedback Email from: {} <{}>, to: {}, Subject: {}", fromName, fromEmail, to, subject);

        Map<String, String> senderConfig = new HashMap<>();
        JavaMailSender activeSender = null;
        try {
            activeSender = getDynamicMailSenderForEmail(fromEmail, senderConfig);
        } catch (Exception e) {
            log.error("[SMTP_FAILED] Failed to resolve dynamic mail sender: {}", e.getMessage(), e);
        }
        
        if (activeSender == null) {
            log.warn("[LOCAL/MOCK] No SMTP sender available for induction feedback email. Saving to disk.");
            saveEmailToDisk(fromEmail, to, null, null, subject, htmlBody, null);
            return true;
        }

        try {
            MimeMessage message = activeSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            // Envelope from address must match authenticated/system SMTP account to satisfy sender restrictions
            String envelopeFrom = senderConfig.getOrDefault("from", mailFromAddress);
            
            // Use the trainer's company email as the actual From header if present (otherwise default to system/SMTP email)
            String actualFrom = (fromEmail != null && !fromEmail.trim().isEmpty() && !"no-reply@autonoma.com".equalsIgnoreCase(fromEmail.trim()))
                    ? fromEmail.trim()
                    : envelopeFrom;

            // Set From header with friendly trainer name and actual From email
            if (fromName != null && !fromName.trim().isEmpty()) {
                helper.setFrom(new InternetAddress(actualFrom, fromName));
            } else {
                helper.setFrom(actualFrom);
            }

            // Set Reply-To to the actual trainer email address so trainee replies go directly to the trainer
            if (fromEmail != null && !fromEmail.trim().isEmpty()) {
                helper.setReplyTo(fromEmail.trim());
            }

            // Deliverability and loop prevention headers
            message.setHeader("Auto-Submitted", "auto-generated");
            message.setHeader("X-Mailer", "JavaMailSender");

            helper.setTo(parseEmails(to));
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            activeSender.send(message);
            log.info("[SENT_SUCCESS] Induction feedback email sent successfully to {}", to);
            return true;
        } catch (Exception e) {
            log.error("[SMTP_FAILED] Failed to send induction feedback email to {}: {}", to, e.getMessage(), e);
            saveEmailToDisk(fromEmail, to, null, null, subject, htmlBody, null);
            return true;
        }
    }

    private void saveEmailToDisk(String to, String cc, String bcc, String subject, String htmlBody, 
                                 List<Map<String, Object>> attachments) {
        saveEmailToDisk(null, to, cc, bcc, subject, htmlBody, attachments);
    }
    
    private void saveEmailToDisk(String from, String to, String cc, String bcc, String subject, String htmlBody, 
                                 List<Map<String, Object>> attachments) {
        try {
            File dir = new File("uploads/emails");
            if (!dir.exists()) {
                dir.mkdirs();
            }
            
            String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            String safeSubject = subject.replaceAll("[^a-zA-Z0-9-_]", "_");
            File file = new File(dir, timestamp + "_" + safeSubject + ".html");
            
            try (FileOutputStream fos = new FileOutputStream(file)) {
                StringBuilder sb = new StringBuilder();
                sb.append("<!--\n");
                if (from != null) {
                    sb.append("FROM: ").append(from).append("\n");
                }
                sb.append("TO: ").append(to).append("\n");
                sb.append("CC: ").append(cc).append("\n");
                sb.append("BCC: ").append(bcc).append("\n");
                sb.append("SUBJECT: ").append(subject).append("\n");
                if (attachments != null && !attachments.isEmpty()) {
                    sb.append("ATTACHMENTS: \n");
                    for (Map<String, Object> a : attachments) {
                        sb.append(" - ").append(a.get("fileName")).append(" (").append(((byte[]) a.get("content")).length).append(" bytes)\n");
                    }
                }
                sb.append("-->\n\n");
                sb.append(htmlBody);
                
                fos.write(sb.toString().getBytes(StandardCharsets.UTF_8));
            }
            log.info("Mock Email saved to disk: {}", file.getAbsolutePath());
        } catch (Exception e) {
            log.error("Failed to write mock email to disk: {}", e.getMessage());
        }
    }

    /**
     * Sends a professional HTML memo email using Spring Boot's JavaMailSender.
     * Uses the same spring.mail.* SMTP configuration as sendEmailWithAttachments().
     */
    public boolean sendMemoEmail(
            // BOS Inputs
            String companyName,
            String companyAddress,
            String senderDisplayEmail,
            // Memo Inputs
            String recipientEmail,
            String memoSubject,
            String memoBody
    ) {
        if (onlyAtsEnabled) {
            log.info("[EMAIL_BLOCKED] Memo email blocked. Subject: {}", memoSubject);
            return true;
        }
        log.info("Sending memo email to: {}, Subject: {}", recipientEmail, memoSubject);

        String htmlBody = memoBody;
        if (emailContentService != null && emailTemplateEngine != null) {
            try {
                Map<String, Object> placeholders = new HashMap<>();
                placeholders.put("memoSubject", memoSubject != null ? memoSubject : "Official Memo");
                placeholders.put("memoBody", memoBody != null ? memoBody : "");
                placeholders.put("companyName", companyName != null ? companyName : "Autonoma ERP");
                placeholders.put("companyAddress", companyAddress != null ? companyAddress : "");
                placeholders.put("hrName", "HR Administration");
                placeholders.put("currentDate", new SimpleDateFormat("dd-MM-yyyy").format(new Date()));
                placeholders.put("currentYear", String.valueOf(Calendar.getInstance().get(Calendar.YEAR)));

                com.autonoma.erp.modules.platform.notification.entity.EmailContent template = emailContentService.getTemplateOrApplicationDefault("EMPLOYEE MEMO");
                com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine.render(
                        memoSubject != null && !memoSubject.isBlank() ? memoSubject : template.getSubject(),
                        "<div style=\"font-size:16px; font-weight:700; color:#1e293b; margin-bottom:12px;\">{{memoSubject}}</div><div style=\"white-space:pre-wrap; line-height:1.6;\">{{memoBody}}</div>",
                        template.getYoursWindfully(),
                        placeholders
                );

                htmlBody = rendered.getFullMasterHtml();
            } catch (Exception ex) {
                log.warn("Failed to render memo email via EmailTemplateEngine: {}", ex.getMessage());
            }
        }

        // Validate SMTP configuration – fail fast if missing
        Map<String, String> senderConfig = new HashMap<>();
        JavaMailSender activeSender = getDynamicMailSender(senderConfig);
        
        if (activeSender == null) {
            log.error("[SKIPPED_DUE_TO_CONFIG] Dynamic or static SMTP configuration missing. Memo email sending aborted.");
            throw new IllegalStateException("SMTP misconfiguration");
        }
        try {
            MimeMessage message = activeSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            String from = senderConfig.getOrDefault("from", senderDisplayEmail != null ? senderDisplayEmail : mailFromAddress);
            helper.setFrom(new InternetAddress(from, companyName));
            
            // Set Reply-To to the display email or corporate mail to ensure SPF safety
            helper.setReplyTo(senderDisplayEmail != null ? senderDisplayEmail : mailFromAddress);
            
            // Deliverability and loop prevention headers
            message.setHeader("Auto-Submitted", "auto-generated");
            message.setHeader("X-Mailer", "JavaMailSender");
            
            helper.setTo(recipientEmail);
            helper.setSubject(memoSubject);
            helper.setText(htmlBody, true);

            activeSender.send(message);
            log.info("[SENT_SUCCESS] Memo email sent successfully via SMTP JavaMailSender to {}", recipientEmail);
            return true;
        } catch (Exception e) {
            log.error("[SEND_FAILED] Failed to send memo email via SMTP: {}", e.getMessage(), e);
            throw new IllegalStateException(translateMailException(e), e);
        }
    }

    public static String translateMailException(Throwable e) {
        if (e == null) {
            return "Unknown email sending error.";
        }
        Throwable cause = e;
        while (cause != null) {
            String className = cause.getClass().getName();
            String message = cause.getMessage() != null ? cause.getMessage() : "";
            
            if (className.contains("AuthenticationFailedException") || 
                cause instanceof org.springframework.mail.MailAuthenticationException ||
                message.contains("Authentication failed") ||
                message.contains("Username and Password not accepted") ||
                message.contains("535 5.7.3 Authentication unsuccessful")) {
                return "Unable to authenticate your Office Email credentials. Please verify your Office Email credentials or contact your administrator.";
            }
            if (cause instanceof java.net.ConnectException || 
                cause instanceof java.net.SocketTimeoutException || 
                className.contains("MailConnectException") ||
                message.contains("Connection refused") ||
                message.contains("Could not connect to SMTP host")) {
                return "Unable to connect to the configured mail server. Please check SMTP host and port settings.";
            }
            if (className.contains("SendFailedException") || 
                className.contains("InvalidAddressException") ||
                message.contains("Invalid Addresses") ||
                message.contains("550") ||
                message.contains("Recipient address rejected")) {
                return "Email could not be delivered. Please verify the recipient and try again.";
            }
            cause = cause.getCause();
        }
        return "Failed to send email: " + e.getMessage();
    }
}

package com.autonoma.erp.modules.platform.notification.service;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeContactRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile;
import com.autonoma.erp.model.admin.UserCredential;
import java.util.Optional;

/**
 * EmailTemplateEngine — Dynamic Template Engine & Master HTML Layout Renderer
 * Converts raw message body and dynamic placeholders into a clean, professional,
 * corporate HTML email layout while sanitizing legacy duplicate sections.
 */
@Service
public class EmailTemplateEngine {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EmailTemplateEngine.class);

    @Autowired(required = false)
    private com.autonoma.erp.service.admin.CompanyCredentialService companyCredentialService;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private EmployeeMasterRepository employeeMasterRepo;

    @Autowired(required = false)
    private EmployeeContactRepository employeeContactRepo;

    @Autowired(required = false)
    private EmployeeJobProfileRepository employeeJobProfileRepo;

    @Autowired(required = false)
    private com.autonoma.erp.modules.platform.files.service.FileService fileService;



    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_]+)\\s*\\}\\}");

    @Data
    @NoArgsConstructor
    public static class RenderedEmail {
        private String subject;
        private String bodyContent;       // Core processed body (sanitized)
        private String yoursWindfully;    // Processed signature
        private String fullMasterHtml;    // Full Master HTML Email Layout

        public RenderedEmail(String subject, String bodyContent, String yoursWindfully, String fullMasterHtml) {
            this.subject = subject;
            this.bodyContent = bodyContent;
            this.yoursWindfully = yoursWindfully;
            this.fullMasterHtml = fullMasterHtml;
        }

        public String getSubject() { return subject; }
        public String getBodyContent() { return bodyContent; }
        public String getYoursWindfully() { return yoursWindfully; }
        public String getFullMasterHtml() { return fullMasterHtml; }
    }

    /**
     * Extracts only the candidate's first name from full name or raw string.
     * Reusable central helper for dynamic placeholders (e.g. "Edwin M" -> "Edwin", "tesr t" -> "Tesr").
     */
    public static String getCandidateFirstName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "Candidate";
        }
        String trimmed = fullName.trim();
        String[] parts = trimmed.split("\\s+");
        String firstName = parts[0];
        firstName = firstName.replaceAll("[^a-zA-Z0-9]", "");
        if (firstName.isEmpty()) {
            return "Candidate";
        }
        return firstName.substring(0, 1).toUpperCase() + firstName.substring(1).toLowerCase();
    }

    /**
     * Removes legacy duplicated sections (e.g. legacy hardcoded Interview Details, raw candidate token links,
     * legacy instructions, and trailing signatures) if they exist in legacy stored template body content.
     */
    public String sanitizeLegacyBodyContent(String bodyHtml) {
        if (bodyHtml == null || bodyHtml.isBlank()) {
            return "";
        }
        String cleaned = bodyHtml;

        // 1. Remove raw candidate portal token URLs
        cleaned = cleaned.replaceAll("(?i)https?://[^\\s<\"']+/candidate/(?:assessment|onboarding)[^\\s<\"']*", "");

        // 2. Remove legacy prompt text introducing raw links
        cleaned = cleaned.replaceAll("(?i)<p>\\s*Please review and access the Assessment Portal using the link below:?\\s*</p>", "");
        cleaned = cleaned.replaceAll("(?i)Please review and access the Assessment Portal using the link below:?", "");

        // 3. Remove legacy duplicate instruction lines in body
        cleaned = cleaned.replaceAll("(?i)<p>\\s*Kindly bring a copy of your updated resume, photo ID, and relevant certificates\\.?\\s*</p>", "");
        cleaned = cleaned.replaceAll("(?i)Kindly bring a copy of your updated resume, photo ID, and relevant certificates\\.?", "");

        // 4. Remove legacy hardcoded Interview Details headings
        cleaned = cleaned.replaceAll("(?i)<p>\\s*<strong>\\s*(?:📌\\s*)?Interview Details:?\\s*</strong>\\s*</p>", "");
        cleaned = cleaned.replaceAll("(?i)<p>\\s*(?:📌\\s*)?Interview Details:?\\s*</p>", "");
        cleaned = cleaned.replaceAll("(?i)<strong>\\s*(?:📌\\s*)?Interview Details:?\\s*</strong>", "");
        cleaned = cleaned.replaceAll("(?i)(?:📌\\s*)?Interview Details:", "");

        // 5. Remove legacy list items/paragraphs for Date, Time, Venue inside body
        cleaned = cleaned.replaceAll("(?i)<li[^>]*>\\s*<b>\\s*Date:?\\s*</b>[^<]*</li>", "");
        cleaned = cleaned.replaceAll("(?i)<li[^>]*>\\s*<b>\\s*Time:?\\s*</b>[^<]*</li>", "");
        cleaned = cleaned.replaceAll("(?i)<li[^>]*>\\s*<b>\\s*Venue:?\\s*</b>[^<]*</li>", "");
        cleaned = cleaned.replaceAll("(?i)<p>\\s*•\\s*<strong>\\s*Date:?\\s*</strong>[^<]*</p>", "");
        cleaned = cleaned.replaceAll("(?i)<p>\\s*•\\s*<strong>\\s*Time:?\\s*</strong>[^<]*</p>", "");
        cleaned = cleaned.replaceAll("(?i)<p>\\s*•\\s*<strong>\\s*Venue:?\\s*</strong>[^<]*</p>", "");

        // 6. Remove legacy trailing signatures inside body
        cleaned = cleaned.replaceAll("(?i)<p>\\s*Regards,?\\s*</p>\\s*<p>\\s*<strong>\\s*HR TEAM\\s*</strong>\\s*</p>\\s*<p>\\s*HR Department\\s*</p>", "");
        cleaned = cleaned.replaceAll("(?i)<p>\\s*Regards,?\\s*</p>\\s*<p>\\s*<strong>[^<]+</strong>\\s*</p>", "");

        // 7. Clean leftover empty tags
        cleaned = cleaned.replaceAll("(?i)<p>\\s*(?:&nbsp;|\\s)*\\s*</p>", "");
        cleaned = cleaned.replaceAll("(?i)(<br\\s*/?>\\s*){3,}", "<br/><br/>");

        return cleaned.trim();
    }

    /**
     * Replaces double-curly brace placeholders (e.g., {{candidateFirstName}}, {{candidateName}}, {{position}})
     * using the provided placeholder context map.
     */
    public String processTemplate(String template, Map<String, Object> placeholders) {
        if (template == null || template.isEmpty()) {
            return "";
        }

        Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);
        StringBuilder sb = new StringBuilder();

        while (matcher.find()) {
            String key = matcher.group(1);
            if (placeholders != null && placeholders.containsKey(key)) {
                Object val = placeholders.get(key);
                String replacement = (val != null) ? val.toString() : "";
                matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
            } else {
                log.warn("[TEMPLATE ENGINE] Placeholder '{{{} }}' missing in context. Replacing with empty string.", key);
                matcher.appendReplacement(sb, "");
            }
        }
        matcher.appendTail(sb);
        String result = sb.toString();
        if (placeholders != null && placeholders.containsKey("reuploadPortalLink")) {
            String reuploadLink = placeholders.get("reuploadPortalLink").toString();
            if (reuploadLink != null && !reuploadLink.isBlank()) {
                result = result.replaceAll("/candidate/onboarding\\?token=[^\"'\\s<]+", java.util.regex.Matcher.quoteReplacement(reuploadLink));
            }
        }
        return result;
    }

    /**
     * Render subject, body content, signature, and complete Master HTML Layout.
     */
    public RenderedEmail render(String subjectTemplate, String bodyTemplate, String yoursWindfullyTemplate, Map<String, Object> placeholders) {
        String processedSubject = processTemplate(subjectTemplate, placeholders);
        String processedBody = processTemplate(bodyTemplate, placeholders);
        String processedSignature = processTemplate(yoursWindfullyTemplate, placeholders);

        // Sanitize legacy duplicate blocks from body content
        String cleanBody = sanitizeLegacyBodyContent(processedBody);

        String masterHtml = buildMasterHtmlLayout(processedSubject, cleanBody, processedSignature, placeholders);

        return new RenderedEmail(processedSubject, cleanBody, processedSignature, masterHtml);
    }

    public RenderedEmail render(com.autonoma.erp.modules.platform.notification.entity.EmailContent emailContent, Map<String, Object> placeholders) {
        if (emailContent == null) {
            return render("", "", "", placeholders);
        }
        Map<String, Object> context = placeholders != null ? new HashMap<>(placeholders) : new HashMap<>();
        context.put("includeCompanyFooter", emailContent.getIncludeCompanyFooter() != null ? emailContent.getIncludeCompanyFooter() : true);
        context.put("includeWebsite", emailContent.getIncludeWebsite() != null ? emailContent.getIncludeWebsite() : false);
        context.put("includeLocation", emailContent.getIncludeLocation() != null ? emailContent.getIncludeLocation() : false);
        
        String rawFooterHeader = emailContent.getFooterHeader() != null ? emailContent.getFooterHeader() : "Thanks & Regards";
        String rawFooterContent = emailContent.getFooterContent() != null ? emailContent.getFooterContent() : "";
        context.put("footerHeader", processTemplate(rawFooterHeader, context));
        context.put("footerContent", processTemplate(rawFooterContent, context));
        context.put("useCurrentUserCredentials", emailContent.getUseCurrentUserCredentials() != null ? emailContent.getUseCurrentUserCredentials() : false);

        String officeEmail = null;
        if (Boolean.TRUE.equals(emailContent.getUseCurrentUserCredentials())) {
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {}
            
            if (currentUserId == null || currentUserId.isBlank() || "SYSTEM".equalsIgnoreCase(currentUserId)) {
                throw new RuntimeException("Cannot render template: 'Use Current Logged-in User Credentials' is enabled, but no authenticated user is found in the security context.");
            }
            
            java.util.Map<String, String> details = getSenderPreviewDetails();
            String hrName = details.get("employeeName");
            String hrEmail = details.get("officeEmail");
            String hrPhone = details.get("contactNumber");
            
            context.put("hrName", hrName);
            context.put("hrEmail", hrEmail);
            context.put("hrPhone", hrPhone);
            context.put("officeEmail", hrEmail);
            
            String dynamicFooter = getDynamicLoggedUserFooter(hrEmail);
            context.put("footerContent", dynamicFooter != null ? dynamicFooter : "");
            officeEmail = hrEmail;
        } else {
            context.put("officeEmail", "");
        }

        return render(emailContent.getSubject(), emailContent.getBodyContent(), emailContent.getYoursWindfully(), context);
    }

    /**
     * Builds the complete Master HTML Email Layout wrapping the editable message content.
     * Order of sections:
     * 1. Email Title Badge
     * 2. Editable Body Content (Greeting & Message)
     * 3. Interview Details Box
     * 4. Primary CTA: Access Assessment Portal Button
     * 5. Assessment Portal Info Box (NO RAW URLS)
     * 6. Important Instructions Box
     * 7. Secondary Action Buttons: Visit Website & View Location
     * 8. HR Signature & Footer
     */
    public String buildMasterHtmlLayout(String subject, String bodyHtml, String yoursWindfully, Map<String, Object> placeholders) {
        CompanyCredential company = null;
        if (companyCredentialService != null) {
            try {
                company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
            } catch (Exception ex) {
                log.warn("[EMAIL ENGINE] Failed to query CompanyCredential: {}", ex.getMessage());
            }
        }

        String companyName = getPlaceholderStr(placeholders, "companyName", "");
        if (companyName.isBlank()) {
            companyName = (company != null && company.getCompanyName() != null && !company.getCompanyName().isBlank())
                    ? company.getCompanyName().trim() : "Autonoma ERP Corp";
        }

        String companyAddress = getPlaceholderStr(placeholders, "companyAddress", "");
        if (companyAddress.isBlank() && company != null) {
            StringBuilder addr = new StringBuilder();
            if (company.getAddress() != null && !company.getAddress().isBlank()) addr.append(company.getAddress().trim());
            if (company.getCity() != null && !company.getCity().isBlank()) {
                if (addr.length() > 0) addr.append(", ");
                addr.append(company.getCity().trim());
            }
            if (company.getState() != null && !company.getState().isBlank()) {
                if (addr.length() > 0) addr.append(", ");
                addr.append(company.getState().trim());
            }
            companyAddress = addr.length() > 0 ? addr.toString() : "Tamil Nadu, India";
        } else if (companyAddress.isBlank()) {
            companyAddress = "Tamil Nadu, India";
        }

        String websiteUrl = (company != null && company.getWebsite() != null && !company.getWebsite().isBlank())
                ? company.getWebsite().trim()
                : getPlaceholderStr(placeholders, "websiteUrl", "");

        String locationMapUrl = (company != null && company.getGmaplink() != null && !company.getGmaplink().isBlank())
                ? company.getGmaplink().trim()
                : getPlaceholderStr(placeholders, "locationMapUrl", "");

        String hrName = getPlaceholderStr(placeholders, "hrName", "HR Department");
        String hrEmail = getPlaceholderStr(placeholders, "hrEmail", "hr@autonomaerp.com");
        String currentYear = String.valueOf(Calendar.getInstance().get(Calendar.YEAR));

        // Primary Action Links
        String reuploadPortalLink = getPlaceholderStr(placeholders, "reuploadPortalLink", "");
        String onboardingPortalLink = getPlaceholderStr(placeholders, "onboardingPortalLink", "");
        String assessmentPortalLink = getPlaceholderStr(placeholders, "assessmentPortalLink", "");
        String verificationPortalLink = getPlaceholderStr(placeholders, "verificationPortalLink", "");
        String surveyLink = getPlaceholderStr(placeholders, "surveyLink", "");
        String actionPortalLink = getPlaceholderStr(placeholders, "actionPortalLink", "");
        String actionButtonText = getPlaceholderStr(placeholders, "actionButtonText", "Access Portal");

        // Document Reupload Details
        String rejectedDocuments = getPlaceholderStr(placeholders, "rejectedDocumentsList", getPlaceholderStr(placeholders, "rejectedDocuments", ""));
        String rejectionReason = getPlaceholderStr(placeholders, "rejectionReason", "");
        String supportContact = getPlaceholderStr(placeholders, "supportContact", hrEmail);
        String validityDays = getPlaceholderStr(placeholders, "validityDays", "2");

        // Interview Details
        String position = getPlaceholderStr(placeholders, "position", "");
        String department = getPlaceholderStr(placeholders, "department", "");
        String interviewDate = getPlaceholderStr(placeholders, "interviewDate", "");
        String interviewTime = getPlaceholderStr(placeholders, "interviewTime", "");
        String venue = getPlaceholderStr(placeholders, "venue", companyAddress);
        boolean hasInterviewDetails = !interviewDate.isBlank() || !interviewTime.isBlank();

        // Induction Details
        String inductionBatchName = getPlaceholderStr(placeholders, "inductionBatchName", "");
        String inductionDate = getPlaceholderStr(placeholders, "inductionDate", "");
        String inductionTime = getPlaceholderStr(placeholders, "inductionTime", "");
        String trainerName = getPlaceholderStr(placeholders, "trainerName", "");
        boolean hasInductionDetails = !inductionBatchName.isBlank() || !inductionDate.isBlank();

        // Custom Instructions
        String customInstructions = getPlaceholderStr(placeholders, "importantInstructions", "");

        // Sanitize bodyHtml to strip out duplicate blocks if present
        String cleanBodyHtml = sanitizeLegacyBodyContent(bodyHtml);

        String logoFileName = getPlaceholderStr(placeholders, "logoFileName", "");
        if (logoFileName.isBlank() && company != null && company.getLogoFileName() != null) {
            logoFileName = company.getLogoFileName().trim();
        }

        String baseUrl = "";
        if (!reuploadPortalLink.isBlank()) baseUrl = extractBaseUrl(reuploadPortalLink);
        else if (!onboardingPortalLink.isBlank()) baseUrl = extractBaseUrl(onboardingPortalLink);
        else if (!assessmentPortalLink.isBlank()) baseUrl = extractBaseUrl(assessmentPortalLink);
        else if (!verificationPortalLink.isBlank()) baseUrl = extractBaseUrl(verificationPortalLink);
        else if (!surveyLink.isBlank()) baseUrl = extractBaseUrl(surveyLink);
        else if (!actionPortalLink.isBlank()) baseUrl = extractBaseUrl(actionPortalLink);

        StringBuilder html = new StringBuilder();
        // ── DOCTYPE + HEAD ──────────────────────────────────────────────────────
        html.append("<!DOCTYPE html>");
        html.append("<html lang=\"en\" xmlns=\"http://www.w3.org/1999/xhtml\">");
        html.append("<head><meta charset=\"UTF-8\">");
        html.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">");
        html.append("<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">");
        html.append("<title>").append(escapeHtml(subject)).append("</title>");
        html.append("<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->");
        html.append("<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap\" rel=\"stylesheet\">");
        html.append("<style>");
        html.append("body,table,td{font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif;}");
        html.append("body{margin:0;padding:0;background-color:#F6F7F9;-webkit-text-size-adjust:100%;}");
        html.append("img{border:0;display:block;}a{text-decoration:none;}");
        html.append(".cta-btn-static a{text-decoration:none !important;}");
        html.append(".cta-btn-static{background-color:#0B1120;background-image:linear-gradient(135deg,#0B1120 0%,#0EA394 100%);}");
        html.append(".cta-btn-static:hover{background-image:linear-gradient(135deg,#101B33 0%,#14C4AE 100%);}");
        html.append("@media only screen and (max-width:600px){");
        html.append(".container{width:100% !important;}");
        html.append(".px{padding-left:24px !important;padding-right:24px !important;}");
        html.append(".hero-px{padding-left:24px !important;padding-right:24px !important;}");
        html.append(".detail-row td{display:block !important;width:100% !important;}");
        html.append(".detail-label{padding-bottom:2px !important;}");
        html.append(".detail-value{padding-bottom:0 !important;}");
        html.append(".h1{font-size:19px !important;}");
        html.append("}");
        html.append("</style></head>");

        // ── BODY + OUTER WRAPPER ────────────────────────────────────────────────
        html.append("<body>");
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#F6F7F9;\">");
        html.append("<tr><td align=\"center\" style=\"padding:40px 16px;\">");

        // ── CONTAINER (600px) ───────────────────────────────────────────────────
        html.append("<table role=\"presentation\" class=\"container\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"width:600px;max-width:600px;\">");

        // Preheader spacing
        html.append("<tr><td style=\"font-size:0;line-height:0;height:0;\">&nbsp;</td></tr>");

        // ── WHITE CARD ──────────────────────────────────────────────────────────
        html.append("<tr><td style=\"background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(16,24,40,0.04),0 8px 28px rgba(16,24,40,0.07);\">");

        // ── 1. HEADER: ink navy + dot-grid texture + wordmark ───────────────────
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">");
        html.append("<tr><td style=\"background-color:#0B1120;background-image:radial-gradient(rgba(255,255,255,0.09) 1px,transparent 1px);background-size:14px 14px;padding:30px 40px;\" class=\"hero-px\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>");
        
        // Company name (no logo)
        html.append("<td valign=\"middle\">");
        html.append("<span style=\"color:#ffffff;font-size:15px;font-weight:600;letter-spacing:0.01em;\">").append(escapeHtml(companyName)).append("</span>");
        html.append("</td>");


        // Conditional status badge (only for interview-related types)
        if (hasInterviewDetails) {
            html.append("<td valign=\"middle\" align=\"right\">");
            html.append("<span style=\"display:inline-block;border:1px solid rgba(255,255,255,0.18);color:#8FE9DC;font-size:10.5px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:6px 11px;border-radius:20px;\">");
            html.append("Shortlisted");
            html.append("</span></td>");
        }
        html.append("</tr></table>");
        html.append("</td></tr></table>");

        // ── 2. BODY CONTENT ─────────────────────────────────────────────────────
        html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">");

        // Subject badge (teal uppercase label)
        html.append("<tr><td style=\"padding:36px 40px 0 40px;\" class=\"px\">");
        html.append("<span style=\"font-size:11px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#0EA394;\">");
        html.append(escapeHtml(subject.isBlank() ? "NOTIFICATION" : subject));
        html.append("</span></td></tr>");

        // Editable body content (greeting & message from template)
        html.append("<tr><td style=\"padding:16px 40px 0 40px;font-size:15px;line-height:1.7;color:#475467;\" class=\"px\">");
        html.append(cleanBodyHtml);
        html.append("</td></tr>");

        // ── 3. REJECTED DOCUMENTS BOX ───────────────────────────────────────────
        String rejectedDocsTable = getPlaceholderStr(placeholders, "rejectedDocumentsTable", "");
        if (!rejectedDocuments.isBlank() && !cleanBodyHtml.contains("<table") && !cleanBodyHtml.contains("rejectedDocumentsTable")) {
            html.append("<tr><td style=\"padding:26px 40px 0 40px;\" class=\"px\">");
            if (!rejectedDocsTable.isBlank()) {
                html.append(rejectedDocsTable);
            } else {
                html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#FEF3F2;border-radius:10px;\">");
                html.append("<tr><td style=\"border-left:3px solid #D92D20;border-radius:3px;padding:20px 24px;\">");
                html.append("<span style=\"font-size:14px;font-weight:700;color:#B42318;\">Action Required: Document Re-upload</span>");
                html.append("<p style=\"margin:10px 0 0 0;font-size:13px;color:#912018;line-height:1.7;\">The following document(s) require your re-submission:</p>");
                html.append("<div style=\"background-color:#ffffff;border:1px solid #FECDCA;border-radius:6px;padding:12px;font-size:14px;color:#B42318;font-weight:600;margin:10px 0;\">");
                html.append(rejectedDocuments.replace("\n", "<br/>"));
                html.append("</div>");
                if (!rejectionReason.isBlank()) {
                    html.append("<p style=\"margin:0 0 10px 0;font-size:13px;color:#912018;\"><strong>Reason:</strong> ").append(escapeHtml(rejectionReason)).append("</p>");
                }
                html.append("<p style=\"margin:0;font-size:13px;color:#912018;line-height:1.5;\">Please click the portal button below to re-upload clear, valid documents before the link expires. Contact HR at <strong>").append(escapeHtml(supportContact)).append("</strong> if needed.</p>");
                html.append("</td></tr></table>");
            }
            html.append("</td></tr>");
        }

        // ── 4. INTERVIEW DETAILS: left-rule card ────────────────────────────────
        if (hasInterviewDetails) {
            html.append("<tr><td style=\"padding:26px 40px 0 40px;\" class=\"px\">");
            html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#F9FAFB;border-radius:10px;\">");
            html.append("<tr><td style=\"border-left:3px solid #0EA394;border-radius:3px;padding:20px 24px;\">");
            html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">");
            boolean isFirstDetailRow = true;
            if (!position.isBlank()) {
                html.append("<tr class=\"detail-row\">");
                html.append("<td class=\"detail-label\" width=\"36%\" valign=\"top\" style=\"padding:8px 0;font-size:12.5px;color:#667085;\">Position</td>");
                html.append("<td class=\"detail-value\" valign=\"top\" style=\"padding:8px 0;font-size:14px;color:#101828;font-weight:600;\">").append(escapeHtml(position)).append("</td>");
                html.append("</tr>");
                isFirstDetailRow = false;
            }
            if (!department.isBlank()) {
                String borderTop = isFirstDetailRow ? "" : "border-top:1px solid #EAECF0;";
                html.append("<tr class=\"detail-row\">");
                html.append("<td class=\"detail-label\" valign=\"top\" style=\"padding:8px 0;font-size:12.5px;color:#667085;").append(borderTop).append("\">Department</td>");
                html.append("<td class=\"detail-value\" valign=\"top\" style=\"padding:8px 0;font-size:14px;color:#101828;font-weight:600;").append(borderTop).append("\">").append(escapeHtml(department)).append("</td>");
                html.append("</tr>");
                isFirstDetailRow = false;
            }
            if (!interviewDate.isBlank() || !interviewTime.isBlank()) {
                String borderTop = isFirstDetailRow ? "" : "border-top:1px solid #EAECF0;";
                String dateTime = "";
                if (!interviewDate.isBlank() && !interviewTime.isBlank()) {
                    dateTime = escapeHtml(interviewDate) + " &middot; " + escapeHtml(interviewTime);
                } else if (!interviewDate.isBlank()) {
                    dateTime = escapeHtml(interviewDate);
                } else {
                    dateTime = escapeHtml(interviewTime);
                }
                html.append("<tr class=\"detail-row\">");
                html.append("<td class=\"detail-label\" valign=\"top\" style=\"padding:8px 0;font-size:12.5px;color:#667085;").append(borderTop).append("\">Date &amp; Time</td>");
                html.append("<td class=\"detail-value\" valign=\"top\" style=\"padding:8px 0;font-size:14px;color:#101828;font-weight:600;").append(borderTop).append("\">").append(dateTime).append("</td>");
                html.append("</tr>");
                isFirstDetailRow = false;
            }
            if (!venue.isBlank()) {
                String borderTop = isFirstDetailRow ? "" : "border-top:1px solid #EAECF0;";
                html.append("<tr class=\"detail-row\">");
                html.append("<td class=\"detail-label\" valign=\"top\" style=\"padding:8px 0;font-size:12.5px;color:#667085;").append(borderTop).append("\">Venue</td>");
                html.append("<td class=\"detail-value\" valign=\"top\" style=\"padding:8px 0;font-size:14px;color:#101828;font-weight:600;").append(borderTop).append("\">").append(escapeHtml(venue)).append("</td>");
                html.append("</tr>");
                isFirstDetailRow = false;
            }
            // Company row
            {
                String borderTop = isFirstDetailRow ? "" : "border-top:1px solid #EAECF0;";
                html.append("<tr class=\"detail-row\">");
                html.append("<td class=\"detail-label\" valign=\"top\" style=\"padding:8px 0;font-size:12.5px;color:#667085;").append(borderTop).append("\">Company</td>");
                html.append("<td class=\"detail-value\" valign=\"top\" style=\"padding:8px 0;font-size:14px;color:#101828;font-weight:600;").append(borderTop).append("\">").append(escapeHtml(companyName)).append("</td>");
                html.append("</tr>");
            }
            html.append("</table>");
            html.append("</td></tr></table>");
            html.append("</td></tr>");
        }

        // ── 5. INDUCTION DETAILS: left-rule card ────────────────────────────────
        if (hasInductionDetails) {
            html.append("<tr><td style=\"padding:26px 40px 0 40px;\" class=\"px\">");
            html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#F9FAFB;border-radius:10px;\">");
            html.append("<tr><td style=\"border-left:3px solid #0EA394;border-radius:3px;padding:20px 24px;\">");
            html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">");
            boolean isFirstRow = true;
            if (!inductionBatchName.isBlank()) {
                html.append("<tr class=\"detail-row\">");
                html.append("<td class=\"detail-label\" width=\"36%\" valign=\"top\" style=\"padding:8px 0;font-size:12.5px;color:#667085;\">Batch Name</td>");
                html.append("<td class=\"detail-value\" valign=\"top\" style=\"padding:8px 0;font-size:14px;color:#101828;font-weight:600;\">").append(escapeHtml(inductionBatchName)).append("</td>");
                html.append("</tr>");
                isFirstRow = false;
            }
            if (!inductionDate.isBlank()) {
                String borderTop = isFirstRow ? "" : "border-top:1px solid #EAECF0;";
                html.append("<tr class=\"detail-row\">");
                html.append("<td class=\"detail-label\" valign=\"top\" style=\"padding:8px 0;font-size:12.5px;color:#667085;").append(borderTop).append("\">Scheduled Date</td>");
                html.append("<td class=\"detail-value\" valign=\"top\" style=\"padding:8px 0;font-size:14px;color:#101828;font-weight:600;").append(borderTop).append("\">").append(escapeHtml(inductionDate)).append("</td>");
                html.append("</tr>");
                isFirstRow = false;
            }
            if (!inductionTime.isBlank()) {
                String borderTop = isFirstRow ? "" : "border-top:1px solid #EAECF0;";
                html.append("<tr class=\"detail-row\">");
                html.append("<td class=\"detail-label\" valign=\"top\" style=\"padding:8px 0;font-size:12.5px;color:#667085;").append(borderTop).append("\">Time</td>");
                html.append("<td class=\"detail-value\" valign=\"top\" style=\"padding:8px 0;font-size:14px;color:#101828;font-weight:600;").append(borderTop).append("\">").append(escapeHtml(inductionTime)).append("</td>");
                html.append("</tr>");
                isFirstRow = false;
            }
            if (!trainerName.isBlank()) {
                String borderTop = isFirstRow ? "" : "border-top:1px solid #EAECF0;";
                html.append("<tr class=\"detail-row\">");
                html.append("<td class=\"detail-label\" valign=\"top\" style=\"padding:8px 0;font-size:12.5px;color:#667085;").append(borderTop).append("\">Trainer</td>");
                html.append("<td class=\"detail-value\" valign=\"top\" style=\"padding:8px 0;font-size:14px;color:#101828;font-weight:600;").append(borderTop).append("\">").append(escapeHtml(trainerName)).append("</td>");
                html.append("</tr>");
            }
            html.append("</table>");
            html.append("</td></tr></table>");
            html.append("</td></tr>");
        }

        // ── 6. PRIMARY CTA BUTTON ───────────────────────────────────────────────
        String primaryCtaUrl = "";
        String primaryCtaLabel = "";

        if (!reuploadPortalLink.isBlank()) {
            primaryCtaUrl = reuploadPortalLink;
            primaryCtaLabel = "Access Candidate Portal";
        } else if (!onboardingPortalLink.isBlank()) {
            primaryCtaUrl = onboardingPortalLink;
            primaryCtaLabel = "Access Candidate Portal";
        } else if (!assessmentPortalLink.isBlank()) {
            primaryCtaUrl = assessmentPortalLink;
            primaryCtaLabel = "Access Candidate Portal";
        } else if (!verificationPortalLink.isBlank()) {
            primaryCtaUrl = verificationPortalLink;
            primaryCtaLabel = "Access Verification portal";
        } else if (!surveyLink.isBlank()) {
            primaryCtaUrl = surveyLink;
            primaryCtaLabel = "Take Feedback Survey";
        } else if (!actionPortalLink.isBlank()) {
            primaryCtaUrl = actionPortalLink;
            primaryCtaLabel = actionButtonText;
        }

        if (!primaryCtaUrl.isBlank()) {
            html.append("<tr><td align=\"center\" style=\"padding:28px 40px 0 40px;\" class=\"px\">");
            html.append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">");
            html.append("<tr><td align=\"center\" style=\"padding:0;\">");

            // Outlook desktop: static solid VML button (gradients aren't supported there)
            html.append("<!--[if mso]>");
            html.append("<v:roundrect xmlns:v=\"urn:schemas-microsoft-com:vml\" xmlns:w=\"urn:schemas-microsoft-com:office:word\" ");
            html.append("href=\"").append(escapeHtml(primaryCtaUrl)).append("\" style=\"height:46px;v-text-anchor:middle;width:260px;\" arcsize=\"19%\" ");
            html.append("strokecolor=\"#0B1120\" fillcolor=\"#0B1120\">");
            html.append("<w:anchorlock/>");
            html.append("<center style=\"color:#ffffff;font-family:Helvetica Neue,Arial,sans-serif;font-size:14.5px;font-weight:600;\">");
            html.append(escapeHtml(primaryCtaLabel));
            html.append("</center></v:roundrect><![endif]-->");

            // Modern email clients: static gradient button
            html.append("<!--[if !mso]><!-->");
            html.append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\">");
            html.append("<tr><td align=\"center\" class=\"cta-btn-static\" style=\"border-radius:9px;box-shadow:0 4px 14px rgba(11,17,32,0.4);\">");
            html.append("<a href=\"").append(escapeHtml(primaryCtaUrl)).append("\" target=\"_blank\" ");
            html.append("style=\"display:block;padding:14px 40px;font-size:14.5px;font-weight:600;");
            html.append("color:#ffffff;letter-spacing:0.01em;text-decoration:none;");
            html.append("font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;border-radius:9px;\">");
            html.append(escapeHtml(primaryCtaLabel));
            html.append("</a></td></tr></table><!--<![endif]-->");

            html.append("</td></tr></table>");
            // Link expires microcopy
            html.append("<p style=\"margin:10px 0 0 0;font-size:12px;color:#D92D20;font-weight:600;text-align:center;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;\">Link expires in 48 hours</p>");
            html.append("</td></tr>");
        }

        // ── 7. IMPORTANT INSTRUCTIONS BOX (clean, on-brand) ─────────────────────
        if (!customInstructions.isBlank() || hasInterviewDetails) {
            html.append("<tr><td style=\"padding:28px 40px 0 40px;\" class=\"px\">");
            html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border:1px solid #EAECF0;border-radius:10px;\">");
            html.append("<tr><td style=\"padding:18px 22px;\">");
            html.append("<span style=\"font-size:12px;font-weight:700;color:#101828;\">Before you arrive</span>");
            html.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top:9px;\">");
            if (!customInstructions.isBlank()) {
                // Parse custom instructions line-by-line with teal bullet markers
                String[] lines = customInstructions.split("\\n");
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (!trimmed.isEmpty()) {
                        // Strip leading bullet characters if present
                        String cleaned = trimmed.replaceFirst("^[•·\\-\\*]\\s*", "");
                        html.append("<tr><td style=\"font-size:13px;color:#475467;line-height:1.9;\"><span style=\"color:#0EA394;font-weight:700;\">&middot;</span>&nbsp; ").append(cleaned).append("</td></tr>");
                    }
                }
            } else {
                html.append("<tr><td style=\"font-size:13px;color:#475467;line-height:1.9;\"><span style=\"color:#0EA394;font-weight:700;\">&middot;</span>&nbsp; Arrive at least 15 minutes before your scheduled time.</td></tr>");
                html.append("<tr><td style=\"font-size:13px;color:#475467;line-height:1.9;\"><span style=\"color:#0EA394;font-weight:700;\">&middot;</span>&nbsp; Bring a printed resume, photo ID, and original certificates.</td></tr>");
                html.append("<tr><td style=\"font-size:13px;color:#475467;line-height:1.9;\"><span style=\"color:#0EA394;font-weight:700;\">&middot;</span>&nbsp; Complete portal registration beforehand, if applicable.</td></tr>");
            }
            html.append("</table>");
            html.append("</td></tr></table>");
            html.append("</td></tr>");
        }

        // ── 8. SECONDARY BUTTONS: VISIT WEBSITE & VIEW LOCATION ─────────────────
        boolean includeCompanyFooter = parseBoolean(placeholders != null ? placeholders.get("includeCompanyFooter") : null, true);
        boolean includeWebsite = parseBoolean(placeholders != null ? placeholders.get("includeWebsite") : null, false);
        boolean includeLocation = parseBoolean(placeholders != null ? placeholders.get("includeLocation") : null, false);

        if (includeCompanyFooter) {
            boolean showWebsite = includeWebsite && websiteUrl != null && !websiteUrl.isBlank() && !"#".equals(websiteUrl.trim());
            boolean showLocation = includeLocation && locationMapUrl != null && !locationMapUrl.isBlank() && !"#".equals(locationMapUrl.trim());

            if (includeWebsite && (websiteUrl == null || websiteUrl.isBlank() || "#".equals(websiteUrl.trim()))) {
                log.warn("[EMAIL ENGINE] Include Website Button is enabled, but Company Website is not configured in Company Profile. Omitted Website button.");
            }
            if (includeLocation && (locationMapUrl == null || locationMapUrl.isBlank() || "#".equals(locationMapUrl.trim()))) {
                log.warn("[EMAIL ENGINE] Include Location Button is enabled, but Location Map Link is not configured in Company Profile. Omitted Location button.");
            }

            if (showWebsite || showLocation) {
                html.append("<tr><td style=\"padding:24px 40px 0 40px;text-align:center;\" class=\"px\">");
                html.append("<table role=\"presentation\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" align=\"center\" style=\"margin:0 auto;\">");
                html.append("<tr>");
                if (showWebsite) {
                    html.append("<td style=\"padding:6px 8px;text-align:center;\">");
                    html.append("<a href=\"").append(escapeHtml(websiteUrl)).append("\" target=\"_blank\" style=\"background-color:#0B1120;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:50px;font-size:13px;font-weight:600;display:inline-block;font-family:'Segoe UI',Arial,sans-serif;\">");
                    html.append("Visit Website</a></td>");
                }
                if (showLocation) {
                    html.append("<td style=\"padding:6px 8px;text-align:center;\">");
                    html.append("<a href=\"").append(escapeHtml(locationMapUrl)).append("\" target=\"_blank\" style=\"background-color:#0B1120;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:50px;font-size:13px;font-weight:600;display:inline-block;font-family:'Segoe UI',Arial,sans-serif;\">");
                    html.append("View Location</a></td>");
                }
                html.append("</tr></table>");
                html.append("</td></tr>");
            }
        }

        // ── 9. SIGN-OFF / SIGNATURE ─────────────────────────────────────────────
        html.append("<tr><td style=\"padding:28px 40px 36px 40px;\" class=\"px\">");

        String footerHeader = getPlaceholderStr(placeholders, "footerHeader", "Thanks & Regards");
        boolean useCurrentUser = parseBoolean(placeholders != null ? placeholders.get("useCurrentUserCredentials") : null, false);
        String footerContent = "";

        if (useCurrentUser) {
            String dynamicFooter = getDynamicLoggedUserFooter(getPlaceholderStr(placeholders, "officeEmail", ""));
            if (dynamicFooter != null && !dynamicFooter.isBlank()) {
                footerContent = dynamicFooter;
            } else {
                footerContent = getPlaceholderStr(placeholders, "footerContent", yoursWindfully != null ? yoursWindfully : (companyName + " HR Team"));
            }
        } else {
            footerContent = getPlaceholderStr(placeholders, "footerContent", (yoursWindfully != null && !yoursWindfully.isBlank()) ? yoursWindfully : companyName);
        }

        // Ensure all placeholders in footerHeader and footerContent are fully resolved
        footerHeader = processTemplate(footerHeader, placeholders);
        footerContent = processTemplate(footerContent, placeholders);

        if (footerContent == null || footerContent.isBlank()) {
            footerContent = companyName;
        }

        html.append("<p style=\"margin:0;font-size:14px;color:#475467;\">").append(escapeHtml(footerHeader).replace("\n", "<br/>")).append("</p>");
        html.append("<p style=\"margin:4px 0 0 0;font-size:14px;color:#101828;font-weight:600;white-space:pre-wrap;\">").append(escapeHtml(footerContent).replace("\n", "<br/>")).append("</p>");
        html.append("</td></tr>");

        // ── END WHITE CARD ──────────────────────────────────────────────────────
        html.append("</table>"); // end body content table
        html.append("</td></tr>"); // end white card td/tr

        // ── 10. FOOTER: outside the card, on page background ────────────────────
        html.append("<tr><td style=\"padding:24px 12px 0 12px;\" align=\"center\">");
        html.append("<p style=\"margin:0;font-size:12px;color:#98A2B3;line-height:1.7;\">");
        html.append(escapeHtml(companyAddress));
        if (!hrEmail.isBlank()) {
            html.append("<br/><a href=\"mailto:").append(escapeHtml(hrEmail)).append("\" style=\"color:#98A2B3;\">").append(escapeHtml(hrEmail)).append("</a>");
        }
        html.append("</p>");
        html.append("<p style=\"margin:10px 0 0 0;font-size:11px;color:#C4CAD4;\">");
        html.append("&copy; ").append(currentYear).append(" ").append(escapeHtml(companyName)).append(". All rights reserved.");
        html.append("</p>");
        html.append("</td></tr>");

        // ── END CONTAINER + OUTER TABLE ─────────────────────────────────────────
        html.append("</table>"); // end container
        html.append("</td></tr></table>"); // end outer table
        html.append("</body></html>");

        return html.toString();
    }

    private String getPlaceholderStr(Map<String, Object> map, String key, String defaultVal) {
        if (map == null || !map.containsKey(key)) return defaultVal;
        Object val = map.get(key);
        return (val != null && !val.toString().isBlank()) ? val.toString().trim() : defaultVal;
    }

    public static String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private boolean parseBoolean(Object val, boolean defaultValue) {
        if (val == null) return defaultValue;
        if (val instanceof Boolean) return (Boolean) val;
        String s = val.toString().trim().toLowerCase();
        if (s.isEmpty()) return defaultValue;
        return "true".equals(s) || "1".equals(s) || "yes".equals(s);
    }

    public java.util.Map<String, String> getSenderPreviewDetails() {
        java.util.Map<String, String> details = new java.util.HashMap<>();
        
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {}
        
        if (currentUserId == null || currentUserId.isBlank() || "SYSTEM".equalsIgnoreCase(currentUserId)) {
            details.put("employeeName", "Not Configured");
            details.put("designation", "Not Configured");
            details.put("department", "Not Configured");
            details.put("officeEmail", "Not Configured");
            details.put("contactNumber", "Not Configured");
            return details;
        }

        if (userRepository == null || employeeMasterRepo == null) {
            details.put("employeeName", "Not Configured");
            details.put("designation", "Not Configured");
            details.put("department", "Not Configured");
            details.put("officeEmail", "Not Configured");
            details.put("contactNumber", "Not Configured");
            return details;
        }

        Optional<UserCredential> userOpt = userRepository.findById(currentUserId);
        if (userOpt.isEmpty() || userOpt.get().getEmpId() == null) {
            details.put("employeeName", "Not Configured");
            details.put("designation", "Not Configured");
            details.put("department", "Not Configured");
            details.put("officeEmail", "Not Configured");
            details.put("contactNumber", "Not Configured");
            return details;
        }

        Long empId = userOpt.get().getEmpId();
        Optional<EmployeeMaster> empOpt = employeeMasterRepo.findById(empId);
        if (empOpt.isEmpty()) {
            details.put("employeeName", "Not Configured");
            details.put("designation", "Not Configured");
            details.put("department", "Not Configured");
            details.put("officeEmail", "Not Configured");
            details.put("contactNumber", "Not Configured");
            return details;
        }

        EmployeeMaster emp = empOpt.get();

        // Title + Name
        String titleStr = emp.getTitle() != null && !emp.getTitle().isBlank() ? emp.getTitle().trim() : "";
        String nameStr = emp.getEmployeeName() != null && !emp.getEmployeeName().isBlank() ? emp.getEmployeeName().trim() : "";
        String fullName = "";
        if (!titleStr.isEmpty()) {
            if (!titleStr.endsWith(".")) {
                titleStr = titleStr + ".";
            }
            fullName = titleStr + " " + nameStr;
        } else {
            fullName = nameStr;
        }
        details.put("employeeName", fullName.isBlank() ? "Not Configured" : fullName);

        // Designation
        String designationStr = "";
        if (emp.getOrganization() != null && emp.getOrganization().getDesignation() != null) {
            designationStr = emp.getOrganization().getDesignation().getDesignationName();
        }
        details.put("designation", (designationStr != null && !designationStr.isBlank()) ? designationStr.trim() : "Not Configured");

        // Department
        String departmentStr = "";
        if (emp.getOrganization() != null && emp.getOrganization().getDepartment() != null) {
            departmentStr = emp.getOrganization().getDepartment().getDepartmentName();
        }
        details.put("department", (departmentStr != null && !departmentStr.isBlank()) ? departmentStr.trim() : "Not Configured");

        // Office Email & Official Contacts
        String emailStr = "";
        String phoneStr = "";
        if (employeeJobProfileRepo != null) {
            try {
                Optional<EmployeeJobProfile> jpOpt = employeeJobProfileRepo.findByEmployeeId(empId);
                if (jpOpt.isPresent()) {
                    EmployeeJobProfile jp = jpOpt.get();
                    if (jp.getOfficeEmail() != null) {
                        emailStr = jp.getOfficeEmail().trim();
                    }
                    String c1 = jp.getCompanyContact1() != null ? jp.getCompanyContact1().trim() : "";
                    String c2 = jp.getCompanyContact2() != null ? jp.getCompanyContact2().trim() : "";
                    if (!c1.isEmpty()) {
                        phoneStr = c1;
                    } else if (!c2.isEmpty()) {
                        phoneStr = c2;
                    }
                }
            } catch (Exception ex) {
                log.warn("[EMAIL ENGINE] Failed to query EmployeeJobProfile: {}", ex.getMessage());
            }
        }
        details.put("officeEmail", (emailStr != null && !emailStr.isEmpty()) ? emailStr : "Not Configured");

        if (!phoneStr.isEmpty()) {
            if (!phoneStr.startsWith("+") && !phoneStr.startsWith("0")) {
                phoneStr = "+91 " + phoneStr;
            }
        }
        details.put("contactNumber", phoneStr.isEmpty() ? "Not Configured" : phoneStr);

        return details;
    }

    public java.util.List<String> getMissingSenderProfileFields() {
        java.util.List<String> missing = new java.util.ArrayList<>();
        java.util.Map<String, String> details = getSenderPreviewDetails();
        
        java.util.function.BiConsumer<String, String> check = (key, label) -> {
            String val = details.get(key);
            if (val == null || val.trim().isEmpty() || "Not Configured".equalsIgnoreCase(val.trim())) {
                missing.add(label);
            }
        };
        
        check.accept("employeeName", "Name");
        check.accept("designation", "Designation");
        check.accept("department", "Department");
        check.accept("officeEmail", "Office Email");
        check.accept("contactNumber", "Official Contact Number");
        
        return missing;
    }

    public void validateSenderProfile(com.autonoma.erp.modules.platform.notification.entity.EmailContent template) {
        if (template == null || !Boolean.TRUE.equals(template.getUseCurrentUserCredentials())) {
            return;
        }
        java.util.List<String> missing = getMissingSenderProfileFields();
        if (!missing.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            sb.append("Cannot save this template.\n\n");
            sb.append("The following official employee details are not configured:\n");
            for (String field : missing) {
                sb.append("• ").append(field).append("\n");
            }
            sb.append("\nPlease configure these details in Employee Master → Job Details and try again.");
            throw new RuntimeException(sb.toString());
        }
    }

    public String getDynamicLoggedUserFooter(String officeEmail) {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
            log.warn("[EMAIL ENGINE] Failed to retrieve current user ID from security context: {}", e.getMessage());
        }
        if (currentUserId == null || currentUserId.isBlank() || "SYSTEM".equalsIgnoreCase(currentUserId)) {
            return null;
        }

        if (userRepository == null || employeeMasterRepo == null) {
            return null;
        }

        Optional<UserCredential> userOpt = userRepository.findById(currentUserId);
        if (userOpt.isEmpty() || userOpt.get().getEmpId() == null) {
            return null;
        }

        Long empId = userOpt.get().getEmpId();
        Optional<EmployeeMaster> empOpt = employeeMasterRepo.findById(empId);
        if (empOpt.isEmpty()) {
            return null;
        }

        EmployeeMaster emp = empOpt.get();

        StringBuilder footer = new StringBuilder();
        
        // 1. Title + Name
        String titleStr = emp.getTitle() != null && !emp.getTitle().isBlank() ? emp.getTitle().trim() : "";
        String nameStr = emp.getEmployeeName() != null && !emp.getEmployeeName().isBlank() ? emp.getEmployeeName().trim() : "";
        if (!titleStr.isEmpty()) {
            if (!titleStr.endsWith(".")) {
                titleStr = titleStr + ".";
            }
            footer.append(titleStr).append(" ");
        }
        footer.append(nameStr).append("\n");

        // 2. Designation - Department
        String designationStr = "";
        if (emp.getOrganization() != null && emp.getOrganization().getDesignation() != null) {
            designationStr = emp.getOrganization().getDesignation().getDesignationName();
        }
        String departmentStr = "";
        if (emp.getOrganization() != null && emp.getOrganization().getDepartment() != null) {
            departmentStr = emp.getOrganization().getDepartment().getDepartmentName();
        }

        if (designationStr != null && !designationStr.isBlank()) {
            footer.append(designationStr.trim());
            if (departmentStr != null && !departmentStr.isBlank()) {
                footer.append(" – ").append(departmentStr.trim());
            }
            footer.append("\n");
        } else if (departmentStr != null && !departmentStr.isBlank()) {
            footer.append(departmentStr.trim()).append("\n");
        }

        // 3. Official Email ID
        String emailStr = officeEmail != null ? officeEmail.trim() : "";
        if (emailStr.isEmpty() && employeeJobProfileRepo != null) {
            emailStr = employeeJobProfileRepo.findByEmployeeId(empId)
                    .map(EmployeeJobProfile::getOfficeEmail)
                    .orElse("");
        }
        if (!emailStr.isEmpty()) {
            footer.append(emailStr).append("\n");
        }

        // 4. Official Contact Number
        String phoneStr = "";
        if (employeeJobProfileRepo != null) {
            try {
                Optional<EmployeeJobProfile> jpOpt = employeeJobProfileRepo.findByEmployeeId(empId);
                if (jpOpt.isPresent()) {
                    EmployeeJobProfile jp = jpOpt.get();
                    String c1 = jp.getCompanyContact1() != null ? jp.getCompanyContact1().trim() : "";
                    String c2 = jp.getCompanyContact2() != null ? jp.getCompanyContact2().trim() : "";
                    if (!c1.isEmpty()) {
                        phoneStr = c1;
                    } else if (!c2.isEmpty()) {
                        phoneStr = c2;
                    }
                }
            } catch (Exception ex) {
                log.warn("[EMAIL ENGINE] Failed to query EmployeeJobProfile: {}", ex.getMessage());
            }
        }
        if (!phoneStr.isEmpty()) {
            if (!phoneStr.startsWith("+") && !phoneStr.startsWith("0")) {
                footer.append("+91 ").append(phoneStr).append("\n");
            } else {
                footer.append(phoneStr).append("\n");
            }
        }

        return footer.toString().trim();
    }

    private String extractBaseUrl(String urlStr) {
        if (urlStr == null || urlStr.isBlank()) return "";
        try {
            java.net.URI uri = new java.net.URI(urlStr);
            String scheme = uri.getScheme();
            String authority = uri.getAuthority();
            if (scheme != null && authority != null) {
                return scheme + "://" + authority;
            }
        } catch (Exception e) {
            // fallback
        }
        return "";
    }

    private String getLogoUrl(String logoFileName, String baseUrl) {
        if (logoFileName == null || logoFileName.isBlank()) return "";
        
        // 1. If we have a base URL, use the absolute HTTP URL (standard for production and email clients)
        if (baseUrl != null && !baseUrl.isBlank()) {
            try {
                return baseUrl + "/api/company-profile/image?fileNameParam=" + java.net.URLEncoder.encode(logoFileName, "UTF-8");
            } catch (Exception e) {
                return baseUrl + "/api/company-profile/image?fileNameParam=" + logoFileName;
            }
        }

        // 2. Fallback to base64 Data URI for local browser preview only (when baseUrl is empty)
        if (fileService != null) {
            try {
                org.springframework.core.io.Resource resource = fileService.loadFile(logoFileName);
                if (resource != null && resource.exists()) {
                    byte[] bytes;
                    try (java.io.InputStream is = resource.getInputStream()) {
                        bytes = is.readAllBytes();
                    }
                    String base64 = java.util.Base64.getEncoder().encodeToString(bytes);
                    String contentType = "image/png"; // default fallback
                    try {
                        String probed = java.nio.file.Files.probeContentType(resource.getFile().toPath());
                        if (probed != null && !probed.isBlank()) {
                            contentType = probed;
                        }
                    } catch (Exception ignored) {}
                    return "data:" + contentType + ";base64," + base64;
                }
            } catch (Exception e) {
                log.warn("[EMAIL ENGINE] Failed to convert logo file '{}' to base64 Data URI: {}", logoFileName, e.getMessage());
            }
        }

        // 3. Last resort relative fallback
        return "/api/company-profile/image?fileNameParam=" + logoFileName;
    }
}




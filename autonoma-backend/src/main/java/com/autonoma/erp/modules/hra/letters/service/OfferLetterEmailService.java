/*
 * Organization: Nutech
 * Owner: Logaraj S
 * Created At: 2026-08-30
 * Updated By: Logaraj S
 * Updated At: 2026-09-01
 * Description: Offer-letter email preview and send. Preview does not persist
 *              portal tokens; send mints a token then delegates SMTP to EmailSendingService.
 */
package com.autonoma.erp.modules.hra.letters.service;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeOfficeMailCredentials;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeContact;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeePersonalDetail;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeContactRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeePersonalDetailRepository;
import com.autonoma.erp.modules.hr.employee.service.EmployeeMasterService;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository;
import com.autonoma.erp.modules.hra.letters.entity.HraLetter;
import com.autonoma.erp.modules.hra.letters.repository.HraLetterRepository;
import com.autonoma.erp.modules.hra.recruitment.service.ApplicantPortalTokenService;
import com.autonoma.erp.modules.hra.recruitment.service.AtsStatusResolver;
import com.autonoma.erp.modules.platform.notification.entity.EmailContent;
import com.autonoma.erp.modules.platform.notification.service.EmailContentService;
import com.autonoma.erp.modules.platform.notification.service.EmailDefaultTemplates;
import com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine;
import com.autonoma.erp.service.admin.CompanyCredentialService;
import com.autonoma.erp.service.admin.EmailSendingService;
import com.autonoma.erp.util.SecurityUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.*;

@Service
@Slf4j
public class OfferLetterEmailService {

    private final EmployeeMasterRepository employeeRepo;
    private final EmployeePersonalDetailRepository personalRepo;
    private final EmployeeContactRepository contactRepo;
    private final DepartmentRepository departmentRepo;
    private final DesignationRepository designationRepo;
    private final HraLetterRepository letterRepo;
    private final EmailContentService emailContentService;
    private final EmailDefaultTemplates emailDefaultTemplates;
    private final EmailTemplateEngine emailTemplateEngine;
    private final ApplicantPortalTokenService portalTokenService;
    private final CompanyCredentialService companyCredentialService;
    private final EmployeeMasterService employeeMasterService;
    private final AtsStatusResolver statusResolver;
    private final EmailSendingService emailSendingService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public OfferLetterEmailService(
            EmployeeMasterRepository employeeRepo,
            EmployeePersonalDetailRepository personalRepo,
            EmployeeContactRepository contactRepo,
            DepartmentRepository departmentRepo,
            DesignationRepository designationRepo,
            HraLetterRepository letterRepo,
            EmailContentService emailContentService,
            EmailDefaultTemplates emailDefaultTemplates,
            EmailTemplateEngine emailTemplateEngine,
            ApplicantPortalTokenService portalTokenService,
            CompanyCredentialService companyCredentialService,
            EmployeeMasterService employeeMasterService,
            AtsStatusResolver statusResolver,
            EmailSendingService emailSendingService
    ) {
        this.employeeRepo = employeeRepo;
        this.personalRepo = personalRepo;
        this.contactRepo = contactRepo;
        this.departmentRepo = departmentRepo;
        this.designationRepo = designationRepo;
        this.letterRepo = letterRepo;
        this.emailContentService = emailContentService;
        this.emailDefaultTemplates = emailDefaultTemplates;
        this.emailTemplateEngine = emailTemplateEngine;
        this.portalTokenService = portalTokenService;
        this.companyCredentialService = companyCredentialService;
        this.employeeMasterService = employeeMasterService;
        this.statusResolver = statusResolver;
        this.emailSendingService = emailSendingService;
    }

    @Data
    public static class EmailSenderDetails {
        private String username;
        private String password;
        private String senderName;
        private boolean isCompanyFallback;

        public EmailSenderDetails() {}

        public EmailSenderDetails(String username, String password, String senderName, boolean isCompanyFallback) {
            this.username = username;
            this.password = password;
            this.senderName = senderName;
            this.isCompanyFallback = isCompanyFallback;
        }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getSenderName() { return senderName; }
        public void setSenderName(String senderName) { this.senderName = senderName; }
        public boolean isCompanyFallback() { return isCompanyFallback; }
        public void setCompanyFallback(boolean companyFallback) { isCompanyFallback = companyFallback; }
    }

    public EmailSenderDetails resolveEmailSenderDetails(String currentUserId) {
        String username = null;
        String password = null;
        String senderName = null;
        boolean isFallback = false;

        if (currentUserId != null) {
            Long empId = SecurityUtils.getCurrentUserEmpId();
            if (empId != null) {
                Optional<EmployeeMaster> senderEmpOpt = employeeRepo.findById(empId);
                if (senderEmpOpt.isPresent()) {
                    EmployeeMaster senderEmp = senderEmpOpt.get();
                    EmployeeOfficeMailCredentials credentials = employeeMasterService.getOfficeMailCredentials(empId);
                    if (credentials != null && credentials.getOfficeEmail() != null && !credentials.getOfficeEmail().trim().isEmpty()) {
                        username = credentials.getOfficeEmail().trim();
                        password = credentials.getOfficialPassword() != null ? credentials.getOfficialPassword().trim() : null;
                        senderName = senderEmp.getEmployeeName();
                    }
                }
            }
        }

        if (username == null || password == null) {
            CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
            if (company != null && company.getSmtpUsername() != null && !company.getSmtpUsername().trim().isEmpty() &&
                    company.getSmtpPassword() != null && !company.getSmtpPassword().trim().isEmpty()) {
                username = company.getSmtpUsername().trim();
                password = company.getSmtpPassword().trim();
                senderName = company.getCompanyName();
                isFallback = true;
            }
        }

        return new EmailSenderDetails(username, password, senderName, isFallback);
    }

    public Map<String, Object> getEmailSenderInfo() {
        String currentUserId = SecurityUtils.getCurrentUserId();
        EmailSenderDetails details = resolveEmailSenderDetails(currentUserId);
        Map<String, Object> map = new HashMap<>();
        map.put("email", details.getUsername() != null ? details.getUsername() : "");
        map.put("isCompanyFallback", details.isCompanyFallback());
        return map;
    }

    public String resolveOrigin(HttpServletRequest request) {
        if (request == null) {
            return "http://localhost:3000";
        }
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            String referer = request.getHeader("Referer");
            if (referer != null && !referer.isBlank()) {
                try {
                    java.net.URI uri = new java.net.URI(referer);
                    origin = uri.getScheme() + "://" + uri.getAuthority();
                } catch (Exception e) {
                    origin = null;
                }
            }
        }
        if (origin == null || origin.isBlank()) {
            origin = "http://" + request.getServerName() + (request.getServerPort() == 80 || request.getServerPort() == 443 ? "" : ":" + request.getServerPort());
        }
        return origin;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> previewOfferLetterEmail(Map<String, Object> payload, HttpServletRequest request) {
        if (payload == null) {
            payload = new HashMap<>();
        }

        HraLetter letter = null;
        Long offerLetterId = getLongValue(payload, "offerLetterId");
        if (offerLetterId == null) {
            offerLetterId = getLongValue(payload, "letterId");
        }
        if (offerLetterId == null && payload.get("id") != null) {
            try {
                offerLetterId = Long.valueOf(payload.get("id").toString());
            } catch (Exception ignored) {}
        }

        if (offerLetterId != null) {
            letter = letterRepo.findById(offerLetterId).orElse(null);
        }

        Long applicantId = getLongValue(payload, "applicantId");
        if (applicantId == null && letter == null && payload.get("id") != null) {
            try {
                applicantId = Long.valueOf(payload.get("id").toString());
            } catch (Exception ignored) {}
        }

        EmployeeMaster applicant = null;
        if (applicantId != null) {
            applicant = employeeRepo.findById(applicantId).orElse(null);
        }

        // If letter is present and applicant is still null, try finding by employeeCode or email
        if (applicant == null && letter != null) {
            if (letter.getEmployeeCode() != null && !letter.getEmployeeCode().isBlank()) {
                String code = letter.getEmployeeCode().trim();
                applicant = employeeRepo.findByApplicantCode(code)
                        .or(() -> employeeRepo.findByEmpCode(code))
                        .orElse(null);
            }
        }

        Map<String, Object> formDataMap = new HashMap<>();
        if (letter != null && letter.getFormData() != null && !letter.getFormData().isBlank()) {
            try {
                formDataMap = objectMapper.readValue(letter.getFormData(), Map.class);
            } catch (Exception e) {
                log.warn("Failed to parse formData JSON from HraLetter ID: {}", letter.getId());
            }
        } else if (payload.containsKey("formData") && payload.get("formData") != null) {
            try {
                Object fDataObj = payload.get("formData");
                if (fDataObj instanceof Map) {
                    formDataMap = (Map<String, Object>) fDataObj;
                } else if (fDataObj instanceof String && !((String) fDataObj).isBlank()) {
                    formDataMap = objectMapper.readValue((String) fDataObj, Map.class);
                }
            } catch (Exception e) {
                log.warn("Failed to parse formData from payload");
            }
        }

        EmailContent template = emailContentService.getTemplateOrThrow("OFFER LETTER");

        String currentUserId = SecurityUtils.getCurrentUserId();
        String senderName = "";
        String hrEmail = "";

        if (currentUserId != null) {
            Long empId = SecurityUtils.getCurrentUserEmpId();
            if (empId != null) {
                Optional<EmployeeMaster> senderEmpOpt = employeeRepo.findById(empId);
                if (senderEmpOpt.isPresent()) {
                    senderName = senderEmpOpt.get().getEmployeeName() != null ? senderEmpOpt.get().getEmployeeName() : "";
                    hrEmail = senderEmpOpt.get().getOfficeMail() != null ? senderEmpOpt.get().getOfficeMail() : "";
                }
            }
        }

        String origin = resolveOrigin(request);
        CompanyCredential company = companyCredentialService.getCompanyProfileForCurrentTenant().orElse(null);
        if (senderName.isEmpty() && company != null && company.getCompanyName() != null) {
            senderName = company.getCompanyName().trim();
        }
        String companyName = getStringValue(payload, "companyName");
        if (companyName.isEmpty() && formDataMap.containsKey("companyInfo") && formDataMap.get("companyInfo") instanceof Map) {
            Map<String, Object> cInfo = (Map<String, Object>) formDataMap.get("companyInfo");
            if (cInfo.containsKey("companyName") && cInfo.get("companyName") != null) {
                companyName = String.valueOf(cInfo.get("companyName")).trim();
            }
        }
        if (companyName.isEmpty() && company != null && company.getCompanyName() != null && !company.getCompanyName().isBlank()) {
            companyName = company.getCompanyName().trim();
        }

        String companyAddress = getStringValue(payload, "companyAddress");
        if (companyAddress.isEmpty() && formDataMap.containsKey("companyInfo") && formDataMap.get("companyInfo") instanceof Map) {
            Map<String, Object> cInfo = (Map<String, Object>) formDataMap.get("companyInfo");
            if (cInfo.containsKey("companyAddress") && cInfo.get("companyAddress") != null) {
                companyAddress = String.valueOf(cInfo.get("companyAddress")).trim();
            }
        }
        if (companyAddress.isEmpty() && company != null) {
            companyAddress = ((company.getAddress() != null ? company.getAddress() : "") + ", " +
                    (company.getCity() != null ? company.getCity() : "") + " - " +
                    (company.getPincode() != null ? company.getPincode() : "")).replaceAll("^,\\s*", "").replaceAll("-\\s*$", "").trim();
        }

        String tokenSubject = getStringValue(payload, "applicantCode");
        if (tokenSubject.isEmpty()) {
            tokenSubject = applicant != null && applicant.getApplicantCode() != null && !applicant.getApplicantCode().isBlank()
                    ? applicant.getApplicantCode().trim()
                    : (letter != null && letter.getEmployeeCode() != null && !letter.getEmployeeCode().isBlank() ? letter.getEmployeeCode().trim() : "");
        }

        // Preview must not persist a portal token. Send generates the token just before dispatch.
        String portalLink = getStringValue(payload, "portalLink");
        if (portalLink.isEmpty()) {
            portalLink = origin + "/candidate/onboarding";
        }

        String candidateFullName = getStringValue(payload, "candidateName");
        if (candidateFullName.isEmpty() && formDataMap.containsKey("candidateName") && formDataMap.get("candidateName") != null) {
            candidateFullName = String.valueOf(formDataMap.get("candidateName")).trim();
        }
        if (candidateFullName.isEmpty() && applicant != null) {
            candidateFullName = applicant.getFirstName() != null ? applicant.getFirstName().trim() : "";
            if (applicant.getLastName() != null && !applicant.getLastName().isBlank()) {
                candidateFullName = (candidateFullName + " " + applicant.getLastName().trim()).trim();
            }
            if (candidateFullName.isEmpty() && applicant.getEmployeeName() != null) {
                candidateFullName = applicant.getEmployeeName().trim();
            }
        }
        if (candidateFullName.isEmpty() && letter != null && letter.getEmployeeName() != null) {
            candidateFullName = letter.getEmployeeName().trim();
        }
        if (candidateFullName.isEmpty()) {
            candidateFullName = "Candidate";
        }
        String candidateFirstName = EmailTemplateEngine.getCandidateFirstName(candidateFullName);

        String candidateEmail = getStringValue(payload, "toEmail");
        if (candidateEmail.isEmpty()) {
            if (formDataMap.containsKey("email") && formDataMap.get("email") != null) {
                candidateEmail = formDataMap.get("email").toString().trim();
            } else if (formDataMap.containsKey("personalEmail") && formDataMap.get("personalEmail") != null) {
                candidateEmail = formDataMap.get("personalEmail").toString().trim();
            } else if (applicant != null) {
                Optional<EmployeePersonalDetail> personalOpt = personalRepo.findFirstByEmployeeId(applicant.getId());
                candidateEmail = personalOpt.map(EmployeePersonalDetail::getPersonalEmail).orElse(applicant.getOfficeMail() != null ? applicant.getOfficeMail() : "");
            }
        }

        String candidateMobile = getStringValue(payload, "phone");
        if (candidateMobile.isEmpty()) {
            if (formDataMap.containsKey("phone") && formDataMap.get("phone") != null) {
                candidateMobile = formDataMap.get("phone").toString().trim();
            } else if (formDataMap.containsKey("mobileNo") && formDataMap.get("mobileNo") != null) {
                candidateMobile = formDataMap.get("mobileNo").toString().trim();
            } else if (applicant != null) {
                Optional<EmployeeContact> contactOpt = contactRepo.findByEmployeeId(applicant.getId());
                candidateMobile = contactOpt.map(EmployeeContact::getMobile).orElse("");
            }
        }

        String departmentName = getStringValue(payload, "department");
        if (departmentName.isEmpty() && formDataMap.containsKey("department") && formDataMap.get("department") != null) {
            departmentName = String.valueOf(formDataMap.get("department")).trim();
        }
        if (departmentName.isEmpty() && letter != null && letter.getDepartment() != null) {
            departmentName = letter.getDepartment();
        }
        if (departmentName.isEmpty() && applicant != null && applicant.getDepartmentId() != null) {
            departmentName = departmentRepo.findById(applicant.getDepartmentId()).map(Department::getDepartmentName).orElse("");
        }

        String position = getStringValue(payload, "position");
        if (position.isEmpty()) {
            position = getStringValue(payload, "designation");
        }
        if (position.isEmpty() && formDataMap.containsKey("designation") && formDataMap.get("designation") != null) {
            position = String.valueOf(formDataMap.get("designation")).trim();
        }
        if (position.isEmpty() && letter != null && letter.getDesignation() != null) {
            position = letter.getDesignation();
        }
        if (position.isEmpty() && applicant != null && applicant.getDesignationId() != null) {
            position = designationRepo.findById(applicant.getDesignationId()).map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName).orElse("");
        }

        String offerNumber = getStringValue(payload, "offerLetterNo");
        if (offerNumber.isEmpty()) {
            offerNumber = getStringValue(payload, "refNo");
        }
        if (offerNumber.isEmpty() && letter != null && letter.getRefNo() != null) {
            offerNumber = letter.getRefNo();
        }
        if (offerNumber.isEmpty() && formDataMap.containsKey("offerLetterNo")) {
            offerNumber = String.valueOf(formDataMap.get("offerLetterNo"));
        }
        if (offerNumber.isEmpty() && formDataMap.containsKey("refNo")) {
            offerNumber = String.valueOf(formDataMap.get("refNo"));
        }

        String joiningDate = getStringValue(payload, "joiningDate");
        if (joiningDate.isEmpty() && formDataMap.containsKey("joiningDate")) {
            joiningDate = String.valueOf(formDataMap.get("joiningDate"));
        }

        Map<String, Object> compensation = (Map<String, Object>) formDataMap.getOrDefault("compensation", new HashMap<>());
        String totalCTC = getStringValue(payload, "totalCTC");
        if (totalCTC.isEmpty() && compensation.containsKey("totalCTC")) {
            totalCTC = String.valueOf(compensation.get("totalCTC"));
        }
        if (!totalCTC.isEmpty() && !totalCTC.contains("₹") && !totalCTC.toLowerCase().contains("rs")) {
            try {
                double num = Double.parseDouble(totalCTC.replaceAll("[^0-9.]", ""));
                totalCTC = String.format("₹%,.0f / Annum", num);
            } catch (Exception ignored) {}
        }

        String basicSalary = getStringValue(payload, "basicSalary");
        if (basicSalary.isEmpty() && compensation.containsKey("basicPay")) {
            basicSalary = String.valueOf(compensation.get("basicPay"));
        }
        if (!basicSalary.isEmpty() && !basicSalary.contains("₹") && !basicSalary.toLowerCase().contains("rs")) {
            try {
                double num = Double.parseDouble(basicSalary.replaceAll("[^0-9.]", ""));
                basicSalary = String.format("₹%,.0f", num);
            } catch (Exception ignored) {}
        }

        String validityDays = getStringValue(payload, "validityDays");
        if (validityDays.isEmpty()) {
            validityDays = "2";
        }

        Map<String, Object> placeholders = new HashMap<>();
        placeholders.put("candidateName", candidateFirstName);
        placeholders.put("candidateFirstName", candidateFirstName);
        placeholders.put("candidateFullName", candidateFullName);
        placeholders.put("candidateEmail", candidateEmail);
        placeholders.put("candidatePhone", candidateMobile);
        placeholders.put("applicantCode", tokenSubject);
        placeholders.put("candidateCode", tokenSubject);
        placeholders.put("position", position);
        placeholders.put("designation", position);
        placeholders.put("department", departmentName);
        placeholders.put("departmentName", departmentName);
        placeholders.put("companyName", companyName);
        placeholders.put("companyAddress", companyAddress);
        placeholders.put("onboardingPortalLink", portalLink);
        placeholders.put("offerNumber", offerNumber);
        placeholders.put("offerLetterNo", offerNumber);
        placeholders.put("refNo", offerNumber);
        placeholders.put("joiningDate", joiningDate);
        placeholders.put("annualCTC", totalCTC);
        placeholders.put("totalCTC", totalCTC);
        placeholders.put("basicSalary", basicSalary);
        placeholders.put("basicPay", basicSalary);
        placeholders.put("validityDays", validityDays);
        placeholders.put("hrName", senderName);
        placeholders.put("hrEmail", hrEmail);
        placeholders.put("hrPhone", "");
        placeholders.put("currentDate", new SimpleDateFormat("dd-MM-yyyy").format(new Date()));
        placeholders.put("currentYear", String.valueOf(Calendar.getInstance().get(Calendar.YEAR)));

        EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine.render(template, placeholders);

        Map<String, Object> response = new HashMap<>();
        response.putAll(placeholders); // Include all resolved placeholders in root for send reuse
        response.put("placeholders", placeholders);
        response.put("subject", rendered.getSubject());
        response.put("bodyContent", rendered.getBodyContent());
        response.put("fullMasterHtml", rendered.getFullMasterHtml());
        response.put("htmlPreview", rendered.getFullMasterHtml());
        response.put("yoursWindfully", template.getYoursWindfully());
        response.put("portalLink", portalLink);
        return response;
    }

    @Transactional
    public Map<String, Object> sendOfferLetterEmail(Map<String, Object> payload, HttpServletRequest request) {
        if (payload == null) {
            throw new IllegalArgumentException("Payload cannot be null.");
        }

        Long offerLetterId = getLongValue(payload, "offerLetterId");
        if (offerLetterId == null) {
            offerLetterId = getLongValue(payload, "letterId");
        }

        Long applicantId = getLongValue(payload, "applicantId");
        if (applicantId == null && offerLetterId == null && payload.get("id") != null) {
            try {
                Long rawId = Long.valueOf(payload.get("id").toString());
                if (letterRepo.existsById(rawId)) {
                    offerLetterId = rawId;
                } else {
                    applicantId = rawId;
                }
            } catch (Exception ignored) {}
        }

        HraLetter letter = null;
        if (offerLetterId != null) {
            letter = letterRepo.findById(offerLetterId).orElse(null);
        }

        EmployeeMaster applicant = null;
        if (applicantId != null) {
            applicant = employeeRepo.findById(applicantId).orElse(null);
        } else if (letter != null && letter.getEmployeeCode() != null && !letter.getEmployeeCode().isBlank()) {
            String code = letter.getEmployeeCode().trim();
            applicant = employeeRepo.findByApplicantCode(code)
                    .or(() -> employeeRepo.findByEmpCode(code))
                    .orElse(null);
        }

        String toEmail = getStringValue(payload, "toEmail");
        String ccEmail = getStringValue(payload, "ccEmail");
        String customSubject = getStringValue(payload, "customSubject");
        String customBody = getStringValue(payload, "customBody");

        if (toEmail.isEmpty()) {
            throw new IllegalArgumentException("Recipient 'To' email address is required.");
        }

        String currentUserId = SecurityUtils.getCurrentUserId();
        Boolean useCompanyMail = payload.get("useCompanyMail") != null &&
                ("true".equalsIgnoreCase(payload.get("useCompanyMail").toString()) ||
                        Boolean.TRUE.equals(payload.get("useCompanyMail")));

        Long candidateId = applicant != null ? applicant.getId() : (letter != null ? letter.getApplicantId() : null);
        if (candidateId == null) {
            throw new IllegalArgumentException("Cannot send the offer letter: the applicant could not be resolved.");
        }

        String tokenSubject = getStringValue(payload, "applicantCode");
        if (tokenSubject.isEmpty() && letter != null && letter.getEmployeeCode() != null) {
            tokenSubject = letter.getEmployeeCode().trim();
        }
        if (tokenSubject.isEmpty() && applicant != null && applicant.getApplicantCode() != null) {
            tokenSubject = applicant.getApplicantCode().trim();
        }
        String origin = resolveOrigin(request);
        String token = portalTokenService.generateAndSaveToken(
                candidateId, "OFFER_LETTER", tokenSubject, currentUserId != null ? currentUserId : "SYSTEM");
        payload.put("portalLink", String.format("%s/candidate/onboarding?token=%s", origin, token));

        Map<String, Object> previewMap = previewOfferLetterEmail(payload, request);
        Map<String, Object> resolvedPlaceholders = extractPlaceholdersFromPreview(previewMap);

        EmailContent templateEntity = emailContentService.getTemplateOrThrow("OFFER LETTER");
        if (customSubject != null && !customSubject.isBlank()) {
            templateEntity.setSubject(customSubject);
        }
        if (customBody != null && !customBody.isBlank()) {
            templateEntity.setBodyContent(customBody);
        }

        EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine.render(templateEntity, resolvedPlaceholders);
        String finalSubject = (customSubject != null && !customSubject.isBlank()) ? customSubject : rendered.getSubject();
        String finalHtmlBody = rendered.getFullMasterHtml();

        List<Map<String, Object>> attachments = new ArrayList<>();
        String pdfBase64 = getStringValue(payload, "pdfBase64");
        if (pdfBase64.isEmpty()) {
            pdfBase64 = getStringValue(payload, "pdfData");
        }
        if (!pdfBase64.isEmpty()) {
            try {
                String cleanBase64 = pdfBase64.contains(",") ? pdfBase64.substring(pdfBase64.indexOf(",") + 1) : pdfBase64;
                byte[] pdfBytes = Base64.getDecoder().decode(cleanBase64.trim());
                String pdfFileName = getStringValue(payload, "pdfFileName");
                if (pdfFileName.isEmpty()) {
                    pdfFileName = getStringValue(payload, "fileName");
                }
                if (pdfFileName.isEmpty() && letter != null && letter.getRefNo() != null) {
                    pdfFileName = "Offer_Letter_" + letter.getRefNo().replaceAll("[^a-zA-Z0-9_.-]", "_") + ".pdf";
                }
                if (pdfFileName.isEmpty()) {
                    pdfFileName = "Offer_Letter.pdf";
                }
                if (!pdfFileName.toLowerCase().endsWith(".pdf")) {
                    pdfFileName += ".pdf";
                }
                Map<String, Object> attachment = new HashMap<>();
                attachment.put("fileName", pdfFileName);
                attachment.put("content", pdfBytes);
                attachments.add(attachment);
            } catch (Exception attachEx) {
                log.error("[Offer Letter Email] Failed to decode Offer Letter PDF: {}", attachEx.getMessage(), attachEx);
                throw new RuntimeException("Unable to attach Offer Letter PDF: " + attachEx.getMessage());
            }
        }

        try {
            boolean sent = emailSendingService.sendEmailWithAttachments(
                    toEmail, ccEmail, null, finalSubject, finalHtmlBody, attachments, useCompanyMail, "ATS");
            if (!sent) {
                throw new IllegalStateException("Email could not be sent. SMTP is not configured or the send was blocked.");
            }
            log.info("[Offer Letter Email] Successfully dispatched offer letter to {}", toEmail);

            com.autonoma.erp.modules.platform.common.entity.StatusMaster targetStatus = statusResolver.get("Sent");
            if (applicant != null) {
                com.autonoma.erp.modules.platform.common.entity.StatusMaster currentStatusObj = applicant.getOfferStatus();
                String currentStatus = currentStatusObj != null ? currentStatusObj.getName() : null;
                if (currentStatus != null && "SENT".equalsIgnoreCase(currentStatus.trim())) {
                    targetStatus = statusResolver.get("Resent");
                }
                applicant.setOfferStatus(targetStatus);
                employeeRepo.save(applicant);
            }

            if (letter != null) {
                letter.setStatus(targetStatus != null ? targetStatus : statusResolver.get("Sent"));
                try {
                    Map<String, Object> fData = new HashMap<>();
                    if (letter.getFormData() != null && !letter.getFormData().isBlank()) {
                        fData = objectMapper.readValue(letter.getFormData(), Map.class);
                    }
                    fData.put("status", "Sent");
                    fData.put("emailStatus", "Sent");
                    fData.put("sentDate", new SimpleDateFormat("yyyy-MM-dd HH:mm").format(new Date()));
                    letter.setFormData(objectMapper.writeValueAsString(fData));
                } catch (Exception e) {
                    log.warn("Failed to update formData email status for HraLetter ID: {}", letter.getId());
                }
                letterRepo.save(letter);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Offer letter email successfully sent to " + toEmail + ".");
            return result;

        } catch (Exception e) {
            log.error("[Offer Letter Email] Failed to send email: {}", e.getMessage(), e);
            String friendlyMsg = EmailSendingService.translateMailException(e);
            throw new RuntimeException(friendlyMsg);
        }
    }

    private Map<String, Object> extractPlaceholdersFromPreview(Map<String, Object> previewMap) {
        Map<String, Object> map = new HashMap<>();
        if (previewMap != null) {
            if (previewMap.get("placeholders") instanceof Map) {
                map.putAll((Map<String, Object>) previewMap.get("placeholders"));
            }
            map.putAll(previewMap);
        }
        return map;
    }

    private Long getLongValue(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key) || map.get(key) == null) {
            return null;
        }
        try {
            return Long.valueOf(map.get(key).toString().trim());
        } catch (Exception e) {
            return null;
        }
    }

    private String getStringValue(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key) || map.get(key) == null) {
            return "";
        }
        return map.get(key).toString().trim();
    }
}

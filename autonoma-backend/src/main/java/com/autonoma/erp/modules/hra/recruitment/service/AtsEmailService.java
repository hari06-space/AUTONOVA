package com.autonoma.erp.modules.hra.recruitment.service;

import com.autonoma.erp.modules.platform.notification.entity.EmailContent;
import com.autonoma.erp.modules.platform.notification.service.EmailContentService;
import com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine;
import com.autonoma.erp.service.admin.EmailSendingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeJobProfileRepository;

/**
 * AtsEmailService — Sends notification emails for ATS candidate status transitions.
 * Consumes active templates managed via Email Content Master.
 */
@Service
@Slf4j
public class AtsEmailService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AtsEmailService.class);

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeRepo;

    @Autowired
    private EmployeeJobProfileRepository employeeJobProfileRepo;

    @Autowired
    private com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository departmentRepo;

    @Autowired
    private com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository designationRepo;

    @Autowired(required = false)
    private EmailSendingService emailSendingService;

    @Autowired
    private EmailContentService emailContentService;

    @Autowired
    private EmailTemplateEngine emailTemplateEngine;

    @Value("${mail.from.address:hr@nutechwindparts.com}")
    private String fromAddress;

    private static final String COMPANY_NAME = "NUTECH WIND PARTS PVT LTD";
    private static final String COMPANY_ADDRESS = "Tamil Nadu, India";

    // ── Public entry point ──────────────────────────────────────
    public void sendStatusEmail(String candidateEmail, String candidateName,
                                String position, String newStatus,
                                String interviewDate, String interviewTime,
                                String interviewerName) {
        if (candidateEmail == null || candidateEmail.isBlank()) {
            log.warn("[ATS EMAIL] No candidate email — skipping for status {}", newStatus);
            return;
        }
        if (emailSendingService == null) {
            log.warn("[ATS EMAIL] EmailSendingService not available");
            return;
        }

        String emailType = mapStatusToEmailType(newStatus);
        if (emailType == null) {
            log.info("[ATS EMAIL] No mapped email type for status '{}' — skipping", newStatus);
            return;
        }

        EmailContent template = emailContentService.getTemplateOrThrow(emailType);

        Map<String, Object> placeholders = buildPlaceholderMap(candidateEmail, candidateName, position,
                interviewDate, interviewTime, interviewerName);

        EmailTemplateEngine.RenderedEmail rendered = emailTemplateEngine.render(template, placeholders);

        String finalBody = rendered.getFullMasterHtml();

        try {
            emailSendingService.sendEmailWithAttachments(candidateEmail, null, null, rendered.getSubject(), finalBody, null);
            log.info("[ATS EMAIL] Dynamic {} email sent to {}", emailType, candidateEmail);
        } catch (Exception e) {
            log.error("[ATS EMAIL] Failed to send email for status {}: {}", newStatus, e.getMessage());
        }
    }

    private String mapStatusToEmailType(String status) {
        if (status == null) return null;
        switch (status.toUpperCase().trim()) {
            case "INTERVIEWING":
                return "CALL LETTER";
            case "SELECTED":
                return "OFFER LETTER";
            default:
                return null;
        }
    }

    private Map<String, Object> buildPlaceholderMap(String candidateEmail, String candidateName,
                                                     String position, String interviewDate,
                                                     String interviewTime, String interviewerName) {
        String candidateFirstName = EmailTemplateEngine.getCandidateFirstName(candidateName);
        Map<String, Object> map = new HashMap<>();
        map.put("candidateName", candidateFirstName);
        map.put("candidateFirstName", candidateFirstName);
        map.put("candidateFullName", candidateName != null ? candidateName : "");
        map.put("candidateEmail", candidateEmail != null ? candidateEmail : "");

        String resolvedDept = "";
        String resolvedPosition = position != null ? position.trim() : "";

        if (candidateEmail != null && !candidateEmail.isBlank()) {
            com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster emp = null;
            Optional<EmployeeJobProfile> jpOpt = employeeJobProfileRepo.findByOfficeEmailIgnoreCase(candidateEmail.trim());
            if (jpOpt.isPresent()) {
                emp = employeeRepo.findById(jpOpt.get().getEmployeeId()).orElse(null);
            }
            if (emp == null) {
                List<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> list = employeeRepo.findByOfficeMailIgnoreCase(candidateEmail.trim());
                if (!list.isEmpty()) {
                    emp = list.get(0);
                }
            }
            if (emp != null) {
                if (emp.getDepartmentId() != null) {
                    resolvedDept = departmentRepo.findById(emp.getDepartmentId())
                            .map(com.autonoma.erp.modules.hr.orgstructure.entity.Department::getDepartmentName)
                            .orElse("");
                }
                if (resolvedPosition.isEmpty() && emp.getDesignationId() != null) {
                    resolvedPosition = designationRepo.findById(emp.getDesignationId())
                            .map(com.autonoma.erp.modules.hr.orgstructure.entity.Designation::getDesignationName)
                            .orElse("");
                }
            }
        }

        if (resolvedPosition.isEmpty()) {
            resolvedPosition = "Shortlisted Position";
        }

        map.put("position", resolvedPosition);
        map.put("designation", resolvedPosition);
        map.put("department", resolvedDept);
        map.put("interviewDate", interviewDate != null ? interviewDate : "");
        map.put("interviewTime", interviewTime != null ? interviewTime : "");
        map.put("interviewerName", interviewerName != null ? interviewerName : "HR Team");
        map.put("venue", COMPANY_ADDRESS);
        map.put("companyName", COMPANY_NAME);
        map.put("companyAddress", COMPANY_ADDRESS);
        map.put("hrName", "HR Team");
        map.put("hrEmail", fromAddress);
        map.put("hrPhone", "");
        map.put("validityDays", "2");
        map.put("currentDate", new SimpleDateFormat("dd-MM-yyyy").format(new Date()));
        map.put("currentYear", String.valueOf(Calendar.getInstance().get(Calendar.YEAR)));
        return map;
    }
}

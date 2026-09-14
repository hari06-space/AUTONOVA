package com.autonoma.erp.modules.qms.audit.controller;

import com.autonoma.erp.modules.qms.audit.entity.AuditSchedule;
import com.autonoma.erp.modules.qms.audit.service.AuditScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.autonoma.erp.security.RequirePagePermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/qms/audit-schedules")
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "QMS - Audit Schedule", description = "Endpoints for scheduling audits, assigning personnel, and criteria")
public class AuditScheduleController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuditScheduleController.class);

    @Autowired
    private AuditScheduleService service;

    @Autowired
    private com.autonoma.erp.service.admin.EmailSendingService emailSendingService;

    @Autowired
    private com.autonoma.erp.modules.qms.audit.repository.AuditScheduleRepository auditScheduleRepository;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url:http://localhost:3001}")
    private String frontendUrl;

    @PostMapping("/send-attendance-link")
    @Operation(summary = "Send Attendance Link Email", description = "Sends attendance link email to external auditor/customer contact")
    public ResponseEntity<?> sendAttendanceLinkEmail(@RequestBody java.util.Map<String, Object> payload) {
        try {
            String scheduleNo = (String) payload.get("scheduleNo");
            String toEmail = (String) payload.get("to");
            String ccEmail = (String) payload.get("cc");
            String subject = (String) payload.get("subject");
            String htmlBody = (String) payload.get("body");
            Boolean useCompanyMail = payload.get("useCompanyMail") != null ? (Boolean) payload.get("useCompanyMail") : false;

            if (toEmail == null || toEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Recipient email ('To') is required.");
            }

            if (subject == null || subject.trim().isEmpty()) {
                subject = "Audit Schedule Attendance Link: " + (scheduleNo != null ? scheduleNo : "");
            }

            if (htmlBody == null || htmlBody.trim().isEmpty()) {
                String link = frontendUrl + "/public/external-audit-attendance?scheduleNo=" + (scheduleNo != null ? scheduleNo : "") + "&email=" + java.net.URLEncoder.encode(toEmail.trim(), "UTF-8");
                htmlBody = "<html><body>"
                        + "<h3>Dear External Auditor / Contact,</h3>"
                        + "<p>You are scheduled for an audit (" + (scheduleNo != null ? scheduleNo : "") + ").</p>"
                        + "<p>Please mark your attendance by clicking the button below:</p>"
                        + "<a href=\"" + link + "\" style=\"display:inline-block;padding:10px 20px;background-color:#1e88e5;color:#fff;text-decoration:none;border-radius:4px;\">Mark IN</a>"
                        + "<p>This link is only valid for today.</p>"
                        + "<p>Regards,<br/>Autonoma QMS Team</p>"
                        + "</body></html>";
            }

            boolean sent = emailSendingService.sendEmailWithAttachments(toEmail.trim(), ccEmail, null, subject, htmlBody, null, useCompanyMail, "QMS_AUDIT");
            if (sent) {
                if (scheduleNo != null) {
                    auditScheduleRepository.findByScheduleNoIgnoreCase(scheduleNo).ifPresent(sch -> {
                        sch.setExternalLinkSent(true);
                        auditScheduleRepository.save(sch);
                    });
                }
                return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Attendance link email sent successfully!"));
            } else {
                return ResponseEntity.badRequest().body("Failed to send email. Please check your email credentials / mail settings.");
            }
        } catch (Exception e) {
            logger.error("Error sending attendance link email: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error sending email: " + e.getMessage());
        }
    }

    @GetMapping
    @Operation(summary = "Get All Audit Schedules", description = "Fetches a complete list of scheduled audits")
    public ResponseEntity<?> getAllAuditSchedules(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "searchValue", required = false) String searchValue,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "taskScope", required = false) String taskScope,
            @RequestParam(name = "currentUser", required = false) String currentUser,
            @RequestParam(name = "memberId", required = false) Long memberId,
            @RequestParam(name = "fromDate", required = false) String fromDate,
            @RequestParam(name = "toDate", required = false) String toDate,
            @RequestParam(name = "considerDate", required = false, defaultValue = "No") String considerDate) {
        if (page == null && size == null) {
            return ResponseEntity.ok(service.getAllAuditSchedules(taskScope, currentUser, memberId, fromDate, toDate, considerDate));
        }
        int cleanPage = page != null ? page : 0;
        int cleanSize = size != null ? size : 10;
        int cappedSize = Math.min(cleanSize, 100);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(cleanPage, cappedSize);
        return ResponseEntity.ok(service.searchAuditSchedules(status, searchValue, pageable, taskScope, currentUser, memberId, fromDate, toDate, considerDate));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditSchedule> getAuditScheduleById(@PathVariable Long id) {
        return service.getAuditScheduleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "QM1210", action = "write")
    @Operation(summary = "Create Audit Schedule", description = "Saves a new audit schedule with criteria and personnel")
    public ResponseEntity<?> createAuditSchedule(@Valid @RequestBody AuditSchedule auditSchedule) {
        logger.info("Attempting to create Audit Schedule: {}", auditSchedule.getScheduleNo());
        try {
            AuditSchedule created = service.createAuditSchedule(auditSchedule);
            logger.info("Successfully created Audit Schedule: {}", created.getScheduleNo());
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            logger.error("Failed to create Audit Schedule {}: {}", auditSchedule.getScheduleNo(), e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to create Audit Schedule {}: {}", auditSchedule.getScheduleNo(), e.getMessage(), e);
            return ResponseEntity.badRequest().body("An unexpected error occurred while saving the schedule.");
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1210", action = "write")
    public ResponseEntity<?> updateAuditSchedule(
            @PathVariable Long id,
            @Valid @RequestBody AuditSchedule auditSchedule,
            @RequestParam(name = "isReschedule", required = false, defaultValue = "false") Boolean isReschedule) {
        try {
            AuditSchedule updated = service.updateAuditSchedule(id, auditSchedule, isReschedule);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/cancel")
    @RequirePagePermission(pageCode = "QM1210", action = "write")
    public ResponseEntity<?> cancelAuditSchedule(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        try {
            String cancelReason = payload != null ? payload.get("cancelReason") : null;
            AuditSchedule cancelled = service.cancelAuditSchedule(id, cancelReason);
            return ResponseEntity.ok(cancelled);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1210", action = "delete")
    public ResponseEntity<?> deleteAuditSchedule(@PathVariable Long id) {
        try {
            service.deleteAuditSchedule(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/next-no")
    @Operation(summary = "Get Next Schedule Number", description = "Generates the next available SCH-XXXX number")
    public String getNextNo() {
        return service.getNextScheduleNo();
    }
}

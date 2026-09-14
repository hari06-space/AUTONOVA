package com.autonoma.erp.modules.platform.notification.service;

import com.autonoma.erp.modules.qms.audit.entity.AuditSchedule;
import com.autonoma.erp.modules.platform.notification.entity.AppNotification;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule;
import com.autonoma.erp.modules.hr.leave.entity.HrLeaveRequest;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.modules.induction.entity.InductionAssignment;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMomMaster;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails;
import com.autonoma.erp.modules.hra.leaveencashment.entity.HraLeaveEncashmentVerified;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.service.admin.EmailSendingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;

@Service
@Slf4j
public class NotificationService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationService.class);

    private final AppNotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailSendingService emailSendingService;
    private final UserRepository userRepository;
    private final com.autonoma.erp.modules.platform.notification.repository.EmailContentRepository emailContentRepository;
    private final com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine emailTemplateEngine;
    private final com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository;
    private final com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository;

    public NotificationService(
            AppNotificationRepository notificationRepository,
            @org.springframework.context.annotation.Lazy SimpMessagingTemplate messagingTemplate,
            EmailSendingService emailSendingService,
            UserRepository userRepository,
            com.autonoma.erp.modules.platform.notification.repository.EmailContentRepository emailContentRepository,
            com.autonoma.erp.modules.platform.notification.service.EmailTemplateEngine emailTemplateEngine,
            com.autonoma.erp.repository.admin.BosUserPageAuthRepository bosUserPageAuthRepository,
            com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepository) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.emailSendingService = emailSendingService;
        this.userRepository = userRepository;
        this.emailContentRepository = emailContentRepository;
        this.emailTemplateEngine = emailTemplateEngine;
        this.bosUserPageAuthRepository = bosUserPageAuthRepository;
        this.employeeMasterRepository = employeeMasterRepository;
    }

    public void sendMeetingNotification(String recipientName, String recipientEmail, String subject, String message) {
        log.info("Sending Meeting Notification to: {} <{}>", recipientName, recipientEmail);
        log.info("Subject: {}", subject);
        log.info("Message: {}", message);
        // Commented out to disable non-ATS emails (QMS, Leave, Induction)
        /*
        if (recipientEmail != null && !recipientEmail.trim().isEmpty()) {
            try {
                emailSendingService.sendEmailWithAttachments(recipientEmail, null, null, subject, message, null);
                log.info("[SMTP] Email sent successfully to {}", recipientEmail);
            } catch (Exception e) {
                log.error("[SMTP_FAILED] Failed to send email to {}: {}", recipientEmail, e.getMessage());
            }
        }
        */
    }

    private void pushRealTimeNotification(Long empId, AppNotification notification) {
        try {
            if (empId != null) {
                List<com.autonoma.erp.model.admin.UserCredential> users = userRepository.findByEmpId(empId);
                if (users.isEmpty()) {
                    userRepository.findFirstByEmpId(empId).ifPresent(users::add);
                }
                for (com.autonoma.erp.model.admin.UserCredential user : users) {
                    if (user.getUserId() != null) {
                        String uid = user.getUserId().trim();
                        log.info("[WS_PUSH] Pushing notification to user: {} - {}", uid, notification.getTitle());
                        messagingTemplate.convertAndSendToUser(uid, "/queue/notifications", notification);
                        messagingTemplate.convertAndSendToUser(uid.toLowerCase(), "/queue/notifications", notification);
                        messagingTemplate.convertAndSendToUser(uid.toUpperCase(), "/queue/notifications", notification);
                    }
                }
            }
            log.info("[WS_BROADCAST] Broadcasting real-time update to /topic/global-updates");
            messagingTemplate.convertAndSend("/topic/global-updates", notification);
        } catch (Exception e) {
            log.error("[WS_PUSH_FAILED] Failed to push notification via WebSocket: {}", e.getMessage());
        }
    }

    public void pushGlobalRealTimeUpdate(Object eventData) {
        try {
            log.info("[WS_BROADCAST] Broadcasting manual real-time event to /topic/global-updates");
            messagingTemplate.convertAndSend("/topic/global-updates", eventData != null ? eventData : "UPDATE");
        } catch (Exception e) {
            log.error("[WS_BROADCAST_FAILED] Failed to broadcast real-time update: {}", e.getMessage());
        }
    }

    public void notifyParticipants(String scheduleNo, String meetingName, String date, String time, List<String> participantEmails) {
        String subject = "New Meeting Scheduled: " + scheduleNo;
        String message = String.format(
            "Hello,\n\nYou have been assigned to a new meeting.\n\nMeeting: %s\nDate: %s\nTime: %s\nSchedule No: %s\n\nPlease ensure your attendance.",
            meetingName, date, time, scheduleNo
        );

        for (String email : participantEmails) {
            if (email != null && !email.isEmpty()) {
                log.info("Notifying participant: {} - {}", email, subject);
            }
        }
    }

    public void notifyUserAboutMeeting(EmployeeMaster recipient, QmsMeetingSchedule schedule, String actionType) {
        if (recipient == null || recipient.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());
        
        String meetingName = (schedule.getMeetingType() != null && schedule.getMeetingType().getMeetingName() != null) ? schedule.getMeetingType().getMeetingName() : "Meeting";

        if ("NEW".equalsIgnoreCase(actionType)) {
            notification.setTitle("New Meeting Assigned: " + schedule.getScheduleNo());
            notification.setMessage(String.format("You have been assigned to %s on %s at %s.", 
                meetingName, schedule.getMeetingDate(), schedule.getStartTime()));
        } else if ("UPDATE_TIME".equalsIgnoreCase(actionType)) {
            notification.setTitle("Meeting Rescheduled: " + schedule.getScheduleNo());
            notification.setMessage(String.format("%s is now scheduled for %s at %s.", 
                meetingName, schedule.getMeetingDate(), schedule.getStartTime()));
        }

        notification.setLinkUrl("/qms/meeting-attendance");
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);

        // Also trigger the existing email log logic
        // sendMeetingNotification(recipient.getEmployeeName(), recipient.getOfficeMail(), notification.getTitle(), notification.getMessage());
    }

    public void notifyUserAboutAudit(EmployeeMaster recipient, com.autonoma.erp.modules.qms.audit.entity.AuditSchedule schedule, String actionType) {
        if (recipient == null || recipient.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());

        String auditType = schedule.getAuditType() != null ? schedule.getAuditType() : "Audit";
        String auditArea = schedule.getAuditArea() != null ? schedule.getAuditArea() : "N/A";
        String auditDateStr = schedule.getAuditDate() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd").format(schedule.getAuditDate()) : "N/A";
        String timeStr = "";
        if (schedule.getStartTime() != null && !schedule.getStartTime().trim().isEmpty()) {
            timeStr += schedule.getStartTime().trim();
        }
        if (schedule.getEndTime() != null && !schedule.getEndTime().trim().isEmpty()) {
            if (!timeStr.isEmpty()) timeStr += " - ";
            timeStr += schedule.getEndTime().trim();
        }
        if (timeStr.isEmpty()) {
            timeStr = "N/A";
        }

        if ("CREATE".equalsIgnoreCase(actionType)) {
            notification.setTitle("New Audit Scheduled: " + schedule.getScheduleNo());
            notification.setMessage(String.format("You have a new audit scheduled.\nSchedule Number: %s\nAudit Type: %s\nAudit Area: %s\nAudit Date: %s\nTime: %s", 
                schedule.getScheduleNo(), auditType, auditArea, auditDateStr, timeStr));
        } else if ("UPDATE".equalsIgnoreCase(actionType)) {
            notification.setTitle("Audit Details Updated: " + schedule.getScheduleNo());
            notification.setMessage(String.format("Audit details have been updated.\nSchedule Number: %s\nAudit Type: %s\nAudit Area: %s\nAudit Date: %s\nTime: %s", 
                schedule.getScheduleNo(), auditType, auditArea, auditDateStr, timeStr));
        } else if ("RESCHEDULE".equalsIgnoreCase(actionType)) {
            notification.setTitle("Audit Rescheduled: " + schedule.getScheduleNo());
            notification.setMessage(String.format("Audit has been rescheduled.\nSchedule Number: %s\nAudit Type: %s\nAudit Area: %s\nAudit Date: %s\nTime: %s", 
                schedule.getScheduleNo(), auditType, auditArea, auditDateStr, timeStr));
        } else if ("CANCEL".equalsIgnoreCase(actionType)) {
            notification.setTitle("Audit Cancelled: " + schedule.getScheduleNo());
            notification.setMessage(String.format("Audit has been cancelled.\nSchedule Number: %s\nAudit Type: %s\nAudit Area: %s\nAudit Date: %s\nTime: %s", 
                schedule.getScheduleNo(), auditType, auditArea, auditDateStr, timeStr));
        } else if ("ASSIGN".equalsIgnoreCase(actionType)) {
            notification.setTitle("Audit Assigned: " + schedule.getScheduleNo());
            notification.setMessage(String.format("You have been assigned to audit.\nSchedule Number: %s\nAudit Type: %s\nAudit Area: %s\nAudit Date: %s\nTime: %s", 
                schedule.getScheduleNo(), auditType, auditArea, auditDateStr, timeStr));
        } else {
            notification.setTitle("Audit Notification: " + schedule.getScheduleNo());
            notification.setMessage(String.format("Audit Update.\nSchedule Number: %s\nAudit Type: %s\nAudit Area: %s\nAudit Date: %s\nTime: %s", 
                schedule.getScheduleNo(), auditType, auditArea, auditDateStr, timeStr));
        }

        notification.setLinkUrl("/qms/audit/schedule/edit/" + schedule.getId());
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);

        // sendMeetingNotification(recipient.getEmployeeName(), recipient.getOfficeMail(), notification.getTitle(), notification.getMessage());
    }

    public void notifyUserAboutLeave(EmployeeMaster recipient, HrLeaveRequest leave, String actionType) {
        if (recipient == null || recipient.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());

        if ("SUBMIT".equalsIgnoreCase(actionType)) {
            notification.setTitle("Leave Request Submitted: " + leave.getRequestNo());
            notification.setMessage(String.format("Leave request for %s days starting %s has been submitted.", 
                leave.getNumberOfDays(), leave.getStartDate()));
        } else if ("APPROVE".equalsIgnoreCase(actionType)) {
            notification.setTitle("Leave Request Approved: " + leave.getRequestNo());
            notification.setMessage(String.format("Your leave request for %s days starting %s has been approved.", 
                leave.getNumberOfDays(), leave.getStartDate()));
        } else if ("REJECT".equalsIgnoreCase(actionType)) {
            notification.setTitle("Leave Request Rejected: " + leave.getRequestNo());
            notification.setMessage(String.format("Your leave request for %s days starting %s has been rejected.", 
                leave.getNumberOfDays(), leave.getStartDate()));
        } else if ("CANCEL".equalsIgnoreCase(actionType)) {
            notification.setTitle("Leave Request Cancelled: " + leave.getRequestNo());
            notification.setMessage(String.format("Leave request for %s days starting %s has been cancelled.", 
                leave.getNumberOfDays(), leave.getStartDate()));
        }

        notification.setLinkUrl("/hra/holiday/my-requests");
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);

        sendMeetingNotification(recipient.getEmployeeName(), recipient.getOfficeMail(), notification.getTitle(), notification.getMessage());
    }

    public void notifyUserAboutAuditReminder(EmployeeMaster recipient, com.autonoma.erp.modules.qms.audit.entity.AuditSchedule schedule) {
        if (recipient == null || recipient.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());
        notification.setTitle("Upcoming Audit Reminder: " + schedule.getScheduleNo());
        
        String auditType = schedule.getAuditType() != null ? schedule.getAuditType() : "Audit";
        String auditArea = schedule.getAuditArea() != null ? schedule.getAuditArea() : "N/A";
        String timeStr = schedule.getStartTime() != null ? schedule.getStartTime() : "N/A";
        
        notification.setMessage(String.format("Reminder: You have an upcoming audit.\nSchedule Number: %s\nAudit Type: %s\nAudit Area: %s\nTime: %s\nStarts in 10 minutes. Please mark your attendance.",
            schedule.getScheduleNo(), auditType, auditArea, timeStr));
        
        notification.setLinkUrl("/qms/audit/attendance");
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);

        // sendMeetingNotification(recipient.getEmployeeName(), recipient.getOfficeMail(), notification.getTitle(), notification.getMessage());
    }

    public void notifyUserAboutChecklistAssignment(EmployeeMaster recipient, com.autonoma.erp.modules.qms.checklist.entity.MasterChecklist checklist, com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignment assignment) {
        if (recipient == null || recipient.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());
        notification.setTitle("Checklist Assigned: " + checklist.getSeqNo());
        notification.setMessage(String.format("You have been assigned to checklist %s.\nChecking Point: %s", 
            checklist.getSeqNo(), checklist.getCheckingPoint()));
        notification.setLinkUrl("/qms/checklist/close-renewal?viewId=" + assignment.getId());
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);

        // sendMeetingNotification(recipient.getEmployeeName(), recipient.getOfficeMail(), notification.getTitle(), notification.getMessage());
    }

    public void notifyUserAboutChecklistVerification(EmployeeMaster recipient, com.autonoma.erp.modules.qms.checklist.entity.MasterChecklist checklist, com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignment assignment, String employeeName) {
        if (recipient == null || recipient.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());
        notification.setTitle("Checklist Verification Pending: " + checklist.getSeqNo());
        notification.setMessage(String.format("Checklist task '%s' (Seq No: %s) has been completed by %s and is pending your verification.", 
            checklist.getCheckingPoint(), checklist.getSeqNo(), employeeName));
        notification.setLinkUrl("/qms/checklist/renewal-verify?viewId=" + assignment.getId());
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);
    }

    public void notifyUserAboutInduction(EmployeeMaster recipient, InductionAssignment assignment, String actionType) {
        if (recipient == null || recipient.getId() == null) {
            log.warn("[INDUCTION] Cannot send {} notification — trainer '{}' (empCode: {}) has no EmployeeMaster ID. "
                + "Ensure the trainer's user account is linked to an employee record in Admin > User Management.",
                actionType,
                recipient != null ? recipient.getEmployeeName() : "null",
                recipient != null ? recipient.getEmpCode() : "null");
            return;
        }

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());

        String roundName = assignment.getRoundEntity() != null ? assignment.getRoundEntity().getRoundName() : assignment.getInductionRound();
        String screeningLevel = assignment.getLevelEntity() != null ? assignment.getLevelEntity().getLevelName() : assignment.getScreeningLevel();
        if (screeningLevel == null) screeningLevel = "N/A";

        String dateStr = assignment.getInductionDate() != null ? new java.text.SimpleDateFormat("dd/MM/yyyy").format(assignment.getInductionDate()) : "N/A";

        if ("ASSIGN".equalsIgnoreCase(actionType)) {
            notification.setTitle("New Induction Training Assigned");
            notification.setMessage(String.format("You have been assigned to conduct induction training for trainee %s (Employee Code: %s).\nRound: %s\nLevel: %s\nDate: %s\nTime: %s",
                assignment.getEmpName() != null ? assignment.getEmpName() : assignment.getEmpCode(),
                assignment.getEmpCode(), roundName, screeningLevel, dateStr, assignment.getInductionTime()));
        } else if ("REASSIGN".equalsIgnoreCase(actionType)) {
            notification.setTitle("New Induction Training Assigned (Reassigned)");
            notification.setMessage(String.format("You have been assigned to conduct induction training for trainee %s (Employee Code: %s) after reassignment.\nRound: %s\nLevel: %s\nDate: %s\nTime: %s",
                assignment.getEmpName() != null ? assignment.getEmpName() : assignment.getEmpCode(),
                assignment.getEmpCode(), roundName, screeningLevel, dateStr, assignment.getInductionTime()));
        } else if ("RESCHEDULE".equalsIgnoreCase(actionType)) {
            notification.setTitle("Induction Training Rescheduled");
            notification.setMessage(String.format("Induction training for trainee %s (Employee Code: %s) has been rescheduled.\nRound: %s\nLevel: %s\nNew Date: %s\nNew Time: %s",
                assignment.getEmpName() != null ? assignment.getEmpName() : assignment.getEmpCode(),
                assignment.getEmpCode(), roundName, screeningLevel, dateStr, assignment.getInductionTime()));
        } else {
            notification.setTitle("Induction Assignment Update");
            notification.setMessage(String.format("Induction training update for trainee %s (Employee Code: %s).\nRound: %s\nLevel: %s\nDate: %s\nTime: %s",
                assignment.getEmpName() != null ? assignment.getEmpName() : assignment.getEmpCode(),
                assignment.getEmpCode(), roundName, screeningLevel, dateStr, assignment.getInductionTime()));
        }

        notification.setLinkUrl("/hra/ats/induction-training");
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);
        log.info("[INDUCTION] {} notification saved for trainer '{}' (empId: {}) — trainee: {}",
            actionType, recipient.getEmployeeName(), recipient.getId(), assignment.getEmpCode());

        sendMeetingNotification(recipient.getEmployeeName(), recipient.getOfficeMail(), notification.getTitle(), notification.getMessage());
    }

    public void notifyUserAboutMomAssignment(EmployeeMaster recipient, QmsMomMaster mom, QmsMomDetails detail) {
        if (recipient == null || recipient.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());

        boolean isInfo = "INFO".equalsIgnoreCase(detail.getProcessType());
        if (isInfo) {
            notification.setTitle("New MOM Info Point: " + mom.getMomNo());
            String point = detail.getDiscussedPoint() != null ? detail.getDiscussedPoint() : "Information Item";
            notification.setMessage(String.format("New information point recorded for MOM %s: %s", mom.getMomNo(), point));
        } else {
            notification.setTitle("New MOM Action Assigned: " + mom.getMomNo());
            String point = detail.getDiscussedPoint() != null ? detail.getDiscussedPoint() : "Action Item";
            notification.setMessage(String.format("You are assigned to the discussed point: %s", point));
        }

        notification.setLinkUrl("/qms/close-mom?viewId=" + detail.getId());
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);

        // sendMeetingNotification(recipient.getEmployeeName(), recipient.getOfficeMail(), notification.getTitle(), notification.getMessage());
    }

    public void notifyUserAboutMomReassignment(EmployeeMaster newAssignee, EmployeeMaster assignedBy, QmsMomMaster mom, QmsMomDetails detail, String reason) {
        if (newAssignee == null || newAssignee.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(newAssignee.getId());
        notification.setTitle("MOM Action Reassigned to You: " + (mom != null ? mom.getMomNo() : ""));
        
        String point = detail.getDiscussedPoint() != null ? detail.getDiscussedPoint() : "Action Item";
        String assignorName = assignedBy != null ? assignedBy.getEmployeeName() : "System";
        String reasonText = reason != null && !reason.isBlank() ? " (Reason: " + reason + ")" : "";

        notification.setMessage(String.format("MOM discussed point has been reassigned to you by %s%s: %s", assignorName, reasonText, point));
        notification.setLinkUrl("/qms/close-mom?viewId=" + detail.getId());
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(newAssignee.getId(), saved);
    }

    public void notifyUserAboutMomReassignedFrom(EmployeeMaster previousAssignee, EmployeeMaster newAssignee, QmsMomMaster mom, QmsMomDetails detail) {
        if (previousAssignee == null || previousAssignee.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(previousAssignee.getId());
        notification.setTitle("MOM Action Reassigned: " + (mom != null ? mom.getMomNo() : ""));

        String point = detail.getDiscussedPoint() != null ? detail.getDiscussedPoint() : "Action Item";
        String newAssigneeName = newAssignee != null ? newAssignee.getEmployeeName() : "another team member";

        notification.setMessage(String.format("Your assigned MOM discussed point '%s' has been reassigned to %s.", point, newAssigneeName));
        notification.setLinkUrl("/qms/minutesofmeeting");
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(previousAssignee.getId(), saved);
    }

    public void notifyUserAboutMomClosureSubmission(EmployeeMaster recipient, EmployeeMaster submittedBy, QmsMomMaster mom, QmsMomDetails detail) {
        if (recipient == null || recipient.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());
        notification.setTitle("MOM Action Submitted for Verification: " + (mom != null ? mom.getMomNo() : ""));
        
        String point = detail.getDiscussedPoint() != null ? detail.getDiscussedPoint() : "Action Item";
        String submitterName = submittedBy != null ? submittedBy.getEmployeeName() : "An employee";
        notification.setMessage(String.format("%s has submitted the discussed point for your verification: %s", submitterName, point));

        notification.setLinkUrl("/qms/mom-approval?viewId=" + detail.getId());
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);
    }

    public void notifyUserAboutMomRejection(EmployeeMaster recipient, EmployeeMaster rejectedBy, QmsMomMaster mom, QmsMomDetails detail, String comments) {
        if (recipient == null || recipient.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());
        notification.setTitle("MOM Action Item Rejected: " + (mom != null ? mom.getMomNo() : ""));
        
        String point = detail.getDiscussedPoint() != null ? detail.getDiscussedPoint() : "Action Item";
        String rejectorName = rejectedBy != null ? rejectedBy.getEmployeeName() : "Assigner";
        String commentText = (comments != null && !comments.trim().isEmpty()) ? "\nComments: " + comments : "";
        notification.setMessage(String.format("Your submitted action item '%s' for MOM %s was rejected by %s.%s", 
            point, mom != null ? mom.getMomNo() : "", rejectorName, commentText));

        notification.setLinkUrl("/qms/close-mom?viewId=" + detail.getId());
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);
    }

    public void notifyUserAboutMomVerification(EmployeeMaster recipient, EmployeeMaster verifiedBy, QmsMomMaster mom, QmsMomDetails detail) {
        if (recipient == null || recipient.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());
        notification.setTitle("MOM Action Item Verified: " + (mom != null ? mom.getMomNo() : ""));
        
        String point = detail.getDiscussedPoint() != null ? detail.getDiscussedPoint() : "Action Item";
        String verifierName = verifiedBy != null ? verifiedBy.getEmployeeName() : "Assigner";
        notification.setMessage(String.format("Your submitted action item '%s' for MOM %s has been verified and approved by %s.", 
            point, mom != null ? mom.getMomNo() : "", verifierName));

        notification.setLinkUrl("/qms/close-mom?viewId=" + detail.getId());
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);
    }

    public void markMeetingNotificationAsRead(Long empId, String scheduleNo) {
        if (empId == null || scheduleNo == null) return;
        List<AppNotification> unread = notificationRepository.findByRecipientEmpIdAndIsReadFalseOrderByCreatedAtDesc(empId);
        for (AppNotification notif : unread) {
            if (notif.getTitle() != null && notif.getTitle().contains(scheduleNo)) {
                if (notif.getTitle().contains("Meeting Assigned") || notif.getTitle().contains("Meeting Rescheduled")) {
                    notif.setIsRead(true);
                    notificationRepository.save(notif);
                }
            }
        }
    }

    public void markMomAssignmentNotificationAsRead(Long empId, String momNo) {
        if (empId == null || momNo == null) return;
        List<AppNotification> unread = notificationRepository.findByRecipientEmpIdAndIsReadFalseOrderByCreatedAtDesc(empId);
        for (AppNotification notif : unread) {
            if (notif.getTitle() != null && notif.getTitle().contains("New MOM Action Assigned: " + momNo)) {
                notif.setIsRead(true);
                notificationRepository.save(notif);
            }
        }
    }

    public void markMomClosureNotificationAsRead(Long empId, String momNo) {
        if (empId == null || momNo == null) return;
        List<AppNotification> unread = notificationRepository.findByRecipientEmpIdAndIsReadFalseOrderByCreatedAtDesc(empId);
        for (AppNotification notif : unread) {
            if (notif.getTitle() != null && notif.getTitle().contains("MOM Action Submitted for Verification: " + momNo)) {
                notif.setIsRead(true);
                notificationRepository.save(notif);
            }
        }
    }

    public void notifyUserAboutLeaveCreated(Long recipientId, String leaveType, String fromDateStr, String toDateStr) {
        if (recipientId == null) return;
        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipientId);
        notification.setTitle("Leave Applied (Verified)");
        notification.setMessage(String.format("HR has recorded a verified leave of type %s for you from %s to %s.", leaveType, fromDateStr, toDateStr));
        notification.setLinkUrl("/esc/leave-application");
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipientId, saved);
    }

    public void notifyUserAboutLoan(EmployeeMaster recipient, String title, String message, String linkUrl) {
        if (recipient == null || recipient.getId() == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLinkUrl(linkUrl != null ? linkUrl : "/employee-self-care/loan-apply");
        notification.setIsRead(false);
        
        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipient.getId(), saved);
    }

    public void notifyUserAboutLeaveEncashment(Long recipientEmpId, HraLeaveEncashmentVerified record, String actionType, String extraComments) {
        if (recipientEmpId == null || record == null) return;

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipientEmpId);

        String empName = record.getEmpName() != null ? record.getEmpName() : "Employee";
        java.math.BigDecimal days = record.getElEncashment() != null ? record.getElEncashment() : java.math.BigDecimal.ZERO;

        if ("SUBMIT".equalsIgnoreCase(actionType)) {
            notification.setTitle("New Leave Encashment Request: " + empName);
            notification.setMessage(String.format("New leave encashment request for %s days submitted by %s. Pending verification.", days, empName));
            notification.setLinkUrl("/hra/payroll/leave-encashment-verified");
        } else if ("RESUBMIT".equalsIgnoreCase(actionType)) {
            notification.setTitle("Leave Encashment Resubmitted: " + empName);
            notification.setMessage(String.format("Leave encashment request for %s days has been resubmitted by %s after addressing rejection comments. Pending verification.", days, empName));
            notification.setLinkUrl("/hra/payroll/leave-encashment-verified");
        } else if ("VERIFY".equalsIgnoreCase(actionType)) {
            notification.setTitle("Leave Encashment Verified");
            notification.setMessage(String.format("Your leave encashment request for %s days has been verified by Vertical Head.", days));
            notification.setLinkUrl("/employee-self-care/leave-encashment-entry");
        } else if ("APPROVE".equalsIgnoreCase(actionType)) {
            notification.setTitle("Leave Encashment Approved");
            notification.setMessage(String.format("Your leave encashment request for %s days has been approved by HR.", days));
            notification.setLinkUrl("/employee-self-care/leave-encashment-entry");
        } else if ("REJECT".equalsIgnoreCase(actionType)) {
            notification.setTitle("Leave Encashment Rejected");
            String commentText = (extraComments != null && !extraComments.trim().isEmpty()) ? "\nRejection Reason: " + extraComments : "";
            notification.setMessage(String.format("Your leave encashment request for %s days was rejected.%s\nPlease review comments and resubmit.", days, commentText));
            notification.setLinkUrl("/employee-self-care/leave-encashment-entry");
        } else {
            notification.setTitle("Leave Encashment Notification");
            notification.setMessage(String.format("Leave encashment update for %s days.", days));
            notification.setLinkUrl("/employee-self-care/leave-encashment-entry");
        }

        AppNotification saved = notificationRepository.save(notification);
        pushRealTimeNotification(recipientEmpId, saved);
    }

    public void notifyUserAboutInterview(EmployeeMaster recipient, com.autonoma.erp.modules.hra.recruitment.entity.HraApplicantInterview interview, com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType type) {
        if (recipient == null || interview == null) return;

        String candidateName = "Candidate";
        try {
            if (interview.getEmployeeId() != null) {
                EmployeeMaster candidate = employeeMasterRepository.findById(interview.getEmployeeId()).orElse(null);
                if (candidate != null) {
                    candidateName = candidate.getEmployeeName();
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch candidate name for interview notification: {}", e.getMessage());
        }

        String title = "";
        String bodyTemplate = "";

        if (type == com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_ASSIGN) {
            title = "New Interview Assigned";
            bodyTemplate = "You have been assigned an interview for {{candidateName}}.";
        } else if (type == com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_READY) {
            title = "Interview Ready";
            bodyTemplate = "{{candidateName}} has completed the previous interview round. Your interview is now ready.";
        } else if (type == com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_REMINDER) {
            title = "Upcoming Interview Reminder";
            bodyTemplate = "Interview with {{candidateName}} starts in 15 minutes.";
        } else if (type == com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_CANCEL) {
            title = "Interview Cancelled / Reassigned";
            bodyTemplate = "Your interview assignment for {{candidateName}} has been cancelled or reassigned. Please refer to the ATS Interview Schedule for the latest assignment.";
        }

        String message = bodyTemplate.replace("{{candidateName}}", candidateName);

        // Idempotency Guard: prevent duplicate notifications for the same recipient, interview, and exact title
        try {
            boolean exists = notificationRepository.existsByRecipientEmpIdAndRefTypeAndRefIdAndTitleAndIsReadFalse(
                recipient.getId(), "ATS_INTERVIEW", interview.getId(), title
            );
            if (exists) {
                log.info("Duplicate notification blocked for recipient: {}, refId: {}, title: {}", recipient.getId(), interview.getId(), title);
                return;
            }
        } catch (Exception e) {
            log.error("Failed to execute idempotency check: {}", e.getMessage());
        }

        AppNotification notification = new AppNotification();
        notification.setRecipientEmpId(recipient.getId());
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLinkUrl("/hra/ats/interview-process?interviewId=" + interview.getId());
        notification.setRefType("ATS_INTERVIEW");
        notification.setRefId(interview.getId());
        notification.setIsRead(false);

        AppNotification saved = notificationRepository.saveAndFlush(notification);
        pushRealTimeNotification(recipient.getId(), saved);
    }

    public void softCloseInterviewNotifications(Long interviewId) {
        if (interviewId == null) return;
        try {
            notificationRepository.markAsReadByRefTypeAndRefId("ATS_INTERVIEW", interviewId);
            log.info("Soft-closed notifications for ATS_INTERVIEW: {}", interviewId);
        } catch (Exception e) {
            log.error("Failed to soft-close notifications for interview {}: {}", interviewId, e.getMessage());
        }
    }

    public Long getSuperBossEmpId() {
        try {
            return userRepository.findByUserId("SUPER BOSS")
                    .map(com.autonoma.erp.model.admin.UserCredential::getEmpId)
                    .orElse(null);
        } catch (Exception e) {
            log.error("Failed to fetch Super Boss employee ID: {}", e.getMessage());
            return null;
        }
    }

    public EmployeeMaster getSuperBossEmployee() {
        Long superBossEmpId = getSuperBossEmpId();
        if (superBossEmpId != null) {
            return employeeMasterRepository.findById(superBossEmpId).orElse(null);
        }
        return null;
    }

    public void notifySuperUsersAboutInterview(com.autonoma.erp.modules.hra.recruitment.entity.HraApplicantInterview interview, com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType type) {
        if (interview == null) return;
        try {
            if (type == com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_ASSIGN 
                    || type == com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_READY) {
                List<Long> superEmpIds = userRepository.findEmpIdsByUserLevel(5);
                if (superEmpIds != null && !superEmpIds.isEmpty()) {
                    List<EmployeeMaster> superUsers = employeeMasterRepository.findAllById(superEmpIds);
                    for (EmployeeMaster supervisor : superUsers) {
                        // Filter out the interviewer to avoid duplicates
                        if (interview.getInterviewerId() != null && interview.getInterviewerId().equals(supervisor.getId())) {
                            continue;
                        }
                        notifyUserAboutInterviewSafe(supervisor, interview, type);
                    }
                }
            } else {
                List<Long> superEmpIds = bosUserPageAuthRepository.findEmpIdsByPageCodeAndEnable("HA1120");
                if (superEmpIds != null && !superEmpIds.isEmpty()) {
                    List<EmployeeMaster> superUsers = employeeMasterRepository.findAllById(superEmpIds);
                    for (EmployeeMaster supervisor : superUsers) {
                        // Filter out the interviewer to avoid duplicates
                        if (interview.getInterviewerId() != null && interview.getInterviewerId().equals(supervisor.getId())) {
                            continue;
                        }
                        notifyUserAboutInterviewSafe(supervisor, interview, type);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to notify super users: {}", e.getMessage());
        }
    }

    public void notifyUserAboutInterviewSafe(EmployeeMaster recipient, com.autonoma.erp.modules.hra.recruitment.entity.HraApplicantInterview interview, com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType type) {
        try {
            notifyUserAboutInterview(recipient, interview, type);
        } catch (Exception e) {
            log.error("Failed to execute notifyUserAboutInterview for type {}: {}", type, e.getMessage(), e);
        }
    }

    public void softCloseAndNotifyCancelIfAssigned(Long interviewerId, com.autonoma.erp.modules.hra.recruitment.entity.HraApplicantInterview interview) {
        if (interview == null || interview.getId() == null) return;
        
        softCloseInterviewNotifications(interview.getId());
        
        if (interviewerId != null) {
            try {
                boolean previouslyNotified = notificationRepository.existsByRecipientEmpIdAndRefTypeAndRefIdAndTitleKeyword(
                    interviewerId, "ATS_INTERVIEW", interview.getId(), "Assigned"
                );
                if (previouslyNotified) {
                    employeeMasterRepository.findById(interviewerId).ifPresent(oldInt -> {
                        notifyUserAboutInterviewSafe(oldInt, interview, com.autonoma.erp.modules.hra.recruitment.constant.AtsNotificationType.ATS_INTERVIEW_CANCEL);
                    });
                }
            } catch (Exception e) {
                log.error("Failed to check or notify cancel for interview {}: {}", interview.getId(), e.getMessage());
            }
        }
    }
}


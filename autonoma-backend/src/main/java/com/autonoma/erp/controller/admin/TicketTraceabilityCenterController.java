package com.autonoma.erp.controller.admin;

import AppUtil.AppConstants;
import com.autonoma.erp.model.admin.BosPage;
import com.autonoma.erp.model.admin.BosUserPageAuth;
import com.autonoma.erp.model.admin.PrefixCredential;
import com.autonoma.erp.repository.admin.BosPageRepository;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.platform.notification.entity.AppNotification;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.platform.ticketing.entity.SupportTicketAttachment;
import com.autonoma.erp.modules.platform.ticketing.entity.SupportTicketComment;
import com.autonoma.erp.modules.platform.ticketing.entity.SupportTicketReopenHistory;
import com.autonoma.erp.modules.platform.ticketing.entity.SupportTicketStatusHistory;
import com.autonoma.erp.modules.platform.ticketing.entity.TicketTraceabilityCenter;
import com.autonoma.erp.modules.platform.notification.repository.AppNotificationRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.platform.ticketing.repository.SupportTicketAttachmentRepository;
import com.autonoma.erp.modules.platform.ticketing.repository.SupportTicketCommentRepository;
import com.autonoma.erp.modules.platform.ticketing.repository.SupportTicketReopenHistoryRepository;
import com.autonoma.erp.modules.platform.ticketing.repository.SupportTicketStatusHistoryRepository;
import com.autonoma.erp.modules.platform.ticketing.repository.TicketTraceabilityCenterRepository;

import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.repository.admin.PrefixCredentialRepository;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.repository.admin.BosUserPageAuthRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import com.autonoma.erp.modules.platform.files.service.FileService;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
@Tag(name = "Admin - Ticket Traceability Center", description = "Endpoints for managing support tickets and workflows")
public class TicketTraceabilityCenterController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory
            .getLogger(TicketTraceabilityCenterController.class);

    private static final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @Autowired
    private TicketTraceabilityCenterRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PrefixCredentialRepository prefixCredentialRepository;

    @Autowired
    private BosUserPageAuthRepository bosUserPageAuthRepository;

    @Autowired
    private com.autonoma.erp.repository.admin.BosPageRepository bosPageRepository;

    @Autowired
    private FileService fileService;

    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @Autowired
    private SupportTicketCommentRepository commentRepository;

    @Autowired
    private SupportTicketStatusHistoryRepository statusHistoryRepository;

    @Autowired
    private SupportTicketAttachmentRepository attachmentRepository;

    @Autowired
    private SupportTicketReopenHistoryRepository reopenHistoryRepository;

    @Autowired
    private AppNotificationRepository appNotificationRepository;

    private void createAssignmentNotification(TicketTraceabilityCenter ticket, String title, String message) {
        if (ticket.getAssignedTo() == null || ticket.getAssignedTo().trim().isEmpty()) return;
        try {
            java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> empOpt = employeeMasterRepository.findByEmpCodeOrName(ticket.getAssignedTo());
            if (empOpt.isPresent()) {
                AppNotification notif = new AppNotification();
                notif.setRecipientEmpId(empOpt.get().getId());
                notif.setTitle(title);
                notif.setMessage(message);
                
                String link = "/support/raised-for-me?openTicketId=" + ticket.getTicketId();
                String creatorUserId = getCurrentUser();
                if (creatorUserId != null && !creatorUserId.equalsIgnoreCase("System")) {
                    java.util.Optional<com.autonoma.erp.model.admin.UserCredential> uOpt = userRepository.findByUserId(creatorUserId);
                    if (uOpt.isPresent() && uOpt.get().getEmpId() != null) {
                        java.util.Optional<com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster> cEmpOpt = employeeMasterRepository.findById(uOpt.get().getEmpId());
                        if (cEmpOpt.isPresent() && cEmpOpt.get().getEmployeePhotoUpload() != null) {
                            link += "&imgName=" + java.net.URLEncoder.encode(cEmpOpt.get().getEmployeePhotoUpload(), "UTF-8");
                        }
                    }
                }
                notif.setLinkUrl(link);
                appNotificationRepository.save(notif);
            }
        } catch (Exception e) {
            log.error("Failed to create assignment notification", e);
        }
    }

    private boolean isInternalUser() {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null)
            return false;
        Optional<UserCredential> userOpt = userRepository.findByUserId(userId);
        if (userOpt.isPresent()) {
            UserCredential user = userOpt.get();
            return (user.getUserLevel() != null && user.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_ADMIN) || user.getEmpId() != null;
        }
        return false;
    }

    private boolean isUserSuperAdmin() {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null)
            return false;
        Optional<UserCredential> userOpt = userRepository.findByUserId(userId);
        if (userOpt.isPresent()) {
            UserCredential user = userOpt.get();
            return (user.getUserLevel() != null && user.getUserLevel() >= AppUtil.AppConstants.USER_LEVEL_ADMIN);
        }
        return false;
    }

    private String getCurrentUser() {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        return userId != null ? userId : "System";
    }

    @GetMapping
    @Operation(summary = "Get All Tickets", description = "Fetches tickets list. Scope filtering (Mine/Team/Company) is handled by the frontend.")
    public List<TicketTraceabilityCenter> getAllTickets() {
        log.info("Fetching tickets");
        // Returning all tickets here. The frontend TicketManagement.jsx strictly filters 
        // these based on the user's role (Mine, Team, Company) and permissions.
        return ticketRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{rowId}")
    @Operation(summary = "Get Ticket By Row ID")
    public ResponseEntity<TicketTraceabilityCenter> getTicketById(@PathVariable Integer rowId) {
        log.info("Fetching ticket with ID: {}", rowId);
        Optional<TicketTraceabilityCenter> ticketOpt = ticketRepository.findById(rowId);
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        TicketTraceabilityCenter ticket = ticketOpt.get();
        boolean isAdmin = isUserSuperAdmin();
        String currentUserId = getCurrentUser();
        String currentUserEmail = currentUserId;
        String currentUserName = currentUserId;
        
        Optional<UserCredential> userOpt = userRepository.findByUserId(currentUserId);
        if (userOpt.isPresent()) {
            UserCredential user = userOpt.get();
            if (user.getEmpId() != null) {
                Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(user.getEmpId());
                if (empOpt.isPresent()) {
                    EmployeeMaster emp = empOpt.get();
                    if (emp.getOfficeMail() != null) currentUserEmail = emp.getOfficeMail();
                    if (emp.getEmployeeName() != null) currentUserName = emp.getEmployeeName();
                    if ("YES".equalsIgnoreCase(emp.getPermissionToggle())) {
                        isAdmin = true;
                    }
                    if ("YES".equalsIgnoreCase(emp.getIsTaskTester()) && "To Be Tested".equalsIgnoreCase(ticket.getTicketStatus())) {
                        isAdmin = true;
                    }
                    if ("YES".equalsIgnoreCase(emp.getIsTaskVerifier()) && "To Be Verified".equalsIgnoreCase(ticket.getTicketStatus())) {
                        isAdmin = true;
                    }
                    if ("Yet To Deploy".equalsIgnoreCase(ticket.getTicketStatus())) {
                        boolean isTeamHead = false;
                        if (currentUserName != null) {
                            isTeamHead = employeeMasterRepository.existsByVerticalHeadIgnoreCase(currentUserName);
                        }
                        if (!isTeamHead && currentUserId != null) {
                            isTeamHead = employeeMasterRepository.existsByVerticalHeadIgnoreCase(currentUserId);
                        }
                        boolean hasCompanyPerm = false;
                        
                        Integer pageId1 = bosPageRepository.findByPageCode("S1110").map(com.autonoma.erp.model.admin.BosPage::getPageId).orElse(-1);
                        Integer pageId2 = bosPageRepository.findByPageCode("S1120").map(com.autonoma.erp.model.admin.BosPage::getPageId).orElse(-1);

                        List<com.autonoma.erp.model.admin.BosUserPageAuth> auths = bosUserPageAuthRepository.findByUserId(currentUserId);
                        for (com.autonoma.erp.model.admin.BosUserPageAuth auth : auths) {
                            if (auth.getPageId() != null && (auth.getPageId().equals(pageId1) || auth.getPageId().equals(pageId2))) {
                                if (auth.getAdditional2() != null && auth.getAdditional2() == 1) {
                                    hasCompanyPerm = true;
                                    break;
                                }
                            }
                        }
                        if (isTeamHead || hasCompanyPerm) {
                            isAdmin = true;
                        }
                    }
                }
            }
        }

        // Access check
        if (!isAdmin) {
            boolean isCreator = ticket.getCreatedBy() != null && (ticket.getCreatedBy().equalsIgnoreCase(currentUserId) || ticket.getCreatedBy().equalsIgnoreCase(currentUserName));
            boolean isEmail = ticket.getEmail() != null && ticket.getEmail().equalsIgnoreCase(currentUserEmail);
            boolean isEmpName = ticket.getEmployeeName() != null && ticket.getEmployeeName().equalsIgnoreCase(currentUserName);
            boolean isVerifier = ticket.getVerifiedBy() != null && (ticket.getVerifiedBy().equalsIgnoreCase(currentUserId) || ticket.getVerifiedBy().equalsIgnoreCase(currentUserName) || ticket.getVerifiedBy().equalsIgnoreCase(currentUserEmail));
            boolean isAssignee = ticket.getAssignedTo() != null && (ticket.getAssignedTo().equalsIgnoreCase(currentUserId) || ticket.getAssignedTo().equalsIgnoreCase(currentUserName));
            boolean isDev = ticket.getDeveloperName() != null && ticket.getDeveloperName().equalsIgnoreCase(currentUserName);
            boolean isDevEmail = ticket.getDeveloperEmail() != null && ticket.getDeveloperEmail().equalsIgnoreCase(currentUserEmail);
            boolean isTester = ticket.getTestedBy() != null && (ticket.getTestedBy().equalsIgnoreCase(currentUserId) || ticket.getTestedBy().equalsIgnoreCase(currentUserName) || ticket.getTestedBy().equalsIgnoreCase(currentUserEmail));

            if (!isCreator && !isEmail && !isEmpName && !isVerifier && !isAssignee && !isDev && !isDevEmail && !isTester) {
                return ResponseEntity.status(403).build();
            }
        }

        return ResponseEntity.ok(ticket);
    }

    @PostMapping
    @Operation(summary = "Create Ticket")
    public ResponseEntity<?> createTicket(@RequestBody TicketTraceabilityCenter ticket) {
        log.info("Creating support ticket: {}", ticket);
        try {
            // Auto generate ticket ID based on AD_PREFIX_CREDENTIALS
            String prefix = "INT/";
            String suffix = "/2627";
            int digit = 4;
            
            List<com.autonoma.erp.model.admin.PrefixCredential> prefixes = prefixCredentialRepository.findAll();
            if (!prefixes.isEmpty()) {
                com.autonoma.erp.model.admin.PrefixCredential pc = prefixes.get(0);
                if (pc.getTaskPrefix() != null && !pc.getTaskPrefix().trim().isEmpty()) prefix = pc.getTaskPrefix().trim();
                if (pc.getTaskSuffix() != null && !pc.getTaskSuffix().trim().isEmpty()) suffix = pc.getTaskSuffix().trim();
                if (pc.getTaskDigit() != null) digit = pc.getTaskDigit();
            }

            String pattern = prefix + "%" + suffix;
            List<TicketTraceabilityCenter> latestList = ticketRepository.findLatestByTicketIdPattern(pattern);
            int nextNum = 1;
            if (!latestList.isEmpty()) {
                String latestId = latestList.get(0).getTicketId();
                try {
                    int startIndex = latestId.indexOf(prefix) + prefix.length();
                    int endIndex = latestId.lastIndexOf(suffix);
                    if (startIndex < endIndex) {
                        String numStr = latestId.substring(startIndex, endIndex);
                        nextNum = Integer.parseInt(numStr) + 1;
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse sequence from ticket ID: {}", latestId);
                }
            }
            String formatStr = "%s%0" + digit + "d%s";
            String ticketId = String.format(formatStr, prefix, nextNum, suffix);
            ticket.setTicketId(ticketId);

            if (ticket.getEmployeeId() == null && ticket.getEmployeeName() != null) {
                employeeMasterRepository.findByEmpCodeOrName(ticket.getEmployeeName())
                        .ifPresent(e -> ticket.setEmployeeId(e.getId()));
            }
            if (ticket.getTicketStatus() == null || ticket.getTicketStatus().trim().isEmpty()) {
                ticket.setTicketStatus("Open");
            }
            ticket.setReopenedCount(0);

            TicketTraceabilityCenter savedTicket = ticketRepository.save(ticket);

            // Log status history transition
            logStatusHistory(savedTicket.getRowId(), "Ticket Created", ticket.getDescription(), null, savedTicket.getTicketStatus(), null, null);

            // Move files and log attachments using helper method
            List<String> finalAttachments = moveTempFiles(ticket.getTempAttachments(), ticketId, savedTicket.getRowId(), "Attachment", "Attachments");
            List<String> finalVoices = moveTempFiles(ticket.getTempVoiceRecordings(), ticketId, savedTicket.getRowId(), "Voice Recording", "Voice Recordings");

            // Combine final paths if we want to store them in attachment_path
            List<String> allFinalPaths = new ArrayList<>();
            allFinalPaths.addAll(finalAttachments);
            allFinalPaths.addAll(finalVoices);

            if (!allFinalPaths.isEmpty()) {
                String joinedPaths = String.join(",", allFinalPaths);
                if (joinedPaths.length() > 500) {
                    joinedPaths = joinedPaths.substring(0, 500);
                }
                savedTicket.setAttachmentPath(joinedPaths);
                savedTicket = ticketRepository.save(savedTicket);
            }

            createAssignmentNotification(savedTicket, "New Task Created", "New Task Created With Task No " + savedTicket.getTicketId());

            return ResponseEntity.ok(savedTicket);
        } catch (Exception e) {
            log.error("Error creating ticket", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{rowId}")
    @Operation(summary = "Update Ticket")
    public ResponseEntity<?> updateTicket(@PathVariable Integer rowId,
            @RequestBody TicketTraceabilityCenter ticketDetails) {
        log.info("Updating ticket with row ID: {}", rowId);
        try {
            Optional<TicketTraceabilityCenter> ticketOpt = ticketRepository.findById(rowId);
            if (ticketOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            TicketTraceabilityCenter existingTicket = ticketOpt.get();
            boolean isAdmin = isUserSuperAdmin();
        String currentUserId = getCurrentUser();
        String currentUserEmail = currentUserId;
        String currentUserName = currentUserId;
        
        Optional<UserCredential> userOpt = userRepository.findByUserId(currentUserId);
        if (userOpt.isPresent()) {
            UserCredential user = userOpt.get();
            if (user.getEmpId() != null) {
                Optional<EmployeeMaster> empOpt = employeeMasterRepository.findById(user.getEmpId());
                if (empOpt.isPresent()) {
                    EmployeeMaster emp = empOpt.get();
                    if (emp.getOfficeMail() != null) currentUserEmail = emp.getOfficeMail();
                    if (emp.getEmployeeName() != null) currentUserName = emp.getEmployeeName();
                    if ("YES".equalsIgnoreCase(emp.getPermissionToggle())) {
                        isAdmin = true;
                    }
                    if ("YES".equalsIgnoreCase(emp.getIsTaskTester()) && "To Be Tested".equalsIgnoreCase(existingTicket.getTicketStatus())) {
                        isAdmin = true;
                    }
                    if ("YES".equalsIgnoreCase(emp.getIsTaskVerifier()) && "To Be Verified".equalsIgnoreCase(existingTicket.getTicketStatus())) {
                        isAdmin = true;
                    }
                    if ("Yet To Deploy".equalsIgnoreCase(ticketDetails.getTicketStatus())) {
                        boolean isTeamHead = false;
                        if (currentUserName != null) {
                            isTeamHead = employeeMasterRepository.existsByVerticalHeadIgnoreCase(currentUserName);
                        }
                        if (!isTeamHead && currentUserId != null) {
                            isTeamHead = employeeMasterRepository.existsByVerticalHeadIgnoreCase(currentUserId);
                        }
                        boolean hasCompanyPerm = false;
                        
                        Integer pageId1 = bosPageRepository.findByPageCode("S1110").map(com.autonoma.erp.model.admin.BosPage::getPageId).orElse(-1);
                        Integer pageId2 = bosPageRepository.findByPageCode("S1120").map(com.autonoma.erp.model.admin.BosPage::getPageId).orElse(-1);

                        List<com.autonoma.erp.model.admin.BosUserPageAuth> auths = bosUserPageAuthRepository.findByUserId(currentUserId);
                        for (com.autonoma.erp.model.admin.BosUserPageAuth auth : auths) {
                            if (auth.getPageId() != null && (auth.getPageId().equals(pageId1) || auth.getPageId().equals(pageId2))) {
                                if (auth.getAdditional2() != null && auth.getAdditional2() == 1) {
                                    hasCompanyPerm = true;
                                    break;
                                }
                            }
                        }
                        if (isTeamHead || hasCompanyPerm) {
                            isAdmin = true;
                        }
                    }
                }
            }
        }

        // Access check
        if (!isAdmin) {
            boolean isCreator = existingTicket.getCreatedBy() != null && (existingTicket.getCreatedBy().equalsIgnoreCase(currentUserId) || existingTicket.getCreatedBy().equalsIgnoreCase(currentUserName));
            boolean isEmail = existingTicket.getEmail() != null && existingTicket.getEmail().equalsIgnoreCase(currentUserEmail);
            boolean isEmpName = existingTicket.getEmployeeName() != null && existingTicket.getEmployeeName().equalsIgnoreCase(currentUserName);
            boolean isVerifier = existingTicket.getVerifiedBy() != null && (existingTicket.getVerifiedBy().equalsIgnoreCase(currentUserId) || existingTicket.getVerifiedBy().equalsIgnoreCase(currentUserName) || existingTicket.getVerifiedBy().equalsIgnoreCase(currentUserEmail));
            boolean isAssignee = existingTicket.getAssignedTo() != null && (existingTicket.getAssignedTo().equalsIgnoreCase(currentUserId) || existingTicket.getAssignedTo().equalsIgnoreCase(currentUserName));
            boolean isDev = existingTicket.getDeveloperName() != null && existingTicket.getDeveloperName().equalsIgnoreCase(currentUserName);
            boolean isDevEmail = existingTicket.getDeveloperEmail() != null && existingTicket.getDeveloperEmail().equalsIgnoreCase(currentUserEmail);
            boolean isTester = existingTicket.getTestedBy() != null && (existingTicket.getTestedBy().equalsIgnoreCase(currentUserId) || existingTicket.getTestedBy().equalsIgnoreCase(currentUserName) || existingTicket.getTestedBy().equalsIgnoreCase(currentUserEmail));

            if (!isCreator && !isEmail && !isEmpName && !isVerifier && !isAssignee && !isDev && !isDevEmail && !isTester) {
                return ResponseEntity.status(403).build();
            }
        }

            String oldStatus = existingTicket.getTicketStatus();

            // Update allowed fields
            if (ticketDetails.getTitle() != null)
                existingTicket.setTitle(ticketDetails.getTitle());
            if (ticketDetails.getEmployeeCode() != null)
                existingTicket.setEmployeeCode(ticketDetails.getEmployeeCode());
            if (ticketDetails.getEmployeeName() != null) {
                existingTicket.setEmployeeName(ticketDetails.getEmployeeName());
                employeeMasterRepository.findByEmpCodeOrName(ticketDetails.getEmployeeName())
                        .ifPresent(e -> existingTicket.setEmployeeId(e.getId()));
            } else if (ticketDetails.getEmployeeId() != null) {
                existingTicket.setEmployeeId(ticketDetails.getEmployeeId());
            }
            if (ticketDetails.getEmail() != null)
                existingTicket.setEmail(ticketDetails.getEmail());
            if (ticketDetails.getMobileNo() != null)
                existingTicket.setMobileNo(ticketDetails.getMobileNo());
            if (ticketDetails.getDepartment() != null)
                existingTicket.setDepartment(ticketDetails.getDepartment());
            if (ticketDetails.getAdditionalRequirement() != null) {
                String oldReq = existingTicket.getAdditionalRequirement();
                String newReq = ticketDetails.getAdditionalRequirement();
                boolean isEmptyReq = newReq.trim().isEmpty() || newReq.trim().equals("<p><br></p>");
                if (oldReq == null || !oldReq.equals(newReq)) {
                    existingTicket.setAdditionalRequirement(newReq);
                    if (!isEmptyReq) {
                        logStatusHistory(existingTicket.getRowId(), "Additional Requirement Added", newReq, oldStatus, oldStatus, null, null);
                    }
                }
            }
            if (ticketDetails.getDescription() != null)
                existingTicket.setDescription(ticketDetails.getDescription());
            if (ticketDetails.getPriorityLevel() != null)
                existingTicket.setPriorityLevel(ticketDetails.getPriorityLevel());
            if (ticketDetails.getSeverityLevel() != null)
                existingTicket.setSeverityLevel(ticketDetails.getSeverityLevel());
            if (ticketDetails.getVerifiedBy() != null)
                existingTicket.setVerifiedBy(ticketDetails.getVerifiedBy());
            if (ticketDetails.getTestedBy() != null)
                existingTicket.setTestedBy(ticketDetails.getTestedBy());

            // Workflow details
            if (ticketDetails.getAssignedTo() != null) {
                String oldAssignee = existingTicket.getAssignedTo();
                String newAssignee = ticketDetails.getAssignedTo();
                if (oldAssignee == null || !oldAssignee.equalsIgnoreCase(newAssignee)) {
                    existingTicket.setAssignedTo(newAssignee);
                    createAssignmentNotification(existingTicket, "Task Reassigned", "New Task Assigned With Task No " + existingTicket.getTicketId());
                    
                    String reassignActionDesc = "Reassigned: " + (oldAssignee != null ? oldAssignee : "Unassigned") + " -> " + newAssignee;
                    if (ticketDetails.getReassignReason() != null && !ticketDetails.getReassignReason().trim().isEmpty()) {
                        reassignActionDesc += " | Reason: " + ticketDetails.getReassignReason();
                    }
                    if (ticketDetails.getReassignComment() != null && !ticketDetails.getReassignComment().trim().isEmpty()) {
                        reassignActionDesc += " | Comment: " + ticketDetails.getReassignComment();
                    }
                    
                    logStatusHistory(existingTicket.getRowId(), "Ticket Reassigned", reassignActionDesc, oldStatus, oldStatus, newAssignee, null);
                }
            }
            if (ticketDetails.getAssignedBy() != null)
                existingTicket.setAssignedBy(ticketDetails.getAssignedBy());
            if (ticketDetails.getDeveloperName() != null)
                existingTicket.setDeveloperName(ticketDetails.getDeveloperName());
            if (ticketDetails.getDeveloperEmail() != null)
                existingTicket.setDeveloperEmail(ticketDetails.getDeveloperEmail());
            if (ticketDetails.getDeveloperMobileNo() != null)
                existingTicket.setDeveloperMobileNo(ticketDetails.getDeveloperMobileNo());

            if (ticketDetails.getDueDate() != null)
                existingTicket.setDueDate(ticketDetails.getDueDate());
            if (ticketDetails.getTargetDate() != null) {
                Date oldTargetDate = existingTicket.getTargetDate();
                Date newTargetDate = ticketDetails.getTargetDate();
                boolean targetDateChanged = false;
                if (oldTargetDate == null && newTargetDate != null) {
                    targetDateChanged = true;
                } else if (oldTargetDate != null && newTargetDate != null && !oldTargetDate.equals(newTargetDate)) {
                    targetDateChanged = true;
                }
                if (targetDateChanged) {
                    existingTicket.setTargetDate(newTargetDate);
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                    String changeStr = (oldTargetDate == null ? "None" : sdf.format(oldTargetDate)) + " -> " + sdf.format(newTargetDate);
                    logStatusHistory(existingTicket.getRowId(), "Target Date Updated", "Target date updated to " + sdf.format(newTargetDate), oldStatus, oldStatus, null, changeStr);
                }
            }
            if (ticketDetails.getTakenTime() != null)
                existingTicket.setTakenTime(ticketDetails.getTakenTime());
            if (ticketDetails.getReworkTime() != null)
                existingTicket.setReworkTime(ticketDetails.getReworkTime());
            if (ticketDetails.getDueDateReason() != null)
                existingTicket.setDueDateReason(ticketDetails.getDueDateReason());

            if (ticketDetails.getAssignedHours() != null) {
                String oldHoursStr = existingTicket.getAssignedHours();
                String newHoursStr = ticketDetails.getAssignedHours();
                if (oldHoursStr != null && !oldHoursStr.equals(newHoursStr)) {
                    int oldMins = parseDurationToMinutes(oldHoursStr);
                    int newMins = parseDurationToMinutes(newHoursStr);
                    int diffMins = newMins - oldMins;
                    if (diffMins != 0) {
                        String diffStr = "";
                        int absMins = Math.abs(diffMins);
                        int h = absMins / 60;
                        int m = absMins % 60;
                        if (diffMins > 0) {
                            diffStr = m == 0 ? String.format("%d hr Estimated Time added", h) : String.format("%d hr %d min Estimated Time added", h, m);
                        } else {
                            diffStr = m == 0 ? String.format("%d hr Estimated Time Reduced", h) : String.format("%d hr %d min Estimated Time Reduced", h, m);
                        }
                        existingTicket.setAssignedHours(newHoursStr);
                        logStatusHistory(existingTicket.getRowId(), "Estimated Time Updated", diffStr, oldStatus, oldStatus, null, oldHoursStr + " -> " + newHoursStr);
                    }
                } else if (oldHoursStr == null && !newHoursStr.trim().isEmpty()) {
                    existingTicket.setAssignedHours(newHoursStr);
                    logStatusHistory(existingTicket.getRowId(), "Estimated Time Set", "Estimated time set to " + newHoursStr, oldStatus, oldStatus, null, "None -> " + newHoursStr);
                }
            }

            if (ticketDetails.getResolutionSummary() != null)
                existingTicket.setResolutionSummary(ticketDetails.getResolutionSummary());
            if (ticketDetails.getRootCause() != null)
                existingTicket.setRootCause(ticketDetails.getRootCause());
            if (ticketDetails.getSourceType() != null)
                existingTicket.setSourceType(ticketDetails.getSourceType());

            // Move any new temp attachments/voices if they are sent in tempAttachments or tempVoiceRecordings lists:
            if (ticketDetails.getTempAttachments() != null && !ticketDetails.getTempAttachments().isEmpty()) {
                moveTempFiles(ticketDetails.getTempAttachments(), existingTicket.getTicketId(), existingTicket.getRowId(), "Attachment", "Attachments");
            }
            if (ticketDetails.getTempVoiceRecordings() != null && !ticketDetails.getTempVoiceRecordings().isEmpty()) {
                moveTempFiles(ticketDetails.getTempVoiceRecordings(), existingTicket.getTicketId(), existingTicket.getRowId(), "Voice Recording", "Voice Recordings");
            }
            if (ticketDetails.getTempAdditionalAttachments() != null && !ticketDetails.getTempAdditionalAttachments().isEmpty()) {
                moveTempFiles(ticketDetails.getTempAdditionalAttachments(), existingTicket.getTicketId(), existingTicket.getRowId(), "Additional Requirement Attachment", "Additional Requirement");
            }
            if (ticketDetails.getTempAdditionalVoiceRecordings() != null && !ticketDetails.getTempAdditionalVoiceRecordings().isEmpty()) {
                moveTempFiles(ticketDetails.getTempAdditionalVoiceRecordings(), existingTicket.getTicketId(), existingTicket.getRowId(), "Additional Requirement Voice", "Additional Requirement");
            }

            // Sync the comma-separated attachment_path column in DB
            List<SupportTicketAttachment> allDbAttachments = attachmentRepository.findByTicketRowIdOrderByUploadedAtAsc(existingTicket.getRowId());
            List<String> dbPaths = new ArrayList<>();
            for (SupportTicketAttachment att : allDbAttachments) {
                dbPaths.add(att.getFilePath());
            }
            String joinedPaths = String.join(",", dbPaths);
            if (joinedPaths.length() > 500) {
                joinedPaths = joinedPaths.substring(0, 500);
            }
            existingTicket.setAttachmentPath(joinedPaths);

            // Handle status updates and workflow transitions
            if (ticketDetails.getTicketStatus() != null) {
                String newStatus = ticketDetails.getTicketStatus();
                if (!newStatus.equalsIgnoreCase(oldStatus)) {
                    existingTicket.setTicketStatus(newStatus);

                    // Automate resolved_at and closed_at timestamps
                    if (newStatus.equalsIgnoreCase("Resolved")) {
                        existingTicket.setResolvedAt(new Date());
                    } else if (newStatus.equalsIgnoreCase("Closed")) {
                        existingTicket.setClosedAt(new Date());
                        if (existingTicket.getResolvedAt() == null) {
                            existingTicket.setResolvedAt(new Date());
                        }
                    }

                    // Check for Reopen workflow transition
                    if (newStatus.equalsIgnoreCase("Reopened") && !oldStatus.equalsIgnoreCase("Reopened")) {
                        existingTicket.setReopenedCount(existingTicket.getReopenedCount() + 1);

                        SupportTicketReopenHistory reopenHistory = new SupportTicketReopenHistory();
                        reopenHistory.setTicketRowId(existingTicket.getRowId());
                        reopenHistory.setReopenedBy(currentUserId != null ? currentUserId : "System");
                        reopenHistory.setReason(ticketDetails.getResolutionSummary() != null
                                ? ticketDetails.getResolutionSummary()
                                : "Reopened by user");
                        reopenHistory.setExpectedDuration(ticketDetails.getTakenTime());
                        reopenHistory.setReopenTargetDate(ticketDetails.getTargetDate());
                        reopenHistoryRepository.save(reopenHistory);
                    }

                    // Log status history transition
                    String transitionComment = ticketDetails.getResolutionSummary();
                    if (transitionComment == null || transitionComment.trim().isEmpty()) {
                        transitionComment = "Status updated to " + newStatus;
                    }
                    if ("Resolved".equalsIgnoreCase(newStatus) && ticketDetails.getTakenTime() != null
                            && !ticketDetails.getTakenTime().trim().isEmpty()) {
                        transitionComment = transitionComment + " | Taken Time: " + ticketDetails.getTakenTime().trim();
                    }
                    String activityName = "Status Changed";
                    if ("Resolved".equalsIgnoreCase(newStatus)) {
                        activityName = "Ticket Resolved";
                    } else if ("Closed".equalsIgnoreCase(newStatus)) {
                        activityName = "Ticket Closed";
                    }
                    logStatusHistory(existingTicket.getRowId(), activityName, transitionComment, oldStatus, newStatus, null, null);
                }
            }

            TicketTraceabilityCenter updatedTicket = ticketRepository.save(existingTicket);
            return ResponseEntity.ok(updatedTicket);
        } catch (Exception e) {
            log.error("Error updating ticket", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{rowId}")
    @Operation(summary = "Delete Ticket")
    public ResponseEntity<?> deleteTicket(@PathVariable Integer rowId) {
        log.info("Deleting ticket ID: {}", rowId);
        try {
            Optional<TicketTraceabilityCenter> ticketOpt = ticketRepository.findById(rowId);
            if (ticketOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            if (!isUserSuperAdmin()) {
                return ResponseEntity.status(403).build();
            }
            ticketRepository.deleteById(rowId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Ticket deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting ticket", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- Ticket Comments Endpoints ---

    @GetMapping("/{rowId}/comments")
    @Operation(summary = "Get Ticket Comments")
    public List<SupportTicketComment> getComments(@PathVariable Integer rowId) {
        List<SupportTicketComment> comments = commentRepository.findByTicketRowIdOrderByCreatedAtAsc(rowId);
        boolean isInternal = isInternalUser();

        if (isInternal) {
            return comments;
        }

        // External users: Filter out "Internal Note" type comments
        List<SupportTicketComment> externalComments = new ArrayList<>();
        for (SupportTicketComment c : comments) {
            if (!"Internal Note".equalsIgnoreCase(c.getCommentType())) {
                externalComments.add(c);
            }
        }
        return externalComments;
    }

    @PostMapping("/{rowId}/comments")
    @Operation(summary = "Add Comment to Ticket")
    public ResponseEntity<?> addComment(@PathVariable Integer rowId, @RequestBody SupportTicketComment comment) {
        try {
            comment.setTicketRowId(rowId);
            comment.setCommentedBy(getCurrentUser());
            if (comment.getCommentType() == null) {
                comment.setCommentType("Public Reply");
            }

            // Double check access control: external user cannot submit Internal Note
            if (!isInternalUser() && "Internal Note".equalsIgnoreCase(comment.getCommentType())) {
                return ResponseEntity.status(403).body(Map.of("error", "External users cannot post Internal Notes"));
            }

            SupportTicketComment savedComment = commentRepository.save(comment);

            // Log comment into status history
            logStatusHistory(rowId, "Comment Added", comment.getComments(), null, null, null, null);

            // Log comment into status history if it represents a resolution update
            if ("Resolution Update".equalsIgnoreCase(comment.getCommentType())) {
                Optional<TicketTraceabilityCenter> tOpt = ticketRepository.findById(rowId);
                if (tOpt.isPresent()) {
                    TicketTraceabilityCenter ticket = tOpt.get();
                    ticket.setResolutionSummary(comment.getComments());
                    ticketRepository.save(ticket);
                }
            }

            return ResponseEntity.ok(savedComment);
        } catch (Exception e) {
            log.error("Error adding comment", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- History, Attachments, Reopens Endpoints ---

    @GetMapping("/{rowId}/history")
    @Operation(summary = "Get Ticket Status History")
    public List<SupportTicketStatusHistory> getStatusHistory(@PathVariable Integer rowId) {
        return statusHistoryRepository.findByTicketRowIdOrderByUpdatedAtAsc(rowId);
    }

    @GetMapping("/{rowId}/reopens")
    @Operation(summary = "Get Ticket Reopen History")
    public List<SupportTicketReopenHistory> getReopenHistory(@PathVariable Integer rowId) {
        return reopenHistoryRepository.findByTicketRowIdOrderByReopenedAtAsc(rowId);
    }

    @GetMapping("/{rowId}/attachments")
    @Operation(summary = "Get Ticket Attachments")
    public List<SupportTicketAttachment> getAttachments(@PathVariable Integer rowId) {
        return attachmentRepository.findByTicketRowIdOrderByUploadedAtAsc(rowId);
    }

    @PostMapping("/{rowId}/attachments")
    @Operation(summary = "Upload Attachment to Ticket")
    public ResponseEntity<?> addAttachment(@PathVariable Integer rowId,
            @RequestBody SupportTicketAttachment attachment) {
        try {
            Optional<TicketTraceabilityCenter> ticketOpt = ticketRepository.findById(rowId);
            if (ticketOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            TicketTraceabilityCenter ticket = ticketOpt.get();

            String tempPath = attachment.getFilePath();
            String fileType = attachment.getFileType();
            if (fileType == null || fileType.trim().isEmpty()) {
                fileType = "Attachment";
            }
            String subDirName = "Voice Recording".equalsIgnoreCase(fileType) ? "Voice Recordings" : "Attachments";

            String destRelativeFolder = "Ticketing/" + ticket.getTicketId() + "/" + subDirName;
            Path rootPath = fileService.getRootPath();
            Path source = rootPath.resolve(tempPath.trim()).normalize();

            if (Files.exists(source) && !Files.isDirectory(source)) {
                Path destFolder = rootPath.resolve(destRelativeFolder).normalize();
                if (!Files.exists(destFolder)) {
                    Files.createDirectories(destFolder);
                }

                String fileName = source.getFileName().toString();
                Path destFile = destFolder.resolve(fileName);
                Files.move(source, destFile, StandardCopyOption.REPLACE_EXISTING);

                String relativeDestPath = destRelativeFolder + "/" + fileName;
                attachment.setFilePath(relativeDestPath);

                String displayName = fileName;
                int underIdx = fileName.indexOf('_');
                if (underIdx != -1) {
                    displayName = fileName.substring(underIdx + 1);
                }
                attachment.setFileName(displayName);
            }

            attachment.setTicketRowId(rowId);
            attachment.setTicketId(ticket.getTicketId());
            attachment.setFileType(fileType);
            attachment.setUploadedBy(getCurrentUser());
            SupportTicketAttachment saved = attachmentRepository.save(attachment);

            // Sync ticket attachment_path field
            List<SupportTicketAttachment> allDbAttachments = attachmentRepository.findByTicketRowIdOrderByUploadedAtAsc(rowId);
            List<String> dbPaths = new ArrayList<>();
            for (SupportTicketAttachment att : allDbAttachments) {
                dbPaths.add(att.getFilePath());
            }
            String joinedPaths = String.join(",", dbPaths);
            if (joinedPaths.length() > 500) {
                joinedPaths = joinedPaths.substring(0, 500);
            }
            ticket.setAttachmentPath(joinedPaths);
            ticketRepository.save(ticket);

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error uploading attachment", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private static final Set<String> GOVERNMENT_HOLIDAYS = new HashSet<>(Arrays.asList(
        // 2025
        "2025-01-01", "2025-01-26", "2025-03-14", "2025-04-18", "2025-05-01", 
        "2025-08-15", "2025-10-02", "2025-10-20", "2025-11-05", "2025-12-25",
        // 2026
        "2026-01-01", "2026-01-26", "2026-03-02", "2026-04-03", "2026-05-01", 
        "2026-08-15", "2026-10-02", "2026-10-20", "2026-11-08", "2026-12-25",
        // 2027
        "2027-01-01", "2027-01-26", "2027-03-22", "2027-04-16", "2027-05-01", 
        "2027-08-15", "2027-10-02", "2027-10-09", "2027-11-08", "2027-12-25"
    ));

    private int parseDurationToMinutes(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) return 0;
        String[] parts = timeStr.split(":");
        try {
            int h = Integer.parseInt(parts[0]);
            int m = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
            return h * 60 + m;
        } catch (Exception e) {
            return 0;
        }
    }

    private boolean isNonWorkingDay(Date date) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        int dayOfWeek = cal.get(Calendar.DAY_OF_WEEK);
        if (dayOfWeek == Calendar.SUNDAY) {
            return true;
        }
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        String dateStr = sdf.format(date);
        return GOVERNMENT_HOLIDAYS.contains(dateStr);
    }

    @GetMapping("/workload/{developerName}")
    @Operation(summary = "Get developer workload (allocated minutes per date)")
    public ResponseEntity<Map<String, WorkloadDayDetail>> getDeveloperWorkload(@PathVariable String developerName) {
        try {
            List<TicketTraceabilityCenter> tickets = ticketRepository.findAllByOrderByCreatedAtDesc();
            tickets.sort(Comparator.comparing(TicketTraceabilityCenter::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
            List<TicketTraceabilityCenter> activeTickets = new ArrayList<>();
            for (TicketTraceabilityCenter t : tickets) {
                if (t.getDeveloperName() == null || !t.getDeveloperName().equalsIgnoreCase(developerName)) {
                    continue;
                }
                String status = t.getTicketStatus();
                if ("Closed".equalsIgnoreCase(status) || "Resolved".equalsIgnoreCase(status) || "Completed".equalsIgnoreCase(status)
                        || "To Be Verified".equalsIgnoreCase(status) || "Yet To Deploy".equalsIgnoreCase(status) 
                        || "To Be Tested".equalsIgnoreCase(status)) {
                    continue;
                }
                String hours = t.getAssignedHours();
                if (hours == null || hours.trim().isEmpty()) {
                    continue;
                }
                activeTickets.add(t);
            }

            Map<String, WorkloadDayDetail> workload = new LinkedHashMap<>();
            final int DAILY_CAPACITY = 12 * 60; // 12 Hours max per day

            for (TicketTraceabilityCenter t : activeTickets) {
                String[] parts = t.getAssignedHours().split(":");
                int remainingMins = 0;
                try {
                    remainingMins = Integer.parseInt(parts[0]) * 60 + (parts.length > 1 ? Integer.parseInt(parts[1]) : 0);
                } catch (NumberFormatException ignored) {
                }

                if (t.getTakenTime() != null && !t.getTakenTime().trim().isEmpty()) {
                    String[] ttParts = t.getTakenTime().split(":");
                    try {
                        remainingMins -= Integer.parseInt(ttParts[0]) * 60 + (ttParts.length > 1 ? Integer.parseInt(ttParts[1]) : 0);
                    } catch (NumberFormatException ignored) {}
                }
                if (t.getReworkTime() != null && !t.getReworkTime().trim().isEmpty()) {
                    String[] rwParts = t.getReworkTime().split(":");
                    try {
                        remainingMins -= Integer.parseInt(rwParts[0]) * 60 + (rwParts.length > 1 ? Integer.parseInt(rwParts[1]) : 0);
                    } catch (NumberFormatException ignored) {}
                }

                if (remainingMins <= 0) {
                    continue;
                }

                Date cursorDate = new Date();
                Calendar cal = Calendar.getInstance();
                cal.setTime(cursorDate);
                cal.set(Calendar.HOUR_OF_DAY, 0);
                cal.set(Calendar.MINUTE, 0);
                cal.set(Calendar.SECOND, 0);
                cal.set(Calendar.MILLISECOND, 0);
                cursorDate = cal.getTime();

                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");

                while (remainingMins > 0) {
                    if (isNonWorkingDay(cursorDate)) {
                        cal.setTime(cursorDate);
                        cal.add(Calendar.DATE, 1);
                        cursorDate = cal.getTime();
                        continue;
                    }

                    String dateKey = sdf.format(cursorDate);
                    WorkloadDayDetail dayDetail = workload.computeIfAbsent(dateKey, k -> new WorkloadDayDetail(0, new ArrayList<>()));

                    int alreadyAllocated = dayDetail.getTotalMinutes();
                    int available = DAILY_CAPACITY - alreadyAllocated;

                    if (available <= 0) {
                        cal.setTime(cursorDate);
                        cal.add(Calendar.DATE, 1);
                        cursorDate = cal.getTime();
                        continue;
                    }

                    int used = Math.min(remainingMins, available);
                    dayDetail.setTotalMinutes(alreadyAllocated + used);

                    dayDetail.getTickets().add(new WorkloadTicketDetail(
                        t.getTicketId(),
                        t.getEmployeeName() != null ? t.getEmployeeName() : t.getCreatedBy(),
                        t.getTitle(),
                        used
                    ));

                    remainingMins -= used;

                    if (remainingMins > 0) {
                        cal.setTime(cursorDate);
                        cal.add(Calendar.DATE, 1);
                        cursorDate = cal.getTime();
                    }
                }
            }
            return ResponseEntity.ok(workload);
        } catch (Exception e) {
            log.error("Error fetching developer workload", e);
            return ResponseEntity.ok(Map.of());
        }
    }

    private List<String> moveTempFiles(List<String> tempPaths, String ticketId, Integer ticketRowId, String fileType, String subDirName) {
        List<String> finalPaths = new ArrayList<>();
        if (tempPaths == null || tempPaths.isEmpty()) {
            return finalPaths;
        }

        try {
            String destRelativeFolder = "Ticketing/" + ticketId + "/" + subDirName;
            Path rootPath = fileService.getRootPath();
            Path destFolder = rootPath.resolve(destRelativeFolder).normalize();

            for (String tempPath : tempPaths) {
                if (tempPath == null || tempPath.trim().isEmpty()) {
                    continue;
                }

                Path source = rootPath.resolve(tempPath.trim()).normalize();
                if (Files.exists(source) && !Files.isDirectory(source)) {
                    // Create dest folder
                    if (!Files.exists(destFolder)) {
                        Files.createDirectories(destFolder);
                    }

                    String fileName = source.getFileName().toString();
                    Path destFile = destFolder.resolve(fileName);
                    Files.move(source, destFile, StandardCopyOption.REPLACE_EXISTING);

                    String relativeDestPath = destRelativeFolder + "/" + fileName;
                    finalPaths.add(relativeDestPath);

                    // Create database record
                    String displayName = fileName;
                    int underIdx = fileName.indexOf('_');
                    if (underIdx != -1) {
                        displayName = fileName.substring(underIdx + 1);
                    }

                    SupportTicketAttachment attachment = new SupportTicketAttachment();
                    attachment.setTicketRowId(ticketRowId);
                    attachment.setTicketId(ticketId);
                    attachment.setFileName(displayName);
                    attachment.setFilePath(relativeDestPath);
                    attachment.setFileType(fileType);
                    attachment.setUploadedBy(getCurrentUser());
                    attachmentRepository.save(attachment);
                } else {
                    // If source doesn't exist, check if it's already a final path (for ticket updates)
                    if (tempPath.contains("Ticketing/" + ticketId + "/")) {
                        finalPaths.add(tempPath.trim());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error moving temp files for ticket " + ticketId, e);
        }
        return finalPaths;
    }

    public static class WorkloadDayDetail {
        private int totalMinutes;
        private List<WorkloadTicketDetail> tickets;

        public WorkloadDayDetail() {
            this.tickets = new ArrayList<>();
        }

        public WorkloadDayDetail(int totalMinutes, List<WorkloadTicketDetail> tickets) {
            this.totalMinutes = totalMinutes;
            this.tickets = tickets;
        }

        public int getTotalMinutes() {
            return totalMinutes;
        }

        public void setTotalMinutes(int totalMinutes) {
            this.totalMinutes = totalMinutes;
        }

        public List<WorkloadTicketDetail> getTickets() {
            return tickets;
        }

        public void setTickets(List<WorkloadTicketDetail> tickets) {
            this.tickets = tickets;
        }
    }

    public static class WorkloadTicketDetail {
        private String ticketId;
        private String employeeName;
        private String title;
        private int allocatedMinutes;

        public WorkloadTicketDetail() {}

        public WorkloadTicketDetail(String ticketId, String employeeName, String title, int allocatedMinutes) {
            this.ticketId = ticketId;
            this.employeeName = employeeName;
            this.title = title;
            this.allocatedMinutes = allocatedMinutes;
        }

        public String getTicketId() {
            return ticketId;
        }

        public void setTicketId(String ticketId) {
            this.ticketId = ticketId;
        }

        public String getEmployeeName() {
            return employeeName;
        }

        public void setEmployeeName(String employeeName) {
            this.employeeName = employeeName;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public int getAllocatedMinutes() {
            return allocatedMinutes;
        }

        public void setAllocatedMinutes(int allocatedMinutes) {
            this.allocatedMinutes = allocatedMinutes;
        }
    }

    @PostMapping("/transcribe")
    @Operation(summary = "Transcribe uploaded voice recording")
    public ResponseEntity<?> transcribeVoiceRecording(
            @RequestParam("file") MultipartFile file, 
            @RequestParam(value = "language", required = false) String language,
            @RequestParam(value = "transcribedText", required = false) String transcribedText) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Audio file is empty or not provided."));
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid file name."));
        }
        
        String ext = "";
        int idx = originalFilename.lastIndexOf('.');
        if (idx > 0) {
            ext = originalFilename.substring(idx + 1).toLowerCase();
        }
        
        if (!Arrays.asList("mp3", "wav", "m4a", "aac", "webm", "ogg").contains(ext)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid audio format. Supported formats: MP3, WAV, M4A, AAC."));
        }
        
        try {
            Thread.sleep(50);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        String resultText = (transcribedText != null) ? transcribedText : "";
        
        return ResponseEntity.ok(Map.of(
            "text", resultText,
            "filename", originalFilename,
            "detectedLanguage", (language != null) ? language : "en-in"
        ));
    }

    private void logStatusHistory(Integer ticketRowId, String activityName, String commentText, String fromStatus, String toStatus, String assignedUser, String targetDateChanges) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("activityName", activityName);
            payload.put("comment", commentText != null ? commentText : "");
            payload.put("fromStatus", fromStatus);
            payload.put("toStatus", toStatus);
            payload.put("assignedUser", assignedUser);
            payload.put("targetDateChanges", targetDateChanges);
            
            String jsonComment = objectMapper.writeValueAsString(payload);
            
            String finalFrom = fromStatus;
            String finalTo = toStatus;
            
            if (finalTo == null) {
                Optional<TicketTraceabilityCenter> tOpt = ticketRepository.findById(ticketRowId);
                if (tOpt.isPresent()) {
                    finalTo = tOpt.get().getTicketStatus();
                }
            }
            if (finalTo == null) {
                finalTo = "Open";
            }
            
            SupportTicketStatusHistory history = new SupportTicketStatusHistory();
            history.setTicketRowId(ticketRowId);
            history.setFromStatus(finalFrom);
            history.setToStatus(finalTo);
            history.setUpdatedBy(getCurrentUser());
            history.setComment(jsonComment);
            statusHistoryRepository.save(history);
        } catch (Exception e) {
            log.error("Failed to log status history for ticket ID: " + ticketRowId, e);
        }
    }
}

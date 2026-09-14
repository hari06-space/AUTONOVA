package com.autonoma.erp.modules.qms.meeting.validator;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails;
import com.autonoma.erp.model.admin.UserCredential;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class ActionItemWorkflowValidator {

    @Autowired
    private com.autonoma.erp.service.admin.BosUserPageAuthService authService;

    @Autowired
    private com.autonoma.erp.modules.qms.meeting.repository.QmsCloseMomAndVerifyRepository closeMomAndVerifyRepository;

    private String resolveStatus(QmsMomDetails detail) {
        if (detail == null)
            return "open";
        var logs = closeMomAndVerifyRepository.findByActionItemId(detail.getId());
        if (logs != null && !logs.isEmpty()) {
            var latestLog = logs.stream()
                    .max(java.util.Comparator
                            .comparing(com.autonoma.erp.modules.qms.meeting.entity.QmsCloseMomAndVerify::getId))
                    .orElse(null);
            if (latestLog != null && latestLog.getNewStatus() != null) {
                return latestLog.getNewStatus();
            }
        }
        return detail.getStatus();
    }

    private boolean isPendingVerification(String status) {
        if (status == null)
            return false;
        String s = status.toLowerCase().replace("_", " ").trim();
        return "pending for verified".equals(s) || "pending for verify".equals(s);
    }

    public void validateSubmit(QmsMomDetails detail, UserCredential user, int attachmentCount) {
        if (detail.getAssignedTo() == null || user.getEmpId() == null
                || !user.getEmpId().equals(detail.getAssignedTo().getId())) {
            throw new RuntimeException(
                    "Unauthorized: Only the worker assigned to this action item can submit it for closure.");
        }

        String resolved = resolveStatus(detail);
        String currentStatus = resolved != null ? resolved.toLowerCase().replace("_", " ").trim() : "open";
        // Support variations in naming
        if ("created".equals(currentStatus) || "unresolved".equals(currentStatus)) {
            currentStatus = "open";
        }
        // Block re-submission if already pending verification or accepted
        if (isPendingVerification(currentStatus) ||
                "accepted".equals(currentStatus) ||
                "verified".equals(currentStatus)) {
            throw new RuntimeException("Task is already submitted or closed (status: " + resolved + ").");
        }
        if (!"open".equals(currentStatus) && !"rejected".equals(currentStatus) && !"pending".equals(currentStatus)) {
            throw new RuntimeException("Transition from " + resolved + " to Pending for Verify is not allowed.");
        }

        boolean isAttachmentReq = "YES".equalsIgnoreCase(detail.getAttachmentRequired()) ||
                "TRUE".equalsIgnoreCase(detail.getAttachmentRequired());
        if (isAttachmentReq && attachmentCount <= 0) {
            throw new RuntimeException("Attachment is mandatory for this action item.");
        }
    }

    public void validateApprove(QmsMomDetails detail, UserCredential user) {
        if (user == null || user.getUserId() == null) {
            throw new RuntimeException("Unauthorized: User session is invalid.");
        }

        boolean hasWrite = authService.hasPermission(user.getUserId(), "QM1350", "write");
        boolean hasApproval = authService.hasPermission(user.getUserId(), "QM1350", "approval");

        if (!hasWrite && !hasApproval) {
            throw new RuntimeException(
                    "Unauthorized: You do not have permission to verify action items on the MOM Approval page.");
        }

        String resolved = resolveStatus(detail);
        String currentStatus = resolved != null ? resolved.toLowerCase().replace("_", " ").trim() : "open";
        if (!isPendingVerification(currentStatus)) {
            throw new RuntimeException(
                    "Cannot verify: action item must be in 'Pending for Verify' status (current: " + resolved + ").");
        }
    }

    public void validateReject(QmsMomDetails detail, UserCredential user, String comments) {
        if (user == null || user.getUserId() == null) {
            throw new RuntimeException("Unauthorized: User session is invalid.");
        }

        boolean hasWrite = authService.hasPermission(user.getUserId(), "QM1350", "write");
        boolean hasApproval = authService.hasPermission(user.getUserId(), "QM1350", "approval");

        if (!hasWrite && !hasApproval) {
            throw new RuntimeException(
                    "Unauthorized: You do not have permission to reject action items on the MOM Approval page.");
        }

        String resolved = resolveStatus(detail);
        String currentStatus = resolved != null ? resolved.toLowerCase().replace("_", " ").trim() : "open";
        if (!isPendingVerification(currentStatus)) {
            throw new RuntimeException(
                    "Cannot reject: action item must be in 'Pending for Verify' status (current: " + resolved + ").");
        }

        if (comments == null || comments.trim().isEmpty()) {
            throw new RuntimeException("Rejection comments are mandatory.");
        }
    }
}

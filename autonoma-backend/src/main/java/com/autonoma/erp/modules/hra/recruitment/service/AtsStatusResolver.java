package com.autonoma.erp.modules.hra.recruitment.service;

import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AtsStatusResolver {
    @Autowired
    private StatusMasterRepository statusRepo;

    private final Map<String, StatusMaster> statusCache = new ConcurrentHashMap<>();

    @Transactional
    public StatusMaster get(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        String inputStr = name.trim();
        if (inputStr.matches("\\d+")) {
            return statusRepo.findById(Long.parseLong(inputStr)).orElse(null);
        }

        String cacheKey = inputStr.toUpperCase();
        return statusCache.computeIfAbsent(cacheKey, k -> {
            // 1. Try finding by exact input name in AD_STATUS_MASTER
            java.util.Optional<StatusMaster> opt = statusRepo.findByNameIgnoreCase(inputStr);
            if (opt.isPresent()) {
                return opt.get();
            }

            // 2. Normalize and check aliases
            String normalizedName = inputStr.toUpperCase();
            if ("ON HOLD".equals(normalizedName) || "ON_HOLD".equals(normalizedName) || "HOLD".equals(normalizedName)) {
                normalizedName = "Hold";
            } else if ("RESEND".equals(normalizedName)) {
                normalizedName = "RESENT";
            } else if ("PENDING".equals(normalizedName) || "OPEN".equals(normalizedName)) {
                normalizedName = "Pending";
            } else if ("VERIFIED".equals(normalizedName) || "CONFIRM".equals(normalizedName)
                    || "ACCEPTED".equals(normalizedName) || "APPROVED".equals(normalizedName)) {
                normalizedName = "Verified";
            } else if ("TO BE VERIFY".equals(normalizedName) || "TO_BE_VERIFY".equals(normalizedName)
                    || "TO BE VERIFIED".equals(normalizedName) || "SUBMITTED".equals(normalizedName)) {
                normalizedName = "TO BE VERIFY";
            } else if ("COMPLETED".equals(normalizedName) || "IN PROGRESS".equals(normalizedName)
                    || "IN_PROGRESS".equals(normalizedName)) {
                normalizedName = "In Progress";
            } else if ("REJECTED".equals(normalizedName)) {
                normalizedName = "Rejected";
            } else if ("CANCELLED".equals(normalizedName)) {
                normalizedName = "CANCELLED";
            } else if ("SELECTED".equals(normalizedName)) {
                normalizedName = "SELECTED";
            } else if ("WAITING FOR PROCESS".equals(normalizedName) || "WAITING_FOR_PROCESS".equals(normalizedName)) {
                normalizedName = "Waiting For Process";
            }

            // 3. Search by normalized alias in AD_STATUS_MASTER
            opt = statusRepo.findByNameIgnoreCase(normalizedName);
            if (opt.isPresent()) {
                return opt.get();
            }

            // 4. Auto-save new status in AD_STATUS_MASTER if not found in database
            StatusMaster newStatus = new StatusMaster();
            newStatus.setName(inputStr);
            return statusRepo.save(newStatus);
        });
    }

    public boolean is(StatusMaster s, String name) {
        if (s == null || name == null)
            return false;
        StatusMaster target = get(name);
        return target != null && s.getId() != null && target.getId() != null && s.getId().equals(target.getId());
    }

    public boolean isSame(StatusMaster s1, StatusMaster s2) {
        return s1 != null && s2 != null && s1.getId() != null && s1.getId().equals(s2.getId());
    }

    public boolean isPending(StatusMaster s) {
        return is(s, "Pending");
    }

    public boolean isSent(StatusMaster s) {
        return is(s, "SENT");
    }

    public boolean isResent(StatusMaster s) {
        return is(s, "RESENT");
    }

    public boolean isVerified(StatusMaster s) {
        return is(s, "Verified");
    }

    public boolean isToBeVerified(StatusMaster s) {
        return is(s, "TO BE VERIFIED");
    }

    public boolean isCancelled(StatusMaster s) {
        return is(s, "CANCELLED");
    }

    public boolean isNotApplicable(StatusMaster s) {
        return is(s, "Not Applicable");
    }

    public boolean isInProgress(StatusMaster s) {
        return is(s, "In Progress");
    }

    public boolean isSelected(StatusMaster s) {
        return is(s, "SELECTED");
    }

    public boolean isRejected(StatusMaster s) {
        return is(s, "Rejected");
    }

    public boolean isPartiallyVerified(StatusMaster s) {
        return is(s, "Partially Verified");
    }

    public boolean isWaitingForProgress(StatusMaster s) {
        return is(s, "Waiting For Progress");
    }

    public boolean isHold(StatusMaster s) {
        return is(s, "Hold");
    }

    public boolean isCompleted(StatusMaster s) {
        return is(s, "Completed");
    }

    public boolean isWaitingForProcess(StatusMaster s) {
        return is(s, "Waiting For Process");
    }
}

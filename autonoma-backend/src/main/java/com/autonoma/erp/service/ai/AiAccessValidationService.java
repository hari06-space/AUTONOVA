package com.autonoma.erp.service.ai;

import com.autonoma.erp.repository.ai.BosAiKnowledgeRepository;
import com.autonoma.erp.service.admin.BosUserPageAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Validates whether the current user has access to the data
 * required by their AI request.
 *
 * This service bridges Autonoma AI to the existing BOSS authorization
 * framework (BOS_USER_PAGE_AUTH + USER_LEVEL) without creating any
 * separate AI permission system.
 */
@Service
public class AiAccessValidationService {

    @Autowired
    private BosUserPageAuthService bosUserPageAuthService;

    @Autowired
    private BosAiKnowledgeRepository knowledgeRepository;

    /**
     * Module → page code mapping for access checks.
     * These are the minimum read-permission page codes per module.
     */
    private static final Map<String, List<String>> MODULE_PAGE_CODES = Map.of(
        "HR",        List.of("M2210"),
        "HRA",       List.of("HA1110"),
        "QMS",       List.of("QM1120"),
        "SALES",     List.of("SM1120"),
        "CRM",       List.of("M5130"),
        "VENDOR",    List.of("M4110"),
        "NPD",       List.of("M3110"),
        "FINANCE",   List.of("FA0000"),
        "INVENTORY", List.of("SL0000")
    );

    /**
     * Check if the user can access data for the given module.
     *
     * @param userId The authenticated user ID
     * @param module The detected ERP module (from IntentDetectionService)
     * @return AccessResult with allowed flag and message
     */
    public AccessResult validateAccess(String userId, String module) {
        if (userId == null || userId.isBlank()) {
            return AccessResult.denied("Authentication required.");
        }

        // GENERAL / GREETING intent – always allowed
        if (module == null || module.equalsIgnoreCase("GENERAL")) {
            return AccessResult.allowed(List.of());
        }

        List<String> pageCodes = MODULE_PAGE_CODES.getOrDefault(module.toUpperCase(), List.of());

        if (pageCodes.isEmpty()) {
            // Unknown module – grant access but log
            return AccessResult.allowed(List.of());
        }

        List<String> grantedPageCodes = new ArrayList<>();
        List<String> deniedPageCodes  = new ArrayList<>();

        for (String pageCode : pageCodes) {
            boolean canRead = bosUserPageAuthService.hasPermission(userId, pageCode, "read");
            if (canRead) {
                grantedPageCodes.add(pageCode);
            } else {
                deniedPageCodes.add(pageCode);
            }
        }

        if (!deniedPageCodes.isEmpty() && grantedPageCodes.isEmpty()) {
            return AccessResult.denied(
                "You do not have access to the " + module + " module. " +
                "Please contact your administrator to request access."
            );
        }

        return AccessResult.allowed(grantedPageCodes);
    }

    /**
     * Validate access for multiple modules at once (cross-module queries).
     */
    public Map<String, AccessResult> validateMultiModuleAccess(String userId, List<String> modules) {
        Map<String, AccessResult> results = new LinkedHashMap<>();
        for (String module : modules) {
            results.put(module, validateAccess(userId, module));
        }
        return results;
    }

    /**
     * Get all modules accessible to this user (for suggested prompts).
     */
    public List<String> getAccessibleModules(String userId) {
        List<String> accessible = new ArrayList<>();
        for (String module : MODULE_PAGE_CODES.keySet()) {
            AccessResult result = validateAccess(userId, module);
            if (result.allowed()) {
                accessible.add(module);
            }
        }
        return accessible;
    }

    // ------------------------------------------------------------------

    public record AccessResult(boolean allowed, List<String> grantedPageCodes, String message) {
        static AccessResult allowed(List<String> pages) {
            return new AccessResult(true, pages, null);
        }
        static AccessResult denied(String message) {
            return new AccessResult(false, List.of(), message);
        }
    }
}

package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.AiPermissionContext;
import com.autonoma.erp.modules.notebook.dto.AiPermissionContext.SensitivityLevel;
import com.autonoma.erp.modules.notebook.dto.IntentResult;
import com.autonoma.erp.modules.notebook.dto.IntentResult.DataScope;
import com.autonoma.erp.modules.notebook.entity.Notebook;
import com.autonoma.erp.service.admin.BosUserPageAuthService;
import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.repository.admin.UserCompanyMappingRepository;
import com.autonoma.erp.repository.admin.UserDivisionMappingRepository;
import AppUtil.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Centralized AI Permission Engine.
 *
 * All permission decisions flow through here. No scattered hasPermission checks.
 * Page codes are resolved dynamically via ModulePageResolver — nothing is hardcoded.
 *
 * Flow:
 *   BosIntentEngine (classify) → AiPermissionEngine (evaluate) → AiQueryPlanner (plan) → Tools → Gemini
 */
@Service
public class AiPermissionEngine {

    @Autowired
    private BosUserPageAuthService pageAuthService;

    @Autowired
    private ModulePageResolver modulePageResolver;

    @Autowired
    private AiScopeResolver scopeResolver;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserCompanyMappingRepository userCompanyMappingRepository;

    @Autowired
    private UserDivisionMappingRepository userDivisionMappingRepository;

    @Autowired
    private AiSkillRegistry skillRegistry;

    /**
     * Evaluate what this user is permitted to access for the given intent and notebook.
     *
     * @param userId      Current authenticated user ID
     * @param intent      Output of BosIntentEngine.classify()
     * @param notebook    The notebook being queried
     * @return            Rich AiPermissionContext describing all capabilities
     */
    public AiPermissionContext evaluate(String userId, IntentResult intent, Notebook notebook) {
        List<String> permissionChecks = new ArrayList<>();
        Set<String> allowedModules = new LinkedHashSet<>();
        Set<String> deniedModules = new LinkedHashSet<>();

        // 1. Resolve user identity
        Long empId = resolveEmpId(userId);
        Long companyId = resolveCompanyId(userId);
        Long divisionId = resolveDivisionId(userId);
        boolean isPrivileged = isPrivileged(userId);

        // 2. Company isolation — validate notebook company matches user company
        boolean companyValidated = true;
        if (!isPrivileged && notebook != null && notebook.getCompanyId() != null && companyId != null) {
            companyValidated = notebook.getCompanyId().equals(companyId);
            permissionChecks.add("COMPANY_ISOLATION=" + (companyValidated ? "PASS" : "FAIL"));
        }

        // 3. Evaluate each detected module
        if (isPrivileged) {
            // Privileged users get access to all detected modules
            allowedModules.addAll(intent.detectedModules());
            for (String m : intent.detectedModules()) {
                permissionChecks.add(m + "=GRANTED(PRIVILEGED)");
            }
        } else {
            for (String module : intent.detectedModules()) {
                boolean granted = hasModulePermission(userId, module, permissionChecks);
                if (granted) {
                    allowedModules.add(module);
                } else {
                    deniedModules.add(module);
                }
            }
        }

        // 4. Resolve data scope hierarchy
        Set<DataScope> allowedScopes = scopeResolver.resolveAllowedScopes(userId, empId, isPrivileged);

        // 5. Determine personal data rules
        boolean canViewOthersPersonalData = isPrivileged ||
            hasAnyPagePermission(userId, "EMPLOYEE", permissionChecks) ||
            hasAnyPagePermission(userId, "ATTENDANCE", permissionChecks) ||
            hasAnyPagePermission(userId, "LEAVE", permissionChecks);
        boolean isManager = scopeResolver.isManager(userId, empId);
        boolean canViewDivisionData = isPrivileged || scopeResolver.isDivisionManager(userId, empId);
        boolean canViewCompanyData = isPrivileged || scopeResolver.isSeniorManagement(userId);

        // 6. Determine sensitivity clearance
        SensitivityLevel clearance = resolveSensitivityClearance(isPrivileged, allowedModules);

        // 7. Build allowed tools list based on allowed modules
        Set<String> allowedTools = resolveAllowedTools(allowedModules, allowedScopes, isPrivileged);

        return new AiPermissionContext(
            userId, empId, companyId, divisionId,
            null, // departmentCode — optional, enriched lazily if needed
            allowedModules, deniedModules, allowedTools,
            allowedScopes, clearance,
            canViewOthersPersonalData, isManager,
            canViewDivisionData, canViewCompanyData, isPrivileged,
            companyValidated,
            permissionChecks,
            intent.isInjectionAttempt()
        );
    }

    // ─── Module Permission Check ──────────────────────────────────────────────

    /**
     * Checks if the user has READ access to any page in the given AI module.
     * Uses ModulePageResolver — no hardcoded page codes.
     */
    private boolean hasModulePermission(String userId, String module, List<String> checks) {
        // First try registry manifest page codes (authoritative source)
        Set<String> pageCodes = skillRegistry.getAllRequiredPageCodes(module);
        // Fallback to ModulePageResolver for modules without a registered skill
        if (pageCodes.isEmpty()) {
            pageCodes = modulePageResolver.getPageCodesForModule(module);
        }
        if (pageCodes.isEmpty()) {
            checks.add(module + "=NO_PAGES_FOUND");
            return false;
        }
        for (String pageCode : pageCodes) {
            if (pageAuthService.hasPermission(userId, pageCode, "read")) {
                checks.add(module + "." + pageCode + "=GRANTED");
                return true;
            }
        }
        checks.add(module + "=DENIED(no read access to any of: " + String.join(",", pageCodes) + ")");
        return false;
    }

    private boolean hasAnyPagePermission(String userId, String module, List<String> checks) {
        return hasModulePermission(userId, module, checks);
    }

    // ─── Identity Resolution ──────────────────────────────────────────────────

    private boolean isPrivileged(String userId) {
        if (userId == null) return false;
        return userRepository.findByUserId(userId)
            .map(u -> u.getUserLevel() != null &&
                 u.getUserLevel() >= AppConstants.USER_LEVEL_ADMIN)
            .orElse(false);
    }

    public Long resolveCurrentUserCompanyId() {
        return resolveCompanyId(SecurityUtils.getCurrentUserId());
    }

    public Long resolveCurrentUserDivisionId() {
        return resolveDivisionId(SecurityUtils.getCurrentUserId());
    }

    Long resolveCompanyId(String userId) {
        if (userId == null) return null;
        String originalTenant = SecurityUtils.getCurrentTenantId();
        try {
            SecurityUtils.setCurrentTenantId("AUTONOMA");
            var mappings = userCompanyMappingRepository.findByUserId(userId);
            if (mappings != null && !mappings.isEmpty()) return mappings.get(0).getCompanyId();
        } catch (Exception ignored) {
        } finally {
            SecurityUtils.setCurrentTenantId(originalTenant);
        }
        try { return Long.parseLong(SecurityUtils.getCurrentTenantId()); } catch (Exception ignored) {}
        return 1L;
    }

    Long resolveDivisionId(String userId) {
        if (userId == null) return null;
        String originalTenant = SecurityUtils.getCurrentTenantId();
        try {
            SecurityUtils.setCurrentTenantId("AUTONOMA");
            var mappings = userDivisionMappingRepository.findByUserId(userId);
            if (mappings != null && !mappings.isEmpty()) return mappings.get(0).getDivisionId();
        } catch (Exception ignored) {
        } finally {
            SecurityUtils.setCurrentTenantId(originalTenant);
        }
        return null;
    }

    Long resolveEmpId(String userId) {
        if (userId == null) return null;
        String originalTenant = SecurityUtils.getCurrentTenantId();
        try {
            SecurityUtils.setCurrentTenantId("AUTONOMA");
            return userRepository.findByUserId(userId)
                .map(u -> u.getEmpId()).orElse(null);
        } finally {
            SecurityUtils.setCurrentTenantId(originalTenant);
        }
    }

    // ─── Sensitivity Clearance ────────────────────────────────────────────────

    private SensitivityLevel resolveSensitivityClearance(boolean isPrivileged, Set<String> allowedModules) {
        if (isPrivileged) return SensitivityLevel.RESTRICTED;
        if (allowedModules.contains("PAYROLL") || allowedModules.contains("FINANCE")) {
            return SensitivityLevel.RESTRICTED;
        }
        if (allowedModules.contains("ATTENDANCE") || allowedModules.contains("LEAVE")) {
            return SensitivityLevel.CONFIDENTIAL;
        }
        if (!allowedModules.isEmpty()) return SensitivityLevel.INTERNAL;
        return SensitivityLevel.PUBLIC;
    }

    // ─── Tool Resolution ──────────────────────────────────────────────────────

    /**
     * Resolves allowed tool identifiers from registered skill manifests.
     * Uses entity names (e.g. "CHECKLIST") not deleted class names.
     * Any skill whose erpModule is in allowedModules is considered accessible.
     */
    private Set<String> resolveAllowedTools(Set<String> allowedModules, Set<DataScope> scopes, boolean isPrivileged) {
        Set<String> tools = new LinkedHashSet<>();
        skillRegistry.getAllSkills().stream()
            .filter(s -> {
                String mod = s.manifest().erpModule();
                return isPrivileged || allowedModules.contains(mod);
            })
            .forEach(s -> tools.add(s.manifest().entity()));
        return tools;
    }
}

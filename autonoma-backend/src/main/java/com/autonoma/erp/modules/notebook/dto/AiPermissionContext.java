package com.autonoma.erp.modules.notebook.dto;

import com.autonoma.erp.modules.notebook.dto.IntentResult.DataScope;
import java.util.List;
import java.util.Set;

/**
 * Rich capability object returned by AiPermissionEngine.
 * Replaces all scattered hasPermission boolean checks.
 */
public record AiPermissionContext(
    String userId,
    Long empId,
    Long companyId,
    Long divisionId,
    String departmentCode,
    Set<String> allowedModules,
    Set<String> deniedModules,
    Set<String> allowedTools,
    Set<DataScope> allowedScopes,
    SensitivityLevel sensitivityClearance,
    boolean canViewOthersPersonalData,
    boolean isManager,
    boolean canViewDivisionData,
    boolean canViewCompanyData,
    boolean isPrivileged,
    boolean companyValidated,
    List<String> permissionChecks,
    boolean injectionDetected
) {
    public enum SensitivityLevel {
        PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, SECRET;
        public boolean allowsAccess(SensitivityLevel required) {
            return this.ordinal() >= required.ordinal();
        }
    }
    public boolean canAccessModule(String module) { return allowedModules.contains(module); }
    public boolean canAccessScope(DataScope scope) { return allowedScopes.contains(scope); }
}

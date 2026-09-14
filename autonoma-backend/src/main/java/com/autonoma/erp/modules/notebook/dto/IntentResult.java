package com.autonoma.erp.modules.notebook.dto;

import java.util.Set;

/**
 * Output of BosIntentEngine — deterministic local classification of the user query.
 * No Gemini call is made. All security decisions are based on this object.
 */
public record IntentResult(
    IntentCategory category,
    Set<String> detectedModules,
    boolean isPersonalDataRequest,
    boolean isCrossUserRequest,
    String targetEntityType,
    String targetEntityHint,
    DataScope requestedScope,
    boolean isAmbiguous,
    boolean isInjectionAttempt
) {
    public enum IntentCategory {
        EMPLOYEE_QUERY, PAYROLL_QUERY, LEAVE_QUERY, ATTENDANCE_QUERY,
        QMS_CHECKLIST_QUERY, QMS_AUDIT_QUERY, QMS_MEETING_QUERY,
        MACHINE_QUERY, CUSTOMER_QUERY, SUPPLIER_QUERY, INVENTORY_QUERY,
        SALES_QUERY, SUPPORT_QUERY, SATISFACTION_QUERY, MAINTENANCE_QUERY,
        CROSS_MODULE_QUERY, GENERAL_QUERY, INJECTION_ATTEMPT
    }
    public enum DataScope { SELF, TEAM, DEPARTMENT, DIVISION, COMPANY, GLOBAL }

    public static IntentResult injectionAttempt() {
        return new IntentResult(IntentCategory.INJECTION_ATTEMPT, Set.of(),
            false, false, null, null, DataScope.SELF, false, true);
    }
    public static IntentResult general() {
        return new IntentResult(IntentCategory.GENERAL_QUERY, Set.of(),
            false, false, null, null, DataScope.SELF, false, false);
    }
}

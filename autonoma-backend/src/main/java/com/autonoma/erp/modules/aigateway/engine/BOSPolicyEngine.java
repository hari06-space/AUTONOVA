package com.autonoma.erp.modules.aigateway.engine;

import com.autonoma.erp.modules.aigateway.dto.UserContext;
import com.autonoma.erp.modules.aigateway.dto.ScopeResponse;
import org.springframework.stereotype.Service;

@Service
public class BOSPolicyEngine {

    /**
     * Evaluates security policies based on user contexts and target resource parameters.
     * Enforces strict company/tenant bounds globally.
     */
    public ScopeResponse evaluate(UserContext user, String resource, String action) {
        // Enforce Multi-Company isolation boundary first
        if (user.getCompanyId() == null) {
            return ScopeResponse.deny("Multi-Company isolation error: active session has no company context.");
        }

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "";

        // Standard Policy Checks
        if ("PAYROLL".equalsIgnoreCase(resource)) {
            if ("write".equalsIgnoreCase(action)) {
                return ScopeResponse.deny("Policy Violation: AI is strictly prohibited from writing or modifying Payroll records.");
            }
            if (role.contains("HR_ADMIN")) {
                return ScopeResponse.allowFiltered("company_id = '" + user.getCompanyId() + "'");
            } else if (role.contains("MANAGER") || role.contains("VERTICAL_HEAD")) {
                // Restrict to direct reports within the company
                return ScopeResponse.allowFiltered("company_id = '" + user.getCompanyId() + "' AND vertical_head_id = " + user.getEmpId());
            } else {
                // Employees can only view their own payroll details
                return ScopeResponse.allowFiltered("company_id = '" + user.getCompanyId() + "' AND employee_id = " + user.getEmpId());
            }
        }

        if ("CHECKLIST".equalsIgnoreCase(resource)) {
            if (role.contains("ADMIN") || role.contains("QMS_AUDITOR")) {
                return ScopeResponse.allowFiltered("company_id = '" + user.getCompanyId() + "'");
            }
            // Self-service or team reports
            return ScopeResponse.allowFiltered("company_id = '" + user.getCompanyId() + "' AND (assigned_to = '" + user.getEmpCode() + "' OR vertical_head_id = " + user.getEmpId() + ")");
        }

        // Fallback policy: allow read-only within company boundaries, deny write actions
        if ("read".equalsIgnoreCase(action) || "select".equalsIgnoreCase(action)) {
            return ScopeResponse.allowFiltered("company_id = '" + user.getCompanyId() + "'");
        }
        
        return ScopeResponse.deny("Policy Engine Fallback: Action " + action + " on " + resource + " unauthorized.");
    }
}

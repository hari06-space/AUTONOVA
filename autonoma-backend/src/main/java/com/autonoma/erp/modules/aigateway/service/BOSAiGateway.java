package com.autonoma.erp.modules.aigateway.service;

import com.autonoma.erp.modules.aigateway.dto.UserContext;
import com.autonoma.erp.modules.aigateway.dto.ScopeResponse;
import com.autonoma.erp.modules.aigateway.engine.BOSPolicyEngine;
import com.autonoma.erp.modules.aigateway.entity.BOSAiAuditLog;
import com.autonoma.erp.modules.aigateway.repository.BOSAiAuditLogRepository;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BOSAiGateway {

    @Autowired
    private BOSPolicyEngine policyEngine;

    @Autowired
    private BOSAiAuditLogRepository auditLogRepository;

    /**
     * Executes the orchestration pipeline for incoming AI requests:
     * 1. Resolves User Session Context
     * 2. Classifies Intent
     * 3. Evaluates Policies & Scopes
     * 4. Filters Available Tools
     * 5. Records Logs in SYS_AI_AUDIT_LOG
     */
    public GatewayResult processRequest(String prompt) {
        long startTime = System.currentTimeMillis();

        // 1. Context Resolution
        UserContext context = resolveUserContext();

        // 2. Intent Classification
        String intentClass = classifyIntent(prompt);

        // 3. Permission & Scope Evaluation (For resources referenced in prompt)
        List<String> modulesAccessed = new ArrayList<>();
        List<String> allowedTools = new ArrayList<>();
        StringBuilder traceLog = new StringBuilder();

        traceLog.append("Context resolved for user: ").append(context.getUserId()).append("\n");
        traceLog.append("Intent classified: ").append(intentClass).append("\n");

        // Evaluate QMS Checklist Scope
        if (prompt.toUpperCase().contains("CHECKLIST")) {
            modulesAccessed.add("QMS");
            ScopeResponse checklistScope = policyEngine.evaluate(context, "CHECKLIST", "read");
            traceLog.append("Evaluated QMS CHECKLIST policy: ").append(checklistScope.isAllowed() ? "ALLOWED" : "DENIED").append("\n");
            
            if (checklistScope.isAllowed()) {
                allowedTools.add("queryChecklistsTool");
                if (checklistScope.getConstraintFilter() != null) {
                    traceLog.append("Applied QMS Constraint: ").append(checklistScope.getConstraintFilter()).append("\n");
                }
            }
        }

        // Evaluate HRA Payroll Scope
        if (prompt.toUpperCase().contains("PAYROLL") || prompt.toUpperCase().contains("SALARY")) {
            modulesAccessed.add("HRA");
            ScopeResponse payrollScope = policyEngine.evaluate(context, "PAYROLL", "read");
            traceLog.append("Evaluated HRA PAYROLL policy: ").append(payrollScope.isAllowed() ? "ALLOWED" : "DENIED").append("\n");
            
            if (payrollScope.isAllowed()) {
                allowedTools.add("queryPayrollTool");
                if (payrollScope.getConstraintFilter() != null) {
                    traceLog.append("Applied HRA Constraint: ").append(payrollScope.getConstraintFilter()).append("\n");
                }
            }
        }

        // Default Fallback Tools (Always active within company bounds)
        allowedTools.add("searchCompanyHolidaysTool");
        allowedTools.add("viewSelfProfileTool");

        long executionTime = System.currentTimeMillis() - startTime;

        // 4. Audit Logging
        BOSAiAuditLog audit = new BOSAiAuditLog();
        audit.setUserId(context.getUserId() != null ? context.getUserId() : "SYSTEM");
        audit.setPrompt(prompt);
        audit.setIntentClass(intentClass);
        audit.setModulesAccessed(String.join(",", modulesAccessed));
        audit.setApisTriggered(String.join(",", allowedTools));
        audit.setResponseTimeMs((int) executionTime);
        audit.setTraceLog(traceLog.toString());
        audit.setActiveStatus("Y");
        
        audit.setCreatedUser(context.getUserId() != null ? context.getUserId() : "SYSTEM");
        auditLogRepository.save(audit);

        GatewayResult result = new GatewayResult();
        result.setUserId(context.getUserId());
        result.setIntentClass(intentClass);
        result.setAllowedTools(allowedTools);
        result.setConstraintFilter(traceLog.toString());
        result.setResponseTimeMs(executionTime);
        return result;
    }

    private UserContext resolveUserContext() {
        String userId = SecurityUtils.getCurrentUserId();
        String tenantId = SecurityUtils.getCurrentTenantId();
        String role = SecurityUtils.getCurrentUserRole();

        // Resolve context attributes securely from current security session
        UserContext ctx = new UserContext();
        ctx.setUserId(userId);
        ctx.setCompanyId(tenantId);
        ctx.setRole(role);
        ctx.setEmpCode(userId); // Fallback for testing skeleton
        ctx.setEmpId(999L);     // Dummy ID for testing skeleton
        return ctx;
    }

    private String classifyIntent(String prompt) {
        String upper = prompt.toUpperCase();
        if (upper.contains("UPDATE") || upper.contains("CHANGE") || upper.contains("DELETE") || upper.contains("CREATE") || upper.contains("MODIFY")) {
            return "MODIFICATION";
        }
        if (upper.contains("TOTAL") || upper.contains("SUM") || upper.contains("AVERAGE") || upper.contains("COUNT") || upper.contains("SUMMARY")) {
            return "ANALYTICS";
        }
        return "INFORMATION";
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GatewayResult {
        private String userId;
        private String intentClass;
        private List<String> allowedTools;
        private String constraintFilter;
        private long responseTimeMs;

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getIntentClass() { return intentClass; }
        public void setIntentClass(String intentClass) { this.intentClass = intentClass; }
        public List<String> getAllowedTools() { return allowedTools; }
        public void setAllowedTools(List<String> allowedTools) { this.allowedTools = allowedTools; }
        public String getConstraintFilter() { return constraintFilter; }
        public void setConstraintFilter(String constraintFilter) { this.constraintFilter = constraintFilter; }
        public long getResponseTimeMs() { return responseTimeMs; }
        public void setResponseTimeMs(long responseTimeMs) { this.responseTimeMs = responseTimeMs; }
    }
}

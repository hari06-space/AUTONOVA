package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.AiPermissionContext;
import com.autonoma.erp.modules.notebook.dto.IntentResult;
import com.autonoma.erp.modules.notebook.dto.OperationType;
import com.autonoma.erp.modules.notebook.dto.QueryPlan;
import com.autonoma.erp.modules.notebook.dto.QueryPlan.ToolInvocation;
import com.autonoma.erp.modules.notebook.entity.BosAiEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * AI Query Planner — maps IntentResult + AiPermissionContext to a concrete QueryPlan.
 *
 * Gemini never decides what data to fetch. The Planner makes that decision deterministically.
 *
 * Flow: Intent → Permission → Planner → Tool calls → Gemini (language only)
 */
@Service
public class AiQueryPlanner {

    @Autowired
    private EntityResolver entityResolver;

    @Autowired
    private OperationResolver operationResolver;

    @Autowired
    private AiSkillRegistry skillRegistry;

    @Autowired
    private EntityRegistryService entityRegistryService;

    /**
     * Produces a QueryPlan for the given intent and permission context.
     *
     * @param intent      Output of BosIntentEngine.classify()
     * @param permCtx     Output of AiPermissionEngine.evaluate()
     * @param userQuery   The raw user query (for entity hint extraction)
     * @return            QueryPlan with tool calls and security notices
     */
    public QueryPlan plan(IntentResult intent, AiPermissionContext permCtx, String userQuery) {

        // 1. Injection attempt — blocked immediately
        if (intent.isInjectionAttempt()) {
            return QueryPlan.injectionRefusal();
        }

        // 2. Company isolation failure
        if (!permCtx.companyValidated()) {
            return QueryPlan.blocked(
                "Access denied: You cannot query a notebook that belongs to a different company."
            );
        }

        List<ToolInvocation> toolCalls = new ArrayList<>();
        List<String> securityNotices = new ArrayList<>();

        // 3. Add denial notices for all denied modules
        for (String denied : permCtx.deniedModules()) {
            securityNotices.add(buildDenialNotice(denied));
        }

        // 4. Resolve domain entities and operations dynamically for multi-step planning
        List<String> entitiesToQuery = new ArrayList<>();
        String lowerQuery = userQuery.toLowerCase();
        
        // Scan query against synonyms of all registered entities in the DB registry to build multi-step goal plan
        for (BosAiEntity entity : entityRegistryService.getAllEntities()) {
            String synonymsStr = entity.getSynonyms();
            if (synonymsStr != null && !synonymsStr.isBlank()) {
                String[] synonyms = synonymsStr.split("\\|");
                for (String synonym : synonyms) {
                    String synLower = synonym.trim().toLowerCase();
                    if (!synLower.isEmpty() && lowerQuery.contains(synLower)) {
                        String codeUpper = entity.getEntityCode().toUpperCase();
                        if (!entitiesToQuery.contains(codeUpper)) {
                            entitiesToQuery.add(codeUpper);
                        }
                    }
                }
            }
        }

        // Fallback to single primary resolved entity if no keyword match is found
        if (entitiesToQuery.isEmpty()) {
            String primaryEntity = entityResolver.resolveEntity(userQuery, intent);
            if (primaryEntity != null && !"GENERAL".equals(primaryEntity)) {
                entitiesToQuery.add(primaryEntity.toUpperCase());
            }
        }

        OperationType operation = operationResolver.resolveOperation(userQuery);

        for (String entityName : entitiesToQuery) {
            String requiredModule = mapEntityToModule(entityName);
            if (requiredModule != null && !permCtx.canAccessModule(requiredModule)) {
                securityNotices.add(buildDenialNotice(requiredModule));
            } else {
                BosEntitySkill skill = skillRegistry.getSkill(entityName);
                if (skill != null && skill.supports(operation)) {
                    Map<String, Object> params = new HashMap<>();
                    if (permCtx.empId() != null) {
                        params.put("empId", permCtx.empId());
                    }
                    params.put("query", userQuery);
                    params.put("scope", intent.requestedScope().name());

                    toolCalls.add(new ToolInvocation(skill.entity(), params, operation));
                }
            }
        }

        boolean isBlocked = toolCalls.isEmpty() && !securityNotices.isEmpty() && permCtx.deniedModules().containsAll(intent.detectedModules()) && !intent.detectedModules().isEmpty();

        String summary = buildPlanSummary(intent, toolCalls, securityNotices);
        boolean needsDisambiguation = intent.isAmbiguous() && !toolCalls.isEmpty();

        return new QueryPlan(toolCalls, securityNotices, summary, needsDisambiguation, isBlocked);
    }

    private String mapEntityToModule(String entityName) {
        if (entityName == null) return null;
        return entityRegistryService.getEntity(entityName)
            .map(BosAiEntity::getErpModule)
            .orElseGet(() -> switch (entityName.toUpperCase()) {
                case "EMPLOYEE" -> "EMPLOYEE";
                case "CHECKLIST" -> "QMS_CHECKLIST";
                case "CUSTOMER" -> "CUSTOMER";
                case "MACHINE" -> "MACHINE";
                case "SUPPLIER" -> "SUPPLIER";
                case "INVENTORY" -> "INVENTORY";
                case "AUDIT" -> "QMS_AUDIT";
                default -> null;
            });
    }

    private String buildDenialNotice(String module) {
        return switch (module) {
            case "PAYROLL"   -> "You do not have permission to access Payroll / Salary data.";
            case "LEAVE"     -> "You do not have permission to access Leave data.";
            case "ATTENDANCE"-> "You do not have permission to access Attendance data.";
            case "EMPLOYEE"  -> "You do not have permission to access the Employee Master.";
            case "QMS_CHECKLIST" -> "You do not have permission to access QMS Checklists.";
            case "QMS_AUDIT"     -> "You do not have permission to access QMS Audit data.";
            case "MACHINE"   -> "You do not have permission to access Machine data.";
            case "CUSTOMER"  -> "You do not have permission to access Customer data.";
            case "SUPPLIER"  -> "You do not have permission to access Supplier data.";
            case "INVENTORY" -> "You do not have permission to access Inventory data.";
            case "SALES"     -> "You do not have permission to access Sales data.";
            case "SUPPORT"   -> "You do not have permission to access Support Tickets.";
            case "FINANCE"   -> "You do not have permission to access Finance data.";
            default -> "You do not have permission to access " + module + " data.";
        };
    }

    private String buildPlanSummary(IntentResult intent, List<ToolInvocation> calls, List<String> notices) {
        StringBuilder sb = new StringBuilder();
        sb.append("[BOS-AI-PLANNER-TRACE]\n");
        sb.append("1. Goal: Resolve '").append(intent.category()).append("' query (Detected Modules: ").append(intent.detectedModules()).append(")\n");
        
        sb.append("2. Plan: ");
        if (calls.isEmpty()) {
            sb.append("General Response Fallback\n");
        } else {
            sb.append("Sequential execution of ").append(calls.size()).append(" step(s):\n");
            for (int i = 0; i < calls.size(); i++) {
                ToolInvocation call = calls.get(i);
                sb.append("   - Step ").append(i + 1).append(": Retrieve ").append(call.toolName()).append(" details via operation ").append(call.operation()).append("\n");
            }
        }
        
        sb.append("3. Execute: Validate security and execute mapped actions\n");
        sb.append("4. Verify: Check access scopes and strip sensitive fields\n");
        sb.append("5. Summarize: Synthesize grounded response using Gemini");
        
        if (!notices.isEmpty()) {
            sb.append("\nRestricted by ").append(notices.size()).append(" policy notice(s)");
        }
        
        return sb.toString().trim();
    }
}

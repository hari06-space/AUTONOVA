package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.autonoma.erp.modules.notebook.dto.BusinessObject;

/**
 * Domain skill for QMS Checklist entity.
 *
 * Handles: COUNT, LIST, PENDING, COMPLETED, ANALYTICS, SUMMARY, DETAIL
 *
 * Permission model:
 *  - Company-wide: requires canViewCompanyData OR canAccessModule("QMS_CHECKLIST")
 *  - Personal:    uses empId from session context
 *  - Denied:      returns ToolResult.denied() — NEVER returns "0 checklists"
 */
@Component
public class ChecklistSkill implements BosEntitySkill {

    @Autowired
    private LiveErpGroundingService groundingService;

    @Autowired
    private BusinessObjectLoader objectLoader;

    @Override
    public SkillManifest manifest() {
        return new SkillManifest(
            "CHECKLIST",
            "QMS_CHECKLIST",
            List.of("QMS_CHECKLIST_MASTER", "QMS_CHECKLIST_ASSIGNMENT", "QMS_CHECKLIST_CLOSED"),
            List.of(OperationType.COUNT, OperationType.LIST, OperationType.PENDING,
                    OperationType.COMPLETED, OperationType.ANALYTICS,
                    OperationType.SUMMARY, OperationType.DETAIL),
            PermissionScope.SELF,
            List.of(
                "master checklist", "checklist assignment", "qms checklist",
                "checklist", "checklists", "check list"
            ),
            List.of(
                "how many checklists are there",
                "pending checklists",
                "closed checklists",
                "overdue checklists",
                "checklist trend by department",
                "my assigned checklists",
                "checklist count"
            )
        );
    }

    @Override
    public ToolResult execute(ToolRequest request) {
        boolean hasModule = request.permissionContext().canAccessModule("QMS_CHECKLIST");

        // ── Permission gate ────────────────────────────────────────────────────
        if (!hasModule && !request.permissionContext().isPrivileged()) {
            return ToolResult.denied("CHECKLIST", "QMS Checklist Management");
        }

        boolean isCompanyWide = groundingService.isCompanyWide(request.parameters());
        boolean canViewCompany = request.permissionContext().canViewCompanyData()
                                 || request.permissionContext().isPrivileged();

        // ── Route by operation ─────────────────────────────────────────────────
        return switch (request.operation()) {

            case COUNT -> {
                if (isCompanyWide && canViewCompany) {
                    yield ToolResult.of("CHECKLIST", "COUNT",
                        "Company Checklists Count", groundingService.fetchCompanyChecklistsSummary());
                } else {
                    Long empId = resolveEmpId(request);
                    if (empId == null) yield ToolResult.noData("CHECKLIST", "COUNT");
                    yield ToolResult.of("CHECKLIST", "COUNT",
                        "My Assigned Checklists", groundingService.fetchChecklistsContext(empId));
                }
            }

            case PENDING -> {
                if (isCompanyWide && canViewCompany) {
                    yield ToolResult.of("CHECKLIST", "PENDING",
                        "Company Pending Checklists", groundingService.fetchPendingChecklistsSummary());
                } else {
                    Long empId = resolveEmpId(request);
                    if (empId == null) yield ToolResult.noData("CHECKLIST", "PENDING");
                    yield ToolResult.of("CHECKLIST", "PENDING",
                        "My Pending Checklists", groundingService.fetchMyPendingChecklists(empId));
                }
            }

            case COMPLETED -> {
                if (isCompanyWide && canViewCompany) {
                    yield ToolResult.of("CHECKLIST", "COMPLETED",
                        "Company Completed Checklists", groundingService.fetchCompletedChecklistsSummary());
                } else {
                    Long empId = resolveEmpId(request);
                    if (empId == null) yield ToolResult.noData("CHECKLIST", "COMPLETED");
                    yield ToolResult.of("CHECKLIST", "COMPLETED",
                        "My Completed Checklists", groundingService.fetchMyCompletedChecklists(empId));
                }
            }

            case ANALYTICS -> {
                if (!canViewCompany) {
                    yield ToolResult.denied("CHECKLIST", "QMS Checklist Analytics (requires manager access)");
                }
                yield ToolResult.of("CHECKLIST", "ANALYTICS",
                    "Checklist Analytics Report", groundingService.fetchChecklistAnalytics());
            }

            case DETAIL -> {
                String queryStr = request.parameters().getOrDefault("query", "").toString();
                // Extract identifier (e.g. "156")
                String key = extractKey(queryStr);
                if (key.isEmpty()) {
                    yield ToolResult.error("Checklist DETAIL requires a checklist ID or number in the query.");
                }
                Optional<BusinessObject> obj = objectLoader.load("CHECKLIST", key, request.permissionContext(), "POINTS", "ATTACHMENTS", "REVISIONS", "AUDITS");
                if (obj.isEmpty()) {
                    yield ToolResult.noData("CHECKLIST", "DETAIL");
                }
                yield ToolResult.of("CHECKLIST", "DETAIL", "Checklist " + key + " details", obj.get());
            }

            case LIST, SUMMARY -> {
                if (isCompanyWide && canViewCompany) {
                    yield ToolResult.of("CHECKLIST", "LIST",
                        "Company Checklists Summary", groundingService.fetchCompanyChecklistsSummary());
                }
                Long empId = resolveEmpId(request);
                if (empId == null) yield ToolResult.noData("CHECKLIST", "LIST");
                yield ToolResult.of("CHECKLIST", "LIST",
                    "My Checklist Assignments", groundingService.fetchChecklistsContext(empId));
            }

            default -> {
                Long empId = resolveEmpId(request);
                if (empId == null) yield ToolResult.noData("CHECKLIST", request.operation().name());
                yield ToolResult.of("CHECKLIST", request.operation().name(),
                    "Checklist Context", groundingService.fetchChecklistsContext(empId));
            }
        };
    }

    private Long resolveEmpId(ToolRequest request) {
        String query = request.parameters().getOrDefault("query", "").toString();
        Long resolvedId = groundingService.resolveEmpIdFromQuery(query);
        if (resolvedId != null) {
            return resolvedId;
        }
        Object empIdObj = request.parameters().get("empId");
        if (empIdObj == null && request.permissionContext() != null) {
            empIdObj = request.permissionContext().empId();
        }
        if (empIdObj == null) return null;
        try { return Long.valueOf(empIdObj.toString()); } catch (Exception e) { return null; }
    }

    private String extractKey(String query) {
        if (query == null || query.isBlank()) return "";
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\b(\\d+)\\b").matcher(query);
        if (m.find()) return m.group(1);
        
        java.util.Set<String> stopwords = java.util.Set.of(
            "show", "get", "what", "who", "checklist", "employee", "customer",
            "machine", "audit", "detail", "is", "for", "the", "this", "find",
            "search", "list", "view", "report", "info", "information", "status",
            "details", "pending", "completed", "closed", "open", "active", "inactive",
            "yaru", "yar", "iruka", "irukanga", "la", "me", "please", "with", "from",
            "in", "at", "on", "by", "of", "and", "or", "a", "an", "to"
        );
        
        String bestWord = "";
        java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("\\b(CL-[A-Za-z0-9\\-]+|[A-Za-z0-9\\-]+)\\b").matcher(query);
        while (m2.find()) {
            String word = m2.group(1);
            String wLower = word.toLowerCase();
            if (stopwords.contains(wLower)) {
                continue;
            }
            if (word.matches(".*\\d.*") || word.equals(word.toUpperCase())) {
                return word;
            }
            if (word.length() > bestWord.length()) {
                bestWord = word;
            }
        }
        return bestWord;
    }
}

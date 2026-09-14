package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.*;
import java.util.List;

@Component
public class CustomerSkill implements BosEntitySkill {

    @Autowired private DataSource dataSource;
    @Autowired private LiveErpGroundingService groundingService;

    @Override
    public SkillManifest manifest() {
        return new SkillManifest(
            "CUSTOMER",
            "CUSTOMER",
            List.of("SLS_CUSTOMER", "TICKET_TRACEABILITY_CENTER", "SALES_QUOTATION_HEADER"),
            List.of(OperationType.COUNT, OperationType.SEARCH, OperationType.DETAIL,
                    OperationType.SUMMARY, OperationType.LIST, OperationType.PENDING),
            PermissionScope.SELF,
            List.of(
                "support ticket", "customer ticket", "sales quotation",
                "customer enquiry", "sales order",
                "customer", "client", "buyer", "ticket", "support", "quotation", "order", "enquiry"
            ),
            List.of(
                "how many customers", "open support tickets", "pending quotations",
                "find customer ABC", "customer count", "sales this month"
            )
        );
    }

    @Override
    public ToolResult execute(ToolRequest request) {
        String queryStr = request.query().toLowerCase();
        boolean isCompanyWide = groundingService.isCompanyWide(request.parameters());
        boolean canViewCompany = request.permissionContext().canViewCompanyData()
                                 || request.permissionContext().isPrivileged();

        // Support ticket sub-routing
        if (queryStr.contains("ticket") || queryStr.contains("support")) {
            if (!request.permissionContext().canAccessModule("SUPPORT") && !request.permissionContext().isPrivileged()) {
                return ToolResult.denied("CUSTOMER", "Support Tickets");
            }
            if (request.operation() == OperationType.COUNT || isCompanyWide) {
                return ToolResult.of("CUSTOMER", "COUNT", "Support Tickets Summary",
                    groundingService.fetchCompanySupportSummary());
            }
            return runRawQuery("CUSTOMER", "LIST", "Open Support Tickets",
                "SELECT TOP 20 t.ROW_ID, t.TICKET_NO, t.SUBJECT, t.STATUS, t.PRIORITY " +
                "FROM TICKET_TRACEABILITY_CENTER t WITH (NOLOCK) " +
                "WHERE t.STATUS != 'CLOSED' ORDER BY t.CREATED_DATE DESC");
        }

        // Sales / Quotation sub-routing
        if (queryStr.contains("quotation") || queryStr.contains("sales") || queryStr.contains("order")) {
            if (!request.permissionContext().canAccessModule("SALES") && !request.permissionContext().isPrivileged()) {
                return ToolResult.denied("CUSTOMER", "Sales / Quotations");
            }
            if (request.operation() == OperationType.COUNT || isCompanyWide) {
                return ToolResult.of("CUSTOMER", "COUNT", "Sales Summary",
                    groundingService.fetchCompanySalesSummary());
            }
            return runRawQuery("CUSTOMER", "LIST", "Recent Sales Quotations",
                "SELECT TOP 20 q.QUOTATION_NO, q.QUOTATION_DATE, q.QUOTATION_STATUS " +
                "FROM SALES_QUOTATION_HEADER q WITH (NOLOCK) ORDER BY q.QUOTATION_DATE DESC");
        }

        // Customer profile routing
        if (!request.permissionContext().canAccessModule("CUSTOMER") && !request.permissionContext().isPrivileged()) {
            return ToolResult.denied("CUSTOMER", "Customer Master");
        }
        if (request.operation() == OperationType.COUNT || (isCompanyWide && canViewCompany)) {
            return ToolResult.of("CUSTOMER", "COUNT", "Company Customers Summary",
                groundingService.fetchCompanyCustomerSummary());
        }

        if (request.operation() == OperationType.DETAIL) {
            String keyword = extractKey(queryStr);
            if (keyword.isEmpty()) {
                return ToolResult.error("DETAIL operation requires a customer code or name.");
            }
            return runRawQuery("CUSTOMER", "DETAIL", "Customer Details",
                "SELECT c.CODE as CUSTOMER_CODE, c.LEDGER_NAME as CUSTOMER_NAME, c.CITY, " +
                "CASE WHEN c.IS_ACTIVE = 1 THEN 'Active' ELSE 'Inactive' END as ACTIVE_STATUS, c.DOMAIN_NAME " +
                "FROM FA_ACCOUNT_LEDGER c WITH (NOLOCK) " +
                "WHERE c.IS_CUSTOMER = 1 AND (c.CODE = ? OR c.LEDGER_NAME LIKE ?)", keyword, "%" + keyword + "%");
        }

        if (request.operation() == OperationType.SEARCH || !isCompanyWide) {
            String keyword = extractKey(queryStr);
            if (!keyword.isEmpty()) {
                return runRawQuery("CUSTOMER", "SEARCH", "Customer Search Results",
                    "SELECT c.CODE as CUSTOMER_CODE, c.LEDGER_NAME as CUSTOMER_NAME, c.CITY, " +
                    "CASE WHEN c.IS_ACTIVE = 1 THEN 'Active' ELSE 'Inactive' END as ACTIVE_STATUS " +
                    "FROM FA_ACCOUNT_LEDGER c WITH (NOLOCK) " +
                    "WHERE c.IS_CUSTOMER = 1 AND (c.CODE LIKE ? OR c.LEDGER_NAME LIKE ?)", "%" + keyword + "%", "%" + keyword + "%");
            }
        }

        return runRawQuery("CUSTOMER", "LIST", "Active Customers",
            "SELECT TOP 20 c.ID, c.LEDGER_NAME as CUSTOMER_NAME, c.CODE as CUSTOMER_CODE, c.CITY " +
            "FROM FA_ACCOUNT_LEDGER c WITH (NOLOCK) WHERE c.IS_CUSTOMER = 1 AND (c.IS_ACTIVE = 1 OR c.IS_ACTIVE IS NULL)");
    }

    private ToolResult runRawQuery(String entity, String operation, String label, String sql, Object... params) {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            if (params != null) {
                for (int i = 0; i < params.length; i++) {
                    ps.setObject(i + 1, params[i]);
                }
            }
            
            try (ResultSet rs = ps.executeQuery()) {
                StringBuilder sb = new StringBuilder();
                ResultSetMetaData meta = rs.getMetaData();
                int cols = meta.getColumnCount();
                int count = 0;
                while (rs.next()) {
                    sb.append("[").append(++count).append("] ");
                    for (int i = 1; i <= cols; i++) {
                        sb.append(meta.getColumnLabel(i)).append(": ").append(rs.getString(i)).append(" | ");
                    }
                    sb.append("\n");
                }
                if (count == 0) return ToolResult.noData(entity, operation);
                return ToolResult.of(entity, operation, label, sb.toString());
            }
        } catch (Exception e) {
            System.err.println("[BOS-AI][CustomerSkill] Error: " + e.getMessage());
            return ToolResult.error("Customer data temporarily unavailable.");
        }
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
        java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("\\b([A-Za-z0-9\\-]+)\\b").matcher(query);
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

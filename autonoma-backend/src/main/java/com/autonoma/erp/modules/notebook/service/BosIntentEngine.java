package com.autonoma.erp.modules.notebook.service;

import com.autonoma.erp.modules.notebook.dto.IntentResult;
import com.autonoma.erp.modules.notebook.dto.IntentResult.IntentCategory;
import com.autonoma.erp.modules.notebook.dto.IntentResult.DataScope;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * BOS Intent Engine — Deterministic, local, zero-latency intent classification.
 *
 * Security contract:
 *   - NO Gemini call is made here. Security decisions are NEVER delegated to an LLM.
 *   - All classification uses keyword sets, synonym maps, and module metadata.
 *   - Supports English, Tamil transliterations, Hindi abbreviations, and mixed-language queries.
 *   - Runs in < 1ms.
 *
 * Architecture: Intent Engine → Permission Engine → Query Planner → Tool Registry → Gemini (language only)
 */
@Service
public class BosIntentEngine {

    // ─── Prompt Injection Patterns ────────────────────────────────────────────
    // These cause immediate INJECTION_ATTEMPT classification.
    // The user query never reaches Gemini in this case.

    private static final List<String> INJECTION_PATTERNS = List.of(
        "ignore previous", "ignore all", "ignore instructions", "ignore your",
        "forget everything", "forget above", "forget your",
        "override", "jailbreak", "disregard",
        "developer mode", "dev mode", "god mode",
        "system prompt", "reveal prompt", "print context", "show context",
        "you are now", "pretend you are", "act as", "roleplay as",
        "from now on you", "from now on, you",
        "translate this then", "translate and execute",
        "you have permission", "you have admin", "you have full access",
        "bypass security", "bypass permission",
        "as an ai without", "as an ai with no restrictions",
        "do anything now", "dan prompt", "[dan]",
        "sudo", "root access", "admin access",
        "\\n\\nsystem:", "\\nsystem:", "\nsystem:",
        "<!-- system", "<system>", "[system]",
        "i give you permission", "i grant you"
    );

    // ─── Module Keyword Maps ──────────────────────────────────────────────────
    // Each entry: module key → keyword list (English + Tamil transliterations + abbreviations)

    private static final Map<String, List<String>> MODULE_KEYWORDS = new LinkedHashMap<>();

    static {
        // PAYROLL — most sensitive, checked first
        MODULE_KEYWORDS.put("PAYROLL", List.of(
            "salary", "payroll", "pay slip", "payslip", "ctc", "gross pay", "net pay",
            "compensation", "remuneration", "increment", "hike", "bonus", "incentive",
            "deduction", "pf", "provident fund", "esi", "tax deduction", "tds",
            "loan", "loan deduction", "advance", "penalty",
            // Tamil
            "சம்பளம்", "ஊதியம்", "ஊதியத்", "சலவை", "வருமானம்",
            // Tanglish
            "sambalam", "oothiyam", "varumanam",
            // Abbreviations
            "sal", "slary"
        ));

        // LEAVE — personal, cross-user check required
        MODULE_KEYWORDS.put("LEAVE", List.of(
            "leave", "leave balance", "leave request", "leave application",
            "casual leave", "cl", "earned leave", "el", "sick leave", "sl",
            "annual leave", "al", "privilege leave", "pl",
            "lta", "leave travel", "maternity", "paternity",
            "holiday", "holiday request", "holiday approval", "off day",
            "leave encashment", "encashment",
            // Tamil
            "விடுமுறை", "லீவ்", "விடுப்பு",
            // Tanglish
            "vidumurai", "vidupu",
            // Abbreviations
            "lv"
        ));

        // ATTENDANCE — personal, cross-user check required
        MODULE_KEYWORDS.put("ATTENDANCE", List.of(
            "attendance", "present", "absent", "late", "early out",
            "check in", "check out", "biometric", "punch in", "punch out",
            "on duty", "od", "permission", "short leave", "half day",
            "shift", "shift timing", "working hours", "overtime",
            "daily attendance", "monthly attendance",
            // Tamil
            "ஆஜர்", "வருகை", "வருகைப்பதிவு",
            // Tanglish
            "varugai", "varugaipadhivu", "aajar",
            // Abbreviations
            "att", "od entry"
        ));

        // EMPLOYEE — department listing, employee directory
        MODULE_KEYWORDS.put("EMPLOYEE", List.of(
            "employee", "staff", "worker", "who is in", "who are in", "who works",
            "department", "dept", "designation", "team member", "colleague",
            "member", "head", "manager", "hod", "hr", "hra", "qms",
            "employee list", "employee directory", "headcount",
            "joining date", "date of joining", "doj",
            "employee code", "emp code", "emp id",
            // Department names
            "admin", "production", "quality", "purchase", "accounts",
            "product development", "maintenance", "assembly", "stores",
            "operations", "logistics", "top management", "planning",
            "management representative", "business development",
            "sales & marketing", "design & development", "strategic procurement",
            // Tamil
            "ஊழியர்", "பணியாளர்", "வேலையாள்", "நபர்கள்", "யாரு", "யார்",
            // Tanglish
            "oozhiyar", "oozhiyargal", "paniyaalar", "paniyaalargal", "velaiyal", "yaru", "yar", "iruka", "irukanga",
            // Abbreviations
            "emp"
        ));

        // QMS_CHECKLIST
        MODULE_KEYWORDS.put("QMS_CHECKLIST", List.of(
            "checklist", "check list", "renewal", "checklist verify",
            "pending checklist", "my checklist", "checklist status",
            "assigned checklist", "checklist report",
            // Tamil
            "சரிபார்ப்புப் பட்டியல்", "சரிபார்ப்பு", "பட்டியல்",
            // Tanglish
            "sariparpu", "saripaarppu", "pattiyal", "sariparpu pattiyal",
            // Abbreviations
            "cl", "qms checklist"
        ));

        // QMS_AUDIT
        MODULE_KEYWORDS.put("QMS_AUDIT", List.of(
            "audit", "ncr", "ofi", "non-conformance", "non conformance",
            "audit schedule", "audit observation", "audit report",
            "close ncr", "audit finding", "corrective action", "capa",
            "internal audit", "external audit"
        ));

        // QMS_MEETING
        MODULE_KEYWORDS.put("QMS_MEETING", List.of(
            "meeting", "mom", "minutes of meeting", "meeting schedule",
            "meeting attendance", "close mom", "mom report",
            "action item", "action point", "discussion point"
        ));

        // MACHINE
        MODULE_KEYWORDS.put("MACHINE", List.of(
            "machine", "equipment", "qmt", "machine status", "machine maintenance",
            "next maintenance", "last maintenance", "machine category",
            "eb meter", "power consumption", "machine code",
            // Tamil
            "இயந்திரம்", "இயந்திரங்கள்",
            // Tanglish
            "iyandhiram", "iyandhirangal"
        ));

        // CUSTOMER
        MODULE_KEYWORDS.put("CUSTOMER", List.of(
            "customer", "client", "buyer", "crm",
            "customer master", "contact person", "customer code",
            "open tickets", "customer ticket", "customer satisfaction",
            // Tamil
            "வாடிக்கையாளர்", "வாடிக்கையாளர்கள்",
            // Tanglish
            "vaadikkaiyalar", "vaadikkaiyalargal"
        ));

        // SUPPLIER
        MODULE_KEYWORDS.put("SUPPLIER", List.of(
            "supplier", "vendor", "subcontractor", "sub-contractor",
            "supplier master", "purchase", "procurement",
            // Tamil
            "வழங்குநர்", "விற்பனையாளர்",
            // Tanglish
            "valangunar"
        ));

        // INVENTORY
        MODULE_KEYWORDS.put("INVENTORY", List.of(
            "inventory", "stock", "current stock", "item", "product",
            "stock report", "rejection stock", "stock ledger", "stock movement",
            "bom", "material", "item group", "item type",
            // Tamil
            "சரக்கு", "இருப்பு", "பொருட்கள்",
            // Tanglish
            "sarakku", "iruppu"
        ));

        // SALES
        MODULE_KEYWORDS.put("SALES", List.of(
            "sales", "enquiry", "quotation", "price master", "order",
            "sales order", "so", "delivery", "invoice",
            "ocr", "sales report"
        ));

        // SUPPORT
        MODULE_KEYWORDS.put("SUPPORT", List.of(
            "ticket", "support ticket", "support", "raised for",
            "traceability", "ttc", "issue", "complaint", "resolution"
        ));

        // SATISFACTION
        MODULE_KEYWORDS.put("SATISFACTION", List.of(
            "satisfaction", "feedback", "survey", "satisfaction score",
            "employee satisfaction", "customer satisfaction",
            "vendor satisfaction", "internal satisfaction"
        ));

        // MAINTENANCE
        MODULE_KEYWORDS.put("MAINTENANCE", List.of(
            "maintenance", "eb slab", "eb meter", "power", "energy",
            "maintenance schedule", "maintenance log"
        ));
    }

    // ─── Scope Keywords ───────────────────────────────────────────────────────

    private static final List<String> SELF_KEYWORDS = List.of(
        "my ", "mine", "i have", "show me", "my leave", "my salary",
        "my attendance", "my checklist", "my balance", "am i", "do i"
    );

    private static final List<String> CROSS_USER_KEYWORDS = List.of(
        "'s leave", "'s salary", "'s attendance", "'s balance",
        "leave of ", "salary of ", "attendance of ", "balance of ",
        "show john", "show ram", "employee id", "emp id"
    );

    private static final List<String> TEAM_KEYWORDS = List.of(
        "my team", "team member", "team attendance", "team leave",
        "my department", "direct report"
    );

    private static final List<String> COMPANY_KEYWORDS = List.of(
        "all employee", "all staff", "company wide", "entire company",
        "organization", "headcount", "all departments", "all checklist",
        "all users", "all user", "for all", "left employee", "resigned",
        "inactive employee", "ex-employee", "former employee"
    );

    // ─── Classification Logic ─────────────────────────────────────────────────

    /**
     * Classifies the user's intent deterministically. < 1ms.
     */
    public IntentResult classify(String userQuery) {
        if (userQuery == null || userQuery.isBlank()) return IntentResult.general();

        String lower = userQuery.toLowerCase().trim();

        // 1. Check for prompt injection first — fast exit
        if (isInjectionAttempt(lower)) {
            return IntentResult.injectionAttempt();
        }

        // 2. Detect all matching modules
        Set<String> detectedModules = detectModules(lower);

        // 3. Determine primary category
        IntentCategory category = determinePrimaryCategory(detectedModules, lower);

        // 4. Resolve data scope
        boolean isPersonalDataRequest = isSelfRequest(lower);
        boolean isCrossUserRequest = isCrossUserRequest(lower);
        DataScope scope = resolveScope(lower, isPersonalDataRequest);

        // 5. Extract entity hints
        String entityType = resolveEntityType(category);
        String entityHint = extractEntityHint(lower);

        // 6. Check for ambiguity (multiple departments or entities mentioned)
        boolean isAmbiguous = detectedModules.size() > 2 && category == IntentCategory.CROSS_MODULE_QUERY;

        return new IntentResult(
            category,
            detectedModules,
            isPersonalDataRequest,
            isCrossUserRequest,
            entityType,
            entityHint,
            scope,
            isAmbiguous,
            false
        );
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private boolean isInjectionAttempt(String lower) {
        for (String pattern : INJECTION_PATTERNS) {
            if (lower.contains(pattern)) return true;
        }
        return false;
    }

    private Set<String> detectModules(String lower) {
        Set<String> modules = new LinkedHashSet<>();
        for (Map.Entry<String, List<String>> entry : MODULE_KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                String kwLower = keyword.toLowerCase();
                boolean matched = false;
                if (kwLower.length() <= 3) {
                    // Match short abbreviations with word boundaries only (e.g. al, cl, sl, hr, od)
                    String regex = "\\b" + java.util.regex.Pattern.quote(kwLower) + "\\b";
                    matched = java.util.regex.Pattern.compile(regex).matcher(lower).find();
                } else {
                    matched = lower.contains(kwLower);
                }
                if (matched) {
                    modules.add(entry.getKey());
                    break;
                }
            }
        }
        return modules;
    }

    private IntentCategory determinePrimaryCategory(Set<String> modules, String lower) {
        if (modules.isEmpty()) return IntentCategory.GENERAL_QUERY;
        if (modules.size() > 2) return IntentCategory.CROSS_MODULE_QUERY;

        // Priority order: sensitive modules first
        if (modules.contains("PAYROLL"))        return IntentCategory.PAYROLL_QUERY;
        if (modules.contains("ATTENDANCE"))     return IntentCategory.ATTENDANCE_QUERY;
        if (modules.contains("LEAVE"))          return IntentCategory.LEAVE_QUERY;
        if (modules.contains("EMPLOYEE"))       return IntentCategory.EMPLOYEE_QUERY;
        if (modules.contains("QMS_CHECKLIST"))  return IntentCategory.QMS_CHECKLIST_QUERY;
        if (modules.contains("QMS_AUDIT"))      return IntentCategory.QMS_AUDIT_QUERY;
        if (modules.contains("QMS_MEETING"))    return IntentCategory.QMS_MEETING_QUERY;
        if (modules.contains("MACHINE"))        return IntentCategory.MACHINE_QUERY;
        if (modules.contains("CUSTOMER"))       return IntentCategory.CUSTOMER_QUERY;
        if (modules.contains("SUPPLIER"))       return IntentCategory.SUPPLIER_QUERY;
        if (modules.contains("INVENTORY"))      return IntentCategory.INVENTORY_QUERY;
        if (modules.contains("SALES"))          return IntentCategory.SALES_QUERY;
        if (modules.contains("SUPPORT"))        return IntentCategory.SUPPORT_QUERY;
        if (modules.contains("SATISFACTION"))   return IntentCategory.SATISFACTION_QUERY;
        if (modules.contains("MAINTENANCE"))    return IntentCategory.MAINTENANCE_QUERY;
        return IntentCategory.GENERAL_QUERY;
    }

    private boolean isSelfRequest(String lower) {
        for (String kw : SELF_KEYWORDS) {
            if (lower.contains(kw)) return true;
        }
        return false;
    }

    private boolean isCrossUserRequest(String lower) {
        for (String kw : CROSS_USER_KEYWORDS) {
            if (lower.contains(kw)) return true;
        }
        return false;
    }

    private DataScope resolveScope(String lower, boolean isSelf) {
        for (String kw : COMPANY_KEYWORDS) {
            if (lower.contains(kw)) return DataScope.COMPANY;
        }
        for (String kw : TEAM_KEYWORDS) {
            if (lower.contains(kw)) return DataScope.TEAM;
        }
        if (lower.contains("department") || lower.contains("dept") || lower.contains("division")) {
            return DataScope.DEPARTMENT;
        }
        if (isSelf) return DataScope.SELF;
        return DataScope.SELF; // conservative default
    }

    private String resolveEntityType(IntentCategory category) {
        return switch (category) {
            case EMPLOYEE_QUERY, LEAVE_QUERY, ATTENDANCE_QUERY, PAYROLL_QUERY -> "EMPLOYEE";
            case QMS_CHECKLIST_QUERY, QMS_AUDIT_QUERY, QMS_MEETING_QUERY -> "QMS";
            case MACHINE_QUERY -> "MACHINE";
            case CUSTOMER_QUERY -> "CUSTOMER";
            case SUPPLIER_QUERY -> "SUPPLIER";
            case INVENTORY_QUERY -> "PRODUCT";
            case SALES_QUERY -> "SALES";
            case SUPPORT_QUERY -> "TICKET";
            default -> null;
        };
    }

    private String extractEntityHint(String lower) {
        // Look for quoted names or department patterns
        // Simple heuristic: extract words that follow "in", "for", "of", "about"
        String[] prepositions = {"who is in ", "who are in ", "in the ", "for the ", "about ", "of "};
        for (String prep : prepositions) {
            int idx = lower.indexOf(prep);
            if (idx >= 0) {
                String after = lower.substring(idx + prep.length()).trim();
                // Take first word or phrase up to punctuation/end
                String hint = after.split("[?.,;\\n]")[0].trim();
                if (hint.length() > 1 && hint.length() < 50) return hint;
            }
        }
        return null;
    }
}

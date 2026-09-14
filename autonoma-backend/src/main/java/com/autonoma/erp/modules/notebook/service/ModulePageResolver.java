package com.autonoma.erp.modules.notebook.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Dynamically loads the AI Module → BOS_PAGES page code mapping from the database.
 * NO page codes are hardcoded anywhere. If Payroll moves to a new page code tomorrow,
 * nothing changes in the AI layer — it adapts automatically on the next cache refresh.
 *
 * Cache is refreshed every 10 minutes.
 */
@Service
public class ModulePageResolver {

    @Autowired
    private DataSource dataSource;

    // AI Module key → Set of BOS_PAGES page codes
    private final Map<String, Set<String>> moduleToPageCodes = new ConcurrentHashMap<>();
    private volatile long lastRefreshMs = 0;
    private static final long REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

    /**
     * Hardcoded module → sub-module name fragments for initial bootstrap.
     * After first DB load these are replaced with live data.
     * The map uses BOS_SUB_MODULES.SUB_MOD_NAME LIKE patterns.
     */
    private static final Map<String, List<String>> MODULE_SUB_MODULE_HINTS = Map.ofEntries(
        Map.entry("EMPLOYEE",       List.of("Employee")),
        Map.entry("ATTENDANCE",     List.of("Attendance")),
        Map.entry("LEAVE",          List.of("Attendance", "Holiday")),
        Map.entry("PAYROLL",        List.of("Payroll")),
        Map.entry("ATS",            List.of("ATS")),
        Map.entry("QMS_CHECKLIST",  List.of("Checklist")),
        Map.entry("QMS_AUDIT",      List.of("Audit")),
        Map.entry("QMS_MEETING",    List.of("Meeting")),
        Map.entry("MACHINE",        List.of("QMT")),
        Map.entry("CUSTOMER",       List.of("CRM")),
        Map.entry("SUPPLIER",       List.of("Supplier")),
        Map.entry("INVENTORY",      List.of("Product")),
        Map.entry("SALES",          List.of("OCR", "Sales")),
        Map.entry("SUPPORT",        List.of("Support")),
        Map.entry("MAINTENANCE",    List.of("Maintenance")),
        Map.entry("SATISFACTION",   List.of("Satisfaction")),
        Map.entry("FINANCE",        List.of("Finance", "Account"))
    );

    /**
     * Returns the set of BOS page codes for the given AI module key.
     * Refreshes from DB if cache is stale.
     */
    public Set<String> getPageCodesForModule(String moduleKey) {
        refreshIfStale();
        return moduleToPageCodes.getOrDefault(moduleKey.toUpperCase(), Set.of());
    }

    /**
     * Returns the AI module key that owns a given page code, or null if not found.
     */
    public String getModuleForPageCode(String pageCode) {
        refreshIfStale();
        for (Map.Entry<String, Set<String>> entry : moduleToPageCodes.entrySet()) {
            if (entry.getValue().contains(pageCode)) return entry.getKey();
        }
        return null;
    }

    public Map<String, Set<String>> getAllMappings() {
        refreshIfStale();
        return Collections.unmodifiableMap(moduleToPageCodes);
    }

    // ─── Cache Refresh ────────────────────────────────────────────────────────

    private void refreshIfStale() {
        long now = System.currentTimeMillis();
        if (now - lastRefreshMs < REFRESH_INTERVAL_MS && !moduleToPageCodes.isEmpty()) return;
        try {
            loadFromDatabase();
            lastRefreshMs = now;
        } catch (Exception e) {
            // If DB fails, keep using whatever is already in the map
            System.err.println("[ModulePageResolver] Failed to refresh from DB: " + e.getMessage());
            if (moduleToPageCodes.isEmpty()) {
                loadFallbackDefaults();
            }
        }
    }

    private void loadFromDatabase() throws Exception {
        String sql = """
            SELECT p.PAGE_CODE, s.SUB_MOD_NAME
            FROM BOS_PAGES p WITH (NOLOCK)
            LEFT JOIN BOS_SUB_MODULES s WITH (NOLOCK) ON p.SUB_MOD_ID = s.SUB_MOD_ID
            WHERE p.ENABLED = 1
            """;

        Map<String, Set<String>> freshMap = new ConcurrentHashMap<>();

        // Pre-populate all module keys with empty sets
        for (String key : MODULE_SUB_MODULE_HINTS.keySet()) {
            freshMap.put(key, new HashSet<>());
        }

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                String pageCode = rs.getString("PAGE_CODE");
                String subModName = rs.getString("SUB_MOD_NAME");
                if (pageCode == null) continue;
                String subModLower = subModName != null ? subModName.toLowerCase() : "";

                for (Map.Entry<String, List<String>> entry : MODULE_SUB_MODULE_HINTS.entrySet()) {
                    for (String hint : entry.getValue()) {
                        if (subModLower.contains(hint.toLowerCase())) {
                            freshMap.computeIfAbsent(entry.getKey(), k -> new HashSet<>()).add(pageCode);
                        }
                    }
                }
            }
        }

        moduleToPageCodes.clear();
        moduleToPageCodes.putAll(freshMap);
    }

    /**
     * Static fallback used only when DB is unreachable at startup.
     * Based on live BOS_PAGES data captured on 2026-07-03.
     */
    private void loadFallbackDefaults() {
        moduleToPageCodes.put("EMPLOYEE",      new HashSet<>(Set.of("M2210","M2230","M2240","HA1285","HA1280")));
        moduleToPageCodes.put("ATTENDANCE",    new HashSet<>(Set.of("HA1340","HA1345","M2390","HA1330","HA1310")));
        moduleToPageCodes.put("LEAVE",         new HashSet<>(Set.of("HA1210","HA1220","HA1230","M2350","M2390")));
        moduleToPageCodes.put("PAYROLL",       new HashSet<>(Set.of("QM1430","HA1294","HA1295","QM1440","QM1420","HA1290")));
        moduleToPageCodes.put("ATS",           new HashSet<>(Set.of("HA1110","HA1120","HA1130")));
        moduleToPageCodes.put("QMS_CHECKLIST", new HashSet<>(Set.of("QM1110","QM1120","QM1130","QM1140","M1210")));
        moduleToPageCodes.put("QMS_AUDIT",     new HashSet<>(Set.of("QM1210","QM1220","QM1230","QM1240","QM1250","QM1260")));
        moduleToPageCodes.put("QMS_MEETING",   new HashSet<>(Set.of("QM1310","QM1320","QM1330","QM1340","QM1350")));
        moduleToPageCodes.put("MACHINE",       new HashSet<>(Set.of("M3510","M3520")));
        moduleToPageCodes.put("CUSTOMER",      new HashSet<>(Set.of("M5130","M5140","SM1110","SM1120")));
        moduleToPageCodes.put("SUPPLIER",      new HashSet<>(Set.of("M4110")));
        moduleToPageCodes.put("INVENTORY",     new HashSet<>(Set.of("M3115","INV1001","INV1002","INV1003","INV1004")));
        moduleToPageCodes.put("SALES",         new HashSet<>(Set.of("SM1110","SM1120","SM1130","SM1140")));
        moduleToPageCodes.put("SUPPORT",       new HashSet<>(Set.of("S1110","S1120")));
        moduleToPageCodes.put("MAINTENANCE",   new HashSet<>(Set.of("M1410","M1420","M1430")));
        moduleToPageCodes.put("SATISFACTION",  new HashSet<>(Set.of("HA1350","HA1365","HA1375","HA1385")));
        moduleToPageCodes.put("FINANCE",       new HashSet<>());
    }
}

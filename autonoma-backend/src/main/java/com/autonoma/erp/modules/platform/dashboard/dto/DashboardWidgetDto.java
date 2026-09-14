package com.autonoma.erp.modules.platform.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * BOS Generic Dashboard Widget Response DTO.
 *
 * Common response structure for ALL dashboard modules.
 * Mirrors the legacy SQL UNION ALL output:
 *   REPORT_TYPE, REPORT_SUB_TYPE, Label1/Value, Label2/Value, Label3/Value, Label4/Value
 *
 * Example:
 * {
 *   "reportType": "MEETING",
 *   "reportSubType": "ATTENDANCE",
 *   "displayName": "Meeting Attendance",
 *   "iconName": "IconCalendarEvent",
 *   "metrics": [
 *     { "label": "Today's", "value": 3, "status": "info" },
 *     { "label": "Absent",  "value": 1, "status": "danger" },
 *     { "label": "Pending", "value": 2, "status": "warning" }
 *   ]
 * }
 */
@Data
public class DashboardWidgetDto {

    public DashboardWidgetDto() {}

    /** Module category (e.g. "MEETING", "AUDIT", "ATS", "CHECK LIST") */
    private String reportType;

    /** Widget sub-category (e.g. "ATTENDANCE", "CLOSE NCR", "INTERVIEW PROCESS") */
    private String reportSubType;

    /** Human-readable display name shown on widget header */
    private String displayName;

    /** Tabler icon name for the widget header */
    private String iconName;

    /** Module-level navigate URL for the "View All" button */
    private String navigateUrl;

    /** Whether this user has permission to see this widget's data */
    private boolean permitted = true;

    /** Ordered list of metric rows (max 4 per the legacy SQL structure) */
    private List<DashboardMetricDto> metrics = new ArrayList<>();

    /**
     * Convenience constructor matching legacy SQL output format.
     */
    public DashboardWidgetDto(String reportType, String reportSubType, String displayName,
                              String iconName, String navigateUrl, List<DashboardMetricDto> metrics) {
        this.reportType = reportType;
        this.reportSubType = reportSubType;
        this.displayName = displayName;
        this.iconName = iconName;
        this.navigateUrl = navigateUrl;
        this.metrics = metrics != null ? metrics : new ArrayList<>();
        this.permitted = true;
    }

    /** Factory: create an unpermitted (hidden) widget placeholder */
    public static DashboardWidgetDto unpermitted(String reportType, String reportSubType, String displayName) {
        DashboardWidgetDto w = new DashboardWidgetDto();
        w.setReportType(reportType);
        w.setReportSubType(reportSubType);
        w.setDisplayName(displayName);
        w.setPermitted(false);
        return w;
    }

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }
    public String getReportSubType() { return reportSubType; }
    public void setReportSubType(String reportSubType) { this.reportSubType = reportSubType; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getIconName() { return iconName; }
    public void setIconName(String iconName) { this.iconName = iconName; }
    public String getNavigateUrl() { return navigateUrl; }
    public void setNavigateUrl(String navigateUrl) { this.navigateUrl = navigateUrl; }
    public boolean isPermitted() { return permitted; }
    public void setPermitted(boolean permitted) { this.permitted = permitted; }
    public List<DashboardMetricDto> getMetrics() { return metrics; }
    public void setMetrics(List<DashboardMetricDto> metrics) { this.metrics = metrics; }
}

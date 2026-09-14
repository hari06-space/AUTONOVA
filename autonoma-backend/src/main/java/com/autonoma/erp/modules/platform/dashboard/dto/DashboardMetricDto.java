package com.autonoma.erp.modules.platform.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a single metric entry in a dashboard widget.
 * Example: { label: "Pending", value: 5, status: "warning" }
 */
@Data
public class DashboardMetricDto {

    /** Human-readable label for this metric (e.g. "Overdue", "Today's", "Pending") */
    private String label;

    /** Numeric count value */
    private long value;

    /**
     * Semantic status indicator for color coding.
     * Values: "info" | "warning" | "danger" | "success" | "default"
     */
    private String status;

    /** Optional: navigate URL for drill-down when user clicks this metric */
    private String navigateUrl;

    public DashboardMetricDto() {}

    public DashboardMetricDto(String label, long value, String status) {
        this.label = label;
        this.value = value;
        this.status = status;
    }

    public DashboardMetricDto(String label, long value, String status, String navigateUrl) {
        this.label = label;
        this.value = value;
        this.status = status;
        this.navigateUrl = navigateUrl;
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public long getValue() { return value; }
    public void setValue(long value) { this.value = value; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNavigateUrl() { return navigateUrl; }
    public void setNavigateUrl(String navigateUrl) { this.navigateUrl = navigateUrl; }
}

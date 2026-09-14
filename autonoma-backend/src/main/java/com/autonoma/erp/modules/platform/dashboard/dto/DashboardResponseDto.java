package com.autonoma.erp.modules.platform.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Top-level response envelope for the BOS Operational Monitoring Dashboard API.
 * Contains all permitted widgets for the current logged-in user.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponseDto {

    /** All widgets (both permitted and hidden-placeholder) */
    private List<DashboardWidgetDto> widgets = new ArrayList<>();

    /** ISO timestamp when this response was generated */
    private String generatedAt;

    /** Filter params echoed back */
    private String fromDate;
    private String toDate;

    public List<DashboardWidgetDto> getWidgets() { return widgets; }
    public void setWidgets(List<DashboardWidgetDto> widgets) { this.widgets = widgets; }
    public String getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }
    public String getFromDate() { return fromDate; }
    public void setFromDate(String fromDate) { this.fromDate = fromDate; }
    public String getToDate() { return toDate; }
    public void setToDate(String toDate) { this.toDate = toDate; }
}

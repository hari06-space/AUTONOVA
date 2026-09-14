package com.autonoma.erp.modules.sm.sales.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadSummaryDTO {
    private int totalRows;
    private int successCount;
    private int failedCount;
    private List<String> errors;
    private String errorReportId; // Used to download the error log file if any

    private List<SalesPriceMasterDetailDTO> rows;

    public int getTotalRows() { return totalRows; }
    public void setTotalRows(int totalRows) { this.totalRows = totalRows; }
    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }
    public int getFailedCount() { return failedCount; }
    public void setFailedCount(int failedCount) { this.failedCount = failedCount; }
    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
    public String getErrorReportId() { return errorReportId; }
    public void setErrorReportId(String errorReportId) { this.errorReportId = errorReportId; }
    public List<SalesPriceMasterDetailDTO> getRows() { return rows; }
    public void setRows(List<SalesPriceMasterDetailDTO> rows) { this.rows = rows; }
}

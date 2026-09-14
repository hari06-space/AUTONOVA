package com.autonoma.erp.modules.platform.dbquery.dto;

import java.util.List;
import java.util.Map;

public class DbQueryResponse {
    private boolean success;
    private String message;
    private List<Map<String, Object>> data;
    private int rowsAffected;
    private List<String> columns;
    private List<DbQueryResultDto> queryResults;

    public DbQueryResponse() {}

    public DbQueryResponse(boolean success, String message, List<Map<String, Object>> data, int rowsAffected, List<String> columns) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.rowsAffected = rowsAffected;
        this.columns = columns;
    }

    public DbQueryResponse(boolean success, String message, List<Map<String, Object>> data, int rowsAffected, List<String> columns, List<DbQueryResultDto> queryResults) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.rowsAffected = rowsAffected;
        this.columns = columns;
        this.queryResults = queryResults;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<Map<String, Object>> getData() { return data; }
    public void setData(List<Map<String, Object>> data) { this.data = data; }

    public int getRowsAffected() { return rowsAffected; }
    public void setRowsAffected(int rowsAffected) { this.rowsAffected = rowsAffected; }

    public List<String> getColumns() { return columns; }
    public void setColumns(List<String> columns) { this.columns = columns; }

    public List<DbQueryResultDto> getQueryResults() { return queryResults; }
    public void setQueryResults(List<DbQueryResultDto> queryResults) { this.queryResults = queryResults; }
}

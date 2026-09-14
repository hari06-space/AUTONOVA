package com.autonoma.erp.modules.platform.dbquery.dto;

import java.util.List;
import java.util.Map;

public class DbQueryResultDto {
    private boolean isSelect;
    private List<Map<String, Object>> data;
    private List<String> columns;
    private int rowsAffected;

    public DbQueryResultDto() {}

    public DbQueryResultDto(boolean isSelect, List<Map<String, Object>> data, List<String> columns, int rowsAffected) {
        this.isSelect = isSelect;
        this.data = data;
        this.columns = columns;
        this.rowsAffected = rowsAffected;
    }

    public boolean isSelect() { return isSelect; }
    public void setSelect(boolean isSelect) { this.isSelect = isSelect; }

    public List<Map<String, Object>> getData() { return data; }
    public void setData(List<Map<String, Object>> data) { this.data = data; }

    public List<String> getColumns() { return columns; }
    public void setColumns(List<String> columns) { this.columns = columns; }

    public int getRowsAffected() { return rowsAffected; }
    public void setRowsAffected(int rowsAffected) { this.rowsAffected = rowsAffected; }
}

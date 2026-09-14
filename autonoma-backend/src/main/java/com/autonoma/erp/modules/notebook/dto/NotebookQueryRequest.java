package com.autonoma.erp.modules.notebook.dto;

import lombok.Data;

@Data
public class NotebookQueryRequest {
    private Long notebookId;
    private String query;

    public Long getNotebookId() { return notebookId; }
    public void setNotebookId(Long notebookId) { this.notebookId = notebookId; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
}

package com.autonoma.erp.modules.notebook.dto;

import lombok.Data;
import java.util.Date;

@Data
public class NotebookChatDTO {
    private Long id;
    private Long notebookId;
    private String sender;
    private String text;
    private String citationsJson;
    private Date createdDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getNotebookId() { return notebookId; }
    public void setNotebookId(Long notebookId) { this.notebookId = notebookId; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getCitationsJson() { return citationsJson; }
    public void setCitationsJson(String citationsJson) { this.citationsJson = citationsJson; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
}

package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "SYS_NOTEBOOK_CHAT")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotebookChat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NOTEBOOK_ID", nullable = false)
    private Long notebookId;

    @Column(name = "SENDER", nullable = false, length = 20)
    private String sender;

    @Column(name = "MESSAGE_TEXT", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String messageText;

    @Column(name = "CITATIONS_JSON", columnDefinition = "NVARCHAR(MAX)")
    private String citationsJson;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "ACTIVE_STATUS", nullable = false, length = 1)
    private String activeStatus = "Y";

    @PrePersist
    protected void onCreate() {
        this.createdDate = new Date();
        if (this.activeStatus == null) this.activeStatus = "Y";
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            try {
                this.createdBy = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
                this.createdBy = "Admin";
            }
        }
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = "Admin";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getNotebookId() { return notebookId; }
    public void setNotebookId(Long notebookId) { this.notebookId = notebookId; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getMessageText() { return messageText; }
    public void setMessageText(String messageText) { this.messageText = messageText; }
    public String getCitationsJson() { return citationsJson; }
    public void setCitationsJson(String citationsJson) { this.citationsJson = citationsJson; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getActiveStatus() { return activeStatus; }
    public void setActiveStatus(String activeStatus) { this.activeStatus = activeStatus; }
}

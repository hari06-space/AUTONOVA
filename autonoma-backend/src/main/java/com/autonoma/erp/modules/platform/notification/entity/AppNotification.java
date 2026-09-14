package com.autonoma.erp.modules.platform.notification.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "SYS_APP_NOTIFICATION", indexes = {
    @Index(name = "IX_SYS_APP_NOTIF_RECIP_CREATED", columnList = "recipient_emp_id, CREATED_DATE DESC"),
    @Index(name = "IX_SYS_APP_NOTIF_RECIP_READ_CREATED", columnList = "recipient_emp_id, is_read, CREATED_DATE DESC"),
    @Index(name = "IX_SYS_APP_NOTIF_READ_CREATED", columnList = "is_read, CREATED_DATE DESC"),
    @Index(name = "IX_SYS_APP_NOTIF_REF", columnList = "REF_TYPE, REF_ID")
})
@Data
@NoArgsConstructor
public class AppNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    // Recipient could be User ID or Employee ID. Based on current architecture, we will store Employee ID here.
    @Column(name = "recipient_emp_id", nullable = false)
    private Long recipientEmpId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "message", columnDefinition = "NVARCHAR(MAX)")
    private String message;

    @Column(name = "link_url", length = 500)
    private String linkUrl;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "REF_TYPE", length = 100)
    private String refType;

    @Column(name = "REF_ID")
    private Long refId;

    @CreationTimestamp
    @Column(name = "CREATED_DATE", updatable = false)
    private java.time.Instant createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRecipientEmpId() { return recipientEmpId; }
    public void setRecipientEmpId(Long recipientEmpId) { this.recipientEmpId = recipientEmpId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getLinkUrl() { return linkUrl; }
    public void setLinkUrl(String linkUrl) { this.linkUrl = linkUrl; }
    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    public String getRefType() { return refType; }
    public void setRefType(String refType) { this.refType = refType; }
    public Long getRefId() { return refId; }
    public void setRefId(Long refId) { this.refId = refId; }
    public java.time.Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.Instant createdAt) { this.createdAt = createdAt; }
}

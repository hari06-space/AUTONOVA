package com.autonoma.erp.entity.admin;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "CLI_NOTIFICATION_LOG")
public class ClientNotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LOG_ID")
    private Long logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NOTIFICATION_ID", nullable = false)
    private ClientNotification notification;

    @Column(name = "CLIENT_CODE", nullable = false, length = 50)
    private String clientCode;

    @Column(name = "USER_ID", length = 100)
    private String userId;

    @Column(name = "VIEWED_AT")
    private LocalDateTime viewedAt;

    @Column(name = "ACKNOWLEDGED_AT")
    private LocalDateTime acknowledgedAt;

    @Column(name = "STATUS", nullable = false, length = 20)
    private String status; // DELIVERED, VIEWED, ACKNOWLEDGED

    @Column(name = "CREATED_DATE", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    public ClientNotificationLog() {
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdDate == null) {
            this.createdDate = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "DELIVERED";
        }
    }

    // Getters and Setters

    public Long getLogId() {
        return logId;
    }

    public void setLogId(Long logId) {
        this.logId = logId;
    }

    public ClientNotification getNotification() {
        return notification;
    }

    public void setNotification(ClientNotification notification) {
        this.notification = notification;
    }

    public String getClientCode() {
        return clientCode;
    }

    public void setClientCode(String clientCode) {
        this.clientCode = clientCode;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocalDateTime getViewedAt() {
        return viewedAt;
    }

    public void setViewedAt(LocalDateTime viewedAt) {
        this.viewedAt = viewedAt;
    }

    public LocalDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }
}

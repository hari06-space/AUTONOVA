package com.autonoma.erp.entity.admin;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "CLI_NOTIFICATION_MASTER")
public class ClientNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "NOTIFICATION_ID")
    private Long notificationId;

    @Column(name = "TITLE", nullable = false, length = 200)
    private String title;

    @Column(name = "MESSAGE", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String message;

    @Column(name = "TYPE", nullable = false, length = 50)
    private String type; // INFORMATION, ALERT, WARNING, CRITICAL, MAINTENANCE, BUILD_UPDATE, WISHES

    @Column(name = "PRIORITY", nullable = false, length = 20)
    private String priority; // LOW, MEDIUM, HIGH, URGENT

    @Column(name = "COLOR_HEX", nullable = false, length = 20)
    private String colorHex;

    @Column(name = "ICON_NAME", nullable = false, length = 50)
    private String iconName;

    @Column(name = "TARGET_TYPE", nullable = false, length = 20)
    private String targetType; // ALL_CLIENTS, SELECTED_CLIENTS

    @Column(name = "TARGET_CLIENT_CODES", columnDefinition = "NVARCHAR(MAX)")
    private String targetClientCodes; // Comma separated list of client codes e.g. "123456,789012"

    @Column(name = "START_DATE_TIME", nullable = false)
    private LocalDateTime startDateTime;

    @Column(name = "END_DATE_TIME", nullable = false)
    private LocalDateTime endDateTime;

    @Column(name = "STATUS", nullable = false, length = 20)
    private String status; // DRAFT, SCHEDULED, ACTIVE, EXPIRED, CANCELLED

    @Column(name = "IS_MANDATORY_ACK", nullable = false)
    private Boolean isMandatoryAck = false;

    @Column(name = "CREATED_BY", length = 100)
    private String createdBy;

    @Column(name = "CREATED_DATE", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "UPDATED_BY", length = 100)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;

    public ClientNotification() {
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdDate == null) {
            this.createdDate = LocalDateTime.now();
        }
        if (this.isMandatoryAck == null) {
            this.isMandatoryAck = false;
        }
        if (this.status == null) {
            this.status = "DRAFT";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getColorHex() {
        return colorHex;
    }

    public void setColorHex(String colorHex) {
        this.colorHex = colorHex;
    }

    public String getIconName() {
        return iconName;
    }

    public void setIconName(String iconName) {
        this.iconName = iconName;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public String getTargetClientCodes() {
        return targetClientCodes;
    }

    public void setTargetClientCodes(String targetClientCodes) {
        this.targetClientCodes = targetClientCodes;
    }

    public LocalDateTime getStartDateTime() {
        return startDateTime;
    }

    public void setStartDateTime(LocalDateTime startDateTime) {
        this.startDateTime = startDateTime;
    }

    public LocalDateTime getEndDateTime() {
        return endDateTime;
    }

    public void setEndDateTime(LocalDateTime endDateTime) {
        this.endDateTime = endDateTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsMandatoryAck() {
        return isMandatoryAck;
    }

    public void setIsMandatoryAck(Boolean mandatoryAck) {
        isMandatoryAck = mandatoryAck;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(LocalDateTime updatedDate) {
        this.updatedDate = updatedDate;
    }
}

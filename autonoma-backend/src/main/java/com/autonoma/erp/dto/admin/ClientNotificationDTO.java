package com.autonoma.erp.dto.admin;

import java.time.LocalDateTime;

public class ClientNotificationDTO {

    private Long notificationId;
    private String title;
    private String message;
    private String type; // INFORMATION, ALERT, WARNING, CRITICAL, MAINTENANCE, BUILD_UPDATE, WISHES
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    private String colorHex;
    private String iconName;
    private String targetType; // ALL_CLIENTS, SELECTED_CLIENTS
    private String targetClientCodes; // Comma-separated client codes
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private String status; // DRAFT, SCHEDULED, ACTIVE, EXPIRED, CANCELLED
    private Boolean isMandatoryAck;
    private String createdBy;
    private LocalDateTime createdDate;
    private String updatedBy;
    private LocalDateTime updatedDate;

    // View & Acknowledge summary counters for admin
    private Long deliveredCount;
    private Long viewedCount;
    private Long acknowledgedCount;

    public ClientNotificationDTO() {
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

    public Long getDeliveredCount() {
        return deliveredCount;
    }

    public void setDeliveredCount(Long deliveredCount) {
        this.deliveredCount = deliveredCount;
    }

    public Long getViewedCount() {
        return viewedCount;
    }

    public void setViewedCount(Long viewedCount) {
        this.viewedCount = viewedCount;
    }

    public Long getAcknowledgedCount() {
        return acknowledgedCount;
    }

    public void setAcknowledgedCount(Long acknowledgedCount) {
        this.acknowledgedCount = acknowledgedCount;
    }
}

package com.autonoma.erp.modules.master.contact.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "SM_CONTACT_MASTER")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_name", length = 200)
    private String groupName; // This is often the Customer Name

    @Column(name = "title", length = 20)
    private String title;

    @Column(name = "contact_name", nullable = false, length = 200)
    private String contactName;

    @Column(name = "designation", length = 100)
    private String designation;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "email_id", length = 100)
    private String emailId;

    public String getGroupName() { return groupName; }
    public String getEmailId() { return emailId; }

    @Column(name = "landline_no", length = 50)
    private String landlineNo;

    @Column(name = "mobile_no", length = 50)
    private String mobileNo;

    @Column(name = "whatsapp_no", length = 50)
    private String whatsAppNo;

    @Column(name = "type", length = 100)
    private String type;

    @Column(name = "contact_type", length = 100)
    private String contactType;

    @Column(name = "file_upload", length = 500)
    private String fileUpload;

    @Column(name = "STATUS")
    @Builder.Default
    private String status = "Active";

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE", updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.createdBy = currentUserId;
        this.updatedBy = null;

        createdAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        if (this.createdBy != null && this.createdBy.trim().isEmpty()) {
            this.createdBy = null;
        }

        updatedAt = java.time.LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public void setEmailId(String emailId) { this.emailId = emailId; }
    public String getLandlineNo() { return landlineNo; }
    public void setLandlineNo(String landlineNo) { this.landlineNo = landlineNo; }
    public String getMobileNo() { return mobileNo; }
    public void setMobileNo(String mobileNo) { this.mobileNo = mobileNo; }
    public String getWhatsAppNo() { return whatsAppNo; }
    public void setWhatsAppNo(String whatsAppNo) { this.whatsAppNo = whatsAppNo; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getContactType() { return contactType; }
    public void setContactType(String contactType) { this.contactType = contactType; }
    public String getFileUpload() { return fileUpload; }
    public void setFileUpload(String fileUpload) { this.fileUpload = fileUpload; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(java.time.LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

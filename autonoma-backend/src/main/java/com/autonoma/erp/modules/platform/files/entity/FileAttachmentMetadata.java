package com.autonoma.erp.modules.platform.files.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "FILE_ATTACHMENT_METADATA")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileAttachmentMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "STORAGE_PATH", nullable = false, unique = true, length = 1000)
    private String storagePath;

    @Column(name = "ORIGINAL_FILE_NAME", nullable = false, length = 255)
    private String originalFileName;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Boolean activeStatus = true;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            currentUserId = "System";
        }
        this.createdBy = currentUserId;
        this.createdDate = new Date();
        this.activeStatus = true;
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            currentUserId = "System";
        }
        this.updatedBy = currentUserId;
        this.updatedDate = new Date();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    public Boolean getActiveStatus() { return activeStatus; }
    public void setActiveStatus(Boolean activeStatus) { this.activeStatus = activeStatus; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }

    public static FileAttachmentMetadataBuilder builder() {
        return new FileAttachmentMetadataBuilder();
    }

    public static class FileAttachmentMetadataBuilder {
        private Long id;
        private String storagePath;
        private String originalFileName;
        private Boolean activeStatus = true;
        private String createdBy;
        private Date createdDate;
        private String updatedBy;
        private Date updatedDate;

        public FileAttachmentMetadataBuilder id(Long id) { this.id = id; return this; }
        public FileAttachmentMetadataBuilder storagePath(String storagePath) { this.storagePath = storagePath; return this; }
        public FileAttachmentMetadataBuilder originalFileName(String originalFileName) { this.originalFileName = originalFileName; return this; }
        public FileAttachmentMetadataBuilder activeStatus(Boolean activeStatus) { this.activeStatus = activeStatus; return this; }
        public FileAttachmentMetadataBuilder createdBy(String createdBy) { this.createdBy = createdBy; return this; }
        public FileAttachmentMetadataBuilder createdDate(Date createdDate) { this.createdDate = createdDate; return this; }
        public FileAttachmentMetadataBuilder updatedBy(String updatedBy) { this.updatedBy = updatedBy; return this; }
        public FileAttachmentMetadataBuilder updatedDate(Date updatedDate) { this.updatedDate = updatedDate; return this; }

        public FileAttachmentMetadata build() {
            FileAttachmentMetadata meta = new FileAttachmentMetadata();
            meta.setId(id);
            meta.setStoragePath(storagePath);
            meta.setOriginalFileName(originalFileName);
            meta.setActiveStatus(activeStatus);
            meta.setCreatedBy(createdBy);
            meta.setCreatedDate(createdDate);
            meta.setUpdatedBy(updatedBy);
            meta.setUpdatedDate(updatedDate);
            return meta;
        }
    }
}

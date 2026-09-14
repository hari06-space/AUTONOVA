package com.autonoma.erp.modules.platform.ticketing.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "TICKET_ATTACHMENTS")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ticket_row_id", nullable = false)
    private Integer ticketRowId;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    public String getFilePath() { return filePath; }

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "ticket_id", length = 50)
    private String ticketId;

    @Column(name = "uploaded_by", nullable = false, length = 100)
    private String uploadedBy;

    @Column(name = "uploaded_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date uploadedAt;

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public void setTicketRowId(Integer ticketRowId) { this.ticketRowId = ticketRowId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        uploadedBy = currentUserId;
        this.uploadedAt = new Date();
    }
}

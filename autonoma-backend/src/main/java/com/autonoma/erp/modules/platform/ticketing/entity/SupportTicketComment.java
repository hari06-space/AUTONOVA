package com.autonoma.erp.modules.platform.ticketing.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "TICKET_COMMENTS")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ticket_row_id", nullable = false)
    private Integer ticketRowId;

    @Column(name = "commented_by", nullable = false, length = 100)
    private String commentedBy;

    @Column(name = "comment_type", nullable = false, length = 50)
    private String commentType; // Internal Note, Public Reply, Resolution Update

    @Column(name = "comments", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    @Column(name = "attachment_path", length = 500)
    private String attachmentPath;

    @Column(name = "CREATED_DATE", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    public String getCommentType() { return commentType; }
    public void setCommentType(String commentType) { this.commentType = commentType; }
    public void setTicketRowId(Integer ticketRowId) { this.ticketRowId = ticketRowId; }
    public void setCommentedBy(String commentedBy) { this.commentedBy = commentedBy; }
    public String getComments() { return comments; }

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }

        this.createdAt = new Date();
    }
}

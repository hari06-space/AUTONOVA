package com.autonoma.erp.modules.platform.ticketing.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "TICKET_STATUS_HISTORY")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ticket_row_id", nullable = false)
    private Integer ticketRowId;

    @Column(name = "from_status", length = 50)
    private String fromStatus;

    @Column(name = "to_status", nullable = false, length = 50)
    private String toStatus;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @Column(name = "comment", columnDefinition = "NVARCHAR(MAX)")
    private String comment;

    public void setTicketRowId(Integer ticketRowId) { this.ticketRowId = ticketRowId; }
    public void setFromStatus(String fromStatus) { this.fromStatus = fromStatus; }
    public void setToStatus(String toStatus) { this.toStatus = toStatus; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public void setComment(String comment) { this.comment = comment; }

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try { currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception e) {}
        
        this.updatedBy = currentUserId;
        this.updatedAt = new Date();
        this.createdBy = currentUserId;
        this.createdAt = new Date();
    }
}

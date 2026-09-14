package com.autonoma.erp.modules.platform.ticketing.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "TICKET_REOPEN_HISTORY")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketReopenHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ticket_row_id", nullable = false)
    private Integer ticketRowId;

    @Column(name = "reopened_by", nullable = false, length = 100)
    private String reopenedBy;

    @Column(name = "reopened_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date reopenedAt;

    @Column(name = "reason", columnDefinition = "NVARCHAR(MAX)")
    private String reason;

    @Column(name = "expected_duration", length = 100)
    private String expectedDuration;

    @Column(name = "reopen_target_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date reopenTargetDate;

    public void setTicketRowId(Integer ticketRowId) { this.ticketRowId = ticketRowId; }
    public void setReopenedBy(String reopenedBy) { this.reopenedBy = reopenedBy; }
    public void setReason(String reason) { this.reason = reason; }
    public void setExpectedDuration(String expectedDuration) { this.expectedDuration = expectedDuration; }
    public void setReopenTargetDate(Date reopenTargetDate) { this.reopenTargetDate = reopenTargetDate; }

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try { currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception e) {}

        if (this.reopenedBy == null) {
            this.reopenedBy = currentUserId != null ? currentUserId : "System";
        }

        this.reopenedAt = new Date();
        }
}

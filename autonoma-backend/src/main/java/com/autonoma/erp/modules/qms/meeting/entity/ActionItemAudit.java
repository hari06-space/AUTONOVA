package com.autonoma.erp.modules.qms.meeting.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "QMS_ACTION_ITEM_AUDIT")
@Data
@NoArgsConstructor
public class ActionItemAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ACTION_ITEM_ID", nullable = false)
    private Long actionItemId;

    @Column(name = "PREVIOUS_STATUS", length = 50)
    private String previousStatus;

    @Column(name = "NEW_STATUS", length = 50, nullable = false)
    private String newStatus;

    @Column(name = "ACTION", length = 50, nullable = false)
    private String action;

    @Column(name = "PERFORMED_BY", length = 100, nullable = false)
    private String performedBy;

    @Column(name = "PERFORMED_DATE", nullable = false)
    private LocalDateTime performedDate;

    @Column(name = "COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String comments;
}

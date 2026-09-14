package com.autonoma.erp.model.purchase.gateentry;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "PP_GATE_ENTRY_LOG")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"gateEntryHead"})
@NoArgsConstructor
@AllArgsConstructor
public class GateEntryLog extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GATE_ENTRY_HEAD_ID", nullable = false)
    private GateEntryHead gateEntryHead;

    @Column(name = "EVENT_TYPE", nullable = false, length = 50)
    private String eventType;

    @Column(name = "EVENT_DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String eventDescription;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;
}

package com.autonoma.erp.model.purchase.gateentry;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.model.PurchaseOrderHead;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "PP_GATE_ENTRY_SOURCE")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"gateEntryHead"})
@NoArgsConstructor
@AllArgsConstructor
public class GateEntrySource extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GATE_ENTRY_HEAD_ID", nullable = false)
    private GateEntryHead gateEntryHead;

    @Column(name = "SOURCE_TYPE", nullable = false, length = 50)
    private String sourceType; // PO, INVOICE, CHALLAN, LR, EWAY_BILL

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SOURCE_HEAD_ID")
    private PurchaseOrderHead sourceHead; // Only mapped when type is PO

    @Column(name = "SOURCE_DOCUMENT_NO", length = 100)
    private String sourceDocumentNo;

    @Column(name = "SOURCE_DOCUMENT_DATE")
    private LocalDate sourceDocumentDate;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;
}

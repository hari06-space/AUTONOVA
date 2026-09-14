package com.autonoma.erp.model.purchase.gateentry;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.model.PurchaseOrderTrans;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "PP_GATE_ENTRY_TRANS")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"gateEntryHead"})
@NoArgsConstructor
@AllArgsConstructor
public class GateEntryTrans extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GATE_ENTRY_HEAD_ID", nullable = false)
    private GateEntryHead gateEntryHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SOURCE_ID", nullable = false)
    private GateEntrySource source;

    @Column(name = "SOURCE_LINE_ID")
    private Long sourceLineId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_TRANS_ID")
    private PurchaseOrderTrans poTrans;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PURCHASE_SCHEDULE_ID")
    private com.autonoma.erp.model.PurchaseSchedule purchaseSchedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", nullable = false)
    private ProductMaster item;

    @Column(name = "DELIVERED_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal deliveredQty = BigDecimal.ZERO;

    @Column(name = "ACCEPTED_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal acceptedQty = BigDecimal.ZERO;

    @Column(name = "REJECTED_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal rejectedQty = BigDecimal.ZERO;

    @Column(name = "DAMAGED_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal damagedQty = BigDecimal.ZERO;

    @Column(name = "SHORT_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal shortQty = BigDecimal.ZERO;

    @Column(name = "PACKAGE_COUNT")
    private Integer packageCount;

    @Column(name = "BATCH_NO", length = 100)
    private String batchNo;

    @Column(name = "SERIAL_NO", length = 100)
    private String serialNo;

    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;
}

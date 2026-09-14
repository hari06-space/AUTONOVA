package com.autonoma.erp.model.purchase.grn;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.model.purchase.gateentry.GateEntryTrans;

import com.autonoma.erp.model.PurchaseOrderTrans;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.math.BigDecimal;

@Entity
@Table(name = "PP_GOODS_RECEIPT_TRANS")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"head"})
@ToString(callSuper = true, exclude = {"head"})
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptTrans extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GRN_HEAD_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private GoodsReceiptHead head;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_TRANS_ID")
    private PurchaseOrderTrans poTrans;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GATE_ENTRY_TRANS_ID")
    private GateEntryTrans gateEntryTrans;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PURCHASE_SCHEDULE_ID")
    private com.autonoma.erp.model.PurchaseSchedule purchaseSchedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", nullable = false)
    private ProductMaster item;

    @Column(name = "UOM", length = 50)
    private String uom;

    @Column(name = "PRICE", nullable = false, precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "GRN_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal grnQty = BigDecimal.ZERO;

    @Column(name = "BATCH_NO", length = 50)
    private String batchNo;

    @Column(name = "REMARKS", length = 1000)
    private String remarks;

    @Column(name = "TEST_CERTIFICATE", length = 500)
    private String testCertificate;

    @Column(name = "TC_SOURCE", length = 200)
    private String tcSource;

    @Column(name = "HEAT_NO", length = 150)
    private String heatNo;

    @Column(name = "BATCH_STATUS")
    private Long batchStatus;
}

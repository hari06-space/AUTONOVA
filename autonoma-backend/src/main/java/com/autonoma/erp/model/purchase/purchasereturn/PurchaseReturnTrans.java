package com.autonoma.erp.model.purchase.purchasereturn;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.model.PurchaseOrderTrans;
import com.autonoma.erp.model.purchase.inspection.QualityInspection;
import com.autonoma.erp.model.purchase.grn.GoodsReceiptTrans;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "PP_PURCHASE_RETURN_TRANS")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"head"})
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseReturnTrans extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RETURN_HEAD_ID", nullable = false)
    private PurchaseReturnHead head;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GRN_TRANS_ID", nullable = false)
    private GoodsReceiptTrans grnTrans;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_TRANS_ID", nullable = false)
    private PurchaseOrderTrans poTrans;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QI_TRANS_ID")
    private QualityInspection qiTrans;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", nullable = false)
    private ProductMaster item;

    @Column(name = "UOM", length = 50)
    private String uom;

    @Column(name = "BATCH_NO", length = 50)
    private String batchNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RETURN_REASON_ID", nullable = false)
    private PurchaseReturnReason returnReason;

    @Column(name = "SOURCE_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal sourceQty = BigDecimal.ZERO;

    @Column(name = "PREVIOUS_RETURNED_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal previousReturnedQty = BigDecimal.ZERO;

    @Column(name = "RETURN_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal returnQty = BigDecimal.ZERO;

    @Column(name = "UNIT_PRICE", nullable = false, precision = 18, scale = 4)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "REMARKS", length = 1000)
    private String remarks;
}

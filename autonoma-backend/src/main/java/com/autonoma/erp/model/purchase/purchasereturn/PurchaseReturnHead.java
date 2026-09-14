package com.autonoma.erp.model.purchase.purchasereturn;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.model.PurchaseOrderHead;
import com.autonoma.erp.model.purchase.grn.GoodsReceiptHead;


import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PP_PURCHASE_RETURN_HEAD")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"transactions"})
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseReturnHead extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION_ID", nullable = false)
    private Division division;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", nullable = false)
    private AccountLedger supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GRN_HEAD_ID", nullable = false)
    private GoodsReceiptHead grnHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_HEAD_ID", nullable = false)
    private PurchaseOrderHead poHead;



    @Column(name = "QI_NO", length = 50)
    private String qiNo;

    @Column(name = "RETURN_NO", nullable = false, length = 50, unique = true)
    private String returnNo;

    @Column(name = "RETURN_DATE", nullable = false)
    private LocalDateTime returnDate;

    @Column(name = "RETURN_TYPE", nullable = false, length = 50)
    private String returnType; // 'ACCEPTED_STOCK' or 'REJECTED_STOCK'

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS_ID", nullable = false)
    private StatusMaster status;

    @Column(name = "TOTAL_QTY", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalQty = BigDecimal.ZERO;

    @Column(name = "TOTAL_AMOUNT", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "REMARKS", length = 1000)
    private String remarks;

    @OneToMany(mappedBy = "head", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseReturnTrans> transactions = new ArrayList<>();
}

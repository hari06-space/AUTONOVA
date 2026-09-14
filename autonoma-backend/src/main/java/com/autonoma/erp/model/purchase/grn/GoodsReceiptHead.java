package com.autonoma.erp.model.purchase.grn;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.model.purchase.gateentry.GateEntryHead;

import com.autonoma.erp.model.PurchaseOrderHead;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PP_GOODS_RECEIPT_HEAD")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"transactions", "attachments"})
@ToString(callSuper = true, exclude = {"transactions", "attachments"})
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptHead extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION_ID", nullable = false)
    private Division division;

    @Column(name = "GRN_NO", nullable = false, length = 50)
    private String grnNo;

    @Column(name = "GRN_DATE", nullable = false)
    private LocalDate grnDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_HEAD_ID")
    private PurchaseOrderHead poHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GATE_ENTRY_HEAD_ID")
    private GateEntryHead gateEntryHead;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID")
    private AccountLedger supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS_ID", nullable = false)
    private StatusMaster status;

    @Column(name = "APPROVAL_VERSION", nullable = false)
    private Integer approvalVersion = 1;

    @Column(name = "APPROVAL_SEQUENCE", nullable = false)
    private Integer approvalSequence = 0;

    @Column(name = "REMARKS")
    private String remarks;

    @Column(name = "DOCUMENT_TYPE", length = 50)
    private String documentType;

    @Column(name = "DOCUMENT_NO", length = 100)
    private String documentNo;

    @Column(name = "DOCUMENT_DATE")
    private LocalDate documentDate;

    @OneToMany(mappedBy = "head", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"head"})
    private List<GoodsReceiptTrans> transactions = new ArrayList<>();

    @OneToMany(mappedBy = "goodsReceiptHead", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"goodsReceiptHead"})
    private List<GoodsReceiptAttachment> attachments = new ArrayList<>();
}

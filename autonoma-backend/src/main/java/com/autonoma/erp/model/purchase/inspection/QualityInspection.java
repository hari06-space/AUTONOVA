package com.autonoma.erp.model.purchase.inspection;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.model.purchase.grn.GoodsReceiptTrans;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.ToString;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "QMC_QUALITY_INSPECTION")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class QualityInspection extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "INSPECTION_DATE", nullable = false)
    private LocalDate inspectionDate;

    @Column(name = "GRN_ID", nullable = false)
    private Long grnId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GRN_TRANS_ID", nullable = false)
    private GoodsReceiptTrans grnTrans;

    @Column(name = "ITEM_ID", nullable = false)
    private Long itemId;

    @Column(name = "GRN_QTY", precision = 12, scale = 2)
    private BigDecimal grnQty = BigDecimal.ZERO;

    @Column(name = "ACCEPTED_QTY", precision = 12, scale = 2)
    private BigDecimal acceptedQty = BigDecimal.ZERO;

    @Column(name = "REJECTED_QTY", precision = 12, scale = 2)
    private BigDecimal rejectedQty = BigDecimal.ZERO;

    @Column(name = "REJECTION_REASON_ID")
    private Long rejectionReasonId;

    @Column(name = "NC_QTY", precision = 12, scale = 2)
    private BigDecimal ncQty = BigDecimal.ZERO;

    @Column(name = "INSPECTED_BY_ID")
    private Long inspectedById;

    @Column(name = "NC_REMARKS", length = 250)
    private String ncRemarks;

    @Column(name = "REMARKS", length = 500)
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS")
    private StatusMaster status;

    @OneToMany(mappedBy = "qualityInspection", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("qualityInspection")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private java.util.List<MaterialInspection> testReports = new java.util.ArrayList<>();
}

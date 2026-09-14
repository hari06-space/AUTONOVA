package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "PP_QUOTE_COMPARISON_TRANS")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class QuoteComparisonTrans extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "COMPARISON_HEAD_ID", nullable = false)
    private QuoteComparisonHead comparisonHead;

    @Column(name = "RFQ_ITEM_ID", nullable = false)
    private Long rfqItemId;

    @Column(name = "SELECTED_SUPPLIER_ID")
    private Long selectedSupplierId;

    @Column(name = "SELECTED_QUOTATION_ID")
    private Long selectedQuotationId;

    @Column(name = "SELECTED_NEGOTIATION_ID")
    private Long selectedNegotiationId;

    @Column(name = "AWARDED_PRICE", precision = 18, scale = 2)
    private BigDecimal awardedPrice;

    @Column(name = "AWARDED_QTY", precision = 18, scale = 2)
    private BigDecimal awardedQty;

    @Column(name = "REMARKS", length = 1000)
    private String remarks;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;

}

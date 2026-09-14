package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "PP_QUOTE_COMPARISON_MATRIX")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class QuoteComparisonMatrix extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "COMPARISON_HEAD_ID", nullable = false)
    private QuoteComparisonHead comparisonHead;

    @Column(name = "RFQ_ITEM_ID", nullable = false)
    private Long rfqItemId;

    @Column(name = "SUPPLIER_ID", nullable = false)
    private Long supplierId;

    @Column(name = "QUOTATION_ID")
    private Long quotationId;

    @Column(name = "NEGOTIATION_ID")
    private Long negotiationId;

    @Column(name = "ORIGINAL_PRICE", precision = 18, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "NEGOTIATED_PRICE", precision = 18, scale = 2)
    private BigDecimal negotiatedPrice;

    @Column(name = "DISCOUNT", precision = 18, scale = 2)
    private BigDecimal discount;

    @Column(name = "TAX", precision = 18, scale = 2)
    private BigDecimal tax;

    @Column(name = "FREIGHT", precision = 18, scale = 2)
    private BigDecimal freight;

    @Column(name = "PACKING", precision = 18, scale = 2)
    private BigDecimal packing;

    @Column(name = "DELIVERY_DAYS")
    private Integer deliveryDays;

    @Column(name = "WARRANTY", length = 100)
    private String warranty;

    @Column(name = "PAYMENT_TERMS", length = 200)
    private String paymentTerms;

    @Column(name = "BRAND", length = 100)
    private String brand;

    @Column(name = "ORIGIN", length = 100)
    private String origin;

    @Column(name = "CURRENCY", length = 10)
    private String currency;

    @Column(name = "EXCHANGE_RATE", precision = 18, scale = 6)
    private BigDecimal exchangeRate;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;

}

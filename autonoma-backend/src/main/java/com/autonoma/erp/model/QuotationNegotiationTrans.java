package com.autonoma.erp.model;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "PP_QUOTATION_NEGOTIATION_TRANS")
public class QuotationNegotiationTrans extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NEGOTIATION_HEAD_ID", nullable = false)
    private QuotationNegotiationHead negotiationHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUOTATION_DETAIL_ID", nullable = false)
    private QuotationDetail quotationDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ITEM_ID", nullable = false)
    private ProductMaster item;

    @Column(name = "QTY", nullable = false)
    private BigDecimal qty;

    @Column(name = "ORIGINAL_PRICE")
    private BigDecimal originalPrice;

    @Column(name = "NEGOTIATED_PRICE")
    private BigDecimal negotiatedPrice;

    @Column(name = "SAVINGS")
    private BigDecimal savings;

    @Column(name = "ORIGINAL_DELIVERY_DAYS")
    private Integer originalDeliveryDays;

    @Column(name = "NEGOTIATED_DELIVERY_DAYS")
    private Integer negotiatedDeliveryDays;

    @Column(name = "ORIGINAL_WARRANTY")
    private String originalWarranty;

    @Column(name = "NEGOTIATED_WARRANTY")
    private String negotiatedWarranty;

    @Column(name = "REMARKS", length = 4000)
    private String remarks;
}

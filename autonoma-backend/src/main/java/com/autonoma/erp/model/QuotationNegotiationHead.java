package com.autonoma.erp.model;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.organization.entity.Division;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import jakarta.persistence.*;
import java.util.Date;
import java.util.List;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "PP_QUOTATION_NEGOTIATION_HEAD")
public class QuotationNegotiationHead extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "NEGOTIATION_NO", length = 50, nullable = false)
    private String negotiationNo;

    @Column(name = "NEGOTIATION_ROUND", nullable = false)
    private Integer negotiationRound = 1;

    @Column(name = "NEGOTIATION_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date negotiationDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUOTATION_ID", nullable = false)
    private QuotationHead quotationHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RFQ_ID", nullable = false)
    private RfqHead rfqHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", nullable = false)
    private AccountLedger supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BUYER_ID", nullable = false)
    private EmployeeMaster buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    @Column(name = "ORIGINAL_TOTAL")
    private BigDecimal originalTotal;

    @Column(name = "NEGOTIATED_TOTAL")
    private BigDecimal negotiatedTotal;

    @Column(name = "TOTAL_SAVINGS")
    private BigDecimal totalSavings;

    @Column(name = "ORIGINAL_DELIVERY_TERMS", length = 500)
    private String originalDeliveryTerms;

    @Column(name = "NEGOTIATED_DELIVERY_TERMS", length = 500)
    private String negotiatedDeliveryTerms;

    @Column(name = "ORIGINAL_PAYMENT_TERMS", length = 500)
    private String originalPaymentTerms;

    @Column(name = "NEGOTIATED_PAYMENT_TERMS", length = 500)
    private String negotiatedPaymentTerms;

    @Column(name = "ORIGINAL_TRANSPORT_MODE", length = 200)
    private String originalTransportMode;

    @Column(name = "NEGOTIATED_TRANSPORT_MODE", length = 200)
    private String negotiatedTransportMode;

    @Column(name = "NEGOTIATION_REMARKS", length = 4000)
    private String negotiationRemarks;

    @Column(name = "SUPPLIER_REMARKS", length = 4000)
    private String supplierRemarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS_ID", nullable = false)
    private StatusMaster status;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "negotiationHead", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuotationNegotiationTrans> transactions;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "negotiationHead", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuotationNegotiationHistory> history;
}

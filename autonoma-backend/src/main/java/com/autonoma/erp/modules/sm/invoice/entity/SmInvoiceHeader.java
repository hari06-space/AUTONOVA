package com.autonoma.erp.modules.sm.invoice.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "SM_INVOICE_HEADER")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmInvoiceHeader extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "INVOICE_NO", nullable = false, unique = true, length = 50)
    private String invoiceNo;

    @Column(name = "DOC_TYPE", length = 30)
    private String docType = "INVOICE";

    @Column(name = "INVOICE_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date invoiceDate;

    @Column(name = "CUSTOMER_ID")
    private Long customerId;

    @Column(name = "BILLING_ADDRESS_ID")
    private Long billingAddressId;

    @Column(name = "SHIPPING_ADDRESS_ID")
    private Long shippingAddressId;

    @Column(name = "PAYMENT_TERMS", length = 50)
    private String paymentTerms;

    @Column(name = "DELIVERY_TERMS", length = 50)
    private String deliveryTerms;

    @Column(name = "CURRENCY_CODE", length = 15)
    private String currencyCode;

    @Column(name = "EXCHANGE_RATE", precision = 12, scale = 4)
    private BigDecimal exchangeRate;

    @Column(name = "BASE_CURRENCY", length = 15)
    private String baseCurrency;

    @Column(name = "RATE_DATE")
    @Temporal(TemporalType.DATE)
    private Date rateDate;

    @Column(name = "EXCHANGE_RATE_SOURCE", length = 100)
    private String exchangeRateSource;

    @Column(name = "CUSTOMER_PO", length = 50)
    private String customerPo;

    @Column(name = "REMARKS", length = 500)
    private String remarks;

    @Column(name = "SUB_TOTAL", precision = 12, scale = 2)
    private BigDecimal subTotal;

    @Column(name = "DISCOUNT_AMOUNT", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "TAXABLE_AMOUNT", precision = 12, scale = 2)
    private BigDecimal taxableAmount;

    @Column(name = "CGST_AMOUNT", precision = 12, scale = 2)
    private BigDecimal cgstAmount;

    @Column(name = "SGST_AMOUNT", precision = 12, scale = 2)
    private BigDecimal sgstAmount;

    @Column(name = "IGST_AMOUNT", precision = 12, scale = 2)
    private BigDecimal igstAmount;

    @Column(name = "GRAND_TOTAL", precision = 12, scale = 2)
    private BigDecimal grandTotal;

    @Column(name = "ROUND_OFF", precision = 12, scale = 2)
    private BigDecimal roundOff;

    @Column(name = "ADDITIONAL_CHARGES", precision = 12, scale = 2)
    private BigDecimal additionalCharges;

    @Column(name = "REF_INVOICE_NO", length = 100)
    private String refInvoiceNo;

    @Column(name = "REF_INVOICE_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date refInvoiceDate;

    @Column(name = "REF_DC_NOS", length = 500)
    private String refDcNos;

    @Column(name = "DC_STATUS", length = 50)
    private String dcStatus = "PENDING";

    @OneToMany(mappedBy = "invoiceHeader", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<SmInvoiceDetail> invoiceDetails = new ArrayList<>();

    @OneToMany(mappedBy = "invoiceHeader", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<SmInvoiceCharge> invoiceCharges = new ArrayList<>();
}

package com.autonoma.erp.modules.sm.invoice.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "SM_INVOICE_DETAIL")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmInvoiceDetail extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "INVOICE_REF_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonBackReference
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private SmInvoiceHeader invoiceHeader;

    @Column(name = "SALES_ORDER_ID", nullable = false)
    private Long salesOrderId;

    @Column(name = "SALES_ORDER_NO", length = 50)
    private String salesOrderNo;

    @Column(name = "SALES_ORDER_LINE_ID", nullable = false)
    private Long salesOrderLineId;

    @Column(name = "PART_ID")
    private Long partId;

    @Column(name = "PART_NO", length = 50)
    private String partNo;

    @Column(name = "PART_NAME", length = 500)
    private String partName;

    @Column(name = "UOM", length = 20)
    private String uom;

    @Column(name = "QTY")
    private Integer qty;

    @Column(name = "PRICE", precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "DISCOUNT_PER", precision = 12, scale = 2)
    private BigDecimal discountPer;

    @Column(name = "CGST_PER", precision = 12, scale = 2)
    private BigDecimal cgstPer;

    @Column(name = "SGST_PER", precision = 12, scale = 2)
    private BigDecimal sgstPer;

    @Column(name = "IGST_PER", precision = 12, scale = 2)
    private BigDecimal igstPer;

    @Column(name = "CGST_AMOUNT", precision = 12, scale = 2)
    private BigDecimal cgstAmount;

    @Column(name = "SGST_AMOUNT", precision = 12, scale = 2)
    private BigDecimal sgstAmount;

    @Column(name = "IGST_AMOUNT", precision = 12, scale = 2)
    private BigDecimal igstAmount;

    @Column(name = "TAX_AMOUNT", precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "NET_AMOUNT", precision = 12, scale = 2)
    private BigDecimal netAmount;
}

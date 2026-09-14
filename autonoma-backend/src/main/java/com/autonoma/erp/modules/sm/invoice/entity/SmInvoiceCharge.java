package com.autonoma.erp.modules.sm.invoice.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "SM_INVOICE_ADD_CHARGES")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmInvoiceCharge extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "INVOICE_REF_ID", nullable = false)
    @com.fasterxml.jackson.annotation.JsonBackReference
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private SmInvoiceHeader invoiceHeader;

    @Column(name = "CHARGES_ID")
    private Long chargeId;

    @Column(name = "AMOUNT", precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "TAX_APPLICABLE")
    private Boolean taxAvailable;

    @Column(name = "CGST_PER", precision = 12, scale = 2)
    private BigDecimal cgstPer;

    @Column(name = "CGST_VALUE", precision = 12, scale = 2)
    private BigDecimal cgstVal;

    @Column(name = "SGST_PER", precision = 12, scale = 2)
    private BigDecimal sgstPer;

    @Column(name = "SGST_VALUE", precision = 12, scale = 2)
    private BigDecimal sgstVal;

    @Column(name = "IGST_PER", precision = 12, scale = 2)
    private BigDecimal igstPer;

    @Column(name = "IGST_VALUE", precision = 12, scale = 2)
    private BigDecimal igstVal;

    @Column(name = "TOTAL_VALUE", precision = 12, scale = 2)
    private BigDecimal totalValue;

    @Column(name = "STATUS")
    private Boolean status = true;
}

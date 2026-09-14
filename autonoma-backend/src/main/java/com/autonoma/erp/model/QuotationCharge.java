package com.autonoma.erp.model;

import com.autonoma.erp.modules.sm.sales.entity.SmAdditionalCharges;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "PP_QUOTE_ADD_CHARGES")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class QuotationCharge extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "QUOTE_ID")
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private QuotationHead quotationHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CHARGES_ID")
    private SmAdditionalCharges chargeMaster;

    @Column(name = "AMOUNT", precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "TAX_APPLICABLE")
    private Boolean taxApplicable;

    @Column(name = "CGST_PER", precision = 12, scale = 2)
    private BigDecimal cgstPer;

    @Column(name = "CGST_VALUE", precision = 12, scale = 2)
    private BigDecimal cgstValue;

    @Column(name = "SGST_PER", precision = 12, scale = 2)
    private BigDecimal sgstPer;

    @Column(name = "SGST_VALUE", precision = 12, scale = 2)
    private BigDecimal sgstValue;

    @Column(name = "IGST_PER", precision = 12, scale = 2)
    private BigDecimal igstPer;

    @Column(name = "IGST_VALUE", precision = 12, scale = 2)
    private BigDecimal igstValue;

    @Column(name = "TOTAL_VALUE", precision = 12, scale = 2)
    private BigDecimal totalValue;

    @Column(name = "STATUS")
    private Boolean status = true;
}

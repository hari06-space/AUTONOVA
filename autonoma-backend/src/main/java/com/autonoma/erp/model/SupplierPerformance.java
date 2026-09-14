package com.autonoma.erp.model;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.organization.entity.Division;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "PP_SUPPLIER_PERFORMANCE")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class SupplierPerformance extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SUPPLIER_ID", nullable = false)
    private AccountLedger supplier;

    @Column(name = "RATING_SCORE", nullable = false, precision = 5, scale = 2)
    private BigDecimal ratingScore = BigDecimal.ZERO;

    @Column(name = "DELIVERY_PERFORMANCE", nullable = false, precision = 5, scale = 2)
    private BigDecimal deliveryPerformance = BigDecimal.ZERO;

    @Column(name = "QUALITY_PERFORMANCE", nullable = false, precision = 5, scale = 2)
    private BigDecimal qualityPerformance = BigDecimal.ZERO;

    @Column(name = "LAST_EVALUATED")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastEvaluated;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public AccountLedger getSupplier() { return supplier; }
    public void setSupplier(AccountLedger supplier) { this.supplier = supplier; }
    public BigDecimal getRatingScore() { return ratingScore; }
    public void setRatingScore(BigDecimal ratingScore) { this.ratingScore = ratingScore; }
    public BigDecimal getDeliveryPerformance() { return deliveryPerformance; }
    public void setDeliveryPerformance(BigDecimal deliveryPerformance) { this.deliveryPerformance = deliveryPerformance; }
    public BigDecimal getQualityPerformance() { return qualityPerformance; }
    public void setQualityPerformance(BigDecimal qualityPerformance) { this.qualityPerformance = qualityPerformance; }
    public Date getLastEvaluated() { return lastEvaluated; }
    public void setLastEvaluated(Date lastEvaluated) { this.lastEvaluated = lastEvaluated; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
}

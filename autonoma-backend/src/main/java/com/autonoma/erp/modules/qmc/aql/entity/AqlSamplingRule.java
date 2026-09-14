package com.autonoma.erp.modules.qmc.aql.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import jakarta.persistence.*;

@Entity
@Table(name = "QMC_AQL_SAMPLING_RULES")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class AqlSamplingRule extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AQL_MASTER_ID", nullable = false)
    @JsonIgnoreProperties("samplingRules")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private AqlMaster aqlMaster;

    @Column(name = "LOT_SIZE_FROM", nullable = false)
    private Integer lotSizeFrom;

    @Column(name = "LOT_SIZE_TO", nullable = false)
    private Integer lotSizeTo;

    @Column(name = "SAMPLE_SIZE", nullable = false)
    private Integer sampleSize;

    @Column(name = "ACCEPTANCE_QTY", nullable = false)
    private Integer acceptanceQty;

    @Column(name = "REJECTION_QTY", nullable = false)
    private Integer rejectionQty;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public AqlMaster getAqlMaster() { return aqlMaster; }
    public void setAqlMaster(AqlMaster aqlMaster) { this.aqlMaster = aqlMaster; }
    public Integer getLotSizeFrom() { return lotSizeFrom; }
    public void setLotSizeFrom(Integer lotSizeFrom) { this.lotSizeFrom = lotSizeFrom; }
    public Integer getLotSizeTo() { return lotSizeTo; }
    public void setLotSizeTo(Integer lotSizeTo) { this.lotSizeTo = lotSizeTo; }
    public Integer getSampleSize() { return sampleSize; }
    public void setSampleSize(Integer sampleSize) { this.sampleSize = sampleSize; }
    public Integer getAcceptanceQty() { return acceptanceQty; }
    public void setAcceptanceQty(Integer acceptanceQty) { this.acceptanceQty = acceptanceQty; }
    public Integer getRejectionQty() { return rejectionQty; }
    public void setRejectionQty(Integer rejectionQty) { this.rejectionQty = rejectionQty; }
}

package com.autonoma.erp.modules.qms.maintenance.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "QMS_EB_METER")
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class EbMeter extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CONSUMER_NAME", nullable = false, length = 200)
    private String consumerName;

    @Column(name = "CONSUMER_NO", nullable = false, length = 50)
    private String consumerNo;

    @Column(name = "METER_TYPE", nullable = false, length = 50)
    private String meterType;

    @Column(name = "METER_NO", nullable = false, length = 100)
    private String meterNo;

    @Column(name = "PURCHASE_DATE")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate purchaseDate;

    @Column(name = "START_UNIT_KWH", nullable = false, precision = 18, scale = 4)
    private BigDecimal startUnitKwh = BigDecimal.ZERO;

    @Column(name = "START_UNIT_KVAH", nullable = false, precision = 18, scale = 4)
    private BigDecimal startUnitKvah = BigDecimal.ZERO;

    @Column(name = "MAXIMUM_DEMAND", nullable = false, precision = 18, scale = 2)
    private BigDecimal maximumDemand = BigDecimal.ZERO;

    @Column(name = "MULTIPLICATION_FACTOR", nullable = false, precision = 18, scale = 2)
    private BigDecimal multiplicationFactor = BigDecimal.ZERO;

    @Column(name = "SANCTIONED_LOAD", nullable = false, precision = 18, scale = 2)
    private BigDecimal sanctionedLoad = BigDecimal.ZERO;

    @Column(name = "UNIT_PRICE", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "ADDITIONAL_DETAILS", columnDefinition = "NVARCHAR(MAX)")
    private String additionalDetails;

    @Column(name = "STATUS", nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getConsumerName() { return consumerName; }
    public void setConsumerName(String consumerName) { this.consumerName = consumerName; }
    public String getConsumerNo() { return consumerNo; }
    public void setConsumerNo(String consumerNo) { this.consumerNo = consumerNo; }
    public String getMeterType() { return meterType; }
    public void setMeterType(String meterType) { this.meterType = meterType; }
    public String getMeterNo() { return meterNo; }
    public void setMeterNo(String meterNo) { this.meterNo = meterNo; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    public BigDecimal getStartUnitKwh() { return startUnitKwh; }
    public void setStartUnitKwh(BigDecimal startUnitKwh) { this.startUnitKwh = startUnitKwh; }
    public BigDecimal getStartUnitKvah() { return startUnitKvah; }
    public void setStartUnitKvah(BigDecimal startUnitKvah) { this.startUnitKvah = startUnitKvah; }
    public BigDecimal getMaximumDemand() { return maximumDemand; }
    public void setMaximumDemand(BigDecimal maximumDemand) { this.maximumDemand = maximumDemand; }
    public BigDecimal getMultiplicationFactor() { return multiplicationFactor; }
    public void setMultiplicationFactor(BigDecimal multiplicationFactor) { this.multiplicationFactor = multiplicationFactor; }
    public BigDecimal getSanctionedLoad() { return sanctionedLoad; }
    public void setSanctionedLoad(BigDecimal sanctionedLoad) { this.sanctionedLoad = sanctionedLoad; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public String getAdditionalDetails() { return additionalDetails; }
    public void setAdditionalDetails(String additionalDetails) { this.additionalDetails = additionalDetails; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

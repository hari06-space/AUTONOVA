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
@Table(name = "QMS_EB_POWER_CONSUMPTION")
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class EbPowerConsumption extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "METER_ID", nullable = false)
    private EbMeter meter;

    @Column(name = "SHIFT", nullable = false, length = 20)
    private String shift;

    @Column(name = "READING_DATE", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate readingDate = LocalDate.now();

    @Column(name = "START_UNIT_KWH", nullable = false, precision = 18, scale = 4)
    private BigDecimal startUnitKwh = BigDecimal.ZERO;

    @Column(name = "END_UNIT_KWH", nullable = false, precision = 18, scale = 4)
    private BigDecimal endUnitKwh = BigDecimal.ZERO;

    @Column(name = "CONSUMPTION_UNIT_KWH", nullable = false, precision = 18, scale = 4)
    private BigDecimal consumptionUnitKwh = BigDecimal.ZERO;

    @Column(name = "ACTUAL_CONSUMPTION_UNIT", nullable = false, precision = 18, scale = 4)
    private BigDecimal actualConsumptionUnit = BigDecimal.ZERO;

    @Column(name = "COST", nullable = false, precision = 18, scale = 2)
    private BigDecimal cost = BigDecimal.ZERO;

    @Column(name = "START_UNIT_KVAH", nullable = false, precision = 18, scale = 4)
    private BigDecimal startUnitKvah = BigDecimal.ZERO;

    @Column(name = "END_UNIT_KVAH", nullable = false, precision = 18, scale = 4)
    private BigDecimal endUnitKvah = BigDecimal.ZERO;

    @Column(name = "CONSUMPTION_UNIT_KVAH", nullable = false, precision = 18, scale = 4)
    private BigDecimal consumptionUnitKvah = BigDecimal.ZERO;

    @Column(name = "POWER_FACTOR", nullable = false, precision = 18, scale = 4)
    private BigDecimal powerFactor = BigDecimal.ZERO;

    @Column(name = "REMARKS", length = 255)
    private String remarks;

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
    public EbMeter getMeter() { return meter; }
    public void setMeter(EbMeter meter) { this.meter = meter; }
    public String getShift() { return shift; }
    public void setShift(String shift) { this.shift = shift; }
    public LocalDate getReadingDate() { return readingDate; }
    public void setReadingDate(LocalDate readingDate) { this.readingDate = readingDate; }
    public BigDecimal getStartUnitKwh() { return startUnitKwh; }
    public void setStartUnitKwh(BigDecimal startUnitKwh) { this.startUnitKwh = startUnitKwh; }
    public BigDecimal getEndUnitKwh() { return endUnitKwh; }
    public void setEndUnitKwh(BigDecimal endUnitKwh) { this.endUnitKwh = endUnitKwh; }
    public BigDecimal getConsumptionUnitKwh() { return consumptionUnitKwh; }
    public void setConsumptionUnitKwh(BigDecimal consumptionUnitKwh) { this.consumptionUnitKwh = consumptionUnitKwh; }
    public BigDecimal getActualConsumptionUnit() { return actualConsumptionUnit; }
    public void setActualConsumptionUnit(BigDecimal actualConsumptionUnit) { this.actualConsumptionUnit = actualConsumptionUnit; }
    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }
    public BigDecimal getStartUnitKvah() { return startUnitKvah; }
    public void setStartUnitKvah(BigDecimal startUnitKvah) { this.startUnitKvah = startUnitKvah; }
    public BigDecimal getEndUnitKvah() { return endUnitKvah; }
    public void setEndUnitKvah(BigDecimal endUnitKvah) { this.endUnitKvah = endUnitKvah; }
    public BigDecimal getConsumptionUnitKvah() { return consumptionUnitKvah; }
    public void setConsumptionUnitKvah(BigDecimal consumptionUnitKvah) { this.consumptionUnitKvah = consumptionUnitKvah; }
    public BigDecimal getPowerFactor() { return powerFactor; }
    public void setPowerFactor(BigDecimal powerFactor) { this.powerFactor = powerFactor; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

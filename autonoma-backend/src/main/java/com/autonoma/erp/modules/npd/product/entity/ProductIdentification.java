package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "NPD_PRODUCT_IDENTIFICATION")
@Data
@NoArgsConstructor
public class ProductIdentification extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PRODUCT_ID", insertable = false, updatable = false)
    private Long productId;

    @Column(name = "IDENTIFICATION", length = 250)
    private String identification;

    @Column(name = "INSTRUMENT_LOCATION", length = 250)
    private String instrumentLocation;

    @Column(name = "PURCHASE_DATE")
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate purchaseDate;

    @Column(name = "SUPPLIED_BY", length = 250)
    private String suppliedBy;

    @Column(name = "MAC_ADDRESS", length = 100)
    private String macAddress;

    @Column(name = "CALIBRATION", length = 100)
    private String calibration;

    @Column(name = "FREQUENCY", length = 100)
    private String frequency;

    @Column(name = "LAST_CALIBRATION_DATE")
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastCalibrationDate;

    @Column(name = "NEXT_CALIBRATION_DATE")
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate nextCalibrationDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getIdentification() { return identification; }
    public void setIdentification(String identification) { this.identification = identification; }
    public String getInstrumentLocation() { return instrumentLocation; }
    public void setInstrumentLocation(String instrumentLocation) { this.instrumentLocation = instrumentLocation; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    public String getSuppliedBy() { return suppliedBy; }
    public void setSuppliedBy(String suppliedBy) { this.suppliedBy = suppliedBy; }
    public String getMacAddress() { return macAddress; }
    public void setMacAddress(String macAddress) { this.macAddress = macAddress; }
    public String getCalibration() { return calibration; }
    public void setCalibration(String calibration) { this.calibration = calibration; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public LocalDate getLastCalibrationDate() { return lastCalibrationDate; }
    public void setLastCalibrationDate(LocalDate lastCalibrationDate) { this.lastCalibrationDate = lastCalibrationDate; }
    public LocalDate getNextCalibrationDate() { return nextCalibrationDate; }
    public void setNextCalibrationDate(LocalDate nextCalibrationDate) { this.nextCalibrationDate = nextCalibrationDate; }
}

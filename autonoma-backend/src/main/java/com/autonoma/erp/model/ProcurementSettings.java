package com.autonoma.erp.model;

import com.autonoma.erp.modules.master.organization.entity.Division;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "PP_PROCUREMENT_SETTINGS")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class ProcurementSettings extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION", nullable = false)
    private Division division;

    @Column(name = "WEIGHT_PRICE", nullable = false, precision = 5, scale = 2)
    private BigDecimal weightPrice = new BigDecimal("40.00");

    @Column(name = "WEIGHT_DELIVERY", nullable = false, precision = 5, scale = 2)
    private BigDecimal weightDelivery = new BigDecimal("20.00");

    @Column(name = "WEIGHT_RATING", nullable = false, precision = 5, scale = 2)
    private BigDecimal weightRating = new BigDecimal("15.00");

    @Column(name = "WEIGHT_WARRANTY", nullable = false, precision = 5, scale = 2)
    private BigDecimal weightWarranty = new BigDecimal("10.00");

    @Column(name = "WEIGHT_PAYMENT", precision = 5, scale = 2)
    private BigDecimal weightPayment;

    @Column(name = "PO_APPROVAL_THRESHOLD", precision = 18, scale = 2)
    private BigDecimal poApprovalThreshold;

    @Column(name = "DEFAULT_CURRENCY_ID")
    private Long defaultCurrencyId;

    @Column(name = "ENABLE_GATE_ENTRY", nullable = false)
    private Integer enableGateEntry = 0;

    @Column(name = "REQUIRE_SECURITY_APPROVAL", nullable = false)
    private Integer requireSecurityApproval = 0;

    @Column(name = "REQUIRE_STORES_VERIFICATION", nullable = false)
    private Integer requireStoresVerification = 0;

    @Column(name = "REQUIRE_VEHICLE_PHOTOS", nullable = false)
    private Integer requireVehiclePhotos = 0;

    @Column(name = "REQUIRE_DRIVER_LICENSE", nullable = false)
    private Integer requireDriverLicense = 0;

    @Column(name = "REQUIRE_SEAL_VERIFICATION", nullable = false)
    private Integer requireSealVerification = 0;

    @Column(name = "REQUIRE_WEIGHBRIDGE", nullable = false)
    private Integer requireWeighbridge = 0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Division getDivision() { return division; }
    public void setDivision(Division division) { this.division = division; }
    public BigDecimal getWeightPrice() { return weightPrice; }
    public void setWeightPrice(BigDecimal weightPrice) { this.weightPrice = weightPrice; }
    public BigDecimal getWeightDelivery() { return weightDelivery; }
    public void setWeightDelivery(BigDecimal weightDelivery) { this.weightDelivery = weightDelivery; }
    public BigDecimal getWeightRating() { return weightRating; }
    public void setWeightRating(BigDecimal weightRating) { this.weightRating = weightRating; }
    public BigDecimal getWeightWarranty() { return weightWarranty; }
    public void setWeightWarranty(BigDecimal weightWarranty) { this.weightWarranty = weightWarranty; }
    public BigDecimal getWeightPayment() { return weightPayment; }
    public void setWeightPayment(BigDecimal weightPayment) { this.weightPayment = weightPayment; }
    public Integer getEnableGateEntry() { return enableGateEntry; }
    public void setEnableGateEntry(Integer enableGateEntry) { this.enableGateEntry = enableGateEntry; }
    public Integer getRequireSecurityApproval() { return requireSecurityApproval; }
    public void setRequireSecurityApproval(Integer requireSecurityApproval) { this.requireSecurityApproval = requireSecurityApproval; }
    public Integer getRequireStoresVerification() { return requireStoresVerification; }
    public void setRequireStoresVerification(Integer requireStoresVerification) { this.requireStoresVerification = requireStoresVerification; }
    public Integer getRequireVehiclePhotos() { return requireVehiclePhotos; }
    public void setRequireVehiclePhotos(Integer requireVehiclePhotos) { this.requireVehiclePhotos = requireVehiclePhotos; }
    public Integer getRequireDriverLicense() { return requireDriverLicense; }
    public void setRequireDriverLicense(Integer requireDriverLicense) { this.requireDriverLicense = requireDriverLicense; }
    public Integer getRequireSealVerification() { return requireSealVerification; }
    public void setRequireSealVerification(Integer requireSealVerification) { this.requireSealVerification = requireSealVerification; }
    public Integer getRequireWeighbridge() { return requireWeighbridge; }
    public void setRequireWeighbridge(Integer requireWeighbridge) { this.requireWeighbridge = requireWeighbridge; }
}

package com.autonoma.erp.dto.purchase;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProcurementSettingsDTO {
    private Long id;
    private Long divisionId;
    private BigDecimal weightPrice;
    private BigDecimal weightDelivery;
    private BigDecimal weightRating;
    private BigDecimal weightWarranty;
    private BigDecimal weightPayment;
    private BigDecimal poApprovalThreshold;
    private Long defaultCurrencyId;

    private Integer enableGateEntry;
    private Integer requireSecurityApproval;
    private Integer requireStoresVerification;
    private Integer requireVehiclePhotos;
    private Integer requireDriverLicense;
    private Integer requireSealVerification;
    private Integer requireWeighbridge;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getDivisionId() { return divisionId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
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
    public BigDecimal getPoApprovalThreshold() { return poApprovalThreshold; }
    public void setPoApprovalThreshold(BigDecimal poApprovalThreshold) { this.poApprovalThreshold = poApprovalThreshold; }
    public Long getDefaultCurrencyId() { return defaultCurrencyId; }
    public void setDefaultCurrencyId(Long defaultCurrencyId) { this.defaultCurrencyId = defaultCurrencyId; }
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

package com.autonoma.erp.modules.hr.petrol.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "HR_PETROL_ALLOWANCE_MASTER")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrPetrolAllowanceMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long id;

    @Column(name = "VEHICLE_TYPE", nullable = false, length = 50)
    private String vehicleType;

    @Column(name = "FROM_RATE", nullable = false, precision = 10, scale = 2)
    private BigDecimal fromRate;

    @Column(name = "TO_RATE", nullable = false, precision = 10, scale = 2)
    private BigDecimal toRate;

    @Column(name = "RATE_TWO_WHEELER", precision = 10, scale = 2)
    private BigDecimal rateTwoWheeler;

    @Column(name = "RATE_FOUR_WHEELER", precision = 10, scale = 2)
    private BigDecimal rateFourWheeler;

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    // ── Lifecycle hooks ──────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        String user = resolveCurrentUser();
        this.createdBy = user;
        this.updatedBy = null;
        this.updatedDate = null;
        this.createdDate = new Date();
        if (this.isActive == null) this.isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.createdDate != null && (new Date().getTime() - this.createdDate.getTime() < 5000)) {
            return;
        }
        String user = resolveCurrentUser();
        this.updatedBy = user;
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = user;
        }
        this.updatedDate = new Date();
    }

    @PostLoad
    protected void onPostLoad() {
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = "Admin";
        }
    }

    // ── Backward-compatible JSON aliases (mirrors HrMonthMaster pattern) ──────

    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public Date getCreatedAt() { return createdDate; }
    public void setCreatedAt(Date d) { this.createdDate = d; }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedAt")
    public Date getUpdatedAt() { return updatedDate; }
    public void setUpdatedAt(Date d) { this.updatedDate = d; }

    @com.fasterxml.jackson.annotation.JsonProperty("createdUser")
    public String getCreatedUser() { return this.createdBy; }
    public void setCreatedUser(String u) { this.createdBy = u; }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedUser")
    public String getUpdatedUser() { return this.updatedBy; }
    public void setUpdatedUser(String u) { this.updatedBy = u; }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static String resolveCurrentUser() {
        String user = null;
        try { user = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception ignored) {}
        return (user != null && !user.trim().isEmpty()) ? user : "Admin";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public BigDecimal getFromRate() { return fromRate; }
    public void setFromRate(BigDecimal fromRate) { this.fromRate = fromRate; }
    public BigDecimal getToRate() { return toRate; }
    public void setToRate(BigDecimal toRate) { this.toRate = toRate; }
    public BigDecimal getRateTwoWheeler() { return rateTwoWheeler; }
    public void setRateTwoWheeler(BigDecimal rateTwoWheeler) { this.rateTwoWheeler = rateTwoWheeler; }
    public BigDecimal getRateFourWheeler() { return rateFourWheeler; }
    public void setRateFourWheeler(BigDecimal rateFourWheeler) { this.rateFourWheeler = rateFourWheeler; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}

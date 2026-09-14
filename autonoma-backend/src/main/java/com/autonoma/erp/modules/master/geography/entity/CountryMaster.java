package com.autonoma.erp.modules.master.geography.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "MST_COUNTRY")
@Data
public class CountryMaster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROW_ID")
    private Long id;

    @Column(name = "COUNTRY_NAME", length = 100, nullable = false)
    private String countryName;

    @Column(name = "COUNTRY_CODE", length = 50)
    private String countryCode;

    @Column(name = "PHONE_MIN_LENGTH")
    private Integer phoneMinLength;

    @Column(name = "PHONE_MAX_LENGTH")
    private Integer phoneMaxLength;

    @Column(name = "COUNTRY_ISO", length = 50)
    private String countryIso;

    @Column(name = "ISD", length = 10)
    private String isd;

    @Column(name = "STATUS", length = 20)
    private String status;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    private java.time.LocalDateTime createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private java.time.LocalDateTime updatedDate;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        if (currentUserId == null || currentUserId.trim().isEmpty()) {
            currentUserId = "SYSTEM";
        }
        this.createdBy = currentUserId;
        this.updatedBy = null;
        this.updatedDate = null;
        createdDate = java.time.LocalDateTime.now();
        if (isActive == null)
            isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        if (this.createdBy != null && this.createdBy.trim().isEmpty()) {
            this.createdBy = null;
        }

        updatedDate = java.time.LocalDateTime.now();
    }

    @com.fasterxml.jackson.annotation.JsonProperty("country")
    public String getCountry() {
        return countryName;
    }

    public void setCountry(String country) {
        this.countryName = country;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCountryName() { return countryName; }
    public void setCountryName(String countryName) { this.countryName = countryName; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getIsd() { return isd; }
    public void setIsd(String isd) { this.isd = isd; }
    public Integer getPhoneMinLength() { return phoneMinLength; }
    public void setPhoneMinLength(Integer phoneMinLength) { this.phoneMinLength = phoneMinLength; }
    public Integer getPhoneMaxLength() { return phoneMaxLength; }
    public void setPhoneMaxLength(Integer phoneMaxLength) { this.phoneMaxLength = phoneMaxLength; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public java.time.LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(java.time.LocalDateTime createdDate) { this.createdDate = createdDate; }
}

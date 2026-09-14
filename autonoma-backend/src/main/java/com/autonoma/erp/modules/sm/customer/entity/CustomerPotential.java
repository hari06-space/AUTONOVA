package com.autonoma.erp.modules.sm.customer.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "SLS_CUSTOMER_POTENTIAL")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerPotential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CUSTOMER_GROUP_NAME", length = 200)
    private String customerGroupName;

    @Column(name = "CUSTOMER_CODE", nullable = false, length = 50)
    private String customerCode;

    @Column(name = "CUSTOMER_TYPE", length = 50)
    private String customerType;

    @Column(name = "MANUFACTURER_OEM", length = 100)
    private String manufacturerOem;

    @Column(name = "WTG_MODEL", length = 100)
    private String wtgModel;

    @Column(name = "WIND_TURBINE_POWER", length = 100)
    private String windTurbinePower;

    @Column(name = "WIND_FARM_NAME", length = 100)
    private String windFarmName;

    @Column(name = "AREA", length = 200)
    private String area;

    @Column(name = "PINCODE", length = 20)
    private String pincode;

    @Column(name = "STATE", length = 100)
    private String state;

    @Column(name = "COUNTRY", length = 100)
    private String country;

    @Column(name = "DEVELOPER", length = 200)
    private String developer;

    @Column(name = "PLANT_MW")
    private Double plantMw;

    @Column(name = "TURBINE_COUNT")
    private Integer turbineCount;

    @Column(name = "HUB", length = 100)
    private String hub;

    @Column(name = "OPERATIONAL_STATUS", length = 100)
    private String operationalStatus;

    @Column(name = "COMMISSIONING_YEAR", length = 20)
    private String commissioningYear;

    @Column(name = "COMMISSIONING_MONTH", length = 20)
    private String commissioningMonth;

    @Column(name = "LATITUDE")
    private Double latitude;

    @Column(name = "LONGITUDE")
    private Double longitude;

    @Column(name = "STATUS")
    @Builder.Default
    private String status = "Active";

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

    @Column(name = "IS_ACTIVE")
    @Builder.Default
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.createdBy = currentUserId;
        this.updatedBy = null;

        createdDate = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;

        this.updatedDate = new Date();

    }

    // Backward-compatible aliases
    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public Date getCreatedAt() {
        return this.createdDate;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdDate = createdAt;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedAt")
    public Date getUpdatedAt() {
        return this.updatedDate;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedDate = updatedAt;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("createdUser")
    public String getCreatedUser() {
        return this.createdBy;
    }

    public void setCreatedUser(String createdUser) {
        this.createdBy = createdUser;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("updatedUser")
    public String getUpdatedUser() {
        return this.updatedBy;
    }

    public void setUpdatedUser(String updatedUser) {
        this.updatedBy = updatedUser;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCustomerGroupName() { return customerGroupName; }
    public void setCustomerGroupName(String customerGroupName) { this.customerGroupName = customerGroupName; }
    public String getCustomerCode() { return customerCode; }
    public void setCustomerCode(String customerCode) { this.customerCode = customerCode; }
    public String getCustomerType() { return customerType; }
    public void setCustomerType(String customerType) { this.customerType = customerType; }
    public String getManufacturerOem() { return manufacturerOem; }
    public void setManufacturerOem(String manufacturerOem) { this.manufacturerOem = manufacturerOem; }
    public String getWtgModel() { return wtgModel; }
    public void setWtgModel(String wtgModel) { this.wtgModel = wtgModel; }
    public String getWindTurbinePower() { return windTurbinePower; }
    public void setWindTurbinePower(String windTurbinePower) { this.windTurbinePower = windTurbinePower; }
    public String getWindFarmName() { return windFarmName; }
    public void setWindFarmName(String windFarmName) { this.windFarmName = windFarmName; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getDeveloper() { return developer; }
    public void setDeveloper(String developer) { this.developer = developer; }
    public Double getPlantMw() { return plantMw; }
    public void setPlantMw(Double plantMw) { this.plantMw = plantMw; }
    public Integer getTurbineCount() { return turbineCount; }
    public void setTurbineCount(Integer turbineCount) { this.turbineCount = turbineCount; }
    public String getHub() { return hub; }
    public void setHub(String hub) { this.hub = hub; }
    public String getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(String operationalStatus) { this.operationalStatus = operationalStatus; }
    public String getCommissioningYear() { return commissioningYear; }
    public void setCommissioningYear(String commissioningYear) { this.commissioningYear = commissioningYear; }
    public String getCommissioningMonth() { return commissioningMonth; }
    public void setCommissioningMonth(String commissioningMonth) { this.commissioningMonth = commissioningMonth; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

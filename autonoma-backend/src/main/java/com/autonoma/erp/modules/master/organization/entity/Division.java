package com.autonoma.erp.modules.master.organization.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * Division Master — stored in the MASTER (AUTONOMA) database.
 * Each division belongs to a CompanyCredential (company), identified by
 * companyId (FK → ad_company_credential.id).
 *
 * Divisional transactions in tenant databases reference the division_id
 * via the BaseDivisionTenantEntity filter.
 */
@Entity
@Table(name = "AD_DIVISION")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Division {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    public Long getId() {
        return id;
    }

    /**
     * FK to ad_company_credential — which company this division belongs to.
     * NOT a JPA join; kept as plain Long to avoid cross-DB FK constraints.
     */
    @Column(name = "COMPANY_ID", nullable = false)
    private Long companyId;

    /**
     * Company name — NOT persisted; fetched at query-time from
     * ad_company_credential.
     * Populated by DivisionService before returning to the API caller.
     */
    @Transient
    private String companyName;

    @Column(name = "DIVISION_NAME", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String divisionName;

    public String getDivisionName() {
        return divisionName;
    }

    public void setDivisionName(String divisionName) {
        this.divisionName = divisionName;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Object status) {
        if (status instanceof Boolean)
            this.status = (Boolean) status;
        else if (status instanceof String)
            this.status = "Active".equalsIgnoreCase((String) status) || "1".equals(status)
                    || "true".equalsIgnoreCase((String) status);
    }

    public Boolean getIsActive() {
        return status;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String getGstIn() {
        return gstIn;
    }

    public void setGstIn(String gstIn) {
        this.gstIn = gstIn;
    }

    public Integer getStateCode() {
        return stateCode;
    }

    public void setStateCode(Integer stateCode) {
        this.stateCode = stateCode;
    }

    public Integer getSequenceNo() {
        return sequenceNo;
    }

    public void setSequenceNo(Integer sequenceNo) {
        this.sequenceNo = sequenceNo;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public void setCreatedDate(Date createdDate) {
    }

    public void setUpdatedBy(String updatedBy) {
    }

    public void setUpdatedDate(Date updatedDate) {
    }

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "ADDRESS", columnDefinition = "NVARCHAR(500)")
    private String address;

    @Column(name = "CITY", columnDefinition = "NVARCHAR(50)")
    private String city;

    @Column(name = "STATE", columnDefinition = "NVARCHAR(50)")
    private String state;

    @Column(name = "COUNTRY", columnDefinition = "NVARCHAR(50)")
    private String country;

    @Column(name = "PINCODE", columnDefinition = "NVARCHAR(10)")
    private String pincode;

    @Column(name = "GST_IN", columnDefinition = "NVARCHAR(15)")
    private String gstIn;

    @Column(name = "STATE_CODE")
    private Integer stateCode;

    @Column(name = "SEQUENCE_NO")
    private Integer sequenceNo = 0;

    @Column(name = "MOBILE_NO", length = 20)
    private String mobileNo;

    @Column(name = "PAN_NO", length = 50)
    private String panNo;

    @Column(name = "PF_NO", length = 50)
    private String pfNo;

    @Column(name = "ESI_NO", length = 50)
    private String esiNo;

    @Column(name = "IE_CODE", length = 50)
    private String ieCode;

    @Column(name = "CIN_NO", length = 50)
    private String cinNo;

    @Column(name = "EMAIL_ID", length = 100)
    private String emailId;

    @Column(name = "WEBSITE", length = 100)
    private String website;

    @Column(name = "EWAYBILL_USER_NAME", length = 100)
    private String ewaybillUserName;

    @Column(name = "EWAYBILL_PASSWORD", length = 100)
    private String ewaybillPassword;

    @Column(name = "GST_USER_NAME", length = 100)
    private String gstUserName;

    @Column(name = "EINVOICE_USER_NAME", length = 100)
    private String einvoiceUserName;

    @Column(name = "EINVOICE_PASSWORD", length = 100)
    private String einvoicePassword;

    @Column(name = "MAP_LINK", length = 1000)
    private String mapLink;

    @Column(name = "LATITUDE", length = 50)
    private String latitude;

    @Column(name = "LONGITUDE", length = 50)
    private String longitude;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true; // true = 1 = Active, false = 0 = Inactive

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

        updatedDate = new Date();

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

    public String getMapLink() { return mapLink; }
    public void setMapLink(String mapLink) { this.mapLink = mapLink; }
    public String getLatitude() { return latitude; }
    public void setLatitude(String latitude) { this.latitude = latitude; }
    public String getLongitude() { return longitude; }
    public void setLongitude(String longitude) { this.longitude = longitude; }

    public String getPfNo() { return pfNo; }
    public void setPfNo(String pfNo) { this.pfNo = pfNo; }
    public String getEsiNo() { return esiNo; }
    public void setEsiNo(String esiNo) { this.esiNo = esiNo; }
    public String getIeCode() { return ieCode; }
    public void setIeCode(String ieCode) { this.ieCode = ieCode; }
    public String getCinNo() { return cinNo; }
    public void setCinNo(String cinNo) { this.cinNo = cinNo; }
    public String getEmailId() { return emailId; }
    public void setEmailId(String emailId) { this.emailId = emailId; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getEwaybillUserName() { return ewaybillUserName; }
    public void setEwaybillUserName(String ewaybillUserName) { this.ewaybillUserName = ewaybillUserName; }
    public String getEwaybillPassword() { return ewaybillPassword; }
    public void setEwaybillPassword(String ewaybillPassword) { this.ewaybillPassword = ewaybillPassword; }
    public String getGstUserName() { return gstUserName; }
    public void setGstUserName(String gstUserName) { this.gstUserName = gstUserName; }
    public String getEinvoiceUserName() { return einvoiceUserName; }
    public void setEinvoiceUserName(String einvoiceUserName) { this.einvoiceUserName = einvoiceUserName; }
    public String getMobileNo() { return mobileNo; }
    public void setMobileNo(String mobileNo) { this.mobileNo = mobileNo; }
    public String getPanNo() { return panNo; }
    public void setPanNo(String panNo) { this.panNo = panNo; }

    public String getEinvoicePassword() { return einvoicePassword; }
    public void setEinvoicePassword(String einvoicePassword) { this.einvoicePassword = einvoicePassword; }
}

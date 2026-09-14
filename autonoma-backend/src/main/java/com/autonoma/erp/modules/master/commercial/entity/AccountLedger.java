package com.autonoma.erp.modules.master.commercial.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Data
@Entity
@Table(name = "FA_ACCOUNT_LEDGER")
public class AccountLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Boolean getIsActive() { return isActive != null ? isActive : true; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedDate() { return createdDate; }

    @Column(name = "CODE", length = 20, unique = true)
    private String code;

    @Column(name = "LEDGER_NAME", length = 100, unique = true, nullable = false)
    private String ledgerName;

    public String getLedgerName() { return ledgerName; }

    @Column(name = "SHORT_NAME", length = 20, unique = true, nullable = false)
    private String shortName;

    @Column(name = "PRINT_NAME", length = 150)
    private String printName;

    @Column(name = "DESCRIPTION", length = 200)
    private String description;

    @Column(name = "ADDRESS", length = 300)
    private String address;

    @Column(name = "CITY", length = 50)
    private String city;

    @Column(name = "STATE", length = 50)
    private String state;

    @Column(name = "COUNTRY", length = 50)
    private String country;

    @Column(name = "PIN_CODE", length = 20)
    private String pinCode;

    @Column(name = "STATE_CODE")
    private Integer stateCode;

    @Column(name = "LOCATION", length = 100)
    private String location;

    @Column(name = "DISTANCE")
    private Integer distance;

    @Column(name = "LATITUDE", length = 25)
    private String latitude;

    @Column(name = "LONGITUDE", length = 25)
    private String longitude;

    @Column(name = "MOBILE_NO", length = 15)
    private String mobileNo;

    @Column(name = "MAIL_ID", length = 50)
    private String mailId;

    @Column(name = "IS_CUSTOMER")
    private Boolean isCustomer;

    @Column(name = "IS_SUPPLIER")
    private Boolean isSupplier;

    @Column(name = "CATEGORY", length = 100)
    private String category;

    @Column(name = "LEDGER_TYPE", length = 25)
    private String ledgerType;

    @Column(name = "GROUP_ID")
    private Long groupId;

    @Column(name = "SALES_LEDGER_ID")
    private Long salesLedgerId;

    @Column(name = "PURCHASE_LEDGER_ID")
    private Long purchaseLedgerId;

    @Column(name = "GSTIN", length = 20)
    private String gstin;

    @Column(name = "PAN_NO", length = 20)
    private String panNo;

    @Column(name = "SEGMENT", length = 50)
    private String segment;

    @Column(name = "SUB_SEGMENT", length = 50)
    private String subSegment;

    @Column(name = "DOMAIN_NAME", length = 50)
    private String domainName;

    @Column(name = "REGISTER_NO", length = 20)
    private String registerNo;

    @Column(name = "CIN_NO", length = 20)
    private String cinNo;

    @Column(name = "ISO_NUMBER", length = 20)
    private String isoNumber;

    @Column(name = "WEBSITE", length = 50)
    private String website;

    @Column(name = "CURRENCY_CODE", length = 50)
    private String currencyCode;

    @Column(name = "DISPATCH_MODE", length = 50)
    private String dispatchMode;

    @Column(name = "PAYMENT_TERMS", length = 50)
    private String paymentTerms;

    @Column(name = "DELIVERY_TERMS", length = 50)
    private String deliveryTerms;

    @Column(name = "ISO_EXPIRY_DATE")
    private LocalDate isoExpiryDate;

    @Column(name = "NDA_REQUIRED")
    private Boolean ndaRequired;

    @Column(name = "NEGOTIATE_REQUIRED")
    private Boolean negotiateRequired;

    @Column(name = "DAILY_MAIL_REQUIRED")
    private Boolean dailyMailRequired;

    @Column(name = "LD_APPLICABLE")
    private Boolean ldApplicable;

    @Column(name = "PRIME_VENDOR")
    private Boolean primeVendor;

    @Column(name = "FRIEIGHT_APPLICABLE")
    private Boolean frieightApplicable;

    @Column(name = "IS_SERVICE_LEDGER")
    private Boolean isServiceLedger;

    @Column(name = "SERVICE_LEDGER_ID")
    private Long serviceLedgerId;

    @Column(name = "MSME_REQ")
    private Boolean msmeReq;

    @Column(name = "MSME_NO", length = 20)
    private String msmeNo;

    @Column(name = "INDUSTRY_TYPE", length = 20)
    private String industryType;

    @Column(name = "VENDOR_CODE", length = 20)
    private String vendorCode;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<CustomerEmailMapping> emailMappings = new ArrayList<>();

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<CustomerDomainMapping> domainMappings = new ArrayList<>();

    @Column(name = "IS_FINANCE")
    private Boolean isFinance;

    @Column(name = "LABOUR_SALES_ID")
    private Long labourSalesId;

    @Column(name = "BANK_AC_NO", length = 50)
    private String bankAcNo;

    @Column(name = "BANK_AC_NAME", length = 50)
    private String bankAcName;

    @Column(name = "BANK_NAME", length = 50)
    private String bankName;

    @Column(name = "BRANCH_NAME", length = 50)
    private String branchName;

    @Column(name = "IFSC_CODE", length = 50)
    private String ifscCode;

    @Column(name = "OFFICE_NO", length = 50)
    private String officeNo;

    @Column(name = "FAX_NO", length = 50)
    private String faxNo;

    @Column(name = "TCS_APPLICABLE")
    private Boolean tcsApplicable;

    @Column(name = "TCS_LEDGER_ID")
    private Long tcsLedgerId;

    @Column(name = "TDS_LEDGER_ID")
    private Long tdsLedgerId;

    @Column(name = "ITC_ELIGIBLE")
    private Boolean itcEligible;

    @Column(name = "TAX_TYPE", length = 50)
    private String taxType;

    @Column(name = "TAX_PERCENTAGE", precision = 10, scale = 2)
    private java.math.BigDecimal taxPercentage;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Column(name = "CREATED_BY", length = 50, nullable = false)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    private LocalDateTime createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;

    @PrePersist
    public void prePersist() {
        if (createdDate == null) {
            createdDate = LocalDateTime.now();
        }
        if (createdBy == null) {
            try {
                createdBy = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }
            if (createdBy == null)
                createdBy = "SYSTEM";
        }
        this.updatedBy = null;
        this.updatedDate = null;
        updateLedgerType();
    }

    @PreUpdate
    public void preUpdate() {
        updatedDate = LocalDateTime.now();
        try {
            updatedBy = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        updateLedgerType();
    }

    private void updateLedgerType() {
        if (Boolean.TRUE.equals(isCustomer)) {
            this.ledgerType = "CUSTOMER";
        } else if (Boolean.TRUE.equals(isSupplier)) {
            this.ledgerType = "SUPPLIER";
        } else if (Boolean.TRUE.equals(isFinance)
                && (taxType != null && !taxType.trim().isEmpty() || taxPercentage != null)) {
            this.ledgerType = "TAX";
        } else if (Boolean.TRUE.equals(isFinance)) {
            this.ledgerType = "FINANCE";
        }
    }

    // =========================================================================
    // BACKWARD COMPATIBILITY ALIASES (For existing Vendor and Customer UI)
    // =========================================================================

    public String getLedgerCode() {
        return this.code;
    }

    public void setLedgerCode(String code) {
        this.code = code;
    }

    // Customer Name / Vendor Name -> Ledger Name
    @JsonProperty("customerName")
    public void setCustomerName(String name) {
        this.ledgerName = name;
    }

    public String getCustomerName() {
        return this.ledgerName;
    }

    @JsonProperty("vendorName")
    public void setVendorName(String name) {
        this.ledgerName = name;
    }

    public String getVendorName() {
        return this.ledgerName;
    }

    // Customer Code / Vendor Code -> Code
    @JsonProperty("customerCode")
    public void setCustomerCode(String code) {
        this.code = code;
    }

    public String getCustomerCode() {
        return this.code;
    }

    @JsonProperty("referenceCode")
    public void setReferenceCode(String code) {
        this.code = code;
    }

    public String getReferenceCode() {
        return this.code;
    }

    // Customer Print Name -> Print Name
    @JsonProperty("customerPrintName")
    public void setCustomerPrintName(String name) {
        this.printName = name;
    }

    public String getCustomerPrintName() {
        return this.printName;
    }

    // Currency -> Currency Code
    @JsonProperty("currency")
    public void setCurrency(String c) {
        this.currencyCode = c;
    }

    public String getCurrency() {
        return this.currencyCode;
    }

    // Freight -> Freight Applicable
    @JsonProperty("freight")
    public void setFreight(String f) {
        this.frieightApplicable = "Yes".equalsIgnoreCase(f) || "true".equalsIgnoreCase(f);
    }

    public String getFreight() {
        return (this.frieightApplicable != null && this.frieightApplicable) ? "Yes" : "No";
    }

    // Negotiate Customer -> Negotiate Required
    @JsonProperty("negotiateCustomer")
    public void setNegotiateCustomer(String f) {
        this.negotiateRequired = "Yes".equalsIgnoreCase(f) || "true".equalsIgnoreCase(f);
    }

    public String getNegotiateCustomer() {
        return (this.negotiateRequired != null && this.negotiateRequired) ? "Yes" : "No";
    }

    // Prime Customer -> Prime Vendor
    @JsonProperty("primeCustomer")
    public void setPrimeCustomer(String f) {
        this.primeVendor = "Yes".equalsIgnoreCase(f) || "true".equalsIgnoreCase(f);
    }

    public String getPrimeCustomer() {
        return (this.primeVendor != null && this.primeVendor) ? "Yes" : "No";
    }

    // NDA Required String -> Boolean
    @JsonProperty("ndaRequiredString")
    public void setNdaRequiredString(String f) {
        this.ndaRequired = "Yes".equalsIgnoreCase(f) || "true".equalsIgnoreCase(f);
    }

    public String getNdaRequiredString() {
        return (this.ndaRequired != null && this.ndaRequired) ? "Yes" : "No";
    }

    // LD Applicable String -> Boolean
    @JsonProperty("ldApplicableString")
    public void setLdApplicableString(String f) {
        this.ldApplicable = "Yes".equalsIgnoreCase(f) || "true".equalsIgnoreCase(f);
    }

    public String getLdApplicableString() {
        return (this.ldApplicable != null && this.ldApplicable) ? "Yes" : "No";
    }

    public Boolean getIsCustomer() { return isCustomer; }
    public void setIsCustomer(Boolean isCustomer) { this.isCustomer = isCustomer; }
    public Boolean getIsSupplier() { return isSupplier; }
    public void setIsSupplier(Boolean isSupplier) { this.isSupplier = isSupplier; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(LocalDateTime updatedDate) { this.updatedDate = updatedDate; }
    public String getPrintName() { return printName; }
    public void setPrintName(String printName) { this.printName = printName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Long getGroupId() { return groupId; }
    public void setGroupId(Long groupId) { this.groupId = groupId; }
    public String getLedgerType() { return ledgerType; }
    public void setLedgerType(String ledgerType) { this.ledgerType = ledgerType; }
    public void setLedgerName(String ledgerName) { this.ledgerName = ledgerName; }
    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }
    public String getTaxType() { return taxType; }
    public void setTaxType(String taxType) { this.taxType = taxType; }
    public java.math.BigDecimal getTaxPercentage() { return taxPercentage; }
    public void setTaxPercentage(java.math.BigDecimal taxPercentage) { this.taxPercentage = taxPercentage; }
    public String getSegment() { return segment; }
    public void setSegment(String segment) { this.segment = segment; }
    public String getSubSegment() { return subSegment; }
    public void setSubSegment(String subSegment) { this.subSegment = subSegment; }
    public String getDomainName() { return domainName; }
    public void setDomainName(String domainName) { this.domainName = domainName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
    public String getPanNo() { return panNo; }
    public void setPanNo(String panNo) { this.panNo = panNo; }
    public Integer getStateCode() { return stateCode; }
    public void setStateCode(Integer stateCode) { this.stateCode = stateCode; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getRegisterNo() { return registerNo; }
    public void setRegisterNo(String registerNo) { this.registerNo = registerNo; }
    public String getCinNo() { return cinNo; }
    public void setCinNo(String cinNo) { this.cinNo = cinNo; }
    public String getIsoNumber() { return isoNumber; }
    public void setIsoNumber(String isoNumber) { this.isoNumber = isoNumber; }
    public LocalDate getIsoExpiryDate() { return isoExpiryDate; }
    public void setIsoExpiryDate(LocalDate isoExpiryDate) { this.isoExpiryDate = isoExpiryDate; }
    public Integer getDistance() { return distance; }
    public void setDistance(Integer distance) { this.distance = distance; }
    public String getLatitude() { return latitude; }
    public void setLatitude(String latitude) { this.latitude = latitude; }
    public String getLongitude() { return longitude; }
    public void setLongitude(String longitude) { this.longitude = longitude; }
    public String getMobileNo() { return mobileNo; }
    public void setMobileNo(String mobileNo) { this.mobileNo = mobileNo; }
    public String getMailId() { return mailId; }
    public void setMailId(String mailId) { this.mailId = mailId; }
    public String getEmail() { return mailId; }
    public String getEmailId() { return mailId; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public String getDispatchMode() { return dispatchMode; }
    public void setDispatchMode(String dispatchMode) { this.dispatchMode = dispatchMode; }
    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
    public String getDeliveryTerms() { return deliveryTerms; }
    public void setDeliveryTerms(String deliveryTerms) { this.deliveryTerms = deliveryTerms; }
    public Boolean getNdaRequired() { return ndaRequired; }
    public void setNdaRequired(Boolean ndaRequired) { this.ndaRequired = ndaRequired; }
    public Boolean getNegotiateRequired() { return negotiateRequired; }
    public void setNegotiateRequired(Boolean negotiateRequired) { this.negotiateRequired = negotiateRequired; }
    public Boolean getDailyMailRequired() { return dailyMailRequired; }
    public void setDailyMailRequired(Boolean dailyMailRequired) { this.dailyMailRequired = dailyMailRequired; }
    public Boolean getLdApplicable() { return ldApplicable; }
    public void setLdApplicable(Boolean ldApplicable) { this.ldApplicable = ldApplicable; }
    public Boolean getPrimeVendor() { return primeVendor; }
    public void setPrimeVendor(Boolean primeVendor) { this.primeVendor = primeVendor; }
    public Boolean getFrieightApplicable() { return frieightApplicable; }
    public void setFrieightApplicable(Boolean frieightApplicable) { this.frieightApplicable = frieightApplicable; }
    public Boolean getMsmeReq() { return msmeReq; }
    public void setMsmeReq(Boolean msmeReq) { this.msmeReq = msmeReq; }
    public String getMsmeNo() { return msmeNo; }
    public void setMsmeNo(String msmeNo) { this.msmeNo = msmeNo; }
    public String getIndustryType() { return industryType; }
    public void setIndustryType(String industryType) { this.industryType = industryType; }
    public String getVendorCode() { return vendorCode; }
    public void setVendorCode(String vendorCode) { this.vendorCode = vendorCode; }
    public String getBankAcNo() { return bankAcNo; }
    public void setBankAcNo(String bankAcNo) { this.bankAcNo = bankAcNo; }
    public String getBankAcName() { return bankAcName; }
    public void setBankAcName(String bankAcName) { this.bankAcName = bankAcName; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Long getSalesLedgerId() { return salesLedgerId; }
    public void setSalesLedgerId(Long salesLedgerId) { this.salesLedgerId = salesLedgerId; }
    public Long getPurchaseLedgerId() { return purchaseLedgerId; }
    public void setPurchaseLedgerId(Long purchaseLedgerId) { this.purchaseLedgerId = purchaseLedgerId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public List<CustomerEmailMapping> getEmailMappings() { return emailMappings; }
    public void setEmailMappings(List<CustomerEmailMapping> emailMappings) { this.emailMappings = emailMappings; }

    public List<CustomerDomainMapping> getDomainMappings() { return domainMappings; }
    public void setDomainMappings(List<CustomerDomainMapping> domainMappings) { this.domainMappings = domainMappings; }
}

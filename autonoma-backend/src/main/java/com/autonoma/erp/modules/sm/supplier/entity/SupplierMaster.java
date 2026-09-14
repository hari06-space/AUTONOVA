package com.autonoma.erp.modules.sm.supplier.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "VND_VENDOR")
@Data
public class SupplierMaster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SUPPLIER_CODE", length = 50, unique = true)
    private String supplierCode;

    @Column(name = "GST_NO", length = 50)
    private String gstNo;

    @Column(name = "SUPPLIER_NAME", length = 200)
    private String supplierName;

    public Long getId() { return id; }
    public String getSupplierName() { return supplierName; }
    public String getSupplierCode() { return supplierCode; }

    @Column(name = "LEDGER_NAME", length = 200)
    private String ledgerName;

    @Column(name = "SHORT_NAME", length = 50)
    private String shortName;

    @Column(name = "SUPPLIER_PRINT_NAME", length = 200)
    private String supplierPrintName;

    @Column(name = "ADDRESS", length = 500)
    private String address;

    @Column(name = "CITY", length = 100)
    private String city;

    @Column(name = "STATE", length = 100)
    private String state;

    @Column(name = "COUNTRY", length = 100)
    private String country;

    @Column(name = "PINCODE", length = 20)
    private String pincode;

    @Column(name = "MOBILE_NO", length = 20)
    private String mobileNo;

    @Column(name = "CONTACT_PERSON", length = 100)
    private String contactPerson;

    @Column(name = "EMAIL_ID", length = 100)
    private String emailId;

    @Column(name = "WEBSITE", length = 100)
    private String website;

    @Column(name = "PAN_NO", length = 50)
    private String panNo;

    @Column(name = "PAN_FILE_INFO", length = 1000)
    private String panFileInfo;

    @Column(name = "MSME_NO", length = 50)
    private String msmeNo;

    @Column(name = "MSME_FILE_INFO", length = 1000)
    private String msmeFileInfo;

    @Column(name = "ISO_NO", length = 50)
    private String isoNo;

    @Column(name = "ISO_FILE_INFO", length = 1000)
    private String isoFileInfo;

    @Column(name = "ISO_EXPIRY_DATE")
    private String isoExpiryDate;

    @Column(name = "APPROVED_SUPPLIER", length = 10)
    private String approvedSupplier;

    @Column(name = "NDA_REQUIRED", length = 10)
    private String ndaRequired;

    @Column(name = "DELIVERY_TERMS", length = 100)
    private String deliveryTerms;

    @Column(name = "TYPE_OF_SERVICE", length = 100)
    private String typeOfService;

    @Column(name = "PAYMENT_TERMS", length = 100)
    private String paymentTerms;

    @Column(name = "PRIME_SUPPLIER", length = 10)
    private String primeSupplier;

    @Column(name = "FREIGHT_REQUIRED", length = 10)
    private String freightRequired;

    @Column(name = "CURRENCY", length = 20)
    private String currency;

    @Column(name = "DUE_DAYS")
    private String dueDays;

    @Column(name = "IS_AUDITOR_CONSULTANT", length = 10)
    private String isAuditorConsultant;

    @Column(name = "ACCOUNT_NO", length = 50)
    private String accountNo;

    @Column(name = "ACCOUNT_NAME", length = 100)
    private String accountName;

    @Column(name = "BANK_NAME", length = 100)
    private String bankName;

    @Column(name = "BRANCH_NAME", length = 100)
    private String branchName;

    @Column(name = "IFSC_CODE", length = 50)
    private String ifscCode;

    @Column(name = "SWIFT_CODE", length = 50)
    private String swiftCode;

    @Column(name = "ACCOUNT_TYPE", length = 50)
    private String accountType;

    @Column(name = "STATUS", length = 20)
    private String status;

    @Column(name = "UPLOAD_FILES", length = 1000)
    private String uploadFiles;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    private LocalDateTime createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;

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

        createdDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        this.updatedDate = LocalDateTime.now();

    }

    public void setId(Long id) { this.id = id; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public void setSupplierCode(String supplierCode) { this.supplierCode = supplierCode; }
    public String getGstNo() { return gstNo; }
    public void setGstNo(String gstNo) { this.gstNo = gstNo; }
    public String getLedgerName() { return ledgerName; }
    public void setLedgerName(String ledgerName) { this.ledgerName = ledgerName; }
    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }
    public String getSupplierPrintName() { return supplierPrintName; }
    public void setSupplierPrintName(String supplierPrintName) { this.supplierPrintName = supplierPrintName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getMobileNo() { return mobileNo; }
    public void setMobileNo(String mobileNo) { this.mobileNo = mobileNo; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getEmailId() { return emailId; }
    public void setEmailId(String emailId) { this.emailId = emailId; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getPanNo() { return panNo; }
    public void setPanNo(String panNo) { this.panNo = panNo; }
    public String getPanFileInfo() { return panFileInfo; }
    public void setPanFileInfo(String panFileInfo) { this.panFileInfo = panFileInfo; }
    public String getMsmeNo() { return msmeNo; }
    public void setMsmeNo(String msmeNo) { this.msmeNo = msmeNo; }
    public String getMsmeFileInfo() { return msmeFileInfo; }
    public void setMsmeFileInfo(String msmeFileInfo) { this.msmeFileInfo = msmeFileInfo; }
    public String getIsoNo() { return isoNo; }
    public void setIsoNo(String isoNo) { this.isoNo = isoNo; }
    public String getIsoFileInfo() { return isoFileInfo; }
    public void setIsoFileInfo(String isoFileInfo) { this.isoFileInfo = isoFileInfo; }
    public String getIsoExpiryDate() { return isoExpiryDate; }
    public void setIsoExpiryDate(String isoExpiryDate) { this.isoExpiryDate = isoExpiryDate; }
    public String getApprovedSupplier() { return approvedSupplier; }
    public void setApprovedSupplier(String approvedSupplier) { this.approvedSupplier = approvedSupplier; }
    public String getNdaRequired() { return ndaRequired; }
    public void setNdaRequired(String ndaRequired) { this.ndaRequired = ndaRequired; }
    public String getDeliveryTerms() { return deliveryTerms; }
    public void setDeliveryTerms(String deliveryTerms) { this.deliveryTerms = deliveryTerms; }
    public String getTypeOfService() { return typeOfService; }
    public void setTypeOfService(String typeOfService) { this.typeOfService = typeOfService; }
    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
    public String getPrimeSupplier() { return primeSupplier; }
    public void setPrimeSupplier(String primeSupplier) { this.primeSupplier = primeSupplier; }
    public String getFreightRequired() { return freightRequired; }
    public void setFreightRequired(String freightRequired) { this.freightRequired = freightRequired; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getDueDays() { return dueDays; }
    public void setDueDays(String dueDays) { this.dueDays = dueDays; }
    public String getIsAuditorConsultant() { return isAuditorConsultant; }
    public void setIsAuditorConsultant(String isAuditorConsultant) { this.isAuditorConsultant = isAuditorConsultant; }
    public String getAccountNo() { return accountNo; }
    public void setAccountNo(String accountNo) { this.accountNo = accountNo; }
    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
    public String getSwiftCode() { return swiftCode; }
    public void setSwiftCode(String swiftCode) { this.swiftCode = swiftCode; }
    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getUploadFiles() { return uploadFiles; }
    public void setUploadFiles(String uploadFiles) { this.uploadFiles = uploadFiles; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(LocalDateTime updatedDate) { this.updatedDate = updatedDate; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

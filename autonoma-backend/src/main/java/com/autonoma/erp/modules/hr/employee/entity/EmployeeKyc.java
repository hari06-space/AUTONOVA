package com.autonoma.erp.modules.hr.employee.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_KYC")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeKyc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @Column(name = "PF_NUMBER", length = 100)
    private String pfNumber;

    @Column(name = "UAN_NUMBER", length = 100)
    private String uanNumber;

    @Column(name = "PAN_NUMBER", length = 20)
    private String panNumber;

    @Column(name = "AADHAR_NUMBER", length = 20)
    private String aadharNumber;

    @Column(name = "DRIVING_LICENSE_NUMBER", length = 50)
    private String drivingLicenseNumber;

    @Column(name = "LICENSE_EXPIRY_DATE")
    @Temporal(TemporalType.DATE)
    private Date licenseExpiryDate;

    @Column(name = "ELECTION_CARD_NUMBER", length = 50)
    private String electionCardNumber;

    @Column(name = "RATION_CARD_NUMBER", length = 50)
    private String rationCardNumber;

    @Column(name = "PERSONAL_ACCOUNT_NUMBER", length = 50)
    private String personalAccountNumber;

    @Column(name = "BANK_NAME", length = 100)
    private String bankName;

    @Column(name = "IFSC_CODE", length = 20)
    private String ifscCode;

    @Column(name = "PHYSICALLY_CHALLENGED", length = 10)
    private String physicallyChallenged;

    @Column(name = "PHYSICALLY_CHALLENGED_CATEGORY", length = 50)
    private String physicallyChallengedCategory;

    @Column(name = "INTERNATIONAL_WORKER", length = 10)
    private String internationalWorker;

    @Column(name = "PASSPORT_NUMBER", length = 50)
    private String passportNumber;

    @Column(name = "PASSPORT_EXPIRY_DATE")
    @Temporal(TemporalType.DATE)
    private Date passportExpiryDate;

    @Column(name = "IS_ACTIVE")
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

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
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
        if (this.createdBy != null && this.createdBy.trim().isEmpty()) {
            this.createdBy = null;
        }
        updatedDate = new Date();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getPfNumber() { return pfNumber; }
    public void setPfNumber(String pfNumber) { this.pfNumber = pfNumber; }
    public String getUanNumber() { return uanNumber; }
    public void setUanNumber(String uanNumber) { this.uanNumber = uanNumber; }
    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }
    public String getAadharNumber() { return aadharNumber; }
    public void setAadharNumber(String aadharNumber) { this.aadharNumber = aadharNumber; }
    public String getDrivingLicenseNumber() { return drivingLicenseNumber; }
    public void setDrivingLicenseNumber(String drivingLicenseNumber) { this.drivingLicenseNumber = drivingLicenseNumber; }
    public Date getLicenseExpiryDate() { return licenseExpiryDate; }
    public void setLicenseExpiryDate(Date licenseExpiryDate) { this.licenseExpiryDate = licenseExpiryDate; }
    public String getElectionCardNumber() { return electionCardNumber; }
    public void setElectionCardNumber(String electionCardNumber) { this.electionCardNumber = electionCardNumber; }
    public String getRationCardNumber() { return rationCardNumber; }
    public void setRationCardNumber(String rationCardNumber) { this.rationCardNumber = rationCardNumber; }
    public String getPersonalAccountNumber() { return personalAccountNumber; }
    public void setPersonalAccountNumber(String personalAccountNumber) { this.personalAccountNumber = personalAccountNumber; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
    public String getPhysicallyChallenged() { return physicallyChallenged; }
    public void setPhysicallyChallenged(String physicallyChallenged) { this.physicallyChallenged = physicallyChallenged; }
    public String getPhysicallyChallengedCategory() { return physicallyChallengedCategory; }
    public void setPhysicallyChallengedCategory(String physicallyChallengedCategory) { this.physicallyChallengedCategory = physicallyChallengedCategory; }
    public String getInternationalWorker() { return internationalWorker; }
    public void setInternationalWorker(String internationalWorker) { this.internationalWorker = internationalWorker; }
    public String getPassportNumber() { return passportNumber; }
    public void setPassportNumber(String passportNumber) { this.passportNumber = passportNumber; }
    public Date getPassportExpiryDate() { return passportExpiryDate; }
    public void setPassportExpiryDate(Date passportExpiryDate) { this.passportExpiryDate = passportExpiryDate; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}


package com.autonoma.erp.modules.hr.employee.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_PERSONAL")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeePersonalDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @Column(name = "AGE")
    private Integer age;

    @Column(name = "GENDER", length = 20)
    private String gender;

    @Column(name = "BIRTH_DATE")
    @Temporal(TemporalType.DATE)
    private Date birthDate;

    @Column(name = "MARITAL_STATUS", length = 30)
    private String maritalStatus;

    @Column(name = "MARRIAGE_DATE")
    @Temporal(TemporalType.DATE)
    private Date marriageDate;

    @Column(name = "NUMBER_OF_CHILDREN")
    private Integer numberOfChildren;

    @Column(name = "PERSONAL_EMAIL", length = 255)
    private String personalEmail;

    @Column(name = "PASSPORT_NUMBER", length = 50)
    private String passportNumber;

    @Column(name = "PASSPORT_ISSUE_CITY", length = 100)
    private String passportIssueCity;

    @Column(name = "NATIONALITY", length = 100)
    private String nationality;

    @Column(name = "BLOOD_GROUP", length = 10)
    private String bloodGroup;

    @Column(name = "RELIGION", length = 50)
    private String religion;

    @Column(name = "REGION", length = 100)
    private String region;

    @Column(name = "HEIGHT", length = 20)
    private String height;

    @Column(name = "WEIGHT", length = 20)
    private String weight;

    @Column(name = "SHIRT_SIZE", length = 20)
    private String shirtSize;

    @Column(name = "PANT_SIZE", length = 20)
    private String pantSize;

    @Column(name = "SHOE_SIZE", length = 20)
    private String shoeSize;

    @Column(name = "INSURANCE_NUMBER", length = 100)
    private String insuranceNumber;

    @Column(name = "ESIC_NUMBER", length = 100)
    private String esicNumber;

    @Column(name = "PF_NUMBER", length = 100)
    private String pfNumber;

    @Column(name = "INSURANCE_EXPIRY_DATE")
    @Temporal(TemporalType.DATE)
    private Date insuranceExpiryDate;

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

    @Column(name = "COMPANY_ISSUED_MOBILE", length = 20)
    private String companyIssuedMobile;

    @Column(name = "MOBILE_DEDUCTION", precision = 10, scale = 2)
    private BigDecimal mobileDeduction;

    @Column(name = "CANTEEN_ALLOWANCE", precision = 10, scale = 2)
    private BigDecimal canteenAllowance;

    @Column(name = "LOAN_INSTALLMENT_MONTH", length = 50)
    @com.fasterxml.jackson.annotation.JsonProperty("loanInstallmentAmount")
    private String loanInstallmentMonth;

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
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
        }
        updatedDate = new Date();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Date getBirthDate() { return birthDate; }
    public void setBirthDate(Date birthDate) { this.birthDate = birthDate; }

    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }

    public Date getMarriageDate() { return marriageDate; }
    public void setMarriageDate(Date marriageDate) { this.marriageDate = marriageDate; }

    public Integer getNumberOfChildren() { return numberOfChildren; }
    public void setNumberOfChildren(Integer numberOfChildren) { this.numberOfChildren = numberOfChildren; }

    public String getPersonalEmail() { return personalEmail; }
    public void setPersonalEmail(String personalEmail) { this.personalEmail = personalEmail; }

    public String getPassportNumber() { return passportNumber; }
    public void setPassportNumber(String passportNumber) { this.passportNumber = passportNumber; }

    public String getPassportIssueCity() { return passportIssueCity; }
    public void setPassportIssueCity(String passportIssueCity) { this.passportIssueCity = passportIssueCity; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getReligion() { return religion; }
    public void setReligion(String religion) { this.religion = religion; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getHeight() { return height; }
    public void setHeight(String height) { this.height = height; }

    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }

    public String getShirtSize() { return shirtSize; }
    public void setShirtSize(String shirtSize) { this.shirtSize = shirtSize; }

    public String getPantSize() { return pantSize; }
    public void setPantSize(String pantSize) { this.pantSize = pantSize; }

    public String getShoeSize() { return shoeSize; }
    public void setShoeSize(String shoeSize) { this.shoeSize = shoeSize; }

    public String getInsuranceNumber() { return insuranceNumber; }
    public void setInsuranceNumber(String insuranceNumber) { this.insuranceNumber = insuranceNumber; }

    public String getEsicNumber() { return esicNumber; }
    public void setEsicNumber(String esicNumber) { this.esicNumber = esicNumber; }

    public String getPfNumber() { return pfNumber; }
    public void setPfNumber(String pfNumber) { this.pfNumber = pfNumber; }

    public Date getInsuranceExpiryDate() { return insuranceExpiryDate; }
    public void setInsuranceExpiryDate(Date insuranceExpiryDate) { this.insuranceExpiryDate = insuranceExpiryDate; }

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

    public String getCompanyIssuedMobile() { return companyIssuedMobile; }
    public void setCompanyIssuedMobile(String companyIssuedMobile) { this.companyIssuedMobile = companyIssuedMobile; }

    public BigDecimal getMobileDeduction() { return mobileDeduction; }
    public void setMobileDeduction(BigDecimal mobileDeduction) { this.mobileDeduction = mobileDeduction; }

    public BigDecimal getCanteenAllowance() { return canteenAllowance; }
    public void setCanteenAllowance(BigDecimal canteenAllowance) { this.canteenAllowance = canteenAllowance; }

    public String getLoanInstallmentMonth() { return loanInstallmentMonth; }
    public void setLoanInstallmentMonth(String loanInstallmentMonth) { this.loanInstallmentMonth = loanInstallmentMonth; }

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


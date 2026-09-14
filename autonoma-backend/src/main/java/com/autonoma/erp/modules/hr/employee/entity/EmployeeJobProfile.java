package com.autonoma.erp.modules.hr.employee.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_JOB_PROFILE")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeJobProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @Column(name = "WAGES_TYPE", length = 50)
    private String wagesType;

    @Column(name = "PAYMENT_MODE", length = 50)
    private String paymentMode;

    @Column(name = "SALARY_ACCOUNT_NUMBER", length = 50)
    private String salaryAccountNumber;

    @Column(name = "ACCOUNT_NAME", length = 100)
    private String accountName;

    @Column(name = "BANK_ACCOUNT_TYPE", length = 50)
    private String bankAccountType;

    @Column(name = "PERSONAL_ACCOUNT_NUMBER", length = 50)
    private String personalAccountNumber;

    @Column(name = "BANK_NAME", length = 100)
    private String bankName;

    @Column(name = "IFSC_CODE", length = 20)
    private String ifscCode;

    @Column(name = "BRANCH_NAME", length = 100)
    private String branchName;

    @Column(name = "OFFICE_EMAIL", length = 100)
    private String officeEmail;

    @Column(name = "OFFICIAL_PASSWORD", length = 100)
    private String officialPassword;

    @Column(name = "PROVIDENT_FUND", length = 10)
    private String providentFund = "NO";

    @Column(name = "ESI_ALLOWED", length = 10)
    private String esiAllowed = "NO";

    @Column(name = "PROFESSIONAL_TAX", length = 10)
    private String professionalTax = "NO";

    @Column(name = "LTA_ELIGIBLE", length = 10)
    private String ltaEligible = "NO";

    @Column(name = "LOSS_OF_MINUTES_DEDUCT", length = 10)
    private String lossOfMinutesDeduct = "NO";

    @Column(name = "PERMISSION_REQUEST", length = 10)
    private String permissionRequest = "NO";

    @Column(name = "LEAVE_ALLOWED", length = 10)
    private String leaveAllowed = "NO";

    @Column(name = "OD_ALLOWED", length = 10)
    private String odAllowed = "NO";

    @Column(name = "COMPANY_CONTACT1", length = 20)
    private String companyContact1;

    @Column(name = "COMPANY_CONTACT2", length = 20)
    private String companyContact2;

    @Column(name = "OVER_TIME_ALLOWED", length = 10)
    private String overTimeAllowed = "NO";

    @Column(name = "OVER_TIME_FACTORIAL", length = 20)
    private String overTimeFactorial;

    @Column(name = "OVER_TIME_RATE_PER_HOUR")
    private BigDecimal overTimeRatePerHour;

    @Column(name = "DYNAMIC_COMPONENTS", length = 4000)
    private String dynamicComponents;

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
        if (this.isActive == null) {
            this.isActive = true;
        }
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
        if (this.isActive == null) {
            this.isActive = true;
        }
        updatedDate = new Date();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getWagesType() { return wagesType; }
    public void setWagesType(String wagesType) { this.wagesType = wagesType; }

    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

    public String getSalaryAccountNumber() { return salaryAccountNumber; }
    public void setSalaryAccountNumber(String salaryAccountNumber) { this.salaryAccountNumber = salaryAccountNumber; }

    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }

    public String getBankAccountType() { return bankAccountType; }
    public void setBankAccountType(String bankAccountType) { this.bankAccountType = bankAccountType; }

    public String getPersonalAccountNumber() { return personalAccountNumber; }
    public void setPersonalAccountNumber(String personalAccountNumber) { this.personalAccountNumber = personalAccountNumber; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public String getOfficeEmail() { return officeEmail; }
    public void setOfficeEmail(String officeEmail) { this.officeEmail = officeEmail; }

    public String getOfficialPassword() { return officialPassword; }
    public void setOfficialPassword(String officialPassword) { this.officialPassword = officialPassword; }

    public String getDynamicComponents() { return dynamicComponents; }
    public void setDynamicComponents(String dynamicComponents) { this.dynamicComponents = dynamicComponents; }

    public String getCompanyContact1() { return companyContact1; }
    public void setCompanyContact1(String companyContact1) { this.companyContact1 = companyContact1; }

    public String getPermissionRequest() { return permissionRequest; }
    public void setPermissionRequest(String permissionRequest) { this.permissionRequest = permissionRequest; }

    public String getLeaveAllowed() { return leaveAllowed; }
    public void setLeaveAllowed(String leaveAllowed) { this.leaveAllowed = leaveAllowed; }

    public String getOdAllowed() { return odAllowed; }
    public void setOdAllowed(String odAllowed) { this.odAllowed = odAllowed; }

    public String getCompanyContact2() { return companyContact2; }
    public void setCompanyContact2(String companyContact2) { this.companyContact2 = companyContact2; }

    public String getOverTimeAllowed() { return overTimeAllowed; }
    public void setOverTimeAllowed(String overTimeAllowed) { this.overTimeAllowed = overTimeAllowed; }

    public String getOverTimeFactorial() { return overTimeFactorial; }
    public void setOverTimeFactorial(String overTimeFactorial) { this.overTimeFactorial = overTimeFactorial; }

    public BigDecimal getOverTimeRatePerHour() { return overTimeRatePerHour; }
    public void setOverTimeRatePerHour(BigDecimal overTimeRatePerHour) { this.overTimeRatePerHour = overTimeRatePerHour; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public String getProvidentFund() { return providentFund; }
    public void setProvidentFund(String providentFund) { this.providentFund = providentFund; }

    public String getEsiAllowed() { return esiAllowed; }
    public void setEsiAllowed(String esiAllowed) { this.esiAllowed = esiAllowed; }

    public String getProfessionalTax() { return professionalTax; }
    public void setProfessionalTax(String professionalTax) { this.professionalTax = professionalTax; }

    public String getLtaEligible() { return ltaEligible; }
    public void setLtaEligible(String ltaEligible) { this.ltaEligible = ltaEligible; }

    public String getLossOfMinutesDeduct() { return lossOfMinutesDeduct; }
    public void setLossOfMinutesDeduct(String lossOfMinutesDeduct) { this.lossOfMinutesDeduct = lossOfMinutesDeduct; }

    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}


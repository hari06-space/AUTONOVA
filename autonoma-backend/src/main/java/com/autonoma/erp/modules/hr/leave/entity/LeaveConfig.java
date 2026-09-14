package com.autonoma.erp.modules.hr.leave.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_LEAVE_CONFIG")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "LEAVE_TYPE", nullable = false, length = 100)
    private String leaveType;

    @Column(name = "LEAVE_CODE", length = 50)
    private String leaveCode;

    @Column(name = "LEAVE_NAME", length = 100)
    private String leaveName;

    @Column(name = "EMP_TYPE", nullable = false, length = 100)
    private String empType;

    @Column(name = "CONDITION", length = 255)
    private String condition;

    @Column(name = "CREDIT_VALUE", nullable = false)
    private Double creditValue = 1.0;

    @Column(name = "ANNUAL_QUOTA")
    private Double annualQuota = 0.0;

    @Column(name = "MONTHLY_CREDIT_RATE")
    private Double monthlyCreditRate = 0.0;

    @Column(name = "ACCRUAL_FREQUENCY", length = 50)
    private String accrualFrequency = "MONTHLY";

    @Column(name = "ALLOW_CARRY_FORWARD")
    private Boolean allowCarryForward = false;

    @Column(name = "MAX_CARRY_FORWARD_DAYS")
    private Double maxCarryForwardDays = 0.0;

    @Column(name = "CARRY_FORWARD_EXPIRY_MONTHS")
    private Integer carryForwardExpiryMonths = 12;

    @Column(name = "ALLOW_ENCASHMENT")
    private Boolean allowEncashment = false;

    @Column(name = "MIN_BALANCE_TO_RETAIN")
    private Double minBalanceToRetain = 0.0;

    @Column(name = "MAX_ENCASHABLE_DAYS")
    private Double maxEncashableDays = 0.0;

    @Column(name = "GENDER_ELIGIBILITY", length = 20)
    private String genderEligibility = "ALL";

    @Column(name = "PROBATION_ALLOWED")
    private Boolean probationAllowed = true;

    @Column(name = "MIN_SERVICE_MONTHS")
    private Integer minServiceMonths = 0;

    @Column(name = "SANDWICH_RULE_APPLIES")
    private Boolean sandwichRuleApplies = false;

    @Column(name = "INCLUDE_WEEKENDS")
    private Boolean includeWeekends = false;

    @Column(name = "INCLUDE_HOLIDAYS")
    private Boolean includeHolidays = false;

    @Column(name = "MAX_CONSECUTIVE_DAYS")
    private Integer maxConsecutiveDays = 30;

    @Column(name = "ALLOW_HALF_DAY")
    private Boolean allowHalfDay = true;

    @Column(name = "ALLOW_HOURLY")
    private Boolean allowHourly = false;

    @Column(name = "APPROVAL_LEVELS")
    private Integer approvalLevels = 1;

    @Column(name = "DOCUMENT_REQUIRED")
    private Boolean documentRequired = false;

    @Column(name = "DOCUMENT_THRESHOLD_DAYS")
    private Integer documentThresholdDays = 3;

    @Column(name = "AUTO_CREDIT_POLICY", length = 50)
    private String autoCreditPolicy = "WORKING_DAYS_20";

    @Column(name = "ALLOW_NEGATIVE_BALANCE")
    private Boolean allowNegativeBalance = false;

    @Column(name = "EFFECTIVE_FROM_DATE")
    @Temporal(TemporalType.DATE)
    private Date effectiveFromDate;

    @Column(name = "EFFECTIVE_TO_DATE")
    @Temporal(TemporalType.DATE)
    private Date effectiveToDate;

    @Column(name = "STATUS", nullable = false, length = 20)
    private String status = "ACTIVE";

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
        this.createdBy = currentUserId != null ? currentUserId : "SYSTEM";
        this.createdDate = new Date();
        if (this.status == null)
            this.status = "ACTIVE";
        if (this.leaveCode == null || this.leaveCode.trim().isEmpty())
            this.leaveCode = this.leaveType;
        if (this.leaveName == null || this.leaveName.trim().isEmpty())
            this.leaveName = this.leaveType;
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId != null ? currentUserId : "SYSTEM";
        this.updatedDate = new Date();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getLeaveType() { return leaveType; }
    public void setLeaveType(String leaveType) { this.leaveType = leaveType; }
    public String getEmpType() { return empType; }
    public void setEmpType(String empType) { this.empType = empType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLeaveCode() { return leaveCode; }
    public void setLeaveCode(String leaveCode) { this.leaveCode = leaveCode; }
    public String getLeaveName() { return leaveName; }
    public void setLeaveName(String leaveName) { this.leaveName = leaveName; }
    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }
    public Double getCreditValue() { return creditValue; }
    public void setCreditValue(Double creditValue) { this.creditValue = creditValue; }
    public Double getAnnualQuota() { return annualQuota; }
    public void setAnnualQuota(Double annualQuota) { this.annualQuota = annualQuota; }
    public Double getMonthlyCreditRate() { return monthlyCreditRate; }
    public void setMonthlyCreditRate(Double monthlyCreditRate) { this.monthlyCreditRate = monthlyCreditRate; }
    public String getAccrualFrequency() { return accrualFrequency; }
    public void setAccrualFrequency(String accrualFrequency) { this.accrualFrequency = accrualFrequency; }
    public Boolean getAllowCarryForward() { return allowCarryForward; }
    public void setAllowCarryForward(Boolean allowCarryForward) { this.allowCarryForward = allowCarryForward; }
    public Double getMaxCarryForwardDays() { return maxCarryForwardDays; }
    public void setMaxCarryForwardDays(Double maxCarryForwardDays) { this.maxCarryForwardDays = maxCarryForwardDays; }
    public Integer getCarryForwardExpiryMonths() { return carryForwardExpiryMonths; }
    public void setCarryForwardExpiryMonths(Integer carryForwardExpiryMonths) { this.carryForwardExpiryMonths = carryForwardExpiryMonths; }
    public Boolean getAllowEncashment() { return allowEncashment; }
    public void setAllowEncashment(Boolean allowEncashment) { this.allowEncashment = allowEncashment; }
    public Double getMinBalanceToRetain() { return minBalanceToRetain; }
    public void setMinBalanceToRetain(Double minBalanceToRetain) { this.minBalanceToRetain = minBalanceToRetain; }
    public Double getMaxEncashableDays() { return maxEncashableDays; }
    public void setMaxEncashableDays(Double maxEncashableDays) { this.maxEncashableDays = maxEncashableDays; }
    public String getGenderEligibility() { return genderEligibility; }
    public void setGenderEligibility(String genderEligibility) { this.genderEligibility = genderEligibility; }
    public Boolean getProbationAllowed() { return probationAllowed; }
    public void setProbationAllowed(Boolean probationAllowed) { this.probationAllowed = probationAllowed; }
    public Integer getMinServiceMonths() { return minServiceMonths; }
    public void setMinServiceMonths(Integer minServiceMonths) { this.minServiceMonths = minServiceMonths; }
    public Boolean getSandwichRuleApplies() { return sandwichRuleApplies; }
    public void setSandwichRuleApplies(Boolean sandwichRuleApplies) { this.sandwichRuleApplies = sandwichRuleApplies; }
    public Boolean getIncludeWeekends() { return includeWeekends; }
    public void setIncludeWeekends(Boolean includeWeekends) { this.includeWeekends = includeWeekends; }
    public Boolean getIncludeHolidays() { return includeHolidays; }
    public void setIncludeHolidays(Boolean includeHolidays) { this.includeHolidays = includeHolidays; }
    public Integer getMaxConsecutiveDays() { return maxConsecutiveDays; }
    public void setMaxConsecutiveDays(Integer maxConsecutiveDays) { this.maxConsecutiveDays = maxConsecutiveDays; }
    public Boolean getAllowHalfDay() { return allowHalfDay; }
    public void setAllowHalfDay(Boolean allowHalfDay) { this.allowHalfDay = allowHalfDay; }
    public Boolean getAllowHourly() { return allowHourly; }
    public void setAllowHourly(Boolean allowHourly) { this.allowHourly = allowHourly; }
    public Integer getApprovalLevels() { return approvalLevels; }
    public void setApprovalLevels(Integer approvalLevels) { this.approvalLevels = approvalLevels; }
    public Boolean getDocumentRequired() { return documentRequired; }
    public void setDocumentRequired(Boolean documentRequired) { this.documentRequired = documentRequired; }
    public Integer getDocumentThresholdDays() { return documentThresholdDays; }
    public void setDocumentThresholdDays(Integer documentThresholdDays) { this.documentThresholdDays = documentThresholdDays; }
    public String getAutoCreditPolicy() { return autoCreditPolicy; }
    public void setAutoCreditPolicy(String autoCreditPolicy) { this.autoCreditPolicy = autoCreditPolicy; }
    public Boolean getAllowNegativeBalance() { return allowNegativeBalance; }
    public void setAllowNegativeBalance(Boolean allowNegativeBalance) { this.allowNegativeBalance = allowNegativeBalance; }
    public Date getEffectiveFromDate() { return effectiveFromDate; }
    public void setEffectiveFromDate(Date effectiveFromDate) { this.effectiveFromDate = effectiveFromDate; }
    public Date getEffectiveToDate() { return effectiveToDate; }
    public void setEffectiveToDate(Date effectiveToDate) { this.effectiveToDate = effectiveToDate; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}

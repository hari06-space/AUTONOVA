package com.autonoma.erp.modules.hr.employee.entity;

import jakarta.persistence.*;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "HR_EMPLOYEE_SELF_ASSESSMENT")
public class EmployeeSelfAssessment {

    @Id
    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "EMPLOYEE_ID")
    @JsonIgnore
    private EmployeeMaster employee;

    @Transient
    private String payslipPath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SELF_ASSESSMENT_STATUS")
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @JsonIgnore
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster selfAssessmentStatus;

    @Column(name = "CURRENT_STEP")
    private Integer currentStep;

    @Column(name = "LAST_DRAFT_SAVED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastDraftSavedDate;

    @Column(name = "Q1_NATIVE")
    private String q1_native;

    @Column(name = "Q2_PRESENT_ADDRESS")
    private String q2_presentAddress;

    @Column(name = "Q3_PERMANENT_ADDRESS")
    private String q3_permanentAddress;

    @Column(name = "SAME_AS_CURRENT_ADDRESS", length = 10)
    private String sameAsCurrentAddress;

    @Column(name = "Q4_FATHER_OCCUPATION")
    private String q4_fatherOccupation;

    @Column(name = "Q5_MOTHER_OCCUPATION")
    private String q5_motherOccupation;

    @Column(name = "Q6_MARITAL_STATUS", length = 50)
    private String q6_maritalStatus;

    @Column(name = "Q7_SPOUSE_OCCUPATION")
    private String q7_spouseOccupation;

    @Column(name = "Q8_CHILDREN")
    private String q8_children;

    @Column(name = "Q9_HAS_RELATIVES", length = 10)
    private String q9_hasRelativesInCompany;

    @Column(name = "Q10_RELATIVES_DETAILS")
    private String q10_relativesDetails;

    @Column(name = "Q11_SIBLINGS_OCCUPATIONS")
    private String q11_siblingsOccupations;

    @Column(name = "Q12_HAS_TWO_WHEELER", length = 10)
    private String q12_hasTwoWheeler;

    @Column(name = "Q13_HAS_ANDROID_PHONE", length = 10)
    private String q13_hasAndroidPhone;

    @Column(name = "Q14_KNOWS_CAR_DRIVING", length = 10)
    private String q14_knowsCarDriving;

    @Column(name = "Q15_WILLING_TO_TRAVEL", length = 10)
    private String q15_willingToTravel;

    @Column(name = "Q16_COVID_VACCINATION", length = 10)
    private String q16_covidVaccination;

    @Column(name = "Q17_POSITIVE_POINTS")
    private String q17_positivePoints;

    @Column(name = "Q18_NEGATIVE_POINTS")
    private String q18_negativePoints;

    @Column(name = "Q19_LIFE_GOALS")
    private String q19_lifeGoals;

    @Column(name = "Q20_IMPROVEMENT_SUGGESTIONS")
    private String q20_improvementSuggestions;

    @Column(name = "Q20_WILLING_ROTATIONAL_SHIFTS", length = 20)
    private String q20_willingRotationalShifts;

    @Column(name = "Q21_IS_EXPERIENCED", length = 10)
    private String q21_isExperienced;

    @Column(name = "Q22_TOTAL_EXPERIENCE", length = 50)
    private String q22_totalExperience;

    @Column(name = "Q23_CORE_EXPERIENCE", length = 50)
    private String q23_coreExperience;

    @Column(name = "Q24_PREV_NET_SALARY", length = 50)
    private String q24_prevNetSalary;

    @Column(name = "Q25_PREV_GROSS_SALARY", length = 50)
    private String q25_prevGrossSalary;

    @Column(name = "Q26_EXPECTED_NET_SALARY", length = 50)
    private String q26_expectedNetSalary;

    @Column(name = "Q27_EXPECTED_GROSS_SALARY", length = 50)
    private String q27_expectedGrossSalary;

    @Column(name = "Q28_PF_HIGHER_PENSION", length = 10)
    private String q28_pfHigherPension;

    @Column(name = "Q29_PF_DEDUCTION_AMOUNT", length = 50)
    private String q29_pfDeductionAmount;

    @Column(name = "Q30_ALTERNATIVE_DEPARTMENT", length = 100)
    private String q30_alternativeDepartment;

    @Column(name = "Q31_PREV_LOCATION")
    private String q31_prevLocation;

    @Column(name = "Q32_PREV_SHIFT", length = 50)
    private String q32_prevShift;

    @Column(name = "Q33_REASON_FOR_LEAVING")
    private String q33_reasonForLeaving;

    @Column(name = "Q34_NOTICE_PERIOD", length = 50)
    private String q34_noticePeriod;

    @Column(name = "Q35_PREV_DEPT_POSITION")
    private String q35_prevDeptPosition;

    @Column(name = "Q36_PREV_DEPT_COUNT", length = 50)
    private String q36_prevDeptCount;

    @Column(name = "Q37_PREV_HR_MGR")
    private String q37_prevHrMgr;

    @Column(name = "Q38_HANDLE_MISTAKE")
    private String q38_handleMistake;

    @Column(name = "Q39_HANDLE_OPINION_DIFFERENCE")
    private String q39_handleOpinionDifference;

    @Column(name = "Q40_COMPUTER_SELF_RATING", length = 50)
    private String q40_computerSelfRating;

    @Column(name = "Q41_HR_MGR_NAME")
    private String q41_hrMgrName;

    @Column(name = "Q42_HR_MGR_EMAIL")
    private String q42_hrMgrEmail;

    @Column(name = "Q43_HR_MGR_PHONE")
    private String q43_hrMgrPhone;

    @Column(name = "Q44_VERT_HEAD_NAME")
    private String q44_vertHeadName;

    @Column(name = "Q45_VERT_HEAD_EMAIL")
    private String q45_vertHeadEmail;

    @Column(name = "Q46_VERT_HEAD_PHONE")
    private String q46_vertHeadPhone;

    @Column(name = "Q47_HAS_INSURANCE", length = 10)
    private String q47_hasInsurance;

    @Column(name = "Q48_INSURANCE_NUMBER", length = 100)
    private String q48_insuranceNumber;

    @Column(name = "MGR_COUNTRY_ID")
    private Long mgrCountryId;

    @Column(name = "VERT_HEAD_COUNTRY_ID")
    private Long vertHeadCountryId;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy = "System";

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    public EmployeeSelfAssessment() {
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    @Transient
    public Long getId() {
        return employeeId;
    }

    public EmployeeMaster getEmployee() {
        return employee;
    }

    public void setEmployee(EmployeeMaster employee) {
        this.employee = employee;
    }

    public String getQ1_native() {
        return q1_native;
    }

    public void setQ1_native(String q1_native) {
        this.q1_native = q1_native;
    }

    public String getQ2_presentAddress() {
        return q2_presentAddress;
    }

    public void setQ2_presentAddress(String q2_presentAddress) {
        this.q2_presentAddress = q2_presentAddress;
    }

    public String getQ3_permanentAddress() {
        return q3_permanentAddress;
    }

    public void setQ3_permanentAddress(String q3_permanentAddress) {
        this.q3_permanentAddress = q3_permanentAddress;
    }

    public String getSameAsCurrentAddress() {
        return sameAsCurrentAddress;
    }

    public void setSameAsCurrentAddress(String sameAsCurrentAddress) {
        this.sameAsCurrentAddress = sameAsCurrentAddress;
    }

    public String getQ4_fatherOccupation() {
        return q4_fatherOccupation;
    }

    public void setQ4_fatherOccupation(String q4_fatherOccupation) {
        this.q4_fatherOccupation = q4_fatherOccupation;
    }

    public String getQ5_motherOccupation() {
        return q5_motherOccupation;
    }

    public void setQ5_motherOccupation(String q5_motherOccupation) {
        this.q5_motherOccupation = q5_motherOccupation;
    }

    public String getQ6_maritalStatus() {
        return q6_maritalStatus;
    }

    public void setQ6_maritalStatus(String q6_maritalStatus) {
        this.q6_maritalStatus = q6_maritalStatus;
    }

    public String getQ7_spouseOccupation() {
        return q7_spouseOccupation;
    }

    public void setQ7_spouseOccupation(String q7_spouseOccupation) {
        this.q7_spouseOccupation = q7_spouseOccupation;
    }

    public String getQ8_children() {
        return q8_children;
    }

    public void setQ8_children(String q8_children) {
        this.q8_children = q8_children;
    }

    public String getQ9_hasRelativesInCompany() {
        return q9_hasRelativesInCompany;
    }

    public void setQ9_hasRelativesInCompany(String q9_hasRelativesInCompany) {
        this.q9_hasRelativesInCompany = q9_hasRelativesInCompany;
    }

    public String getQ10_relativesDetails() {
        return q10_relativesDetails;
    }

    public void setQ10_relativesDetails(String q10_relativesDetails) {
        this.q10_relativesDetails = q10_relativesDetails;
    }

    public String getQ11_siblingsOccupations() {
        return q11_siblingsOccupations;
    }

    public void setQ11_siblingsOccupations(String q11_siblingsOccupations) {
        this.q11_siblingsOccupations = q11_siblingsOccupations;
    }

    public String getQ12_hasTwoWheeler() {
        return q12_hasTwoWheeler;
    }

    public void setQ12_hasTwoWheeler(String q12_hasTwoWheeler) {
        this.q12_hasTwoWheeler = q12_hasTwoWheeler;
    }

    public String getQ13_hasAndroidPhone() {
        return q13_hasAndroidPhone;
    }

    public void setQ13_hasAndroidPhone(String q13_hasAndroidPhone) {
        this.q13_hasAndroidPhone = q13_hasAndroidPhone;
    }

    public String getQ14_knowsCarDriving() {
        return q14_knowsCarDriving;
    }

    public void setQ14_knowsCarDriving(String q14_knowsCarDriving) {
        this.q14_knowsCarDriving = q14_knowsCarDriving;
    }

    public String getQ15_willingToTravel() {
        return q15_willingToTravel;
    }

    public void setQ15_willingToTravel(String q15_willingToTravel) {
        this.q15_willingToTravel = q15_willingToTravel;
    }

    public String getQ16_covidVaccination() {
        return q16_covidVaccination;
    }

    public void setQ16_covidVaccination(String q16_covidVaccination) {
        this.q16_covidVaccination = q16_covidVaccination;
    }

    public String getQ17_positivePoints() {
        return q17_positivePoints;
    }

    public void setQ17_positivePoints(String q17_positivePoints) {
        this.q17_positivePoints = q17_positivePoints;
    }

    public String getQ18_negativePoints() {
        return q18_negativePoints;
    }

    public void setQ18_negativePoints(String q18_negativePoints) {
        this.q18_negativePoints = q18_negativePoints;
    }

    public String getQ19_lifeGoals() {
        return q19_lifeGoals;
    }

    public void setQ19_lifeGoals(String q19_lifeGoals) {
        this.q19_lifeGoals = q19_lifeGoals;
    }

    public String getQ20_improvementSuggestions() {
        return q20_improvementSuggestions;
    }

    public void setQ20_improvementSuggestions(String q20_improvementSuggestions) {
        this.q20_improvementSuggestions = q20_improvementSuggestions;
    }

    public String getQ20_willingRotationalShifts() {
        return q20_willingRotationalShifts;
    }

    public void setQ20_willingRotationalShifts(String q20_willingRotationalShifts) {
        this.q20_willingRotationalShifts = q20_willingRotationalShifts;
    }

    public String getQ21_isExperienced() {
        return q21_isExperienced;
    }

    public void setQ21_isExperienced(String q21_isExperienced) {
        this.q21_isExperienced = q21_isExperienced;
    }

    public String getQ22_totalExperience() {
        return q22_totalExperience;
    }

    public void setQ22_totalExperience(String q22_totalExperience) {
        this.q22_totalExperience = q22_totalExperience;
    }

    public String getQ23_coreExperience() {
        return q23_coreExperience;
    }

    public void setQ23_coreExperience(String q23_coreExperience) {
        this.q23_coreExperience = q23_coreExperience;
    }

    public String getQ24_prevNetSalary() {
        return q24_prevNetSalary;
    }

    public void setQ24_prevNetSalary(String q24_prevNetSalary) {
        this.q24_prevNetSalary = q24_prevNetSalary;
    }

    public String getQ25_prevGrossSalary() {
        return q25_prevGrossSalary;
    }

    public void setQ25_prevGrossSalary(String q25_prevGrossSalary) {
        this.q25_prevGrossSalary = q25_prevGrossSalary;
    }

    public String getQ26_expectedNetSalary() {
        return q26_expectedNetSalary;
    }

    public void setQ26_expectedNetSalary(String q26_expectedNetSalary) {
        this.q26_expectedNetSalary = q26_expectedNetSalary;
    }

    public String getQ27_expectedGrossSalary() {
        return q27_expectedGrossSalary;
    }

    public void setQ27_expectedGrossSalary(String q27_expectedGrossSalary) {
        this.q27_expectedGrossSalary = q27_expectedGrossSalary;
    }

    public String getQ28_pfHigherPension() {
        return q28_pfHigherPension;
    }

    public void setQ28_pfHigherPension(String q28_pfHigherPension) {
        this.q28_pfHigherPension = q28_pfHigherPension;
    }

    public String getQ29_pfDeductionAmount() {
        return q29_pfDeductionAmount;
    }

    public void setQ29_pfDeductionAmount(String q29_pfDeductionAmount) {
        this.q29_pfDeductionAmount = q29_pfDeductionAmount;
    }

    public String getQ30_alternativeDepartment() {
        return q30_alternativeDepartment;
    }

    public void setQ30_alternativeDepartment(String q30_alternativeDepartment) {
        this.q30_alternativeDepartment = q30_alternativeDepartment;
    }

    public String getQ31_prevLocation() {
        return q31_prevLocation;
    }

    public void setQ31_prevLocation(String q31_prevLocation) {
        this.q31_prevLocation = q31_prevLocation;
    }

    public String getQ32_prevShift() {
        return q32_prevShift;
    }

    public void setQ32_prevShift(String q32_prevShift) {
        this.q32_prevShift = q32_prevShift;
    }

    public String getQ33_reasonForLeaving() {
        return q33_reasonForLeaving;
    }

    public void setQ33_reasonForLeaving(String q33_reasonForLeaving) {
        this.q33_reasonForLeaving = q33_reasonForLeaving;
    }

    public String getQ34_noticePeriod() {
        return q34_noticePeriod;
    }

    public void setQ34_noticePeriod(String q34_noticePeriod) {
        this.q34_noticePeriod = q34_noticePeriod;
    }

    public String getQ35_prevDeptPosition() {
        return q35_prevDeptPosition;
    }

    public void setQ35_prevDeptPosition(String q35_prevDeptPosition) {
        this.q35_prevDeptPosition = q35_prevDeptPosition;
    }

    public String getQ36_prevDeptCount() {
        return q36_prevDeptCount;
    }

    public void setQ36_prevDeptCount(String q36_prevDeptCount) {
        this.q36_prevDeptCount = q36_prevDeptCount;
    }

    public String getQ37_prevHrMgr() {
        return q37_prevHrMgr;
    }

    public void setQ37_prevHrMgr(String q37_prevHrMgr) {
        this.q37_prevHrMgr = q37_prevHrMgr;
    }

    public String getQ38_handleMistake() {
        return q38_handleMistake;
    }

    public void setQ38_handleMistake(String val) {
        this.q38_handleMistake = val;
    }

    public String getQ39_handleOpinionDifference() {
        return q39_handleOpinionDifference;
    }

    public void setQ39_handleOpinionDifference(String val) {
        this.q39_handleOpinionDifference = val;
    }

    public String getQ40_computerSelfRating() {
        return q40_computerSelfRating;
    }

    public void setQ40_computerSelfRating(String val) {
        this.q40_computerSelfRating = val;
    }

    public String getQ41_hrMgrName() {
        return q41_hrMgrName;
    }

    public void setQ41_hrMgrName(String val) {
        this.q41_hrMgrName = val;
    }

    public String getQ42_hrMgrEmail() {
        return q42_hrMgrEmail;
    }

    public void setQ42_hrMgrEmail(String val) {
        this.q42_hrMgrEmail = val;
    }

    public String getQ43_hrMgrPhone() {
        return q43_hrMgrPhone;
    }

    public void setQ43_hrMgrPhone(String val) {
        this.q43_hrMgrPhone = val;
    }

    public String getQ44_vertHeadName() {
        return q44_vertHeadName;
    }

    public void setQ44_vertHeadName(String val) {
        this.q44_vertHeadName = val;
    }

    public String getQ45_vertHeadEmail() {
        return q45_vertHeadEmail;
    }

    public void setQ45_vertHeadEmail(String val) {
        this.q45_vertHeadEmail = val;
    }

    public String getQ46_vertHeadPhone() {
        return q46_vertHeadPhone;
    }

    public void setQ46_vertHeadPhone(String val) {
        this.q46_vertHeadPhone = val;
    }

    public Long getMgrCountryId() {
        return mgrCountryId;
    }

    public void setMgrCountryId(Long mgrCountryId) {
        this.mgrCountryId = mgrCountryId;
    }

    public Long getVertHeadCountryId() {
        return vertHeadCountryId;
    }

    public void setVertHeadCountryId(Long vertHeadCountryId) {
        this.vertHeadCountryId = vertHeadCountryId;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Date getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(Date updatedDate) {
        this.updatedDate = updatedDate;
    }

    public String getPayslipPath() {
        return this.employee != null ? this.employee.getPayslipPath() : this.payslipPath;
    }

    public void setPayslipPath(String payslipPath) {
        this.payslipPath = payslipPath;
        if (this.employee != null) {
            this.employee.setPayslipPath(payslipPath);
        }
    }

    @JsonIgnore
    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getSelfAssessmentStatus() {
        return selfAssessmentStatus;
    }

    public void setSelfAssessmentStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster selfAssessmentStatus) {
        this.selfAssessmentStatus = selfAssessmentStatus;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("selfAssessmentStatus")
    public String getSelfAssessmentStatusName() {
        return this.selfAssessmentStatus != null ? this.selfAssessmentStatus.getName() : "DRAFT";
    }

    public Integer getCurrentStep() {
        return currentStep;
    }

    public void setCurrentStep(Integer currentStep) {
        this.currentStep = currentStep;
    }

    public Date getLastDraftSavedDate() {
        return lastDraftSavedDate;
    }

    public void setLastDraftSavedDate(Date lastDraftSavedDate) {
        this.lastDraftSavedDate = lastDraftSavedDate;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }
            if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
        }
        if (this.createdDate == null) {
            this.createdDate = new Date();
        }
        if (this.selfAssessmentStatus == null) {
            try {
                com.autonoma.erp.modules.hra.recruitment.service.AtsStatusResolver resolver =
                    com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.hra.recruitment.service.AtsStatusResolver.class);
                if (resolver != null) {
                    this.selfAssessmentStatus = resolver.get("Draft");
                }
            } catch (Exception ignored) {}
        }
    }

    public String getQ47_hasInsurance() {
        return q47_hasInsurance;
    }

    public void setQ47_hasInsurance(String q47_hasInsurance) {
        this.q47_hasInsurance = q47_hasInsurance;
    }

    public String getQ48_insuranceNumber() {
        return q48_insuranceNumber;
    }

    public void setQ48_insuranceNumber(String q48_insuranceNumber) {
        this.q48_insuranceNumber = q48_insuranceNumber;
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
}


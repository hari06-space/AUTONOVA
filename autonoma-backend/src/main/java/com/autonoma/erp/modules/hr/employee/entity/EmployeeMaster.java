package com.autonoma.erp.modules.hr.employee.entity;

import com.autonoma.erp.util.SecurityUtils;
import com.autonoma.erp.util.YesNoConverter;

import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.entity.Designation;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "HR_EMPLOYEE")
@JsonIgnoreProperties(value = { 
    "hibernateLazyInitializer", "handler",
    "q1_native", "q2_presentAddress", "q3_permanentAddress", "q4_fatherOccupation", "q5_motherOccupation",
    "q6_maritalStatus", "q7_spouseOccupation", "q8_children", "q9_hasRelativesInCompany", "q10_relativesDetails",
    "q11_siblingsOccupations", "q12_hasTwoWheeler", "q13_hasAndroidPhone", "q14_knowsCarDriving", "q15_willingToTravel",
    "q16_covidVaccination", "q17_positivePoints", "q18_negativePoints", "q19_lifeGoals", "q20_improvementSuggestions",
    "q21_isExperienced", "q22_totalExperience", "q23_coreExperience", "q24_prevNetSalary", "q25_prevGrossSalary",
    "q26_expectedNetSalary", "q27_expectedGrossSalary", "q28_pfHigherPension", "q29_pfDeductionAmount", "q30_alternativeDepartment",
    "q31_prevLocation", "q32_prevShift", "q33_reasonForLeaving", "q34_noticePeriod", "q35_prevDeptPosition",
    "q36_prevDeptCount", "q37_prevHrMgr", "q38_handleMistake", "q39_handleOpinionDifference", "q40_computerSelfRating",
    "q41_hrMgrName", "q42_hrMgrEmail", "q43_hrMgrPhone", "q44_vertHeadName", "q45_vertHeadEmail", "q46_vertHeadPhone",
    "payslipPath"
}, allowSetters = true)
public class EmployeeMaster {

    public EmployeeMaster() {
        // initChildEntities(); // REMOVED to prevent Transient object MapsId cascade
        // errors
    }

    @com.fasterxml.jackson.annotation.JsonCreator
    public EmployeeMaster(Long id) {
        this();
        this.id = id;
    }

    private void initChildEntities() {
        if (this.organization == null) {
            this.organization = new EmployeeOrganization();
            this.organization.setEmployee(this);
        }
        if (this.reference == null) {
            this.reference = new EmployeeReference();
            this.reference.setEmployee(this);
        }
        if (this.scheduling == null) {
            this.scheduling = new EmployeeScheduling();
            this.scheduling.setEmployee(this);
        }
        if (this.induction == null) {
            this.induction = new EmployeeInduction();
            this.induction.setEmployee(this);
        }
        if (this.operations == null) {
            this.operations = new EmployeeOperations();
            this.operations.setEmployee(this);
        }
        if (this.statutory == null) {
            this.statutory = new EmployeeStatutory();
            this.statutory.setEmployee(this);
        }
        if (this.ability == null) {
            this.ability = new EmployeeAbility();
            this.ability.setEmployee(this);
        }
        if (this.selfAssessment == null) {
            this.selfAssessment = new EmployeeSelfAssessment();
            this.selfAssessment.setEmployee(this);
        }
    }

    public EmployeeMaster(Long id, String empCode, String employeeName, String firstName, String lastName,
            Long empLevelId, Long designationId, String employeePhotoUpload) {
        this();
        this.id = id;
        this.empCode = empCode;
        this.employeeName = employeeName;
        this.firstName = firstName;
        this.lastName = lastName;
        this.setEmpLevelId(empLevelId);
        this.setDesignationId(designationId);
        this.employeePhotoUpload = employeePhotoUpload;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @org.hibernate.annotations.Nationalized
    @Column(name = "EMP_CODE", unique = true, nullable = true, length = 50)
    private String empCode;

    @Column(name = "OLD_EMP_CODE", length = 50)
    private String oldEmpCode;

    @Column(name = "TITLE", length = 10)
    private String title;

    @Column(name = "EMPLOYEE_NAME")
    private String employeeName;

    @Column(name = "FIRST_NAME", length = 100)
    private String firstName;

    @Column(name = "LAST_NAME", length = 100)
    private String lastName;

    @Column(name = "FATHER_HUSBAND_NAME", length = 100)
    private String fatherHusbandName;

    // === Uploads ===
    @Column(name = "PROFILE_UPLOAD", length = 255)
    private String employeePhotoUpload;

    @Column(name = "SIGNATURE", length = 255)
    private String employeeSignatureUpload;

    @Column(name = "NDA_CERTIFICATE_UPLOAD", length = 500)
    private String ndaUpload;

    @Column(name = "FITNESS_CERTIFICATE_UPLOAD", length = 1000)
    private String fitnessCertificateUpload;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster status;

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

    // ======================== ONE-TO-ONE RELATIONS (JSON IGNORED)
    // ========================
    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private EmployeeOrganization organization;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private EmployeeReference reference;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private EmployeeScheduling scheduling;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private EmployeeInduction induction;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private EmployeeOperations operations;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private EmployeeStatutory statutory;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private EmployeeAbility ability;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private EmployeeSelfAssessment selfAssessment;

    @Column(name = "FROMWHERE", length = 50)
    private String fromWhere;

    @Column(name = "APPLICANT_CODE", length = 50)
    private String applicantCode;

    @Column(name = "APPLICANT_DATE")
    @Temporal(TemporalType.DATE)
    private Date applicantDate;

    @Column(name = "CALL_LETTER_DATE", length = 50)
    private String callLetterDate;

    @Column(name = "CALL_LETTER_TIME", length = 50)
    private String callLetterTime;

    @Column(name = "PAYSLIP_PATH", length = 1000)
    private String payslipPath;

    @Column(name = "RESUME_PATH", length = 1000)
    private String resumePath;

    @Column(name = "AADHAR_PATH", length = 1000)
    private String aadharPath;

    @Column(name = "IS_REHIRED", length = 10)
    private String isRehired = "NO";

    @Column(name = "PREVIOUS_EMP_CODE", length = 50)
    private String previousEmpCode;

    @Column(name = "ARCHIVED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date archivedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CALL_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster callStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "INTERVIEW_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster interviewStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OFFER_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster offerStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VERIFICATION_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster verificationStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BACKGROUND_VERIFICATION_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster backgroundVerificationStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ATS_OVERALL_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster atsOverallStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PHOTO_VERIFIED_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster photoVerifiedStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RESUME_VERIFIED_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster resumeVerifiedStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PAYSLIP_VERIFIED_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster payslipVerifiedStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AADHAR_VERIFIED_STATUS")
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster aadharVerifiedStatus;

    @Column(name = "PHOTO_REJECT_REASON")
    private String photoRejectReason;

    @Column(name = "RESUME_REJECT_REASON")
    private String resumeRejectReason;

    @Column(name = "PAYSLIP_REJECT_REASON")
    private String payslipRejectReason;

    @Column(name = "AADHAR_REJECT_REASON")
    private String aadharRejectReason;

    @Column(name = "NEXT_SALARY_HIKE_MONTH", length = 50)
    private String nextSalaryHikeMonth;

    @Column(name = "MINIMUM_AMOUNT", precision = 18, scale = 2)
    private BigDecimal minimumAmount;

    @Column(name = "MAXIMUM_AMOUNT", precision = 18, scale = 2)
    private BigDecimal maximumAmount;

    @Transient
    private Integer age;

    @Column(name = "ONBOARDING_STARTED")
    private Boolean onboardingStarted = false;

    // ======================== GETTERS & SETTERS FOR OWN FIELDS
    // ========================
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmpCode() {
        return empCode;
    }

    public void setEmpCode(String empCode) {
        this.empCode = empCode;
    }

    public String getOldEmpCode() {
        return oldEmpCode;
    }

    public void setOldEmpCode(String oldEmpCode) {
        this.oldEmpCode = oldEmpCode;
    }

    public Boolean getOnboardingStarted() {
        return onboardingStarted;
    }

    public void setOnboardingStarted(Boolean onboardingStarted) {
        this.onboardingStarted = onboardingStarted;
    }
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getFatherHusbandName() {
        return fatherHusbandName;
    }

    public void setFatherHusbandName(String fatherHusbandName) {
        this.fatherHusbandName = fatherHusbandName;
    }

    public Department getDepartment() {
        return getOrganization().getDepartment();
    }

    public void setDepartment(Department department) {
        getOrganization().setDepartment(department);
    }

    public Designation getDesignation() {
        return getOrganization().getDesignation();
    }

    public void setDesignation(Designation designation) {
        getOrganization().setDesignation(designation);
    }

    public String getEmployeePhotoUpload() {
        return employeePhotoUpload;
    }

    public void setEmployeePhotoUpload(String employeePhotoUpload) {
        this.employeePhotoUpload = employeePhotoUpload;
    }

    public String getEmployeeSignatureUpload() {
        return employeeSignatureUpload;
    }

    public void setEmployeeSignatureUpload(String employeeSignatureUpload) {
        this.employeeSignatureUpload = employeeSignatureUpload;
    }

    public String getNdaUpload() {
        return ndaUpload;
    }

    public void setNdaUpload(String ndaUpload) {
        this.ndaUpload = ndaUpload;
    }

    public String getFitnessCertificateUpload() {
        return fitnessCertificateUpload;
    }

    public void setFitnessCertificateUpload(String fitnessCertificateUpload) {
        this.fitnessCertificateUpload = fitnessCertificateUpload;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getStatus() {
        return status;
    }

    public void setStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster status) {
        this.status = status;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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

    // ======================== ONE-TO-ONE ENTITY ACCESSORS ========================
    @JsonIgnore
    public EmployeeOrganization getOrganization() {
        if (this.organization == null) {
            this.organization = new EmployeeOrganization();
            this.organization.setEmployee(this);
        }
        return this.organization;
    }

    public void setOrganization(EmployeeOrganization organization) {
        this.organization = organization;
    }

    @JsonIgnore
    public EmployeeReference getReference() {
        if (this.reference == null) {
            this.reference = new EmployeeReference();
            this.reference.setEmployee(this);
        }
        return this.reference;
    }

    public void setReference(EmployeeReference reference) {
        this.reference = reference;
    }

    @JsonIgnore
    public EmployeeScheduling getScheduling() {
        if (this.scheduling == null) {
            this.scheduling = new EmployeeScheduling();
            this.scheduling.setEmployee(this);
        }
        return this.scheduling;
    }

    public void setScheduling(EmployeeScheduling scheduling) {
        this.scheduling = scheduling;
    }

    @JsonIgnore
    public EmployeeInduction getInduction() {
        if (this.induction == null) {
            this.induction = new EmployeeInduction();
            this.induction.setEmployee(this);
        }
        return this.induction;
    }

    public void setInduction(EmployeeInduction induction) {
        this.induction = induction;
    }

    @JsonIgnore
    public EmployeeOperations getOperations() {
        if (this.operations == null) {
            this.operations = new EmployeeOperations();
            this.operations.setEmployee(this);
        }
        return this.operations;
    }

    public void setOperations(EmployeeOperations operations) {
        this.operations = operations;
    }

    @JsonIgnore
    public EmployeeStatutory getStatutory() {
        if (this.statutory == null) {
            this.statutory = new EmployeeStatutory();
            this.statutory.setEmployee(this);
        }
        return this.statutory;
    }

    public void setStatutory(EmployeeStatutory statutory) {
        this.statutory = statutory;
    }

    @JsonIgnore
    public EmployeeAbility getAbility() {
        if (this.ability == null) {
            this.ability = new EmployeeAbility();
            this.ability.setEmployee(this);
        }
        return this.ability;
    }

    public void setAbility(EmployeeAbility ability) {
        this.ability = ability;
    }

    @JsonIgnore
    public EmployeeSelfAssessment getSelfAssessment() {
        if (this.selfAssessment == null) {
            this.selfAssessment = new EmployeeSelfAssessment();
            this.selfAssessment.setEmployee(this);
        }
        return this.selfAssessment;
    }

    public void setSelfAssessment(EmployeeSelfAssessment selfAssessment) {
        this.selfAssessment = selfAssessment;
    }

    // ======================== DELEGATED PROPERTIES ========================

    // === Organization ===
    public Long getCategoryId() {
        return getOrganization().getCategoryId();
    }

    public void setCategoryId(Long val) {
        getOrganization().setCategoryId(val);
    }

    public Long getEmpLevelId() {
        return getOrganization().getEmpLevelId();
    }

    public void setEmpLevelId(Long val) {
        getOrganization().setEmpLevelId(val);
    }

    public Long getEmployeeTypeId() {
        return getOrganization().getEmployeeTypeId();
    }

    public void setEmployeeTypeId(Long val) {
        getOrganization().setEmployeeTypeId(val);
    }

    public String getGradeCode() {
        return getOrganization().getGradeCode();
    }

    public void setGradeCode(String val) {
        getOrganization().setGradeCode(val);
    }

    public Long getUnitId() {
        return getOrganization().getUnitId();
    }

    public void setUnitId(Long val) {
        getOrganization().setUnitId(val);
    }

    public Long getDepartmentId() {
        return getOrganization().getDepartmentId();
    }

    public void setDepartmentId(Long val) {
        getOrganization().setDepartmentId(val);
    }

    public Long getDesignationId() {
        return getOrganization().getDesignationId();
    }

    public void setDesignationId(Long val) {
        getOrganization().setDesignationId(val);
    }

    public String getVerticalHead() {
        return getOrganization().getVerticalHead();
    }

    public void setVerticalHead(String val) {
        getOrganization().setVerticalHead(val);
    }

    public String getHrManager() {
        return getOrganization().getHrManager();
    }

    public void setHrManager(String val) {
        getOrganization().setHrManager(val);
    }

    public String getOfficeMail() {
        return getOrganization().getOfficeMail();
    }

    public void setOfficeMail(String val) {
        getOrganization().setOfficeMail(val);
    }

    public String getOfficeMailPassword() {
        return getOrganization().getOfficeMailPassword();
    }

    public void setOfficeMailPassword(String val) {
        getOrganization().setOfficeMailPassword(val);
    }

    // === Reference ===
    public String getVendorName() {
        return getReference().getVendorName();
    }

    public void setVendorName(String val) {
        getReference().setVendorName(val);
    }

    public String getReferMode() {
        return getReference().getReferMode();
    }

    public void setReferMode(String val) {
        getReference().setReferMode(val);
    }

    public String getReferenceComments() {
        return getReference().getReferenceComments();
    }

    public void setReferenceComments(String val) {
        getReference().setReferenceComments(val);
    }

    public String getFinalFeedback() {
        return getReference().getFinalFeedback();
    }

    public void setFinalFeedback(String val) {
        getReference().setFinalFeedback(val);
    }

    public String getHomeManager() {
        return getReference().getHomeManager();
    }

    public void setHomeManager(String val) {
        getReference().setHomeManager(val);
    }

    public String getBusinessManager() {
        return getReference().getBusinessManager();
    }

    public void setBusinessManager(String val) {
        getReference().setBusinessManager(val);
    }

    public String getSupplierName() {
        return getReference().getSupplierName();
    }

    public void setSupplierName(String val) {
        getReference().setSupplierName(val);
    }

    public String getBgvRemark() {
        return getReference().getBgvRemark();
    }

    public void setBgvRemark(String val) {
        getReference().setBgvRemark(val);
    }

    // === Scheduling ===
    public Date getDateOfJoining() {
        return getScheduling().getDateOfJoining();
    }

    public void setDateOfJoining(Date val) {
        getScheduling().setDateOfJoining(val);
    }

    public String getProbationPeriod() {
        return getScheduling().getProbationPeriod();
    }

    public void setProbationPeriod(String val) {
        getScheduling().setProbationPeriod(val);
    }

    public Date getConfirmationDate() {
        return getScheduling().getConfirmationDate();
    }

    public void setConfirmationDate(Date val) {
        getScheduling().setConfirmationDate(val);
    }

    public Date getExitDate() {
        return getScheduling().getExitDate();
    }

    public void setExitDate(Date val) {
        getScheduling().setExitDate(val);
    }

    public String getExitReason() {
        return getScheduling().getExitReason();
    }

    public void setExitReason(String val) {
        getScheduling().setExitReason(val);
    }

    public String getExitComments() {
        return getScheduling().getExitComments();
    }

    public void setExitComments(String val) {
        getScheduling().setExitComments(val);
    }

    public Date getRejoiningDate() {
        return getScheduling().getRejoiningDate();
    }

    public void setRejoiningDate(Date val) {
        getScheduling().setRejoiningDate(val);
    }

    // === Induction ===
    public String getInductionStatus() {
        return getInduction().getInductionStatus();
    }

    public void setInductionStatus(String val) {
        getInduction().setInductionStatus(val);
    }

    public String getIsInductionEligible() {
        return getInduction().getIsInductionEligible();
    }

    public void setIsInductionEligible(String val) {
        getInduction().setIsInductionEligible(val);
    }

    // === Operations ===
    public Integer getGraceMinutes() {
        return getOperations().getGraceMinutes();
    }

    public void setGraceMinutes(Integer val) {
        getOperations().setGraceMinutes(val);
    }

    public String getPetrolMode() {
        return getOperations().getPetrolMode();
    }

    public void setPetrolMode(String val) {
        getOperations().setPetrolMode(val);
    }

    public BigDecimal getPetrolAllowance() {
        return getOperations().getPetrolAllowance();
    }

    public void setPetrolAllowance(BigDecimal val) {
        getOperations().setPetrolAllowance(val);
    }

    public String getShift() {
        return getOperations().getShift();
    }

    public void setShift(String val) {
        getOperations().setShift(val);
    }

    public String getShiftName() {
        return getOperations().getShiftName();
    }

    public void setShiftName(String val) {
        getOperations().setShiftName(val);
    }

    public String getShiftDuration() {
        return getOperations().getShiftDuration();
    }

    public void setShiftDuration(String val) {
        getOperations().setShiftDuration(val);
    }

    public String getSegment() {
        return getOperations().getSegment();
    }

    public void setSegment(String val) {
        getOperations().setSegment(val);
    }

    public String getSubSegment() {
        return getOperations().getSubSegment();
    }

    public void setSubSegment(String val) {
        getOperations().setSubSegment(val);
    }

    // === Statutory ===
    public String getPfToggle() {
        return getStatutory().getPfToggle();
    }

    public void setPfToggle(String val) {
        getStatutory().setPfToggle(val);
    }

    public BigDecimal getPfRestriction() {
        return getStatutory().getPfRestriction();
    }

    public void setPfRestriction(BigDecimal val) {
        getStatutory().setPfRestriction(val);
    }

    public String getEsiToggle() {
        return getStatutory().getEsiToggle();
    }

    public void setEsiToggle(String val) {
        getStatutory().setEsiToggle(val);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("pTaxToggle")
    public String getPTaxToggle() {
        return getStatutory().getPTaxToggle();
    }

    @com.fasterxml.jackson.annotation.JsonProperty("pTaxToggle")
    public void setPTaxToggle(String val) {
        getStatutory().setPTaxToggle(val);
    }

    public String getBonusToggle() {
        return getStatutory().getBonusToggle();
    }

    public void setBonusToggle(String val) {
        getStatutory().setBonusToggle(val);
    }

    public String getOtToggle() {
        return getStatutory().getOtToggle();
    }

    public void setOtToggle(String val) {
        getStatutory().setOtToggle(val);
    }

    public BigDecimal getOtFactorial() {
        return getStatutory().getOtFactorial();
    }

    public void setOtFactorial(BigDecimal val) {
        getStatutory().setOtFactorial(val);
    }

    public String getLomDeduction() {
        return getStatutory().getLomDeduction();
    }

    public void setLomDeduction(String val) {
        getStatutory().setLomDeduction(val);
    }

    public BigDecimal getLomAllow() {
        return getStatutory().getLomAllow();
    }

    public void setLomAllow(BigDecimal val) {
        getStatutory().setLomAllow(val);
    }

    public String getLtaEligible() {
        return getStatutory().getLtaEligible();
    }

    public void setLtaEligible(String val) {
        getStatutory().setLtaEligible(val);
    }

    public String getPermissionToggle() {
        return getStatutory().getPermissionToggle();
    }

    public void setPermissionToggle(String val) {
        getStatutory().setPermissionToggle(val);
    }

    public BigDecimal getPermissionLimit() {
        return getStatutory().getPermissionLimit();
    }

    public void setPermissionLimit(BigDecimal val) {
        getStatutory().setPermissionLimit(val);
    }

    // === Ability ===
    public String getIsAuditor() {
        return getAbility().getIsAuditor();
    }

    public void setIsAuditor(String val) {
        getAbility().setIsAuditor(val);
    }

    public String getAuditorType() {
        return getAbility().getAuditorType();
    }

    public void setAuditorType(String val) {
        getAbility().setAuditorType(val);
    }

    public String getIsAuditee() {
        return getAbility().getIsAuditee();
    }

    public void setIsAuditee(String val) {
        getAbility().setIsAuditee(val);
    }

    public String getAuditeeType() {
        return getAbility().getAuditeeType();
    }

    public void setAuditeeType(String val) {
        getAbility().setAuditeeType(val);
    }

    public String getIsNcrApprover() {
        return getAbility().getIsNcrApprover();
    }

    public void setIsNcrApprover(String val) {
        getAbility().setIsNcrApprover(val);
    }

    public String getNcrApproverType() {
        return getAbility().getNcrApproverType();
    }

    public void setNcrApproverType(String val) {
        getAbility().setNcrApproverType(val);
    }

    public String getIsTaskVerifier() {
        return getAbility().getIsTaskVerifier();
    }

    public void setIsTaskVerifier(String val) {
        getAbility().setIsTaskVerifier(val);
    }

    public String getTaskVerifierType() {
        return getAbility().getTaskVerifierType();
    }

    public void setTaskVerifierType(String val) {
        getAbility().setTaskVerifierType(val);
    }

    public String getIsTaskTester() {
        return getAbility().getIsTaskTester();
    }

    public void setIsTaskTester(String val) {
        getAbility().setIsTaskTester(val);
    }

    public String getTaskTesterType() {
        return getAbility().getTaskTesterType();
    }

    public void setTaskTesterType(String val) {
        getAbility().setTaskTesterType(val);
    }

    public String getIsChaired() {
        return getAbility().getIsChaired();
    }

    public void setIsChaired(String val) {
        getAbility().setIsChaired(val);
    }

    public String getChairedType() {
        return getAbility().getChairedType();
    }

    public void setChairedType(String val) {
        getAbility().setChairedType(val);
    }

    public String getIsHost() {
        return getAbility().getIsHost();
    }

    public void setIsHost(String val) {
        getAbility().setIsHost(val);
    }

    public String getHostType() {
        return getAbility().getHostType();
    }

    public void setHostType(String val) {
        getAbility().setHostType(val);
    }

    public String getIsParticipants() {
        return getAbility().getIsParticipants();
    }

    public void setIsParticipants(String val) {
        getAbility().setIsParticipants(val);
    }

    public String getParticipantsType() {
        return getAbility().getParticipantsType();
    }

    public void setParticipantsType(String val) {
        getAbility().setParticipantsType(val);
    }

    public String getIsFirstAid() {
        return getAbility().getIsFirstAid();
    }

    public void setIsFirstAid(String val) {
        getAbility().setIsFirstAid(val);
    }

    public String getFirstAidFileInfo() {
        return getAbility().getFirstAidFileInfo();
    }

    public void setFirstAidFileInfo(String val) {
        getAbility().setFirstAidFileInfo(val);
    }

    public String getIsFireFighter() {
        return getAbility().getIsFireFighter();
    }

    public void setIsFireFighter(String val) {
        getAbility().setIsFireFighter(val);
    }

    public String getFireFighterFileInfo() {
        return getAbility().getFireFighterFileInfo();
    }

    public void setFireFighterFileInfo(String val) {
        getAbility().setFireFighterFileInfo(val);
    }

    public String getIsTwoWheeler() {
        return getAbility().getIsTwoWheeler();
    }

    public void setIsTwoWheeler(String val) {
        getAbility().setIsTwoWheeler(val);
    }

    public String getTwoWheelerFileInfo() {
        return getAbility().getTwoWheelerFileInfo();
    }

    public void setTwoWheelerFileInfo(String val) {
        getAbility().setTwoWheelerFileInfo(val);
    }

    public String getIsFourWheeler() {
        return getAbility().getIsFourWheeler();
    }

    public void setIsFourWheeler(String val) {
        getAbility().setIsFourWheeler(val);
    }

    public String getFourWheelerFileInfo() {
        return getAbility().getFourWheelerFileInfo();
    }

    public void setFourWheelerFileInfo(String val) {
        getAbility().setFourWheelerFileInfo(val);
    }

    public String getIsInterviewer() {
        return getAbility().getIsInterviewer();
    }

    public void setIsInterviewer(String val) {
        getAbility().setIsInterviewer(val);
    }

    public String getIsEnquiryAssignee() {
        return getAbility().getIsEnquiryAssignee();
    }

    public void setIsEnquiryAssignee(String val) {
        getAbility().setIsEnquiryAssignee(val);
    }

    public String getIsPrAssignee() {
        return getAbility().getIsPrAssignee();
    }

    public void setIsPrAssignee(String val) {
        getAbility().setIsPrAssignee(val);
    }

    // === Ability Element Collections ===
    @JsonIgnore
    public List<String> getAuditorFileList() {
        return getAbility().getAuditorFileList();
    }

    public void setAuditorFileList(List<String> val) {
        getAbility().setAuditorFileList(val);
    }

    @JsonIgnore
    public List<String> getAuditeeFileList() {
        return getAbility().getAuditeeFileList();
    }

    public void setAuditeeFileList(List<String> val) {
        getAbility().setAuditeeFileList(val);
    }

    @JsonIgnore
    public List<String> getNcrApproverFileList() {
        return getAbility().getNcrApproverFileList();
    }

    public void setNcrApproverFileList(List<String> val) {
        getAbility().setNcrApproverFileList(val);
    }

    @JsonIgnore
    public List<String> getTaskVerifierFileList() {
        return getAbility().getTaskVerifierFileList();
    }

    public void setTaskVerifierFileList(List<String> val) {
        getAbility().setTaskVerifierFileList(val);
    }

    @JsonIgnore
    public List<String> getTaskTesterFileList() {
        return getAbility().getTaskTesterFileList();
    }

    public void setTaskTesterFileList(List<String> val) {
        getAbility().setTaskTesterFileList(val);
    }

    @JsonIgnore
    public List<String> getChairedFileList() {
        return getAbility().getChairedFileList();
    }

    public void setChairedFileList(List<String> val) {
        getAbility().setChairedFileList(val);
    }

    @JsonIgnore
    public List<String> getHostFileList() {
        return getAbility().getHostFileList();
    }

    public void setHostFileList(List<String> val) {
        getAbility().setHostFileList(val);
    }

    @JsonIgnore
    public List<String> getParticipantsFileList() {
        return getAbility().getParticipantsFileList();
    }

    public void setParticipantsFileList(List<String> val) {
        getAbility().setParticipantsFileList(val);
    }

    // === Self Assessment ===
    public String getQ1_native() {
        return getSelfAssessment().getQ1_native();
    }

    public void setQ1_native(String val) {
        getSelfAssessment().setQ1_native(val);
    }

    public String getQ2_presentAddress() {
        return getSelfAssessment().getQ2_presentAddress();
    }

    public void setQ2_presentAddress(String val) {
        getSelfAssessment().setQ2_presentAddress(val);
    }

    public String getQ3_permanentAddress() {
        return getSelfAssessment().getQ3_permanentAddress();
    }

    public void setQ3_permanentAddress(String val) {
        getSelfAssessment().setQ3_permanentAddress(val);
    }

    public String getSameAsCurrentAddress() {
        return getSelfAssessment().getSameAsCurrentAddress();
    }

    public void setSameAsCurrentAddress(String val) {
        getSelfAssessment().setSameAsCurrentAddress(val);
    }

    public String getQ4_fatherOccupation() {
        return getSelfAssessment().getQ4_fatherOccupation();
    }

    public void setQ4_fatherOccupation(String val) {
        getSelfAssessment().setQ4_fatherOccupation(val);
    }

    public String getQ5_motherOccupation() {
        return getSelfAssessment().getQ5_motherOccupation();
    }

    public void setQ5_motherOccupation(String val) {
        getSelfAssessment().setQ5_motherOccupation(val);
    }

    public String getQ6_maritalStatus() {
        return getSelfAssessment().getQ6_maritalStatus();
    }

    public void setQ6_maritalStatus(String val) {
        getSelfAssessment().setQ6_maritalStatus(val);
    }

    public String getQ7_spouseOccupation() {
        return getSelfAssessment().getQ7_spouseOccupation();
    }

    public void setQ7_spouseOccupation(String val) {
        getSelfAssessment().setQ7_spouseOccupation(val);
    }

    public String getQ8_children() {
        return getSelfAssessment().getQ8_children();
    }

    public void setQ8_children(String val) {
        getSelfAssessment().setQ8_children(val);
    }

    public String getQ9_hasRelativesInCompany() {
        return getSelfAssessment().getQ9_hasRelativesInCompany();
    }

    public void setQ9_hasRelativesInCompany(String val) {
        getSelfAssessment().setQ9_hasRelativesInCompany(val);
    }

    public String getQ10_relativesDetails() {
        return getSelfAssessment().getQ10_relativesDetails();
    }

    public void setQ10_relativesDetails(String val) {
        getSelfAssessment().setQ10_relativesDetails(val);
    }

    public String getQ11_siblingsOccupations() {
        return getSelfAssessment().getQ11_siblingsOccupations();
    }

    public void setQ11_siblingsOccupations(String val) {
        getSelfAssessment().setQ11_siblingsOccupations(val);
    }

    public String getQ12_hasTwoWheeler() {
        return getSelfAssessment().getQ12_hasTwoWheeler();
    }

    public void setQ12_hasTwoWheeler(String val) {
        getSelfAssessment().setQ12_hasTwoWheeler(val);
    }

    public String getQ13_hasAndroidPhone() {
        return getSelfAssessment().getQ13_hasAndroidPhone();
    }

    public void setQ13_hasAndroidPhone(String val) {
        getSelfAssessment().setQ13_hasAndroidPhone(val);
    }

    public String getQ14_knowsCarDriving() {
        return getSelfAssessment().getQ14_knowsCarDriving();
    }

    public void setQ14_knowsCarDriving(String val) {
        getSelfAssessment().setQ14_knowsCarDriving(val);
    }

    public String getQ15_willingToTravel() {
        return getSelfAssessment().getQ15_willingToTravel();
    }

    public void setQ15_willingToTravel(String val) {
        getSelfAssessment().setQ15_willingToTravel(val);
    }

    public String getQ16_covidVaccination() {
        return getSelfAssessment().getQ16_covidVaccination();
    }

    public void setQ16_covidVaccination(String val) {
        getSelfAssessment().setQ16_covidVaccination(val);
    }

    public String getQ17_positivePoints() {
        return getSelfAssessment().getQ17_positivePoints();
    }

    public void setQ17_positivePoints(String val) {
        getSelfAssessment().setQ17_positivePoints(val);
    }

    public String getQ18_negativePoints() {
        return getSelfAssessment().getQ18_negativePoints();
    }

    public void setQ18_negativePoints(String val) {
        getSelfAssessment().setQ18_negativePoints(val);
    }

    public String getQ19_lifeGoals() {
        return getSelfAssessment().getQ19_lifeGoals();
    }

    public void setQ19_lifeGoals(String val) {
        getSelfAssessment().setQ19_lifeGoals(val);
    }

    public String getQ20_improvementSuggestions() {
        return getSelfAssessment().getQ20_improvementSuggestions();
    }

    public void setQ20_improvementSuggestions(String val) {
        getSelfAssessment().setQ20_improvementSuggestions(val);
    }

    public String getQ20_willingRotationalShifts() {
        return getSelfAssessment().getQ20_willingRotationalShifts();
    }

    public void setQ20_willingRotationalShifts(String val) {
        getSelfAssessment().setQ20_willingRotationalShifts(val);
    }

    public String getQ21_isExperienced() {
        return getSelfAssessment().getQ21_isExperienced();
    }

    public void setQ21_isExperienced(String val) {
        getSelfAssessment().setQ21_isExperienced(val);
    }

    public String getQ22_totalExperience() {
        return getSelfAssessment().getQ22_totalExperience();
    }

    public void setQ22_totalExperience(String val) {
        getSelfAssessment().setQ22_totalExperience(val);
    }

    public String getQ23_coreExperience() {
        return getSelfAssessment().getQ23_coreExperience();
    }

    public void setQ23_coreExperience(String val) {
        getSelfAssessment().setQ23_coreExperience(val);
    }

    public String getQ24_prevNetSalary() {
        return getSelfAssessment().getQ24_prevNetSalary();
    }

    public void setQ24_prevNetSalary(String val) {
        getSelfAssessment().setQ24_prevNetSalary(val);
    }

    public String getQ25_prevGrossSalary() {
        return getSelfAssessment().getQ25_prevGrossSalary();
    }

    public void setQ25_prevGrossSalary(String val) {
        getSelfAssessment().setQ25_prevGrossSalary(val);
    }

    public String getQ26_expectedNetSalary() {
        return getSelfAssessment().getQ26_expectedNetSalary();
    }

    public void setQ26_expectedNetSalary(String val) {
        getSelfAssessment().setQ26_expectedNetSalary(val);
    }

    public String getQ27_expectedGrossSalary() {
        return getSelfAssessment().getQ27_expectedGrossSalary();
    }

    public void setQ27_expectedGrossSalary(String val) {
        getSelfAssessment().setQ27_expectedGrossSalary(val);
    }

    public String getQ28_pfHigherPension() {
        return getSelfAssessment().getQ28_pfHigherPension();
    }

    public void setQ28_pfHigherPension(String val) {
        getSelfAssessment().setQ28_pfHigherPension(val);
    }

    public String getQ29_pfDeductionAmount() {
        return getSelfAssessment().getQ29_pfDeductionAmount();
    }

    public void setQ29_pfDeductionAmount(String val) {
        getSelfAssessment().setQ29_pfDeductionAmount(val);
    }

    public String getQ30_alternativeDepartment() {
        return getSelfAssessment().getQ30_alternativeDepartment();
    }

    public void setQ30_alternativeDepartment(String val) {
        getSelfAssessment().setQ30_alternativeDepartment(val);
    }

    public String getQ31_prevLocation() {
        return getSelfAssessment().getQ31_prevLocation();
    }

    public void setQ31_prevLocation(String val) {
        getSelfAssessment().setQ31_prevLocation(val);
    }

    public String getQ32_prevShift() {
        return getSelfAssessment().getQ32_prevShift();
    }

    public void setQ32_prevShift(String val) {
        getSelfAssessment().setQ32_prevShift(val);
    }

    public String getQ33_reasonForLeaving() {
        return getSelfAssessment().getQ33_reasonForLeaving();
    }

    public void setQ33_reasonForLeaving(String val) {
        getSelfAssessment().setQ33_reasonForLeaving(val);
    }

    public String getQ34_noticePeriod() {
        return getSelfAssessment().getQ34_noticePeriod();
    }

    public void setQ34_noticePeriod(String val) {
        getSelfAssessment().setQ34_noticePeriod(val);
    }

    public String getQ35_prevDeptPosition() {
        return getSelfAssessment().getQ35_prevDeptPosition();
    }

    public void setQ35_prevDeptPosition(String val) {
        getSelfAssessment().setQ35_prevDeptPosition(val);
    }

    public String getQ36_prevDeptCount() {
        return getSelfAssessment().getQ36_prevDeptCount();
    }

    public void setQ36_prevDeptCount(String val) {
        getSelfAssessment().setQ36_prevDeptCount(val);
    }

    public String getQ37_prevHrMgr() {
        return getSelfAssessment().getQ37_prevHrMgr();
    }

    public void setQ37_prevHrMgr(String val) {
        getSelfAssessment().setQ37_prevHrMgr(val);
    }

    public String getQ38_handleMistake() {
        return getSelfAssessment().getQ38_handleMistake();
    }

    public void setQ38_handleMistake(String val) {
        getSelfAssessment().setQ38_handleMistake(val);
    }

    public String getQ39_handleOpinionDifference() {
        return getSelfAssessment().getQ39_handleOpinionDifference();
    }

    public void setQ39_handleOpinionDifference(String val) {
        getSelfAssessment().setQ39_handleOpinionDifference(val);
    }

    public String getQ40_computerSelfRating() {
        return getSelfAssessment().getQ40_computerSelfRating();
    }

    public void setQ40_computerSelfRating(String val) {
        getSelfAssessment().setQ40_computerSelfRating(val);
    }

    public String getQ41_hrMgrName() {
        return getSelfAssessment().getQ41_hrMgrName();
    }

    public void setQ41_hrMgrName(String val) {
        getSelfAssessment().setQ41_hrMgrName(val);
    }

    public String getQ42_hrMgrEmail() {
        return getSelfAssessment().getQ42_hrMgrEmail();
    }

    public void setQ42_hrMgrEmail(String val) {
        getSelfAssessment().setQ42_hrMgrEmail(val);
    }

    public String getQ43_hrMgrPhone() {
        return getSelfAssessment().getQ43_hrMgrPhone();
    }

    public void setQ43_hrMgrPhone(String val) {
        getSelfAssessment().setQ43_hrMgrPhone(val);
    }

    public String getQ44_vertHeadName() {
        return getSelfAssessment().getQ44_vertHeadName();
    }

    public void setQ44_vertHeadName(String val) {
        getSelfAssessment().setQ44_vertHeadName(val);
    }

    public String getQ45_vertHeadEmail() {
        return getSelfAssessment().getQ45_vertHeadEmail();
    }

    public void setQ45_vertHeadEmail(String val) {
        getSelfAssessment().setQ45_vertHeadEmail(val);
    }

    public String getQ46_vertHeadPhone() {
        return getSelfAssessment().getQ46_vertHeadPhone();
    }

    public void setQ46_vertHeadPhone(String val) {
        getSelfAssessment().setQ46_vertHeadPhone(val);
    }

    public String getQ47_hasInsurance() {
        return getSelfAssessment().getQ47_hasInsurance();
    }

    public void setQ47_hasInsurance(String val) {
        getSelfAssessment().setQ47_hasInsurance(val);
    }

    public String getQ48_insuranceNumber() {
        return getSelfAssessment().getQ48_insuranceNumber();
    }

    public void setQ48_insuranceNumber(String val) {
        getSelfAssessment().setQ48_insuranceNumber(val);
    }

    public Long getMgrCountryId() {
        return getSelfAssessment().getMgrCountryId();
    }

    public void setMgrCountryId(Long val) {
        getSelfAssessment().setMgrCountryId(val);
    }

    public Long getVertHeadCountryId() {
        return getSelfAssessment().getVertHeadCountryId();
    }

    public void setVertHeadCountryId(Long val) {
        getSelfAssessment().setVertHeadCountryId(val);
    }

    // === ATS ===
    public Date getApplicantDate() {
        return this.applicantDate;
    }

    public void setApplicantDate(Date val) {
        this.applicantDate = val;
    }

    public Integer getAge() {
        return this.age;
    }

    public void setAge(Integer val) {
        this.age = val;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getCallStatus() {
        return this.callStatus;
    }

    public void setCallStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster val) {
        this.callStatus = val;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getInterviewStatus() {
        return this.interviewStatus;
    }

    public void setInterviewStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster val) {
        this.interviewStatus = val;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getOfferStatus() {
        return this.offerStatus;
    }

    public void setOfferStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster val) {
        this.offerStatus = val;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getVerificationStatus() {
        return this.verificationStatus;
    }

    public void setVerificationStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster val) {
        this.verificationStatus = val;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getAtsOverallStatus() {
        return this.atsOverallStatus;
    }

    public void setAtsOverallStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster val) {
        this.atsOverallStatus = val;
    }

    public String getCallLetterDate() {
        return this.callLetterDate;
    }

    public void setCallLetterDate(String val) {
        this.callLetterDate = val;
    }

    public String getCallLetterTime() {
        return this.callLetterTime;
    }

    public void setCallLetterTime(String val) {
        this.callLetterTime = val;
    }

    public String getResumePath() {
        return this.resumePath;
    }

    public void setResumePath(String val) {
        this.resumePath = val;
    }

    public String getAadharPath() {
        return this.aadharPath;
    }

    public void setAadharPath(String val) {
        this.aadharPath = val;
    }

    public String getPayslipPath() {
        return this.payslipPath;
    }

    public void setPayslipPath(String val) {
        this.payslipPath = val;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getPhotoVerifiedStatus() {
        return this.photoVerifiedStatus;
    }

    public void setPhotoVerifiedStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster val) {
        this.photoVerifiedStatus = val;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getResumeVerifiedStatus() {
        return this.resumeVerifiedStatus;
    }

    public void setResumeVerifiedStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster val) {
        this.resumeVerifiedStatus = val;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getPayslipVerifiedStatus() {
        return this.payslipVerifiedStatus;
    }

    public void setPayslipVerifiedStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster val) {
        this.payslipVerifiedStatus = val;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getAadharVerifiedStatus() {
        return this.aadharVerifiedStatus;
    }

    public void setAadharVerifiedStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster val) {
        this.aadharVerifiedStatus = val;
    }

    public String getPhotoRejectReason() {
        return this.photoRejectReason;
    }

    public void setPhotoRejectReason(String val) {
        this.photoRejectReason = val;
    }

    public String getResumeRejectReason() {
        return this.resumeRejectReason;
    }

    public void setResumeRejectReason(String val) {
        this.resumeRejectReason = val;
    }

    public String getPayslipRejectReason() {
        return this.payslipRejectReason;
    }

    public void setPayslipRejectReason(String val) {
        this.payslipRejectReason = val;
    }

    public String getAadharRejectReason() {
        return this.aadharRejectReason;
    }

    public void setAadharRejectReason(String val) {
        this.aadharRejectReason = val;
    }

    public String getNextSalaryHikeMonth() {
        return this.nextSalaryHikeMonth;
    }

    public void setNextSalaryHikeMonth(String val) {
        this.nextSalaryHikeMonth = val;
    }

    public BigDecimal getMinimumAmount() {
        return this.minimumAmount;
    }

    public void setMinimumAmount(BigDecimal val) {
        this.minimumAmount = val;
    }

    public BigDecimal getMaximumAmount() {
        return this.maximumAmount;
    }

    public void setMaximumAmount(BigDecimal val) {
        this.maximumAmount = val;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getBackgroundVerificationStatus() {
        return this.backgroundVerificationStatus;
    }

    public void setBackgroundVerificationStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster val) {
        this.backgroundVerificationStatus = val;
    }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getSelfAssessmentStatus() {
        return getSelfAssessment().getSelfAssessmentStatus();
    }

    public void setSelfAssessmentStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster val) {
        getSelfAssessment().setSelfAssessmentStatus(val);
    }

    public Integer getCurrentStep() {
        return getSelfAssessment().getCurrentStep();
    }

    public void setCurrentStep(Integer val) {
        getSelfAssessment().setCurrentStep(val);
    }

    public Date getLastDraftSavedDate() {
        return getSelfAssessment().getLastDraftSavedDate();
    }

    public void setLastDraftSavedDate(Date val) {
        getSelfAssessment().setLastDraftSavedDate(val);
    }

    public String getIsRehired() {
        return this.isRehired;
    }

    public void setIsRehired(String val) {
        this.isRehired = val;
    }

    public String getPreviousEmpCode() {
        return this.previousEmpCode;
    }

    public void setPreviousEmpCode(String val) {
        this.previousEmpCode = val;
    }

    public Date getArchivedDate() {
        return this.archivedDate;
    }

    public void setArchivedDate(Date val) {
        this.archivedDate = val;
    }

    public String getFromWhere() {
        return this.fromWhere;
    }

    public void setFromWhere(String val) {
        this.fromWhere = val;
    }

    public String getApplicantCode() {
        return this.applicantCode;
    }

    public void setApplicantCode(String val) {
        this.applicantCode = val;
    }

    // === Transient mappings for Elements ===
    @Transient
    private String auditorFileInfo;

    @Transient
    private String auditeeFileInfo;

    @Transient
    private String ncrApproverFileInfo;

    @Transient
    private String taskVerifierFileInfo;

    @Transient
    private String taskTesterFileInfo;

    @Transient
    private String chairedFileInfo;

    @Transient
    private String hostFileInfo;

    @Transient
    private String participantsFileInfo;

    public String getAuditorFileInfo() {
        return this.auditorFileInfo;
    }

    public void setAuditorFileInfo(String auditorFileInfo) {
        this.auditorFileInfo = auditorFileInfo;
        if (getAbility().getAuditorFileList() == null) {
            getAbility().setAuditorFileList(new java.util.ArrayList<>());
        }
        getAbility().getAuditorFileList().clear();
        if (auditorFileInfo != null && !auditorFileInfo.trim().isEmpty()) {
            getAbility().getAuditorFileList().addAll(java.util.Arrays.asList(auditorFileInfo.split(",")));
        }
    }

    public String getAuditeeFileInfo() {
        return this.auditeeFileInfo;
    }

    public void setAuditeeFileInfo(String auditeeFileInfo) {
        this.auditeeFileInfo = auditeeFileInfo;
        if (getAbility().getAuditeeFileList() == null) {
            getAbility().setAuditeeFileList(new java.util.ArrayList<>());
        }
        getAbility().getAuditeeFileList().clear();
        if (auditeeFileInfo != null && !auditeeFileInfo.trim().isEmpty()) {
            getAbility().getAuditeeFileList().addAll(java.util.Arrays.asList(auditeeFileInfo.split(",")));
        }
    }

    public String getNcrApproverFileInfo() {
        return this.ncrApproverFileInfo;
    }

    public void setNcrApproverFileInfo(String ncrApproverFileInfo) {
        this.ncrApproverFileInfo = ncrApproverFileInfo;
        if (getAbility().getNcrApproverFileList() == null) {
            getAbility().setNcrApproverFileList(new java.util.ArrayList<>());
        }
        getAbility().getNcrApproverFileList().clear();
        if (ncrApproverFileInfo != null && !ncrApproverFileInfo.trim().isEmpty()) {
            getAbility().getNcrApproverFileList().addAll(java.util.Arrays.asList(ncrApproverFileInfo.split(",")));
        }
    }

    public String getTaskVerifierFileInfo() {
        return this.taskVerifierFileInfo;
    }

    public void setTaskVerifierFileInfo(String taskVerifierFileInfo) {
        this.taskVerifierFileInfo = taskVerifierFileInfo;
        if (getAbility().getTaskVerifierFileList() == null) {
            getAbility().setTaskVerifierFileList(new java.util.ArrayList<>());
        }
        getAbility().getTaskVerifierFileList().clear();
        if (taskVerifierFileInfo != null && !taskVerifierFileInfo.trim().isEmpty()) {
            getAbility().getTaskVerifierFileList().addAll(java.util.Arrays.asList(taskVerifierFileInfo.split(",")));
        }
    }

    public String getTaskTesterFileInfo() {
        return this.taskTesterFileInfo;
    }

    public void setTaskTesterFileInfo(String taskTesterFileInfo) {
        this.taskTesterFileInfo = taskTesterFileInfo;
        if (getAbility().getTaskTesterFileList() == null) {
            getAbility().setTaskTesterFileList(new java.util.ArrayList<>());
        }
        getAbility().getTaskTesterFileList().clear();
        if (taskTesterFileInfo != null && !taskTesterFileInfo.trim().isEmpty()) {
            getAbility().getTaskTesterFileList().addAll(java.util.Arrays.asList(taskTesterFileInfo.split(",")));
        }
    }

    public String getChairedFileInfo() {
        return this.chairedFileInfo;
    }

    public void setChairedFileInfo(String chairedFileInfo) {
        this.chairedFileInfo = chairedFileInfo;
        if (getAbility().getChairedFileList() == null) {
            getAbility().setChairedFileList(new java.util.ArrayList<>());
        }
        getAbility().getChairedFileList().clear();
        if (chairedFileInfo != null && !chairedFileInfo.trim().isEmpty()) {
            getAbility().getChairedFileList().addAll(java.util.Arrays.asList(chairedFileInfo.split(",")));
        }
    }

    public String getHostFileInfo() {
        return this.hostFileInfo;
    }

    public void setHostFileInfo(String hostFileInfo) {
        this.hostFileInfo = hostFileInfo;
        if (getAbility().getHostFileList() == null) {
            getAbility().setHostFileList(new java.util.ArrayList<>());
        }
        getAbility().getHostFileList().clear();
        if (hostFileInfo != null && !hostFileInfo.trim().isEmpty()) {
            getAbility().getHostFileList().addAll(java.util.Arrays.asList(hostFileInfo.split(",")));
        }
    }

    public String getParticipantsFileInfo() {
        return this.participantsFileInfo;
    }

    public void setParticipantsFileInfo(String participantsFileInfo) {
        this.participantsFileInfo = participantsFileInfo;
        if (getAbility().getParticipantsFileList() == null) {
            getAbility().setParticipantsFileList(new java.util.ArrayList<>());
        }
        getAbility().getParticipantsFileList().clear();
        if (participantsFileInfo != null && !participantsFileInfo.trim().isEmpty()) {
            getAbility().getParticipantsFileList().addAll(java.util.Arrays.asList(participantsFileInfo.split(",")));
        }
    }



    /**
     * Reads the authenticated username directly from the Spring Security context
     * WITHOUT executing any database query. This is safe to call inside JPA
     * lifecycle callbacks (@PrePersist / @PreUpdate) because those run during
     * Hibernate's flush cycle — any DB query there triggers a recursive auto-flush
     * that hangs indefinitely.
     */
    private static String getCurrentUserIdNoQuery() {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                Object principal = auth.getPrincipal();
                if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                    return ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
                } else if (principal instanceof String && !"anonymousUser".equals(principal)) {
                    return (String) principal;
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    @PrePersist
    protected void onCreate() {
        String currentUserId = getCurrentUserIdNoQuery();
        if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
        this.updatedBy = null;

        if (this.createdDate == null) {
            this.createdDate = new Date();
        }
        if (firstName != null && lastName != null) {
            employeeName = (firstName + " " + lastName).trim();
        } else if (firstName != null) {
            employeeName = firstName;
        }

        // Initialize child entity keys
        // initChildEntities(); // REMOVED: Instantiating @MapsId children inside
        // PrePersist causes transient cascade errors
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = getCurrentUserIdNoQuery();
        this.updatedBy = currentUserId;
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
        }

        updatedDate = new Date();
        if (firstName != null && lastName != null) {
            employeeName = (firstName + " " + lastName).trim();
        } else if (firstName != null) {
            employeeName = firstName;
        }

        // Ensure child entities are instantiated
        // initChildEntities(); // REMOVED: Instantiating @MapsId children inside
        // PreUpdate causes transient cascade errors
    }

    // Backward-compatible alias methods
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

    @Transient
    private String leaveAllowed;

    @Transient
    private String odAllowed;

    @Transient
    private String permissionRequest;

    public String getLeaveAllowed() {
        return leaveAllowed;
    }

    public void setLeaveAllowed(String leaveAllowed) {
        this.leaveAllowed = leaveAllowed;
    }

    public String getOdAllowed() {
        return odAllowed;
    }

    public void setOdAllowed(String odAllowed) {
        this.odAllowed = odAllowed;
    }

    public String getPermissionRequest() {
        return permissionRequest;
    }

    public void setPermissionRequest(String permissionRequest) {
        this.permissionRequest = permissionRequest;
    }
}



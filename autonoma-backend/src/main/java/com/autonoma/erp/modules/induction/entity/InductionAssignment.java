package com.autonoma.erp.modules.induction.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_INDUCTION_ASSIGNMENT")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(value = { "hibernateLazyInitializer", "handler" }, ignoreUnknown = true)
public class InductionAssignment extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "EMP_CODE", nullable = false)
    private String empCode;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("empName")
    private String empName;

    @Column(name = "OLD_EMP_CODE")
    private String oldEmpCode;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("codeInMaster")
    private String codeInMaster;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("department")
    private String department;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("designation")
    private String designation;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("inductionRound")
    private String inductionRound; // HR, QMS, DEPARTMENT, MANAGEMENT

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("screeningLevel")
    private String screeningLevel; // Level 1, 2, 3, 4

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("trainerName")
    private String trainerName; // Induction Person

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTMENT_ID", referencedColumnName = "ID")
    private com.autonoma.erp.modules.hr.orgstructure.entity.Department departmentEntity;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DESIGNATION_ID", referencedColumnName = "ID")
    private com.autonoma.erp.modules.hr.orgstructure.entity.Designation designationEntity;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ROUND_ID", referencedColumnName = "ID", nullable = false)
    private com.autonoma.erp.modules.induction.entity.InductionRoundMaster roundEntity;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "LEVEL_ID", referencedColumnName = "id", nullable = false)
    private com.autonoma.erp.modules.hr.orgstructure.entity.LevelMaster levelEntity;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TRAINER_ID", referencedColumnName = "ID", nullable = false)
    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster trainerEntity;

    @PostLoad
    public void populateTransientFields() {
        if (this.departmentEntity != null) {
            this.department = this.departmentEntity.getDepartmentName();
        }
        if (this.designationEntity != null) {
            this.designation = this.designationEntity.getDesignationName();
        }
        if (this.roundEntity != null) {
            this.inductionRound = this.roundEntity.getRoundName();
        }
        if (this.levelEntity != null) {
            String name = this.levelEntity.getLevelName();
            if (name != null && name.startsWith("L")) {
                this.screeningLevel = "Level " + name.substring(1);
            } else {
                this.screeningLevel = name;
            }
        }
        if (this.trainerEntity != null) {
            this.trainerName = this.trainerEntity.getEmployeeName();
        }
    }

    @Column(name = "INDUCTION_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Kolkata")
    private Date inductionDate;

    @Column(name = "INDUCTION_TIME", nullable = false)
    private String inductionTime;

    @Column(name = "CURRENT_STATUS")
    private String currentStatus = "PENDING"; // PENDING, TRAINING GIVEN, COMPLETED



    @Column(name = "REMARKS", columnDefinition = "NVARCHAR(MAX)")
    private String remarks;

    @Column(name = "TRAINER_EMP_CODE", length = 50)
    private String trainerEmpCode;

    @Column(name = "AVERAGE_RATING")
    private Double averageRating;

    @Column(name = "TRAINING_STARTED_AT")
    @Temporal(TemporalType.TIMESTAMP)
    private Date trainingStartedAt;

    @Column(name = "TRAINING_COMPLETED_AT")
    @Temporal(TemporalType.TIMESTAMP)
    private Date trainingCompletedAt;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Column(name = "FEEDBACK_TOKEN", length = 255)
    private String feedbackToken;

    @Column(name = "FEEDBACK_TOKEN_ACTIVE")
    private Boolean feedbackTokenActive = false;

    // Explicit getter/setter for isActive
    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getFeedbackToken() {
        return feedbackToken;
    }

    public void setFeedbackToken(String feedbackToken) {
        this.feedbackToken = feedbackToken;
    }

    public Boolean getFeedbackTokenActive() {
        return feedbackTokenActive;
    }

    public void setFeedbackTokenActive(Boolean feedbackTokenActive) {
        this.feedbackTokenActive = feedbackTokenActive;
    }

    // Explicit Getters and Setters for all other fields
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

    public String getEmpName() {
        return empName;
    }

    public void setEmpName(String empName) {
        this.empName = empName;
    }

    public String getOldEmpCode() {
        return oldEmpCode;
    }

    public void setOldEmpCode(String oldEmpCode) {
        this.oldEmpCode = oldEmpCode;
    }

    public String getCodeInMaster() {
        return codeInMaster;
    }

    public void setCodeInMaster(String codeInMaster) {
        this.codeInMaster = codeInMaster;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getInductionRound() {
        return inductionRound;
    }

    public void setInductionRound(String inductionRound) {
        this.inductionRound = inductionRound;
    }

    public String getScreeningLevel() {
        return screeningLevel;
    }

    public void setScreeningLevel(String screeningLevel) {
        this.screeningLevel = screeningLevel;
    }

    public String getTrainerName() {
        return trainerName;
    }

    public void setTrainerName(String trainerName) {
        this.trainerName = trainerName;
    }

    public com.autonoma.erp.modules.hr.orgstructure.entity.Department getDepartmentEntity() {
        return departmentEntity;
    }

    public void setDepartmentEntity(com.autonoma.erp.modules.hr.orgstructure.entity.Department departmentEntity) {
        this.departmentEntity = departmentEntity;
    }

    public com.autonoma.erp.modules.hr.orgstructure.entity.Designation getDesignationEntity() {
        return designationEntity;
    }

    public void setDesignationEntity(com.autonoma.erp.modules.hr.orgstructure.entity.Designation designationEntity) {
        this.designationEntity = designationEntity;
    }

    public com.autonoma.erp.modules.induction.entity.InductionRoundMaster getRoundEntity() {
        return roundEntity;
    }

    public void setRoundEntity(com.autonoma.erp.modules.induction.entity.InductionRoundMaster roundEntity) {
        this.roundEntity = roundEntity;
    }

    public com.autonoma.erp.modules.hr.orgstructure.entity.LevelMaster getLevelEntity() {
        return levelEntity;
    }

    public void setLevelEntity(com.autonoma.erp.modules.hr.orgstructure.entity.LevelMaster levelEntity) {
        this.levelEntity = levelEntity;
    }

    public com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster getTrainerEntity() {
        return trainerEntity;
    }

    public void setTrainerEntity(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster trainerEntity) {
        this.trainerEntity = trainerEntity;
    }

    public Date getInductionDate() {
        return inductionDate;
    }

    public void setInductionDate(Date inductionDate) {
        this.inductionDate = inductionDate;
    }

    public String getInductionTime() {
        return inductionTime;
    }

    public void setInductionTime(String inductionTime) {
        this.inductionTime = inductionTime;
    }

    public String getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(String currentStatus) {
        this.currentStatus = currentStatus;
    }



    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getTrainerEmpCode() {
        return trainerEmpCode;
    }

    public void setTrainerEmpCode(String trainerEmpCode) {
        this.trainerEmpCode = trainerEmpCode;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Date getTrainingStartedAt() {
        return trainingStartedAt;
    }

    public void setTrainingStartedAt(Date trainingStartedAt) {
        this.trainingStartedAt = trainingStartedAt;
    }

    public Date getTrainingCompletedAt() {
        return trainingCompletedAt;
    }

    public void setTrainingCompletedAt(Date trainingCompletedAt) {
        this.trainingCompletedAt = trainingCompletedAt;
    }
}

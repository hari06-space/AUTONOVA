package com.autonoma.erp.modules.induction.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_INDUCTION_REASSIGNMENT_LOG")
@Data
@NoArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(value = { "hibernateLazyInitializer", "handler" }, ignoreUnknown = true)
public class InductionReassignmentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Transient
    private String traineeName;

    @Transient
    private String traineeEmpCode;

    @Transient
    private String inductionRound;

    @Transient
    private String previousAssessor;

    @Transient
    private String previousAssessorEmpCode;

    @Transient
    private String newAssessor;

    @Transient
    private String newAssessorEmpCode;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TRAINEE_ID")
    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster trainee;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ROUND_ID")
    private com.autonoma.erp.modules.induction.entity.InductionRoundMaster round;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PREVIOUS_ASSESSOR_ID")
    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster previousAssessorEntity;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NEW_ASSESSOR_ID")
    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster newAssessorEntity;

    @PostLoad
    public void populateTransientFields() {
        if (this.trainee != null) {
            this.traineeName = this.trainee.getEmployeeName();
            this.traineeEmpCode = this.trainee.getEmpCode();
        }
        if (this.round != null) {
            this.inductionRound = this.round.getRoundName();
        }
        if (this.previousAssessorEntity != null) {
            this.previousAssessor = this.previousAssessorEntity.getEmployeeName();
            this.previousAssessorEmpCode = this.previousAssessorEntity.getEmpCode();
        }
        if (this.newAssessorEntity != null) {
            this.newAssessor = this.newAssessorEntity.getEmployeeName();
            this.newAssessorEmpCode = this.newAssessorEntity.getEmpCode();
        }
    }

    @Column(name = "REASSIGNMENT_REASON", columnDefinition = "NVARCHAR(MAX)")
    private String reassignmentReason;

    @Column(name = "REASSIGNED_BY", length = 100)
    private String reassignedBy;

    @Column(name = "REASSIGNED_DATE_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    private Date reassignedDateTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTraineeName() { return traineeName; }
    public void setTraineeName(String traineeName) { this.traineeName = traineeName; }
    public String getTraineeEmpCode() { return traineeEmpCode; }
    public void setTraineeEmpCode(String traineeEmpCode) { this.traineeEmpCode = traineeEmpCode; }
    public String getInductionRound() { return inductionRound; }
    public void setInductionRound(String inductionRound) { this.inductionRound = inductionRound; }
    public String getPreviousAssessor() { return previousAssessor; }
    public void setPreviousAssessor(String previousAssessor) { this.previousAssessor = previousAssessor; }
    public String getPreviousAssessorEmpCode() { return previousAssessorEmpCode; }
    public void setPreviousAssessorEmpCode(String previousAssessorEmpCode) { this.previousAssessorEmpCode = previousAssessorEmpCode; }
    public String getNewAssessor() { return newAssessor; }
    public void setNewAssessor(String newAssessor) { this.newAssessor = newAssessor; }
    public String getNewAssessorEmpCode() { return newAssessorEmpCode; }
    public void setNewAssessorEmpCode(String newAssessorEmpCode) { this.newAssessorEmpCode = newAssessorEmpCode; }
    public com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster getTrainee() { return trainee; }
    public void setTrainee(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster trainee) { this.trainee = trainee; }
    public com.autonoma.erp.modules.induction.entity.InductionRoundMaster getRound() { return round; }
    public void setRound(com.autonoma.erp.modules.induction.entity.InductionRoundMaster round) { this.round = round; }
    public com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster getPreviousAssessorEntity() { return previousAssessorEntity; }
    public void setPreviousAssessorEntity(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster previousAssessorEntity) { this.previousAssessorEntity = previousAssessorEntity; }
    public com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster getNewAssessorEntity() { return newAssessorEntity; }
    public void setNewAssessorEntity(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster newAssessorEntity) { this.newAssessorEntity = newAssessorEntity; }
    public String getReassignmentReason() { return reassignmentReason; }
    public void setReassignmentReason(String reassignmentReason) { this.reassignmentReason = reassignmentReason; }
    public String getReassignedBy() { return reassignedBy; }
    public void setReassignedBy(String reassignedBy) { this.reassignedBy = reassignedBy; }
    public Date getReassignedDateTime() { return reassignedDateTime; }
    public void setReassignedDateTime(Date reassignedDateTime) { this.reassignedDateTime = reassignedDateTime; }
}

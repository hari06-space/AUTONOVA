package com.autonoma.erp.modules.induction.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_INDUCTION_TRAINING")
@Data
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(value = { "hibernateLazyInitializer", "handler" }, ignoreUnknown = true)
public class InductionTrainingDetail extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ASSIGNMENT_ID", nullable = false)
    private Long assignmentId;

    @Column(name = "INDUCTION_MASTER_ID", nullable = false)
    private Long inductionMasterId;

    // === Trainer fills these ===
    @Column(name = "TRAINER_STATUS", length = 20)
    private String trainerStatus = "PENDING"; // PENDING, COMPLETED

    @Column(name = "TRAINER_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String trainerComments;

    @Column(name = "SKILL_RATING")
    private Integer skillRating; // 1-5

    // === Trainee fills these ===
    @Column(name = "TRAINEE_STATUS", length = 20)
    private String traineeStatus; // UNDERSTOOD, NEED MORE TRAINING

    @Column(name = "TRAINEE_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String traineeComments;

    // === Attachment ===
    @Transient
    private String attachmentPath;

    // === Transient: loaded from InductionMaster for display ===
    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("inductionDetails")
    private String inductionDetails;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("answer")
    private String answer;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("inductionRound")
    private String inductionRound;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("attachmentRequired")
    private String attachmentRequired;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("criteriaAttachment")
    private String criteriaAttachment;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    // Explicit getter/setter for isActive
    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAssignmentId() { return assignmentId; }
    public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
    public String getTraineeStatus() { return traineeStatus; }
    public void setTraineeStatus(String traineeStatus) { this.traineeStatus = traineeStatus; }
    public String getTraineeComments() { return traineeComments; }
    public void setTraineeComments(String traineeComments) { this.traineeComments = traineeComments; }
    public Long getInductionMasterId() { return inductionMasterId; }
    public void setInductionMasterId(Long inductionMasterId) { this.inductionMasterId = inductionMasterId; }
    public String getAttachmentPath() { return attachmentPath; }
    public void setAttachmentPath(String attachmentPath) { this.attachmentPath = attachmentPath; }
    public String getInductionDetails() { return inductionDetails; }
    public void setInductionDetails(String inductionDetails) { this.inductionDetails = inductionDetails; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public String getAttachmentRequired() { return attachmentRequired; }
    public void setAttachmentRequired(String attachmentRequired) { this.attachmentRequired = attachmentRequired; }
    public String getCriteriaAttachment() { return criteriaAttachment; }
    public void setCriteriaAttachment(String criteriaAttachment) { this.criteriaAttachment = criteriaAttachment; }
    public String getTrainerStatus() { return trainerStatus; }
    public void setTrainerStatus(String trainerStatus) { this.trainerStatus = trainerStatus; }
    public String getTrainerComments() { return trainerComments; }
    public void setTrainerComments(String trainerComments) { this.trainerComments = trainerComments; }
    public Integer getSkillRating() { return skillRating; }
    public void setSkillRating(Integer skillRating) { this.skillRating = skillRating; }
    public String getInductionRound() { return inductionRound; }
    public void setInductionRound(String inductionRound) { this.inductionRound = inductionRound; }
}

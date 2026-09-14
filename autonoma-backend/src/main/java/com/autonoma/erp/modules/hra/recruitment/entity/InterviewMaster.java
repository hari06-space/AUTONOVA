package com.autonoma.erp.modules.hra.recruitment.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_INTERVIEW")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewMaster extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CRITERIA_DETAILS", length = 300, nullable = false)
    private String criteriaDetails;

    @Column(name = "ANSWER", length = 2000, nullable = false)
    private String answer;

    @Transient
    private String departmentCodes;

    @Transient
    private String levelCodes;

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "INTERVIEW_ID", nullable = false)
    private java.util.Set<InterviewDepartmentMapping> departmentMappings = new java.util.HashSet<>();

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "INTERVIEW_ID", nullable = false)
    private java.util.Set<InterviewLevelMapping> levelMappings = new java.util.HashSet<>();

    public String getDepartmentCodes() {
        if (departmentMappings == null || departmentMappings.isEmpty()) {
            return this.departmentCodes;
        }
        return departmentMappings.stream()
                .map(m -> m.getDepartmentId() != null ? m.getDepartmentId().toString() : null)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.joining(","));
    }

    public void setDepartmentCodes(String departmentCodes) {
        this.departmentCodes = departmentCodes;
    }

    public String getLevelCodes() {
        if (levelMappings == null || levelMappings.isEmpty()) {
            return this.levelCodes;
        }
        return levelMappings.stream()
                .map(m -> m.getDesignationLevel() != null ? m.getDesignationLevel().getLevel() : null)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.joining(","));
    }

    public void setLevelCodes(String levelCodes) {
        this.levelCodes = levelCodes;
    }

    @Column(name = "INTERVIEW_ROUND")
    private String interviewRound; // TECHNICAL, HR, MANAGEMENT, SPECIAL ROUND

    @Column(name = "ATTACHMENT_REQUIRED")
    private String attachmentRequired; // YES, NO

    @Column(name = "INTERVIEW_ATTACHMENT", length = 1000)
    private String interviewAttachment;

    @Column(name = "STATUS", columnDefinition = "bit")
    private Boolean status; // true = Active, false = Inactive

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCriteriaDetails() { return criteriaDetails; }
    public void setCriteriaDetails(String criteriaDetails) { this.criteriaDetails = criteriaDetails; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public String getInterviewRound() { return interviewRound; }
    public void setInterviewRound(String interviewRound) { this.interviewRound = interviewRound; }
    public String getAttachmentRequired() { return attachmentRequired; }
    public void setAttachmentRequired(String attachmentRequired) { this.attachmentRequired = attachmentRequired; }
    public String getInterviewAttachment() { return interviewAttachment; }
    public void setInterviewAttachment(String interviewAttachment) { this.interviewAttachment = interviewAttachment; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
    public java.util.Set<InterviewDepartmentMapping> getDepartmentMappings() { return departmentMappings; }
    public void setDepartmentMappings(java.util.Set<InterviewDepartmentMapping> departmentMappings) { this.departmentMappings = departmentMappings; }
    public java.util.Set<InterviewLevelMapping> getLevelMappings() { return levelMappings; }
    public void setLevelMappings(java.util.Set<InterviewLevelMapping> levelMappings) { this.levelMappings = levelMappings; }
}

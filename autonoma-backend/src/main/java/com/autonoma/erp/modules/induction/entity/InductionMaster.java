package com.autonoma.erp.modules.induction.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_INDUCTION")
@Data
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(value = { "hibernateLazyInitializer", "handler" }, ignoreUnknown = true)
public class InductionMaster extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "INDUCTION_DETAILS", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String inductionDetails;

    @Column(name = "ANSWER", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String answer;

    @Transient
    private String departmentCodes; // Comma separated list of department codes

    @Transient
    private String levelCodes; // Comma separated list of levels (L1, L2, etc.)

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "INDUCTION_ROUND_ID")
    private InductionRoundMaster inductionRoundMaster;

    @Transient
    private String inductionRound; // HR, QMS, DEPARTMENT, MANAGEMENT

    public String getInductionRound() {
        if (this.inductionRoundMaster != null) {
            return this.inductionRoundMaster.getRoundName();
        }
        return this.inductionRound;
    }

    public void setInductionRound(String inductionRound) {
        this.inductionRound = inductionRound;
    }

    @Column(name = "ATTACHMENT_REQUIRED")
    private String attachmentRequired; // YES, NO

    @Transient
    private String inductionAttachment;

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
    public String getInductionDetails() { return inductionDetails; }
    public void setInductionDetails(String inductionDetails) { this.inductionDetails = inductionDetails; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public String getDepartmentCodes() { return departmentCodes; }
    public void setDepartmentCodes(String departmentCodes) { this.departmentCodes = departmentCodes; }
    public String getLevelCodes() { return levelCodes; }
    public void setLevelCodes(String levelCodes) { this.levelCodes = levelCodes; }
    public InductionRoundMaster getInductionRoundMaster() { return inductionRoundMaster; }
    public void setInductionRoundMaster(InductionRoundMaster inductionRoundMaster) { this.inductionRoundMaster = inductionRoundMaster; }
    public String getAttachmentRequired() { return attachmentRequired; }
    public void setAttachmentRequired(String attachmentRequired) { this.attachmentRequired = attachmentRequired; }
    public String getInductionAttachment() { return inductionAttachment; }
    public void setInductionAttachment(String inductionAttachment) { this.inductionAttachment = inductionAttachment; }
}

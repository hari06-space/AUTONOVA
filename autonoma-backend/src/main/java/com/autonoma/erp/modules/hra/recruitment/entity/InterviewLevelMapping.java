package com.autonoma.erp.modules.hra.recruitment.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "HR_INTERVIEW_LEVEL_MAPPING")
@Getter
@Setter
public class InterviewLevelMapping extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "INTERVIEW_ID", insertable = false, updatable = false)
    private Long interviewId;

    @Column(name = "LEVEL_ID", nullable = false)
    private Long levelId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "LEVEL_ID", insertable = false, updatable = false)
    private DesignationLevel designationLevel;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInterviewId() { return interviewId; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }
    public Long getLevelId() { return levelId; }
    public void setLevelId(Long levelId) { this.levelId = levelId; }
    public DesignationLevel getDesignationLevel() { return designationLevel; }
    public void setDesignationLevel(DesignationLevel designationLevel) { this.designationLevel = designationLevel; }
}

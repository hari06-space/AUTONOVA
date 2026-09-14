package com.autonoma.erp.modules.qms.satisfaction.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "QMS_SATISFACTION_FEEDBACK_ENTRY")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QmsFeedbackEntry extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SATISFACTION_TYPE", length = 100, nullable = false)
    private String satisfactionType;

    @Column(name = "SUBMITTED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedDate;

    @Column(name = "SUBMITTED_BY", length = 100)
    private String submittedBy;

    @Column(name = "TOTAL_SCORE")
    private Integer totalScore;

    @Column(name = "AVERAGE_SCORE")
    private Double averageScore;

    @Column(name = "GENERAL_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String generalComments;

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QmsFeedbackResponse> responses;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSatisfactionType() { return satisfactionType; }
    public void setSatisfactionType(String satisfactionType) { this.satisfactionType = satisfactionType; }
    public Date getSubmittedDate() { return submittedDate; }
    public void setSubmittedDate(Date submittedDate) { this.submittedDate = submittedDate; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public Integer getTotalScore() { return totalScore; }
    public void setTotalScore(Integer totalScore) { this.totalScore = totalScore; }
    public Double getAverageScore() { return averageScore; }
    public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }
    public String getGeneralComments() { return generalComments; }
    public void setGeneralComments(String generalComments) { this.generalComments = generalComments; }
    public List<QmsFeedbackResponse> getResponses() { return responses; }
    public void setResponses(List<QmsFeedbackResponse> responses) { this.responses = responses; }
}

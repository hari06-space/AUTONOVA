package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "QMS_SATISFACTION_FEEDBACK_ENTRY")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class SatisfactionFeedbackEntry extends BaseAuditEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "SATISFACTION_TYPE", length = 50, nullable = false)
    private String satisfactionType;

    @Column(name = "SUBMITTED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedDate = new Date();

    @Column(name = "SUBMITTED_BY", length = 100, nullable = false)
    private String submittedBy;

    @Column(name = "TOTAL_SCORE")
    private Integer totalScore;

    @Column(name = "AVERAGE_SCORE")
    private Double averageScore;

    @Column(name = "GENERAL_COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String generalComments;

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<SatisfactionFeedbackResponse> responses;

    public void setSatisfactionType(String satisfactionType) { this.satisfactionType = satisfactionType; }
    public void setGeneralComments(String generalComments) { this.generalComments = generalComments; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public void setSubmittedDate(Date submittedDate) { this.submittedDate = submittedDate; }
    public void setResponses(List<SatisfactionFeedbackResponse> responses) { this.responses = responses; }
    public void setTotalScore(Integer totalScore) { this.totalScore = totalScore; }
    public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }
}

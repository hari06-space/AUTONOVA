package com.autonoma.erp.modules.qms.satisfaction.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "QMS_SATISFACTION_FEEDBACK_RESPONSE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QmsFeedbackResponse extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ENTRY_ID", nullable = false)
    private QmsFeedbackEntry entry;

    @Column(name = "QUESTION_TEXT", columnDefinition = "NVARCHAR(MAX)")
    private String questionText;

    @Column(name = "RATING", length = 50)
    private String rating;

    @Column(name = "SCORE")
    private Integer score;

    @Column(name = "COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public QmsFeedbackEntry getEntry() { return entry; }
    public void setEntry(QmsFeedbackEntry entry) { this.entry = entry; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
}

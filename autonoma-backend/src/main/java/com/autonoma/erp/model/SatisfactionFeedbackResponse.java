package com.autonoma.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "QMS_SATISFACTION_FEEDBACK_RESPONSE")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class SatisfactionFeedbackResponse extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ENTRY_ID", nullable = false)
    @JsonIgnore
    private SatisfactionFeedbackEntry entry;

    @Column(name = "QUESTION_TEXT", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String questionText;

    @Column(name = "RATING", length = 50, nullable = false)
    private String rating; // Excellent, Very Good, Good, Moderate, Poor

    @Column(name = "SCORE", nullable = false)
    private Integer score; // 100, 75, 50, 25, 0

    @Column(name = "COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    public void setEntry(SatisfactionFeedbackEntry entry) { this.entry = entry; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public void setRating(String rating) { this.rating = rating; }
    public void setScore(Integer score) { this.score = score; }
    public Integer getScore() { return score; }
    public void setComments(String comments) { this.comments = comments; }
}

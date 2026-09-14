package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "INTERNAL_CUSTOMER_SATISFACTION_RESPONSE")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class InternalCustomerSatisfactionResponse extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MAPPING_ID", nullable = false)
    private InternalCustomerSatisfactionMapping mapping;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "QUESTION_ID", nullable = false)
    private SatisfactionCriteria question;

    @Column(name = "RATING", nullable = false, length = 50)
    private String rating; // Excellent, Very Good, Good, Moderate, Poor

    @Column(name = "SCORE", nullable = false)
    private Integer score; // 100, 75, 50, 25, 0

    @Column(name = "COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    public Long getId() { return id; }
    public SatisfactionCriteria getQuestion() { return question; }
    public void setMapping(InternalCustomerSatisfactionMapping mapping) { this.mapping = mapping; }
    public void setQuestion(SatisfactionCriteria question) { this.question = question; }
    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
}

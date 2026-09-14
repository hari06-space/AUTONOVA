package com.autonoma.erp.modules.qms.satisfaction.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity(name = "QmsEmployeeSatisfactionResponse")
@Table(name = "EMPLOYEE_SATISFACTION_RESPONSE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class EmployeeSatisfactionResponse extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", nullable = false)
    private EmployeeMaster employee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "QUESTION_ID", nullable = false)
    private QmsSatisfactionCriteria question;

    @Column(name = "FEEDBACK_CYCLE", length = 50, nullable = false)
    private String feedbackCycle; // e.g. "June 2026"

    @Column(name = "RATING", length = 50, nullable = false)
    private String rating; // Excellent, Very Good, Good, Moderate, Poor

    @Column(name = "SCORE", nullable = false)
    private Integer score; // 100, 75, 50, 25, 0

    @Column(name = "COMMENTS", columnDefinition = "NVARCHAR(MAX)")
    private String comments;

    @Column(name = "SUBMITTED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(EmployeeMaster employee) { this.employee = employee; }
    public QmsSatisfactionCriteria getQuestion() { return question; }
    public void setQuestion(QmsSatisfactionCriteria question) { this.question = question; }
    public String getFeedbackCycle() { return feedbackCycle; }
    public void setFeedbackCycle(String feedbackCycle) { this.feedbackCycle = feedbackCycle; }
    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public Date getSubmittedDate() { return submittedDate; }
    public void setSubmittedDate(Date submittedDate) { this.submittedDate = submittedDate; }
}

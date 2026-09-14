package com.autonoma.erp.modules.hra.recruitment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_APPLICANT_VERIFICATION_RESPONSE")
@Data
@NoArgsConstructor
public class ApplicantVerificationResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @Column(name = "ROLE", length = 50, nullable = false)
    private String role;

    @Column(name = "QUESTION_ID", nullable = false)
    private Long questionId;

    @Column(name = "RATING", nullable = false)
    private Integer rating;

    @Column(name = "FEEDBACK", length = 2000)
    private String feedback;

    @Column(name = "REASON", length = 2000)
    private String reason;

    @Column(name = "SUBMITTED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedDate = new Date();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public Date getSubmittedDate() { return submittedDate; }
    public void setSubmittedDate(Date submittedDate) { this.submittedDate = submittedDate; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public ApplicantVerificationResponse(Long id, Long employeeId, String role, Long questionId,
            Integer rating, String feedback, String reason, Date submittedDate) {
        this.id = id;
        this.employeeId = employeeId;
        this.role = role;
        this.questionId = questionId;
        this.rating = rating;
        this.feedback = feedback;
        this.reason = reason;
        this.submittedDate = submittedDate;
    }
}

package com.autonoma.erp.modules.hra.recruitment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_APPLICANT_VERIFICATION_SUBMISSION")
@Data
@NoArgsConstructor
public class ApplicantVerificationSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @Column(name = "ROLE", length = 50, nullable = false)
    private String role;

    @Column(name = "NAME", length = 255)
    private String name;

    @Column(name = "EMAIL", length = 255)
    private String email;

    @Column(name = "PHONE", length = 50)
    private String phone;

    @Column(name = "IS_SUBMITTED", nullable = false)
    private Boolean isSubmitted = false;

    @Column(name = "SUBMITTED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedDate;

    @Column(name = "TOKEN", length = 255)
    private String token;

    public ApplicantVerificationSubmission(Long id, Long employeeId, String role, String name, String email, String phone, Boolean isSubmitted, Date submittedDate, String token) {
        this.id = id;
        this.employeeId = employeeId;
        this.role = role;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.isSubmitted = isSubmitted;
        this.submittedDate = submittedDate;
        this.token = token;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Boolean getIsSubmitted() { return isSubmitted; }
    public void setIsSubmitted(Boolean isSubmitted) { this.isSubmitted = isSubmitted; }
    public Date getSubmittedDate() { return submittedDate; }
    public void setSubmittedDate(Date submittedDate) { this.submittedDate = submittedDate; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}

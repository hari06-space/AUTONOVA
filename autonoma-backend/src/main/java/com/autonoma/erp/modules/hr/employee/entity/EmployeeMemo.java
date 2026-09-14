package com.autonoma.erp.modules.hr.employee.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "EMPLOYEE_MEMO")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeMemo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", nullable = false)
    private EmployeeMaster employee;

    @Column(name = "MEMO_NUMBER", nullable = false, length = 50)
    private String memoNumber;

    @Column(name = "MEMO_TYPE", nullable = false, length = 20)
    private String memoType; // 'Positive Memo' or 'Negative Memo'

    @Column(name = "TO_EMAIL", nullable = false, length = 255)
    private String toEmail;

    @Column(name = "FROM_EMAIL", length = 255)
    private String fromEmail;

    @Column(name = "CC_EMAIL", length = 255)
    private String ccEmail;

    @Column(name = "SUBJECT", nullable = false, length = 255)
    private String subject;

    @Column(name = "BODY", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String body;

    @Column(name = "CLOSING_REMARKS", length = 500)
    private String closingRemarks;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Transient
    private String createdByName;

    @Transient
    private String reportingManagerName;

    @Transient
    private String reportingManagerSignatureUpload;

    @Transient
    private String hrRepresentativeName;

    @Transient
    private String hrRepresentativeSignatureUpload;

    @Column(name = "CREATED_DATE", nullable = false, updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate = new Date();

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @Column(name = "STATUS", length = 30)
    private String status = "SENT";

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(EmployeeMaster employee) { this.employee = employee; }
    public String getMemoNumber() { return memoNumber; }
    public void setMemoNumber(String memoNumber) { this.memoNumber = memoNumber; }
    public String getMemoType() { return memoType; }
    public void setMemoType(String memoType) { this.memoType = memoType; }
    public String getToEmail() { return toEmail; }
    public void setToEmail(String toEmail) { this.toEmail = toEmail; }
    public String getFromEmail() { return fromEmail; }
    public void setFromEmail(String fromEmail) { this.fromEmail = fromEmail; }
    public String getCcEmail() { return ccEmail; }
    public void setCcEmail(String ccEmail) { this.ccEmail = ccEmail; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getClosingRemarks() { return closingRemarks; }
    public void setClosingRemarks(String closingRemarks) { this.closingRemarks = closingRemarks; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public String getReportingManagerName() { return reportingManagerName; }
    public void setReportingManagerName(String reportingManagerName) { this.reportingManagerName = reportingManagerName; }
    public String getReportingManagerSignatureUpload() { return reportingManagerSignatureUpload; }
    public void setReportingManagerSignatureUpload(String reportingManagerSignatureUpload) { this.reportingManagerSignatureUpload = reportingManagerSignatureUpload; }
    public String getHrRepresentativeName() { return hrRepresentativeName; }
    public void setHrRepresentativeName(String hrRepresentativeName) { this.hrRepresentativeName = hrRepresentativeName; }
    public String getHrRepresentativeSignatureUpload() { return hrRepresentativeSignatureUpload; }
    public void setHrRepresentativeSignatureUpload(String hrRepresentativeSignatureUpload) { this.hrRepresentativeSignatureUpload = hrRepresentativeSignatureUpload; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
}

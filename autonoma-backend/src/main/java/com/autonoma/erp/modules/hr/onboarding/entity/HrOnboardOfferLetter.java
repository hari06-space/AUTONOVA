package com.autonoma.erp.modules.hr.onboarding.entity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.util.SecurityUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_ONBOARD_OFFER_LETTER")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrOnboardOfferLetter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", insertable = false, updatable = false)
    private EmployeeMaster employee;

    @Column(name = "DOCUMENT_REFERENCE_NUMBER", nullable = false, unique = true, length = 50)
    private String documentReferenceNumber;

    @Column(name = "DEPARTMENT_ID", nullable = false)
    private Long departmentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DEPARTMENT_ID", insertable = false, updatable = false)
    private Department department;

    @Column(name = "ISSUE_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date issueDate;

    @Column(name = "DOCUMENT_CONTENT", columnDefinition = "NVARCHAR(MAX)")
    private String documentContent;

    @Column(name = "APPROVAL_STATUS_ID", nullable = false)
    private Long approvalStatusId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "APPROVAL_STATUS_ID", insertable = false, updatable = false)
    private StatusMaster approvalStatus;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.createdBy = currentUserId;
        this.createdDate = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        this.updatedDate = new Date();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getDocumentReferenceNumber() { return documentReferenceNumber; }
    public void setDocumentReferenceNumber(String documentReferenceNumber) { this.documentReferenceNumber = documentReferenceNumber; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Date getIssueDate() { return issueDate; }
    public void setIssueDate(Date issueDate) { this.issueDate = issueDate; }
    public String getDocumentContent() { return documentContent; }
    public void setDocumentContent(String documentContent) { this.documentContent = documentContent; }
    public Long getApprovalStatusId() { return approvalStatusId; }
    public void setApprovalStatusId(Long approvalStatusId) { this.approvalStatusId = approvalStatusId; }
}

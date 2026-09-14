package com.autonoma.erp.modules.hr.orgstructure.entity;

import com.autonoma.erp.util.SecurityUtils;

import java.util.Date;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "HR_GRADE_DETAIL")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Gradedetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "grade_code", length = 50)
    private String gradeCode;

    @Column(name = "seq_no")
    private String sequenceNo;

    @Column(name = "grade_name", length = 100)
    private String gradeName;

    @Column(name = "status", length = 20)
    private String status = "Active";

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedDate;

    @PrePersist
    protected void onCreate() {
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }
            this.createdBy = currentUserId;
        }
        this.updatedBy = null;

        if (this.createdDate == null) {
            this.createdDate = new Date();
        }
        if (status == null)
            status = "Active";
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        if (this.createdBy != null && this.createdBy.trim().isEmpty()) {
            this.createdBy = null;
        }

        updatedDate = new Date();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getGradeCode() { return gradeCode; }
    public void setGradeCode(String gradeCode) { this.gradeCode = gradeCode; }
    public String getSequenceNo() { return sequenceNo; }
    public void setSequenceNo(String sequenceNo) { this.sequenceNo = sequenceNo; }
    public String getGradeName() { return gradeName; }
    public void setGradeName(String gradeName) { this.gradeName = gradeName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}

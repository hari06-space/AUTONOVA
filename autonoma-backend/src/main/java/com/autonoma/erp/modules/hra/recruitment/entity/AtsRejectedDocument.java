package com.autonoma.erp.modules.hra.recruitment.entity;

import com.autonoma.erp.modules.hra.recruitment.constant.AtsRejectionStage;
import com.autonoma.erp.modules.hra.recruitment.constant.AtsRejectionStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_ATS_REJECTED_DOCUMENT")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtsRejectedDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "EMPLOYEE_ID", nullable = false)
    private Long employeeId;

    @Column(name = "STAGE", length = 50, nullable = false)
    @Enumerated(EnumType.STRING)
    private AtsRejectionStage stage;

    @Column(name = "DOCUMENT_NAME", length = 255, nullable = false)
    private String documentName;

    @Column(name = "REJECT_REASON", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String rejectReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ACTIVE_STATUS", nullable = false)
    private com.autonoma.erp.modules.platform.common.entity.StatusMaster activeStatus;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
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
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }
        if (currentUserId != null && !currentUserId.trim().isEmpty() && !"SYSTEM".equalsIgnoreCase(currentUserId)) {
            this.createdBy = currentUserId;
        } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            this.createdBy = "SUPER BOSS";
        }
        this.updatedBy = null;
        this.createdDate = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }
        System.out.println("AtsRejectedDocument onUpdate: ID=" + this.id + ", createdBy=" + this.createdBy + ", updatedBy=" + this.updatedBy + ", currentUserId=" + currentUserId);
        if (currentUserId != null && !currentUserId.trim().isEmpty() && !"SYSTEM".equalsIgnoreCase(currentUserId)) {
            this.updatedBy = currentUserId;
        } else if (this.updatedBy == null || this.updatedBy.trim().isEmpty()) {
            this.updatedBy = this.createdBy != null ? this.createdBy : "SUPER BOSS";
        }
        System.out.println("AtsRejectedDocument onUpdate post-resolve: updatedBy=" + this.updatedBy);
        this.updatedDate = new Date();
    }

    // Explicit Getters and Setters to avoid any Lombok annotation failures during compilation
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public AtsRejectionStage getStage() { return stage; }
    public void setStage(AtsRejectionStage stage) { this.stage = stage; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }

    public com.autonoma.erp.modules.platform.common.entity.StatusMaster getActiveStatus() { return activeStatus; }
    public void setActiveStatus(com.autonoma.erp.modules.platform.common.entity.StatusMaster activeStatus) { this.activeStatus = activeStatus; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Date getCreatedDate() { return createdDate; }
    public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Date getUpdatedDate() { return updatedDate; }
    public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
}

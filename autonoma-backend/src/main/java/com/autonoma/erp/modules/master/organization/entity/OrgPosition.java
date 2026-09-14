package com.autonoma.erp.modules.master.organization.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "HR_ORG_POSITION")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrgPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "POSITION_TITLE", nullable = false, length = 100)
    private String positionTitle;

    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    @Column(name = "PARENT_POSITION_ID")
    private Long parentPositionId;

    @Column(name = "SECONDARY_PARENT_IDS", length = 500)
    private String secondaryParentIds;

    @Column(name = "ASSIGNED_EMPLOYEE_ID")
    private Long assignedEmployeeId;

    @Column(name = "STATUS", length = 20)
    private String status = "Active";

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
        } catch (Exception e) {
        }
        this.createdBy = (currentUserId != null && !currentUserId.isEmpty()) ? currentUserId : "System";
        this.updatedBy = null;

        createdDate = new Date();

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
    public String getPositionTitle() { return positionTitle; }
    public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getParentPositionId() { return parentPositionId; }
    public void setParentPositionId(Long parentPositionId) { this.parentPositionId = parentPositionId; }
    public Long getAssignedEmployeeId() { return assignedEmployeeId; }
    public void setAssignedEmployeeId(Long assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

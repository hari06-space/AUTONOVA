package com.autonoma.erp.modules.notebook.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "SYS_NOTEBOOK_SHARE")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotebookShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NOTEBOOK_ID", nullable = false)
    private Long notebookId;

    @Column(name = "SHARED_WITH_EMP_ID", nullable = false)
    private Long sharedWithEmpId;

    @Column(name = "PERMISSION_LEVEL", length = 20, nullable = false)
    private String permissionLevel = "VIEW"; // VIEW | COMMENT | EDIT

    @Column(name = "SHARED_BY_EMP_ID", nullable = false)
    private Long sharedByEmpId;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Column(name = "ACTIVE_STATUS", nullable = false, length = 1)
    private String activeStatus = "Y";

    @PrePersist
    protected void onCreate() {
        String user = resolveCurrentUser();
        this.createdBy = user;
        this.createdDate = new Date();
        if (this.activeStatus == null) this.activeStatus = "Y";
    }

    private static String resolveCurrentUser() {
        String user = null;
        try { user = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception ignored) {}
        return (user != null && !user.trim().isEmpty()) ? user : "Admin";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getNotebookId() { return notebookId; }
    public void setNotebookId(Long notebookId) { this.notebookId = notebookId; }
    public Long getSharedWithEmpId() { return sharedWithEmpId; }
    public void setSharedWithEmpId(Long sharedWithEmpId) { this.sharedWithEmpId = sharedWithEmpId; }
    public String getPermissionLevel() { return permissionLevel; }
    public void setPermissionLevel(String permissionLevel) { this.permissionLevel = permissionLevel; }
    public Long getSharedByEmpId() { return sharedByEmpId; }
    public void setSharedByEmpId(Long sharedByEmpId) { this.sharedByEmpId = sharedByEmpId; }
    public String getActiveStatus() { return activeStatus; }
    public void setActiveStatus(String activeStatus) { this.activeStatus = activeStatus; }
}

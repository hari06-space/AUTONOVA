package com.autonoma.erp.model.admin;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_USER_DIVISION_MAPPING")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDivisionMapping {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private String userId;

    @Column(name = "DIVISION_ID", nullable = false)
    private Long divisionId;

    public String getUserId() { return userId; }
    public Long getDivisionId() { return divisionId; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setDivisionId(Long divisionId) { this.divisionId = divisionId; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try { currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId(); } catch (Exception e) {}
        if (org.springframework.web.context.request.RequestContextHolder.getRequestAttributes() != null) {
            if (currentUserId == null || currentUserId.trim().isEmpty()) {
                throw new RuntimeException("Session expired or user not logged in. Please relogin.");
            }
            this.createdBy = currentUserId;
        }
        createdAt = new Date();
    }
}

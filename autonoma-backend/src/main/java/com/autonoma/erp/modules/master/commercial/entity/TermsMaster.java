package com.autonoma.erp.modules.master.commercial.entity;

import com.autonoma.erp.util.SecurityUtils;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "MST_TERMS_MASTER")
@Data
public class TermsMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CODE", length = 250)
    private String code;

    @Column(name = "TYPE", length = 100, nullable = false)
    private String type = "PAYMENT";

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String description;

    @Column(name = "STATUS")
    private Boolean status = true;

    @Column(name = "DIVISION")
    private Long division;

    @Column(name = "CREATED_BY", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "CREATED_DATE", updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }
        this.createdBy = (currentUserId != null && !currentUserId.trim().isEmpty()) ? currentUserId : "Admin";
        this.updatedBy = null;
        this.createdDate = LocalDateTime.now();

        if (this.status == null) {
            this.status = true;
        }

        if (this.division == null) {
            try {
                this.division = SecurityUtils.getCurrentDivisionId();
            } catch (Exception ignored) {
            }
        }
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {
        }
        this.updatedBy = (currentUserId != null && !currentUserId.trim().isEmpty()) ? currentUserId : "Admin";
        this.updatedDate = LocalDateTime.now();

        if (this.division == null) {
            try {
                this.division = SecurityUtils.getCurrentDivisionId();
            } catch (Exception ignored) {
            }
        }
    }

    // Backward compatibility helpers for consumers that previously accessed termName/termCode/deliveryTerms/modeName/freightType
    public String getTermCode() {
        return code;
    }

    public void setTermCode(String termCode) {
        this.code = termCode;
    }

    public String getTermName() {
        return description;
    }

    public void setTermName(String termName) {
        this.description = termName;
    }

    public String getDeliveryTerms() {
        return description;
    }

    public String getModeName() {
        return description;
    }

    public String getDespatchMode() {
        return description;
    }

    public String getFreightType() {
        return description;
    }

    public Boolean getIsActive() {
        return status != null ? status : true;
    }
}

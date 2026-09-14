package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "QMS_NCR_OFI_ACTION")
@Data
public class NcrOfiAction extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "NCR_OFI_ID", nullable = false)
    private Integer ncrOfiId;

    @Column(name = "ACTION_TYPE")
    private String actionType; // CORRECTIVE, PREVENTIVE, ROOT_CAUSE

    @Column(name = "ACTION_DESCRIPTION")
    private String actionDescription;

    @Column(name = "ACTION_BY")
    private Integer actionBy;

    @Column(name = "ACTION_DATE")
    private LocalDate actionDate;

    @Column(name = "COMPLETION_DATE")
    private LocalDate completionDate;

    @Column(name = "REMARKS")
    private String remarks;

    @Column(name = "STATUS")
    private String status;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}

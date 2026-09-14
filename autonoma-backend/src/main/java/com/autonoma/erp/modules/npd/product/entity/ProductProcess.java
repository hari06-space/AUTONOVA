package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_PROCESS")
@Getter
@Setter
public class ProductProcess extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PROCESS_NAME", nullable = false, unique = true, length = 150)
    private String processName;

    @Column(name = "PROCESS_CD", length = 25)
    private String processCd;

    public Long getId() { return id; }
    public String getProcessName() { return processName; }

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "STATUS", nullable = false)
    private Boolean status = true;

    @Column(name = "PROCESS_PROCEDURE_REQUIRED", nullable = false)
    private Boolean processProcedureRequired = false;

    @Override
    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }

        super.onCreate();
        if (this.status == null) {
            this.status = true;
        }
        if (this.processProcedureRequired == null) {
            this.processProcedureRequired = false;
        }
    }

    public void setId(Long id) { this.id = id; }
    public void setProcessName(String processName) { this.processName = processName; }

    public String getProcessCd() { return processCd; }
    public void setProcessCd(String processCd) { this.processCd = processCd; }

    @Column(name = "DIVISION")
    private Integer division;

    public Integer getDivision() { return division; }
    public void setDivision(Integer division) { this.division = division; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
    public Boolean getProcessProcedureRequired() { return processProcedureRequired; }
    public void setProcessProcedureRequired(Boolean processProcedureRequired) { this.processProcedureRequired = processProcedureRequired; }
}

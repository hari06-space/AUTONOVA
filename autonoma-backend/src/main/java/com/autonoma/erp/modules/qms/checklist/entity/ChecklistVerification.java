package com.autonoma.erp.modules.qms.checklist.entity;

import com.autonoma.erp.modules.platform.common.entity.StatusMaster;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// NOTE: @Entity removed – ChecklistVerification is now a plain DTO.
// Verification data is stored directly in the QMS_CHECKLIST_CLOSED_* frequency tables.
// The QMS_CHECKLIST_VERIFICATION table is deprecated; no FK constraints are created.
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ChecklistVerification {

    private Long id;

    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private ChecklistAssignment assignment;

    private String verifiedBy;

    private StatusMaster status;

    private String remarks;

    private Date verifiedDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ChecklistAssignment getAssignment() { return assignment; }
    public void setAssignment(ChecklistAssignment assignment) { this.assignment = assignment; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public StatusMaster getStatus() { return status; }
    public void setStatus(StatusMaster status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public Date getVerifiedDate() { return verifiedDate; }
    public void setVerifiedDate(Date verifiedDate) { this.verifiedDate = verifiedDate; }
}

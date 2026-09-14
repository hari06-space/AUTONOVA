package com.autonoma.erp.model.security;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_LOGIN_SECURITY_AUDIT")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginSecurityAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "COMPANY_ID", nullable = false)
    private Long companyId;

    @Column(name = "ACTION", nullable = false, length = 100)
    private String action;

    @Column(name = "OLD_VALUE", columnDefinition = "NVARCHAR(MAX)")
    private String oldValue;

    @Column(name = "NEW_VALUE", columnDefinition = "NVARCHAR(MAX)")
    private String newValue;

    @Column(name = "REMARKS", length = 500)
    private String remarks;

    @Column(name = "CHANGED_BY", nullable = false, length = 50)
    private String changedBy;

    @Column(name = "CHANGED_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date changedDate = new Date();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }
    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }
    public Date getChangedDate() { return changedDate; }
    public void setChangedDate(Date changedDate) { this.changedDate = changedDate; }
}

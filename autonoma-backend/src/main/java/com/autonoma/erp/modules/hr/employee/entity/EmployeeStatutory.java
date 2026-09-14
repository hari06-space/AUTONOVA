package com.autonoma.erp.modules.hr.employee.entity;

import com.autonoma.erp.util.YesNoConverter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "HR_EMPLOYEE_STATUTORY")
public class EmployeeStatutory {

    @Id
    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "EMPLOYEE_ID")
    private EmployeeMaster employee;

    @Column(name = "PF_TOGGLE")
    @Convert(converter = YesNoConverter.class)
    private String pfToggle = "NO";

    @Column(name = "PF_RESTRICTION", precision = 18, scale = 2)
    private BigDecimal pfRestriction;

    @Column(name = "ESI_TOGGLE")
    @Convert(converter = YesNoConverter.class)
    private String esiToggle = "NO";

    @Column(name = "P_TAX_TOGGLE", length = 10)
    private String pTaxToggle = "NO";

    @Column(name = "BONUS_TOGGLE", length = 10)
    private String bonusToggle = "NO";

    @Column(name = "OT_TOGGLE")
    @Convert(converter = YesNoConverter.class)
    private String otToggle = "NO";

    @Column(name = "OT_FACTORIAL", precision = 18, scale = 2)
    private BigDecimal otFactorial;

    @Column(name = "LOM_DEDUCTION", length = 10)
    private String lomDeduction = "NO";

    @Column(name = "LOM_ALLOW", precision = 18, scale = 2)
    private BigDecimal lomAllow;

    @Column(name = "LTA_ELIGIBLE", length = 10)
    private String ltaEligible = "NO";

    @Column(name = "PERMISSION_TOGGLE", length = 10)
    private String permissionToggle = "NO";

    @Column(name = "PERMISSION_LIMIT", precision = 18, scale = 2)
    private BigDecimal permissionLimit;

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

    public EmployeeStatutory() {
    }

    public EmployeeStatutory(Long employeeId, EmployeeMaster employee, String pfToggle, BigDecimal pfRestriction,
            String esiToggle, String pTaxToggle, String bonusToggle, String otToggle, BigDecimal otFactorial,
            String lomDeduction, BigDecimal lomAllow, String ltaEligible, String permissionToggle,
            BigDecimal permissionLimit, String createdBy, Date createdDate, String updatedBy, Date updatedDate) {
        this.employeeId = employeeId;
        this.employee = employee;
        this.pfToggle = pfToggle;
        this.pfRestriction = pfRestriction;
        this.esiToggle = esiToggle;
        this.pTaxToggle = pTaxToggle;
        this.bonusToggle = bonusToggle;
        this.otToggle = otToggle;
        this.otFactorial = otFactorial;
        this.lomDeduction = lomDeduction;
        this.lomAllow = lomAllow;
        this.ltaEligible = ltaEligible;
        this.permissionToggle = permissionToggle;
        this.permissionLimit = permissionLimit;
        this.createdBy = createdBy;
        this.createdDate = createdDate;
        this.updatedBy = updatedBy;
        this.updatedDate = updatedDate;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public EmployeeMaster getEmployee() {
        return employee;
    }

    public void setEmployee(EmployeeMaster employee) {
        this.employee = employee;
    }

    public String getPfToggle() {
        return pfToggle;
    }

    public void setPfToggle(String pfToggle) {
        this.pfToggle = pfToggle;
    }

    public BigDecimal getPfRestriction() {
        return pfRestriction;
    }

    public void setPfRestriction(BigDecimal pfRestriction) {
        this.pfRestriction = pfRestriction;
    }

    public String getEsiToggle() {
        return esiToggle;
    }

    public void setEsiToggle(String esiToggle) {
        this.esiToggle = esiToggle;
    }

    public String getPTaxToggle() {
        return pTaxToggle;
    }

    public void setPTaxToggle(String pTaxToggle) {
        this.pTaxToggle = pTaxToggle;
    }

    public String getBonusToggle() {
        return bonusToggle;
    }

    public void setBonusToggle(String bonusToggle) {
        this.bonusToggle = bonusToggle;
    }

    public String getOtToggle() {
        return otToggle;
    }

    public void setOtToggle(String otToggle) {
        this.otToggle = otToggle;
    }

    public BigDecimal getOtFactorial() {
        return otFactorial;
    }

    public void setOtFactorial(BigDecimal otFactorial) {
        this.otFactorial = otFactorial;
    }

    public String getLomDeduction() {
        return lomDeduction;
    }

    public void setLomDeduction(String lomDeduction) {
        this.lomDeduction = lomDeduction;
    }

    public BigDecimal getLomAllow() {
        return lomAllow;
    }

    public void setLomAllow(BigDecimal lomAllow) {
        this.lomAllow = lomAllow;
    }

    public String getLtaEligible() {
        return ltaEligible;
    }

    public void setLtaEligible(String ltaEligible) {
        this.ltaEligible = ltaEligible;
    }

    public String getPermissionToggle() {
        return permissionToggle;
    }

    public void setPermissionToggle(String permissionToggle) {
        this.permissionToggle = permissionToggle;
    }

    public BigDecimal getPermissionLimit() {
        return permissionLimit;
    }

    public void setPermissionLimit(BigDecimal permissionLimit) {
        this.permissionLimit = permissionLimit;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Date getUpdatedDate() {
        return updatedDate;
    }

    public void setUpdatedDate(Date updatedDate) {
        this.updatedDate = updatedDate;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }
            if (currentUserId != null && !currentUserId.trim().isEmpty()) { this.createdBy = currentUserId; } else if (this.createdBy == null || this.createdBy.trim().isEmpty()) { this.createdBy = "System"; }
        }
        if (this.createdDate == null) {
            this.createdDate = new Date();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }
        this.updatedBy = currentUserId;
        this.updatedDate = new Date();
    }
}


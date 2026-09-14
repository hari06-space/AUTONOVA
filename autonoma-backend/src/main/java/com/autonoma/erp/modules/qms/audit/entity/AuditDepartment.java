package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "QMS_AUDIT_DEPARTMENT")
public class AuditDepartment extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PAGE_CODE", columnDefinition = "NVARCHAR(100)")
    private String pageCode;

    @Column(name = "REF_ID")
    private Long refId;

    @Column(name = "DEPT_ID")
    private Long deptId;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "REF_ID", insertable = false, updatable = false)
    private AuditCriteria auditCriteria;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DEPT_ID", insertable = false, updatable = false)
    private com.autonoma.erp.modules.hr.orgstructure.entity.Department department;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPageCode() {
        return pageCode;
    }

    public void setPageCode(String pageCode) {
        this.pageCode = pageCode;
    }

    public Long getRefId() {
        return refId;
    }

    public void setRefId(Long refId) {
        this.refId = refId;
    }

    public Long getDeptId() {
        return deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    public AuditCriteria getAuditCriteria() {
        return auditCriteria;
    }

    public void setAuditCriteria(AuditCriteria auditCriteria) {
        this.auditCriteria = auditCriteria;
    }

    public com.autonoma.erp.modules.hr.orgstructure.entity.Department getDepartment() {
        return department;
    }

    public void setDepartment(com.autonoma.erp.modules.hr.orgstructure.entity.Department department) {
        this.department = department;
    }
}

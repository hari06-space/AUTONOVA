package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "QMS_AUDIT_OBSERVATION")
public class AuditObservation extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Observation No cannot be blank")
    @Size(max = 50, message = "Observation No cannot exceed 50 characters")
    @Column(name = "OBSERVATION_NO", columnDefinition = "NVARCHAR(50)")
    private String observationNo;

    @Column(name = "OBSERVATION_DATE")
    @Temporal(TemporalType.DATE)
    private Date observationDate;

    @NotBlank(message = "Audit Schedule No cannot be blank")
    @Size(max = 50, message = "Audit Schedule No cannot exceed 50 characters")
    @Column(name = "AUDIT_SCHEDULE_NO", columnDefinition = "NVARCHAR(50)")
    private String auditScheduleNo;

    @Column(name = "AUDIT_TYPE_ID")
    private Long auditTypeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUDIT_TYPE_ID", insertable = false, updatable = false)
    private AuditType auditTypeEntity;

    @Column(name = "AUDIT_AREA_ID")
    private Long auditAreaId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUDIT_AREA_ID", insertable = false, updatable = false)
    private AuditArea auditAreaEntity;

    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DEPARTMENT_ID", insertable = false, updatable = false)
    private Department department;

    @Column(name = "AUDITEE_ID")
    private Long auditeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUDITEE_ID", insertable = false, updatable = false)
    private EmployeeMaster auditeeEntity;

    @Column(name = "AUDITOR_ID")
    private Long auditorId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUDITOR_ID", insertable = false, updatable = false)
    private EmployeeMaster auditorEntity;

    @Column(name = "NCR_APPROVED_BY_ID")
    private Long ncrApprovedById;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "NCR_APPROVED_BY_ID", insertable = false, updatable = false)
    private EmployeeMaster ncrApprovedByEntity;

    @Size(max = 50, message = "Status cannot exceed 50 characters")
    @Column(name = "STATUS", columnDefinition = "NVARCHAR(50)")
    private String status;

    @Column(name = "AUDIT_SCORE", columnDefinition = "NUMERIC(12, 2)")
    private Double auditScore = 0.0;
    
    @Column(name = "OFI_COUNT")
    private Integer ofiCount = 0;
    
    @Column(name = "COMPLIANCE_COUNT")
    private Integer complianceCount = 0;
    
    @Column(name = "NCR_COUNT")
    private Integer ncrCount = 0;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "auditObservation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AuditObservationDetail> details = new ArrayList<>();

    @Transient
    private String departmentName;

    @Transient
    private String auditType;

    @Transient
    private String auditArea;

    @Transient
    private String auditee;

    @Transient
    private String auditor;

    @Transient
    private String ncrApprovedBy;

    // Explicit Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getObservationNo() { return observationNo; }
    public void setObservationNo(String observationNo) { this.observationNo = observationNo; }

    public Date getObservationDate() { return observationDate; }
    public void setObservationDate(Date observationDate) { this.observationDate = observationDate; }

    public String getAuditScheduleNo() { return auditScheduleNo; }
    public void setAuditScheduleNo(String auditScheduleNo) { this.auditScheduleNo = auditScheduleNo; }

    public Long getAuditTypeId() { return auditTypeId; }
    public void setAuditTypeId(Long auditTypeId) { this.auditTypeId = auditTypeId; }

    public AuditType getAuditTypeEntity() { return auditTypeEntity; }
    public void setAuditTypeEntity(AuditType auditTypeEntity) { this.auditTypeEntity = auditTypeEntity; }

    public Long getAuditAreaId() { return auditAreaId; }
    public void setAuditAreaId(Long auditAreaId) { this.auditAreaId = auditAreaId; }

    public AuditArea getAuditAreaEntity() { return auditAreaEntity; }
    public void setAuditAreaEntity(AuditArea auditAreaEntity) { this.auditAreaEntity = auditAreaEntity; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public Long getAuditeeId() { return auditeeId; }
    public void setAuditeeId(Long auditeeId) { this.auditeeId = auditeeId; }

    public EmployeeMaster getAuditeeEntity() { return auditeeEntity; }
    public void setAuditeeEntity(EmployeeMaster auditeeEntity) { this.auditeeEntity = auditeeEntity; }

    public Long getAuditorId() { return auditorId; }
    public void setAuditorId(Long auditorId) { this.auditorId = auditorId; }

    public EmployeeMaster getAuditorEntity() { return auditorEntity; }
    public void setAuditorEntity(EmployeeMaster auditorEntity) { this.auditorEntity = auditorEntity; }

    public Long getNcrApprovedById() { return ncrApprovedById; }
    public void setNcrApprovedById(Long ncrApprovedById) { this.ncrApprovedById = ncrApprovedById; }

    public EmployeeMaster getNcrApprovedByEntity() { return ncrApprovedByEntity; }
    public void setNcrApprovedByEntity(EmployeeMaster ncrApprovedByEntity) { this.ncrApprovedByEntity = ncrApprovedByEntity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getAuditScore() { return auditScore; }

    @com.fasterxml.jackson.annotation.JsonSetter("auditScore")
    public void setAuditScore(Object auditScore) {
        if (auditScore == null) {
            this.auditScore = 0.0;
        } else if (auditScore instanceof Double) {
            this.auditScore = (Double) auditScore;
        } else if (auditScore instanceof Integer) {
            this.auditScore = ((Integer) auditScore).doubleValue();
        } else if (auditScore instanceof Number) {
            this.auditScore = ((Number) auditScore).doubleValue();
        } else {
            try {
                this.auditScore = Double.parseDouble(auditScore.toString());
            } catch (NumberFormatException e) {
                this.auditScore = 0.0;
            }
        }
    }

    public Integer getOfiCount() { return ofiCount; }
    public void setOfiCount(Integer ofiCount) { this.ofiCount = ofiCount; }

    public Integer getComplianceCount() { return complianceCount; }
    public void setComplianceCount(Integer complianceCount) { this.complianceCount = complianceCount; }

    public Integer getNcrCount() { return ncrCount; }
    public void setNcrCount(Integer ncrCount) { this.ncrCount = ncrCount; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public List<AuditObservationDetail> getDetails() { return details; }
    public void setDetails(List<AuditObservationDetail> details) { this.details = details; }

    // Transient/Compatibility Getters and Setters
    @com.fasterxml.jackson.annotation.JsonProperty("departmentName")
    public String getDepartmentName() {
        if (department != null) {
            return department.getDepartmentName();
        }
        return this.departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("auditType")
    public String getAuditType() {
        if (auditTypeEntity != null) {
            return auditTypeEntity.getAuditType();
        }
        return auditType;
    }

    public void setAuditType(String auditType) {
        this.auditType = auditType;
        if (auditType == null || auditType.trim().isEmpty()) {
            this.auditTypeId = null;
            return;
        }
        com.autonoma.erp.modules.qms.audit.repository.AuditTypeRepository repo =
            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.qms.audit.repository.AuditTypeRepository.class);
        if (repo != null) {
            repo.findByAuditTypeIgnoreCase(auditType.trim()).ifPresent(t -> this.auditTypeId = t.getId());
        }
    }

    @com.fasterxml.jackson.annotation.JsonProperty("auditArea")
    public String getAuditArea() {
        if (auditAreaEntity != null) {
            return auditAreaEntity.getDescription();
        }
        return auditArea;
    }

    public void setAuditArea(String auditArea) {
        this.auditArea = auditArea;
        if (auditArea == null || auditArea.trim().isEmpty()) {
            this.auditAreaId = null;
            return;
        }
        com.autonoma.erp.modules.qms.audit.repository.AuditAreaRepository repo =
            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.qms.audit.repository.AuditAreaRepository.class);
        if (repo != null) {
            repo.findFirstByDescriptionIgnoreCase(auditArea.trim()).ifPresent(a -> this.auditAreaId = a.getId());
        }
    }

    public String getAuditee() {
        if (auditeeEntity != null) {
            String name = auditeeEntity.getEmployeeName();
            if (name == null || name.trim().isEmpty()) {
                name = ((auditeeEntity.getFirstName() != null ? auditeeEntity.getFirstName() : "") + " " + (auditeeEntity.getLastName() != null ? auditeeEntity.getLastName() : "")).trim();
            }
            if (auditeeEntity.getEmpCode() != null) {
                return name + " - " + auditeeEntity.getEmpCode();
            }
            return name;
        }
        return auditee;
    }

    public void setAuditee(String auditee) {
        this.auditee = auditee;
        if (auditee == null || auditee.trim().isEmpty()) {
            this.auditeeId = null;
            return;
        }
        String code = auditee.contains(" - ") ? auditee.split(" - ")[1].trim() : auditee.trim();
        com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository repo =
            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository.class);
        if (repo != null) {
            repo.findByEmpCodeIgnoreCase(code).ifPresent(emp -> this.auditeeId = emp.getId());
        }
    }

    public String getAuditor() {
        if (auditorEntity != null) {
            String name = auditorEntity.getEmployeeName();
            if (name == null || name.trim().isEmpty()) {
                name = ((auditorEntity.getFirstName() != null ? auditorEntity.getFirstName() : "") + " " + (auditorEntity.getLastName() != null ? auditorEntity.getLastName() : "")).trim();
            }
            if (auditorEntity.getEmpCode() != null) {
                return name + " - " + auditorEntity.getEmpCode();
            }
            return name;
        }
        return auditor;
    }

    public void setAuditor(String auditor) {
        this.auditor = auditor;
        if (auditor == null || auditor.trim().isEmpty()) {
            this.auditorId = null;
            return;
        }
        String code = auditor.contains(" - ") ? auditor.split(" - ")[1].trim() : auditor.trim();
        com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository repo =
            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository.class);
        if (repo != null) {
            repo.findByEmpCodeIgnoreCase(code).ifPresent(emp -> this.auditorId = emp.getId());
        }
    }

    public String getNcrApprovedBy() {
        if (ncrApprovedByEntity != null) {
            String name = ncrApprovedByEntity.getEmployeeName();
            if (name == null || name.trim().isEmpty()) {
                name = ((ncrApprovedByEntity.getFirstName() != null ? ncrApprovedByEntity.getFirstName() : "") + " " + (ncrApprovedByEntity.getLastName() != null ? ncrApprovedByEntity.getLastName() : "")).trim();
            }
            if (ncrApprovedByEntity.getEmpCode() != null) {
                return name + " - " + ncrApprovedByEntity.getEmpCode();
            }
            return name;
        }
        return ncrApprovedBy;
    }

    public void setNcrApprovedBy(String ncrApprovedBy) {
        this.ncrApprovedBy = ncrApprovedBy;
        if (ncrApprovedBy == null || ncrApprovedBy.trim().isEmpty()) {
            this.ncrApprovedById = null;
            return;
        }
        String code = ncrApprovedBy.contains(" - ") ? ncrApprovedBy.split(" - ")[1].trim() : ncrApprovedBy.trim();
        com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository repo =
            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository.class);
        if (repo != null) {
            repo.findByEmpCodeIgnoreCase(code).ifPresent(emp -> this.ncrApprovedById = emp.getId());
        }
    }

    @Override
    protected void onCreate() {
        super.onCreate();
        trimFields();
    }

    @Override
    protected void onUpdate() {
        super.onUpdate();
        trimFields();
    }

    private void trimFields() {
        if (observationNo != null) observationNo = observationNo.trim();
        if (auditScheduleNo != null) auditScheduleNo = auditScheduleNo.trim();
        if (status != null) status = status.trim();
    }
}

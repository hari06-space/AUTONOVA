package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "QMS_AUDIT_SCHEDULE")
public class AuditSchedule extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Schedule No cannot be blank")
    @Size(max = 255, message = "Schedule No cannot exceed 255 characters")
    @Column(name = "SCHEDULE_NO", columnDefinition = "NVARCHAR(255)")
    private String scheduleNo;
    
    @Column(name = "SCHEDULE_DATE")
    @Temporal(TemporalType.DATE)
    private Date scheduleDate;
    
    @Size(max = 50, message = "Status cannot exceed 50 characters")
    @Column(name = "STATUS", columnDefinition = "NVARCHAR(50)")
    private String status;

    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DEPARTMENT_ID", insertable = false, updatable = false)
    private com.autonoma.erp.modules.hr.orgstructure.entity.Department departmentEntity;

    @Column(name = "AUDITEE_ID")
    private Long auditeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUDITEE_ID", insertable = false, updatable = false)
    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster auditeeEntity;

    @Column(name = "AUDITOR_ID")
    private Long auditorId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUDITOR_ID", insertable = false, updatable = false)
    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster auditorEntity;
    @Column(name = "NCR_APPROVED_BY_ID")
    private Long ncrApprovedById;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "NCR_APPROVED_BY_ID", insertable = false, updatable = false)
    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster ncrApprovedByEntity;

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

    @Column(name = "CUSTOMER_ID")
    private Long customerId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "CUSTOMER_ID", insertable = false, updatable = false)
    private com.autonoma.erp.modules.master.commercial.entity.AccountLedger customerEntity;

    @Column(name = "SUPPLIER_ID")
    private Long supplierId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
    private com.autonoma.erp.modules.master.commercial.entity.AccountLedger supplierEntity;

    @Column(name = "PROCESS_ID")
    private Long processId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "PROCESS_ID", insertable = false, updatable = false)
    private com.autonoma.erp.modules.npd.product.entity.ProductProcess processEntity;

    @Column(name = "CO_ORDINATOR_ID")
    private Long coOrdinatorId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "CO_ORDINATOR_ID", insertable = false, updatable = false)
    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster coOrdinatorEntity;

    @Size(max = 200)
    @Column(name = "CONTACT_NAME", length = 200)
    private String contactName;

    @Size(max = 200)
    @Column(name = "EXTERNAL_NAME", length = 200)
    private String externalName;

    @Size(max = 200)
    @Column(name = "EXTERNAL_EMAIL_ID", length = 200)
    private String externalEmailId;

    @Size(max = 50)
    @Column(name = "EXTERNAL_MOBILE_NO", length = 50)
    private String externalMobileNo;

    @Column(name = "EXTERNAL_AUDITOR_IMAGE", columnDefinition = "NVARCHAR(MAX)")
    private String externalAuditorImage;

    @Column(name = "EXTERNAL_LINK_SENT")
    private Boolean externalLinkSent = false;

    @Size(max = 200)
    @Column(name = "EMAIL_TO_CUSTOMER", length = 200)
    private String emailToCustomer;

    @Size(max = 200)
    @Column(name = "FROM_EMAIL_TO_CUSTOMER", length = 200)
    private String fromEmailToCustomer;

    @Size(max = 100)
    @Column(name = "AUDIT_ZONE", length = 100)
    private String auditZone;

    @Column(name = "AUDIT_AREA_DETAIL", columnDefinition = "NVARCHAR(MAX)")
    private String auditAreaDetail;

    @Size(max = 255, message = "Item Code cannot exceed 255 characters")
    @Column(name = "ITEM_CODE", columnDefinition = "NVARCHAR(255)")
    private String itemCode;

    @Size(max = 50, message = "Frequency cannot exceed 50 characters")
    @Column(name = "FREQUENCY", columnDefinition = "NVARCHAR(50)")
    private String frequency = "NONE";

    @Size(max = 255, message = "Week Days cannot exceed 255 characters")
    @Column(name = "WEEK_DAYS", columnDefinition = "NVARCHAR(255)")
    private String weekDays;

    @Column(name = "REPEAT_EVERY_VALUE")
    private Integer repeatEveryValue;

    @Size(max = 50, message = "Repeat Every Unit cannot exceed 50 characters")
    @Column(name = "REPEAT_EVERY_UNIT", columnDefinition = "NVARCHAR(50)")
    private String repeatEveryUnit;

    @Column(name = "SEARCH_TEXT", length = 1000)
    private String searchText;

    @Column(name = "CRITERIA_MIN_COUNT")
    private Integer criteriaMinCount;

    @Column(name = "RESCHEDULE_COUNT")
    private Integer rescheduleCount = 0;
    
    @Column(name = "AUDIT_DATE")
    @Temporal(TemporalType.DATE)
    private Date auditDate;

    @NotBlank(message = "Start Time cannot be blank")
    @Pattern(regexp = "^(0?[1-9]|1[0-2]):[0-5][0-9]\\s*(AM|PM|am|pm)$", message = "Start Time must be in hh:mm AM/PM format")
    @Size(max = 50, message = "Start Time cannot exceed 50 characters")
    @Column(name = "START_TIME", columnDefinition = "NVARCHAR(50)")
    private String startTime;

    @NotBlank(message = "End Time cannot be blank")
    @Pattern(regexp = "^(0?[1-9]|1[0-2]):[0-5][0-9]\\s*(AM|PM|am|pm)$", message = "End Time must be in hh:mm AM/PM format")
    @Size(max = 50, message = "End Time cannot exceed 50 characters")
    @Column(name = "END_TIME", columnDefinition = "NVARCHAR(50)")
    private String endTime;

    @Column(name = "PARENT_ID")
    private Long parentId;

    @Column(name = "CONFIG_ID")
    private Long configId;

    @Column(name = "UPDATE_CONFIG")
    private Boolean updateConfig;

    @Column(name = "IS_ACTIVE")
    private Boolean isActive = true;

    @Column(name = "CANCEL_REASON", columnDefinition = "NVARCHAR(MAX)")
    private String cancelReason;

    @OneToMany(mappedBy = "auditSchedule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    private List<AuditScheduleCriteria> criteriaList = new ArrayList<>();

    @Transient
    private Integer totalPoint;

    @Transient
    private boolean hasAttendance = false;

    @Transient
    private String department;

    @Transient
    private String auditee;

    @Transient
    private String auditor;

    @Transient
    private String ncrApprovedBy;

    @Transient
    private String auditType;

    @Transient
    private String auditArea;

    // Explicit Getters and Setters
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }

    public Long getConfigId() { return configId; }
    public void setConfigId(Long configId) { this.configId = configId; }

    @com.fasterxml.jackson.annotation.JsonProperty("updateConfig")
    public Boolean getUpdateConfig() { return updateConfig; }
    @com.fasterxml.jackson.annotation.JsonProperty("updateConfig")
    public void setUpdateConfig(Boolean updateConfig) { this.updateConfig = updateConfig; }

    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getScheduleNo() { return scheduleNo != null ? scheduleNo.trim() : null; }
    public void setScheduleNo(String scheduleNo) { this.scheduleNo = scheduleNo != null ? scheduleNo.trim() : null; }
    
    public Date getScheduleDate() { return scheduleDate != null ? scheduleDate : auditDate; }
    public void setScheduleDate(Date scheduleDate) { this.scheduleDate = scheduleDate; }
    
    public String getStatus() { return status != null ? status.trim() : null; }
    public void setStatus(String status) { this.status = status != null ? status.trim() : null; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public com.autonoma.erp.modules.hr.orgstructure.entity.Department getDepartmentEntity() { return departmentEntity; }
    public void setDepartmentEntity(com.autonoma.erp.modules.hr.orgstructure.entity.Department departmentEntity) { this.departmentEntity = departmentEntity; }

    public Long getAuditeeId() { return auditeeId; }
    public void setAuditeeId(Long auditeeId) { this.auditeeId = auditeeId; }

    public com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster getAuditeeEntity() { return auditeeEntity; }
    public void setAuditeeEntity(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster auditeeEntity) { this.auditeeEntity = auditeeEntity; }
    public Long getAuditorId() { return auditorId; }
    public void setAuditorId(Long auditorId) { this.auditorId = auditorId; }

    public com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster getAuditorEntity() { return auditorEntity; }
    public void setAuditorEntity(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster auditorEntity) { this.auditorEntity = auditorEntity; }

    public Long getNcrApprovedById() { return ncrApprovedById; }
    public void setNcrApprovedById(Long ncrApprovedById) { this.ncrApprovedById = ncrApprovedById; }

    public com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster getNcrApprovedByEntity() { return ncrApprovedByEntity; }
    public void setNcrApprovedByEntity(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster ncrApprovedByEntity) { this.ncrApprovedByEntity = ncrApprovedByEntity; }

    public Long getAuditTypeId() { return auditTypeId; }
    public void setAuditTypeId(Long auditTypeId) { this.auditTypeId = auditTypeId; }

    public String getExternalAuditorImage() { return externalAuditorImage; }
    public void setExternalAuditorImage(String externalAuditorImage) { this.externalAuditorImage = externalAuditorImage; }

    public Boolean getExternalLinkSent() { return externalLinkSent != null && externalLinkSent; }
    public void setExternalLinkSent(Boolean externalLinkSent) { this.externalLinkSent = externalLinkSent; }

    public AuditType getAuditTypeEntity() { return auditTypeEntity; }
    public void setAuditTypeEntity(AuditType auditTypeEntity) { this.auditTypeEntity = auditTypeEntity; }

    public Long getAuditAreaId() { return auditAreaId; }
    public void setAuditAreaId(Long auditAreaId) { this.auditAreaId = auditAreaId; }

    public AuditArea getAuditAreaEntity() { return auditAreaEntity; }
    public void setAuditAreaEntity(AuditArea auditAreaEntity) { this.auditAreaEntity = auditAreaEntity; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public com.autonoma.erp.modules.master.commercial.entity.AccountLedger getCustomerEntity() { return customerEntity; }
    public void setCustomerEntity(com.autonoma.erp.modules.master.commercial.entity.AccountLedger customerEntity) { this.customerEntity = customerEntity; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public com.autonoma.erp.modules.master.commercial.entity.AccountLedger getSupplierEntity() { return supplierEntity; }
    public void setSupplierEntity(com.autonoma.erp.modules.master.commercial.entity.AccountLedger supplierEntity) { this.supplierEntity = supplierEntity; }

    public Long getProcessId() { return processId; }
    public void setProcessId(Long processId) { this.processId = processId; }

    public com.autonoma.erp.modules.npd.product.entity.ProductProcess getProcessEntity() { return processEntity; }
    public void setProcessEntity(com.autonoma.erp.modules.npd.product.entity.ProductProcess processEntity) { this.processEntity = processEntity; }

    public Long getCoOrdinatorId() { return coOrdinatorId; }
    public void setCoOrdinatorId(Long coOrdinatorId) { this.coOrdinatorId = coOrdinatorId; }

    public com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster getCoOrdinatorEntity() { return coOrdinatorEntity; }
    public void setCoOrdinatorEntity(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster coOrdinatorEntity) { this.coOrdinatorEntity = coOrdinatorEntity; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getExternalName() { return externalName; }
    public void setExternalName(String externalName) { this.externalName = externalName; }

    public String getExternalEmailId() { return externalEmailId; }
    public void setExternalEmailId(String externalEmailId) { this.externalEmailId = externalEmailId; }

    public String getExternalMobileNo() { return externalMobileNo; }
    public void setExternalMobileNo(String externalMobileNo) { this.externalMobileNo = externalMobileNo; }

    public String getEmailToCustomer() { return emailToCustomer; }
    public void setEmailToCustomer(String emailToCustomer) { this.emailToCustomer = emailToCustomer; }

    public String getFromEmailToCustomer() { return fromEmailToCustomer; }
    public void setFromEmailToCustomer(String fromEmailToCustomer) { this.fromEmailToCustomer = fromEmailToCustomer; }

    public String getAuditZone() { return auditZone; }
    public void setAuditZone(String auditZone) { this.auditZone = auditZone; }

    public String getAuditAreaDetail() { return auditAreaDetail; }
    public void setAuditAreaDetail(String auditAreaDetail) { this.auditAreaDetail = auditAreaDetail; }

    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public String getWeekDays() { return weekDays; }
    public void setWeekDays(String weekDays) { this.weekDays = weekDays; }

    public Integer getRepeatEveryValue() { return repeatEveryValue; }
    public void setRepeatEveryValue(Integer repeatEveryValue) { this.repeatEveryValue = repeatEveryValue; }

    public String getRepeatEveryUnit() { return repeatEveryUnit; }
    public void setRepeatEveryUnit(String repeatEveryUnit) { this.repeatEveryUnit = repeatEveryUnit; }

    public String getSearchText() { return searchText; }
    public void setSearchText(String searchText) { this.searchText = searchText; }

    public Integer getCriteriaMinCount() { return criteriaMinCount; }
    public void setCriteriaMinCount(Integer criteriaMinCount) { this.criteriaMinCount = criteriaMinCount; }

    public Integer getRescheduleCount() { return rescheduleCount != null ? rescheduleCount : 0; }
    public void setRescheduleCount(Integer rescheduleCount) { this.rescheduleCount = rescheduleCount; }

    public Date getAuditDate() { return auditDate != null ? auditDate : scheduleDate; }
    public void setAuditDate(Date auditDate) { this.auditDate = auditDate; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public List<AuditScheduleCriteria> getCriteriaList() { return criteriaList; }
    public void setCriteriaList(List<AuditScheduleCriteria> criteriaList) { this.criteriaList = criteriaList; }

    public Integer getTotalPoint() {
        if (totalPoint != null) return totalPoint;
        try {
            if (criteriaList != null && org.hibernate.Hibernate.isInitialized(criteriaList)) {
                return criteriaList.size();
            }
        } catch (Exception ignored) {}
        return 0;
    }
    public void setTotalPoint(Integer totalPoint) { this.totalPoint = totalPoint; }

    public boolean isHasAttendance() { return hasAttendance; }
    public void setHasAttendance(boolean hasAttendance) { this.hasAttendance = hasAttendance; }

    // Backward compatibility transient properties
    public String getDepartment() {
        if (departmentEntity != null) {
            return departmentEntity.getDepartmentName();
        }
        return department;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("departmentName")
    public String getDepartmentName() {
        return getDepartment();
    }

    public void setDepartment(String department) {
        this.department = department;
        if (department == null || department.trim().isEmpty()) {
            this.departmentId = null;
            return;
        }
        com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository repo =
            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository.class);
        if (repo != null) {
            repo.findByDepartmentNameIgnoreCase(department.trim()).ifPresent(d -> this.departmentId = d.getId());
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
        if (this.auditeeId != null) {
            return; // Skip lookup if ID is already set
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
        if (this.auditorId != null) {
            return; // Skip lookup if ID is already set
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
        if (this.ncrApprovedById != null) {
            return; // Skip lookup if ID is already set
        }
        String code = ncrApprovedBy.contains(" - ") ? ncrApprovedBy.split(" - ")[1].trim() : ncrApprovedBy.trim();
        com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository repo =
            com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository.class);
        if (repo != null) {
            repo.findByEmpCodeIgnoreCase(code).ifPresent(emp -> this.ncrApprovedById = emp.getId());
        }
    }

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

    // JSON properties for extra fields
    public String getAuditeeDetails() {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.node.ObjectNode node = mapper.createObjectNode();
            
            node.put("customerName", customerEntity != null ? customerEntity.getCustomerName() : "");
            node.put("contactName", contactName != null ? contactName : "");
            node.put("externalName", externalName != null ? externalName : "");
            node.put("externalEmailId", externalEmailId != null ? externalEmailId : "");
            node.put("externalMobileNo", externalMobileNo != null ? externalMobileNo : "");
            node.put("externalAuditorImage", externalAuditorImage != null ? externalAuditorImage : "");
            node.put("emailToCustomer", emailToCustomer != null ? emailToCustomer : "");
            node.put("fromEmailToCustomer", fromEmailToCustomer != null ? fromEmailToCustomer : "");
            node.put("subcontractorName", supplierEntity != null ? supplierEntity.getLedgerName() : "");
            node.put("supplierName", supplierEntity != null ? supplierEntity.getLedgerName() : "");
            node.put("processName", processEntity != null ? processEntity.getProcessName() : "");
            
            String coordName = "";
            if (coOrdinatorEntity != null) {
                coordName = coOrdinatorEntity.getEmployeeName();
                if (coordName == null || coordName.trim().isEmpty()) {
                    coordName = ((coOrdinatorEntity.getFirstName() != null ? coOrdinatorEntity.getFirstName() : "") + " " + (coOrdinatorEntity.getLastName() != null ? coOrdinatorEntity.getLastName() : "")).trim();
                }
                if (coOrdinatorEntity.getEmpCode() != null) {
                    coordName = coordName + " - " + coOrdinatorEntity.getEmpCode();
                }
            }
            node.put("coOrdinator", coordName);
            node.put("auditZone", auditZone != null ? auditZone : "");
            node.put("auditAreaDetail", auditAreaDetail != null ? auditAreaDetail : "");
            
            return mapper.writeValueAsString(node);
        } catch (Exception e) {
            return null;
        }
    }

    public void setAuditeeDetails(String details) {
        if (details == null || details.trim().isEmpty()) {
            return;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(details);
            
            if (node.has("contactName")) this.contactName = node.get("contactName").asText();
            if (node.has("externalName")) this.externalName = node.get("externalName").asText();
            if (node.has("externalEmailId")) this.externalEmailId = node.get("externalEmailId").asText();
            if (node.has("externalMobileNo")) this.externalMobileNo = node.get("externalMobileNo").asText();
            if (node.has("externalAuditorImage")) this.externalAuditorImage = node.get("externalAuditorImage").asText();
            if (node.has("emailToCustomer")) this.emailToCustomer = node.get("emailToCustomer").asText();
            if (node.has("fromEmailToCustomer")) this.fromEmailToCustomer = node.get("fromEmailToCustomer").asText();
            if (node.has("auditZone")) this.auditZone = node.get("auditZone").asText();
            if (node.has("auditAreaDetail")) this.auditAreaDetail = node.get("auditAreaDetail").asText();
            
            if (this.customerId == null && node.has("customerName")) {
                String cName = node.get("customerName").asText();
                if (cName != null && !cName.isEmpty()) {
                    com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository repo = 
                        com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository.class);
                    if (repo != null) {
                        repo.findByLedgerNameIgnoreCase(cName).ifPresent(c -> this.customerId = c.getId());
                    }
                }
            }
            
            if (this.supplierId == null) {
                String sName = null;
                if (node.has("supplierName")) sName = node.get("supplierName").asText();
                if ((sName == null || sName.isEmpty()) && node.has("subcontractorName")) sName = node.get("subcontractorName").asText();
                if (sName != null && !sName.isEmpty()) {
                    com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository repo = 
                        com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository.class);
                    if (repo != null) {
                        repo.findByLedgerNameIgnoreCase(sName).ifPresent(s -> this.supplierId = s.getId());
                    }
                }
            }
            
            if (this.processId == null && node.has("processName")) {
                String pName = node.get("processName").asText();
                if (pName != null && !pName.isEmpty()) {
                    com.autonoma.erp.modules.npd.product.repository.ProductProcessRepository repo = 
                        com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.npd.product.repository.ProductProcessRepository.class);
                    if (repo != null) {
                        repo.findByProcessNameIgnoreCase(pName).ifPresent(p -> this.processId = p.getId());
                    }
                }
            }
            
            if (this.coOrdinatorId == null && node.has("coOrdinator")) {
                String coord = node.get("coOrdinator").asText();
                if (coord != null && !coord.isEmpty()) {
                    String code = coord.contains(" - ") ? coord.split(" - ")[1].trim() : coord.trim();
                    com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository repo = 
                        com.autonoma.erp.util.SpringContext.getBean(com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository.class);
                    if (repo != null) {
                        repo.findByEmpCodeIgnoreCase(code).ifPresent(emp -> this.coOrdinatorId = emp.getId());
                    }
                }
            }
        } catch (Exception e) {
            // ignore
        }
    }

    public String getAuditorDetails() { return null; }
    public void setAuditorDetails(String details) {}
    public String getNcrApprovedByDetails() { return null; }
    public void setNcrApprovedByDetails(String details) {}

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
        if (scheduleNo != null) scheduleNo = scheduleNo.trim();
        if (status != null) status = status.trim();
        if (itemCode != null) itemCode = itemCode.trim();
        if (frequency != null) frequency = frequency.trim();
        if (weekDays != null) weekDays = weekDays.trim();
        if (repeatEveryUnit != null) repeatEveryUnit = repeatEveryUnit.trim();
        if (startTime != null) startTime = startTime.trim().toUpperCase();
        if (endTime != null) endTime = endTime.trim().toUpperCase();
    }
}

package com.autonoma.erp.modules.qms.audit.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "QMS_AUDIT_SCHEDULER_CONFIG")
@Data
@EqualsAndHashCode(callSuper = true)
public class AuditSchedulerConfig extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CONFIG_CODE", length = 50, unique = true, nullable = false)
    private String configCode;

    @Column(name = "CONFIG_NAME", length = 255, nullable = false)
    private String configName;

    @Column(name = "AUDIT_TYPE_ID")
    private Long auditTypeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUDIT_TYPE_ID", insertable = false, updatable = false)
    private AuditType auditTypeEntity;

    @Column(name = "DEPARTMENT_ID")
    private Long departmentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DEPARTMENT_ID", insertable = false, updatable = false)
    private Department departmentEntity;

    @Column(name = "AUDIT_AREA_ID")
    private Long auditAreaId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AUDIT_AREA_ID", insertable = false, updatable = false)
    private AuditArea auditAreaEntity;

    @Column(name = "FREQUENCY", length = 50, nullable = false)
    private String frequency;

    @Column(name = "REPEAT_EVERY_VALUE")
    private Integer repeatEveryValue;

    @Column(name = "REPEAT_EVERY_UNIT", length = 50)
    private String repeatEveryUnit;

    @Column(name = "WEEK_DAYS", length = 255)
    private String weekDays;

    @Column(name = "START_TIME", length = 50, nullable = false)
    private String startTime;

    @Column(name = "END_TIME", length = 50, nullable = false)
    private String endTime;

    @Column(name = "STATUS")
    private Boolean status;

    @Column(name = "CRITERIA_MIN_COUNT")
    private Integer criteriaMinCount;

    @Column(name = "HOLIDAY_STRATEGY", length = 50)
    private String holidayStrategy = "NEXT";

    @Column(name = "LEAVE_VALIDATION")
    private Boolean leaveValidation = true;

    @Column(name = "DUPLICATE_CHECK")
    private Boolean duplicateCheck = true;

    @Column(name = "PARENT_AUDIT_SCHEDULE_ID")
    private Long parentAuditScheduleId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getParentAuditScheduleId() { return parentAuditScheduleId; }
    public void setParentAuditScheduleId(Long parentAuditScheduleId) { this.parentAuditScheduleId = parentAuditScheduleId; }
    public String getConfigCode() { return configCode; }
    public void setConfigCode(String configCode) { this.configCode = configCode; }
    public String getConfigName() { return configName; }
    public void setConfigName(String configName) { this.configName = configName; }
    public Long getAuditTypeId() { return auditTypeId; }
    public void setAuditTypeId(Long auditTypeId) { this.auditTypeId = auditTypeId; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getAuditAreaId() { return auditAreaId; }
    public void setAuditAreaId(Long auditAreaId) { this.auditAreaId = auditAreaId; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public Integer getRepeatEveryValue() { return repeatEveryValue; }
    public void setRepeatEveryValue(Integer repeatEveryValue) { this.repeatEveryValue = repeatEveryValue; }
    public String getRepeatEveryUnit() { return repeatEveryUnit; }
    public void setRepeatEveryUnit(String repeatEveryUnit) { this.repeatEveryUnit = repeatEveryUnit; }
    public String getWeekDays() { return weekDays; }
    public void setWeekDays(String weekDays) { this.weekDays = weekDays; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public Boolean getStatus() { return status; }
    public void setStatus(Boolean status) { this.status = status; }
    public Integer getCriteriaMinCount() { return criteriaMinCount; }
    public void setCriteriaMinCount(Integer criteriaMinCount) { this.criteriaMinCount = criteriaMinCount; }
    public String getHolidayStrategy() { return holidayStrategy; }
    public void setHolidayStrategy(String holidayStrategy) { this.holidayStrategy = holidayStrategy; }
    public Boolean getLeaveValidation() { return leaveValidation; }
    public void setLeaveValidation(Boolean leaveValidation) { this.leaveValidation = leaveValidation; }
    public Boolean getDuplicateCheck() { return duplicateCheck; }
    public void setDuplicateCheck(Boolean duplicateCheck) { this.duplicateCheck = duplicateCheck; }
    public AuditType getAuditTypeEntity() { return auditTypeEntity; }
    public void setAuditTypeEntity(AuditType auditTypeEntity) { this.auditTypeEntity = auditTypeEntity; }
    public Department getDepartmentEntity() { return departmentEntity; }
    public void setDepartmentEntity(Department departmentEntity) { this.departmentEntity = departmentEntity; }
    public AuditArea getAuditAreaEntity() { return auditAreaEntity; }
    public void setAuditAreaEntity(AuditArea auditAreaEntity) { this.auditAreaEntity = auditAreaEntity; }
}

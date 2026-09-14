package com.autonoma.erp.modules.qms.meeting.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import com.autonoma.erp.modules.hr.orgstructure.entity.Department;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "QMS_MEETING_DEPARTMENT_MAPPING")
@Data
@lombok.EqualsAndHashCode(callSuper = true)
@lombok.ToString(callSuper = true)
@NoArgsConstructor
public class QmsMeetingDepartmentMapping extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SCHEDULE_ID", nullable = false)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private QmsMeetingSchedule schedule;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DEPARTMENT_ID", nullable = false)
    private Department department;

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public QmsMeetingSchedule getSchedule() { return schedule; }
    public void setSchedule(QmsMeetingSchedule schedule) { this.schedule = schedule; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
}

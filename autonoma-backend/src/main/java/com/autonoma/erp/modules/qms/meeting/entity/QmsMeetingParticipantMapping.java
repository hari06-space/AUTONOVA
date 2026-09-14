package com.autonoma.erp.modules.qms.meeting.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "QMS_MEETING_PARTICIPANT_MAPPING")
@Data
@lombok.EqualsAndHashCode(callSuper = true)
@lombok.ToString(callSuper = true)
@NoArgsConstructor
public class QmsMeetingParticipantMapping extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SCHEDULE_ID", nullable = false)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private QmsMeetingSchedule schedule;

    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", nullable = false)
    private EmployeeMaster employee;

    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "SECONDARY_EMPLOYEE_ID", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private EmployeeMaster secondaryEmployee;

    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "TERTIARY_EMPLOYEE_ID", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private EmployeeMaster tertiaryEmployee;

    public EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(EmployeeMaster employee) { this.employee = employee; }
    public EmployeeMaster getSecondaryEmployee() { return secondaryEmployee; }
    public void setSecondaryEmployee(EmployeeMaster secondaryEmployee) { this.secondaryEmployee = secondaryEmployee; }
    public EmployeeMaster getTertiaryEmployee() { return tertiaryEmployee; }
    public void setTertiaryEmployee(EmployeeMaster tertiaryEmployee) { this.tertiaryEmployee = tertiaryEmployee; }
    public QmsMeetingSchedule getSchedule() { return schedule; }
    public void setSchedule(QmsMeetingSchedule schedule) { this.schedule = schedule; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
}

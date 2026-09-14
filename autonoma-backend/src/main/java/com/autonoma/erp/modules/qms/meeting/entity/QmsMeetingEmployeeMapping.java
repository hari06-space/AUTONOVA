package com.autonoma.erp.modules.qms.meeting.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "QMS_MEETING_EMPLOYEE_MAPPING")
public class QmsMeetingEmployeeMapping extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEETING_ID", nullable = false)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private QmsMeetingMaster meeting;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "EMPLOYEE_ID", nullable = false)
    private com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster employee;

    public com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster getEmployee() {
        return employee;
    }

    public void setEmployee(com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster employee) {
        this.employee = employee;
    }

    public QmsMeetingMaster getMeeting() {
        return meeting;
    }

    public void setMeeting(QmsMeetingMaster meeting) {
        this.meeting = meeting;
    }
}

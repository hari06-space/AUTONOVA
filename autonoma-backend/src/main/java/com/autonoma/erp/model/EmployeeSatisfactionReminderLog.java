package com.autonoma.erp.model;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "HR_EMPLOYEE_SATISFACTION_REMINDER_LOG")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSatisfactionReminderLog extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EMPLOYEE_ID", nullable = false)
    private EmployeeMaster employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MAPPING_ID", nullable = false)
    private EmployeeSatisfactionMapping mapping;

    @Column(name = "REMINDER_NUMBER", nullable = false)
    private String reminderNumber;

    @Column(name = "REMINDER_DATE", nullable = false)
    private LocalDate reminderDate;

    @Column(name = "EMAIL_STATUS", nullable = false, length = 50)
    private String emailStatus; // Sent, Failed

    public Long getId() { return id; }
    public EmployeeMaster getEmployee() { return employee; }
    public void setEmployee(EmployeeMaster employee) { this.employee = employee; }
    public EmployeeSatisfactionMapping getMapping() { return mapping; }
    public void setMapping(EmployeeSatisfactionMapping mapping) { this.mapping = mapping; }
    public String getReminderNumber() { return reminderNumber; }
    public void setReminderNumber(String reminderNumber) { this.reminderNumber = reminderNumber; }
    public LocalDate getReminderDate() { return reminderDate; }
    public void setReminderDate(LocalDate reminderDate) { this.reminderDate = reminderDate; }
    public String getEmailStatus() { return emailStatus; }
    public void setEmailStatus(String emailStatus) { this.emailStatus = emailStatus; }
}

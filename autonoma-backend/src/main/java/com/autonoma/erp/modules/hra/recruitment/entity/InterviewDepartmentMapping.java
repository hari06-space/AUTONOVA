package com.autonoma.erp.modules.hra.recruitment.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "HR_INTERVIEW_DEPARTMENT_MAPPING")
@Getter
@Setter
public class InterviewDepartmentMapping extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "INTERVIEW_ID", insertable = false, updatable = false)
    private Long interviewId;

    @Column(name = "DEPARTMENT_ID", nullable = false)
    private Long departmentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "DEPARTMENT_ID", insertable = false, updatable = false)
    private Department department;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInterviewId() { return interviewId; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
}

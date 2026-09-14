package com.autonoma.erp.modules.hr.orgstructure.service;

import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.entity.DepartmentCategory;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public List<Department> getActiveDepartments() {
        return departmentRepository.findByStatus("Active");
    }

    public Optional<Department> getDepartmentById(Long id) {
        return departmentRepository.findById(id);
    }

    private void validateDepartmentCategory(Integer categoryId) {
        if (categoryId != null && !DepartmentCategory.isValid(categoryId)) {
            throw new IllegalArgumentException("Invalid Department Category ID. Allowed values are 1 (QMS), 2 (Human Resource), or 3 (Management).");
        }
    }

    public Department saveDepartment(Department department) {
        validateDepartmentCategory(department.getCategoryId());
        if (department.getCreatedBy() == null) {
            department.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        }
        return departmentRepository.save(department);
    }

    public Department updateDepartment(Long id, Department details) {
        Department existing = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + id));

        validateDepartmentCategory(details.getCategoryId());

        // Deep Sanitize: Replace non-breaking spaces and all types of whitespace with standard space
        String name = details.getDepartmentName() != null ? details.getDepartmentName() : "";
        String sanitizedName = name.replaceAll("\\s+", " ").trim();

        existing.setDepartmentName(sanitizedName);
        existing.setDepartmentNo(details.getDepartmentNo());
        existing.setNdaCertificate(details.getNdaCertificate());
        existing.setSequenceNo(details.getSequenceNo());
        existing.setStatus(details.getStatus());
        existing.setDepartmentMailId(details.getDepartmentMailId());
        existing.setCategoryId(details.getCategoryId());
        existing.setPrPrefix(details.getPrPrefix());

        return departmentRepository.save(existing);
    }

    public void deleteDepartment(Long id) {
        // Check if department is mapped in Meeting (QMS_MEETING_DEPARTMENT_MAPPING)
        Integer meetingCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM QMS_MEETING_DEPARTMENT_MAPPING WHERE DEPARTMENT_ID = ?",
                Integer.class, id);
        if (meetingCount != null && meetingCount > 0) {
            throw new IllegalArgumentException("Cannot delete department because it is mapped to a Meeting.");
        }

        // Check if department is mapped in Audit Schedule (QMS_AUDIT_SCHEDULE)
        Integer auditScheduleCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM QMS_AUDIT_SCHEDULE WHERE DEPARTMENT_ID = ?",
                Integer.class, id);
        if (auditScheduleCount != null && auditScheduleCount > 0) {
            throw new IllegalArgumentException("Cannot delete department because it is mapped to an Audit Schedule.");
        }

        // Check if department is mapped in Audit Criteria (QMS_AUDIT_DEPARTMENT)
        Integer auditDeptCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM QMS_AUDIT_DEPARTMENT WHERE DEPT_ID = ?",
                Integer.class, id);
        if (auditDeptCount != null && auditDeptCount > 0) {
            throw new IllegalArgumentException("Cannot delete department because it is mapped to an Audit Criteria.");
        }

        departmentRepository.deleteById(id);
    }

    public Optional<Department> getDepartmentByNo(String no) {
        return departmentRepository.findByDepartmentNo(no);
    }
}


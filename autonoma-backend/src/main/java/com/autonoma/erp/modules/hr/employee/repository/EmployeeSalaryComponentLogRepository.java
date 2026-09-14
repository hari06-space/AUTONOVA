package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeSalaryComponentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmployeeSalaryComponentLogRepository extends JpaRepository<EmployeeSalaryComponentLog, Long> {
    List<EmployeeSalaryComponentLog> findByEmployeeIdOrderByCreatedDateDesc(Long employeeId);
}

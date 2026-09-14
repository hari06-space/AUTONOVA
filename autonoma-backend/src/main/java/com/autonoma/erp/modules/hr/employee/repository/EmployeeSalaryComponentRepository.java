package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeSalaryComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface EmployeeSalaryComponentRepository extends JpaRepository<EmployeeSalaryComponent, Long> {
    List<EmployeeSalaryComponent> findByEmployeeId(Long employeeId);
    void deleteByEmployeeId(Long employeeId);

    @Query("SELECT DISTINCT e.employeeId FROM EmployeeSalaryComponent e WHERE e.amount > 0")
    List<Long> findEmployeeIdsWithSalary();
}

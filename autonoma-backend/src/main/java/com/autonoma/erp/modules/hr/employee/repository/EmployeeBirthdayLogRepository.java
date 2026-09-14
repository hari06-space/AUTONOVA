package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeBirthdayLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeBirthdayLogRepository extends JpaRepository<EmployeeBirthdayLog, Long> {
    boolean existsByEmployeeIdAndBirthdayYear(Long employeeId, Integer birthdayYear);
}

package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeDependent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployeeDependentRepository extends JpaRepository<EmployeeDependent, Long> {
    List<EmployeeDependent> findByEmployeeId(Long employeeId);
    void deleteByEmployeeId(Long employeeId);
    void deleteByEmployeeIdIn(List<Long> employeeIds);
}


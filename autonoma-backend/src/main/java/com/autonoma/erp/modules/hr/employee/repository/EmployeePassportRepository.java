package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeePassport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EmployeePassportRepository extends JpaRepository<EmployeePassport, Long> {
    Optional<EmployeePassport> findByEmployeeId(Long employeeId);
    void deleteByEmployeeId(Long employeeId);
    void deleteByEmployeeIdIn(java.util.Collection<Long> employeeIds);
}

package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeKyc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EmployeeKycRepository extends JpaRepository<EmployeeKyc, Long> {
    Optional<EmployeeKyc> findByEmployeeId(Long employeeId);
    void deleteByEmployeeId(Long employeeId);
}

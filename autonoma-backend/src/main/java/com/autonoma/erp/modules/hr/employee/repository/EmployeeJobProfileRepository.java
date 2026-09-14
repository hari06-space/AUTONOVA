package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeJobProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeJobProfileRepository extends JpaRepository<EmployeeJobProfile, Long> {
    Optional<EmployeeJobProfile> findByEmployeeId(Long employeeId);
    List<EmployeeJobProfile> findByEmployeeIdIn(Collection<Long> employeeIds);
    void deleteByEmployeeId(Long employeeId);
    void deleteByEmployeeIdIn(java.util.Collection<Long> employeeIds);
    Optional<EmployeeJobProfile> findByOfficeEmailIgnoreCase(String officeEmail);
}

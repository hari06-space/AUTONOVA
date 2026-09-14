package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeePersonalDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EmployeePersonalDetailRepository extends JpaRepository<EmployeePersonalDetail, Long> {
    Optional<EmployeePersonalDetail> findByEmployeeId(Long employeeId);
    Optional<EmployeePersonalDetail> findFirstByEmployeeId(Long employeeId);
    void deleteByEmployeeId(Long employeeId);
    void deleteByEmployeeIdIn(java.util.Collection<Long> employeeIds);
    java.util.List<EmployeePersonalDetail> findByEmployeeIdIn(java.util.Collection<Long> employeeIds);
    boolean existsByAadharNumber(String aadharNumber);
    boolean existsByAadharNumberAndEmployeeIdNot(String aadharNumber, Long employeeId);
    java.util.List<EmployeePersonalDetail> findByPersonalEmailIgnoreCase(String personalEmail);
}

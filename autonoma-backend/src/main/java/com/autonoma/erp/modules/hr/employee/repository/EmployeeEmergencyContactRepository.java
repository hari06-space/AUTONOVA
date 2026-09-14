package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeEmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployeeEmergencyContactRepository extends JpaRepository<EmployeeEmergencyContact, Long> {
    List<EmployeeEmergencyContact> findByEmployeeId(Long employeeId);
    void deleteByEmployeeId(Long employeeId);
    void deleteByEmployeeIdIn(List<Long> employeeIds);
}


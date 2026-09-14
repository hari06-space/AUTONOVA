package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeKycDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployeeKycDocumentRepository extends JpaRepository<EmployeeKycDocument, Long> {
    List<EmployeeKycDocument> findByEmployeeId(Long employeeId);
    List<EmployeeKycDocument> findByEmployeeIdIn(List<Long> employeeIds);
    void deleteByEmployeeId(Long employeeId);
    void deleteByEmployeeIdIn(List<Long> employeeIds);
}


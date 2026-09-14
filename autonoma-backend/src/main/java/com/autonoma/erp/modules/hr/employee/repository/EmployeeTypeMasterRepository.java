package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeTypeMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeTypeMasterRepository extends JpaRepository<EmployeeTypeMaster, Long> {
    EmployeeTypeMaster findByTypeNameIgnoreCase(String typeName);
}

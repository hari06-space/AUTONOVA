package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface HrPayrollStructureRepository extends JpaRepository<HrPayrollStructure, Long> {
    Optional<HrPayrollStructure> findByStructureCode(String structureCode);
    java.util.List<HrPayrollStructure> findByEmployeeTypeIdAndIsActiveTrueOrderByRowIdDesc(Long employeeTypeId);
}

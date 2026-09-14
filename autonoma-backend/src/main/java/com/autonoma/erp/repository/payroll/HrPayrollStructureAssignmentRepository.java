package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollStructureAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface HrPayrollStructureAssignmentRepository extends JpaRepository<HrPayrollStructureAssignment, Long> {
    List<HrPayrollStructureAssignment> findByIsActiveTrue();
    Optional<HrPayrollStructureAssignment> findByAssignmentTypeAndAssignToValueAndIsActiveTrue(String assignmentType, String assignToValue);
}

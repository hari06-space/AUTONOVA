package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollEmployeeSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface HrPayrollEmployeeSummaryRepository extends JpaRepository<HrPayrollEmployeeSummary, Long> {
    List<HrPayrollEmployeeSummary> findByPayrollRunId(Long payrollRunId);
    Optional<HrPayrollEmployeeSummary> findByPayrollRunIdAndEmpCode(Long payrollRunId, String empCode);
    void deleteByPayrollRunId(Long payrollRunId);
}

package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollEmployeeDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HrPayrollEmployeeDetailRepository extends JpaRepository<HrPayrollEmployeeDetail, Long> {
    List<HrPayrollEmployeeDetail> findByPayrollRunIdAndEmpId(Long payrollRunId, Long empId);
    void deleteByPayrollRunId(Long payrollRunId);
}

package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollProcessMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface HrPayrollProcessMasterRepository extends JpaRepository<HrPayrollProcessMaster, Long> {
    Optional<HrPayrollProcessMaster> findByPayrollYearAndPayrollMonthAndEmployeeId(Integer payrollYear, String payrollMonth, Long employeeId);
    List<HrPayrollProcessMaster> findByPayrollYearAndPayrollMonth(Integer payrollYear, String payrollMonth);
    void deleteByPayrollYearAndPayrollMonth(Integer payrollYear, String payrollMonth);
    
    // For listing uniquely processed periods
    // We can fetch all and group in service, or define a custom query:
    List<HrPayrollProcessMaster> findAllByOrderByPayrollYearDescPayrollMonthDesc();
}

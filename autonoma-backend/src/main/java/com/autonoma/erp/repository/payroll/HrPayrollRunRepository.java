package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface HrPayrollRunRepository extends JpaRepository<HrPayrollRun, Long> {
    Optional<HrPayrollRun> findByPayrollYearAndPayrollMonth(Integer payrollYear, String payrollMonth);
    List<HrPayrollRun> findAllByOrderByPayrollYearDescPayrollMonthDesc();
}

package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollProcessConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface HrPayrollProcessConfigRepository extends JpaRepository<HrPayrollProcessConfig, Long> {
    Optional<HrPayrollProcessConfig> findByPayrollYearAndPayrollMonth(Integer payrollYear, String payrollMonth);
    // Default standard sort
    List<HrPayrollProcessConfig> findAllByOrderByPayrollYearDescStartDateDesc();
}

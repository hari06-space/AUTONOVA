package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface HrPayrollAttendanceRepository extends JpaRepository<HrPayrollAttendance, Long> {
    Optional<HrPayrollAttendance> findByEmpCodeAndPayrollYearAndPayrollMonth(String empCode, Integer payrollYear, String payrollMonth);
    List<HrPayrollAttendance> findByPayrollYearAndPayrollMonth(Integer payrollYear, String payrollMonth);
}

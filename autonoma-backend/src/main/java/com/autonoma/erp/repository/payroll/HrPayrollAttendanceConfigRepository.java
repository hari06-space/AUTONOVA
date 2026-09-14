package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollAttendanceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface HrPayrollAttendanceConfigRepository extends JpaRepository<HrPayrollAttendanceConfig, Long> {
    Optional<HrPayrollAttendanceConfig> findFirstByIsActiveTrue();
}

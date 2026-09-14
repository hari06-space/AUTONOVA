package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollStatutory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface HrPayrollStatutoryRepository extends JpaRepository<HrPayrollStatutory, Long> {
    Optional<HrPayrollStatutory> findByConfigKey(String configKey);
}

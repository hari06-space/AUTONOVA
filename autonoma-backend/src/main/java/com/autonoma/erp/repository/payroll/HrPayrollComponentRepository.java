package com.autonoma.erp.repository.payroll;

import com.autonoma.erp.model.payroll.HrPayrollComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface HrPayrollComponentRepository extends JpaRepository<HrPayrollComponent, Long> {
    Optional<HrPayrollComponent> findByComponentCode(String componentCode);
    List<HrPayrollComponent> findByIsActiveTrueOrderBySequenceNoAsc();
}
